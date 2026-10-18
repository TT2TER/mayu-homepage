const {chromium}=require('/Users/ma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),url='file://'+root+'/site/';
async function ready(p){await p.waitForFunction(()=>document.querySelector('#scene').dataset.rendered==='true');await p.evaluate(()=>document.fonts.ready);}
(async()=>{const b=await chromium.launch({headless:true,channel:'chrome'});const errors=[],checks={};try{
 const p=await b.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url+'index.html?review=still&at=5000');await ready(p);const desktop=await p.screenshot();
 const before=await b.newPage({viewport:{width:1440,height:1000}});
 await before.goto('file:///Users/ma/Documents/projects/mayu-homepage-design/site/index.html?review=still&at=5000');await ready(before);
 assert.ok(desktop.equals(await before.screenshot()),'desktop unchanged');checks.desktopMatchesCurrentApprovedBuild=true;await before.close();
 for(const width of [1440,1200,1024,820,768,750,749,600,486,430,390,360,320,750,1440]){
  await p.setViewportSize({width,height:1000});
  await p.waitForFunction(()=>{const c=document.querySelector('#scene'),r=c.getBoundingClientRect();return Math.abs(c.width-Math.round(r.width))<1});
  const m=await p.evaluate(()=>{const c=document.querySelector('#scene').getBoundingClientRect(),i=document.querySelector('.identity').getBoundingClientRect();return{width:c.width,x:c.x,overflow:document.documentElement.scrollWidth>innerWidth,intro:i.right<=innerWidth,contactBottom:document.querySelector('.contact-row').getBoundingClientRect().bottom,photoBottom:c.bottom}});
  assert.equal(m.overflow,false);assert.equal(m.x,0);assert.ok(m.intro);assert.ok(m.contactBottom<m.photoBottom);
  const expected=Math.max(width,Math.min(1440,width*1.92));assert.ok(Math.abs(m.width-expected)<.05);
 }
 checks.continuousResizeGeometry=true;
 for(const width of [1440,390]){
  await p.setViewportSize({width,height:1000});
  await p.goto(url+'printed-left.html?review=still&at=5000');await ready(p);const source=await p.screenshot();
  await p.goto(url+'index.html?review=still&at=5000');await ready(p);assert.ok(source.equals(await p.screenshot()),`source matches build at ${width}`);
 }
 checks.sourceMatchesBuild=true;
 await p.goto(url+'index.html');await ready(p);
 await p.waitForFunction(()=>document.querySelector('#scene').dataset.idleState==='sweeping');
 await p.mouse.move(175,190);await p.waitForFunction(()=>document.querySelector('#scene').dataset.idleState==='waiting');checks.mobileSweepAndPointerInterrupt=true;
 await p.locator('.page-down').focus();await p.keyboard.press('Enter');await p.waitForTimeout(700);
 assert.equal(await p.evaluate(()=>document.querySelector('#academic-content').shadowRoot.activeElement?.tagName),'H2');checks.keyboardNavigationFocus=true;
 await p.emulateMedia({reducedMotion:'reduce'});await p.goto(url+'index.html');await p.waitForFunction(()=>document.querySelector('#scene').dataset.idleState==='disabled');checks.reducedMotion=true;
 const phone=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push(e.message));await phone.goto(url+'index.html?review=still&at=5000');await ready(phone);
 await phone.screenshot({path:path.join(__dirname,'390-touch-dpr3.png')});
 await phone.touchscreen.tap(170,180);assert.ok(Number(await phone.locator('#scene').getAttribute('data-pointer-x'))>0);
 await phone.locator('.page-down').tap();await phone.waitForTimeout(700);assert.equal(await phone.evaluate(()=>location.hash),'#about');checks.touchNavigationAndPointerDpr3=true;
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'regression.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors}));
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
