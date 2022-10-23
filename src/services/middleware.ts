
const args2Arr = require("../utils/args2Arr");
const matchUrl = require("../utils/match");
const security = require("./security");
const before = require("./before");
const after = require("./after");
const fs = require('fs');
const path = require('path');

//=====================================================
//========================================== middleware
//=====================================================

module.exports = function middleware(req, res, next) {

  //console.log(` -X- ${req.method}:${req.originalUrl}`)
  const {
    genMessage,
    yamlPathSt,
    apiSpecPr,
    apiSpec,
    operationsFn,
    dev,
    decodedJwt,
    securities
  } = this
  // .then(({paths})=>paths);

  const data = {
      dev,
      yamlPathSt,
      verb: req.method.toLowerCase(),
      url: req.originalUrl.split("?")[0],
      resBody:false,
      reqBody:Buffer.isBuffer(req.body) ? req.body.toString('utf8')
                                        : null,
      startedAt:new Date(),
      finishedAt:false,
      statusCode: 200,//res.statusCode,
      headers:req.headers,
      params: req.params,
      query:req.query,
    //  status:200
    } // END data

    if(dev){
      if(data.url.startsWith("/firetail")){
        if("/firetail/apis.json" === data.url){
            apiSpecPr.then(api=>res.json(api.paths))
                     .catch(err=>{
                       console.error(err)
                       res.status(500).send(err.message||err)
                     })// END catch
            return;
        }/*
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
        const filePath = "/firetail/client.js" === data.url ? "client.js"
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
    } // END if dev

  let specificScama;

//++++++++++++++++++++++++++++++++++++++ error handler
//++++++++++++++++++++++++++++++++++++++++++++++++++++

let errorHandlerCalled = false
  const errorHandler = err => {

    console.error(err)

    if(errorHandlerCalled){
      console.error("errorHandler was already called")
      return
    }

    errorHandlerCalled = true;

    const isUI = (req.get('Referrer')||"").endsWith("/firetail")

    let defaultErrorVal = {
    //  firetail:"default",
      status: err.status || 500,
      message:genMessage("default"),
      error:undefined
    }

    if(err.message){
      defaultErrorVal.message = err.message
    } else if(err.firetail){
      defaultErrorVal.message = genMessage(err.firetail, err.val)
      err.message = defaultErrorVal.message
    }

    if(dev && isUI){
      defaultErrorVal.error = {
        message:err.message,
        stack:err.stack
      }
    } else if(dev){
      defaultErrorVal.message = err.message || err
    }

    const errContent = "function" === typeof overRideError ? overRideError(err)
                                                           : defaultErrorVal

      data.status = errContent.status || defaultErrorVal.status
    //  console.log(data)
    //  console.log(errContent.status, defaultErrorVal.status)
    res.status(errContent.status || defaultErrorVal.status)

    stashFnCalls["object" === typeof errContent ? "json"
                                                : "send"](errContent)
    stashFnCalls.end()
  } // END errorHandler

//+++++++++++++++++++++++++++++++++++++++++++ stash fn
//++++++++++++++++++++++++++++++++++++++++++++++++++++
  const stashFnCalls = {
   status : res.status.bind(res),
     end  : res.end.bind(res),
     send : res.send.bind(res),
     json : res.json.bind(res)
  } // END stashFnCalls

//+++++++++++++++++++++++++++++++++++++ hi-jack res fn
//++++++++++++++++++++++++++++++++++++++++++++++++++++

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
    //end()
  //  return res
    return stashFnCalls.send.apply(res, args)
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
    end = ()=> console.log("END was already CALLeD")
    //const args = args2Arr(arguments)
    //  console.log("res.end",args)
    data.finishedAt = new Date()



  // Convert both dates to milliseconds
  const date1_ms = data.startedAt.getTime();
  const date2_ms = data.finishedAt.getTime();

  // Calculate the difference in milliseconds
  const difference_ms = date2_ms - date1_ms;
    try {

      if(data.statusCode){
        stashFnCalls.status.call(res,data.statusCode)
      }
      //res.send = stashFnCalls.send.bind(res)
      if(data.resBody){
        if("object" === typeof data.resBody){
          if (specificScama) {
      //    console.log(data.resBody)
            const cleanedBody = after(specificScama, data)
      //      console.log(cleanedBody)
            stashFnCalls.json.call(res,cleanedBody)
          }else {
            stashFnCalls.json.call(res,data.resBody)
          }
        }else{
          stashFnCalls.send.call(res,data.resBody)
        }
      } // END if data.resBody

    // TODO: may need to buffer the responce..
    // as we can override the responce with out
    // warning about app sending data down the wire

    console.log(`[${data.statusCode}] ${req.method}:${req.originalUrl} - ${difference_ms/1000}sec`)
        return stashFnCalls.end.call(res)
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
      specificScama = before({scamaForEndPoint, data, genMessage})

      if(data.reqBody){
        req.body = data.reqBody
      }

      //req.params = data.params
    //  req.query  = data.query

      security({
        scamaVerb:specificScama,
        operationsFn,
        securitySchemes:components.securitySchemes,
        headers:data.headers,
        decodedJwt,
        req,
        genMessage,
        securities
      })
  /*    if(scamaForEndPoint){
          const { verb } = data
          const scamaVerb = scamaForEndPoint[verb]
          //console.log("scamaVerb",scamaVerb)
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
                console.log(`No operationId match for ${operationId}`)
              }
            } // END if operationId
      /*    } // END if scamaVerb
      } */// END if scamaForEndPoint
    next()
  }) // END apiSpecPr.then
  .catch(err=> {
    // If specificScama is set then before was fine
    // and this error is coming from the app and not our problem
    /*if (specificScama) {
      throw err
    }*/
    errorHandler(err)
  }) // END catch

} // END middleware
