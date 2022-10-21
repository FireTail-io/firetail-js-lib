var ver = "1.1";
var fireTailLogger = console.log;
function input(reqIn, resIn) {
    var meta = { /*
        path:  "/product/{pid}"//as in yaml
        optId: "app.product.lookup"//as in yaml
        associated : "riley@pointsec.io", //associated_user
        processType : "api_log", //process-type
        exeTime: 6453// total in millasec
        recivedAt: "2022-09-09T08:43:32"
        completedAt: "2022-09-09T08:43:34",
      */};
    var uuids = { /*
        "org" : "9b563f11-062f-4d5d-996b-46c8e79d2f56",
        "api" : "3cd009bd-401f-4882-b6f8-89342a7cd69f",
        "app" : "ac889197-d3da-4271-9324-ccf98a6b1a8c",
        "token" : "d017e001-d559-4cbf-88e6-a92489c24fd8",
      */};
    var oauth = { /*
        "sub" : "123"
    */};
    var req = { /*
          url:// = "http://127.0.0.1:8080/product/1234?color=@red"
          endpoint: "/products/1234"
          "method": , "get"// String/Enum
          "headers": , // OBJ
          "pathQuery": : {
            color : "red"
          }
          'pathParams': {
            pid : 1234
          },
          'body': null// post or form <--
          "ip": "127.0.0.1"// String
      */};
    var res = { /*
         "status": //status_code,
         "length"://"content_len": response.content_length,
         "encoding"://"content_enc": response.content_encoding,
         "body": response.get_json() if response.is_json else response.response,
         "headers": dict(response.headers),
         "type"://"content_type": response.content_type
      */};
    meta.uuids = uuids;
    var eventData = {
        ver: ver,
        meta: meta,
        oauth: oauth,
        req: req,
        res: res
    };
    return fireTailLogger(out(eventData));
}
function out(eventData) {
    /*
    payload = {
          "version": "1.1",
          "dateCreated": int((datetime.datetime.utcnow()).timestamp() * 1000),
          "execution_time": diff,
          "source_code": sys.version,
          "req": {
              "httpProtocol": request.environ.get('SERVER_PROTOCOL', "HTTP/1.1"),
              "url": request.base_url,
              "headers": dict(request.headers),
              "path": request.path,
              "method": request.method,
              "oPath": request.url_rule.rule if request.url_rule is not None else request.path,
              "fPath": request.full_path,
              "args": dict(request.args),
              "body": str(request.data),
              "ip": request.remote_addr,
              'pathParams': request.view_args
  
          },
          "resp": {
              "status_code": response.status_code,
              "content_len": response.content_length,
              "content_enc": response.content_encoding,
              "failed_res_body": failed_res_body,
              "body": response_data,
              "headers": dict(response.headers),
              "content_type": response.content_type
          }
      }
  
    {
        'version': '1.1',
        'dateCreated': 1664532493721,
        'execution_time': 1.39,
        'req': {
            'httpProtocol': 'HTTP/1.1',
            'url': 'http://127.0.0.1:8080/products/1',
            'headers': {
                'Host': '127.0.0.1:8080',
                'Connection': 'keep-alive',
                'Sec-Ch-Ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
                'Authorization': 'sha1:b8ef64db206f2a9789e3bc8b98ff9eee30deabed',
                'Cache-Control': 'no-cache',
                'Sec-Ch-Ua-Mobile': '?0',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Accept': '* / *',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
            },
            'path': '/products/1',
            'method': 'GET',
            'oPath': '/products/<product_id>',
            'fPath': '/products/1?',
            'args': {},
            'ip': '127.0.0.1',
            'body': "b''",
            'pathParams': {
                'product_id': '1'
            }
        },
        'resp': {
            'status_code': 200,
            'content_len': 332,
            'content_enc': None,
            'failed_res_body': False,
            'body': {
                'category': 'clothing',
                'description': 'Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve, your everyday',
                'id': 1,
                'price': 109.95,
                'rating': {
                    'count': 120,
                    'rate': 3.9
                },
                'title': 'Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops'
            },
            'headers': {
                'Content-Type': 'application/json',
                'Content-Length': '332'
            },
            'content_type': 'application/json'
        },
        'oauth': {
            'sub': 'user@firetail.io'
        }
    }
    */
}
