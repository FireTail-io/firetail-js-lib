const Serverless_Events = require('./sampleEvents.json')
const data = require('./animals.json')
const firetailSetup = require("../dist");
const errMessages = require("../dist/services/lang")
const firetailOpts = {
  addApi:"./cases.yaml",
  testing:true
}

function genReq(override={}) {
  const req = {
   method: 'GET',
   originalUrl:"/",
   params: {},
   query: {},
   get:(key)=>{
       //'Content-Type'
   }
 }

  const headers = {
   host: 'localhost:3001',
   connection: 'keep-alive',
   'cache-control': 'max-age=0',
   'upgrade-insecure-requests': '1',
   'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36',
   accept: 'application/json',//'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
   dnt: '1',
   'accept-encoding': 'gzip, deflate, br',
   'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
   'if-none-match': 'W/"d-4TRgr7HmivAwu5vug0TCdElGYfo"'
 }

 Object.assign(req,override)

 req.headers = headers

 Object.assign(req.headers,override && override.headers)

   return req // END return
} // END req

function genRes(override) {
  const res = {
    setHeader:()=>{},
    removeHeader:()=>{},
   __data:undefined,
   statusCode:200,
   status:(statusCode)=>{
     res.statusCode=statusCode
     return res
   },
   end:()=>{
     //console.log("end ===>>>",res.__data)
     return res
   },
   send:(x)=>{
     //console.log("send ===>>>",x)
     res.__data = x;
     return res
   },
   json:(x)=>{
    // console.log("json ===>>>",x)
     res.__data = x;
     return res
   }
 }
   return Object.assign(res,override)
} // END genRes

//=====================================================
//====================================== test YAML file
//=====================================================

describe('test YAML file is ok', () => {

})

//=====================================================
//==================================== test Firetail JS
//=====================================================

describe('test Firetail', () => {

  //+++++++++++ should lookup "operationId" ~ nasted obj
  //++++++++++++++++++++++++++++++++++++++++++++++++++++

    test('should load operationId Fns from Dir', () => {
      const myFiretailOpts = Object.assign({},firetailOpts)
        myFiretailOpts.specificationDir = "./specificationDir"
        myFiretailOpts.addApi = ()=>firetailOpts.addApi
        firetailSetup(myFiretailOpts)
        expect(true).toBe(true);
    })

  //++++++++++ should error if YAML PATH is not a string
  //++++++++++++++++++++++++++++++++++++++++++++++++++++

    test('should error if YAML PATH is not a string', () => {

      const myFiretailOpts = Object.assign({},firetailOpts)
            myFiretailOpts.addApi = 123
      expect(() =>{
        firetailSetup(myFiretailOpts)
      }).toThrowError();

  }); // END test 'should error if YAML PATH is not a string'

  //++++++++++++++++++ should error if missing YAML PATH
  //++++++++++++++++++++++++++++++++++++++++++++++++++++

    test('should error if missing YAML PATH', () => {

      const myFiretailOpts = Object.assign({},firetailOpts)
      delete myFiretailOpts.addApi
      expect(() =>{
        firetailSetup(myFiretailOpts)
      }).toThrowError();

  }); // END test 'should error if missing YAML PATH'

  //+++++++++++++++++ should error if URL is not in YAML
  //++++++++++++++++++++++++++++++++++++++++++++++++++++

  //++ should work with process.env.API_YAML = YAML PATH
  //++++++++++++++++++++++++++++++++++++++++++++++++++++

    test('should work with process.env.API_YAML = YAML PATH', () => {

      const myFiretailOpts = Object.assign({},firetailOpts)
      delete myFiretailOpts.addApi
      Object.assign(process.env,{ API_YAML:firetailOpts.addApi })
      firetailSetup(myFiretailOpts)
      delete process.env.API_YAML
      expect(true).toBe(true);

  }); // END test 'should work with process.env.API_YAML = YAML PATH'

  //+++++++++++++++++ should error if URL is not in YAML
  //++++++++++++++++++++++++++++++++++++++++++++++++++++

    test('should error if URL is not in YAML', (done) => {

      let optId_called = false
      let app_called   = false
      const next = ()=>{ app_called = true }

      const myFiretailOpts = Object.assign({},firetailOpts)
            myFiretailOpts.dev = true
      const res = genRes({
        end:()=>{
          expect(res.statusCode).toBe(404);
          done()
        }
      })
      const firetailMiddleware = firetailSetup(myFiretailOpts)
            firetailMiddleware(genReq({
              originalUrl:"/something"
            }),res , next)

  }); // END test 'should error if URL is not in YAML'

})
//=====================================================
//====================================== test GET calls
//=====================================================

describe('test Firetail:Express', () => {

//++++++++++++++++ should error if Verb is not in YAML
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should error if Verb is not in YAML', (done) => {

    let optId_called = false
    let app_called   = false
    const next = ()=>{ app_called = true }

    const myFiretailOpts = Object.assign({},firetailOpts)
          myFiretailOpts.dev = true
    const res = genRes({
      end:()=>{
        //console.log(res.__data)
        expect(res.statusCode).toBe(405);
        done()
      }
    })
    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(genReq({
            originalUrl:"/check_operationId_fn",
            method:"post",
          }),res , next)

}); // END test 'should error if URL is not in YAML'


//+++++++++++++++++++++++ should check url quary names
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should check url quary names', (done) => {

    let optId_called = false
    let app_called   = false
    const next = ()=>{ app_called = true }

    const myFiretailOpts = Object.assign({},firetailOpts)
          myFiretailOpts.dev = true
    const res = genRes({
      end:()=>{
      //  console.log(res.__data)
        expect(res.statusCode).toBe(400);
        done()
      }
    })
    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(genReq({
            originalUrl:"/check_quary?limits=12",
            query:{
              limits:12
            }
          }),res , next)

}); // END test 'should check url quary names'

//+++++++++++++++++++++++++ should check url quary val
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should check url quary val', (done) => {

    let optId_called = false
    let app_called   = false
    const next = ()=>{ app_called = true }

    const myFiretailOpts = Object.assign({},firetailOpts)
          myFiretailOpts.dev = true
    const res = genRes({
      end:()=>{
      //  console.log(res.__data)
        expect(res.statusCode).toBe(400);
        done()
      }
    })
    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(genReq({
            originalUrl:"/check_quary?limit=no",
            query:{
              limit:"no"
            }
          }),res , next)

}); // END test 'should error if URL is not in YAML'

//+++++++++++++++++++++++++ should check missing quary
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should check missing quary', (done) => {

    let optId_called = false
    let app_called   = false
    const next = ()=>{ app_called = true }

    const myFiretailOpts = Object.assign({},firetailOpts)
          myFiretailOpts.dev = true
    const res = genRes({
      end:()=>{
      //  console.log(res.__data)
        expect(res.statusCode).toBe(400);
        done()
      }
    })
    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(genReq({
            originalUrl:"/check_quary"
          }),res , next)

}); // END test 'should check missing quary'


//+++++++++++ should lookup "operationId" ~ nasted obj
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should lookup "operationId" ~ nasted obj', (done) => {

    let optId_called = false
    let app_called   = false
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
    const res = genRes({
      end:()=>{
        expect(optId_called).toBe(true);
        expect(app_called).toBe(false);
        done()
      }
    })
    const firetailMiddleware = firetailSetup(myFiretailOpts)
          firetailMiddleware(genReq({
            originalUrl:"/check_operationId_fn"
          }),res , next)

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


//++++++ should process bad fragments + bad query ~ OK
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  test('should process bad fragments + bad query ~ OK', (done) => {

        let optId_called = false
        let app_called = false
        const next = ()=>{ app_called = true }

        const vals = {
          fVal2:"1",
          limit:"3",
          marker:undefined
        }

        const myFiretailOpts = Object.assign({},firetailOpts)
        myFiretailOpts.operations = {
          dev:true,
          "check_bad_frag_query":(req,res)=>{
            //console.log("------ 1",req.params,req.query,vals)
            optId_called = true
            res.send()
            res.end()
           } // END "optId.basic"
        } // END myFiretailOpts.operations

        const req = genReq({
            originalUrl:`/check_bad/${vals.fVal2}/withquery?limit=${vals.limit}`,
            query:{
              limit:vals.limit
            }
          })
        const res = genRes({
          end:()=>{
            //console.log(res)
            expect(optId_called).toBe(true);
            expect(app_called).toBe(false);
            done()
          }
        })
        firetailSetup(myFiretailOpts)(req,res, next)

  }); // END test 'should process fragments'

  //++++++ should process bad fragments + bad query ~ OK
  //++++++++++++++++++++++++++++++++++++++++++++++++++++

    test('should process bad fragments + query', (done) => {

          let optId_called = false
          let app_called = false
          const next = ()=>{ app_called = true }

          const vals = {
            fVal2:"asd",
            limit:"3",
            marker:undefined
          }

          const myFiretailOpts = Object.assign({},firetailOpts)
          myFiretailOpts.operations = {
            "check_bad_frag_query":(req,res)=>{} // END "optId.basic"
          } // END myFiretailOpts.operations

          const req = genReq({
              originalUrl:`/check_bad/${vals.fVal2}/withquery?limit=${vals.limit}`,
              query:{
                limit:vals.limit
              }
            })
          const res = genRes({
            end:()=>{
              expect(optId_called).toBe(false);
              expect(app_called).toBe(false);
              done()
            }
          })
          firetailSetup(myFiretailOpts)(req,res, next)

    }); // END test 'should process fragments'

      //++++++ should process bad fragments + bad query ~ OK
      //++++++++++++++++++++++++++++++++++++++++++++++++++++

        test('should process bad fragments + bad query', (done) => {

              let optId_called = false
              let app_called = false
              const next = ()=>{ app_called = true }

              const vals = {
                fVal2:"1s",
                limit:"3s",
                marker:undefined
              }

              const myFiretailOpts = Object.assign({},firetailOpts)
              myFiretailOpts.operations = {
                "check_bad_frag_query":(req,res)=>{} // END "optId.basic"
              } // END myFiretailOpts.operations

              const req = genReq({
                  originalUrl:`/check_bad/${vals.fVal2}/withquery?limit=${vals.limit}`,
                  query:{
                    limit:vals.limit
                  }
                })
              const res = genRes({
                end:()=>{
                  expect(optId_called).toBe(false);
                  expect(app_called).toBe(false);
                  done()
                }
              })
              firetailSetup(myFiretailOpts)(req,res, next)

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
      "check_frag_query":(req,res)=>{
        //console.log("------ 1",req.params,req.query,vals)
          optId_called = true
          expect(req.params.fragmentVal2).toBe(vals.fVal2);
          expect(req.query.limit).toBe(+vals.limit);
          expect(req.query.marker).toBe(vals.marker);
            //console.log("------ 2")
          res.send()
          res.end()
          //  console.log("------ 3")
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
      "check_frag_query":(req,res)=>{
          optId_called = true
          expect(req.params.fragmentVal2).toBe(vals.fragmentVal2);
          expect(req.query.limit).toBe(+vals.limit);
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

//+++++++++++++++++++++++++ should check response body
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    test('should check response body', (done) => {
      let optId_called = false
      let app_called   = false
      const next = ()=>{ app_called = true }

      const data = [{id:1,name:"bob",role:"admin"}]

      const myFiretailOpts = Object.assign({},firetailOpts)
            myFiretailOpts.operations = {
              getUsers:(req,res)=>{
                  res.setHeader("content-type","application/json")
                     .json(data)
                } // END getUsers
            } // myFiretailOpts.operations
      const res = genRes({
        end:()=>{
          expect(res.__data).toEqual(data);
          done()
        }
      })
      const firetailMiddleware = firetailSetup(myFiretailOpts)
            firetailMiddleware(genReq({
              originalUrl:"/check_body"
            }),res , next)
    })

//+++++++++++++++++++++++++ should check response body
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    test('should check post body', (done) => {

        let optId_called = false
        let app_called   = false
        const next = ()=>{ app_called = true }

        const data = {name:"ann",role:"basic"}

        const myFiretailOpts = Object.assign({},firetailOpts)
              myFiretailOpts.operations = {
                dev:true,
                createUser:(req,res)=>{
                    res.status(201).json({...req.body,id:100})
                  } // END getUsers
              } // myFiretailOpts.operations
        const res = genRes({
          end:()=>{
            expect(res.__data).toEqual({...data,id:100});
            done()
          }
        })
        const firetailMiddleware = firetailSetup(myFiretailOpts)
              firetailMiddleware(genReq({
                originalUrl:"/check_body",
                method:"post",
                headers:{
                  "content-type":"application/json",
                },
                body:JSON.stringify(data)
              }),res , next)
    })



}); // END describe 'test GET requests'



//=====================================================
//====================================== test GET calls
//=====================================================

describe('test Firetail:Serverless', () => {


    test('should work with lambda function url', (done) => {

      const myFiretailOpts = {dev:true,lambda:true, addApi:"./petstore.yaml"}
      const firetailWrapper = firetailSetup(myFiretailOpts)

      const next = firetailWrapper((event) => {
        const statusCode = 200
        if(event.queryStringParameters
        && event.queryStringParameters.limit){
          return {
            statusCode,
            body: JSON.stringify(data.slice(0, event.queryStringParameters.limit)),
          };
        }
        return {
          statusCode,
          body: JSON.stringify(data),
        };
      });

      const cLog = console.log

      console.log = (txt)=>{
        //cLog(txt,new Error().stack)
        expect(txt.startsWith("firetail:log-ext:")).toBe(true);
      }
      next(Serverless_Events["lambda function url"])
      .then((a)=>{
        //cLog(a)
        const  {statusCode,body} = a
        expect(statusCode).toBe(200);
        expect(body).toBe('[{"id":1,"name":"Bubbles","tag":"fish"},'+
                           '{"id":2,"name":"Jax","tag":"cat"},'+
                           '{"id":3,"name":"Tiger Lily","tag":"cat"},'+
                           '{"id":4,"name":"Buzz","tag":"dog"},'+
                           '{"id":5,"name":"Duke"}]')
        return next(Serverless_Events["api Gateway Proxy Event"])
      }).then(({statusCode,body})=>{
          expect(statusCode).toBe(200);
          expect(body).toBe('[{"id":1,"name":"Bubbles","tag":"fish"},'+
                             '{"id":2,"name":"Jax","tag":"cat"}]')
        console.log = cLog.bind(console)
        done()
      })

    })
})

//=====================================================
//========================================= test secure
//=====================================================

describe('test secure in requests', () => {

    test('should reject if JWT is missing', (done) => {

        let verifier_called = false
        let basic_called = false
        const next = ()=>{ basic_called = true }

        const myFiretailOpts = Object.assign({dev:true},firetailOpts)
        myFiretailOpts.operations = {
          app:{
            jwt_basic:next,
            jwt_verifier:(header)=>{ verifier_called = true } // END app
          } // END operations
        } // END myFiretailOpts.operations

        const res = genRes({
          end:()=>{
            // check status code is 401
            expect(res.statusCode).toBe(401);
            //check message
            expect(res.__data.title).toBe("No authorization token provided");

            expect(verifier_called).toBe(false);
            expect(   basic_called).toBe(false);
            done()
          }
        })

        const firetailMiddleware = firetailSetup(myFiretailOpts)
              firetailMiddleware(genReq({
                originalUrl:"/check/security/jwt"
              }),res , next)

    })
    test('should reject if JWT is a bad value', (done) => {

        let verifier_called = false
        let basic_called = false
        const next = ()=>{ basic_called = true }

        const myFiretailOpts = Object.assign({dev:true},firetailOpts)

        myFiretailOpts.authCallbacks = {
          jwt:(authorization)=>{
            verifier_called = true
          }
        }, // END securities
        myFiretailOpts.operations = {
          app:{
            jwt_basic:next
          }
        } // END operations

        const res = genRes({
          end:()=>{
            // check status code is 401
            expect(res.statusCode).toBe(401);
            //check message
            expect(res.__data.title).toBe("token dont not start with 'bearer: '");

            expect(verifier_called).toBe(false);
            expect(   basic_called).toBe(false);
            done()
          } // END end
        }) // END genRes

        const firetailMiddleware = firetailSetup(myFiretailOpts)
              firetailMiddleware(genReq({
                headers:{
                  authorization:"..."
                },
                originalUrl:"/check/security/jwt"
              }),res , next)
    })
    test('should reject if clients JWT function throws', (done) => {

          let verifier_called = false
          let basic_called = false
          const next = ()=>{ basic_called = true }

          const myFiretailOpts = Object.assign({dev:true},firetailOpts)
                myFiretailOpts.operations = {
                  jwt_basic:next
                } // END myFiretailOpts.operations

                myFiretailOpts.authCallbacks = {
                  jwt:({authorization,token,scope},headers)=>{
                    expect(token).toBe("...");
                    throw new Error("bad value")
                  }
                } // END securities

          const res = genRes({
            end:()=>{
              // check status code is 401
              expect(res.statusCode).toBe(401);
              //check message
              expect(res.__data.title).toBe('Security Function "http" failed with:bad value');

              expect(verifier_called).toBe(false);
              expect(   basic_called).toBe(false);
              done()
            } // END end
          }) // END genRes

          const firetailMiddleware = firetailSetup(myFiretailOpts)
                firetailMiddleware(genReq({
                  headers:{
                    authorization:"Bearer: ..."
                  },
                  originalUrl:"/check/security/jwt"
                }),res , next)
    })
    test('should reject if clients JWT function done not return a decoded object', (done) => {

          let verifier_called = false
          let basic_called = false
          const next = ()=>{ basic_called = true }

          const myFiretailOpts = Object.assign({dev:true},firetailOpts)

          myFiretailOpts.operations = {
            app:{jwt_basic:next}
          } // END myFiretailOpts.operations

          myFiretailOpts.authCallbacks = {
            jwt:(vals)=>{
              return 123
            }
          } // END securities

          const res = genRes({
            end:()=>{
              // check status code is 401
              expect(res.statusCode).toBe(401);
              //check message
              expect(res.__data.title).toBe("The JWT parce function did not return an oject");

              expect(verifier_called).toBe(false);
              expect(   basic_called).toBe(false);
              done()
            } // END end
          }) // END genRes

          const firetailMiddleware = firetailSetup(myFiretailOpts)
                firetailMiddleware(genReq({
                  headers:{
                    authorization:"Bearer: ..."
                  },
                  originalUrl:"/check/security/jwt"
                }),res , next)
    })
    test.skip('should throwing if clients JWT function is missing', () => {
          const myFiretailOpts = Object.assign({dev:true},firetailOpts)
                myFiretailOpts.operations = {
                  app:{
                    jwt_basic:()=>{}
                  } // END operations
                } // END myFiretailOpts.operations
            const firetailMiddleware = firetailSetup(myFiretailOpts)
    })
    test('should return decoded object from clients JWT function', (done) => {
      let verifier_called = false
      let basic_called = false
      let jwt;
      const next = (req,res)=>{
        jwt = req.jwt
        basic_called = true
        res.send("ok")
           .end()
      }

      const myFiretailOpts = Object.assign({},firetailOpts)
            myFiretailOpts.operations = {
              app:{
                jwt_basic:next
              } // END operations
            } // END myFiretailOpts.operations

            myFiretailOpts.authCallbacks = {
              jwt:(vals,header)=>{
                verifier_called = true
                return {
                    sub : "1234567890",
                   name : "John Doe",
                  admin : true
                }
              }
            }

      const res = genRes({
        end:()=>{
          // check status code is 401
          expect(res.statusCode).toBe(200);

          expect(jwt.sub).toBe("1234567890");
          expect(jwt.name).toBe("John Doe");
          expect(jwt.admin).toBe(true);
          expect(verifier_called).toBe(true);
          expect(   basic_called).toBe(true);
          done()
        } // END end
      }) // END genRes

      const firetailMiddleware = firetailSetup(myFiretailOpts)
            firetailMiddleware(genReq({
              headers:{
                authorization:"Bearer: ..."
              },
              originalUrl:"/check/security/jwt"
            }),res , next)
    })
    test('should return decoded object from clients ApiKey function', (done) => {
      let verifier_called = false
      let basic_called = false
      let jwt;
      const next = (req,res)=>{
        jwt = req.jwt
        basic_called = true
        res.send("ok")
           .end()
      }

      const myFiretailOpts = Object.assign({},firetailOpts)
      myFiretailOpts.operations = {
        app:{
          jwt_basic:next
        } // END operations
      } // END myFiretailOpts.operations

      myFiretailOpts.authCallbacks = {
        jwt:({token,scope}, headers)=>{
          verifier_called = true
          return {
              sub : "1234567890",
             name : "John Doe",
            admin : true
          }
        } // END app
      }
      const res = genRes({
        end:()=>{
          // check status code is 401
          expect(res.statusCode).toBe(200);

          expect(jwt.sub).toBe("1234567890");
          expect(jwt.name).toBe("John Doe");
          expect(jwt.admin).toBe(true);
          expect(verifier_called).toBe(true);
          expect(   basic_called).toBe(true);
          done()
        } // END end
      }) // END genRes

      const firetailMiddleware = firetailSetup(myFiretailOpts)
            firetailMiddleware(genReq({
              headers:{
                authorization:"Bearer: ..."
              },
              originalUrl:"/check/security/jwt"
            }),res , next)
    })

 })


 //=====================================================
 //========================================= test Lang
 //=====================================================

 describe('test developer messages', () => {

     test('should reject if JWT is missing', () => {
       let temp = false;
       for(const groupName in errMessages){
         for(const firetailTag in errMessages[groupName]){
           const message = errMessages[groupName][firetailTag]
           if("function" === typeof message){
              if("notFound" === firetailTag)
                temp = message({url:"/",verb:"GET",scamaForEndPoint:{a:1,b:2}})
              else
                temp = message({})
           } else {
              temp = message
           }
         }
         expect(!!temp).toBe(true);
       }
     })
})
