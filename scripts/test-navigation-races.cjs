const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function harness(){
 const events={},frames=[],stack=[{state:null,hash:''}];let index=0;
 const section=id=>({scrollIntoView(){c.scrollTo({top:id==='research'?1000:2000})},querySelector(){return null},hasAttribute(){return true},focus(){}});
 const host={shadowRoot:null,querySelector(selector){return section(selector.slice(1))}};
 class Anchor{constructor(hash){this.hash=hash}getAttribute(){return this.hash}}
 const dispatch=(type,event={})=>{for(const f of events[type]||[])f(event)};
 const c={document:{querySelector(){return host},addEventListener(type,f){(events[type]??=[]).push(f)}},HTMLAnchorElement:Anchor,CSS:{escape:s=>s},performance:{timeOrigin:1,getEntriesByType:()=>[{type:'reload'}]},location:{hash:''},scrollX:0,scrollY:0,matchMedia:()=>({matches:true}),requestAnimationFrame:f=>{frames.push(f)},addEventListener(type,f){(events[type]??=[]).push(f)}};
 c.history={get state(){return stack[index].state},replaceState(state){stack[index].state=state},pushState(state,_,hash){stack.splice(index+1);stack.push({state,hash});index++;c.location.hash=hash}};
 c.scrollTo=({left=0,top=0})=>{c.scrollX=left;c.scrollY=top;dispatch('scroll')};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../design/site/academic-navigation.js'),'utf8'),c);
 return {c,scroll:y=>c.scrollTo({top:y}),click(hash){const anchor=new Anchor(hash);dispatch('click',{composedPath:()=>[anchor],button:0,detail:1,preventDefault(){}})},back(){index--;c.location.hash=stack[index].hash;dispatch('popstate');dispatch('hashchange')},hash(hash){stack.splice(index+1);stack.push({state:null,hash});index++;c.location.hash=hash;dispatch('hashchange')},flush(){let count=0;while(frames.length){assert.ok(count++<20);frames.shift()()}}};
}
for(const interruption of ['menu','hash'])test('reading offsets survive history restoration interrupted by '+interruption,()=>{
 const h=harness();h.scroll(1200);h.click('#publications');h.scroll(2200);h.back();
 if(interruption==='menu')h.click('#research');else h.hash('#research');
 h.flush();h.scroll(1400);h.click('#publications');h.scroll(2300);h.back();h.flush();assert.equal(h.c.scrollY,1400);
});
