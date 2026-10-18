'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('./scene-data.js');
const pointInPolygon = (p, polygon) => {
  let inside = false;
  for (let i=0,j=polygon.length-1; i<polygon.length; j=i++) {
    const [xi,yi] = polygon[i], [xj,yj] = polygon[j];
    if (((yi>p[1])!==(yj>p[1])) && p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
};
test('all paths and nodes use the original photo coordinate space', () => {
  assert.equal(data.width,4032); assert.equal(data.height,3024);
  for (const points of [...data.ridges.map(r=>r.points),...Object.values(data.masks)]) {
    assert.ok(points.length>=4);
    for (const [x,y] of points) assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=4032&&y>=0&&y<=3024,`${x},${y}`);
  }
  for (const n of data.nodes) assert.ok(n.x>=0&&n.x<=4032&&n.y>=0&&n.y<=3024);
});
test('background candle routes are open chronological profiles, with no near cairn paths', () => {
  assert.equal(data.ridges.length,6);
  assert.equal(new Set(data.ridges.map(r=>r.id)).size,data.ridges.length);
  for (const r of data.ridges) {
    assert.ok(['far','middle'].includes(r.depth));
    assert.ok(!/cairn/i.test(r.id));
    assert.notDeepEqual(r.points[0],r.points.at(-1));
    for (let i=1;i<r.points.length;i++) assert.ok(r.points[i][0]>r.points[i-1][0],`${r.id} x ${i}`);
    if(r.id!=='terrain-boundary') assert.ok(!r.points.some(p=>pointInPolygon(p,data.masks.mainCairn)),`${r.id} intersects foreground cairn`);
  }
});
test('background route coverage includes western hill and multiple internal mountain crowns', () => {
  const sky=data.ridges.find(r=>r.id==='main-skyline');
  assert.ok(sky.points[0][0]<30&&sky.points.at(-1)[0]>3990);
  assert.ok(sky.inferredRanges.length>=1);
  assert.ok(data.ridges.some(r=>r.id==='western-glacier-hill'));
  assert.ok(data.ridges.some(r=>r.id==='western-central-glacier'));
  assert.ok(data.ridges.some(r=>r.id==='central-glacier-front'));
  assert.equal(data.ridges.filter(r=>/eastern/.test(r.id)).length,1);
  for (const r of data.ridges) {
    let hasUp=false,hasDown=false;
    for(let i=1;i<r.points.length;i++) { hasUp ||= r.points[i][1]<r.points[i-1][1]-0.25; hasDown ||= r.points[i][1]>r.points[i-1][1]+0.25; }
    assert.ok(hasUp&&hasDown,`${r.id} is a single-slope trace`);
  }
});
test('the red joins remain while the round 9 green loop trims the western crown', () => {
  const get=id=>data.ridges.find(r=>r.id===id);
  const lower=get('western-central-glacier'),upper=get('central-glacier-front'),east=get('eastern-front-ridge');
  assert.deepEqual(lower.mergedFrom,['western-ice-crest','central-lower-crown']);
  assert.deepEqual(upper.mergedFrom,['central-upper-crown','glacier-front-crown']);
  for(const old of [...lower.mergedFrom,...upper.mergedFrom]) assert.equal(get(old),undefined);
  assert.ok(lower.points[0][0]<800&&lower.points.at(-1)[0]>=1578&&lower.points.at(-1)[0]<=1580);
  assert.ok(upper.points[0][0]<1510&&upper.points.at(-1)[0]>2550);
  assert.ok(east.points[0][0]>=2678&&east.points.at(-1)[0]>=3024);
  assert.equal(get('eastern-inner-ridge'),undefined);
  assert.ok(east.points.at(-1)[0]>4000);
  const heightAt=(r,x)=>{const i=r.points.findIndex(p=>p[0]>=x),a=r.points[i-1],b=r.points[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);};
  // The green-crossed original heads no longer survive as extra peaks.
  assert.ok(heightAt(lower,1550)>760);
  assert.ok(heightAt(upper,2000)>700);
  assert.match(data.provenance.round8RidgeAnnotationSha256,/^[a-f0-9]{64}$/);
});
test('round 9 keeps the central red boundary and cuts both green-crossed ends',()=>{
  const r=data.ridges.find(r=>r.id==='terrain-boundary');
  assert.equal(r.points[0][0],1433.6);assert.equal(r.points.at(-1)[0],3727.4);
  assert.equal(r.occlusion,'foreground-cairns');
  const ground=r.points.filter(([x])=>x>=1433&&x<=2282).map(p=>p[1]);
  assert.ok(Math.min(...ground)<900&&Math.max(...ground)>1050,'the latest red curve follows the central marked crests');
  for(let i=1;i<r.points.length;i++)assert.ok(r.points[i][0]-r.points[i-1][0]<=7,'the marked central boundary is sampled as one continuous route');
  assert.match(data.provenance.round9RidgeAnnotationSha256,/^[a-f0-9]{64}$/);
});
test('annotated and added relay nodes remain distinct, including hood and hand-held phone', () => {
  assert.equal(data.nodes.length,42);
  assert.equal(new Set(data.nodes.map(n=>n.id)).size,data.nodes.length);
  assert.equal(data.nodes.filter(n=>n.source==='marker').length,35);
  assert.equal(data.nodes.filter(n=>n.source==='added').length,7);
  const head=data.nodes.find(n=>n.kind==='head'), phone=data.nodes.find(n=>n.kind==='phone');
  assert.ok(head&&phone);
  assert.ok(head.x>1650&&head.x<1720&&head.y>1500&&head.y<1580,'head relay stays on hood');
  assert.ok(phone.x>2070&&phone.x<2150&&phone.y>1640&&phone.y<1735,'phone relay stays at hand-held device');
  assert.ok(Math.hypot(phone.x-head.x,phone.y-head.y)>300);
});
test('depth boundaries and closed cairn provide the requested foreground overlap', () => {
  const {middleBoundary,foregroundBoundary,mainCairn}=data.masks;
  assert.ok(middleBoundary[0][0]===0&&middleBoundary.at(-1)[0]===4032);
  assert.ok(foregroundBoundary[0][0]===0);
  assert.deepEqual(mainCairn[0],mainCairn.at(-1));
  // Top and lower body belong to the large cairn; the left glacier and person's
  // face must not be included in this independent letter-occlusion silhouette.
  assert.ok(pointInPolygon([1400,1150],mainCairn));
  assert.ok(pointInPolygon([1400,1400],mainCairn));
  assert.ok(!pointInPolygon([1000,950],mainCairn));
  assert.ok(!pointInPolygon([1770,1550],mainCairn));
});
