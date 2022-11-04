
const { acceptTypes } = require("./help");
const validateBody    = require("./validateBody");
/*
function intersection (a, b) {
    const setA = new Set(a);
    return b.filter(value => setA.has(value));
}*/

//=====================================================
//=========================== validate AFTER controller
//=====================================================

module.exports = function after(specificScama, data){

let { statusCode, headers: { accept }, resHeaders, resBody, dev, customBodyDecoders } = data

// check return Content-Type is in callers accept type
//++++++++++++++++++++++++++++++++++++++++++++++++++++
//console.log("resHeaders",resHeaders)
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

//console.log({replyContentType,wantedContentTypes,clientWillTakeANYtype})

//+++++++++++++++ check return data is the right shape
//++++++++++++++++++++++++++++++++++++++++++++++++++++

//++++++++++++++++++++++++ check stats code in in yaml
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  const response = specificScama.responses[statusCode]
                || specificScama.responses.default
//console.log(response)
// What Scamas can we use to check the response
  if (response){
//    console.log(accept)
//      console.log(response.content)
    if(response.content){

      const availableContentTypes = Object.keys(response.content)



  // CHECK the client can accept it
  if( ! clientWillTakeANYtype
  &&  ! wantedContentTypes.includes(replyContentType) ){
    throw {
        firetail:"clientCantAcceptThisContentType",
        status:406,
        val:replyContentType
    }
  }

//   console.log(resBody)
///   console.log(response.content)
const  contentSchema =  response.content[replyContentType]

//   console.log(replyContentType,contentSchema)
  // CHECK it is one of the formats in the Yaml
  if( ! contentSchema){
    throw {
        firetail:"appContentTypeNotInYaml",
        status:501,
        val:replyContentType
    }
  }
const { schema } = contentSchema
//.log(schema)
//console.log(replyContentType)
//console.log(customBodyDecoders)
if("object" === typeof customBodyDecoders
&& customBodyDecoders[replyContentType]){
  resBody = customBodyDecoders[replyContentType](resBody)
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

  //  console.log(contentKey)
      //if (contentKey){
      // console.log(resBody)
      //  console.log(response.content[contentKey])
      //  console.log("IS validate?")

    //    const { schema } = response.content[contentKey]
//console.log(schema)
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
