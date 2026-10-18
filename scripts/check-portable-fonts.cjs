const {chromium}=require('/Users/ma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'reports/mobile-fonts');
(async()=>{const server=require('node:http').createServer((req,res)=>{const file=path.join(root,'dist',req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);try{res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const results=[];
 for(const [label,width,dpr,fallback] of [['desktop',1440,1,false],['mobile',390,3,false],['android-fallback',390,3,true],['narrow-fallback',320,3,true]]){
  const p=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:dpr,isMobile:width<500,hasTouch:width<500});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.textDraws=0;for(const Context of [CanvasRenderingContext2D,globalThis.OffscreenCanvasRenderingContext2D].filter(Boolean)){const original=Context.prototype.fillText;Context.prototype.fillText=function(...args){window.textDraws++;return original.apply(this,args)}}});
  await p.goto('http://127.0.0.1:'+server.address().port+'/?review=still&at=5000');await p.waitForFunction(()=>document.querySelector('#scene').dataset.rendered==='true');
  const before=await p.locator('#scene').evaluate(c=>c.toDataURL());
  if(fallback){
   // Deliberately make the Apple-only local face unavailable, as on Android.
   await p.addStyleTag({content:'@font-face{font-family:"Missing Local Face";src:local("Mayu Deliberately Missing Font");font-weight:700}.printed-study .about-landscape .identity{font-family:Arial,sans-serif}.printed-study .about-landscape .identity strong{font-family:"Missing Local Face",Arial,sans-serif}'});
  }
  await p.evaluate(()=>document.fonts.ready);
  const metrics=await p.evaluate(()=>{
   const strong=document.querySelector('.identity strong'),s=getComputedStyle(strong),p=getComputedStyle(strong.closest('p'));
   const c=document.createElement('canvas').getContext('2d');const text=strong.textContent;c.font=`400 ${s.fontSize} Arial`;const regular=c.measureText(text).width;c.font=`700 ${s.fontSize} Arial`;const bold=c.measureText(text).width;
   return {weight:s.fontWeight,regularWeight:p.fontWeight,font:s.fontFamily,synthetic:s.fontSynthesis,regularWidth:regular,boldWidth:bold,textDraws:window.textDraws,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.equal(metrics.weight,'700');assert.equal(metrics.regularWeight,'400');assert.equal(metrics.textDraws,0,'name must not use runtime font drawing');assert.equal(metrics.overflow,false);assert.ok(metrics.boldWidth>metrics.regularWidth);
  assert.equal(await p.locator('#scene').evaluate(c=>c.toDataURL()),before,'font substitution must preserve scene pixels');assert.deepEqual(errors,[]);
  await p.screenshot({path:path.join(folder,label+'.png')});results.push({label,width,dpr,fallback,...metrics,sceneStable:true,errors});await p.close();
 }
 fs.writeFileSync(path.join(folder,'checks.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exit(1)});
