const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('./scene-core.js'),Data=require('./scene-data.js'),Candles=require('./candle-core.js');
test('foreground positions and inverse pointer geometry share one affine map',()=>{
  for(const node of Data.nodes){const p=Core.affine(node,1.06),q=Core.inverse(p,1.06);assert.ok(Math.abs(q.x-node.x)<1e-8&&Math.abs(q.y-node.y)<1e-8);}
  const mapped=Core.mapNodes(Data.nodes,Data.masks,1.06);for(const kind of ['head','phone']){const a=Data.nodes.find(n=>n.kind===kind),b=mapped.find(n=>n.kind===kind);assert.ok(Core.foregroundContains(Data.masks,a));assert.ok(b.y<a.y);assert.deepEqual({x:b.x,y:b.y},Core.affine(a,1.06));}
  for(const a of Data.nodes.filter(n=>n.depth==='far')){const b=mapped.find(n=>n.id===a.id);assert.equal(b.x,a.x);assert.equal(b.y,a.y);}
});
test('K3 spacing remains approximately absolute across the annotated ridges',()=>{
  assert.equal(Data.ridges.length,6);let total=0;for(const r of Data.ridges){assert.notEqual(r.depth,'near');const count=Core.candleCount(r),bars=Candles.createCandles(r.points,{id:r.id,depth:r.depth,profile:'active',count});total+=bars.length;assert.ok(count>=4&&count<=90);if(r.id==='main-skyline')assert.equal(count,90);for(const [i,b] of bars.entries()){assert.ok(b.bodyWidth>24&&b.bodyWidth<34);assert.ok(b.highY<=Math.min(b.openY,b.closeY));assert.ok(b.lowY>=Math.max(b.openY,b.closeY));if(i)assert.equal(b.openY,bars[i-1].closeY,`${r.id} keeps one continuous OHLC sequence`);}}
  assert.ok(total>200&&total<250);
});
test('the precise front cairn remains an occluder above the general foreground boundary',()=>{
  assert.ok(Core.foregroundContains(Data.masks,{x:1400,y:1100}));assert.equal(Core.foregroundContains(Data.masks,{x:1000,y:250}),false);
  assert.ok(Core.contains(Core.belowBoundary(Data.masks.foregroundBoundary),{x:2200,y:2600}));
  assert.equal(Core.contains(Core.belowBoundary(Data.masks.foregroundBoundary),{x:3000,y:500}),false);
});

test('foreground discovery begins only below the lowest ridge, preserving inter-ridge interaction',()=>{
  assert.equal(typeof Candles.contour,'function');
  const ridges=Data.ridges.map(r=>({...r,profile:Candles.contour(r.points)})),scale=1280/4032;
  assert.equal(Core.foregroundProjection({x:1600,y:800},scale,ridges),null);
  const projected=Core.foregroundProjection({x:1600,y:2400},scale,ridges);
  assert.equal(projected.id,'terrain-boundary');assert.ok(projected.weight>.99);
  const lower=Math.max(...ridges.filter(r=>1600>=r.profile.minX&&1600<=r.profile.maxX).map(r=>r.profile.at(1600).y));
  assert.equal(Core.foregroundProjection({x:1600,y:lower+15/scale},scale,ridges),null);
  assert.equal(Core.foregroundProjection({x:-1000,y:2400},scale,ridges),null);
});

function foregroundRidges(){return Data.ridges.map(r=>({...r,profile:Candles.contour(r.points)}));}
function targetWeight(projection,id){return projection?.targets.find(target=>target.id===id)?.weight||0;}

test('foreground handoff moves a local bright spot continuously between adjacent lower routes',()=>{
  const ridges=foregroundRidges(),scale=1280/4032,ids=['western-central-glacier','terrain-boundary'];
  let previous=null,maxWeightStep=0,maxHeatStep=0;
  for(let x=1200;x<=1660;x+=.5){
    const projection=Core.foregroundProjection({x,y:2400},scale,ridges);
    assert.ok(projection);assert.ok(projection.targets.length<=2);
    assert.ok(projection.targets.every(target=>ids.includes(target.id)),`upper route revealed at ${x}`);
    assert.ok(Math.abs(projection.targets.reduce((sum,target)=>sum+target.weight,0)-1)<1e-10);
    const weights=ids.map(id=>targetWeight(projection,id));
    const heat=ids.flatMap(id=>Array.from({length:31},(_,i)=>Core.foregroundHeat(projection,id,1050+i*25)));
    if(previous){
      maxWeightStep=Math.max(maxWeightStep,...weights.map((value,i)=>Math.abs(value-previous.weights[i])));
      maxHeatStep=Math.max(maxHeatStep,...heat.map((value,i)=>Math.abs(value-previous.heat[i])));
      assert.ok(weights[0]<=previous.weights[0]+1e-12);assert.ok(weights[1]>=previous.weights[1]-1e-12);
    }
    previous={weights,heat};
  }
  assert.ok(maxWeightStep<.003,`weight step ${maxWeightStep}`);
  assert.ok(maxHeatStep<.006,`rendered heat step ${maxHeatStep}`);
  const left=Core.foregroundProjection({x:1350,y:2400},scale,ridges);
  assert.ok(targetWeight(left,ids[0])>.85);assert.ok(targetWeight(left,ids[1])>.1);
  assert.equal(left.targets.find(target=>target.id===ids[1]).x,1433.6,'incoming highlight starts at its real endpoint');
  const join=Core.foregroundProjection({x:1433.6,y:2400},scale,ridges);
  assert.ok(Math.abs(targetWeight(join,ids[0])-.5)<1e-10);
  assert.ok(Math.abs(targetWeight(join,ids[1])-.5)<1e-10);
  assert.equal(Core.foregroundProjection({x:1600,y:2400},scale,ridges).targets.length,1);
});

test('short paths have a bounded local heat footprint instead of a whole-path Gaussian',()=>{
  const ridges=foregroundRidges(),route=ridges.find(r=>r.id==='western-central-glacier'),scale=1280/4032;
  const length=route.profile.maxX-route.profile.minX;
  for(const x of [900,1150,1350,1500]){
    const projection=Core.foregroundProjection({x,y:2400},scale,ridges);
    const target=projection.targets.find(target=>target.id===route.id);
    assert.ok(target.radius<=length*.28+1e-10);
    assert.equal(Core.foregroundHeat(projection,route.id,target.x-target.radius),0);
    assert.equal(Core.foregroundHeat(projection,route.id,target.x+target.radius),0);
    assert.ok(Math.abs(Core.foregroundHeat(projection,route.id,target.x)-target.weight)<1e-10);
    assert.ok(Math.abs(Core.foregroundHeat(projection,route.id,target.x+target.radius/2)-target.weight/2)<1e-10);
    const samples=Array.from({length:1001},(_,i)=>route.profile.minX+length*i/1000);
    assert.ok(samples.filter(sample=>Core.foregroundHeat(projection,route.id,sample)>.001).length<=561);
    assert.ok(samples.filter(sample=>Core.foregroundHeat(projection,route.id,sample)>target.weight*.5).length<=281);
  }
  const a=Core.foregroundProjection({x:1100,y:2400},scale,ridges),b=Core.foregroundProjection({x:1200,y:2400},scale,ridges);
  assert.equal(a.targets[0].x,1100);assert.equal(b.targets[0].x,1200);
  assert.ok(Core.foregroundHeat(a,route.id,1100)>Core.foregroundHeat(b,route.id,1100));
});

test('the direct-interaction region stays unprojected through endpoint and depth transitions',()=>{
  const ridges=foregroundRidges();
  for(const width of [720,1280,1920]){
    const scale=width/4032;
    for(let x=1200;x<=1700;x+=2){
      const lower=Math.max(...ridges.map(r=>r.profile.at(x)?.y??-Infinity));
      assert.equal(Core.foregroundProjection({x,y:lower},scale,ridges),null);
      assert.equal(Core.foregroundProjection({x,y:lower+15/scale},scale,ridges),null);
      for(const r of ridges){const at=r.profile.at(x);if(at)assert.equal(Core.foregroundProjection({x,y:at.y},scale,ridges),null);}
    }
  }
});

test('screen-space caps and short-route limits work at different viewport widths',()=>{
  const ridges=foregroundRidges(),short=ridges.find(r=>r.id==='western-central-glacier');
  for(const width of [720,1280,1920,3200]){
    const scale=width/4032;
    const radius=Core.foregroundRadius(short,scale);
    assert.ok(radius*scale<=68+1e-9);assert.ok(radius<=(short.profile.maxX-short.profile.minX)*.2+1e-9);
    const terrain=Core.foregroundProjection({x:2200,y:2800},scale,ridges).targets.find(target=>target.id==='terrain-boundary');
    assert.ok(Math.abs(terrain.radius*scale-94)<1e-9);
    const join=Core.foregroundProjection({x:1433.6,y:2800},scale,ridges);
    assert.equal(join.targets.length,2);assert.ok(join.targets.every(target=>Math.abs(target.weight-.5)<1e-10));
  }
});

test('adjacent short ownership intervals never produce three simultaneous targets',()=>{
  const ridges=[
    {id:'base',profile:Candles.contour([[0,10],[1000,10]])},
    {id:'short',profile:Candles.contour([[400,30],[420,30]])},
    {id:'next',profile:Candles.contour([[430,40],[1000,40]])}
  ];
  let previous=null;
  for(let x=350;x<=480;x+=.1){
    const projection=Core.foregroundProjection({x,y:1000},1,ridges);
    assert.ok(projection.targets.length<=2);
    const weights=ridges.map(route=>targetWeight(projection,route.id));
    if(previous)assert.ok(weights.every((weight,i)=>Math.abs(weight-previous[i])<.031));
    previous=weights;
  }
});

test('a short gap between lower routes blends their endpoints without revealing the skyline',()=>{
  const ridges=foregroundRidges(),scale=1280/4032,ids=['western-glacier-hill','western-central-glacier'];
  let previous=null;
  for(let x=700;x<=800;x+=.5){
    const projection=Core.foregroundProjection({x,y:2400},scale,ridges);
    assert.ok(projection);assert.ok(projection.targets.length<=2);
    assert.ok(projection.targets.every(target=>ids.includes(target.id)));
    const weights=ids.map(id=>targetWeight(projection,id));
    if(previous)assert.ok(weights.every((weight,i)=>Math.abs(weight-previous[i])<.006));
    previous=weights;
  }
  const gap=Core.foregroundProjection({x:748.25,y:2400},scale,ridges);
  assert.deepEqual(gap.targets.map(target=>target.x),[723,773.5]);
  assert.ok(gap.targets.every(target=>Math.abs(target.weight-.5)<1e-10));
});

test('foreground radius stays unchanged near a ridge and grows moderately only in the far foreground',()=>{
  const ridges=foregroundRidges();
  for(const width of [720,1280,1920,3200]){
    const scale=width/4032;
    for(const x of [1100,2200]){
      const route=ridges.find(r=>r.id===(x===1100?'western-central-glacier':'terrain-boundary'));
      const lower=route.profile.at(x).y,original=Core.foregroundRadius(route,scale);
      for(const depth of [21,50,100,115]){
        const projection=Core.foregroundProjection({x,y:lower+depth/scale},scale,ridges);
        assert.ok(projection);assert.equal(projection.targets.length,1);
        assert.equal(projection.targets[0].radius,original,`near radius changed at ${depth}px / ${width}px viewport`);
      }
      const far=Core.foregroundProjection({x,y:lower+350/scale},scale,ridges).targets[0];
      const ratio=far.radius/original;
      assert.ok(ratio>1.38&&ratio<1.401,`unexpected growth ratio ${ratio}`);
      assert.ok(far.radius*scale<=94+1e-10);
      assert.ok(far.radius<=(route.profile.maxX-route.profile.minX)*.28+1e-10);
      assert.equal(Core.foregroundHeat({targets:[far]},route.id,far.x+far.radius),0);
    }
  }
});

test('foreground depth changes grow the local heat footprint continuously',()=>{
  const scale=.4,route={id:'single',profile:Candles.contour([[0,100],[1000,100]])},ridges=[route];
  let previousRadius=0,previousHeat=Array(5).fill(0);
  for(let depth=20;depth<=350;depth+=.5){
    const projection=Core.foregroundProjection({x:500,y:100+depth/scale},scale,ridges);
    const radius=projection?.targets[0].radius*scale||68;
    const heat=[0,25,50,68,90].map(offset=>Core.foregroundHeat(projection,route.id,500+offset/scale));
    if(depth>20){
      assert.ok(radius>=previousRadius-1e-10);
      assert.ok(radius-previousRadius<.11,'radius jumped while moving down through the foreground');
      assert.ok(heat.every((value,i)=>value>=previousHeat[i]-1e-10));
      assert.ok(heat.every((value,i)=>Math.abs(value-previousHeat[i])<.009),'visible heat jumped');
    }
    previousRadius=radius;previousHeat=heat;
  }
  const full=Core.foregroundProjection({x:500,y:100+350/scale},scale,ridges);
  assert.ok(Core.foregroundHeat(full,route.id,500+80/scale)>0,'far foreground reaches beyond the old 68px support');
  assert.equal(Core.foregroundHeat(full,route.id,500+95/scale),0,'far foreground remains local');
});

test('widening the far foreground leaves handoff shares and participating routes unchanged',()=>{
  const ridges=foregroundRidges(),scale=1280/4032;
  for(let x=1250;x<=1650;x+=2){
    const near=Core.foregroundProjection({x,y:1800},scale,ridges),far=Core.foregroundProjection({x,y:2800},scale,ridges);
    assert.deepEqual(far.targets.map(target=>({id:target.id,x:target.x,y:target.y,weight:target.weight})),near.targets.map(target=>({id:target.id,x:target.x,y:target.y,weight:target.weight})));
    for(let i=0;i<far.targets.length;i++)assert.ok(far.targets[i].radius>=near.targets[i].radius);
  }
});
