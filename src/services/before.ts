
const checkParameters = require("./checkParameters");
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
            status:400,
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
            status:404,
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

     const pathNametoCheck = scamaVerb.parameters
                                    //.filter(({in})=>"query" === in) // Is giving a build Error 'var  = _a.in;'
                                      .filter(filterParameter.bind({type:"path"}));

      pathNametoCheck.forEach(({name, schema}) => {
        if(schema){
          data.params[name] = checkParameters(data.params[name],schema)
        }
      })

//+++++++++++++++++++++++++++++ query params are right
//++++++++++++++++++++++++++++++++++++++++++++++++++++

      const queryNametoCheck = scamaVerb.parameters
                                        .filter(filterParameter.bind({type:"query"}))
      /*
      if(queryNamesRecived.length !== queryNametoCheck.length){
        throw new Error(`Mismatch in number of query arguments. You sent too ${
                          queryNamesRecived.length > queryNametoCheck.length ? "many" : "few"}`)
      }*/
      const { query } = data

      let queryNamesRecived = Object.keys(query)
      //console.log(queryNamesRecived)
      queryNametoCheck.forEach(({required,name, schema}) => {
        if(required && ! queryNamesRecived.includes(name)){
          console.warn(name +" was not found as a named query ")
          throw {
              firetail:"missingArgs",
              status:400
            }
          //new Error("Missing required query argument.")
        }
        queryNamesRecived = queryNamesRecived.filter( queryName => queryName !== name)
        if(! schema){
          console.warn(`No schema for query: "${name}" ~ ${url}`)
        } else if(queryNamesRecived.includes(name)){
          data.query[name] = checkParameters(query[name],schema)
        }
      }) // END foreach
      //console.log(queryNamesRecived)
      if(queryNamesRecived.length){
        console.warn(queryNamesRecived.join() +" where pass")
        throw {
            firetail:"unknowenArgs",
            status:400
          }
        // new Error("unknowen query argument.")
      }
    } // END if scamaVerb.parameters


//++++++++++++++++++++++ check body is the right shape
//++++++++++++++++++++++++++++++++++++++++++++++++++++
    const { reqBody } = data

//++++++++++++++++++ check accept type can be returned
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  //  const { accept } = headers

    return scamaVerb

} // END before
