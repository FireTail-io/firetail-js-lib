const firetailSetup = require("../dist");
const firetailOpts = {yamlPath:"./cases.yaml"}

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
} // END genRes

//=====================================================
//====================================== test GET calls
//=====================================================

describe('test GET requests', () => {

//+++++++++++ should lookup "operationId" ~ nasted obj
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should lookup "operationId" ~ nasted obj', (done) => {

    let optId_called = false
    let app_called = false
    const next = ()=>{ app_called = true }

    const myFiretailOpts = Object.assign({},firetailOpts)
    myFiretailOpts.operations = {
      optId:{
        basic:(req,res)=>{
          optId_called = true
          res.send()
          res.end()
        } // END basic
      } // END optId
    } // myFiretailOpts.operations

    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(genReq({
            originalUrl:"/check_operationId_fn"
          }), genRes({
            end:()=>{
              expect(optId_called).toBe(true);
              expect(app_called).toBe(false);
              done()
            }
          }), next)

  // check yaml path can be set
     // via Env
     // via opts args
     // via package.json

  // check yaml exists
}); // END test 'should lookup "operationId" ~ nasted obj'

//++++++++++++++++ should lookup "operationId" ~ named
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should lookup "operationId" ~ named', (done) => {

    let optId_called = false
    let app_called = false
    const next = ()=>{ app_called = true }

    const myFiretailOpts = Object.assign({},firetailOpts)
    myFiretailOpts.operations = {
      "optId.basic":(req,res)=>{
          optId_called = true
          res.send()
          res.end()
      } // END "optId.basic"
    } // END myFiretailOpts.operations

    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(genReq({
            originalUrl:"/check_operationId_fn"
          }), genRes({
            end:()=>{
              expect(optId_called).toBe(true);
              expect(app_called).toBe(false);
              done()
            }
          }), next)
  }); // END test 'should lookup "operationId" ~ named'

//+++++++++++++++++++++++++++ should process fragments
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should process fragments', (done) => {

    let optId_called = false
    let app_called = false
    const next = ()=>{ app_called = true }

    const myFiretailOpts = Object.assign({},firetailOpts)
    myFiretailOpts.operations = {
      "check_frag":(req,res)=>{
          optId_called = true
          expect(req.params.fragmentVal).toBe("foo");
          res.send()
          res.end()
      } // END "optId.basic"
    } // END myFiretailOpts.operations

    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(genReq({
            originalUrl:"/check/foo"
          }), genRes({
            end:()=>{
              expect(optId_called).toBe(true);
              expect(app_called).toBe(false);
              done()
            }
          }), next)

  }); // END test 'should process fragments'


//+++++++++++++++++++ should process fragments + query
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should process fragments + query', (done) => {

    let optId_called = false
    let app_called = false
    const next = ()=>{ app_called = true }

    const vals = {
      fVal2:"fooB",
      limit:"3",
      marker:undefined
    }

    const myFiretailOpts = Object.assign({},firetailOpts)
    myFiretailOpts.operations = {
      "check_frag":(req,res)=>{
          optId_called = true
          expect(req.params.fragmentVal2).toBe(vals.fVal2);
          expect(req.query.limit).toBe(vals.limit);
          expect(req.query.marker).toBe(vals.marker);
          res.send()
          res.end()
      } // END "optId.basic"
    } // END myFiretailOpts.operations

    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(
            genReq({
              originalUrl:`/check/${vals.fVal2}/withquery?limit=${vals.limit}`,
              query:{
                limit:vals.limit
              }
            }),
            genRes({
              end:()=>{
                expect(optId_called).toBe(true);
                expect(app_called).toBe(false);
                done()
              }
            }), next)

  }); // END test 'should process fragments'

//++++++++++ should process fragments + Optional query
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should process fragments + Optional query', (done) => {

    let optId_called = false
    let app_called = false
    const next = ()=>{ app_called = true }

    const vals = {
      fragmentVal2:"fooB",
      limit:"3",
      marker:"cats"
    }

    const myFiretailOpts = Object.assign({},firetailOpts)

    myFiretailOpts.operations = {
      "check_frag":(req,res)=>{
          optId_called = true
          expect(req.params.fragmentVal2).toBe(vals.fragmentVal2);
          expect(req.query.limit).toBe(vals.limit);
          expect(req.query.marker).toBe(vals.marker);
          res.send()
          res.end()
      } // END "optId.basic"
    } // END myFiretailOpts.operations

    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(
          genReq({
            originalUrl:`/check/${vals.fragmentVal2}/withquery?limit=${vals.limit}&marker="${vals.marker}"`,
            query:{
              limit:vals.limit,
              marker:vals.marker
            }
          }),
          genRes({
            end:()=>{
              expect(optId_called).toBe(true);
              expect(app_called).toBe(false);
              done()
            }
          }), next)

  }); // END test 'should process fragments'

}); // END describe 'test GET requests'
