const {chromium}=require('/Users/ma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'reports/v1-preview'),url=JSON.parse(fs.readFileSync(path.join(folder,'deploy-receipt.json'),'utf8')).deploy_url;
(async()=>{const b=await chromium.launch({headless:true,channel:'chrome',args:['--disable-http2']});const results=[],errors=[];try{
 for(const width of [1440,390]){
  const p=await b.newPage({viewport:{width,height:1000}});p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url+'/?review=still&at=5000',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.querySelector('#scene').dataset.rendered==='true');await p.evaluate(()=>document.fonts.ready);
  const shot=await p.screenshot({path:path.join(folder,`live-${width}.png`)});assert.ok(shot.equals(fs.readFileSync(path.join(folder,`${width}.png`))),`live screenshot matches build at ${width}`);
  if(width===390){
   await p.locator('.site-header a[href="#publications"]').click();await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>location.hash),'#publications');assert.notEqual(await p.evaluate(()=>document.activeElement?.tagName),'H2');
   await p.evaluate(()=>scrollBy(0,150));const before=await p.evaluate(()=>scrollY);await p.reload({waitUntil:'domcontentloaded'});await p.locator('#academic-content article.publication').first().waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);const after=await p.evaluate(()=>scrollY);assert.ok(Math.abs(before-after)<=3,`reload restoration ${before} vs ${after}`);results.push({width,pixelsMatch:true,mouseNavigation:true,reloadPosition:{before,after}});
  }else results.push({width,pixelsMatch:true});
  await p.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(folder,'live-browser-checks.json'),JSON.stringify({url,results,errors},null,2));console.log(JSON.stringify({results,errors}));
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
