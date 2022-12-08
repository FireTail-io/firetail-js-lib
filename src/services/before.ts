
const checkParameters = require("./checkParameters");
const validateBody    = require("./validateBody");
//=====================================================
//========================== validate BEFORE controller
//=====================================================

module.exports = function before({scamaForEndPoint,data,genMessage}){

    const { url } = data

//+++++++ check is there us a scama for that end-point
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    if ( ! scamaForEndPoint) {
        throw {
            firetail:"urlNotInYaml",
            status:404,
            val:data
        } // END throw
    } // END if

//+++++++++++++++++++++++++++++++++++++++++ check verb
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    const { verb } = data

    //console.log(Object.keys(scamaForEndPoint))
    const scamaVerb = scamaForEndPoint[verb]

    if ( ! scamaVerb) {
        throw {
            firetail:"notFound",
            status:405,
            val:{url,verb,scamaForEndPoint}
        } // END throw
    } // END if ! scamaVerb

//+++++++++++++++++++++ check Content-Type if has body
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    const { headers } = data
    const contentType = headers["Content-Type"]

//++++++++++++++++++++++++++++ check reqest parameters
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    if(scamaVerb.parameters){

      // We have to do this because of Babel or Typescript DUG!!
      function filterParameter(parameter){
         return this.type === parameter.in;
      }

//+++++++++++++++++++++++++++++ check params are right
//++++++++++++++++++++++++++++++++++++++++++++++++++++

     const { params } = data;

        //   console.log(" A ------- ",data.params)
     const pathNametoCheck = scamaVerb.parameters
                                    //.filter(({in})=>"query" === in) // Is giving a build Error 'var  = _a.in;'
                                      .filter(filterParameter.bind({type:"path"}));

      pathNametoCheck.forEach(({name, schema}) => {
      //  console.log(name, schema)
        if(schema){
          data.params[name] = checkParameters(data.params[name],schema)
        }
      })

      //console.log(" B ------- ",data.params)
//+++++++++++++++++++++++++++++ query params are right
//++++++++++++++++++++++++++++++++++++++++++++++++++++

      const queryNametoCheck = scamaVerb.parameters
                                        .filter(filterParameter.bind({type:"query"}))
      /*
      if(queryNamesRecived.length !== queryNametoCheck.length){
        throw new Error(`Mismatch in number of query arguments. You sent too ${
                          queryNamesRecived.length > queryNametoCheck.length ? "many" : "few"}`)
      }*/
      //console.log("data",data)
      const { query } = data

      let queryNamesRecived = Object.keys(query)
    //  console.log("queryNamesRecived",queryNamesRecived)
      //console.log("queryNametoCheck",queryNametoCheck)
      queryNametoCheck.forEach(({required,name, schema}) => {

    //  console.log("name",name)
            //    console.log("queryNamesRecived",queryNamesRecived)
        if(required && ! queryNamesRecived.includes(name)){
          //console.warn(name +" was not found as a named query ")
          throw {
              firetail:"missingArgs",
              status:400
            }
          //new Error("Missing required query argument.")
        }

        if( ! required // this is not required, so it can be undefined
        &&  ! queryNamesRecived.includes(name)){
          return;
        }

        //console.log("A queryNamesRecived",queryNamesRecived)
        queryNamesRecived = queryNamesRecived.filter( queryName => queryName !== name)
      //  console.log("B queryNamesRecived",queryNamesRecived)
        /*console.log(`"${name}" ~ ${url}`,schema)
        if(! schema){
          console.warn(`No schema for query: "${name}" ~ ${url}`)
        } */if(schema) {//if(queryNamesRecived.includes(name)){
          //console.log(name)
          //console.log(query[name])
        //  console.log(schema)
          data.query[name] = checkParameters(query[name],schema)
        }
      }) // END foreach
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
    const { reqBody, headers, dev } = data
    const contentType = headers["content-type"]

    let blocked = [],
       required = [],
       optional = [],
       validater = ()=>{}

    if( ! contentType){
      data.reqBody = undefined
    } else if(scamaVerb.requestBody
           && scamaVerb.requestBody.content[contentType]){

      const { schema } = scamaVerb.requestBody.content[contentType];
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

      validater = validateBody(schema,true, dev)
    //  console.log()
    //  console.log(contentType)
//console.log(1)
      if(contentType.endsWith("json")){
        data.reqBody = JSON.parse(reqBody)
      } else {
        data.reqBody = reqBody
      //  console.error(contentType + " NOT SUPPORTED YET")
      }// END else
    } else {
      throw {
        firetail:"unknownContentType",
        status:415
      }
      /*
      try{
        if(reqBody)
          data.reqBody = JSON.parse(reqBody)
      } catch(err) {
          console.error(err)
      }*/ // END catch
    }// END else

    if("object" === typeof data.reqBody
    ||       Array.isArray(data.reqBody)){

      data.reqBody = validater(data.reqBody)

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

    return scamaVerb

} // END before
