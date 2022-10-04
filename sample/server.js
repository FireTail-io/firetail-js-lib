const express = require('express')
const scribbles = require('scribbles')
global.console = scribbles
const firetailSetup = require("../dist");
const app = express()
const port = 3001

//====== MOVE TO TEST

function foo(req, res){
  res.send('FOO')
}
function cat(req, res){
  console.log(req.params)
  res.send('CAT '+ JSON.stringify(req.params))
}

const firetailOpts = {
  apiYaml:"./api.yaml",
  dev:true,
  operations:{
    "app.foo":foo,
    app : {
      cat_id:cat
    }
  }
}

// ========

const firetailMiddleware = firetailSetup(firetailOpts)

app.use(firetailMiddleware)

app.get('/', (req, res) => {
  res.send("FireTail sample")
})

app.get('/bar', (req, res) => {
  //res.set('content-type','application/json')
  res.contentType('application/json');
  res.json(["a","b","c"])
})

app.get('/bar2', (req, res) => {
  //res.set('content-type','application/json')
  res.contentType('application/json');
  res.json(["a","b","c"])
})

app.get('/bar/:tab', (req, res) => {
  console.log(req.params)
  console.log(req.query)
  //res.set('content-type','application/json')
  res.contentType('application/json');
  res.json(["a","b","c"])
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
