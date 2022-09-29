const firetailSetup = require("../dist");
const firetailOpts = {yamlPath:"./cases.yaml"
  //"../sample/api.yaml"
}
const firetailMiddleware = firetailSetup(firetailOpts)

function genReq(override) {
   return Object.assign({
    method: 'GET',
    originalUrl:"/",
    headers:{
     host: 'localhost:3001',
     connection: 'keep-alive',
     'cache-control': 'max-age=0',
     'upgrade-insecure-requests': '1',
     'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36',
     accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
     dnt: '1',
     'accept-encoding': 'gzip, deflate, br',
     'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
     'if-none-match': 'W/"d-4TRgr7HmivAwu5vug0TCdElGYfo"'
    },
    params: {},
    query: {},
    get:(key)=>{
        //'Content-Type'
    }
  },override) // END return
} // END req

function genRes(override) {
   return Object.assign({
    statusCode:200,
    status:()=>{},
    end:()=>{},
    send:()=>{},
    json:()=>{}
  },override)
}

describe('test GET requests', () => {
  test('should lookup "operationId"', (done) => {

    let optId_called = false
    let app_called = false
    const next = ()=>{
      app_called = true
    }

    const myFiretailOpts = Object.assign({},firetailOpts)
    myFiretailOpts.operations = {
      optId:{
        basic:(req,res)=>{
          optId_called = true
          res.send()
          res.end()
        }
      }
    }

    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(genReq({
            originalUrl:"/check_operationId_fn",
            end:()=>{
              expect(optId_called).toBe(true);
              expect(app_called).toBe(false);
              done()
            }
          }), genRes({
            end:()=>done()
          }), next)

  // check yaml path can be set
     // via Env
     // via opts args
     // via package.json

  // check yaml exists
  });
});
