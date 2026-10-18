const {chromium}=require('/Users/ma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const samples=[];try{
 for(const width of [1440,390])for(let i=0;i<3;i++){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:width===390?3:1});const page=await context.newPage();
  await page.addInitScript(()=>{window.sceneDraws=0;const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.id==='scene')sceneDraws++;return clear.apply(this,args);};});
  await page.goto('file://'+root+'/dist/index.html?review=still&at=5000');await page.waitForFunction(()=>document.querySelector('#scene').dataset.rendered==='true');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const draws=await page.evaluate(()=>sceneDraws);assert.equal(draws,1,'initial static scene is painted once');samples.push({width,iteration:i,draws});await context.close();
 }
 fs.writeFileSync(path.join(root,'reports/v1-preview','startup-single-frame.json'),JSON.stringify({samples,passed:true},null,2));console.log(JSON.stringify({samples,passed:true}));
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
