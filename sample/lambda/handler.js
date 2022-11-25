"use strict";

const data = require('./animals.json')
// TODO: publish to NPM so we can test on AWS
const firetailSetup = require("../../dist");

const firetailWrapper = firetailSetup({

  // This is all you need!!
  lambda:true,

  addApi: "./petstore.yaml",
})

module.exports.pets = firetailWrapper((event,context) => {

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
