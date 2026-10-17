const test = require('node:test');
const assert = require('node:assert/strict');
const { create, WINDOW_MS, MAX_ACTIVE_LINKS } = require('./signal-network.js');
const nodes = [
  ...Array.from({ length: 40 }, (_, i) => ({ id: `peak-${i}`, x: 40 + i * 100, y: 160 + (i * 137) % 1080, depth: i < 24 ? 'far' : 'middle', kind: i < 30 ? 'peak' : 'cairn' })),
  { id: 'head', x: 1693.3, y: 1545.2, depth: 'near', kind: 'head' },
  { id: 'phone', x: 2108.8, y: 1688.8, depth: 'near', kind: 'phone' }
];
const make = seed => create({ nodes, seed: seed === undefined ? 'review-fixture' : seed });
function fakeContext() {
  const operations = [], gradients = [];
  return { operations, gradients,
    save() { operations.push(['save']); }, restore() { operations.push(['restore']); }, beginPath() {}, moveTo() {}, lineTo() {},
    stroke() { operations.push(['stroke', this.globalCompositeOperation, this.globalAlpha, this.lineWidth, this.strokeStyle]); },
    arc(x, y, r) { operations.push(['arc', x, y, r]); }, fill() { operations.push(['fill', this.globalCompositeOperation, this.globalAlpha]); },
    createRadialGradient(...args) { const stops = []; gradients.push({ args, stops }); return { addColorStop(...stop) { stops.push(stop); } }; }
  };
}
function gather(network, duration=120000, step=100) {
  const events = new Map();
  for(let t=0;t<duration;t+=step)for(const e of network.snapshot(t).events)events.set(e.id,e);
  return [...events.values()].sort((a,b)=>a.start-b.start);
}

test('events are asynchronous with varied event kinds, train lengths, sources and start gaps', () => {
  const n=make(), events=gather(n);
  assert.deepEqual([...new Set(events.map(e=>e.kind))].sort(),['fanout','train','unicast']);
  assert.ok(new Set(events.filter(e=>e.kind==='train').map(e=>e.packetCount)).size>=3);
  assert.ok(events.some(e=>e.packetCount===5)); assert.ok(events.some(e=>e.packetCount===2));
  assert.ok(new Set(events.map(e=>e.source)).size>15);
  const gaps=events.slice(1).map((e,i)=>Math.round(e.start-events[i].start));
  assert.ok(new Set(gaps).size>30); assert.ok(gaps.some(g=>g<500)); assert.ok(gaps.some(g=>g>1500));
  assert.equal(n.snapshot(1000).periodic,false); assert.equal(n.snapshot(1000).period,null);
});

test('the compatibility period hint has no effect on packet schedules', () => {
  const a=create({nodes,seed:'same',period:5000}),b=create({nodes,seed:'same',period:9000});
  for(const t of[750,1600,2800,5400,21700,48050,123456]){
    assert.deepEqual(a.snapshot(t).events,b.snapshot(t).events);
    assert.deepEqual(a.snapshot(t).edges,b.snapshot(t).edges);
  }
});

test('sampling on five-second offsets does not repeat a short playback pattern', () => {
  const n=make(), samples=[];
  for(let t=750;t<120000;t+=5000){const s=n.snapshot(t);samples.push(JSON.stringify(s.edges.filter(e=>e.moving).map(e=>[e.from,e.to,e.packet,e.hop,+e.progress.toFixed(2)])));}
  const activeSamples=samples.filter(v=>v!=='[]');
  assert.ok(activeSamples.length>0);
  assert.equal(new Set(activeSamples).size,activeSamples.length,'Quiet samples may repeat; active five-second-offset states must not.');
  const phases=gather(n).map(e=>Math.round(e.start%5000)); assert.ok(new Set(phases).size>35);
});

test('each downstream packet waits for its explicit parent arrival and relay delay', () => {
  const n=make();let checked=0;
  for(let t=0;t<100000;t+=170){
    const s=n.snapshot(t),byId=new Map(s.edges.map(e=>[e.id,e]));
    for(const e of s.edges){if(!e.parent)continue;const parent=byId.get(e.parent);assert.ok(parent);assert.equal(parent.event,e.event);assert.equal(parent.packet,e.packet);assert.equal(parent.to,e.from);assert.equal(parent.hop+1,e.hop);assert.ok(e.start>=parent.start+parent.duration+e.relayDelay-1e-7);assert.ok(e.start>parent.start+parent.duration);checked++;}
  }
  assert.ok(checked>100);
});

test('fanout duplicates the same arrived packet to exactly two distinct receivers', () => {
  const n=make();let fanout=0;
  for(let t=0;t<90000;t+=200){const s=n.snapshot(t);for(const event of s.events.filter(e=>e.kind==='fanout')){
    const edges=s.edges.filter(e=>e.event===event.id),inputs=edges.filter(e=>e.parent===null);
    assert.equal(inputs.length,event.packetCount);
    for(const input of inputs){const children=edges.filter(e=>e.parent===input.id);assert.equal(children.length,2);assert.equal(new Set(children.map(e=>e.to)).size,children.length);assert.ok(children.every(e=>e.from===input.to&&e.packet===input.packet));}
    fanout++;
  }}assert.ok(fanout>0);
});

test('a working event overlaps later starts elsewhere, with multiple simultaneous directions', () => {
  const n=make();let overlap=false,multipleDirections=false;
  for(let t=0;t<100000;t+=80){const s=n.snapshot(t);overlap ||= s.events.length>=2&&Math.abs(s.events[0].start-s.events[1].start)>100;
    const moving=s.edges.filter(e=>e.moving);multipleDirections ||= moving.some(a=>moving.some(b=>a.event!==b.event&&(a.toPoint.x-a.fromPoint.x)*(b.toPoint.x-b.fromPoint.x)<0));}
  assert.ok(overlap);assert.ok(multipleDirections);
});

test('active link load is bounded without rendering the full candidate pool', () => {
  const n=make();let busiest=0;
  for(let t=0;t<150000;t+=25){const s=n.snapshot(t);busiest=Math.max(busiest,s.activeEdgeCount);assert.ok(s.activeEdgeCount<=MAX_ACTIVE_LINKS,`${t}: ${s.activeEdgeCount}`);assert.ok(s.events.length<=2);assert.ok(s.activeNodes.length<=s.activeEdgeCount*2);assert.ok(s.activeNodes.length<=12);}
  assert.ok(busiest>=5);
});

test('every sender has at most two simultaneous receivers across both event streams',()=>{
  const n=make();let checked=0;
  for(let t=0;t<180000;t+=15){const s=n.snapshot(t),senders=new Map();
    for(const e of s.edges.filter(e=>e.moving||e.visible)){
      if(!senders.has(e.from))senders.set(e.from,new Set());senders.get(e.from).add(e.to);
    }
    for(const [sender,receivers]of senders){assert.ok(receivers.size<=2,`${t}: ${sender} has ${receivers.size} receivers`);checked++;}
    assert.ok(s.activeEdgeCount<=5);
  }
  assert.ok(checked>1000);
});

test('hop speed is distance-adaptive and slightly slower, with room between train packets',()=>{
  const n=make();let checked=0;
  for(let t=0;t<60000;t+=150)for(const e of n.snapshot(t).edges){
    const d=Math.hypot(e.toPoint.x-e.fromPoint.x,e.toPoint.y-e.fromPoint.y),expected=Math.max(390,Math.min(700,305+d*.17));
    assert.ok(Math.abs(e.duration-expected)<1e-7);assert.ok(e.packetInterval>=135&&e.packetInterval<205);checked++;
  }
  assert.ok(checked>100);
});

test('planning boundaries preserve cross-window packets and never reset all events together', () => {
  const n=make();const events=gather(n,WINDOW_MS*5);let crossing;
  for(const e of events){const offset=e.stream===0?0:-19317,boundary=offset+(Math.floor((e.start-offset)/WINDOW_MS)+1)*WINDOW_MS;if(e.end>boundary+2){crossing={e,boundary};break;}}
  assert.ok(crossing,'Fixture includes a real event crossing a planning boundary.');
  const {e,boundary}=crossing,a=n.snapshot(boundary-1),b=n.snapshot(boundary+1);
  assert.ok(a.events.some(v=>v.id===e.id));assert.ok(b.events.some(v=>v.id===e.id));
  for(const edge of a.edges.filter(v=>v.event===e.id)){const after=b.edges.find(v=>v.id===edge.id);assert.ok(after);assert.equal(after.start,edge.start);assert.equal(after.duration,edge.duration);assert.ok(after.progress>=edge.progress);}
});

test('an idle frame draws nothing and returns the actual next wake delay', () => {
  const n=make();let idle=-1;
  for(let t=1000;t<120000;t+=50)if(!n.snapshot(t).active&&Number.isFinite(n.nextWake(t))&&n.nextWake(t)>20){idle=t;break;}
  assert.ok(idle>0);const ctx=fakeContext(),delay=n.nextWake(idle);
  assert.equal(n.render(ctx,{now:idle}),false);assert.deepEqual(ctx.operations,[]);assert.equal(ctx.gradients.length,0);
  assert.equal(n.snapshot(idle).activeNodes.length,0);assert.equal(n.snapshot(idle).edges.length,0);
  assert.equal(n.render(null,{now:idle+delay-.01}),false);assert.equal(n.render(null,{now:idle+delay+.01}),true);
});

test('head and phone participate naturally in real links without periodic alternation', () => {
  const n=make(),people=new Set(),starts=[];
  for(let t=0;t<180000;t+=120){const s=n.snapshot(t);for(const e of s.edges){if(e.fromKind==='head'||e.fromKind==='phone')people.add(e.fromKind);if(e.toKind==='head'||e.toKind==='phone')people.add(e.toKind);}for(const e of s.events)if(e.source==='head'||e.source==='phone')starts.push(e.start);}
  assert.deepEqual([...people].sort(),['head','phone']);assert.ok(new Set(starts).size>=4);
  const all=gather(n);assert.ok(all.some(e=>!e.stations.some(id=>id==='head'||id==='phone')));
});

test('active channels use a single cold core and soft light with no dark stroke', () => {
  const n=make();let t=0;
  while(t<10000&&!n.snapshot(t).edges.some(e=>e.moving&&e.progress>.2))t+=30;
  const ctx=fakeContext();assert.equal(n.render(ctx,{now:t}),true);
  const strokes=ctx.operations.filter(v=>v[0]==='stroke');assert.ok(strokes.length>0);assert.ok(strokes.every(v=>v[1]==='screen'));assert.ok(strokes.every(v=>/^#[a-f\d]{6}$/i.test(v[4])&&parseInt(v[4].slice(1,3),16)>=160));assert.ok(ctx.gradients.length>0);
  for(const e of n.snapshot(t).edges.filter(e=>e.moving)){const length=Math.hypot(e.toPoint.x-e.fromPoint.x,e.toPoint.y-e.fromPoint.y);assert.ok((e.progress-e.tailStart)*length<=75.0001);}
});

test('reduced motion is a fixed sparse topology without packet sweeps or changing timers', () => {
  const n=make(),a=fakeContext(),b=fakeContext();assert.equal(n.render(a,{now:700,reducedMotion:true}),false);assert.equal(n.render(b,{now:15700,reducedMotion:true}),false);assert.deepEqual(a.operations,b.operations);assert.equal(a.gradients.length,0);assert.ok(a.operations.filter(v=>v[0]==='arc').length<=4);
});

test('clock jumps select current events and do not queue hidden historical emissions', () => {
  const n=make();n.snapshot(750);const t=373950,s=n.snapshot(t),fresh=make().snapshot(t);assert.deepEqual(s,fresh);assert.ok(s.events.every(e=>e.start<=t&&e.end>t));assert.ok(s.events.every(e=>t-e.start<2900));assert.ok(s.edges.every(e=>e.start>=t-2900));
});

test('deterministic sampling and old methods do not depend on render history', () => {
  const a=make(),b=make(),expected=a.snapshot(15800);b.snapshot(999999);b.render(fakeContext(),{now:2900});b.render(null,{now:10,reducedMotion:true});assert.deepEqual(b.sample(15800),expected);assert.notDeepEqual(make('other').snapshot(15800).events,expected.events);
  const changed=a.snapshot(15800);if(changed.edges.length)changed.edges[0].fromPoint.x=-1;assert.deepEqual(a.snapshot(15800),expected);assert.equal(typeof a.nextWake,'function');assert.equal(a.nodes.length,nodes.length);
});

test('source geometry remains unchanged and all packet endpoints are actual supplied anchors', () => {
  const mutable=nodes.map(n=>({...n})),n=create({nodes:mutable,seed:'geometry'}),known=new Map(nodes.map(v=>[v.id,v]));mutable[0].x=999999;
  assert.equal(n.nodes[0].x,nodes[0].x);assert.ok(Object.isFrozen(n.nodes));assert.ok(Object.isFrozen(n.nodes[0]));
  for(let t=0;t<60000;t+=200)for(const e of n.snapshot(t).edges){assert.notEqual(e.from,e.to);assert.deepEqual(e.fromPoint,{x:known.get(e.from).x,y:known.get(e.from).y});assert.deepEqual(e.toPoint,{x:known.get(e.to).x,y:known.get(e.to).y});}
});

test('invalid and isolated graphs fail clearly or remain quiet', () => {
  assert.throws(()=>create({nodes:[{id:'bad',x:Infinity,y:0}]}),TypeError);assert.throws(()=>create({nodes:[{id:'bad',x:0,y:-1}]}),TypeError);assert.throws(()=>create({nodes:[nodes[0],nodes[0]]}),TypeError);assert.throws(()=>create({nodes,period:0}),RangeError);assert.throws(()=>create({}),TypeError);
  for(const fixture of[[],[nodes[0]],[{id:'a',x:5,y:5},{id:'b',x:5,y:5}]]){const n=create({nodes:fixture});assert.equal(n.render(null,{now:800}),false);assert.equal(n.nextWake(800),Infinity);assert.deepEqual(n.snapshot(800).edges,[]);}
});
