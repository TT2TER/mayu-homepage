const {chromium}=require('/Users/ma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const entries={baseline:'file:///Users/ma/Documents/projects/mayu-homepage-design/site/index.html',responsive:'file://'+root+'/site/index.html'};
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const samples=[];try{
 for(const device of [{name:'desktop',width:1440,height:1000,dpr:1},{name:'phone',width:390,height:844,dpr:3}]){
  for(let i=0;i<5;i++)for(const version of i%2?['responsive','baseline']:['baseline','responsive']){
   const context=await browser.newContext({viewport:{width:device.width,height:device.height},deviceScaleFactor:device.dpr});const page=await context.newPage();
   await page.addInitScript(()=>{
    window.startupMetrics={renders:0,firstScene:null,firstSceneRenders:null};
    const clear=CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas.id==='scene')startupMetrics.renders++;return clear.apply(this,a)};
    new MutationObserver(()=>{if(document.querySelector('#scene')?.dataset.rendered==='true'&&startupMetrics.firstScene===null){startupMetrics.firstScene=performance.now();startupMetrics.firstSceneRenders=startupMetrics.renders;}}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-rendered']});
   });
   await page.goto(entries[version]+'?review=still&at=5000');await page.waitForFunction(()=>startupMetrics.firstScene!==null);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const result=await page.evaluate(()=>({...startupMetrics,dom:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,resources:performance.getEntriesByType('resource').map(r=>({name:r.name.split('/').pop(),duration:r.duration})),canvas:{width:document.querySelector('#scene').width,height:document.querySelector('#scene').height}}));
   samples.push({device,version,iteration:i,...result});await context.close();
  }
 }
 const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];const summary=[];
 for(const device of ['desktop','phone'])for(const version of ['baseline','responsive']){const group=samples.filter(s=>s.device.name===device&&s.version===version);summary.push({device,version,firstSceneMedianMs:median(group.map(s=>s.firstScene)),firstSceneSamplesMs:group.map(s=>s.firstScene),domMedianMs:median(group.map(s=>s.dom)),resourceNames:group[0].resources.map(r=>r.name),renderCounts:group.map(s=>s.renders),canvas:group[0].canvas});}
 fs.writeFileSync(path.join(__dirname,'startup-comparison.json'),JSON.stringify({method:'Local file URLs, fresh context per sample, alternating A/B order, five samples per device/version, warm OS file cache, review still at 5000ms; firstScene is drawing completion observed through data-rendered.',samples,summary},null,2));console.log(JSON.stringify(summary));
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
