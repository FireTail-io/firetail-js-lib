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
        //unknowenArgs:"Unknowen query argument.",
        missingJWTFunction: function (optId) { return "No function with \"".concat(optId, "\" could be found"); },
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
        },
        notANumber: function (val) { return "".concat(val, " is not a value number"); },
        belowMinimum: function (val) { return "".concat(val, " is below the minimum value"); },
        aboveMaximum: function (val) { return "".concat(val, " is above the maximum value"); },
        notAWholeNumber: function (val) { return "".concat(val, " is not a whole number"); },
        notValidString: function (val) { return "Not a valid string:" + JSON.stringify(val); },
        enumNotFound: function (_a) {
            var val = _a.val, list = _a.list;
            return "\"".concat(val, "\" in the in the range of ").concat(list);
        },
        patternNotMatch: function (_a) {
            var val = _a.val, pattern = _a.pattern;
            return "\"".concat(val, "\" didn't match ").concat(pattern);
        },
        toShort: function (val) { return "\"".concat(val, "\" is to shot."); },
        toLong: function (val) { return "\"".concat(val, "\" is to long."); },
        authenticationFailed: "Authentication failed",
        unknownType: function (type) { return "Unknown type: " + type; },
        clientCantAcceptThisContentType: function (replyContentType) { return "Your request have an 'Accept' header that includes \"".concat(replyContentType, "\""); },
        appContentTypeNotInYaml: function (replyContentType) { return "no schema definition was found for \"".concat(replyContentType, "\""); },
        noCustomBodyDecoder: function (replyContentType) { return "no customBodyDecoder was found for \"".concat(replyContentType, "\""); },
        problemWithCustomBodyDecoder: function (replyContentType) { return "\"".concat(replyContentType, "\" decoder has failed"); },
    },
    prod: {
        badOptionYamlPath: function (yamlPath) { return "yamlPath is not validat:e: " + JSON.stringify(yamlPath); },
        default: "There was a problem with your request. Please check your API spec",
        badJWTFunctionOutput: "Could not parce JWT",
        missingJWTFunction: "Could not parce security",
        responseContentTypeMismatch: "Could not find a matching type.",
        unknownContentType: "invalid content-type for this end-point",
        clientCantAcceptThisContentType: "Not Acceptable"
    }
}; // errMessages
module.exports = errMessages;
//# sourceMappingURL=lang.js.map