
const SwaggerParser = require("@apidevtools/swagger-parser");
const flattenObj = require("./utils/flattenObj");
const path = require('path');
const fs = require('fs');
const middleware = require('./services/middleware');
const errMessages = require('./services/lang');
const firetailWrapper = require("./firetailWrapper");

function areWeTestingWithJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}

function getFilesFromDir(dir:string, fileTypes:string[]) {

  var filesToReturn: string[] = [];
  function walkDir(currentPath:string) {
  //  console.log(`currentPath:${typeof currentPath}`,currentPath)
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

  return filesToReturn;
}
const re = /(?:\.([^.]+))?$/;

function deepRequire(dirname:string,selector:[string]){
//  console.log(`dirname:${typeof dirname}`,dirname)
//  console.log(`selector:${typeof selector}`,selector)
  selector = selector || ["js"]
  return getFilesFromDir(dirname, selector.map(ext=>`.${ext}`)).reduce((packages,file) =>{
    if(file === "/index.js")  return packages

    const pathParts = file.replace(re.exec(file)[0],"").split("/").slice(1)

    packages[pathParts.join(".")] = require(dirname+`/${file}`)
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
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = require(packageJsonPath)
        if(packageJson.firetail){
          defaultOpts = packageJson.firetail
        }
      }
    } catch (err){
      console.error(new Error().stack,err)
    }
}

if(undefined === defaultOpts.lambda){
  defaultOpts.lambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME
}

//=====================================================
//==================================== file Taile Setup
//=====================================================

module.exports = function fileTaileSetup(opts: Options) : Function{

  const myOpts = { ...defaultOpts, ...opts }

  const { addApi, overRideError, operations, dev, decodedJwt, authCallbacks, specificationDir, customBodyDecoders, apiKey, lambda } = myOpts

  let addApiSt = defaultOpts.addApi

//+++++++++++++++++++++++++++++++++++++++++ genMessage
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  const genMessage = (key,data) =>{
    //console.log(`key:${typeof key}`,key)
    //console.log(`data:${typeof data}`,data)
    // default
    let mess = errMessages.prod[key]
    // if dev.. then dev message
    if(dev && errMessages.dev[key]){
       mess = errMessages.dev[key]
    }

  if("function" === typeof mess){
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
      throw new Error(genMessage("badOptionYamlPath",addApi))
      //"addApi is not validate: "+JSON.stringify(addApi))
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
  // TODO: Should we catch or crash if spce is not found?
 const apiSpecPr = SwaggerParser.validate(addApiSt)
 //apiSpecPr.then(x=>console.log(x)).catch(y=>console.error(new Error().stack,y))
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
