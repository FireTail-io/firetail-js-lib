// for Basic, Bearer and other HTTP authentications schemes
function http(schemes, headers, authCb,decodedJwt){

  const authHeader = headers.authorization;
  if( ! authHeader){
    throw {
        firetail:"missingJWTtoken",
        status:401
    } // END throw
  } // if ! headers.authorization

  const { bearerFormat } = schemes
  if("jwt" === bearerFormat.toLowerCase()){
      return jwt(schemes, headers, authCb,decodedJwt)
  }

  const [user,pass] = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  try{
    return authCb({
      user,
      pass,
      scope:schemes.scopes
    },headers)
  }catch(err){

        //    console.error(err)
    throw {
        firetail:"authenticationFailed",
        message:err.message || err,
        headers:[['WWW-Authenticate', 'Basic']],
        status:401
    }
  }
} // END http

function jwt(schemes, headers, authCb, decodedJwt){

  const authHeader = headers.authorization;
   if (! headers.authorization.toLowerCase().startsWith("bearer")){
        throw {
            firetail:"notJWTBearer",
            status:401
        } // END throw
    }

  let result = null;

  if("function" === typeof decodedJwt){
    result = authCb({
      authorization:authHeader,
      decoded:decodedJwt(headers),
      scope:schemes.scopes
    },headers)
  } else if(true === decodedJwt){
      const token = headers.authorization.split(" ").pop().replace(/['"]+/g, '')
      const tokenDecodablePart = token.split('.')[1];

      const decoded = Buffer.from(tokenDecodablePart, 'base64').toString();

      result = authCb({
        authorization:authHeader,
        decoded:JSON.parse(decoded),
        token,
        scope:schemes.scopes
      },headers)
  }else {
    result = authCb({
      authorization:authHeader,
      token:headers.authorization.split(" ").pop(),
      scope:schemes.scopes
    },headers)
  } // END else

  if("object" !== typeof result){
    throw {
        firetail:"badJWTFunctionOutput",
        status:401
    } // END throw
  } // END if
  return result
} // END jwt

// for API keys and cookie authentication
function apiKey(schemes, headers, authCb, decodedJwt){

  let token = headers[schemes.name.toLowerCase()]
  if("query" === schemes.in){
    const { query } = this
    token = query[schemes.name]
  }

  if( ! token){
    throw {
        firetail:"missingJWTtoken",
        status:403
    }
  }

  const scopes = schemes.scopes
              || schemes.flows &&
                 schemes.flows.implicit &&
                 schemes.flows.implicit.scopes
              || {}

  return authCb({
    authorization:token,
    scopes
  },headers)
} // END apikey

// Implicit Grant ~ https://circuit.github.io/oauth.html#implicit
function oauth2(schemes, headers, authCb, decodedJwt){
  const authHeader = headers.authorization;
  if( ! authHeader){
    throw {
        firetail:"missingJWTtoken",
        status:401
    } // END throw
  } // if ! headers.authorization

  const scopes = schemes.scopes
              || schemes.flows &&
                 schemes.flows.implicit &&
                 schemes.flows.implicit.scopes
              || {}

  return authCb({
    authorization:authHeader.split(" ").pop(),
    scopes
  },headers)
} // END oauth2

function openid(){

} // END openid

//for OpenID Connect Discovery
function openIdConnect(){

} // END openIdConnect

const securityType = { http, oauth2, openid, apiKey }


 //jwt, oauth, openid, apikey, basic

//=====================================================
//======================== validate security controller
//=====================================================

function security({ authCallbacks,
                    scamaVerb,
                    operationsFn,
                    securitySchemes,
                    headers,
                    decodedJwt,
                    req,
                    secName  }){
  //++++++++ check caller has the right security headers
  //++++++++++++++++++++++++++++++++++++++++++++++++++++
  return new Promise((resolve, reject) => {
  if( ! secName){
    return resolve(true)
  }
  try{
      const scheme = securitySchemes[secName]
      if(! authCallbacks){
        throw {
            firetail:"missingJWTtoken",
            status:401
        }
     } // END if
      const authCb = authCallbacks[  secName]
      if("function" !== typeof authCb){
        throw {
            firetail:"missingJWTFunction",
            status:401
        }
     } // END if

     const result = securityType[scheme.type].call(req,scheme,headers,authCb,decodedJwt)

     resolve(result)

  }catch(err){
    reject( err.firetail ? err : {
      message:`Security Function "${scheme.type}" failed with:${err.message || err}`,
      status: 401
    }) // END reject
  } // END catch
  }) // END Promise
}

security.getSecName = ({security},securitySchemes)=>{
  let foundSecName;
  if(security){
    security.forEach(sec=> {
      Object.keys(sec).forEach(secName=> {
        if(securitySchemes[secName]){
          foundSecName = secName
        }
      })
    })
  }
  return foundSecName
} // END getSecName
module.exports = security
