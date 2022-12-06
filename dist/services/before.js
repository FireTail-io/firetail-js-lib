var checkParameters = require("./checkParameters");
var validateBody = require("./validateBody");
//=====================================================
//========================== validate BEFORE controller
//=====================================================
module.exports = function before(_a) {
    var scamaForEndPoint = _a.scamaForEndPoint, data = _a.data, genMessage = _a.genMessage;
    var url = data.url;
    //+++++++ check is there us a scama for that end-point
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    if (!scamaForEndPoint) {
        throw {
            firetail: "urlNotInYaml",
            status: 404,
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
            status: 405,
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
        //   console.log(" A ------- ",data.params)
        var pathNametoCheck = scamaVerb.parameters
            //.filter(({in})=>"query" === in) // Is giving a build Error 'var  = _a.in;'
            .filter(filterParameter.bind({ type: "path" }));
        pathNametoCheck.forEach(function (_a) {
            var name = _a.name, schema = _a.schema;
            //  console.log(name, schema)
            if (schema) {
                data.params[name] = checkParameters(data.params[name], schema);
            }
        });
        //console.log(" B ------- ",data.params)
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
        //  console.log("queryNamesRecived",queryNamesRecived)
        //console.log("queryNametoCheck",queryNametoCheck)
        queryNametoCheck.forEach(function (_a) {
            var required = _a.required, name = _a.name, schema = _a.schema;
            //  console.log("name",name)
            //    console.log("queryNamesRecived",queryNamesRecived)
            if (required && !queryNamesRecived_1.includes(name)) {
                //console.warn(name +" was not found as a named query ")
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
            //  console.log("B queryNamesRecived",queryNamesRecived)
            /*console.log(`"${name}" ~ ${url}`,schema)
            if(! schema){
              console.warn(`No schema for query: "${name}" ~ ${url}`)
            } */ if (schema) { //if(queryNamesRecived.includes(name)){
                //console.log(name)
                //console.log(query[name])
                //  console.log(schema)
                data.query[name] = checkParameters(query_1[name], schema);
            }
        }); // END foreach
        // HANDLED by 'missingArgs'
        /*  console.log(queryNamesRecived)
          if(queryNamesRecived.length){
            console.warn(queryNamesRecived.join() +" where pass")
            throw {
                firetail:"unknowenArgs",
                status:400,
                val:queryNamesRecived
              }
            // new Error("unknowen query argument.")
          }*/
    } // END if scamaVerb.parameters
    //++++++++++++++++++++++ check body is the right shape
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var reqBody = data.reqBody, headers = data.headers, dev = data.dev;
    var contentType = headers["content-type"];
    var blocked = [], required = [], optional = [], validater = function () { };
    if (!contentType) {
        data.reqBody = undefined;
    }
    else if (scamaVerb.requestBody
        && scamaVerb.requestBody.content[contentType]) {
        var schema = scamaVerb.requestBody.content[contentType].schema;
        /*
              blocked = Object.keys(schema.properties)
                                    .reduce((all,key)=>{
                                      if(schema.properties[key].readOnly){
                                        all.push(key)
                                      }
                                      return all
                                    },[])
        
              required = schema.required.filter(name=> ! blocked.includes(name))
                                        .map(name=>({...schema.properties[name],name}))
        
              optional = Object.keys(schema.properties)
                               .reduce((all,key)=>{
                                 if( ! blocked.includes(key)
                                 &&  ! required.find(({name})=>name === key)){
                                   all.push({...schema.properties[key],name:key})
                                 }
                                 return all
                               },[])*/
        validater = validateBody(schema, true, dev);
        //  console.log()
        //  console.log(contentType)
        //console.log(1)
        if (contentType.endsWith("json")) {
            data.reqBody = JSON.parse(reqBody);
        }
        else {
            data.reqBody = reqBody;
            //  console.error(contentType + " NOT SUPPORTED YET")
        } // END else
    }
    else {
        throw {
            firetail: "unknownContentType",
            status: 415
        };
        /*
        try{
          if(reqBody)
            data.reqBody = JSON.parse(reqBody)
        } catch(err) {
            console.error(err)
        }*/ // END catch
    } // END else
    if ("object" === typeof data.reqBody
        || Array.isArray(data.reqBody)) {
        validater(data.reqBody);
        /*
          blocked.forEach(block=>{
            if(data.reqBody[block]){
              throw {
                firetail:"forbidenReqBodyKey",
                val:block,
                status:401
              }// END throw
            }// END if
          }) // END forEach
        required.forEach(scrm=>{
          if(undefined === data.reqBody[scrm.name]){
            throw {
              firetail:"missingReqBodyKey",
              val:scrm.name,
              status:404
            }// END throw
          }
          checkParameters(data.reqBody[scrm.name],scrm)
        }) // END required.forEach
        optional.forEach(scrm=>{
          if(undefined !== data.reqBody[scrm.name]){
            checkParameters(data.reqBody[scrm.name],scrm)
          }
        }) // END optional.forEach
        */
    } // END if
    //++++++++++++++++++ check accept type can be returned
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    //  const { accept } = headers
    return scamaVerb;
}; // END before
//# sourceMappingURL=before.js.map