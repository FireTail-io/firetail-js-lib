
const args2Arr = require("../utils/args2Arr");
const matchUrl = require("../utils/match");
const security = require("./security");
const before = require("./before");
const after = require("./after");
const fs = require('fs');
const path = require('path');
const logFT = require("./log");


function areWeTestingWithJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}

//=====================================================
//========================================== middleware
//=====================================================

module.exports = function middleware(req, res, next) {

    //res.setHeader("Server", "firetail-API");
    //res.removeHeader("X-Powered-By");

  //console.log(` -X- ${req.method}:${req.originalUrl}`,req.headers)
  const {
    genMessage,
    yamlPathSt,
    apiSpecPr,
    apiSpec,
    operationsFn,
    dev,
    customBodyDecoders,
    decodedJwt,
    authCallbacks,
    apiKey,
    lambda
  } = this
  // .then(({paths})=>paths);

  const data = {
      apiKey,
      dev,
      yamlPathSt,
      customBodyDecoders,
      verb: req.method.toLowerCase(),
      url: req.originalUrl.split("?")[0],
      resBody:false,
      reqBody:Buffer.isBuffer(req.body) ? req.body.toString('utf8')
                                        : "string" === typeof req.body ? req.body : null,
      startedAt:new Date(),
      finishedAt:false,
      statusCode: 200,//res.statusCode,
      headers:req.headers,
      params: req.params,
      query:req.query,
      lambda
    //  status:200
    } // END data
    data.headers.accept = data.headers.accept || "*/*"

    data._reqBody = data.reqBody

  /*  if(dev){
      if(data.url.startsWith("/firetail")){
        if("/firetail/apis.json" === data.url){
            apiSpecPr.then(api=>res.json(api.paths))
                     .catch(err=>{
                       console.error(err)
                       res.status(500).send(err.message||err)
                     })// END catch
            return;
        }*//*
        let filePath = "index.html"
        switch(data.url){
          case "/firetail/client.js":
            filePath = "client.js"
            break;
          case "/firetail/apis.json":
            apiSpecPr.then(res.json())
                     .catch(err=>res.status(500).json(err))
            return;
            break;
        }*/
      /*  const filePath = "/firetail/client.js" === data.url ? "client.js"
                                                            : "index.html"
        fs.readFile(
          path.resolve(__dirname,"../../src/ui/",filePath),
          "utf8",
          function(err,page){
            if(err){
              data.status = 500
              res.status(500).send(err)
            }else{
              res.send(page)
            }
          }) // END fs.readFile
        return
      }
    }*/ // END if dev

  let specificScama;

//++++++++++++++++++++++++++++++++++++++ error handler
//++++++++++++++++++++++++++++++++++++++++++++++++++++

let errorHandlerCalled = false
  const errorHandler = err => {

if( !areWeTestingWithJest()){
  console.error(err,new Error().stack)

}

    if(errorHandlerCalled){
      console.error("errorHandler was already called")
      return
    }

    errorHandlerCalled = true;

    const isUI = (req.get('Referrer')||"").endsWith("/firetail")

    let defaultErrorVal = {
    //  firetail:"default",
      type:req.originalUrl,
      status: err.status || 500,
      title:genMessage("default"),
      error:undefined
    }
//console.log(typeof defaultErrorVal,defaultErrorVal)
    if(err.message){
      defaultErrorVal.title = err.message
//  console.log(typeof defaultErrorVal,defaultErrorVal)
    } else if(err.firetail){
      defaultErrorVal.title = genMessage(err.firetail, err.val)
      err.message = defaultErrorVal.title
//  console.log(typeof defaultErrorVal,defaultErrorVal)
    }

  //  console.log(typeof defaultErrorVal,defaultErrorVal)
    if(dev && isUI){
      defaultErrorVal.error = {
        message:err.message,
        stack:err.stack
      }
    } else if(dev){
      defaultErrorVal.title = err.message || err
    }

    const errContent = "function" === typeof overRideError ? overRideError(Object.assign({},defaultErrorVal,err))
                                                           : defaultErrorVal
 //console.log(typeof errContent,errContent)
 //console.log(typeof err,err)
 //console.log(typeof defaultErrorVal,defaultErrorVal)
                    // Because overRideError may not have a status
    data.status = errContent.status || defaultErrorVal.status
    //  console.log(data)
    //  console.log(errContent.status, defaultErrorVal.status)
    res.status(data.status)
    /*if(){

    }
    res.header('Content-Type', 'application/json');*/
    if(Array.isArray(err.headers)){
      err.headers.forEach(([key,val])=>res.setHeader(key, val))
    }
//console.log(errContent)
if("object" === typeof errContent){
  res.setHeader("content-type","application/json")
  data.resBody = errContent
  res.json(errContent)
}else{
  res.send(errContent)
}
/*
    res.end()
    if(!areWeTestingWithJest()){
      logFT(req, res, { ...data, resBody:errContent, statusCode:data.status },specificScama)
    }*/
 } // END errorHandler

//+++++++++++++++++++++++++++++++++++++++++++ stash fn
//++++++++++++++++++++++++++++++++++++++++++++++++++++
  const stashFnCalls = {
           status : res.status.bind(res),
        setHeader : res.setHeader.bind(res),
     removeHeader : res.removeHeader.bind(res),
             send : res.send.bind(res),
             json : res.json.bind(res),
              end : res.end.bind(res)
  } // END stashFnCalls

//+++++++++++++++++++++++++++++++++++++ hi-jack res fn
//++++++++++++++++++++++++++++++++++++++++++++++++++++
  const headers = [], removeFromHead = []
  res.setHeader = (key,val)=>{
//console.log("res.setHeader",{key,val})
    headers.push({key,val})
    return res
  };
  res.removeHeader = (key)=>{
//console.log("res.removeHeader",key)
    removeFromHead.push(key)
    return res
  };

  res.status = function() {
    const args = args2Arr(arguments)
    //  console.log("res.status",args)
    data.statusCode = args[0]
    return res//stashFnCalls.status.apply(res, args)
  }
  res.send = function() {
    //if(data.resBody){  return;  }
    const args = args2Arr(arguments)
    //  console.log("res.send",args)
    data.resBody = data.resBody || args[0]
    if(!data.finishedAt){
      end()
    }
    else {
      return stashFnCalls.send.apply(res, args)
    }
    return res
  }
  res.json = function() {
    const args = args2Arr(arguments)
    //  console.log("res.json",args)
    data.resBody = args[0]
    end()
    return res//stashFnCalls.json.apply(res, args)
  }/*
  res.end = function() {

  }*/

  let end = function () {
    end = ()=> {}//console.log("END was already CALLeD")
    res.end = ()=>{}
    const args = args2Arr(arguments)
    //  console.log("res.end",args)
    data.finishedAt = new Date()

    removeFromHead.forEach(key=>{
      stashFnCalls.removeHeader(key);
    })
    headers.forEach(({key,val})=>{
      stashFnCalls.setHeader(key,val);
    })

    data.resHeaders = headers

  // Convert both dates to milliseconds
  //const date1_ms = data.startedAt.getTime();
  //const date2_ms = data.finishedAt.getTime();

  // Calculate the difference in milliseconds
//  const difference_ms = date2_ms - date1_ms;
    try {

      if(data.statusCode){
        stashFnCalls.status.call(res,data.statusCode)
      }
      //res.send = stashFnCalls.send.bind(res)
//console.log(data)
      if(data.resBody){
        //if("object" === typeof data.resBody){
      //  console.log(specificScama)
          if (specificScama) {
          //  console.log(data.resBody)
            const cleanedBody = after(specificScama, data)
            data.resBody = cleanedBody || data.resBody
          //    console.log(data.resBody)
//console.log(cleanedBody)
            stashFnCalls.json.call(res,data.resBody)
          }else {
            stashFnCalls.json.call(res,data.resBody)
          }
    /*    }else{
          stashFnCalls.send.call(res,data.resBody)
        }*/
      } // END if data.resBody
 stashFnCalls.end.call(res)
 stashFnCalls.end = ()=>{}
    // TODO: may need to buffer the responce..
    // as we can override the responce with out
    // warning about app sending data down the wire

    if(data.lambda || !areWeTestingWithJest()){
      logFT(req, res, data, specificScama)
    }

    } catch(err) {
        errorHandler(err);
    }
  } // END res.end

//++++++++++++++++++++++++++++++++++ get ref for scama
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  apiSpecPr.then(({paths,components}) => {

      const matchFound = matchUrl(data.url,Object.keys(paths))
    //  console.log("matchFound",matchFound)
//console.log("data.url",data.url)
//console.log("Object.keys(paths)",Object.keys(paths))
      let scamaForEndPoint = null
      if(matchFound){
        scamaForEndPoint = paths[matchFound.path]
        // We need to set the URL params as Express only adds them later
        Object.assign(data.params,matchFound.params)
      }
//console.log(" ====== CALLING BEFORE !!")
      // Store specificScama as its needed in the "äfter" fn
      //try{
//console.log({matchFound,scamaForEndPoint})
        specificScama = before({scamaForEndPoint, data, genMessage})

        if(!specificScama) {
          throw {
              firetail:"urlNotInYaml",
              status:404,
              val:data
          }
        }

        specificScama.resource = matchFound ? matchFound.path : ""
    //  }catch(err){
    //    console.error(err)
    //  }
//console.log(1)
      if(data.reqBody){
        req.body = data.reqBody
      }
//console.log(2)
      //req.params = data.params
    //  req.query  = data.query

    const secName = security.getSecName(specificScama,components.securitySchemes)
    return security({
        scamaVerb:specificScama,
        operationsFn,
        securitySchemes:components.securitySchemes,
        headers:data.headers,
        decodedJwt,
        req,
        genMessage,
        authCallbacks,
        secName
      }).then( result =>{
        req[secName] = result
        /*    if(scamaForEndPoint){
            const { verb } = data
            const scamaVerb = scamaForEndPoint[verb]
            if(scamaVerb){*/
              const { operationId } = specificScama//scamaForEndPoint[data.verb]//scamaVerb
              if(operationId){
                if(operationsFn[operationId]){
                  req.params = req.params || {}
                  // TODO: should this type conversion be extended to all the non-operationsFn ?
                  Object.assign(req.params,data.params)
                  Object.assign(req.query,data.query)
                  next = ()=>operationsFn[operationId](req, res, next)
                } else {
                  //console.log(`No operationId match for ${operationId}`)
                }
              } // END if operationId
        /*    } // END if scamaVerb
        } */// END if scamaForEndPoint
      //  console.log("should NOT be here!")
        next()

      })
  }) // END apiSpecPr.then
  .catch(err=> {
    // If specificScama is set then before was fine
    // and this error is coming from the app and not our problem
    /*if (specificScama) {
      throw err
    }*/
    //console.error(err,new Error().stack)
    errorHandler(err)
  }) // END catch

} // END middleware
