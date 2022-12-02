"use strict";
const data = require('./animals.json')
const scribbles = require("scribbles");
scribbles.config({ mode:"prod" })
const firetailSetup = require("@public.firetail.io/firetail-api");

const firetailWrapper = firetailSetup({ addApi: "./petstore.yaml" })

module.exports.pets = firetailWrapper((event,context) => {
  scribbles.log(event)
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
  //  headers:[] /// look into headers setting content type
  };
});
