// @ts-check
var SwaggerParser = require("@apidevtools/swagger-parser");
var defaultOpts = require("../config.json");
var flattenObj = require("./utils/flattenObj");
var args2Arr = require("./utils/args2Arr");
//=====================================================
//==================================== file Taile Setup
//=====================================================
module.exports = function fileTaileSetup(_a) {
    var yamlPath = _a.yamlPath, overRideError = _a.overRideError, operations = _a.operations;
    var yamlPathSt = defaultOpts.yamlPath;
    //++++++++++++++++++++++++++++ check user set yamlPath
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    if ("string" === typeof yamlPath) {
        yamlPathSt = yamlPath;
    }
    else if ("function" === typeof yamlPath) {
        yamlPathSt = yamlPath();
    }
    else if (process.env && process.env.API_YAML) {
        yamlPathSt = process.env.API_YAML;
    }
    //++++++++++++++++++++++++++++++++++ read in yaml file
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    // TODO: Should we catch or crash if spce is not found?
    var apiSpecPr = SwaggerParser.validate(yamlPathSt)
        .then(function (_a) {
        var paths = _a.paths;
        return paths;
    });
    return middleware.bind({ yamlPathSt: yamlPathSt, apiSpecPr: apiSpecPr, operationsFn: flattenObj(operations || {}) });
}; // END fileTaileSetup
//=====================================================
//========================================== middleware
//=====================================================
function middleware(req, res, next) {
    var _a = this, yamlPathSt = _a.yamlPathSt, apiSpecPr = _a.apiSpecPr, operationsFn = _a.operationsFn;
    var data = {
        yamlPathSt: yamlPathSt,
        verb: req.method.toLowerCase(),
        url: req.originalUrl,
        resBody: false,
        reqBody: req.body,
        startedAt: new Date(),
        finishedAt: false,
        statusCode: res.statusCode,
        headers: req.headers,
        params: req.params
    };
    var specificScama;
    //++++++++++++++++++++++++++++++++++++++ error handler
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var errorHandlerCalled = false;
    var errorHandler = function (err) {
        console.warn(err);
        if (errorHandlerCalled) {
            console.error("errorHandler was already called");
            return;
        }
        errorHandlerCalled = true;
        var errContent = "function" === typeof overRideError ? overRideError(err) : err;
        console.info({ stashFnCalls: stashFnCalls, err: err });
        res.status(err.status);
        stashFnCalls["object" === typeof errContent ? "json" : "send"](errContent);
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
        try {
            // TODO: may need to buffer the responce..
            // as we can override the responce with out
            // warning about app sending data down the wire
            if (specificScama) {
                after(specificScama, data);
            }
            return stashFnCalls.end.apply(res, args);
        }
        catch (err) {
            errorHandler(err);
        }
    }; // END res.end
    //++++++++++++++++++++++++++++++++++ get ref for scama
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    apiSpecPr.then(function (paths) {
        specificScama = before(paths[data.url] || null, data);
        console.log("specificScama", specificScama);
        /*
          if(apiSpecPr(url) && apiSpecPr(url).operationId && apiSpecPr(url).operationId){
      
          }*/
        next();
    }) // END apiSpecPr.then
        .catch(function (err) {
        // If specificScama is set then before was fine
        // and this error is coming from the app and not our problem
        if (specificScama) {
            throw err;
        }
        errorHandler(err);
    });
} // END middleware
//=====================================================
//========================== validate BEFORE controller
//=====================================================
function before(scamaForEndPoint, data) {
    var url = data.url;
    //+++++++ check is there us a scama for that end-point
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    if (!scamaForEndPoint) {
        throw {
            status: 400,
            message: "".concat(url, " was NOT in ").concat(data.yamlPathSt)
        };
    }
    //+++++++++++++++++++++++++++++++++++++++++ check verb
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var verb = data.verb;
    var scamaVerb = scamaForEndPoint[verb];
    if (!scamaVerb) {
        throw {
            status: 400,
            message: "".concat(url, " ").concat(verb, " was not found. Only \"").concat(Object.keys(scamaForEndPoint).join(",").toUpperCase(), "\" should be used")
        };
    }
    //++++++++ check caller has the right security headers
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //+++++++++++++++++++++ check Content-Type if has body
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var headers = data.headers;
    var contentType = headers["Content-Type"];
    //++++++++++++++++++++++ check body is the right shape
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var reqBody = data.reqBody;
    //++++++++++++++++++ check accept type can be returned
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //  const { accept } = headers
    return scamaVerb;
} // END before
//=====================================================
//=========================== validate AFTER controller
//=====================================================
function after(specificScama, data) {
    var statusCode = data.statusCode, accept = data.headers.accept, resBody = data.resBody;
    console.log(data);
    // check return Content-Type is in callers accept type
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //+++++++++++++++ check return data is the right shape
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++++++++++++ check stats code in in yaml
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var response = specificScama.responses[statusCode];
    if (response) {
        var contentKey = findAcceptContentKey(acceptTypes(accept), Object.keys(response.content));
        if (contentKey) {
            console.log(resBody, response.content[contentKey], "IS validate?");
        }
        else {
            throw {
                status: 400,
                message: "Could not find a matching type. Available types are ".concat(Object.keys(response.content))
            };
        }
    }
    else {
        throw {
            status: 400,
            message: "StatusCode ".concat(statusCode, " was not found. Available codes are ").concat(Object.keys(specificScama.responses))
        };
    }
} // END after
//=====================================================
//============================================= HELPERS
//=====================================================
//======================================== accept Types
//=====================================================
function acceptTypes(acceptSt) {
    return acceptSt.split(",").map(function (type) { return type.split(";")[0]; });
    // TODO: Add support for "relative quality factor"
    /* The example
    ' Accept: audio/*; q=0.2, audio/basic '
    SHOULD be interpreted as "I prefer audio/basic, but send me any audio type if it is the best available after an 80% mark-down in quality."
    */
} // END acceptTypes
//=====================================================
//============================= find Accept Content Key
//=====================================================
function findAcceptContentKey(acceptTypes, acceptContent) {
    // TODO: check for "something/*"
    for (var _i = 0, acceptTypes_1 = acceptTypes; _i < acceptTypes_1.length; _i++) {
        var acceptType = acceptTypes_1[_i];
        if ("*/*" === acceptType) {
            return acceptContent[0];
        }
        if (acceptContent.includes(acceptType)) {
            return acceptType;
        }
    } // END for
    return false;
} // END findAcceptContentKey
