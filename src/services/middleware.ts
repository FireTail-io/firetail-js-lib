
const args2Arr = require("../utils/args2Arr");
const matchUrl = require("../utils/match");
const before = require("./before");
const after = require("./after");
const security = require("./security");
const fs = require('fs')

//=====================================================
//========================================== middleware
//=====================================================

module.exports = function middleware(req, res, next) {

  //console.log(` -X- ${req.method}:${req.originalUrl}`)
  const {
    genMessage,
    yamlPathSt,
    apiSpecPr,
    operationsFn,
    dev,
    decodedJwt,
    securities
  } = this
  // .then(({paths})=>paths);

  const data = {
      yamlPathSt,
      verb: req.method.toLowerCase(),
      url: req.originalUrl.split("?")[0],
      resBody:false,
      reqBody:req.body,
      startedAt:new Date(),
      finishedAt:false,
      statusCode: res.statusCode,
      headers:req.headers,
      params: req.params,
      query:req.query,
      status:200
    }

    if(dev){
      if(data.url.startsWith("/firetail")){
        if("/firetail/apis.json" === data.url){
            apiSpecPr.then(api=>res.json(api.paths))
                     .catch(err=>{
                       console.error(err)
                       res.status(500).send(err.message||err)
                     })
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
          path.resolve(__dirname,"../src/ui/",filePath),
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
      firetail:"default",
      status: err.status || 500,
      message:genMessage("default"),
      error:undefined
    }

    if(err.firetail && ! err.message){
      err.message = genMessage(err.firetail,err.val)
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

      data.status = errContent.status || defaultErrorVal.status)
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
     end  : res.end.bind(res),
     send : res.send.bind(res),
     json : res.json.bind(res)
  } // END stashFnCalls

//+++++++++++++++++++++++++++++++++++++ hi-jack res fn
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  res.send = function() {
    const args = args2Arr(arguments)
    data.resBody = args[0]
    return stashFnCalls.send.apply(res, args)
  }
  res.json = function() {
    const args = args2Arr(arguments)
    data.resBody = args[0]
    return stashFnCalls.json.apply(res, args)
  }
  res.end = function() {
    const args = args2Arr(arguments)
    data.finishedAt = new Date()



  // Convert both dates to milliseconds
  var date1_ms = data.startedAt.getTime();
  var date2_ms = data.finishedAt.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;
  //console.log(`[${data.status}] ${req.method}:${req.originalUrl} - ${difference_ms/1000}sec`)
    try {
    // TODO: may need to buffer the responce..
    // as we can override the responce with out
    // warning about app sending data down the wire
        if (specificScama) {
            after(specificScama, data, genMessage
        }
        return stashFnCalls.end.apply(res, args)
    } catch(err) {
        errorHandler(err);
    }
  } // END res.end

//++++++++++++++++++++++++++++++++++ get ref for scama
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  apiSpecPr.then(({paths,components}) => {

      const matchFound = matchUrl(data.url,Object.keys(paths))

      let scamaForEndPoint = null
      if(matchFound){
        scamaForEndPoint = paths[matchFound.path]
        // We need to set the URL params as Express only adds them later
        Object.assign(data.params,matchFound.params)
      }/*console.log()
      console.log(paths)
      console.log()*/

      // Store specificScama as its needed in the "äfter" fn
      specificScama = before({scamaForEndPoint, data, genMessage})

      security({
        scamaVerb:specificScama,
        operationsFn,
        securitySchemes:components.securitySchemes,
        headers:data.headers,
        decodedJwt,
        req,
        genMessage
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
