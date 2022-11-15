
const data = require('./animals.json')

const Color = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",

  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m"
}
//console.log(Color)
   /*
console.log(`\x1b[38;2;230;159;0m${"orange"}\x1b[0m`);
console.log(`\x1b[38;2;86;180;233m${"skyBlue"}\x1b[0m`);
console.log(`\x1b[38;2;0;158;115m${"bluishGreen"}\x1b[0m`);
console.log(`\x1b[38;2;240;228;66m${"Yellow"}\x1b[0m`);
console.log(`\x1b[38;2;0;114;178m${"Blue"}\x1b[0m`);
console.log(`\x1b[38;2;213;94;0m${"Vermillon"}\x1b[0m`);
console.log(`\x1b[38;2;204;121;167m${"reddishPurple"}\x1b[0m`);*/

//console.log(`\x1b[31m${"str"}\x1b[39m`);
/*
  for (let i = 0; i < 256; ++i)
    console.log(`\x1b[38;5;${i}mhe ${i}m llo\x1b[0m`)
  for (let i = 0; i < 256; ++i)
    console.log(`\x1b[48;5;${i}mhe ${i}m llo\x1b[0m`)
*/
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
  //  console.error("overRideError");
    return err
  },
  authCallbacks:{
    jwt:({authorization})=>{
      //console.log(" ------ JWT",authorization)
      const token = authorization.split(" ").pop().replace(/['"]+/g, '')
      //  console.log(" --- ",token)
      const tokenDecodablePart = token.split('.').pop();
      //console.log(" --- ",tokenDecodablePart)

      const decoded = Buffer.from(tokenDecodablePart, 'base64').toString();
      //console.log(" --- ",decoded)

        // ... CHECK JWT
      //  if( (Date.now()/1000) > decoded.exp){
        //  throw new Error("You token is too old")
      //  }



        // throw


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
      if("oauth2" !== authorization){
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
//console.log("delete('/pets/:petId'",req.jwt)
//console.log(req.params.petId,data.map(({id})=>`${id}`))
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
  //console.log(copy)
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

  //console.log(data)
  //console.log(removedItem)
  //console.log(res)
//  console.log(Object.keys(res))
  res.status(202)
  res.json(removedItem)
})


//=====================================================
//======================================== Server start
//=====================================================

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
