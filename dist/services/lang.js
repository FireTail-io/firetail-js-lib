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
        missingJWTFunctions: "Missing security schemes functions",
        notFound: function (_a) {
            var url = _a.url, verb = _a.verb, scamaForEndPoint = _a.scamaForEndPoint;
            return "".concat(url, " ").concat(verb.toUpperCase(), " was not found. Only \"").concat(Object.keys(scamaForEndPoint).join(",").toUpperCase(), "\" should be used");
        },
        responseContentTypeMismatch: function (content) { return "Could not find a matching type. Available types are ".concat(Object.keys(content)); },
        statusCodeNotFound: function (_a) {
            var statusCode = _a.statusCode, codes = _a.codes;
            return "StatusCode ".concat(statusCode, " was not found. Available codes are ").concat(codes);
        },
        forbidenReqBodyKey: function (key) { return "The key of \"".concat(key, "\" is not allowed in this call"); },
        missingReqBodyKey: function (key) { return "The key of \"".concat(key, "\" is required for this call"); },
        responseReqBodyType: function (_a) {
            var expected = _a.expected, given = _a.given;
            return "Response is of wrong type. Expected \"".concat(expected, "\" given \"").concat(given);
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
module.exports = errMessages;
