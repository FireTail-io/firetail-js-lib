"use strict";

const data = require('./animals.json')
const events = require('./sampleEvents.json')
//console.log(require)
const firetailSetup = require("@public.firetail.io/firetail-api");

const firetailWrapper = firetailSetup({lambda:true,addApi: "./petstore.yaml"})

const next = firetailWrapper((event) => {
  const statusCode = 200
  if(event.queryStringParameters
  && event.queryStringParameters.limit){
    return {
      statusCode,
      body: JSON.stringify(data.slice(0, event.queryStringParameters.limit)),
    };
  }
  return {
    statusCode,
    body: JSON.stringify(data),
  };
});

next(events["lambda function url"]).then(console.log)
