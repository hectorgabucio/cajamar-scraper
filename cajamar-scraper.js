"use strict";

const crypto = require('crypto')
const puppeteer = require('puppeteer');

const separator = '|||'



function scrapLine(line) {

    let parts = line.split(separator)
    if (parts.length !== 3) {
        return {}
    }

    let result = {}
    result.date = parts[0]
    result.concept = parts[1]
    result.amount = parts[2]

    let hash = crypto.createHash('sha256').update(JSON.stringify(result)).digest("hex")
    result.id = hash
    return result
}


function waitForFrame(page, frameName) {
    let fulfill;
    const promise = new Promise(x => fulfill = x);
    checkFrame();
    return promise;

    function checkFrame() {
        const frame = page.frames().find(f => f.name() === frameName);
        if (frame)
            fulfill(frame);
        else
            page.once('frameattached', checkFrame);
    }
}



async function getResult() {
    let options = {}

    if (process.env.ENVIRONMENT && process.env.ENVIRONMENT === 'local') {
        options = {
            headless: false, args: [
                '--start-maximized', // you can also use '--start-fullscreen'
                '--no-sandbox',
                '--disable-setuid-sandbox',
                "--proxy-server='direct://'", '--proxy-bypass-list=*'
            ], slowMo: 150
        }
    } else {
        options = {
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                "--proxy-server='direct://'", '--proxy-bypass-list=*'
            ]
        }
    }

    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();



    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        }
        else {
            req.continue();
        }
    })





    await page.goto('https://www.cajamar.es/es/comun/acceder-a-banca-electronica-reintentar/');
    await page.setViewport({ width: 1920, height: 1080 })
    await page.type("#COD_NEW3", process.env.USER)
    await page.type("#PASS_NEW3", process.env.PASS)
    await page.click(".lnkAceptar")
    await page.waitFor("#principaln1_cuentas")
    await page.click("#principaln1_cuentas")
    await page.click("a[data-id=n3_movimientos]")
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const frame = await waitForFrame(page, 'contenido')
    await frame.waitForSelector("button")



    await frame.evaluate(() => {
        document.querySelector("span.z-spinner input[type=text]").value = "0"
    })


    await frame.type("span.z-spinner input[type=text]", "180")

    await frame.focus("button")

    await frame.waitFor(1000)

    await frame.click("button")



    const frame2 = await waitForFrame(page, 'contenido')
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



    let resFinal = movements.split("\n").map((x) => {
        return scrapLine(x)
    })

    return resFinal

}




module.exports = {
    getResult: getResult
}