/* Local photographic depth shading in original 4032 × 3024 coordinates.
   The caller draws this immediately after the photograph and before research ink.
   A cached quarter-resolution alpha texture supplies one inexpensive drawImage. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SceneDepth = api;
})(typeof window !== 'undefined' ? window : null, function (root) {
  'use strict';
  const DEFAULTS = Object.freeze({
    width: 4032, height: 3024, resolution: .25,
    backgroundHeight: 265, backgroundStrength: .30, boundaryBlend: 95,
    foregroundHeight: 220, foregroundStrength: .23,
    cairnRadius: 80, cairnStrength: .30,
    color: Object.freeze([6, 22, 35])
  });
  const cache = [];
  const EMPTY_OBJECT = Object.freeze({}), EMPTY_POINTS = Object.freeze([]);
  const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
  const smooth = t => { t=clamp(t); return t*t*(3-2*t); };
  function pointsOf(value) {
    const source = Array.isArray(value) ? value : value?.points;
    return (source || []).filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])).map(p=>[p[0],p[1]]);
  }
  function fromPath(value) {
    if (typeof value !== 'string') return pointsOf(value);
    const numbers=value.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number)||[],result=[];
    for(let i=0;i+1<numbers.length;i+=2)result.push([numbers[i],numbers[i+1]]);
    return result;
  }
  function bounds(points) {
    if(!points.length)return null;
    return {x0:Math.min(...points.map(p=>p[0])),y0:Math.min(...points.map(p=>p[1])),x1:Math.max(...points.map(p=>p[0])),y1:Math.max(...points.map(p=>p[1]))};
  }
  function inBounds(b,x,y,pad=0){return b&&x>=b.x0-pad&&x<=b.x1+pad&&y>=b.y0-pad&&y<=b.y1+pad;}
  function contains(points,x,y){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
  function envelope(points){
    const map=new Map();for(const p of points){const prior=map.get(p[0]);if(prior===undefined||p[1]<prior)map.set(p[0],p[1]);}
    return [...map].sort((a,b)=>a[0]-b[0]);
  }
  function heightAt(points,x){
    if(!points.length)return Infinity;
    if(x<=points[0][0])return points[0][1];if(x>=points.at(-1)[0])return points.at(-1)[1];
    let lo=0,hi=points.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(points[m][0]<=x)lo=m;else hi=m;}
    const a=points[lo],b=points[hi],t=(x-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;
  }
  function nearestDistance(points,x,y){
    let best=Infinity;for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[j],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1));
      const ox=x-a[0]-t*dx,oy=y-a[1]-t*dy;best=Math.min(best,ox*ox+oy*oy);
    }return Math.sqrt(best);
  }
  function resolve(options){
    const data=options.data||root?.SceneData||EMPTY_OBJECT,cairn=options.cairn||root?.CairnMask||EMPTY_OBJECT;
    const terrain=options.terrain||data.ridges?.find(r=>r.id==='terrain-boundary')||data.terrainBoundary||root?.TerrainBoundary||root?.TerrainBoundaryData||EMPTY_OBJECT;
    const person=options.person||root?.FOREGROUND_PATH||EMPTY_POINTS;
    const params={...DEFAULTS,...options};
    params.resolution=clamp(Number(params.resolution)||DEFAULTS.resolution,.1,.5);
    return {data,cairn,terrain,person,params};
  }
  function prepareGeometry(options={}){
    const input=resolve(options),{params}=input;
    const middle=envelope(pointsOf(input.data.masks?.middleBoundary));
    const precise=envelope(pointsOf(input.terrain));
    const foreground=envelope(pointsOf(input.data.masks?.foregroundBoundary));
    const cairn=pointsOf(input.cairn).length?pointsOf(input.cairn):pointsOf(input.data.masks?.mainCairn);
    const person=fromPath(input.person);
    return {...input,middle,precise,foreground,cairn,person,cairnBounds:bounds(cairn),personBounds:bounds(person),preciseBounds:bounds(precise),params};
  }
  function middleY(geometry,x){
    const base=heightAt(geometry.middle,x),p=geometry.precise,b=geometry.preciseBounds;
    if(!b||x<b.x0||x>b.x1)return base;
    const blend=geometry.params.boundaryBlend,weight=smooth(Math.min(x-b.x0,b.x1-x)/Math.max(1,blend));
    return base+(heightAt(p,x)-base)*weight;
  }
  function opacityAt(geometry,x,y,mode='background'){
    if(mode==='none')return 0;
    const p=geometry.params,boundary=middleY(geometry,x),d=boundary-y;
    let background=d>=0&&d<p.backgroundHeight?p.backgroundStrength*Math.pow(1-smooth(d/p.backgroundHeight),1.25):0;
    let front=0;
    if(mode==='both'){
      const fy=heightAt(geometry.foreground,x),fd=fy-y;
      // The rear contact band is strongest near the main platform and attenuates toward the feet.
      const heightWeight=1-smooth((fy-1760)/1050);
      if(fd>=0&&fd<p.foregroundHeight)front=p.foregroundStrength*Math.pow(1-smooth(fd/p.foregroundHeight),1.35)*heightWeight;
      if(inBounds(geometry.cairnBounds,x,y,p.cairnRadius*2.8)){
        const distance=nearestDistance(geometry.cairn,x-17,y-23);
        const air=p.cairnStrength*Math.exp(-.5*(distance/p.cairnRadius)**2);
        front=1-(1-front)*(1-air);
      }
    }
    let alpha=1-(1-background)*(1-front);
    if(alpha>0){
      if(inBounds(geometry.cairnBounds,x,y)&&contains(geometry.cairn,x,y))return 0;
      if(inBounds(geometry.personBounds,x,y)&&contains(geometry.person,x,y))return 0;
    }
    return clamp(alpha,0,.52);
  }
  function buildMask(options={}){
    const mode=['none','background','both'].includes(options.mode)?options.mode:'background';
    const geometry=prepareGeometry(options),p=geometry.params,width=Math.round(p.width*p.resolution),height=Math.round(p.height*p.resolution);
    const pixels=new Uint8ClampedArray(width*height*4),sx=p.width/width,sy=p.height/height;
    if(mode!=='none')for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4,alpha=opacityAt(geometry,(x+.5)*sx,(y+.5)*sy,mode);
      pixels[i]=p.color[0];pixels[i+1]=p.color[1];pixels[i+2]=p.color[2];pixels[i+3]=Math.round(alpha*255);
    }
    return {width,height,pixels,geometry,mode,photoWidth:p.width,photoHeight:p.height};
  }
  function makeTexture(options){
    const mask=buildMask(options);let texture;
    if(typeof OffscreenCanvas!=='undefined')texture=new OffscreenCanvas(mask.width,mask.height);
    else if(root?.document){texture=root.document.createElement('canvas');texture.width=mask.width;texture.height=mask.height;}
    else return null;
    const ctx=texture.getContext('2d'),image=ctx.createImageData(mask.width,mask.height);image.data.set(mask.pixels);ctx.putImageData(image,0,0);return texture;
  }
  function draw(ctx,options={}){
    const mode=options.mode||'none';if(!ctx||mode==='none')return false;
    if(!['background','both'].includes(mode))return false;
    const input=resolve(options),p=input.params;
    const key=[mode,p.width,p.height,p.resolution,p.backgroundHeight,p.backgroundStrength,p.boundaryBlend,p.foregroundHeight,p.foregroundStrength,p.cairnRadius,p.cairnStrength,p.color.join(',')].join(':');
    let entry=cache.find(e=>e.key===key&&e.data===input.data&&e.cairn===input.cairn&&e.terrain===input.terrain&&e.person===input.person);
    if(!entry){const texture=makeTexture({...options,mode});if(!texture)return false;entry={...input,key,texture};cache.push(entry);if(cache.length>6)cache.shift();}
    ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;ctx.drawImage(entry.texture,0,0,p.width,p.height);ctx.restore();return true;
  }
  return Object.freeze({draw,buildMask,prepareGeometry,opacityAt,middleY,heightAt,contains,DEFAULTS});
});
