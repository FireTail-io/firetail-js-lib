
const checkParameters = require("./checkParameters");
module.exports = function validateBody(schema,isIncoming,dev){
//console.log(schema)
    const propertiesNames = Object.keys(schema.properties)

    const blocked = propertiesNames.reduce((all,key)=>{
                              if(schema.properties[key].readOnly){
                                all.push(key)
                              }
                              return all
                            },[])

    const required = schema.required.filter(name=> ! blocked.includes(name))
                                .map(name=>({...schema.properties[name],name}))

    const optional = propertiesNames.reduce((all,key)=>{
                         if( ! blocked.includes(key)
                         &&  ! required.find(({name})=>name === key)){
                           all.push({...schema.properties[key],name:key})
                         }
                         return all
                       },[])

//=====================================================
//============================================= body fn
//=====================================================
  return body => {
//console.log(body)
//++++++++++++++++++++++++++ check for disallowed keys
//+++++++++++++++++++++++++++++++++++++++ in its a req

    if(isIncoming)
      blocked.forEach(block=>{
        if(body[block]){
          if(dev)
            throw {
              firetail:"forbidenReqBodyKey",
              val:block,
              status:401
            }// END throw
          //TODO: Log that the client to send readonly key
          delete body[block]
        }// END if
      }) // END forEach
//console.log(1)
//+++++++++++++++++++++++++++++++++++++ check required
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    required.forEach(scrm=>{
  //    console.log(typeof body,body)
  //    console.log(scrm)
  //    console.log(`undefined === body[${scrm.name}]`,undefined === body[scrm.name])
      if(undefined === body[scrm.name]){
        throw {
          firetail:"missingReqBodyKey",
          val:scrm.name,
          status:isIncoming ? 404 : 500
        }// END throw
      }
      checkParameters(body[scrm.name],scrm)
    }) // END required.forEach

  //  console.log(2)
//+++++++++++++++++++++++++++++++++++++ check optional
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    optional.forEach(scrm=>{
      if(undefined !== body[scrm.name]){
        checkParameters(body[scrm.name],scrm)
      }
    }) // END optional.forEach


  //  console.log(3)
    return propertiesNames.reduce((n,key)=>{
                              n[key] = body[key]
                              return n
                            },{})

  } // END body
} // END validateBody
