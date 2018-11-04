const octokit = require('@octokit/rest')()
const filename = './data/data.csv'
const fs = require("fs")

const GITHUB_USER = process.env.GITHUB_USER
const GITHUB_PASSWORD = process.env.GITHUB_PASSWORD

if (!GITHUB_USER || !GITHUB_PASSWORD) {
    console.error('Please export your github username and password using export GITHUB_USER=... and export GITHUB_PASSWORD=...')
    process.exit(1)
}

octokit.authenticate({
    type: 'basic',
    username: GITHUB_USER,
    password: GITHUB_PASSWORD
  })


let writeStream = fs.createWriteStream(filename, {'flags': 'a'});
let numRequests = -1


async function getRepos(owner) {
    try {
        const { data, headers, status } = await octokit.repos.getForUser({
            username: owner, 
            type: 'owner', 
            sort: 'pushed',
            per_page: 100
        })
        const res = data.filter(d => d.stargazers_count > 5).map(d => {
            return {
                stargazers_count: d.stargazers_count,
                name: d.name
            }
        })
        return res
    }
   catch (e) {
       console.error(e)
       return []
   }
}

async function getStargazersForRepo(owner, repo) {
    try {
        let page = 0;
        let numResults = 0;
        const allGazers = new Set()
        do {
            await rateLimitCheck()
            console.log(`... Getting Stargazers for ${owner}/${repo} page ${page}`)
            const { data, headers, status } = await octokit.activity.getStargazersForRepo({
                owner,
                repo,
                per_page: 100,
                page
            })
            page++
            numResults = data.length
            data.forEach(d => allGazers.add(d.login))
        }
        while (numResults == 100);
        return allGazers
    }
    catch (e) {
        console.error(e)
        return new Set()
    }
    
}
// checks rate limit every 100 requests and sleeps if rate limit is out
async function rateLimitCheck() {
    numRequests ++;
    if (numRequests % 100 !== 0) {
        return
    }
    const rateLimit = (await octokit.misc.getRateLimit({})).data.rate
    if (rateLimit.remaining < 150) {
        const timeToSleep = (rateLimit.reset + 5) * 1000 - Date.now()
        const timeToSleepInMinutes = Math.floor((timeToSleep / 1000 / 60) * 100) / 100
        console.log(`Out of requests! Sleeping for ${timeToSleepInMinutes} minutes`)
        await new Promise((res) => setTimeout(res, timeToSleep))
    }
    else {
        console.log(`${rateLimit.remaining} requests remaining. Continue`)
    }
}

function getParsedCoins() {
    const network = fs.readFileSync(filename, 'utf-8')
    const parsedCoins = new Set()

    network.split('\n').forEach(p => {
        parsedCoins.add(p.split(',')[1])
    })
    return parsedCoins
}

async function run() {
    const parsedCoins = getParsedCoins()

    const coinStrings = fs.readFileSync('./orgs.csv', 'utf-8')
    const coins = coinStrings.split('\n')

    for (coinString of coins) {
        const parts = coinString.split(',')
        const coin = {
            name: parts[0],
            org: parts[1],
            repo: parts[2]
        }
        if (parsedCoins.has(coin.name)) {
            console.log("Omitting "+coin.name)
            continue
        }
        console.log("PARSING "+coin.name)
        
        await parseCoin(coin)
    }
}

async function parseCoin(coin) {
    let repos = []
    if (!coin.repo) {
        repos = (await getRepos(coin.org)).map(r => r.name)
    }
    else {
        repos = [coin.repo]
    }
    for (repo of repos) {
        const stargazers = await getStargazersForRepo(coin.org, repo)
        for (stargazer of stargazers) {
            writeStream.write(stargazer+','+coin.name+"\n")
        }
    }
}
run()