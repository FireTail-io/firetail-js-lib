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

module.exports = isDeepEqual
