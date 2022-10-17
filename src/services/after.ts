
const { acceptTypes, findAcceptContentKey } = require("./help");

//=====================================================
//=========================== validate AFTER controller
//=====================================================

module.exports = function after(specificScama, data){

const { statusCode, headers: { accept } , resBody } = data

// check return Content-Type is in callers accept type
//++++++++++++++++++++++++++++++++++++++++++++++++++++

//+++++++++++++++ check return data is the right shape
//++++++++++++++++++++++++++++++++++++++++++++++++++++

//++++++++++++++++++++++++ check stats code in in yaml
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  const response = specificScama.responses[statusCode]

  if (response){
    if(response.content){
      const contentKey = findAcceptContentKey(acceptTypes(accept),Object.keys(response.content))
      if (contentKey){
      /*  console.log(resBody)
        console.log(response.content[contentKey])
        console.log("IS validate?")*/
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
