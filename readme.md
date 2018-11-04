# A Map of the Crypto Currency Developer Community

## Workflow
1. The script orgs.js is crawling coinmarketcap for Crypto Currencies and their github repositories. It stores the results in `data/orgs.csv`.
2. The script `index.js` queries the github api for the stargazers of each project and writes them into a file `data.data.csv`
3. `data/data.csv` can be imported and visualized in gephi. My sample is in `all_data.gephi`. 


## Recreate network
1. Make sure you have a recent version of node.js and gephi installed
2. Install Node.js dependencies
```bash
npm i
```
3. Delete `data/data.csv` and `data/orgs.csv`. My data.csv and org.csv files are included in the repo. The scripts are only adding missing organizations to the files, which means that if you want to run the scripts yourself you need to delete the files in the data directory first. No update logic of any sorts is implemented.
```bash
rm data/*
```
4. Fetch Crypto Currencies and their repos from Coinmarketcap. The script can be restarted without loosing progress and uses exponential backoffs if ratelimited.
```bash
node orgs.js
```
5. Fetch Stargazers from Github. You need to authenticate with your github credentials. The script can be restarted without loosing progress and should be fairly robust against missing/wrong repos.
```bash
export GITHUB_USER=... 
export GITHUB_PASSWORD=...

node index.js
```
Your resulting files are in the data directory. `data/data.csv` can be imported and visualized in gephi. 