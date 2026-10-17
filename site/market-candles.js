(function(root,factory){
  'use strict';
  const api=typeof module==='object'&&module.exports
    ?factory(require('./scene-core.js'),require('./candle-core.js'))
    :factory(root.SceneCore,root.RidgeCandles);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.MarketCandles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,RidgeCandles){
  'use strict';
  const PRICE_ORIGIN=20000,PRICE_PER_PIXEL=5,BODY_WIDTH_SCALE=.9;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const price=y=>PRICE_ORIGIN-y*PRICE_PER_PIXEL;
  function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
  function random(seed){let s=seed>>>0;return()=>{s+=0x6d2b79f5;let t=Math.imul(s^s>>>15,s|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function pointsOf(ridge){
    if(!ridge||!Array.isArray(ridge.points))throw new TypeError('A ridge with points is required');
    const points=ridge.points;
    for(let i=0;i<points.length;i++)if(!Array.isArray(points[i])||!Number.isFinite(points[i][0])||!Number.isFinite(points[i][1])||(i&&points[i][0]<=points[i-1][0]))throw new TypeError('Ridge coordinates must be finite and strictly increasing in x');
    return points;
  }
  function at(points,x){
    if(!points.length)return null;
    if(x<=points[0][0])return points[0][1];if(x>=points.at(-1)[0])return points.at(-1)[1];
    let low=0,high=points.length-1;while(high-low>1){const middle=(low+high)>>1;if(points[middle][0]<=x)low=middle;else high=middle;}
    const a=points[low],b=points[high];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);
  }
  function interpolate(ridge,x){if(!Number.isFinite(x))throw new TypeError('Finite x is required');return at(pointsOf(ridge),x);}
  function simplify(points,epsilon){
    if(points.length<3)return points.slice();const keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];
    while(stack.length){const [lo,hi]=stack.pop(),a=points[lo],b=points[hi],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);let best=-1,max=epsilon;
      for(let i=lo+1;i<hi;i++){const p=points[i],d=Math.abs(dy*(p[0]-a[0])-dx*(p[1]-a[1]))/length;if(d>max){max=d;best=i;}}
      if(best>=0){keep.add(best);stack.push([lo,best],[best,hi]);}
    }return [...keep].sort((a,b)=>a-b).map(i=>points[i]);
  }
  function criticalTurns(points,step){
    const simple=simplify(points,step*.20),out=[];
    for(let i=1;i<simple.length-1;i++){
      const a=simple[i-1],b=simple[i],c=simple[i+1];if((b[1]-a[1])*(c[1]-b[1])>=0)continue;
      const peak=b[1]<a[1],near=points.filter(p=>p[0]>=a[0]&&p[0]<=c[0]);
      const extreme=near.reduce((best,p)=>(peak?p[1]<best[1]:p[1]>best[1])?p:best,near[0]);
      out.push({x:extreme[0],y:extreme[1],score:Math.min(Math.abs(extreme[1]-a[1]),Math.abs(c[1]-extreme[1]))});
    }
    return out.sort((a,b)=>b.score-a.score||a.x-b.x);
  }
  function sampleCenters(ridge,source,step){
    const points=ridge.points,count=source.length,nominal=source.map(b=>b.x),anchors=new Map([[0,{x:nominal[0],kind:'edge'}],[count-1,{x:nominal.at(-1),kind:'edge'}]]);
    const impulseIndices=new Set(),critical=criticalTurns(points,step);
    function nearest(x){return nominal.reduce((best,v,i)=>Math.abs(v-x)<Math.abs(nominal[best]-x)?i:best,0);}
    function add(index,x,kind){
      if(index<=0||index>=count-1||Math.abs(x-nominal[index])>step*.78)return false;
      if(anchors.has(index)&&anchors.get(index).kind==='impulse')return false;
      for(const [j,a]of anchors){if(j===index)continue;const gap=(x-a.x)/(index-j);if(gap<step*.62||gap>step*1.55)return false;}
      anchors.set(index,{x,kind});return true;
    }
    // Resolve the reference impulse on the actual ascending flank and summit.
    // Both its open and close are sampled terrain values, so its long body and
    // the orange closing-price contour share the same mountain geometry.
    for(const reference of ridge.marketAnchors||[]){
      const candidates=critical.filter(p=>Math.abs(p.x-reference.targetX)<step*1.5);
      if(!candidates.length)continue;const peak=candidates.reduce((a,b)=>a.y<b.y?a:b),index=nearest(peak.x);
      if(!add(index,peak.x,'impulse'))continue;
      const target=peak.y+(reference.referenceBodyHeight||Math.abs(reference.openY-reference.closeY));let crossing=null;
      for(let i=1;i<points.length&&points[i][0]<=peak.x;i++){const a=points[i-1],b=points[i];if(a[1]>=target&&b[1]<=target&&a[1]!==b[1])crossing=a[0]+(b[0]-a[0])*(target-a[1])/(b[1]-a[1]);}
      if(crossing!==null)add(index-1,crossing,'flank');impulseIndices.add(index);
    }
    const maxAnchors=Math.max(1,Math.ceil(count*.24));let assigned=0;
    for(const candidate of critical){if(assigned>=maxAnchors)break;const index=nearest(candidate.x);if(anchors.has(index))continue;if(add(index,candidate.x,'turn'))assigned++;}
    const ordered=[...anchors].sort((a,b)=>a[0]-b[0]),centers=nominal.slice();
    for(let i=1;i<ordered.length;i++){const [lo,a]=ordered[i-1],[hi,b]=ordered[i];for(let j=lo;j<=hi;j++)centers[j]=a.x+(b.x-a.x)*(j-lo)/(hi-lo);}
    return {centers,anchors,impulseIndices};
  }
  // Include the original contour vertices as well as every sampled close.
  // This prevents a line renderer from cutting across an unsampled sharp peak.
  function pricePath(ridge,bars=[]){
    const points=pointsOf(ridge);if(points.length<2)return[];
    const xs=new Set(points.map(p=>p[0]));for(const b of bars)if(Number.isFinite(b.x)&&b.x>=points[0][0]&&b.x<=points.at(-1)[0])xs.add(b.x);
    return [...xs].sort((a,b)=>a-b).map(x=>[x,at(points,x)]);
  }
  function create(ridge,{variant='corrected'}={}){
    if(variant!=='corrected'&&variant!=='expressive')throw new RangeError('Unknown market-candle variant');
    const points=pointsOf(ridge);if(points.length<2)return[];
    const source=RidgeCandles.createCandles(points,{id:ridge.id,depth:ridge.depth,profile:'active',count:Core.candleCount(ridge)});
    if(!source.length)return[];
    const step=(points.at(-1)[0]-points[0][0])/source.length,{centers,anchors,impulseIndices}=sampleCenters(ridge,source,step);
    const closes=centers.map(x=>at(points,x)),rng=random(hash(`${ridge.id}|${variant}|contour-market`));
    const dojiIndices=new Set();
    if(variant==='expressive'&&source.length>=8){
      const flat=closes.map((y,i)=>({i,d:Math.abs(y-(i?closes[i-1]:points[0][1]))})).filter(p=>p.i>1&&!impulseIndices.has(p.i)&&p.d<step*.45);
      const count=Math.max(1,Math.floor(source.length/18));for(let j=0;j<count&&flat.length;j++){const target=Math.round((j+.6)*source.length/(count+1)),chosen=flat.filter(p=>![...dojiIndices].some(i=>Math.abs(i-p.i)<7)).sort((a,b)=>Math.abs(a.i-target)-Math.abs(b.i-target))[0];if(chosen)dojiIndices.add(chosen.i);}
    }
    return source.map((b,i)=>{
      const closeY=closes[i],previousCloseY=i?closes[i-1]:points[0][1];let openY=previousCloseY;
      if(variant==='expressive'&&!impulseIndices.has(i)){
        const delta=Math.abs(closeY-previousCloseY),u=rng(),sign=[1,1,-1,1,-1,-1,1,-1][i%8];
        if(dojiIndices.has(i))openY=closeY+step*.015*(i%2?1:-1);
        else if((delta<step*.32&&i%3!==1)||(delta<step*.75&&i%7===3)){
          const desired=closeY+sign*step*(.42+u*.43);openY=previousCloseY+clamp(desired-previousCloseY,-step*.9,step*.9);
        }
      }
      const top=Math.min(openY,closeY),bottom=Math.max(openY,closeY),baseUpper=Math.min(b.openY,b.closeY)-b.highY,baseLower=b.lowY-Math.max(b.openY,b.closeY);
      const upper=variant==='expressive'?Math.max(2.5,baseUpper*1.22,step*(.12+rng()*.48)):Math.max(2.5,baseUpper);
      const lower=variant==='expressive'?Math.max(2.5,baseLower*1.22,step*(.12+rng()*.48)):Math.max(2.5,baseLower);
      const startX=i?centers[i-1]:points[0][0],endX=i===source.length-1?points.at(-1)[0]:centers[i];
      let pathTop=Math.min(previousCloseY,closeY),pathBottom=Math.max(previousCloseY,closeY);
      for(const [x,y]of points)if(x>=startX&&x<=endX){pathTop=Math.min(pathTop,y);pathBottom=Math.max(pathBottom,y);}
      const highY=Math.min(top,pathTop)-upper,lowY=Math.max(bottom,pathBottom)+lower,volume=Math.round(700+rng()*1250+(lowY-highY)*7);
      const ma5Y=i<4?null:closes.slice(i-4,i+1).reduce((sum,v)=>sum+v,0)/5;
      return {...b,x:centers[i],nominalX:b.x,anchorY:closeY,openY,closeY,highY,lowY,bodyWidth:b.bodyWidth*BODY_WIDTH_SCALE,rising:closeY<openY,volume,ma5Y,
        openPrice:price(openY),closePrice:price(closeY),highPrice:price(highY),lowPrice:price(lowY),gapY:openY-previousCloseY,
        contourAnchor:anchors.get(i)?.kind||null,impulse:impulseIndices.has(i),variant,synthetic:true,volumeSynthetic:true,doji:Math.abs(closeY-openY)/(lowY-highY)<=.1};
    });
  }
  return Object.freeze({create,pricePath,interpolate,PRICE_ORIGIN,PRICE_PER_PIXEL,BODY_WIDTH_SCALE});
});
