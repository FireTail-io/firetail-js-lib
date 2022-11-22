"use strict";

const data = require('./animals.json')
//console.log(require)
const firetailSetup = require("../../dist");

const firetailMiddleware = firetailSetup({
  dev:true,
  addApi: "./petstore.yaml",
  apiKey:"PS-02-107ee1a9-dd00-4de8-98e0-f477c1e12719-114c0d33-b422-42a0-a083-fea3168adc14"
})


function genReq(override={}) {
  const req = {
   method: 'GET',
   originalUrl:"/",
   params: {},
   query: {},
   get:(key)=>{
       //'Content-Type'
   }
 }

  const headers = {}

 Object.assign(req,override)

 req.headers = headers

 Object.assign(req.headers,override && override.headers)

   return req // END return
} // END req

function genRes(override) {
  const res = {
    setHeader:()=>{},
    removeHeader:()=>{},
   __data:undefined,
   statusCode:200,
   status:(statusCode)=>{
     res.statusCode=statusCode
     return res
   },
   end:()=>{
     return res
   },
   send:(x)=>{
     res.__data = x;
     return res
   },
   json:(x)=>{
     res.__data = x;
     return res
   }
 }
   return Object.assign(res,override)
} // END genRes


const firetailWrapper = next => (event,context)=> {
console.log("event",event)
  return new Promise((resolve, reject)=>{

    const req = genReq({
       method : event.requestContext.http.method,
  originalUrl : event.rawPath,
         body : event.body,
      headers : event.headers,
       params : event.pathParameters || {},
        query : event.queryStringParameters || {}
    }),
      res = genRes();
    firetailMiddleware(req,res,()=>{
      let result = next(event,context)
        console.log("--->>>",typeof result,result)
      if( ! result.then){
        result = Promise.resolve(result)
      }
      result.then(val=>{
        res.json(JSON.parse(val.body))
        console.log(" --- ",res.__data)
        const payload = {...val,body:JSON.stringify(res.__data)}
        console.log(" -+- ",payload)
        setTimeout(()=>resolve(payload))
      })
    }) // END firetailMiddleware
  }) // END Promise
} // END firetailWrapper


module.exports.pets = firetailWrapper((event,context) => {
  console.log()
  console.log("event",event)
console.log()
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
