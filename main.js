"use strict";
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
var express = require('express');
var app = express();


var port = process.env.PORT || 3000;



const separator = '|||'


function errorHandler(err, req, res, next) {
    console.log(console.log(err))
    res.status(500).send({success: false})
}

const wrapAsync = (fn) => {
    return (req, res, next) => {
        const fnReturn = fn(req, res, next);
        return Promise.resolve(fnReturn).catch(next);
    }
};



function scrapLine(line) {

    let parts = line.split(separator)
    if (parts.length !== 3) {
        return {}
    }

    let result = {}
    result.date = parts[0]
    result.concept = parts[1]
    result.amount = parts[2]

    return result
}


app.get('/', wrapAsync(async function example(req, res) {
    let result = await getCajamar()


    let resFinal = result.split("\n").map((x) => {
        return scrapLine(x)
    })

    res.status(200).send(resFinal);
}));

app.listen(port, function () {
    console.log('Example app listening on port 3000!');
});



process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', reason.stack || reason)
    process.exit(1)
})




function loadEnv() {

    const result = dotenv.config()
    if (result.error) {
        throw result.error
    }
}


async function getCajamar() {




    loadEnv()

    const options = {
        'args': [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    }

    /*
    const options = {
        headless: false, args: [
            '--start-maximized' // you can also use '--start-fullscreen'
        ], slowMo: 150
    }*/

    const browser = await puppeteer.launch(options
    );
    const page = await browser.newPage();
    await page.goto('https://www.cajamar.es/es/comun/acceder-a-banca-electronica-reintentar/');
    await page.setViewport({ width: 1920, height: 1080 })
    await page.type("#COD_NEW3", process.env.USER)
    await page.type("#PASS_NEW3", process.env.PASS)
    await page.click(".lnkAceptar")
    await page.waitFor("#principaln1_cuentas")
    await page.click("#principaln1_cuentas")
    await page.click("a[data-id=n3_movimientos]")



    page.on('console', msg => console.log('PAGE LOG:', msg.text()));


    const frame = await page.frames().find(f => f.name() === 'contenido');
    //console.log(frame.name())
    await frame.waitForSelector("button")



    await frame.evaluate(() => {
        document.querySelector("span.z-spinner input[type=text]").value = "0"
    })


    await frame.type("span.z-spinner input[type=text]", "180")

    await frame.focus("button")

    await frame.waitFor(1000)

    await frame.click("button")



    const frame2 = await page.frames().find(f => f.name() === 'contenido');
    await frame2.waitForSelector(".z-column-content")

    await frame2.click(".z-column-content")
    await frame2.waitFor(".z-icon-caret-up")
    await frame2.click(".z-column-content")
    await frame2.waitFor(".z-icon-caret-down")

    const movements = await frame2.evaluate(() => {


        let result = []
        const numberCols = 3
        let elements = Array.from(document.querySelectorAll(".z-cell[data-title='Concepto'],.z-cell[data-title='Fecha'],.z-cell[data-title='Importe']"))

        elements.forEach((element, index) => {
            i = index + 1

            //console.log("INDEX " + i, "ELEMENT " + element.innerText + " MODULUS " + (i%(numberCols)))

            if (i % (numberCols) === 0) {
                result += element.innerText + "\n"
            } else {
                result += element.innerText + "|||"
            }
        })

        return result

    })

    await browser.close();

    return movements
}


app.use(errorHandler);