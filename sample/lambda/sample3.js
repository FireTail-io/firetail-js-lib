"use strict";

const data = require('./animals.json')
const events = require('./sampleEvents.json')
//console.log(require)
const firetailSetup = require("@public.firetail.io/firetail-api");

const firetailWrapper = firetailSetup({
  lambda:true,
  addApi: "./petstore.yaml",
  securities:{
    key:({authorization})=>{
      if("key" !== authorization){
        throw new Error("Invalid token")
      }
      return true
    }
  }
})

const next = firetailWrapper((event) => {
  const statusCode = 200
  if(event.queryStringParameters
  && event.queryStringParameters.limit){
    return {
      statusCode,
      body: JSON.stringify(data.slice(0, req.query.limit)),
    };
  }
  return {
    statusCode,
    body: JSON.stringify(data),
  };
});

next(events["api Gateway Proxy V2"])
