const {chromium}=require('/Users/ma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),label=process.argv[2]||'after';
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const page=await browser.newPage({viewport:{width:750,height:900}});
 await page.addInitScript(()=>{
  const audit=window.resizeAudit={samples:[],cleared:false};
  for(const prop of ['width','height']){
   const d=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,prop);
   Object.defineProperty(HTMLCanvasElement.prototype,prop,{...d,set(v){d.set.call(this,v);if(this.id==='scene')audit.cleared=true;}});
  }
  const draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...a){const result=draw.apply(this,a);if(this.canvas.id==='scene')audit.cleared=false;return result;};
  const Native=window.ResizeObserver;
  window.ResizeObserver=class extends Native{constructor(callback){super((entries,observer)=>{callback(entries,observer);if(entries.some(e=>e.target.id==='scene'))audit.samples.push({width:innerWidth,blankAfterResizeCallback:audit.cleared});});}};
 });
 await page.goto('file://'+root+'/dist/index.html?review=still&at=5000');
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.rendered==='true');
 await page.evaluate(()=>{resizeAudit.samples=[]});
 for(const width of [740,700,650,600,550,500,486,450,430,410,390,370,360,340,320,360,390,486,600,749,750,820,1440,1920,750,390]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 }
 const result=await page.evaluate(()=>({samples:resizeAudit.samples,blankCallbacks:resizeAudit.samples.filter(s=>s.blankAfterResizeCallback).length}));
 fs.writeFileSync(path.join(root,'reports/v1-preview',`resize-paint-${label}.json`),JSON.stringify(result,null,2));
 console.log(JSON.stringify({label,samples:result.samples.length,blankCallbacks:result.blankCallbacks}));
 if(label!=='before'){assert.ok(result.samples.length>=20);assert.equal(result.blankCallbacks,0,'ResizeObserver must finish with a painted bitmap');}
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
