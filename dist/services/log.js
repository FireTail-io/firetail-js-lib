var ver = "1.1";
var fireTailLogger = console.log;
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
//# sourceMappingURL=log.js.map