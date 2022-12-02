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

### Endpoints exposed
* GET: /pets ~ list all pets
* POST: /pets ~ Create a pet
* GET: /pets/{petId} ~ Retrieve a specific pet's details
* DELETE: /pets/{petId} ~ Remove a specific pet

Each end-point is implemented slightly differently to give you a demonstration of the different ways in which you can integrate Firetail.

---

#### Use **operations** to map a controller to your opanAPI spec | **[GET: /pets](http://localhost:3001/pets)**
This endpoint list all pets. You can find the implementation at [server.js ~ function listPets](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/server.js#L22). It is load via the [operations](https://github.com/FireTail-io/firetail-js-lib#operations) on [server.js ~ firetailOpts](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/server.js#L78)

---

#### Use **specificationDir** to map a controller to your opanAPI spec | **[POST: /pets](http://localhost:3001/pets)** + Api token
```js
fetch('http://localhost:3001/pets', {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  'X-Auth':'key'
  },
  body: JSON.stringify({ "name": "Mr Beast", "tag": "dog" })
})
.then((response) => response.json())
.then((data) => console.log('Success:', data))
.catch((error) => console.error('Error:', error));
```
This endpoint is to Create a pet. You can find the implementation at [api/createPets.js](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/api/createPets.js). It is load via the [specificationDir in package.json](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/package.json#L23).
This Endpoint is configured to require an API token. The security is connected in [petstore.yaml](https://github.com/FireTail-io/firetail-js-lib/blob/lamdba/sample/express/petstore.yaml#L45) with the token validation being implemented at [server.js ~ authCallbacks](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/server.js#L48)

---

#### Use nasted **specificationDir** to map a controller to your opanAPI spec | **[GET: /pets/{petId}](http://localhost:3001/pets/2)** + oauth2
```js
fetch('http://localhost:3001/pets/2', {
  method: 'GET',
  headers: {
  'authorization':'Bearer RsT5OjbzRn430zqMLgV3Ia'
  }
})
.then((response) => response.json())
.then((data) => console.log('Success:', data))
.catch((error) => console.error('Error:', error));
```
This endpoint retrieve specific pet based on the ID pass in the URL. You can find the implementation at [api/showPet/byId.js](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/api/showPet/byId.js). It is load via the [specificationDir in package.json](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/package.json#L23).
This Endpoint is configured to require an oAuth2 bearer token. The security is connected in [petstore.yaml](https://github.com/FireTail-io/firetail-js-lib/blob/lamdba/sample/express/petstore.yaml#L100) with the validation implemented at [server.js ~ authCallbacks](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/server.js#L61)

---

#### Use Express's native routing mechanism | **[DELETE: /pets/{petId}](http://localhost:3001/pets/2)** + JWT
```js
fetch('http://localhost:3001/pets/2', {
  method: 'DELETE',
  headers: {
  'authorization':"JWT " + token
  }
})
.then((response) => response.json())
.then((data) => console.log('Success:', data))
.catch((error) => console.error('Error:', error));
```

This endpoint retrieve specific pet based on the ID pass in the URL. You can find the implementation at [api/showPet/byId.js](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/api/showPet/byId.js). It is load via the [specificationDir in package.json](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/package.json#L23).
This Endpoint is configured to require an oAuth2 bearer token. The security is connected in [petstore.yaml](https://github.com/FireTail-io/firetail-js-lib/blob/lamdba/sample/express/petstore.yaml#L100) with the validation implemented at [server.js ~ authCallbacks](https://github.com/FireTail-io/firetail-js-lib/blob/main/sample/express/server.js#L61)
