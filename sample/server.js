
//=====================================================
//============================================= Imports
//=====================================================

const express = require('express')
const scribbles = require('scribbles')
global.console = scribbles
const firetailSetup = require("../dist");//require("firetail")
const app = express()
const port = 3001

//=====================================================
//================================= Operation Functions
//=====================================================

function foo(req, res){
  res.send('FOO')
}
function cat(req, res){
  console.log(req.params)
  res.send('CAT '+ JSON.stringify(req.params))
}

//=====================================================
//=================================== Firetail settings
//=====================================================

const firetailOpts = {
  // you can use absolute or relative path and I will work it out.
  apiYaml:"./api.yaml",//"app-spec.yaml",//
  // Api Doc UI + Development friendly messages
  dev:true,
  // override Express'es controller based on "operationId"
  operations:{
    // FLAT name
    "app.foo":foo,
    // Nested
    app : {
      cat_id:cat,
      jwt_verifier:(x)=>console.log("jwt_verifier",x)
    }
  } // END operations
} // END firetailOpts
console.log(firetailOpts)
//=====================================================
//===================================== Create Firetail
//=====================================================

const firetailMiddleware = firetailSetup(firetailOpts)

//=====================================================
//======================================== Add Firetail
//=====================================================

app.use(firetailMiddleware)

//=====================================================
//========================================= Your server
//=====================================================
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
  res.json(["1","2","3"])
})

app.get('/bar/:tab', (req, res) => {
  console.log(req.params)
  console.log(req.query)
  //res.set('content-type','application/json')
  res.contentType('application/json');
  res.json(["a","b","c"])
})

//=====================================================
//======================================== Server start
//=====================================================

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
