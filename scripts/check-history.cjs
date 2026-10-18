const {chromium}=require('/Users/ma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),mode=process.argv[2]||'after';
(async()=>{const b=await chromium.launch({headless:true,channel:'chrome'});try{
 const p=await b.newPage({viewport:{width:390,height:844}});await p.emulateMedia({reducedMotion:'reduce'});await p.goto('file://'+root+'/dist/index.html?review=still&at=5000#research');await p.locator('#academic-content article.publication').first().waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(150);
 await p.evaluate(()=>scrollBy({top:200,behavior:'instant'}));const research=await p.evaluate(()=>scrollY);
 await p.evaluate(()=>{location.hash='#publications'});await p.waitForTimeout(200);await p.evaluate(()=>scrollBy({top:150,behavior:'instant'}));const publications=await p.evaluate(()=>scrollY);
 await p.goBack();await p.waitForTimeout(200);const back=await p.evaluate(()=>scrollY);
 await p.goForward();await p.waitForTimeout(200);const forward=await p.evaluate(()=>scrollY);
 await p.evaluate(()=>scrollBy({top:100,behavior:'instant'}));const reloadBefore=await p.evaluate(()=>scrollY);await p.reload();await p.locator('#academic-content article.publication').first().waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);const reloadAfter=await p.evaluate(()=>scrollY);
 await p.goto('about:blank');await p.goBack();await p.locator('#academic-content article.publication').first().waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);const returnAfter=await p.evaluate(()=>scrollY);
 await p.goto('file://'+root+'/dist/index.html?review=still&at=5000#lgvsc');await p.locator('#lgvsc').waitFor();await p.waitForTimeout(200);const directPaperTop=await p.locator('#lgvsc').evaluate(e=>e.getBoundingClientRect().top);
 const result={research,publications,back,forward,reloadBefore,reloadAfter,returnAfter,directPaperTop};fs.writeFileSync(path.join(root,'reports/v1-preview',`history-${mode}.json`),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 if(mode!=='before'){assert.ok(Math.abs(directPaperTop)<30,'direct paper anchor opens at article');assert.ok(Math.abs(research-back)<3,'back restores reading offset');assert.ok(Math.abs(publications-forward)<3,'forward restores reading offset');assert.ok(Math.abs(reloadBefore-reloadAfter)<3,'reload restores reading offset');assert.ok(Math.abs(reloadAfter-returnAfter)<3,'return from another document restores reading offset');}
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
