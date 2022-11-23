
const SwaggerParser = require("@apidevtools/swagger-parser");
const flattenObj = require("./utils/flattenObj");
const path = require('path');
const fs = require('fs');
const middleware = require('./services/middleware');
const errMessages = require('./services/lang');
const firetailWrapper = require("./firetailWrapper");
//const deepRequire = require('pick-n-mix/utils/deepRequire')
//const decodedJwt = true








function areWeTestingWithJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}



function getFilesFromDir(dir:string, fileTypes:string[]) {
//  console.log({dir, fileTypes})
  var filesToReturn = [];
  function walkDir(currentPath) {
    var files = fs.readdirSync(currentPath);
    for (var i in files) {
      var curFile = path.join(currentPath, files[i]);
      if (fs.statSync(curFile).isFile() && fileTypes.indexOf(path.extname(curFile)) != -1) {
        filesToReturn.push(curFile.replace(dir, ''));
      } else if (fs.statSync(curFile).isDirectory()) {
       walkDir(curFile);
      }
    }
  };
  walkDir(dir);
  //  console.log("filesToReturn",filesToReturn)
  return filesToReturn;
}
const re = /(?:\.([^.]+))?$/;

function deepRequire(dirname,selector){
  selector = selector || ["js"]
  return getFilesFromDir(dirname, selector.map(ext=>`.${ext}`)).reduce((packages,file) =>{
    if(file === "/index.js")  return packages
    //if(file[0] !== "/") file = "/"+file;

    const pathParts = file.replace(re.exec(file)[0],"").split("/").slice(1)
    /*  console.log("pathParts",pathParts)
    if(pathParts[pathParts.length-1] === "index")
    pathParts.pop()*/
//console.log("join(_)",pathParts.join("."))
    packages[pathParts.join(".")] = require(dirname+`/${file}`)
//console.log("packages",Object.keys(packages))
    return packages;
  },{});

} // END deepRequire

















let defaultOpts = {}

interface Options {
    addApi: String | Function;
    overRideError: Function;
    operations: Object;
}
/* istanbul ignore next */
if( ! areWeTestingWithJest()){
    try{
      const packageJsonPath = path.resolve(path.dirname(require.main && require.main.filename ||""),"./package.json")
      const packageJson = require(packageJsonPath)
      if(packageJson.firetail){
        defaultOpts = packageJson.firetail
      }
    } catch (err){
      console.error(err)
    }
}

//=====================================================
//==================================== file Taile Setup
//=====================================================

module.exports = function fileTaileSetup(opts: Options) : Function{

  const myOpts = { ...defaultOpts, ...opts }
  //console.log(myOpts)
  const { addApi, overRideError, operations, dev, decodedJwt, authCallbacks, specificationDir, customBodyDecoders, apiKey, lambda } = myOpts

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


//  console.log(new Error("").stack)

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
    //console.log("addApiSt",addApiSt,addApi)
    if ("string" !== typeof addApiSt) {
      throw new Error(genMessage("badOptionYamlPath",addApi))//"addApi is not validate: "+JSON.stringify(addApi))
    }

    if(addApiSt.startsWith(".")){
      addApiSt = path.resolve(callerDir,addApiSt)
    }

  } else if (process.env
         && process.env.API_YAML) {
    addApiSt = path.resolve(callerDir,process.env.API_YAML)
  } // END else if
  else{
    throw new Error(genMessage("badOptionYamlPath",addApi))
  }
if( specificationDir ){
  const specificationPath = path.resolve(callerDir,specificationDir)
  const specificationFn   =  deepRequire(          specificationPath,["js","ts"])
  operations = { ...operations, ...specificationFn }
}

//++++++++++++++++++++++++++++++++++ read in yaml file
//++++++++++++++++++++++++++++++++++++++++++++++++++++
/*if("string" !== typeof addApiSt){
  throw new Error("Missing path to YAML")
}*/
//console.log("addApiSt",addApiSt)
  // TODO: Should we catch or crash if spce is not found?
 const apiSpecPr = SwaggerParser.validate(addApiSt)
                              /*  .then( apiSpec =>{
                                  const {components} = apiSpec
                                  if(components &&
                                     components.securitySchemes){
                                       if("object" !== typeof authCallbacks){
                                         throw {
                                           firetail:"missingJWTFunctions"
                                         }
                                       }

                                       const securitySchemeNames = Object.keys(components.securitySchemes)
                                       const securityNames       = Object.keys(authCallbacks)

                                       if(securityNames.length !== securitySchemeNames.length){
                                         throw {
                                           message:"Mismatch in number of security functions"
                                         }
                                       }

                                       securitySchemeNames.forEach(securitySchemeName => {
                                         if(!securityNames.includes(securitySchemeName)){
                                           throw {
                                               message:"Missing security schemes function: "+securitySchemeName
                                           }
                                         }
                                       })
                                  }
                                  return apiSpec
                                }).catch(err=>{throw err})*/
  const data = {
        genMessage,
        decodedJwt,
        yamlPathSt:addApiSt,
        apiSpecPr,
        dev,
        authCallbacks,
        customBodyDecoders,
        operationsFn:flattenObj(operations || {}),
        apiKey,
        lambda
      }
const  myMiddleware = middleware.bind(data)
       myMiddleware.firetailData = data
return lambda ? firetailWrapper.bind(myMiddleware) : myMiddleware


} // END fileTaileSetup
