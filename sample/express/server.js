
const data = require('./animals.json')

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

const firetailSetup = require("@public.firetail.io/firetail-api");

const firetailOpts = {
  addApi: "./petstore.yaml",
  overRideError:(err)=>{
    return err
  },
  authCallbacks:{
    jwt:({authorization})=>{
      const token = authorization.split(" ").pop().replace(/['"]+/g, '')
      const tokenDecodablePart = token.split('.').pop();
      const decoded = Buffer.from(tokenDecodablePart, 'base64').toString();
      return JSON.parse(decoded)
    },
    key:({authorization})=>{
      if("key" !== authorization){
        throw new Error("Invalid token")
      }
      return true
    },
    basic:({user, pass})=>{
      if (user == 'admin' && pass == 'password') {
        return true // authorized
      } else {
        throw new Error('You are not authenticated!');
      }
    },
    oauth2:({authorization,scopes},headers)=>{
      if("RsT5OjbzRn430zqMLgV3Ia" !== authorization){
        throw new Error("Invalid token")
      }
      const result = {
        scopes:Object.keys(scopes)
      }

      result.scopes.forEach(scope=>{
        result[scope] = scope
      })

      return result
    },
  },
  // override Express'es controller based on "operationId"
  operations:{
    listPets,
  }, // END operations
  customBodyDecoders:{
    'application/xml': body => parseXmlString.toJson(body,{object:true}).Pet
  }
} // END firetailOpts

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
         type:req.originalUrl,
         title:`No pet with an ID of "${req.params.petId}" was found`,
         status:400
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

  res.status(202)
  res.json(removedItem)
}) // END app.delete '/pets/:petId'


//=====================================================
//======================================== Server start
//=====================================================

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
