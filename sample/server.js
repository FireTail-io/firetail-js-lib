
const data = require('./animals.json')

//=====================================================
//============================================= Imports
//=====================================================

const express = require('express')
const scribbles = require('scribbles')
global.console = scribbles
const firetailSetup = require("../dist");//require("firetail")
const app = express()
const port = 3001

app.use((req, res, next) =>{
  console.log(req.originalUrl);
  next()
})

//=====================================================
//================================= Operation Functions
//=====================================================

function listPets(req, res){
  if(req.query.limit){
    res.json(data.slice(0, req.query.limit))
  }else {
    res.json(data)
  }
} // END listPets

//=====================================================
//=================================== Firetail settings
//=====================================================

const firetailOpts = {
  overRideError:(err)=>{
    console.error("overRideError");
    return err
  },
  securities:{
    jwt:({authorization})=>{
      const token = authorization.split(" ").pop().replace(/['"]+/g, '')
      const tokenDecodablePart = token.split('.')[1];
      const decoded = Buffer.from(tokenDecodablePart, 'base64').toString();

        // ... CHECK JWT
      //  if( (Date.now()/1000) > decoded.exp){
        //  throw new Error("You token is too old")
      //  }



        // throw


      return JSON.parse(decoded)
    }
  },
  // override Express'es controller based on "operationId"
  operations:{
    // FLAT name
    listPets,
    // Nested
  /*  app : {
      cat_id:cat
    }*/
  } // END operations
} // END firetailOpts
//console.log(firetailOpts)
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

app.delete('/pets/{petId}', (req, res) => {
  //res.set('content-type','application/json')
  res.contentType('application/json');
  res.json(["a","b","c"])
})
/*
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
})*/

//=====================================================
//======================================== Server start
//=====================================================

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
