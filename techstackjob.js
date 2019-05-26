let Parser = require('rss-parser');
let parser = new Parser();

const url = require('url');
const http = require('http');



function strMapToObj(strMap) {
    let obj = Object.create(null);
    for (let [k, v] of strMap) {
        obj[k] = v;
    }
    return obj;
}



async function getStack(job) {

    const url = 'https://stackoverflow.com/jobs/feed?q=' + job + '&sort=p'

    let feed = await parser.parseURL(url);
    const items = []

    feed.items.forEach(item => {

        if (item.categories) {
            for (var i = 0; i < item.categories.length; i++) {
                items.push(item.categories[i])
            }
        }


    });

    const uniqueTokens = new Map();


    for (var i = 0; i < items.length; i++) {
        let token = items[i]

        if (!uniqueTokens.has(token)) {
            uniqueTokens.set(token, 0)
        }
        uniqueTokens.set(token, uniqueTokens.get(token) + 1)

    }

    const mostDemandingStack = new Map([...uniqueTokens].sort((a, b) => {
        return b[1] - a[1];
    }));

    return mostDemandingStack
}


const app = http.createServer(async (request, response) => {
    var query = url.parse(request.url, true).query;
    var tech;
    if (query.tech) {
        tech = query.tech
    } else {
        response.end()
        return
    }

    response.writeHead(200, { "Content-Type": "application/json" });

    var ja = await getStack(tech)

    response.write(JSON.stringify(strMapToObj(ja)))
    response.end();
});

app.listen(5000);


