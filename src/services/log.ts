const https = require('https')

const version = "1.0.0-alpha"

function header2List(header){
  return Object.keys(header).map(key=>({key,val:header[key]}))
} // END header2List

function combinHeaderListVals(headerList){
  return headerList.reduce((header,{key,val})=>{
    header[key] = header[key] || []
    if(! header[key].includes(val)){
      header[key].push(val)
    }
    return header
  },{})
} // END combinHeaderListVals


function out(req, res, data, specificScama){
//console.log(new Error())
//console.log(data)
const date1_ms = data.startedAt.getTime();
const date2_ms = data.finishedAt.getTime();

// Calculate the difference in milliseconds
const executionTime = date2_ms - date1_ms;
  const uri = `${req.protocol}://${req.hostname}${req.originalUrl}`;

const payload = {
  version,
  dateCreated: Date.now(),//data.startedAt
  executionTime,
  request:{
    httpProtocol:`HTTP/${req.httpVersion}`,
    uri,
    resource:specificScama ? specificScama.resource : "",
    headers:combinHeaderListVals(header2List(req.headers)),
    method:req.method,
    body:data._reqBody || "",
    ip: req.headers['x-forwarded-for'] ||
        req.socket
     && req.socket.remoteAddress ||
        req.ip
  }, // END request
  response:{
    statusCode:data.statusCode,
    body:"string" === typeof data.resBody ? data.resBody
                                          : JSON.stringify(data.resBody),
    headers:combinHeaderListVals(data.resHeaders)
  }, // END response
  oauth: {
      sub: 'user@firetail.io'
  } // END oauth
} // END payload

//if(data.dev){
//  console.info(`Firetail.io - [${data.statusCode}] ${req.method}:${req.originalUrl} - ${executionTime/1000}sec`)
if(data.lambda){
  const logExt = {
    "event": req.lambdaEvent,
    "response": {
        "statusCode": payload.response.statusCode,
              "body": payload.response.body
    },
    "execution_time": executionTime
  }
  //console.log("firetail:log-ext:",logExt)
  console.log("firetail:log-ext:"+Buffer.from(JSON.stringify(logExt)).toString('base64'))

}else{
    const options = {
      hostname: 'api.logging.eu-west-1.sandbox.firetail.app',
      port: 443,
      path: '/logs/bulk',
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': '*',
        "content-type":"application/x-ndjson",
        "x-ft-api-key":data.apiKey
      } // END headers
    } // END options
//console.log(options,payload)
    const req = https.request(options, res => {
          //  console.log(`statusCode: ${res.statusCode}`)
    res.setEncoding('utf8');
            res.on('data', d => {

              //  console.log(JSON.parse(d))
              //console.log(Buffer.isBuffer(d),d.toString('utf8'))
            })
          })
          req.write(JSON.stringify(payload))
          req.on('error', error => {console.error(error)})
          req.end()
  } // END else
  /*else {
    console.error("Missing Firetail API key!")
  }*/
} // END out
module.exports = out
