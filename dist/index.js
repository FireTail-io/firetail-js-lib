// @ts-check
var SwaggerParser = require("@apidevtools/swagger-parser");
var defaultOpts = require("../config.json");
var flattenObj = require("./utils/flattenObj");
var args2Arr = require("./utils/args2Arr");
var matchUrl = require("./utils/match");
var path = require('path');
var fs = require('fs');
var decodedJwt = true;
var errMessages = {
    dev: {
        missingJWTtoken: "No authorization token provided",
        notJWTBearer: "token dont not start with 'bearer: '",
        urlNotInYaml: function (_a) {
            var url = _a.url, yamlPathSt = _a.yamlPathSt;
            return "".concat(url, " was NOT in ").concat(yamlPathSt);
        },
        badJWTFunctionOutput: "The JWT parce function did not return an oject",
        missingArgs: "Missing required query argument.",
        unknowenArgs: "Unknowen query argument.",
        missingJWTFunction: function (optId) { return "No function with \"".concat(optId, "\" could be found for parcing JWTs"); },
        notFound: function (_a) {
            var url = _a.url, verb = _a.verb, scamaForEndPoint = _a.scamaForEndPoint;
            return "".concat(url, " ").concat(verb.toUpperCase(), " was not found. Only \"").concat(Object.keys(scamaForEndPoint).join(",").toUpperCase(), "\" should be used");
        },
        responseContentTypeMismatch: function (content) { return "Could not find a matching type. Available types are ".concat(Object.keys(content)); },
        statusCodeNotFound: function (_a) {
            var statusCode = _a.statusCode, codes = _a.codes;
            return "StatusCode ".concat(statusCode, " was not found. Available codes are ").concat(codes);
        }
    },
    prod: {
        badOptionYamlPath: function (yamlPath) { return "yamlPath is not validate: " + JSON.stringify(yamlPath); },
        default: "There was a problem with your request. Please check your API spec",
        badJWTFunctionOutput: "Could not parce JWT",
        missingJWTFunction: "Could not parce JWT",
        responseContentTypeMismatch: "Could not find a matching type."
    }
}; // errMessages
//=====================================================
//==================================== file Taile Setup
//=====================================================
module.exports = function fileTaileSetup(_a) {
    var yamlPath = _a.yamlPath, overRideError = _a.overRideError, operations = _a.operations, dev = _a.dev, decodedJwt = _a.decodedJwt;
    //const console = {log:()=>{},warn:()=>{},error:()=>{}}
    var yamlPathSt = defaultOpts.yamlPath;
    //+++++++++++++++++++++++++++++++++++++++++ genMessage
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var genMessage = function (key, data) {
        // default
        var mess = errMessages.prod[key];
        // if dev.. then dev message
        if (dev && errMessages.dev[key]) {
            mess = errMessages.dev[key];
        }
        //console.log(`typeof mess = ${typeof mess}`,mess)
        if ("function" === typeof mess) {
            //console.log(` >>> `,mess(data))
            return mess(data);
        }
        return mess || errMessages.prod.default;
    }; // END genMessage
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
            throw new Error(genMessage("badOptionYamlPath", yamlPath)); //"yamlPath is not validate: "+JSON.stringify(yamlPath))
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
    } // END else if
    //++++++++++++++++++++++++++++++++++ read in yaml file
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    // TODO: Should we catch or crash if spce is not found?
    var apiSpecPr = SwaggerParser.validate(yamlPathSt);
    return middleware.bind({
        genMessage: genMessage,
        decodedJwt: decodedJwt,
        yamlPathSt: yamlPathSt,
        apiSpecPr: apiSpecPr,
        dev: dev,
        operationsFn: flattenObj(operations || {})
    }); // END middleware.bind
}; // END fileTaileSetup
//=====================================================
//========================================== middleware
//=====================================================
function middleware(req, res, next) {
    //console.log(` -X- ${req.method}:${req.originalUrl}`)
    var _a = this, genMessage = _a.genMessage, yamlPathSt = _a.yamlPathSt, apiSpecPr = _a.apiSpecPr, operationsFn = _a.operationsFn, dev = _a.dev, decodedJwt = _a.decodedJwt;
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
    };
    if (dev) {
        if (data.url.startsWith("/firetail")) {
            if ("/firetail/apis.json" === data.url) {
                apiSpecPr.then(function (api) { return res.json(api.paths); })
                    .catch(function (err) {
                    console.error(err);
                    res.status(500).send(err.message || err);
                });
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
            fs.readFile(path.resolve(__dirname, "../src/ui/", filePath), "utf8", function (err, page) {
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
        //  console.error("-> "err, new Error().stack)
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
            genMessage: genMessage
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
} // END middleware
//=====================================================
//======================== validate security controller
//=====================================================
function security(_a) {
    var scamaVerb = _a.scamaVerb, operationsFn = _a.operationsFn, securitySchemes = _a.securitySchemes, headers = _a.headers, decodedJwt = _a.decodedJwt, req = _a.req, genMessage = _a.genMessage;
    //console.log("security",arguments)
    //++++++++ check caller has the right security headers
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    /*
      console.log("X check caller has the right security headers")
      console.log(1)
      console.log("->",operationsFn)
      console.log(2)*/
    try {
        if (scamaVerb.security) {
            //  console.log(3,scamaVerb.security)
            scamaVerb.security.forEach(function (sec) {
                //  console.log(4,sec)
                Object.keys(sec).forEach(function (secName) {
                    //console.log(5,secName)
                    if (securitySchemes[secName]) {
                        //console.log(6,securitySchemes[secName])
                        var optName = securitySchemes[secName]["x-bearerInfoFunc"];
                        if (!headers.authorization) {
                            //  console.log(6.1,"")
                            throw {
                                firetail: "missingJWTtoken",
                                status: 401
                            }; // END throw
                        } // if ! headers.authorization
                        else if (!headers.authorization.toLowerCase().startsWith("bearer")) {
                            throw {
                                firetail: "notJWTBearer",
                                status: 401
                            }; // END throw
                        }
                        //console.log(7,decodedJwt)
                        if ("function" === typeof decodedJwt) {
                            req.jwt = operationsFn[optName](decodedJwt(headers));
                        }
                        else if (decodedJwt) {
                            var token = headers.authorization.split(" ").pop().replace(/['"]+/g, '');
                            var tokenDecodablePart = token.split('.')[1];
                            var decoded = Buffer.from(tokenDecodablePart, 'base64').toString();
                            req.jwt = operationsFn[optName](JSON.parse(decoded), token);
                        }
                        else if ("function" === typeof operationsFn[optName]) {
                            req.jwt = operationsFn[optName](headers);
                        }
                        else {
                            //console.log("missingJWTFunction -> ",genMessage("missingJWTFunction",optName))
                            throw {
                                firetail: "missingJWTFunction",
                                status: 401,
                                val: optName
                            };
                        }
                        //console.log(typeof req.jwt, req.jwt,genMessage("badJWTFunctionOutput"))
                        if ("object" !== typeof req.jwt) {
                            throw {
                                firetail: "badJWTFunctionOutput",
                                status: 401
                            };
                        }
                        //console.log(8,req.jwt)
                    } // END if securitySchemes[secName]
                }); // END forEach Object.keys
            }); // END forEach scamaVerb.security
        } // END if scamaVerb.security
    }
    catch (err) {
        if (err.firetail) {
            throw err;
        }
        //  console.error(err)
        throw {
            message: err.message || err,
            status: 401
        };
    }
    /*
      console.log()
      console.log(scamaVerb)
      console.log()
      console.log(securitySchemes)
      console.log()*/
}
//=====================================================
//========================== validate BEFORE controller
//=====================================================
function before(_a) {
    var scamaForEndPoint = _a.scamaForEndPoint, data = _a.data, genMessage = _a.genMessage;
    var url = data.url;
    //+++++++ check is there us a scama for that end-point
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    if (!scamaForEndPoint) {
        throw {
            firetail: "urlNotInYaml",
            status: 400,
            val: data
        }; // END throw
    } // END if
    //+++++++++++++++++++++++++++++++++++++++++ check verb
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var verb = data.verb;
    //console.log(Object.keys(scamaForEndPoint))
    var scamaVerb = scamaForEndPoint[verb];
    if (!scamaVerb) {
        throw {
            firetail: "notFound",
            status: 404,
            val: { url: url, verb: verb, scamaForEndPoint: scamaForEndPoint }
        }; // END throw
    } // END if ! scamaVerb
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
                throw {
                    firetail: "missingArgs",
                    status: 400
                };
                //new Error("Missing required query argument.")
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
            throw {
                firetail: "unknowenArgs",
                status: 400
            };
            // new Error("unknowen query argument.")
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
                /*  console.log(resBody)
                  console.log(response.content[contentKey])
                  console.log("IS validate?")*/
            }
            else {
                throw {
                    firetail: "responseContentTypeMismatch",
                    status: 400,
                    val: response.content
                }; // END throw
            } // END inner else
        }
        else {
            console.warn("No 'content' entry in Yaml");
        }
    }
    else {
        throw {
            firetail: "statusCodeNotFound",
            status: 400,
            val: {
                statusCode: statusCode,
                codes: Object.keys(specificScama.responses)
            }
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
