// @ts-check
var SwaggerParser = require("@apidevtools/swagger-parser");
var defaultOpts = require("../config.json");
var flattenObj = require("./utils/flattenObj");
var args2Arr = require("./utils/args2Arr");
var matchUrl = require("./utils/match");
var path = require('path');
//=====================================================
//==================================== file Taile Setup
//=====================================================
module.exports = function fileTaileSetup(_a) {
    var yamlPath = _a.yamlPath, overRideError = _a.overRideError, operations = _a.operations;
    var console = { log: function () { }, warn: function () { }, error: function () { } };
    var yamlPathSt = defaultOpts.yamlPath;
    //++++++++++++++++++++++++++++ check user set yamlPath
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    if (yamlPath) {
        if ("function" === typeof yamlPath) {
            yamlPathSt = yamlPath();
        }
        else if ("string" === typeof yamlPath) {
            yamlPathSt = yamlPath;
        }
        if ("string" !== typeof yamlPathSt) {
            throw new Error("yamlPath is not validate: " + JSON.stringify(yamlPath));
        }
        if (yamlPathSt.startsWith(".")) {
            var callerFile = new Error("").stack
                .split("\n")[2]
                .split("(").pop()
                .split(":")[0];
            var callerDir = path.dirname(callerFile);
            yamlPathSt = path.resolve(callerDir, yamlPathSt);
        }
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
        url: req.originalUrl.split("?")[0],
        resBody: false,
        reqBody: req.body,
        startedAt: new Date(),
        finishedAt: false,
        statusCode: res.statusCode,
        headers: req.headers,
        params: req.params,
        query: req.query
    };
    var specificScama;
    //++++++++++++++++++++++++++++++++++++++ error handler
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var errorHandlerCalled = false;
    var errorHandler = function (err) {
        if (errorHandlerCalled) {
            console.error("errorHandler was already called");
            return;
        }
        console.error(err);
        errorHandlerCalled = true;
        var errContent = "function" === typeof overRideError ? overRideError(err) : err;
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
        var matchFound = matchUrl(data.url, Object.keys(paths));
        var scamaForEndPoint = null;
        if (matchFound) {
            scamaForEndPoint = paths[matchFound.path];
            // We need to set the URL params as Express only adds them later
            Object.assign(data.params, matchFound.params);
        }
        // Store specificScama as its needed in the "äfter" fn
        specificScama = before(scamaForEndPoint, data);
        /*    if(scamaForEndPoint){
                const { verb } = data
                const scamaVerb = scamaForEndPoint[verb]
                //console.log("scamaVerb",scamaVerb)
                if(scamaVerb){*/
        var operationId = scamaForEndPoint[data.verb].operationId; //scamaVerb
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
        if (specificScama) {
            throw err;
        }
        errorHandler(err);
    }); // END catch
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
        }; // END throw
    } // END if
    //+++++++++++++++++++++++++++++++++++++++++ check verb
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var verb = data.verb;
    //console.logo(Object.keys(scamaForEndPoint))
    var scamaVerb = scamaForEndPoint[verb];
    if (!scamaVerb) {
        throw {
            status: 400,
            message: "".concat(url, " ").concat(verb.toUpperCase(), " was not found. Only \"").concat(Object.keys(scamaForEndPoint).join(",").toUpperCase(), "\" should be used")
        }; // END throw
    } // END if ! scamaVerb
    //++++++++ check caller has the right security headers
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //+++++++++++++++++++++ check Content-Type if has body
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var headers = data.headers;
    var contentType = headers["Content-Type"];
    //++++++++++++++++++++++++++++ check reqest parameters
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    if (scamaVerb.parameters) {
        // We have to do this because of Babel or Typescript DUG!!
        function filterParameter(parameter) {
            return this.type === parameter.in;
        }
        //+++++++++++++++++++++++++++++ check params are right
        //++++++++++++++++++++++++++++++++++++++++++++++++++++
        var params = data.params;
        var pathNametoCheck = scamaVerb.parameters
            //.filter(({in})=>"query" === in) // Is giving a build Error 'var  = _a.in;'
            .filter(filterParameter.bind({ type: "path" }));
        pathNametoCheck.forEach(function (_a) {
            var name = _a.name, schema = _a.schema;
            if (schema) {
                data.params[name] = checkParameters(data.params[name], schema);
            }
        });
        //+++++++++++++++++++++++++++++ query params are right
        //++++++++++++++++++++++++++++++++++++++++++++++++++++
        var queryNametoCheck = scamaVerb.parameters
            .filter(filterParameter.bind({ type: "query" }));
        /*
        if(queryNamesRecived.length !== queryNametoCheck.length){
          throw new Error(`Mismatch in number of query arguments. You sent too ${
                            queryNamesRecived.length > queryNametoCheck.length ? "many" : "few"}`)
        }*/
        var query_1 = data.query;
        var queryNamesRecived_1 = Object.keys(query_1);
        //console.log(queryNamesRecived)
        queryNametoCheck.forEach(function (_a) {
            var required = _a.required, name = _a.name, schema = _a.schema;
            if (required && !queryNamesRecived_1.includes(name)) {
                console.warn(name + " was not found as a named query ");
                throw new Error("Missing required query argument.");
            }
            queryNamesRecived_1 = queryNamesRecived_1.filter(function (queryName) { return queryName !== name; });
            if (!schema) {
                console.warn("No schema for query: \"".concat(name, "\" ~ ").concat(url));
            }
            else if (queryNamesRecived_1.includes(name)) {
                data.query[name] = checkParameters(query_1[name], schema);
            }
        }); // END foreach
        //console.log(queryNamesRecived)
        if (queryNamesRecived_1.length) {
            console.warn(queryNamesRecived_1.join() + " where pass");
            throw new Error("unknowen query argument.");
        }
    } // END if scamaVerb.parameters
    //++++++++++++++++++++++ check body is the right shape
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var reqBody = data.reqBody;
    //++++++++++++++++++ check accept type can be returned
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //  const { accept } = headers
    return scamaVerb;
} // END before
function checkParameters(val, schema) {
    var isErr = "";
    /*
  
  
    Common Name	type	format	Comments
    integer	integer	int32	signed 32 bits
    long	integer	int64	signed 64 bits
    float	number	float
    double	number	double
    string	string
    byte	string	byte	base64 encoded characters
    binary	string	binary	any sequence of octets
    boolean	boolean
    date	string	date	As defined by full-date - RFC3339
    dateTime	string	date-time	As defined by date-time - RFC3339
    password	string	password	Used to hint UIs the input needs to be obscured.
  
    */
    switch (schema.type) {
        case "number":
        case "integer":
            var isok = true;
            //format: int64
            var parcedVal = +val;
            if ("".concat(parcedVal) !== val) {
                isErr = "".concat(val, " is not a value number");
            }
            if (!isErr
                && "minimum" in schema
                && schema.minimum > parcedVal) {
                isErr = "".concat(val, " is below the minimum value");
            }
            if (!isErr
                && "maximum" in schema
                && schema.maximum < parcedVal) {
                isErr = "".concat(val, " is above the maximum value");
            }
            if (!isErr
                && "integer" === schema.type
                && 0 < parcedVal % 1) {
                isErr = "".concat(val, " is not a whole number");
            }
            if (!isErr) {
                return parcedVal;
            }
            break;
        case "string":
            if (!val) {
                isErr = "No a valid string:" + JSON.stringify(val);
            }
            if (!isErr
                && schema.enum
                && !schema.enum.includes(val)) {
                isErr = "\"".concat(val, "\" in the in the range of ").concat(schema.enum.join());
            }
            if (!isErr
                && schema.pattern) {
                var patternRg = new RegExp(schema.pattern);
                if (!patternRg.text(val)) {
                    isErr = "\"".concat(val, "\" didn't match ").concat(schema.pattern);
                }
            } // END pattern
            if (isok
                && schema.minLength
                && schema.minLength > val.length) {
                isErr = "\"".concat(val, "\" is to shot.");
            }
            if (isok
                && schema.maxLength
                && schema.maxLength < val.length) {
                isErr = "\"".concat(val, "\" is to long.");
            }
            // TODO: check schema.format //i.e. email, uuid ...
            if (!isErr) {
                return val;
            }
            break;
        case "boolean":
            if ("string" === typeof val
                && ["false", "true"].includes(val.toLowerCase()))
                return "true" === val.toLowerCase();
            break;
        case "object"
        //    break;
        :
        //    break;
        case "array"
        // schema.items.type: string
        //    break;
        :
        // schema.items.type: string
        //    break;
        default:
            isErr = "Unknowen type: " + schema.type;
        // code block
    } // END switch
    throw new Error(isErr);
}
//=====================================================
//=========================== validate AFTER controller
//=====================================================
function after(specificScama, data) {
    var statusCode = data.statusCode, accept = data.headers.accept, resBody = data.resBody;
    // check return Content-Type is in callers accept type
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //+++++++++++++++ check return data is the right shape
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++++++++++++ check stats code in in yaml
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var response = specificScama.responses[statusCode];
    if (response) {
        if (response.content) {
            var contentKey = findAcceptContentKey(acceptTypes(accept), Object.keys(response.content));
            if (contentKey) {
                console.log(resBody, response.content[contentKey], "IS validate?");
            }
            else {
                throw {
                    status: 400,
                    message: "Could not find a matching type." // Available types are ${Object.keys(response.content)}`
                }; // END throw
            } // END inner else
        }
        else {
            console.warn("No 'content' entry in Yaml");
        }
    }
    else {
        throw {
            status: 400,
            message: "StatusCode ".concat(statusCode, " was not found. Available codes are ").concat(Object.keys(specificScama.responses))
        }; // END throw
    } // END outter else
} // END after
//=====================================================
//============================================= HELPERS
//=====================================================
//======================================== accept Types
//=====================================================
function acceptTypes(acceptSt) {
    return acceptSt.split(",")
        .map(function (type) { return type.split(";")[0]; });
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
