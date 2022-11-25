
//=====================================================
//============================================= HELPERS
//=====================================================
//======================================== accept Types
//=====================================================

function acceptTypes(acceptSt) {
  return acceptSt.split(",")
                 .map(type=>type.split(";")[0])

  // TODO: Add support for "relative quality factor"
  /* The example
  ' Accept: audio/*; q=0.2, audio/basic '
  SHOULD be interpreted as "I prefer audio/basic, but send me any audio type if it is the best available after an 80% mark-down in quality."
  */
} // END acceptTypes

//=====================================================
//============================= find Accept Content Key
//=====================================================

//function findAcceptContentKey(acceptTypes,acceptContent) {
    // TODO: check for "something/*"
//    for (const acceptType of acceptTypes) {
//      if ("*/*" === acceptType){
//        return acceptContent[0]
//      }
//      if(acceptContent.includes(acceptType)) {
//        return acceptType
//      }
//    } // END for
//    return false
//} // END findAcceptContentKey

module.exports = {
  acceptTypes,
//  findAcceptContentKey
}
