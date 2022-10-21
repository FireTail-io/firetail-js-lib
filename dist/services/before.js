var checkParameters = require("./checkParameters");
//=====================================================
//========================== validate BEFORE controller
//=====================================================
module.exports = function before(_a, bodyText) {
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
        //console.log("data",data)
        var query_1 = data.query;
        var queryNamesRecived_1 = Object.keys(query_1);
        //console.log(queryNamesRecived)
        //console.log(1)
        queryNametoCheck.forEach(function (_a) {
            var required = _a.required, name = _a.name, schema = _a.schema;
            //  console.log("name",name)
            //        console.log("queryNamesRecived",queryNamesRecived)
            if (required && !queryNamesRecived_1.includes(name)) {
                console.warn(name + " was not found as a named query ");
                throw {
                    firetail: "missingArgs",
                    status: 400
                };
                //new Error("Missing required query argument.")
            }
            if (!required // this is not required, so it can be undefined
                && !queryNamesRecived_1.includes(name)) {
                return;
            }
            //console.log("A queryNamesRecived",queryNamesRecived)
            queryNamesRecived_1 = queryNamesRecived_1.filter(function (queryName) { return queryName !== name; });
            //console.log("B queryNamesRecived",queryNamesRecived)
            if (!schema) {
                console.warn("No schema for query: \"".concat(name, "\" ~ ").concat(url));
            }
            else { //if(queryNamesRecived.includes(name)){
                //console.log(1,name)
                //console.log(2,query[name])
                //console.log(3,schema)
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
    var reqBody = data.reqBody, headers = data.headers;
    var contentType = headers["content-type"];
    console.log("reqBody", reqBody);
    if (scamaVerb.requestBody
        && scamaVerb.requestBody.content[contentType]) {
        console.log(contentType, scamaVerb.requestBody.content[contentType]);
        if (contentType.endsWith("json")) {
            data.reqBody = JSON.parse(reqBody);
        }
        else {
            console.error(contentType + " NOT SUPPORTED YET");
        }
    }
    else {
        try {
            console.log(reqBody);
            if (reqBody)
                data.reqBody = JSON.parse(reqBody);
        }
        catch (err) {
            console.error(err);
        }
    }
    //++++++++++++++++++ check accept type can be returned
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //  const { accept } = headers
    return scamaVerb;
}; // END before
