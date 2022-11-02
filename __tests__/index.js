const firetailSetup = require("../dist");
const firetailOpts = {addApi:"./cases.yaml", testing:true}

/*

var testSet = []

testSet.push({
	result:{
  	params:{
    	b:"xx"
    },
    path:"/a/{b}"
  },
  url : "/a/xx",
  yamlPaths : ["/a/{b}"]
})

testSet.push({
	result:null,
  url : "/bar",
  yamlPaths : ["/foo"]
})

testSet.push({
	result:null,
  url : "/a",
  yamlPaths : ["/a/{b}"]
})

testSet.push({
	result:null,
  url : "/a/b",
  yamlPaths : ["/a"]
})

testSet.push({
	result:{
  	params:{
    	b:"foo",
      d:"at"
    },
    path:"/a/{b}/c{d}"
  },
  url : "/a/foo/cat",
  yamlPaths : ["/z","/c/{b}","/a/{b}/c{d}","/abc"]
})

testSet.push({
	result:{
  	params:{
    	b:"xx",
      d:"at"
    },
    path:"/a/{b}/c{d}/e"
  },
  url : "/a/xx/cat/e",
  yamlPaths : ["/z","/c/{b}","/a/{b}/c{d}/e","/abc"]
})

testSet.push({
	result:{
  	params:{
    	org_uuid:"ORGID",
      app_uuid:"APPID"
    },
    path:"/organisations/{org_uuid}/applications/{app_uuid}/apis"
  },
  url : "/organisations/ORGID/applications/APPID/apis",
	yamlPaths : [
    "/organisations/{org_uuid}/applications",
  	"/organisations/{org_uuid}/applications/{app_uuid}",
    "/organisations/{org_uuid}/applications/{app_uuid}/apis",
    "/organisations/{org_uuid}/applications/{app_uuid}/apis/{api_uuid}",
    "/organisations/{org_uuid}/applications/{app_uuid}/apis/{api_uuid}/tokens",
    "/organisations/{org_uuid}/applications/{app_uuid}/apis/{api_uuid}/requests"
  ]
})

testSet.push({
	result:{
  	params:{
    	org_uuid:"ORGID"
    },
    path:"/organisations/{org_uuid}/integrations/available"
  },
  url : "/organisations/ORGID/integrations/available",
	yamlPaths : [
    "/organisations/{org_uuid}/integrations/available",
  	"/organisations/{org_uuid}/integrations/{customer_integration_uuid}"
  ]
})

testSet.push({
	result:null,
  url : "/organisations/ORGID/integrations/available/foo",
	yamlPaths : [
    "/organisations/{org_uuid}/integrations/available",
  	"/organisations/{org_uuid}/integrations/{customer_integration_uuid}"
  ]
})

*/

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
   accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
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
     return res
   },
   send:(x)=>{
     res.__data = x;
     return res
   },
   json:(x)=>{
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
      "check_frag_query":(req,res)=>{
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
      "check_frag_query":(req,res)=>{
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
            expect(res.__data.message).toBe("No authorization token provided");

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

        myFiretailOpts.securities = {
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
            expect(res.__data.message).toBe("token dont not start with 'bearer: '");

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

                myFiretailOpts.securities = {
                  jwt:(authorization)=>{
                    expect(authorization).toBe("...");
                    throw new Error("bad value")
                  }
                } // END securities

          const res = genRes({
            end:()=>{
              // check status code is 401
              expect(res.statusCode).toBe(401);
              //check message
              expect(res.__data.message).toBe("bad value");

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

          myFiretailOpts.securities = {
            jwt:(authorization)=>{
              return 123
            }
          } // END securities

          const res = genRes({
            end:()=>{
              // check status code is 401
              expect(res.statusCode).toBe(401);
              //check message
              expect(res.__data.message).toBe("The JWT parce function did not return an oject");

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

            myFiretailOpts.securities = {
              jwt:(header)=>{
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

      myFiretailOpts.securities = {
        jwt:(token, required_scopes)=>{
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
