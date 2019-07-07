// const crypto = require("crypto");
import {
    createCipheriv,
    createDecipheriv,
    generateKeyPair,
    privateDecrypt,
    publicEncrypt,
    randomBytes,
} from 'crypto'
import { generate } from 'generate-password'
import { promisify } from 'util'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16 // For AES, this is always 16

const genRSAKeys = promisify(generateKeyPair)

export function randomPass() {
    return generate({
        length: 32,
        numbers: true,
    })
}
export function encrypt(text, pass) {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, pass, iv)
    let encrypted = cipher.update(text)

    encrypted = Buffer.concat([encrypted, cipher.final()])

    return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text, pass) {
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift(), 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = createDecipheriv(ALGORITHM, pass, iv)
    let decrypted = decipher.update(encryptedText)

    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString()
}

export function encryptStringWithRsaPublicKey(toEncrypt, publicKey) {
    const buffer = Buffer.from(toEncrypt)
    const encrypted = publicEncrypt(publicKey, buffer)
    return encrypted.toString('base64')
}

export function decryptStringWithRsaPrivateKey(toDecrypt, privateKey) {
    const buffer = Buffer.from(toDecrypt, 'base64')

    const decrypted = privateDecrypt(
        { passphrase: process.env.PASSPHRASE, key: privateKey },
        buffer
    )

    // const decrypted = privateDecrypt(privateKey, buffer)
    return decrypted.toString('utf8')
}

export function getRSAKeys() {
    return genRSAKeys('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: process.env.PASSPHRASE,
        },
    })
}
