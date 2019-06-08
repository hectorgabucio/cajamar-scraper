'use strict'

import dotenv from 'dotenv'
import express from 'express'
import basicAuth from 'express-basic-auth'
const app = express()

// const cajamar = require("./cajamar-scraper");
import * as cajamar from './cajamar-scraper'
const port = process.env.PORT || 3000

loadEnv()

function getUnauthorizedResponse(req) {
    return req.auth ? 'Credentials rejected' : 'No credentials provided'
}

app.use(
    basicAuth({
        users: {
            user: process.env.BASIC_PASS,
        },
        unauthorizedResponse: getUnauthorizedResponse,
    })
)

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

app.listen(port, () => console.log('Example app listening on port ' + port))

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
