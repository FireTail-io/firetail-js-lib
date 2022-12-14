
const { acceptTypes } = require("./help");
const validateBody    = require("./validateBody");

//=====================================================
//=========================== validate AFTER controller
//=====================================================

module.exports = function after(specificScama, data){

let { statusCode, headers: { accept }, resHeaders, resBody, dev, customBodyDecoders } = data
let usingCustomBodyDecoders = false;
// check return Content-Type is in callers accept type
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  let replyContentType = resHeaders.reduce((found,{key,val})=>{
                                      if("content-type" === key.toLowerCase())
                                        return val
                                      return found
                                    },"")

  if( ! replyContentType){
    replyContentType = "application/json"
  }

  const wantedContentTypes = acceptTypes(accept)

  const clientWillTakeANYtype = accept.includes("*/*")

//+++++++++++++++ check return data is the right shape
//++++++++++++++++++++++++++++++++++++++++++++++++++++

//++++++++++++++++++++++++ check stats code in in yaml
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  const response = specificScama.responses[statusCode]
                || specificScama.responses.default

  if (response){

    if(response.content){

      const availableContentTypes = Object.keys(response.content)

  // CHECK the client can accept it
  if(300 > statusCode && ! clientWillTakeANYtype
  &&  ! wantedContentTypes.includes(replyContentType) ){
    throw {
        firetail:"clientCantAcceptThisContentType",
        status:406,
        val:replyContentType
    }
  }

if("object" === typeof customBodyDecoders
&& customBodyDecoders[replyContentType]){
  resBody = customBodyDecoders[replyContentType](resBody)

  usingCustomBodyDecoders = true
  if(!resBody){
      throw {
          firetail:"problemWithCustomBodyDecoder",
          status:500,
          val:replyContentType
      }
  }
} else if ("application/json" !== replyContentType){
    throw {
        firetail:"noCustomBodyDecoder",
        status:500,
        val:replyContentType
    }
}

const  contentSchema =  response.content[replyContentType]

  // CHECK it is one of the formats in the Yaml
  if( ! contentSchema){
    return;
  /*  throw {
        firetail:"appContentTypeNotInYaml",
        status:501,
        val:replyContentType
    }*/
  }
const { schema } = contentSchema

      //if (contentKey){
    //    const { schema } = response.content[contentKey]

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
          return usingCustomBodyDecoders ? undefined : resBody.map(item => validateBody(schema.items,false, dev)(item))
        }

        const validater = validateBody(schema,false, dev)
        return usingCustomBodyDecoders ? undefined : validater(resBody)
      /*} else {
          throw {
              firetail:"responseContentTypeMismatch",
              status:400,
              val:response.content
          } // END throw
      }*/ // END inner else
    } else {
      // content: {} !!!
      /*  throw {
            firetail:"responseContentTypeMismatch",
            status:400,
            val:response.content
        }*/ // END throw
    //  console.warn("No 'content' entry in Yaml")
    }
  } else if(400>statusCode){ //response
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
