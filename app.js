const express = require('express')
const firetailSetup = require("./firetail");
const app = express()
const port = 3001

const firetailOpts = {apiYaml:"./api.yaml"}
const firetailMiddleware = firetailSetup(firetailOpts)

app.use(firetailMiddleware)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/foo', (req, res) => {
  res.send('Hello World!')
})

app.get('/bar', (req, res) => {
  res.json(["a","b","c"])
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})