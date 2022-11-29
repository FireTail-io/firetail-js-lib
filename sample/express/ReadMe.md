# Petstore Express.js Example

This is a kitchen sink style example of how to integrate [Firetail](https://www.npmjs.com/package/@public.firetail.io/firetail-api) into an existing Express framework Project.

## To get started

Clone this repository
```cli
git clone git@github.com:FireTail-io/firetail-js-lib.git
cd firetail-js-lib/sample/express
```
Now we can install the samples dependencies
```cli
npm install
```
Now you can start the server
```cli
npm start
```

## Try it out
Now that the server is started. Open a browser and go to **http://localhost:3001**

## structure
```
express/
├── api/                ← 'api' is a hierarchy of files that map to operation IDs
│   ├── showPet/        ← Controllers under will to have the prefix "showPet."
│   │   └── byId.js     ← Controllers with the name "showPet.byId"
│   └── createPets.js   ← Controllers with the name "createPets"
└── animals.json        ← Sample data to be use
├── package.json        ← Project and Firetail configuration
├── petstore.yaml       ← The open API specification that this service will a here too
└── server.js           ← Entry point and wiring for the service
```


### We can try some different types of requests
* *it's recommended when testing an API to use a tool such as [postman](https://www.postman.com/)*

#### Use **operations** to map a controller to your opanAPI spec | **[GET: /](http://localhost:3001/)**
This endpoint list all pets. You can find the implementation at [server.js ~ function listPets](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/server.js#L22). It is load via the [operations](https://github.com/FireTail-io/firetail-js-lib#operations) on [server.js ~ firetailOpts](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/server.js#L78)

#### Use **specificationDir** to map a controller to your opanAPI spec | **[POST: /](http://localhost:3001/)**
```js
fetch('http://localhost:3001/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ "name": "Mr Beast", "tag": "dog" })
})
.then((response) => response.json())
.then((data) => console.log('Success:', data))
.catch((error) => console.error('Error:', error));
```
This endpoint list all pets. You can find the implementation at [server.js ~ function listPets](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/server.js#L22). It is load via the [operations](https://github.com/FireTail-io/firetail-js-lib#operations) on [server.js ~ firetailOpts](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/server.js#L78)
