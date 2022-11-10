var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var args2Arr = require("../utils/args2Arr");
var matchUrl = require("../utils/match");
var security = require("./security");
var before = require("./before");
var after = require("./after");
var fs = require('fs');
var path = require('path');
var logFT = require("./log");
function areWeTestingWithJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}
//=====================================================
//========================================== middleware
//=====================================================
module.exports = function middleware(req, res, next) {
    res.setHeader("Server", "firetail-API");
    res.removeHeader("X-Powered-By");
    //console.log(` -X- ${req.method}:${req.originalUrl}`,req.headers)
    var _a = this, genMessage = _a.genMessage, yamlPathSt = _a.yamlPathSt, apiSpecPr = _a.apiSpecPr, apiSpec = _a.apiSpec, operationsFn = _a.operationsFn, dev = _a.dev, customBodyDecoders = _a.customBodyDecoders, decodedJwt = _a.decodedJwt, securities = _a.securities, apiKey = _a.apiKey;
    // .then(({paths})=>paths);
    var data = {
        apiKey: apiKey,
        dev: dev,
        yamlPathSt: yamlPathSt,
        customBodyDecoders: customBodyDecoders,
        verb: req.method.toLowerCase(),
        url: req.originalUrl.split("?")[0],
        resBody: false,
        reqBody: Buffer.isBuffer(req.body) ? req.body.toString('utf8')
            : "string" === typeof req.body ? req.body : null,
        startedAt: new Date(),
        finishedAt: false,
        statusCode: 200,
        headers: req.headers,
        params: req.params,
        query: req.query,
        //  status:200
    }; // END data
    data._reqBody = data.reqBody;
    /*  if(dev){
        if(data.url.startsWith("/firetail")){
          if("/firetail/apis.json" === data.url){
              apiSpecPr.then(api=>res.json(api.paths))
                       .catch(err=>{
                         console.error(err)
                         res.status(500).send(err.message||err)
                       })// END catch
              return;
          }*/ /*
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
    var specificScama;
    //++++++++++++++++++++++++++++++++++++++ error handler
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var errorHandlerCalled = false;
    var errorHandler = function (err) {
        if (!areWeTestingWithJest())
            console.error(err);
        if (errorHandlerCalled) {
            console.error("errorHandler was already called");
            return;
        }
        errorHandlerCalled = true;
        var isUI = (req.get('Referrer') || "").endsWith("/firetail");
        var defaultErrorVal = {
            //  firetail:"default",
            type: req.originalUrl,
            status: err.status || 500,
            title: genMessage("default"),
            error: undefined
        };
        if (err.message) {
            defaultErrorVal.title = err.message;
        }
        else if (err.firetail) {
            defaultErrorVal.title = genMessage(err.firetail, err.val);
            err.message = defaultErrorVal.title;
        }
        if (dev && isUI) {
            defaultErrorVal.error = {
                message: err.message,
                stack: err.stack
            };
        }
        else if (dev) {
            defaultErrorVal.title = err.message || err;
        }
        var errContent = "function" === typeof overRideError ? overRideError(err)
            : defaultErrorVal;
        // Because overRideError may not have a status
        data.status = errContent.status || defaultErrorVal.status;
        //  console.log(data)
        //  console.log(errContent.status, defaultErrorVal.status)
        stashFnCalls.status(data.status);
        /*if(){
    
        }
        stashFnCalls.header('Content-Type', 'application/json');*/
        stashFnCalls["object" === typeof errContent ? "json"
            : "send"](errContent);
        stashFnCalls.end();
        if (!areWeTestingWithJest()) {
            logFT(req, res, __assign(__assign({}, data), { resBody: errContent, statusCode: data.status }), specificScama);
        }
    }; // END errorHandler
    //+++++++++++++++++++++++++++++++++++++++++++ stash fn
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var stashFnCalls = {
        status: res.status.bind(res),
        setHeader: res.setHeader.bind(res),
        removeHeader: res.removeHeader.bind(res),
        send: res.send.bind(res),
        json: res.json.bind(res),
        end: res.end.bind(res)
    }; // END stashFnCalls
    //+++++++++++++++++++++++++++++++++++++ hi-jack res fn
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var headers = [], removeFromHead = [];
    res.setHeader = function (key, val) {
        //console.log("res.setHeader",{key,val})
        headers.push({ key: key, val: val });
        return res;
    };
    res.removeHeader = function (key) {
        //console.log("res.removeHeader",key)
        removeFromHead.push(key);
        return res;
    };
    res.status = function () {
        var args = args2Arr(arguments);
        //  console.log("res.status",args)
        data.statusCode = args[0];
        return res; //stashFnCalls.status.apply(res, args)
    };
    res.send = function () {
        //if(data.resBody){  return;  }
        var args = args2Arr(arguments);
        //  console.log("res.send",args)
        data.resBody = data.resBody || args[0];
        if (!data.finishedAt) {
            end();
        }
        else {
            return stashFnCalls.send.apply(res, args);
        }
        return res;
    };
    res.json = function () {
        var args = args2Arr(arguments);
        //  console.log("res.json",args)
        data.resBody = args[0];
        end();
        return res; //stashFnCalls.json.apply(res, args)
    }; /*
    res.end = function() {
  
    }*/
    var end = function () {
        end = function () { return console.log("END was already CALLeD"); };
        var args = args2Arr(arguments);
        //  console.log("res.end",args)
        data.finishedAt = new Date();
        removeFromHead.forEach(function (key) {
            stashFnCalls.removeHeader(key);
        });
        headers.forEach(function (_a) {
            var key = _a.key, val = _a.val;
            stashFnCalls.setHeader(key, val);
        });
        data.resHeaders = headers;
        // Convert both dates to milliseconds
        //const date1_ms = data.startedAt.getTime();
        //const date2_ms = data.finishedAt.getTime();
        // Calculate the difference in milliseconds
        //  const difference_ms = date2_ms - date1_ms;
        try {
            if (data.statusCode) {
                stashFnCalls.status.call(res, data.statusCode);
            }
            //res.send = stashFnCalls.send.bind(res)
            //console.log(data.resBody)
            if (data.resBody) {
                //if("object" === typeof data.resBody){
                //    console.log(specificScama)
                if (specificScama) {
                    //  console.log(data.resBody)
                    var cleanedBody = after(specificScama, data);
                    data.resBody = cleanedBody || data.resBody;
                    //  console.log(data.resBody)
                    //console.log(cleanedBody)
                    stashFnCalls.json.call(res, data.resBody);
                }
                else {
                    stashFnCalls.json.call(res, data.resBody);
                }
                /*    }else{
                      stashFnCalls.send.call(res,data.resBody)
                    }*/
            } // END if data.resBody
            // TODO: may need to buffer the responce..
            // as we can override the responce with out
            // warning about app sending data down the wire
            if (!areWeTestingWithJest()) {
                logFT(req, res, data, specificScama);
            }
            return stashFnCalls.end.call(res);
        }
        catch (err) {
            errorHandler(err);
        }
    }; // END res.end
    //++++++++++++++++++++++++++++++++++ get ref for scama
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    apiSpecPr.then(function (_a) {
        var paths = _a.paths, components = _a.components;
        var matchFound = matchUrl(data.url, Object.keys(paths));
        //  console.log("matchFound",matchFound)
        //console.log("data.url",data.url)
        //console.log("Object.keys(paths)",Object.keys(paths))
        var scamaForEndPoint = null;
        if (matchFound) {
            scamaForEndPoint = paths[matchFound.path];
            // We need to set the URL params as Express only adds them later
            Object.assign(data.params, matchFound.params);
        }
        //console.log(" ====== CALLING BEFORE !!")
        // Store specificScama as its needed in the "äfter" fn
        //try{
        //console.log({matchFound,scamaForEndPoint})
        specificScama = before({ scamaForEndPoint: scamaForEndPoint, data: data, genMessage: genMessage });
        if (!specificScama) {
            throw {
                firetail: "urlNotInYaml",
                status: 404,
                val: data
            };
        }
        specificScama.resource = matchFound ? matchFound.path : "";
        //  }catch(err){
        //    console.error(err)
        //  }
        //console.log(1)
        if (data.reqBody) {
            req.body = data.reqBody;
        }
        //console.log(2)
        //req.params = data.params
        //  req.query  = data.query
        security({
            scamaVerb: specificScama,
            operationsFn: operationsFn,
            securitySchemes: components.securitySchemes,
            headers: data.headers,
            decodedJwt: decodedJwt,
            req: req,
            genMessage: genMessage,
            securities: securities
        });
        /*    if(scamaForEndPoint){
                const { verb } = data
                const scamaVerb = scamaForEndPoint[verb]
                //console.log("scamaVerb",scamaVerb)
                if(scamaVerb){*/
        //  console.log(specificScama)
        var operationId = specificScama.operationId; //scamaForEndPoint[data.verb]//scamaVerb
        if (operationId) {
            //    console.log(operationId,operationsFn[operationId])
            if (operationsFn[operationId]) {
                req.params = req.params || {};
                // TODO: should this type conversion be extended to all the non-operationsFn ?
                Object.assign(req.params, data.params);
                Object.assign(req.query, data.query);
                next = function () { return operationsFn[operationId](req, res, next); };
            }
            else {
                console.log("No operationId match for ".concat(operationId));
            }
        } // END if operationId
        /*    } // END if scamaVerb
        } */ // END if scamaForEndPoint
        next();
    }) // END apiSpecPr.then
        .catch(function (err) {
        // If specificScama is set then before was fine
        // and this error is coming from the app and not our problem
        /*if (specificScama) {
          throw err
        }*/
        //  console.error(err,new Error().stack)
        errorHandler(err);
    }); // END catch
}; // END middleware
//# sourceMappingURL=middleware.js.map