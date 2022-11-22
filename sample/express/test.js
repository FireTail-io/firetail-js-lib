
const inSideTest = "In side test!"
const obj = {a:1}

scribbles.log(inSideTest,obj)
scribbles.debug('HelloWorld');
//return
scribbles.info( 'HelloWorld');
scribbles.log(  'HelloWorld');
scribbles.warn( 'HelloWorld');
scribbles.error('HelloWorld');
const j = 1
const i = 2
const ar = ["a1","b2","c3","d4"]
scribbles.log(  'HelloWorld', ar);
scribbles.log(  'HelloWorld', ar[i]);
scribbles.log(  'HelloWorld', ar[i][0]);
scribbles.log("boo",ar[i][j]);
scribbles.log(ar[i][j]);
console.log();
scribbles.debug('HelloNull',null);
scribbles.info( 'HelloNumber',123);
scribbles.info( 'HelloNumber',new Date);
scribbles.log(  'HelloObject',{foo:'bar'});
scribbles.log(  'HelloObject',JSON.stringify({foo:'bar'}));
scribbles.log(  'HelloObject',JSON.stringify(ar));
scribbles.log({foo:'bar'});
scribbles.log(JSON.stringify({foo:'bar'}));
const ibuh = {foo:'bar'}
scribbles.log(ibuh);
scribbles.log(" {foo:'bar'}");
scribbles.warn( 'HelloUndefined',undefined);
scribbles.error(new Error("an err1"));
scribbles.error('HelloError2',new Error("an err2"));
scribbles.error('HelloError3',{bar:'baz'},new Error("an err3"));
scribbles.error({bar:'baz'},new Error("an err4"));
console.log();
scribbles.debug(null);
scribbles.info(123);
scribbles.log({foo:'bar'});
scribbles.warn();
scribbles.warn(undefined);
scribbles.error(new Error("an err"));

function foo(){
return "abc"
}

var a2 = ()=>{}
var b = {c:a2,a2}
var a = [1,2,3]
a.push(a)

var y = {s:6}
a.push(y)
y.y = y
const data = {
a,
aa:["s",6],
aaa:[["s",6]],
aaas:[[["s",6]]],
b:null,
b2:b,
"b-3":["{","}"],
c:",",
  err:new Error("qwe"),
d:undefined,
e:console.log,
f:(a,b)=>({}),
f2:function(c,d){},
f3:function doog(e,f){},
g:Symbol("s"),
a1:a,
// g:global,
  x:new Date(),
  y,
  z:NaN
}
scribbles.log(data)
module.exports = {}
