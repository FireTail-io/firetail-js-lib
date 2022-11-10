
const data = require('./animals.json')

//=====================================================
//============================================= Imports
//=====================================================
/*
const stream = new WritableStream({
  start(controller) {

  },
  write(chunk, controller) {
console.log(chunk+"")
  },
  close(controller) {

  },
  abort(reason) {

  }
}, {
  highWaterMark: 3,
  size: () => 1
});

//stream.stdout = stream
const {Console} = console

const con = new Console(stream)
con.log({a:4});
*/

const express = require('express')
const scribbles = require('scribbles')
const parseXmlString = require('xml2json');
global.console = scribbles
const app = express()
const port = 3001

app.use(
  express.raw({
    inflate: true,
    limit: '50mb',
    type: () => true, // this matches all content types
  })
);
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

const firetailSetup = require("../dist");//require("firetail")

const firetailOpts = {
  addApi: "./petstore.yaml",
  overRideError:(err)=>{
    console.error("overRideError");
    return err
  },
  securities:{
    jwt:({authorization})=>{
      console.log(" ------ JWT",authorization)
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
  }, // END operations
  customBodyDecoders:{
    'application/xml': body => parseXmlString.toJson(body,{object:true}).Pet
  }
} // END firetailOpts
//console.log(firetailOpts)

//=====================================================
//======================================== Add Firetail
//=====================================================

app.use(firetailSetup(firetailOpts))

//=====================================================
//========================================= Your server
//=====================================================
app.get('/', (req, res) => {
  res.send("FireTail sample")
})

app.delete('/pets/:petId', (req, res) => {

  if(! data.map(({id})=>`${id}`)
           .includes(req.params.petId)){
    res.status(400)
       .json({
         message:`No pet with an ID of "${req.params.petId}" was found`
       })
    return;
  }

  const copy = [...data]
  let removedItem = null

  //empty
  copy.forEach(()=>{
    data.pop()
  })

  //rebuild
  copy.forEach(item=>{
    if(item.id !== +req.params.petId){
      data.push(item)
    } else {
      removedItem = item
    }
  })

  //console.log(res)
//  console.log(Object.keys(res))
  res.status(201).json(removedItem)
})


//=====================================================
//======================================== Server start
//=====================================================

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
