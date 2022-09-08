// @ts-check
var SwaggerParser = require("@apidevtools/swagger-parser");
var defaultOpts = require("../config.json");
//=====================================================
//==================================== file Taile Setup
//=====================================================
module.exports = function fileTaileSetup(_a) {
    var yamlPath = _a.yamlPath;
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
    var apiSpecPr = SwaggerParser.validate(yamlPathSt).then(function (_a) {
        var paths = _a.paths;
        return paths;
    });
    return middleware.bind({ yamlPathSt: yamlPathSt, apiSpecPr: apiSpecPr });
}; // END fileTaileSetup
//=====================================================
//========================================== middleware
//=====================================================
function middleware(req, res, next) {
    var _a = this, yamlPathSt = _a.yamlPathSt, apiSpecPr = _a.apiSpecPr;
    var method = req.method, originalUrl = req.originalUrl;
    var finishedAt, resBody, scama;
    var startedAt = new Date();
    //+++++++++++++++++++++++++++++++++++++++++++ stash fn
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var end = res.end.bind(res);
    var send = res.send.bind(res);
    var json = res.json.bind(res);
    //++++++++++++++++++++++++++++++++++++++ call Validate
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var callValidate = function () {
        if (finishedAt && undefined !== scama) {
            if (scama) {
                var scamaVerb = scama[method.toLowerCase()];
                if (scamaVerb) {
                    var data = {
                        verb: method,
                        url: originalUrl,
                        resBody: resBody,
                        startedAt: startedAt,
                        finishedAt: finishedAt,
                        statusCode: res.statusCode,
                        headers: req.headers,
                        params: req.params
                    };
                    console.log(req.get('Content-Type'));
                    validate(scamaVerb, data);
                }
                else {
                    console.log(originalUrl + " " + method + " was not found. Only \"" + Object.keys(scama).join(",").toUpperCase() + "\" should be used");
                }
            }
            else {
                console.log(originalUrl + " was NOT in " + yamlPathSt);
            }
        } // END if finishedAt && scama
    }; // END callValidate
    //+++++++++++++++++++++++++++++++++++++ hi-jack res fn
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    res.send = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        resBody = args[0];
        return send.apply(void 0, args);
    };
    res.json = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        resBody = args[0];
        return json.apply(void 0, args);
    };
    res.end = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        finishedAt = new Date();
        callValidate();
        return end.apply(void 0, args);
    };
    //++++++++++++++++++++++++++++++++++ get ref for scama
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    apiSpecPr.then(function (paths) {
        scama = paths[originalUrl] || null;
        callValidate();
    }); // END apiSpecPr.then
    next();
} // END middleware
//=====================================================
//============================================ validate
//=====================================================
function validate(scama, _a) {
    var verb = _a.verb, url = _a.url, resBody = _a.resBody, startedAt = _a.startedAt, statusCode = _a.statusCode, accept = _a.headers.accept;
    var response = scama.responses[statusCode];
    if (response) {
        var contentKey = findAcceptContentKey(acceptTypes(accept), Object.keys(response.content));
        if (contentKey) {
            console.log(resBody, response.content[contentKey], "IS validate?");
        }
        else {
            console.log("Could not find a matching type. Available types are " + Object.keys(response.content));
        }
    }
    else {
        console.log("StatusCode " + statusCode + " was not found. Available codes are " + Object.keys(scama.responses));
    }
} // END validate
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
