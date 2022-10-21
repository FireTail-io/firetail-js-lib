var _a = require("./help"), acceptTypes = _a.acceptTypes, findAcceptContentKey = _a.findAcceptContentKey;
//=====================================================
//=========================== validate AFTER controller
//=====================================================
module.exports = function after(specificScama, data) {
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
}; // END after
