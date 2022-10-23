
const { acceptTypes, findAcceptContentKey } = require("./help");
const validateBody    = require("./validateBody");

//=====================================================
//=========================== validate AFTER controller
//=====================================================

module.exports = function after(specificScama, data){

const { statusCode, headers: { accept } , resBody, dev } = data




// check return Content-Type is in callers accept type
//++++++++++++++++++++++++++++++++++++++++++++++++++++

//+++++++++++++++ check return data is the right shape
//++++++++++++++++++++++++++++++++++++++++++++++++++++

//++++++++++++++++++++++++ check stats code in in yaml
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  const response = specificScama.responses[statusCode]
                || specificScama.responses.default

  if (response){
    if(response.content){
      const contentKey = findAcceptContentKey(acceptTypes(accept),
                                              Object.keys(response.content))
      if (contentKey){
      // console.log(resBody)
      //  console.log(response.content[contentKey])
      //  console.log("IS validate?")

        const { schema } = response.content[contentKey]

//++++++++++++++++++++++++++++++ check if its an Array
//++++++++++++++++++++++++++++++++++++++++++++++++++++
        if("array" === schema.type){
          if(!Array.isArray(resBody)){
            throw {
              firetail:"responseReqBodyType",
              status:500,
              val:{
                expected:schema.type,
                given:typeof resBody
              }
            }
          }
          return resBody.map(item => validateBody(schema.items,false, dev)(item))
        }

        const validater = validateBody(schema,false, dev)
        return validater(resBody)
      } else {
          throw {
              firetail:"responseContentTypeMismatch",
              status:400,
              val:response.content
          } // END throw
      } // END inner else
    } else {
      console.warn("No 'content' entry in Yaml")
    }
  } else {
     throw {
         firetail:"statusCodeNotFound",
         status:400,
         val:{
           statusCode,
           codes:Object.keys(specificScama.responses)
         }
     } // END throw
  } // END outter else

} // END after
