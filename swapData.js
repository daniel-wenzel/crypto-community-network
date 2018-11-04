const fs = require('fs')
const lines = fs.readFileSync('./data.csv', 'utf-8')
const stream = fs.createWriteStream('./data2.csv')
lines.split('\n').forEach(l => {
    const parts = l.split(',')
    if (parts.length > 1)
    stream.write(parts[1]+","+parts[0]+'\n')
})
stream.close()