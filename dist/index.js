var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var SwaggerParser = require("@apidevtools/swagger-parser");
var flattenObj = require("./utils/flattenObj");
var path = require('path');
var fs = require('fs');
var middleware = require('./services/middleware');
var errMessages = require('./services/lang');
var firetailWrapper = require("./firetailWrapper");
function areWeTestingWithJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}
function getFilesFromDir(dir, fileTypes) {
    var filesToReturn = [];
    function walkDir(currentPath) {
        //  console.log(`currentPath:${typeof currentPath}`,currentPath)
        var files = fs.readdirSync(currentPath);
        for (var i in files) {
            var curFile = path.join(currentPath, files[i]);
            if (fs.statSync(curFile).isFile() && fileTypes.indexOf(path.extname(curFile)) != -1) {
                filesToReturn.push(curFile.replace(dir, ''));
            }
            else if (fs.statSync(curFile).isDirectory()) {
                walkDir(curFile);
            }
        }
    }
    ;
    walkDir(dir);
    return filesToReturn;
}
var re = /(?:\.([^.]+))?$/;
function deepRequire(dirname, selector) {
    //  console.log(`dirname:${typeof dirname}`,dirname)
    //  console.log(`selector:${typeof selector}`,selector)
    selector = selector || ["js"];
    return getFilesFromDir(dirname, selector.map(function (ext) { return ".".concat(ext); })).reduce(function (packages, file) {
        if (file === "/index.js")
            return packages;
        var pathParts = file.replace(re.exec(file)[0], "").split("/").slice(1);
        packages[pathParts.join(".")] = require(dirname + "/".concat(file));
        return packages;
    }, {});
} // END deepRequire
var defaultOpts = {};
/* istanbul ignore next */
if (!areWeTestingWithJest()) {
    try {
        var packageJsonPath = path.resolve(path.dirname(require.main && require.main.filename || ""), "./package.json");
        if (fs.existsSync(packageJsonPath)) {
            var packageJson = require(packageJsonPath);
            if (packageJson.firetail) {
                defaultOpts = packageJson.firetail;
            }
        }
    }
    catch (err) {
        console.error(new Error().stack, err);
    }
}
if (undefined === defaultOpts.lambda) {
    defaultOpts.lambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}
//=====================================================
//==================================== file Taile Setup
//=====================================================
module.exports = function fileTaileSetup(opts) {
    var myOpts = __assign(__assign({}, defaultOpts), opts);
    var addApi = myOpts.addApi, overRideError = myOpts.overRideError, operations = myOpts.operations, dev = myOpts.dev, decodedJwt = myOpts.decodedJwt, authCallbacks = myOpts.authCallbacks, specificationDir = myOpts.specificationDir, customBodyDecoders = myOpts.customBodyDecoders, apiKey = myOpts.apiKey, lambda = myOpts.lambda;
    var addApiSt = defaultOpts.addApi;
    //+++++++++++++++++++++++++++++++++++++++++ genMessage
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    var genMessage = function (key, data) {
        //console.log(`key:${typeof key}`,key)
        //console.log(`data:${typeof data}`,data)
        // default
        var mess = errMessages.prod[key];
        // if dev.. then dev message
        if (dev && errMessages.dev[key]) {
            mess = errMessages.dev[key];
        }
        if ("function" === typeof mess) {
            return mess(data);
        }
        return mess || errMessages.prod.default;
    }; // END genMessage
    var callerFile = new Error("").stack
        .split("\n")[2]
        .split("(").pop()
        .split(":")[0];
    var callerDir = path.dirname(callerFile);
    //++++++++++++++++++++++++++++ check user set addApi
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    if (addApi) {
        if ("function" === typeof addApi) {
            addApiSt = addApi();
        }
        else if ("string" === typeof addApi) {
            addApiSt = addApi;
        }
        if ("string" !== typeof addApiSt) {
            throw new Error(genMessage("badOptionYamlPath", addApi));
            //"addApi is not validate: "+JSON.stringify(addApi))
        }
        if (addApiSt.startsWith(".")) {
            addApiSt = path.resolve(callerDir, addApiSt);
        }
    }
    else if (process.env
        && process.env.API_YAML) {
        addApiSt = path.resolve(callerDir, process.env.API_YAML);
    } // END else if
    else {
        throw new Error(genMessage("badOptionYamlPath", addApi));
    }
    if (specificationDir) {
        var specificationPath = path.resolve(callerDir, specificationDir);
        var specificationFn = deepRequire(specificationPath, ["js", "ts"]);
        operations = __assign(__assign({}, operations), specificationFn);
    }
    //++++++++++++++++++++++++++++++++++ read in yaml file
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    /*if("string" !== typeof addApiSt){
      throw new Error("Missing path to YAML")
    }*/
    // TODO: Should we catch or crash if spce is not found?
    var apiSpecPr = SwaggerParser.validate(addApiSt);
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
    var data = {
        genMessage: genMessage,
        decodedJwt: decodedJwt,
        yamlPathSt: addApiSt,
        apiSpecPr: apiSpecPr,
        dev: dev,
        authCallbacks: authCallbacks,
        customBodyDecoders: customBodyDecoders,
        operationsFn: flattenObj(operations || {}),
        apiKey: apiKey,
        lambda: lambda
    };
    var myMiddleware = middleware.bind(data);
    myMiddleware.firetailData = data;
    return lambda ? firetailWrapper.bind(myMiddleware) : myMiddleware;
}; // END fileTaileSetup
//# sourceMappingURL=index.js.map