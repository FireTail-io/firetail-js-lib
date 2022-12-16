import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

type AwsRes = {
  statusCode:Number,
  body:String,
  headers?:Object
}

type Req = {
   method?: string,
   originalUrl?: string,
   params?: object,
   query?: object,
   headers?:object,
   get?:(key:string)=>string
}// END type Req

type Event = {
  requestContext:{
    http:boolean
  }
}

function genReq(override:Req={}) {
  const req:Req = {
   method: 'GET',
   originalUrl:"/",
   params: {},
   query: {},
   headers:{},
   get:(key)=>{
       //'Content-Type'
       return ""
   }
 }

  const headers = {}

 Object.assign(req,override)

 req.headers = headers

 Object.assign(req.headers,override && override.headers)

   return req // END return
} // END req

function genRes(override) {
  console.log(`override:${typeof override}`,override)
  const res = {
    setHeader:()=>{},
    removeHeader:()=>{},
   __data:undefined,
   statusCode:200,
   status:(statusCode)=>{
     res.statusCode=statusCode
     return res
   },
   end:()=>res,
   send:(x:string)=>{
     res.__data = res.__data || x;
     return res
   },
   json:(x:object)=>{
     res.__data = x;
     return res
   }
 }
 // middleware references then but Lamdba never calls them..
 // but Jest will not see they a re every run
 res.end();
 res.send("");
 res.json({});
 res.__data = undefined;
   return Object.assign(res,override)
} // END genRes


type ProxyHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;


function firetailwrapper(next:Function){

  const firetailMiddleware:Function = this;
  const instance:ProxyHandler = (event:Object,context:Object):Promise<AwsRes>=> {
    return new Promise((resolve:Function, reject:Function):void=>{

      const protocol = event.requestContext.http ? "http" : "https"

      const ip: string = event.requestContext.identity ?
                         event.requestContext.identity.sourceIp
                       : event.requestContext[protocol].sourceIp

      const req = genReq({
         method : event.httpMethod || event.requestContext.http.method,
    originalUrl : event.rawPath    || event.resource,
           body : event.body,
        headers : event.headers,
         params : event.pathParameters        || {},
          query : event.queryStringParameters || {},
          httpVersion:
          (event.requestContext.protocol || event.requestContext[protocol].protocol).split("/").pop(),
          protocol,
          hostname:event.headers.host,
          ip,
          lambdaEvent:event
      }),
      res = genRes({
        end:()=>{
          if(callHasErrored)/* istanbul ignore next */
          resolve({
            statusCode:res.statusCode,
            body:JSON.stringify(res.__data)
          })
            //setTimeout(()=>resolve(res.__data))
        }
      });

      let callHasErrored: boolean = true
      firetailMiddleware(req,res,()=>{
        let result = next(event,context)
        if( ! result.then){
          result = Promise.resolve(result)
        }
        result.then((val:{statusCode:number,body:string,headers?:[string]})=>{
          callHasErrored = false
       if(val){

         if(val.headers){
           Object.keys(val.headers)
                 .forEach(key=>{
                   res.setHeader(key,val.headers[key])
                 })
         } // END if
         if(val.statusCode){
           res.status(val.statusCode)
         }
       }
       try{
         const bodyObj = JSON.parse(val.body)
          res.json(bodyObj)
        }catch(err){
          res.send(val.body)
        }
          const payload = {
            ...val,
            body:"string" === typeof res.__data ? res.__data
                                                : JSON.stringify(res.__data)
          }
          setTimeout(()=>resolve(payload))
        })
      }) // END firetailMiddleware
    }) // END Promise
  }
} // END firetailwrapper
module.exports = firetailwrapper
