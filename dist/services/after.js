var acceptTypes = require("./help").acceptTypes;
var validateBody = require("./validateBody");
//=====================================================
//=========================== validate AFTER controller
//=====================================================
module.exports = function after(specificScama, data) {
    var statusCode = data.statusCode, accept = data.headers.accept, resHeaders = data.resHeaders, resBody = data.resBody, dev = data.dev, customBodyDecoders = data.customBodyDecoders;
    var usingCustomBodyDecoders = false;
    // check return Content-Type is in callers accept type
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var replyContentType = resHeaders.reduce(function (found, _a) {
        var key = _a.key, val = _a.val;
        if ("content-type" === key.toLowerCase())
            return val;
        return found;
    }, "");
    if (!replyContentType) {
        replyContentType = "application/json";
    }
    var wantedContentTypes = acceptTypes(accept);
    var clientWillTakeANYtype = accept.includes("*/*");
    //+++++++++++++++ check return data is the right shape
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++++++++++++ check stats code in in yaml
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var response = specificScama.responses[statusCode]
        || specificScama.responses.default;
    if (response) {
        if (response.content) {
            var availableContentTypes = Object.keys(response.content);
            // CHECK the client can accept it
            if (300 > statusCode && !clientWillTakeANYtype
                && !wantedContentTypes.includes(replyContentType)) {
                throw {
                    firetail: "clientCantAcceptThisContentType",
                    status: 406,
                    val: replyContentType
                };
            }
            if ("object" === typeof customBodyDecoders
                && customBodyDecoders[replyContentType]) {
                resBody = customBodyDecoders[replyContentType](resBody);
                usingCustomBodyDecoders = true;
                if (!resBody) {
                    throw {
                        firetail: "problemWithCustomBodyDecoder",
                        status: 500,
                        val: replyContentType
                    };
                }
            }
            else if ("application/json" !== replyContentType) {
                throw {
                    firetail: "noCustomBodyDecoder",
                    status: 500,
                    val: replyContentType
                };
            }
            var contentSchema = response.content[replyContentType];
            // CHECK it is one of the formats in the Yaml
            if (!contentSchema) {
                return;
                /*  throw {
                      firetail:"appContentTypeNotInYaml",
                      status:501,
                      val:replyContentType
                  }*/
            }
            var schema_1 = contentSchema.schema;
            //if (contentKey){
            //    const { schema } = response.content[contentKey]
            //++++++++++++++++++++++++++++++ check if its an Array
            //++++++++++++++++++++++++++++++++++++++++++++++++++++
            if ("array" === schema_1.type) {
                if (!Array.isArray(resBody)) {
                    throw {
                        firetail: "responseReqBodyType",
                        status: 500,
                        val: {
                            expected: schema_1.type,
                            given: typeof resBody
                        }
                    };
                }
                return usingCustomBodyDecoders ? undefined : resBody.map(function (item) { return validateBody(schema_1.items, false, dev)(item); });
            }
            var validater = validateBody(schema_1, false, dev);
            return usingCustomBodyDecoders ? undefined : validater(resBody);
            /*} else {
                throw {
                    firetail:"responseContentTypeMismatch",
                    status:400,
                    val:response.content
                } // END throw
            }*/ // END inner else
        }
        else {
            // content: {} !!!
            /*  throw {
                  firetail:"responseContentTypeMismatch",
                  status:400,
                  val:response.content
              }*/ // END throw
            //  console.warn("No 'content' entry in Yaml")
        }
    }
    else if (400 > statusCode) { //response
        throw {
            firetail: "statusCodeNotFound",
            status: 400,
            val: {
                statusCode: statusCode,
                codes: Object.keys(specificScama.responses)
            }
        }; // END throw
    } // END outter else
}; // END after
//# sourceMappingURL=after.js.map