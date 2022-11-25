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


function firetailWrapper(next){
  firetailMiddleware = this;
  return (event,context)=> {

    return new Promise((resolve, reject)=>{

      const protocol = event.requestContext.http ? "http" : "https"

      const ip = event.requestContext.identity ? event.requestContext.identity.sourceIp
                                               : event.requestContext[protocol].sourceIp

      const req = genReq({
         method : event.httpMethod || event.requestContext.http.method,
    originalUrl : event.rawPath || event.resource,
           body : event.body,
        headers : event.headers,
         params : event.pathParameters || {},
          query : event.queryStringParameters || {},
          httpVersion:
          (event.requestContext.protocol || event.requestContext[protocol].protocol).split("/").pop(),
          protocol,
          hostname:event.headers.host,
          ip,
          lambdaEvent:event
      }),
        res = genRes();
      firetailMiddleware(req,res,()=>{
        let result = next(event,context)
        //  console.log("--->>>",typeof result,result)
        if( ! result.then){
          result = Promise.resolve(result)
        }
        result.then(val=>{
          res.json(JSON.parse(val.body))
        //  console.log(" --- ",res.__data)
          const payload = {...val,body:JSON.stringify(res.__data)}
        //  console.log(" -+- ",payload)
          setTimeout(()=>resolve(payload))
        })
      }) // END firetailMiddleware
    }) // END Promise
  }
} // END firetailWrapper
module.exports = firetailWrapper
