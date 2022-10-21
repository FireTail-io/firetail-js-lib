var args2Arr = require("../utils/args2Arr");
var matchUrl = require("../utils/match");
var before = require("./before");
var after = require("./after");
var security = require("./security");
var fs = require('fs');
var path = require('path');
//=====================================================
//========================================== middleware
//=====================================================
module.exports = function middleware(req, res, next) {
    //console.log(` -X- ${req.method}:${req.originalUrl}`)
    var _a = this, genMessage = _a.genMessage, yamlPathSt = _a.yamlPathSt, apiSpecPr = _a.apiSpecPr, apiSpec = _a.apiSpec, operationsFn = _a.operationsFn, dev = _a.dev, decodedJwt = _a.decodedJwt, securities = _a.securities;
    // .then(({paths})=>paths);
    var data = {
        yamlPathSt: yamlPathSt,
        verb: req.method.toLowerCase(),
        url: req.originalUrl.split("?")[0],
        resBody: false,
        reqBody: req.body,
        startedAt: new Date(),
        finishedAt: false,
        statusCode: res.statusCode,
        headers: req.headers,
        params: req.params,
        query: req.query,
        status: 200
    }; // END data
    if (dev) {
        if (data.url.startsWith("/firetail")) {
            if ("/firetail/apis.json" === data.url) {
                apiSpecPr.then(function (api) { return res.json(api.paths); })
                    .catch(function (err) {
                    console.error(err);
                    res.status(500).send(err.message || err);
                }); // END catch
                return;
            } /*
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
            var filePath = "/firetail/client.js" === data.url ? "client.js"
                : "index.html";
            fs.readFile(path.resolve(__dirname, "../../src/ui/", filePath), "utf8", function (err, page) {
                if (err) {
                    data.status = 500;
                    res.status(500).send(err);
                }
                else {
                    res.send(page);
                }
            }); // END fs.readFile
            return;
        }
    } // END if dev
    var specificScama;
    //++++++++++++++++++++++++++++++++++++++ error handler
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var errorHandlerCalled = false;
    var errorHandler = function (err) {
        console.error(err);
        if (errorHandlerCalled) {
            console.error("errorHandler was already called");
            return;
        }
        errorHandlerCalled = true;
        var isUI = (req.get('Referrer') || "").endsWith("/firetail");
        var defaultErrorVal = {
            firetail: "default",
            status: err.status || 500,
            message: genMessage("default"),
            error: undefined
        };
        if (err.firetail && !err.message) {
            err.message = genMessage(err.firetail, err.val);
        }
        if (dev && isUI) {
            defaultErrorVal.error = {
                message: err.message,
                stack: err.stack
            };
        }
        else if (dev) {
            defaultErrorVal.message = err.message || err;
        }
        var errContent = "function" === typeof overRideError ? overRideError(err)
            : defaultErrorVal;
        data.status = errContent.status || defaultErrorVal.status;
        //  console.log(data)
        //  console.log(errContent.status, defaultErrorVal.status)
        res.status(errContent.status || defaultErrorVal.status);
        stashFnCalls["object" === typeof errContent ? "json"
            : "send"](errContent);
        stashFnCalls.end();
    }; // END errorHandler
    //+++++++++++++++++++++++++++++++++++++++++++ stash fn
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var stashFnCalls = {
        end: res.end.bind(res),
        send: res.send.bind(res),
        json: res.json.bind(res)
    }; // END stashFnCalls
    //+++++++++++++++++++++++++++++++++++++ hi-jack res fn
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    res.send = function () {
        var args = args2Arr(arguments);
        data.resBody = args[0];
        return stashFnCalls.send.apply(res, args);
    };
    res.json = function () {
        var args = args2Arr(arguments);
        data.resBody = args[0];
        return stashFnCalls.json.apply(res, args);
    };
    res.end = function () {
        var args = args2Arr(arguments);
        data.finishedAt = new Date();
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
                after(specificScama, data, genMessage);
            }
            return stashFnCalls.end.apply(res, args);
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
        } /*console.log()
        console.log(paths)
        console.log()*/
        // Store specificScama as its needed in the "äfter" fn
        specificScama = before({ scamaForEndPoint: scamaForEndPoint, data: data, genMessage: genMessage });
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
        var operationId = specificScama.operationId; //scamaForEndPoint[data.verb]//scamaVerb
        if (operationId) {
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
        errorHandler(err);
    }); // END catch
}; // END middleware
