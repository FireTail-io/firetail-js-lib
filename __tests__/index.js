const firetailSetup = require("../dist");
const firetailOpts = {apiYaml:"../sample/api.yaml"}
const firetailMiddleware = firetailSetup(firetailOpts)

function req() {
   return {
    method: 'GET',
    originalUrl: '/bar',
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
  } // END return
} // END req

function res() {
   return {
    statusCode:200,
    end:()=>{},
    send:()=>{},
    json:()=>{}
  }
}

test('...', () => {
  const next = ()=>{}
  firetailMiddleware(req(), res(), next)
  
});