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

for(let test of testSet){
	const {result, url, yamlPaths} = test;
  const output = matchUrl(url,yamlPaths)
  //console.log(JSON.stringify(output) ,JSON.stringify(result))
  if(isDeepEqual(output,result)){
  		console.log("PASSED",url)
  } else {
		console.log(output)
    console.log(result)
  	throw new Error("FALED!")
  }
}
console.log("-- ALL PASSED !! --")

function matchUrl(url /*: string*/, apiPaths/* : string[]*/) {

//++++++++++++++++++++++++++++ check each path in yaml
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  for(let pathIndex = 0;
  				pathIndex < apiPaths.length;
          pathIndex++){
    const apiPath = apiPaths[pathIndex]
    console.log("Checking",apiPath)

//+++++++++++++++++++++ dones this path have fragments
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  if(apiPath.includes("{")){
    let reduceUrl = url
    const params = {}
   // const positions = []
    let lastStep = null;

//+++++++++++++++++++++++++++++++++++++++++ Split path
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    // split yaml path - /a/{b}
    const pathFragments = apiPath.split(/\{|\}/gi)
    														  .filter(x=>x)

    //console.log("pathFragments",pathFragments)

    for(let fragmentIndex = 0;
    				fragmentIndex < pathFragments.length;
            fragmentIndex++){

      const fragment = pathFragments[fragmentIndex]

      //console.log({fragment,reduceUrl})

//+++++++++++++++++++++++++++++++ Skip for placeholder
//++++++++++++++++++++++++++++++++++++++++++++++++++++
      if(fragmentIndex % 2 == 1){
        if(fragmentIndex === pathFragments.length-1){
        	//debugger
          //console.log()
      		//const cutAt     = reduceUrl.indexOf(    fragment       )
      // console.log("A: ",fragment, reduceUrl)
        	params[fragment] = reduceUrl//.slice(cutAt,fragment.length)
        }
        lastStep.fragment = fragment
        continue;
      } // END if

      const start = reduceUrl.indexOf(fragment)
      const  end  = fragment.length

//++++++++++ If fragment was not found in remaning url
//++++++++++++++++++++++++++++++ try next path in list

      if(-1 === start){
      //console.log(start,fragment,reduceUrl)
      	break;
      } // END if

      // positions.push(start)

//++++++++++++++++++++ Process fragment from last step
//++++++++++++++++++++++++++++++++++++++++++++++++++++

      if(0 < fragmentIndex){
        // positions.push(end)
       // debugger


     //  console.log("B: ",lastStep.fragment, reduceUrl.slice(0,start))
        params[lastStep.fragment] = reduceUrl.slice(0,start)

       // CUT Placehold fragment from the previce step
        reduceUrl = reduceUrl.slice(start)

       // CUT fragment from URL for this step
       /*
        console.log("reduceUrl",reduceUrl)
        console.log("reduceUrl.slice(start)",reduceUrl.slice(start))
        console.log("reduceUrl.slice(start,end)",reduceUrl.slice(start,end))
        console.log("reduceUrl.slice(start,start+end)",reduceUrl.slice(start,start+end))
        console.log("reduceUrl.slice(0,end)",reduceUrl.slice(0,end))
        console.log("reduceUrl.slice(end)",reduceUrl.slice(end))
        */
        reduceUrl = reduceUrl.slice(end)

//++++++++++++++++++++++++ Else this is the first step
//++++++++++++++++++++++++++++++++++++++++++++++++++++

      } else {
      	//console.log({ start, end })
        reduceUrl = reduceUrl.slice(end)
      } // END else

      lastStep = { start, end }

    } // END for
		if(lastStep){
    	return {path:apiPath,params}
    }
   // console.log({positions,params})

//++++++++++++++++ exist match if the path is the same
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    } else if(url === apiPath){
      return {path:apiPath,params:{}};
    }

  } // END for apiPaths in YAML
  return null
} // END matchUrl

function isDeepEqual (object1, object2) {

	if(object1 === object2){
  	return true
  }

	if( ! object1
  ||  ! object2
  || typeof object1 !== typeof object2){
  	return false
  }

  const objKeys1 = Object.keys(object1);
  const objKeys2 = Object.keys(object2);

  if (objKeys1.length !== objKeys2.length) return false;

  for (var key of objKeys1) {
    const value1 = object1[key];
    const value2 = object2[key];

    const isObjects = isObject(value1) && isObject(value2);

    if ((isObjects && !isDeepEqual(value1, value2)) ||
      (!isObjects && value1 !== value2)
    ) {
      return false;
    }
  }
  return true;
};

function isObject (object) {
  return object != null && typeof object === "object";
};
