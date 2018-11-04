var cheerio = require('cheerio'); // Basically jQuery for node.js
const rp = require("request-promise")

const fs = require('fs');

const filename = 'orgs.csv'
let writeStream = fs.createWriteStream(filename, {'flags': 'a'});


async function run() {
    const currencies = await getCurrencies()
    const lastOrg = getLastOrg()
    let foundLastOrg = false
    for (currency of currencies) {
        // go through list to find orgs which were already added
        if (!foundLastOrg) {
            if (currency.includes(lastOrg)) {
                foundLastOrg = true
            }
            console.log("omitting "+currency)
            continue;
        }
        const link = await getGithubLink(currency)
        if (link == undefined) continue
        const coin = currency.split('/')[5]
        const org = link.split('/')[3]
        const repo = link.split('/')[4] || ''
        writeStream.write(coin+","+org+","+repo+"\n")
        console.log(coin)
    }
    writeStream.end();  
    /* )*/
}
async function getGithubLink(url, backoff) {
    try {
        var options = {
            uri: url,
            transform: function (body) {
                return cheerio.load(body);
            }
        };
        const $ = await rp(options)
        const hits = []
        $('a[href]').each(function (i, elem) {
            const url = $(this).attr('href')
            if (url.includes('github.com')) {
                hits.push(url)
            }
        })
        if (hits.length == 0) return undefined
        return hits.reduce((a,b) => a.length < b.length? a:b)
    }
    catch (e) {
        backoff = (backoff || 1000) * 2 + Math.floor(Math.random() * 500)
        console.error(e.getMessage, backoff)
        await new Promise(res => setTimeout(res, backoff))
        return getGithubLink(url, backoff)
    }
    
}

async function getCurrencies() {
    var options = {
        uri: 'https://coinmarketcap.com/all/views/all/',
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    const $ = await rp(options)
    const orgs = []
    $('a.currency-name-container[href]').each(function(i, elem) {
        orgs.push('https://coinmarketcap.com/'+$(this).attr('href'));
      })
    return orgs
}

function getLastOrg() {
    const orgs = fs.readFileSync(filename, 'utf-8').split('\n')
    return orgs[orgs.length -2].split(',')[0]
}
run()