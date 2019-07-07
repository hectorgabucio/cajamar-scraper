'use strict'

import dotenv from 'dotenv'
import express from 'express'
import basicAuth from 'express-basic-auth'
import * as http from 'http'
import { Server } from 'ws'
const app = express()
const server = http.createServer(app)

// const cajamar = require("./cajamar-scraper");
import * as cajamar from './cajamar-scraper'
import {
    decrypt,
    decryptStringWithRsaPrivateKey,
    encrypt,
    encryptStringWithRsaPublicKey,
    getRSAKeys,
    randomPass,
} from './security'
const port = process.env.PORT || 3000

loadEnv()

function getUnauthorizedResponse(req) {
    return req.auth ? 'Credentials rejected' : 'No credentials provided'
}

/*
app.use(
    basicAuth({
        users: {
            user: process.env.BASIC_PASS,
        },
        unauthorizedResponse: getUnauthorizedResponse,
    })
)
*/

function errorHandler(err, req, res, next) {
    console.log(console.log(err))
    res.status(500).send({ success: false })
}

const wrapAsync = fn => {
    return (req, res, next) => {
        const fnReturn = fn(req, res, next)
        return Promise.resolve(fnReturn).catch(next)
    }
}

/*
app.get(
    '/',
    wrapAsync(async function example(req, res) {
        const hrstart = process.hrtime()
        const result = await cajamar.getResult()
        const hrend = process.hrtime(hrstart)

        console.info(
            'Execution time (hr): %ds %dms',
            hrend[0],
            hrend[1] / 1000000
        )

        res.status(200).send(result)
    })
)
*/

server.listen(port, () => console.log('Example app listening on port ' + port))

const wss = new Server({ server })

interface Client {
    ws: any
    isAlive: boolean
}

const clients: Client[] = []

function noop() {}

function heartbeat() {
    clients.find(c => c.ws === this).isAlive = true
}

wss.on('connection', async ws => {
    console.log('Client connected')

    /*
    const pass = randomPass()
    const text = 'HOLA JAJAJAJAJ XD DUDE'

    const aesenc = encrypt(text, pass)
    console.log(decrypt(aesenc, pass))

    const { publicKey, privateKey } = await getRSAKeys()

    const encrypted = encryptStringWithRsaPublicKey('HOLA JODIO', publicKey)
    console.log('enc', encrypted)

    console.log(decryptStringWithRsaPrivateKey(encrypted, privateKey))
*/
    const client: Client = { ws, isAlive: true }
    clients.push(client)

    ws.on('pong', heartbeat)
    ws.on('close', () => console.log('Client disconnected'))

    try {
        const hrstart = process.hrtime()
        const result = await cajamar.getResult(ws)
        const hrend = process.hrtime(hrstart)

        console.info(
            'Execution time (hr): %ds %dms',
            hrend[0],
            hrend[1] / 1000000
        )
        ws.send(JSON.stringify(result))
    } catch (err) {
        ws.send('Error')
        console.log(err)
    } finally {
        ws.close()
    }

    // res.status(200).send(result)
})

const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        const client = clients.find(c => c.ws === ws)

        if (client.isAlive === false) {
            return ws.terminate()
        }

        client.isAlive = false
        ws.ping(noop)
    })
}, 30000)

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', reason)
    process.exit(1)
})

function loadEnv() {
    const result = dotenv.config()
    if (result.error) {
        // throw result.error
        console.log('no env file, using config vars')
    }
}

app.use(errorHandler)
