
const SwaggerParser = require("@apidevtools/swagger-parser");
const flattenObj = require("./utils/flattenObj");
const path = require('path');
const middleware = require('./services/middleware');
const errMessages = require('./services/lang');
//const decodedJwt = true

let defaultOpts = {}

interface Options {
    addApi: String | Function;
    overRideError: Function;
    operations: Object;
}
try{
  const packageJsonPath = path.resolve(path.dirname(require.main.filename),"./package.json")
  const packageJson = require(packageJsonPath)
  if(packageJson.firetail){
    defaultOpts = packageJson.firetail
  }
} catch (err){
  console.error(err)
}

//=====================================================
//==================================== file Taile Setup
//=====================================================

module.exports = function fileTaileSetup(opts: Options) : Function{

  const myOpts = { ...defaultOpts, ...opts }
  console.log(myOpts)
  const { addApi, overRideError, operations, dev, decodedJwt, securities } = myOpts

  //const console = {log:()=>{},warn:()=>{},error:()=>{}}
  let addApiSt = defaultOpts.addApi

//+++++++++++++++++++++++++++++++++++++++++ genMessage
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  const genMessage = (key,data) =>{
    // default
    let mess = errMessages.prod[key]
    // if dev.. then dev message
    if(dev && errMessages.dev[key]){
       mess = errMessages.dev[key]
    }
//console.log(`typeof mess = ${typeof mess}`,mess)
    if("function" === typeof mess){
//console.log(` >>> `,mess(data))
      return mess(data)
    }
    return mess || errMessages.prod.default
  } // END genMessage



  const callerFile = new Error("").stack
                            .split("\n")[2]
                            .split("(").pop()
                            .split(":")[0]

  const callerDir = path.dirname(callerFile)

//++++++++++++++++++++++++++++ check user set addApi
//++++++++++++++++++++++++++++++++++++++++++++++++++++
  if(addApi){
    if ("function" === typeof addApi) {
        addApiSt = addApi()
    } else if ("string" === typeof addApi) {
        addApiSt = addApi
    }
    if ("string" !== typeof addApiSt) {
      throw new Error(genMessage("badOptionYamlPath",addApi))//"addApi is not validate: "+JSON.stringify(addApi))
    }
    if(addApiSt.startsWith(".")){

      addApiSt = path.resolve(callerDir,addApiSt)
    }

  } else if (process.env && process.env.API_YAML) {
    addApiSt = process.env.API_YAML
  } // END else if

//++++++++++++++++++++++++++++++++++ read in yaml file
//++++++++++++++++++++++++++++++++++++++++++++++++++++
console.log("addApiSt",addApiSt)
  // TODO: Should we catch or crash if spce is not found?
  const apiSpecPr = SwaggerParser.validate(addApiSt)

  return middleware.bind({
    genMessage,
    decodedJwt,
    addApiSt,
    apiSpecPr,
    dev,
    securities,
    operationsFn:flattenObj(operations || {})
  }) // END middleware.bind
} // END fileTaileSetup
