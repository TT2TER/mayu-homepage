(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SceneCore=api;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const camera=Object.freeze({x:0,y:130,width:4032,height:2724});
  const origin=Object.freeze({x:1800,y:3000});
  function belowBoundary(points,width=4032,height=3024){return [...points,[width,height],[0,height]];}
  function contains(points,p){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>p.y)!==(b[1]>p.y)&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
  function affine(p,scale=1){return{x:origin.x+(p.x-origin.x)*scale,y:origin.y+(p.y-origin.y)*scale};}
  function inverse(p,scale=1){if(!(scale>0))throw new RangeError('Scale must be positive');return affine(p,1/scale);}
  function foregroundContains(masks,p){return contains(belowBoundary(masks.foregroundBoundary),p)||contains(masks.mainCairn,p);}
  function mapNodes(nodes,masks,scale){return nodes.map(n=>({...n,...(foregroundContains(masks,n)?affine(n,scale):{x:n.x,y:n.y})}));}
  function candleCount(ridge){const xs=ridge.points.map(p=>p[0]);return ridge.id==='main-skyline'?90:Math.max(4,Math.round((Math.max(...xs)-Math.min(...xs))/(4032/90)));}
  const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
  const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
  const envelopes=new WeakMap();
  function foregroundEnvelope(ridges){
    if(envelopes.has(ridges))return envelopes.get(ridges);
    // Ownership can change at a vertex, a route endpoint, or an intersection.
    // Build the actual lower envelope once; endpoint padding creates false winners.
    const routes=ridges.filter(r=>r.profile&&r.profile.maxX>r.profile.minX);
    const events=new Set(routes.flatMap(r=>r.profile.points.map(p=>p[0])));
    const segments=routes.map(route=>route.profile.segments.filter(segment=>segment.x0!==segment.x1).map(segment=>{
      const slope=(segment.y1-segment.y0)/(segment.x1-segment.x0);
      return {lo:Math.min(segment.x0,segment.x1),hi:Math.max(segment.x0,segment.x1),slope,intercept:segment.y0-slope*segment.x0};
    }).sort((a,b)=>a.lo-b.lo));
    for(let i=0;i<routes.length;i++)for(let j=i+1;j<routes.length;j++){
      let first=0;
      for(const a of segments[i]){
        while(first<segments[j].length&&segments[j][first].hi<a.lo)first++;
        for(let k=first;k<segments[j].length&&segments[j][k].lo<a.hi;k++){
          const b=segments[j][k],lo=Math.max(a.lo,b.lo),hi=Math.min(a.hi,b.hi);
          if(!(hi>lo)||Math.abs(a.slope-b.slope)<1e-12)continue;
          const x=(b.intercept-a.intercept)/(a.slope-b.slope);
          if(x>lo&&x<hi)events.add(x);
        }
      }
    }
    const xs=[...events].sort((a,b)=>a-b),spans=[];
    for(let i=1;i<xs.length;i++){
      const left=xs[i-1],right=xs[i],x=(left+right)/2;
      let owner=null,lowest=-Infinity;
      for(const route of routes){const point=route.profile.at(x);if(point&&point.y>lowest){owner=route;lowest=point.y;}}
      if(!owner)continue;
      const last=spans.at(-1);
      if(last&&last.route===owner&&Math.abs(last.right-left)<1e-7)last.right=right;
      else spans.push({left,right,route:owner});
    }
    // A short gap between two lower-route endpoints should hand off between
    // those endpoints, rather than briefly revealing a distant skyline above it.
    for(let i=1;i<spans.length-1;i++){
      const before=spans[i-1],gap=spans[i],after=spans[i+1];
      const left=before.route.profile,right=after.route.profile;
      const limit=Math.min((left.maxX-left.minX)*.2,(right.maxX-right.minX)*.2);
      if(gap.right-gap.left>limit||Math.abs(left.maxX-gap.left)>1e-7||Math.abs(right.minX-gap.right)>1e-7)continue;
      const higher=gap.route.profile.at((gap.left+gap.right)/2);
      if(!higher||higher.y>=Math.min(left.at(left.maxX).y,right.at(right.minX).y))continue;
      const join=(gap.left+gap.right)/2;before.right=join;after.left=join;spans.splice(i,1);i--;
    }
    envelopes.set(ridges,spans);return spans;
  }
  function foregroundRadius(route,scale,screenDepth=0){
    // Widen only after foreground discovery has reached full strength.
    // The default retains the original radius used by route handoff geometry.
    const spread=smooth((screenDepth-115)/185);
    return Math.min((68+26*spread)/scale,(route.profile.maxX-route.profile.minX)*(.2+.08*spread));
  }
  function foregroundProjection(p,scale,ridges){
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!(scale>0)||!Number.isFinite(scale))return null;
    const spans=foregroundEnvelope(ridges),index=spans.findIndex(span=>p.x>=span.left&&p.x<=span.right);
    if(index<0)return null;
    const owner=spans[index];let routes=[{route:owner.route,share:1}],boundary=null,mix=0;
    for(const neighborIndex of [index-1,index+1]){
      const neighbor=spans[neighborIndex];if(!neighbor)continue;
      const edge=neighborIndex<index?owner.left:owner.right;
      if(Math.abs((neighborIndex<index?neighbor.right:neighbor.left)-edge)>1e-7)continue;
      // Half-span caps keep consecutive blends disjoint: never light a third route.
      const radius=Math.min(48/scale,(owner.right-owner.left)/2,(neighbor.right-neighbor.left)/2,foregroundRadius(owner.route,scale),foregroundRadius(neighbor.route,scale));
      if(!(radius>0)||Math.abs(p.x-edge)>=radius)continue;
      const left=neighborIndex<index?neighbor:owner,right=neighborIndex<index?owner:neighbor;
      mix=smooth((p.x-edge+radius)/(2*radius));boundary={edge,radius};
      routes=[{route:left.route,share:1-mix},{route:right.route,share:mix}];break;
    }
    const targets=routes.map(({route,share})=>{
      const x=clamp(p.x,route.profile.minX,route.profile.maxX),point=route.profile.at(x);
      return {id:route.id,x,y:point.y,weight:share};
    });
    const ownerPoint=owner.route.profile.at(clamp(p.x,owner.route.profile.minX,owner.route.profile.maxX));
    // A conservative continuous depth gate stays below the actual lowest ridge.
    // It approaches the lower of both routes before crossing a discontinuous endpoint.
    const lowest=Math.max(...targets.map(target=>target.y));
    const lower=boundary?ownerPoint.y+(lowest-ownerPoint.y)*smooth(1-Math.abs(p.x-boundary.edge)/boundary.radius):ownerPoint.y;
    const weight=smooth((p.y-lower-20/scale)/(95/scale));
    if(!weight)return null;
    const screenDepth=(p.y-lower)*scale;
    for(let i=0;i<targets.length;i++){
      targets[i].weight*=weight;
      targets[i].radius=foregroundRadius(routes[i].route,scale,screenDepth);
    }
    const primary=targets.reduce((best,target)=>target.weight>best.weight?target:best);
    return {...primary,targets};
  }
  function foregroundHeat(projection,id,x){
    if(!projection||!Number.isFinite(x))return 0;
    let heat=0;
    for(const target of projection.targets||[projection]){
      if(target.id!==id||!(target.radius>0))continue;
      const distance=Math.abs(x-target.x)/target.radius;
      if(distance<1-1e-12)heat=Math.max(heat,target.weight*Math.cos(distance*Math.PI/2)**2);
    }
    return heat;
  }
  return Object.freeze({camera,origin,contains,belowBoundary,affine,inverse,foregroundContains,mapNodes,candleCount,foregroundProjection,foregroundHeat,foregroundRadius});
});
