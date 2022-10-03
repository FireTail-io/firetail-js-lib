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
    console.log(this.attrs.yaml)
    Html``
    Html`<table style=${{minWidth: "100%"}}>
  <tbody>
    <tr>
      <td style=${{width: "50%"}}>
        <my-list a=${()=>{}}
               yaml=${this.attrs.yaml}/></td>
      <td style=${{width: "50%"}}>
        <my-call></my-call>
        </td>
    </tr>
  </tbody>
</table>`
  }// END render

})// END my-body

window.customElements.define("my-list", class extends hyperElement{

  pathEntry(Html,{path,meta}){
    console.log(path,meta)
    return Html.wire(meta,"yaml_list")`<div style=${{
border: "1px solid lightgray",
padding: 5,
margin: 3,
borderRadius: 5,
cursor: "pointer"
    }}

    onclick=${()=>myStore.push("selectedUrl",path)}>

    <span style=${{fontWeight:"bold"}}>${
      path
    }</span>
    <span style=${{fontWeight:"bold", color:"lightgray", float: "right"}}>${
      meta.get.summary
    }</span></div>`
  }

  render(Html){
    console.log(this.attrs.yaml)
    Html`<span>${
      this.attrs.yaml
                .map(item=>this.pathEntry(Html,item))
    }</span>`
  }// END render

})// END my-list
window.customElements.define("my-call", class extends hyperElement{


    setup(attachStore){
      let state = {url:"",req:null}
      const onStorHasUpdated = attachStore(()=> state)

    myStore.on("selectedUrl",path => {
        state.url = path
        state.req = null
        onStorHasUpdated()
      });
      myStore.on("reply",req => {
        state.req = req
        onStorHasUpdated()
      });
    }//END setup

  render(Html,{url,req}){
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
                    fetch(url)
                      .then(response => response.text())
                      .then(data => {
                        try{
                          data = JSON.parse(data)
                        }catch(err){

                        }
                        myStore.push("reply",data)
                      })
                  }}>GET</button></td>
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
          ${url}</td>
      </tr>
</thead>
  <tbody>
    <tr>
      <td style=${{width: "50%"}}>
        ${JSON.stringify(req)}</td>
    </tr>
  </tbody>
</table>`
  }// END render

})// END my-call

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
    if(myStore.callbacks[tag])
    myStore.callbacks[tag]
        .forEach(cb=>cb(data))
  },
  //pull:(tag)=>()=>myStore.callbacks[tag]
}

fetch("/firetail/apis.json")
  .then(response => response.json())
  .then(data => {
    myStore.push("yaml",
                  Object.keys(data)
                        .map(path =>({path,meta:data[path]})))
  });
