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
    var _a = this, genMessage = _a.genMessage, yamlPathSt = _a.yamlPathSt, apiSpecPr = _a.apiSpecPr, apiSpec = _a.apiSpec, operationsFn = _a.operationsFn, dev = _a.dev, customBodyDecoders = _a.customBodyDecoders, decodedJwt = _a.decodedJwt, authCallbacks = _a.authCallbacks, apiKey = _a.apiKey, lambda = _a.lambda;
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
        lambda: lambda
    }; // END data
    data.headers.accept = data.headers.accept || "*/*";
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
        if (!areWeTestingWithJest()) {
            //  console.error(err,new Error().stack)
        }
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
        var errContent = "function" === typeof overRideError ? overRideError(Object.assign({}, defaultErrorVal, err))
            : defaultErrorVal;
        // Because overRideError may not have a status
        data.status = errContent.status || defaultErrorVal.status;
        res.status(data.status);
        if (Array.isArray(err.headers)) {
            err.headers.forEach(function (_a) {
                var key = _a[0], val = _a[1];
                return res.setHeader(key, val);
            });
        }
        if ("object" === typeof errContent) {
            res.setHeader("content-type", "application/json");
            data.resBody = errContent;
            res.json(errContent);
        }
        else {
            res.send(errContent);
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
    var headers = data.resHeaders = [], removeFromHead = [];
    res.setHeader = function (key, val) {
        headers.push({ key: key, val: val });
        return res;
    };
    res.removeHeader = function (key) {
        removeFromHead.push(key);
        return res;
    };
    res.status = function () {
        var args = args2Arr(arguments);
        data.statusCode = args[0];
        return res;
    };
    res.send = function () {
        //if(data.resBody){  return;  }
        var args = args2Arr(arguments);
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
        data.resBody = args[0];
        end();
        return res;
    };
    var end = function () {
        end = function () { };
        //
        var args = args2Arr(arguments);
        data.finishedAt = new Date();
        removeFromHead.forEach(function (key) {
            stashFnCalls.removeHeader(key);
        });
        headers.forEach(function (_a) {
            var key = _a.key, val = _a.val;
            stashFnCalls.setHeader(key, val);
        });
        //data.resHeaders = headers
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
            if (data.resBody) {
                //if("object" === typeof data.resBody){
                if (specificScama) {
                    var cleanedBody = after(specificScama, data);
                    data.resBody = cleanedBody || data.resBody;
                    stashFnCalls.json.call(res, data.resBody);
                }
                else {
                    stashFnCalls.json.call(res, data.resBody);
                }
            } // END if data.resBody
            stashFnCalls.end.call(res);
            stashFnCalls.end = function () { };
            res.end = function () { };
            // TODO: may need to buffer the responce..
            // as we can override the responce with out
            // warning about app sending data down the wire
            if (data.lambda || !areWeTestingWithJest()) {
                try {
                    logFT(req, res, data, specificScama);
                }
                catch (e) {
                    //console.error("=========5==========",e)
                }
            }
        }
        catch (err) {
            console.error(err);
            errorHandler(err);
        }
    }; // END res.end
    //++++++++++++++++++++++++++++++++++ get ref for scama
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    apiSpecPr.then(function (_a) {
        var paths = _a.paths, components = _a.components;
        var matchFound = matchUrl(data.url, Object.keys(paths));
        var scamaForEndPoint = null;
        if (matchFound) {
            scamaForEndPoint = paths[matchFound.path];
            // We need to set the URL params as Express only adds them later
            Object.assign(data.params, matchFound.params);
        }
        // Store specificScama as its needed in the "äfter" fn
        //try{
        specificScama = before({ scamaForEndPoint: scamaForEndPoint, data: data, genMessage: genMessage });
        if (!specificScama) {
            throw {
                firetail: "urlNotInYaml",
                status: 404,
                val: data
            };
        }
        specificScama.resource = matchFound ? matchFound.path
            : "";
        //  }catch(err){
        //    console.error(err)
        //  }
        if (data.reqBody) {
            req.body = data.reqBody;
        }
        //req.params = data.params
        //  req.query  = data.query
        var secNames = security.getSecName(specificScama, components.securitySchemes);
        return Promise.all(secNames.map(function (secName) { return security({
            scamaVerb: specificScama,
            operationsFn: operationsFn,
            securitySchemes: components.securitySchemes,
            headers: data.headers,
            decodedJwt: decodedJwt,
            req: req,
            genMessage: genMessage,
            authCallbacks: authCallbacks,
            secName: secName,
            data: data
        }); })).then(function (results) {
            results.forEach(function (result, index) { return req[secNames[index]] = result; });
            /*    if(scamaForEndPoint){
                const { verb } = data
                const scamaVerb = scamaForEndPoint[verb]
                if(scamaVerb){*/
            var operationId = specificScama.operationId;
            if (operationId) {
                if (operationsFn[operationId]) {
                    req.params = req.params || {};
                    // TODO: should this type conversion be extended to all the non-operationsFn ?
                    Object.assign(req.params, data.params);
                    Object.assign(req.query, data.query);
                    next = function () { return operationsFn[operationId](req, res, next); };
                }
                else {
                    //console.log(`No operationId match for ${operationId}`)
                }
            } // END if operationId
            /*    } // END if scamaVerb
            } */ // END if scamaForEndPoint
            next();
        });
    }) // END apiSpecPr.then
        .catch(function (err) {
        // If specificScama is set then before was fine
        // and this error is coming from the app and not our problem
        /*if (specificScama) {
          throw err
        }*/
        errorHandler(err);
    }); // END catch
}; // END middleware
//# sourceMappingURL=middleware.js.map