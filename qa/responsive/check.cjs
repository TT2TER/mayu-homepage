const {chromium,webkit}=require('/Users/ma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const results=[],errors=[];
 try {
  for(const [width,height] of [[1920,1080],[1440,1000],[1200,900],[1024,768],[820,1180],[768,1024],[750,900],[749,900],[600,900],[486,850],[430,932],[390,844],[360,800],[320,640],[844,390]]) {
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   page.on('pageerror',e=>errors.push({width,error:e.message}));
   await page.goto('file://'+root+'/site/index.html?review=still&at=5000');
   await page.waitForFunction(()=>document.querySelector('#scene').dataset.rendered==='true');
   await page.evaluate(()=>document.fonts.ready);
   const metrics=await page.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
    const canvas=rect('#scene'),hero=rect('.hero'),identity=rect('.identity'),contact=rect('.contact-row');
    return {viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,canvas,hero,identity,contact,nav:rect('.site-header nav'),font:getComputedStyle(document.querySelector('.identity')).fontSize,personHead:{x:canvas.width*.435,y:canvas.height*.535}};
   });
   const expectedFont=width>=1440?20:Math.max(12,Math.min(20,6+width*0.01866667));
   assert.ok(Math.abs(parseFloat(metrics.font)-expectedFont)<.01,`text scale ${width}`);
   assert.equal(metrics.overflow,false,`overflow ${width}`);
   assert.ok(metrics.identity.right<=width+1,`intro clipped ${width}`);
   assert.ok(metrics.contact.bottom<metrics.hero.bottom,`contact below hero ${width}`);
   assert.ok(metrics.contact.bottom<metrics.canvas.bottom,`contact below photograph ${width}`);
   assert.ok(metrics.personHead.x<width,`head clipped ${width}`);
   assert.ok(metrics.nav.x>=0&&metrics.nav.right<=width,`navigation clipped ${width}`);
   await page.screenshot({path:path.join(__dirname,`${width}x${height}.png`)});
   results.push({width,height,...metrics});
   if(width===390){
    await page.mouse.move(170,160);
    const pointer=await page.locator('#scene').getAttribute('data-pointer-x');
    assert.ok(Math.abs(Number(pointer)-170/metrics.canvas.width*4032)<1,'pointer coordinates match crop');
    await page.locator('.page-down').click();
    await page.waitForTimeout(750);
    assert.equal(await page.evaluate(()=>location.hash),'#about');
    await page.screenshot({path:path.join(__dirname,'390-about.png')});
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'checks.json'),JSON.stringify({results,errors},null,2));
  console.log(JSON.stringify({widths:results.map(r=>r.width),errors}));
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
