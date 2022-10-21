let TEN_MINUTES = 600000;

cache = {}

setInterval(()=>{

	const now = Date.now()

	Object.keys(cache)
				.forEach(url => {
					const { result, lastReqNu } = cache[url]
					if(result
					&& ((lastReqNu + TEN_MINUTES) < now)){
						delete cache[url]
					}
				})
}, TEN_MINUTES);

//=====================================================
//=========================================== match Url
//=====================================================

function matchUrl(url : string, apiPaths : string[]) {
//console.log(url, apiPaths, cache)
	if(cache[url]){
		return cache[url].result
	}

//++++++++++++++++++++++++++++ check each path in yaml
//++++++++++++++++++++++++++++++++++++++++++++++++++++

	const scores = {}

  for(let pathIndex = 0;
  				pathIndex < apiPaths.length;
          pathIndex++){
    const apiPath = apiPaths[pathIndex]
//console.log(apiPath, pathIndex)
//+++++++++++++++++++++ dones this path have fragments
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  if(apiPath.includes("{")){
    let reduceUrl = url
    const params = {}
    let lastStep = null;
    let totalLeng = 0;
//+++++++++++++++++++++++++++++++++++++++++ Split path
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    // split yaml path - /a/{b}
    const pathFragments = apiPath.split(/\{|\}/gi)
    														  .filter(x=>x)
//console.log(pathFragments)
    for(let fragmentIndex = 0;
    				fragmentIndex < pathFragments.length;
            fragmentIndex++){

      const fragment = pathFragments[fragmentIndex]
//console.log("fragment",fragment)
//+++++++++++++++++++++++++++++++ Skip for placeholder
//++++++++++++++++++++++++++++++++++++++++++++++++++++
      if(fragmentIndex % 2 == 1){
        if(fragmentIndex === pathFragments.length-1){
      		if(reduceUrl.includes("/")){
          	lastStep=null
						break;
          }
        	params[fragment] = reduceUrl
        }
        lastStep.fragment = fragment
        continue;
      } // END if
      else {
      	totalLeng += fragment.length
      }

      const start = reduceUrl.indexOf(fragment)
      const  end  = fragment.length

//++++++++++ If fragment was not found in remaning url
//++++++++++++++++++++++++++++++ try next path in list
      if(-1 === start // the status part of the URL could not be found
      || (fragmentIndex === pathFragments.length-1 // the is the END of the loop
           && end < (reduceUrl.length - start))){ // BUT the path is longer
        lastStep=null
				break;
      }

//++++++++++++++++++++ Process fragment from last step
//++++++++++++++++++++++++++++++++++++++++++++++++++++

      if(0 < fragmentIndex){
        const param = reduceUrl.slice(0,start)
        if(param.includes("/")){
          lastStep=null
          break;
        }
        params[lastStep.fragment] = param

       // CUT Placehold fragment from the previce step
        reduceUrl = reduceUrl.slice(start)

       // CUT fragment from URL for this step
        reduceUrl = reduceUrl.slice(end)

//++++++++++++++++++++++++ Else this is the first step
//++++++++++++++++++++++++++++++++++++++++++++++++++++

      } else {
        reduceUrl = reduceUrl.slice(end)
      } // END else

      lastStep = { start, end }
    } // END for
//console.log("lastStep",lastStep)
		if(lastStep){
     	scores[totalLeng] = {path:apiPath,params}
    }

//++++++++++++++++ exist match if the path is the same
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    } else if(url === apiPath){
      return {path:apiPath,params:{}};
    }

  } // END for apiPaths in YAML

  const topScore = Object.keys(scores)
  											  .map(score => +score)

  if(topScore.length){
		const result = scores[Math.max.apply(null,topScore)]
		cache[url] = { result, lastReqNu: Date.now() }
  	return result
  }
	cache[url] = { result:null, lastReqNu: Date.now() }
  return null
} // END matchUrl

module.exports = matchUrl
