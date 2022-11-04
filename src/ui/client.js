/*
class APerson extends hyperElement{

  onClick(){
    this.attrs.hi("Hello from "+this.attrs.name)
  } // note/helper : fucntion automatically have the element "this" bound

  render(Html){
    Html`${this.attrs.name} <button onclick=${this.onClick}>Say hi! ${ this.attrs.yaml[0].path }</button>`
  }
}

class MyApp extends hyperElement{
  onHi(val){
    alert(val)
  }
  render(Html){
    const yaml = [{path:"foo",data:{}}]
    Html`<div><a-person x=${()=>{}} yaml=${yaml}/></div>`
  }
}
window.customElements.define("a-person", APerson)
window.customElements.define("my-app", MyApp)


*/
//=====================================================
//============================================== Header
//=====================================================

window.customElements.define("my-header", class extends hyperElement{

  render(Html){
    Html`<div style=${{
      marginBottom: "10px",
      borderRadius: "10px",
      padding: "10px",
      boxShadow: "rgb(121 117 117) 1px 1px 5px 1px",
      background: "linear-gradient(90deg, rgba(7,31,32,1) 0%, rgba(17,72,75,1) 100%)"
  }}><img style=${{height: "40px"}}
  src="https://uploads-ssl.webflow.com/62b077764e7780df74b8ff3f/62bb65f1b1d2d8ebe1334475_Logo_Text_Right.png"
  alt="FireTail"></img></div>`
  }// END render

})// END my-header

//=====================================================
//================================================ Body
//=====================================================

window.customElements.define("my-body", class extends hyperElement{

  render(Html,x){

    const cellStyle = {
      flexBasis: "50%",
      maxWidth: "50%"
    }
  //  console.log(this.attrs.yaml)
    Html``
    Html`<table style=${{minWidth: "100%"}}>
  <tbody>
    <tr>
      <td style=${{width: "50%"}} valign="top">
        <my-list a=${()=>{}}
               yaml=${this.attrs.yaml}/></td>
      <td style=${{width: "50%"}} valign="top">
        <my-call></my-call>
        </td>
    </tr>
  </tbody>
</table>`
  }// END render

})// END my-body

window.customElements.define("my-list", class extends hyperElement{

  pathEntry(Html,{path,meta}){
  //  console.log(path,meta)
    return Html.wire(meta,"yaml_list")`<div style=${{
      border: "1px solid lightgray",
      padding: 5,
      margin: 3,
      borderRadius: 5,
      cursor: "pointer"
    }}

    onclick=${()=>myStore.push("selectedPath",path)}>

    <span style=${{fontWeight:"bold"}}>${
      path
    }</span>
    <span style=${{fontWeight:"bold", color:"lightgray", float: "right"}}>${
      meta.get.summary
    }</span></div>`
  }

  render(Html){
  //  console.log(this.attrs.yaml)
    Html`<span>${
      this.attrs.yaml
                .map(item=>this.pathEntry(Html,item))
    }</span>`
  }// END render

})// END my-list
window.customElements.define("my-call", class extends hyperElement{


    setup(attachStore){
      let state = {path:"",url:"",req:null}
      const onStorHasUpdated = attachStore(()=> state)

    myStore.on("selectedPath",path => {
        state.path = path
        state.url = path
        state.req = null
        onStorHasUpdated()
      });
      myStore.on("reply",req => {
        state.req = req
        onStorHasUpdated()
      });
      myStore.on("selectedUrl",url => {
        state.url = url
        onStorHasUpdated()
      });
    }//END setup

    presentMessage(){
      return {
          template:`<div>
            <div>{label}</div>
            <div>{body}</div>
          </div>`
        }// END return

    }

  render(Html,{path,url,req}){
  //  console.log({url,req})
/*
    let reqBody = []

    if(req){
      if(req.error){
        if(req.error.prod){
        reqBody.push(  Html.wire(req.error.prod,":prod")`<div>
                                              <div>Production error message</div>
                                              <div>${JSON.stringify(req.error.prod)}</div>
                                            </div>` )
        }
        if(req.error.dev){
        reqBody.push(  Html.wire(req.error.dev,":dev")`<div>
                                            <div>Development error message</div>
                                            <div>${JSON.stringify(req.error.dev)}</div>
                                          </div>` )
        }
      } else {
        reqBody.push( req.json && JSON.stringify(req.json) || req.text )
      }
    }
  console.log(reqBody)

console.log(req && req.error && req.error.dev ? Html.lite`<div>
                                                <div>Development error message</div>
                                                <div>${JSON.stringify(req.error.dev)}</div>
                                              </div>` : "")
*/
    Html`<table style=${{
      border: "1px solid lightgray",
      padding: 5,
      margin: 3,
      borderRadius: 5
    }}>
  <thead>
    <tr>
      <td><button style=${{cursor: "pointer"}}
                  onclick=${()=>{
                  //  console.log("fetch START",url)
                    fetch(url)
                      .then(response => {

                    //      console.log("fetch READY 1",response)
                        return response.text().then(data => {

                      //      console.log("fetch READY 2")
                          const reqMetaData = {
                            text:data,
                            json:null,
                            status: response.status,
                            error: {
                              dev:null,
                              prod:null
                            }
                          }

                          try{
                            const json = JSON.parse(data)
                          //  debugger
                            reqMetaData.json = json
                            //console.log(`${response.status} >= 400`,response.status >= 400)
                            if(response.status >= 400){
                                 if(json.error){
                                   reqMetaData.error.dev = json.error
                                 }
                                   delete json.error
                                   reqMetaData.error.prod = json

                            } else {
                              reqMetaData.error = null
                            }

                          }catch(err){
                              reqMetaData.error = null
                            //  console.error(err)
                          }
                        //  console.log(reqMetaData)
                          myStore.push("reply",reqMetaData)
                        })
                      })
                      .catch(err=>console.error(err))

                  }}
                  disabled=${!url}>GET</button></td>
      <td><button disabled>POST</button></td>
      <td><button disabled>PUT</button></td>
      <td><button disabled>PATCH</button></td>
      <td><button disabled>DEL</button></td>
    </tr>
      <tr>
        <td style=${{
          border: "1px solid lightgray",
          padding: 5,
          margin: 3,
          borderRadius: 5}}
           colspan="5">
           <label for="fname">${path||"Path"}</label>
  <input type="text"
         value=${url}
         onkeydown=${({key,srcElement})=>{
           setTimeout(()=>{
             myStore.push("selectedUrl",srcElement.value)
           },0)

          // console.log(key,srcElement.value)
         }}
         disabled=${!url}/>
  ${req ? req.status + " - " + (req.status < 400 ? "✔":"✘") : ""}
          </td>
      </tr>
</thead>
  <tbody>
    <tr>
      <td style=${{width: "50%"}} colspan="5">
        <div style=${{ display: req && req.error && req.error.prod ? "contents" : "none"}}>
          <div style=${{ color: "red", fontWeight: "bold", marginBottom: 5}}>Production error message</div>
          <div style=${{ border: "1px solid lightgray", padding: 5, margin: 3, borderRadius: 5}}>${
            req && req.error && req.error.prod ?JSON.stringify(req.error.prod):""
          }</div>
        </div>
        <div style=${{ display: req && req.error && req.error.dev ? "contents" : "none"}}>
          <div style=${{ color: "blue", fontWeight: "bold", marginBottom: 5}}>Development error message</div>
          <div style=${{ border: "1px solid lightgray", padding: 5, margin: 3, borderRadius: 5}}>${
            req && req.error && req.error.dev ?JSON.stringify(req.error.dev):""
          }</div>
        </div>

        <div style=${{ display: req && ! req.error ? "contents" : "none"}}>${
          req ? req.json ? JSON.stringify(req.json)
                         : req.text
              : ""
        }</div>
      </td>
    </tr>
  </tbody>
</table>`
  }// END render

})// END my-call
/*
<td style=${{width: "50%"}}>${
  req && req.error && req.error.prod ? Html.wire(req.error.prod,":prod")`<div>
                                            <div>Production error message</div>
                                            <div>${JSON.stringify(req.error.prod)}</div>
                                          </div>` : ""
}${
  req && req.error && req.error.dev ? Html.wire(req.error.dev,":dev")`<div>
                                                  <div>Development error message</div>
                                                  <div>${JSON.stringify(req.error.dev)}</div>
                                                </div>` : ""
}${
  req && ! req.error ? req.json && JSON.stringify(req.json) || req.text : ""
}</td>
*/
//=====================================================
//================================================= App
//=====================================================

window.customElements.define("my-app", class extends hyperElement{

  setup(attachStore){
    let data = []
    const onStorHasUpdated = attachStore(()=> data)
    const onEventIn = yaml => {
      data = yaml
      onStorHasUpdated()
    }
    myStore.on("yaml",onEventIn);
  }//END setup

  render(Html,yaml){

    const pageStyle = {
        padding: "8px",
        fontFamily: "Mulish,sans-serif",
        minHeight: "100vh",
        boxShadow: "inset 5px 0px 15px 0px #00000045"
    }
    Html``
    Html`<div style=${pageStyle}>
          <my-header a=${()=>{}}/>
          <my-body yaml=${yaml}/>
        </div>`
  }// END render

})// END my-app


//=====================================================
//========================================== Data store
//=====================================================

const myStore = {
  callbacks:{},
  on:(tag,cb)=>{
    myStore.callbacks[tag] = myStore.callbacks[tag] || []
    myStore.callbacks[tag].push(cb)
  },
  push:(tag,data)=>{
  //  console.log(" ------>",tag,data)
    if(myStore.callbacks[tag])
    //setTimeout(()=>{
      myStore.callbacks[tag]
          .forEach(cb=>cb(data))
    //},0)

  },
  //pull:(tag)=>()=>myStore.callbacks[tag]
}

fetch("/firetail/apis.json")
  .then(response => response.json())
  .then(data => {
    myStore.push("yaml",
                  Object.keys(data)
                        .map(path =>({path,meta:data[path]})))
  }).catch(err=>console.error(err));
