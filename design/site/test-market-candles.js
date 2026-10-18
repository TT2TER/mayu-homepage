'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Data=require('./scene-data.js'),Core=require('./scene-core.js'),Ridge=require('./candle-core.js'),Market=require('./market-candles.js');
const variants=['corrected','expressive'],all=variant=>Data.ridges.flatMap(r=>Market.create(r,{variant})),mean=xs=>xs.reduce((s,v)=>s+v,0)/xs.length;
function independentY(points,x){if(x<=points[0][0])return points[0][1];for(let i=1;i<points.length;i++)if(points[i][0]>=x){const a=points[i-1],b=points[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return points.at(-1)[1];}
function correlation(a,b){const ma=mean(a),mb=mean(b),x=a.map(v=>v-ma),y=b.map(v=>v-mb);return x.reduce((s,v,i)=>s+v*y[i],0)/Math.sqrt(x.reduce((s,v)=>s+v*v,0)*y.reduce((s,v)=>s+v*v,0));}

test('both variants retain counts, common increasing centers and ten-percent narrower K3 bodies',()=>{
  for(const r of Data.ridges){const a=Market.create(r),b=Market.create(r,{variant:'expressive'}),legacy=Ridge.createCandles(r.points,{id:r.id,depth:r.depth,profile:'active',count:Core.candleCount(r)}),step=(r.points.at(-1)[0]-r.points[0][0])/a.length;
    assert.equal(a.length,Core.candleCount(r));assert.deepEqual(a.map(b=>[b.x,b.bodyWidth]),b.map(b=>[b.x,b.bodyWidth]));
    for(const [i,c]of a.entries()){assert.ok(Math.abs(c.bodyWidth-legacy[i].bodyWidth*.9)<1e-10);if(i){const dx=c.x-a[i-1].x;assert.ok(dx>=step*.62-1e-8&&dx<=step*1.55+1e-8);assert.ok(dx>c.bodyWidth,'neighboring bodies remain separated');}}
  }assert.equal(all('expressive').length,229);
});
test('every close is the exact original contour interpolation in both variants',()=>{
  for(const r of Data.ridges){const a=Market.create(r),b=Market.create(r,{variant:'expressive'});assert.deepEqual(a.map(b=>b.closeY),b.map(b=>b.closeY));for(const bar of b)assert.ok(Math.abs(bar.closeY-independentY(r.points,bar.x))<1e-9);}
});
test('significant true summits become close anchors without flattening their peaks',()=>{
  const cases=[['main-skyline',968,200],['main-skyline',3338,362.5],['western-glacier-hill',267,753.5],['western-central-glacier',907.2,354.2],['central-glacier-front',1600.5,463.2],['eastern-front-ridge',3857,940]];
  for(const [id,x,y]of cases){const r=Data.ridges.find(r=>r.id===id),b=Market.create(r,{variant:'expressive'}).find(b=>b.x===x);assert.ok(b,`${id} keeps critical vertex ${x}`);assert.equal(b.closeY,y);assert.ok(['turn','impulse'].includes(b.contourAnchor));}
});
test('illustrative price paths retain every original vertex and never connect distinct ridges',()=>{
  for(const r of Data.ridges){const bs=Market.create(r,{variant:'expressive'}),path=Market.pricePath(r,bs),lookup=new Map(path.map(p=>[p[0],p[1]]));assert.deepEqual(path[0],r.points[0]);assert.deepEqual(path.at(-1),r.points.at(-1));for(const [x,y]of r.points)assert.ok(Math.abs(lookup.get(x)-y)<1e-9);for(const b of bs)assert.ok(Math.abs(lookup.get(b.x)-b.closeY)<1e-9);for(let i=1;i<path.length;i++)assert.ok(path[i][0]>path[i-1][0]);assert.ok(path.every(([x])=>x>=r.points[0][0]&&x<=r.points.at(-1)[0]));}
});
test('the eastern bridge is one thirty-candle sequence with MA5 continuing across the old join',()=>{
  assert.equal(Data.ridges.length,6);assert.equal(Data.ridges.find(r=>r.id==='eastern-inner-ridge'),undefined);const r=Data.ridges.find(r=>r.id==='eastern-front-ridge');assert.deepEqual(r.points[0],[2678,683]);assert.deepEqual(r.points.at(-1),[4030,899.7]);assert.deepEqual(r.bridgeRanges,[[3024,3066]]);
  const bridge=r.points.filter(([x])=>x>=3024&&x<=3066);assert.ok(bridge.length>=7);for(const [x,y]of bridge)assert.ok(Math.abs(y-(738.5+(770-738.5)*(x-3024)/42))<1e-8);
  const bs=Market.create(r,{variant:'expressive'});assert.equal(bs.length,30);const i=bs.findIndex(b=>b.x>=3024);assert.ok(i>=4);assert.ok(bs[i].x<=3066);for(const b of bs.slice(i))assert.ok(Number.isFinite(b.ma5Y));assert.equal(bs.filter(b=>b.ma5Y===null).length,4);
});
test('candle highs and lows also contain every retained intra-interval contour vertex',()=>{
  for(const r of Data.ridges){const bs=Market.create(r,{variant:'expressive'});for(const [i,b]of bs.entries()){
    const start=i?bs[i-1].x:r.points[0][0],end=i===bs.length-1?r.points.at(-1)[0]:b.x;
    for(const [x,y]of r.points)if(x>=start&&x<=end)assert.ok(b.highY<y&&b.lowY>y,`${r.id} interval ${i} contains contour price ${x}`);
  }}
});
test('OHLC inequalities and price direction remain correct with explicit simulated opening gaps',()=>{
  for(const variant of variants)for(const r of Data.ridges){const bs=Market.create(r,{variant}),step=(r.points.at(-1)[0]-r.points[0][0])/bs.length;for(const [i,b]of bs.entries()){
    for(const field of ['x','openY','closeY','highY','lowY','bodyWidth','volume','openPrice','closePrice','highPrice','lowPrice','gapY'])assert.ok(Number.isFinite(b[field]),field);
    assert.ok(b.highY<Math.min(b.openY,b.closeY));assert.ok(b.lowY>Math.max(b.openY,b.closeY));assert.ok(b.highPrice>=Math.max(b.openPrice,b.closePrice));assert.ok(b.lowPrice<=Math.min(b.openPrice,b.closePrice));assert.ok(b.lowPrice>0);assert.equal(b.rising,b.closePrice>b.openPrice);
    const previous=i?bs[i-1].closeY:r.points[0][1];assert.equal(b.gapY,b.openY-previous);assert.ok(Math.abs(b.gapY)<=step*.9+1e-8);if(variant==='corrected')assert.equal(b.openY,previous);
  }}assert.ok(all('expressive').some(b=>Math.abs(b.gapY)>1));
});
test('MA5 averages exactly five closes using the same price-coordinate conversion',()=>{
  for(const variant of variants)for(const r of Data.ridges){const bs=Market.create(r,{variant});for(const [i,b]of bs.entries()){if(i<4){assert.equal(b.ma5Y,null);continue;}const five=bs.slice(i-4,i+1);assert.equal(b.ma5Y,mean(five.map(b=>b.closeY)));assert.ok(Math.abs(mean(five.map(b=>b.closePrice))-(Market.PRICE_ORIGIN-b.ma5Y*Market.PRICE_PER_PIXEL))<1e-9);}}
});
test('the western long rising body is reconstructed from a real flank and summit',()=>{
  const r=Data.ridges.find(r=>r.id==='western-central-glacier');for(const variant of variants){const bs=Market.create(r,{variant}),i=bs.findIndex(b=>b.impulse),b=bs[i];assert.ok(i>0);assert.equal(b.x,907.2);assert.equal(b.closeY,354.2);assert.ok(Math.abs(b.openY-independentY(r.points,bs[i-1].x))<1e-9);assert.equal(b.openY,bs[i-1].closeY);assert.ok(Math.abs((b.openY-b.closeY)-147.38119349522134)<1e-8);assert.ok(b.rising);assert.equal(b.gapY,0);}
});
test('expressive keeps stronger OHLC range and varied real bodies while closing prices remain on terrain',()=>{
  for(const r of Data.ridges){const a=Market.create(r),b=Market.create(r,{variant:'expressive'});assert.ok(mean(b.map(b=>b.lowY-b.highY))>mean(a.map(b=>b.lowY-b.highY))*1.2);assert.ok(b.some(b=>b.rising)&&b.some(b=>!b.rising));}
  const bs=all('expressive');assert.ok(bs.some(b=>b.doji));assert.ok(bs.some(b=>Math.abs(b.closeY-b.openY)>140));assert.ok(bs.filter(b=>b.doji).length/bs.length<.15);for(const r of Data.ridges){let run=0;for(const b of Market.create(r,{variant:'expressive'})){run=b.doji?run+1:0;assert.ok(run<=2);}}
});
test('simulated nonzero volume remains distinct from body length and related to total range',()=>{
  for(const variant of variants){const bs=all(variant),c=correlation(bs.map(b=>b.lowY-b.highY),bs.map(b=>b.volume));assert.ok(bs.every(b=>Number.isSafeInteger(b.volume)&&b.volume>0&&b.volumeSynthetic));assert.ok(c>.1&&c<.85,`range-volume correlation ${c}`);assert.ok(bs.some(a=>bs.some(b=>Math.abs(a.closeY-a.openY)<Math.abs(b.closeY-b.openY)&&a.volume>b.volume)));}
});
test('variants are deterministic, do not mutate geometry and load through the browser-global API',()=>{
  const before=JSON.stringify(Data);for(const r of Data.ridges){const a=Market.create(r);Market.create(r,{variant:'expressive'});assert.deepEqual(Market.create(r),a);}assert.equal(JSON.stringify(Data),before);assert.throws(()=>Market.create(Data.ridges[0],{variant:'unknown'}),RangeError);assert.throws(()=>Market.create(null),TypeError);
  const context={SceneCore:Core,RidgeCandles:Ridge};vm.runInNewContext(fs.readFileSync(require.resolve('./market-candles.js'),'utf8'),context);assert.equal(typeof context.MarketCandles.create,'function');assert.equal(typeof context.MarketCandles.pricePath,'function');assert.equal(context.MarketCandles.create(Data.ridges[0]).length,90);
});

 test('display MA5 uses explicit prehistory and reaches both route boundaries',()=>{
  const ridge={points:[[0,10],[100,70]]},bars=[{x:10,closeY:20},{x:30,closeY:30},{x:50,closeY:40},{x:70,closeY:50},{x:90,closeY:60}];
  assert.deepEqual(Market.movingAveragePath(ridge,bars),[[0,10],[10,12],[30,16],[50,22],[70,30],[90,40],[100,50]]);
  for(const r of Data.ridges){const bs=Market.create(r,{variant:'expressive'}),before=JSON.stringify(bs),path=Market.movingAveragePath(r,bs),lookup=new Map(path);assert.equal(path[0][0],r.points[0][0]);assert.equal(path.at(-1)[0],r.points.at(-1)[0]);for(let i=4;i<bs.length;i++)assert.equal(lookup.get(bs[i].x),bs[i].ma5Y);assert.equal(JSON.stringify(bs),before);for(let i=1;i<path.length;i++)assert.ok(path[i][0]>path[i-1][0]);assert.ok(path.every(p=>p.every(Number.isFinite)));}
 });
