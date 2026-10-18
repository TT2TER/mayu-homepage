'use strict';
(() => {
  const canvas=document.querySelector('#scene'),hero=document.querySelector('.hero'),ctx=canvas.getContext('2d');
  if(!ctx){hero.dataset.sceneState='fallback';canvas.tabIndex=-1;return;}
  const W=4032,H=3024,C=SceneCore.camera,reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const params=new URLSearchParams(location.search),review=params.get('review');
  const inspection=review==='inspection',held=review&&params.has('at')?Math.max(0,Number(params.get('at'))||0):null;
  const fixedPointer=review&&params.has('x')&&params.has('y')?{x:Number(params.get('x')),y:Number(params.get('y'))}:null;
  let target=fixedPointer||(review==='hover'?{x:3000,y:770}:review==='foreground'?{x:2200,y:2400}:null),focus=target?{...target}:null,intensity=target?1:0;
  let ready=false,raf=0,wake=0,lastFrame=0,start=performance.now(),heroVisible=true;
  const photo=document.querySelector('.scene-photo')||new Image();photo.fetchPriority='high';
  if(!photo.getAttribute('src'))photo.src=canvas.dataset.photoAvif||canvas.dataset.photo||'assets/mountain-original.jpg';
  async function decodePhoto(){
    try{await photo.decode();}catch(error){
      if(!canvas.dataset.photoAvif||(photo.currentSrc||photo.src)===new URL(canvas.dataset.photo,location.href).href)throw error;
      photo.closest('picture')?.querySelectorAll('source').forEach(source=>source.remove());
      photo.src=canvas.dataset.photo;
      await photo.decode();
    }
    canvas.dataset.photoSelected=photo.currentSrc||photo.src;
  }
  const depth=canvas.dataset.depth?new Image():null;
  if(depth)depth.src=canvas.dataset.depth;
  const depthReady=depth?depth.decode().catch(()=>null):Promise.resolve();
  const cairnShape=new Path2D();cairnShape.moveTo(...CairnMask.points[0]);for(const p of CairnMask.points.slice(1))cairnShape.lineTo(...p);cairnShape.closePath();
  const network=SignalNetwork.create({nodes:SceneData.nodes,seed:'mayu-r10'});
  const markets=SceneData.ridges.map(r=>{const candles=MarketCandles.create(r,{variant:'expressive'});return{...r,profile:RidgeCandles.contour(r.points),candles,pricePath:MarketCandles.pricePath(r,candles),ma5Path:MarketCandles.movingAveragePath(r,candles)};});
  const idleSweep=IdleMarketSweep.create(markets);
  let idleFrame=idleSweep.frame(0);
  function activity(){const time=performance.now()-start;idleSweep.activity(time);canvas.dataset.lastActivity=time.toFixed(2);}


  function nearest(p,r){
    let result=Infinity;
    for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy||1));result=Math.min(result,Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy));}
    return result;
  }
  function frameMarkets(sc,now){
    idleFrame=idleSweep.frame(held??now,reduced.matches||(held!==null&&review!=='idle'));
    canvas.dataset.idleTime=(held??now).toFixed(2);canvas.dataset.idleNext=String(idleFrame.nextWake);canvas.dataset.idleState=idleFrame.state;canvas.dataset.idleGroup=idleFrame.ids.join(',');canvas.dataset.idleX=idleFrame.x?.toFixed(2)||'';
    const projection=SceneCore.foregroundProjection(focus,sc,markets);
    return markets.map(r=>{
      const energy=focus?Math.exp(-.5*(nearest(focus,r)/(125/sc))**2):0;
      const heat=x=>{
        if(inspection)return 1;
        const automatic=idleSweep.heat(idleFrame,r.id,x);
        if(!focus||intensity<.001)return automatic;
        const y=r.profile.at(clamp(x,r.profile.minX,r.profile.maxX)).y;
        const direct=intensity*energy*Math.exp(-.5*(Math.hypot(x-focus.x,y-focus.y)/(105/sc))**2);
        const projected=intensity*.95*SceneCore.foregroundHeat(projection,r.id,x);
        return Math.max(Math.max(direct,projected)*idleFrame.pointerWeight,automatic);
      };
      return {...r,heat};
    });
  }
  function graphLine(out,points,color,width,r){
    if(points.length<2)return;
    // One path with continuous opacity avoids overlapping caps and hard cutoffs.
    const x0=points[0][0],x1=points.at(-1)[0],gradient=out.createLinearGradient(x0,0,x1,0);
    const hex=color.slice(1),rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)).join(',');
    const count=Math.max(24,Math.ceil((x1-x0)/12));let max=0;
    for(let i=0;i<=count;i++){const t=i/count,h=clamp(r.heat(x0+(x1-x0)*t)*1.15);max=Math.max(max,h);gradient.addColorStop(t,'rgba('+rgb+','+h+')');}
    if(max<.001)return;
    out.save();out.globalAlpha=1;out.globalCompositeOperation='source-over';out.strokeStyle=gradient;out.lineWidth=width;out.lineJoin='round';out.lineCap='round';out.beginPath();out.moveTo(...points[0]);for(const p of points.slice(1))out.lineTo(...p);out.stroke();out.restore();
  }
  function drawLines(out,ridges){
    for(const r of ridges){graphLine(out,r.pricePath,'#ff8700',3.6,r);graphLine(out,r.ma5Path,'#69d7ff',3.6,r);}
  }
  function drawCandles(out,ridges){
    out.save();out.globalCompositeOperation='source-over';out.lineCap='butt';
    for(const r of ridges)for(const b of r.candles){
      const hot=clamp(r.heat(b.x)*1.2),color=b.rising?'#35ffa2':'#ff3868',top=Math.min(b.openY,b.closeY),h=Math.max(2,Math.abs(b.closeY-b.openY));
      const left=b.x-b.bodyWidth/2,bottom=top+h;
      const body=(ink,width)=>{
        out.fillStyle=ink;out.strokeStyle=ink;
        if(b.rising){
          const edge=Math.min(width,b.bodyWidth,h);out.lineWidth=edge;
          out.strokeRect(left+edge/2,top+edge/2,b.bodyWidth-edge,h-edge);
        }else out.fillRect(left,top,b.bodyWidth,h);
      };
      const wick=(ink,width)=>{
        out.strokeStyle=ink;out.lineWidth=width;out.beginPath();
        out.moveTo(b.x,b.highY);out.lineTo(b.x,top);
        out.moveTo(b.x,bottom);out.lineTo(b.x,b.lowY);out.stroke();
      };
      out.globalAlpha=.12;body('#f3f7fa',2.5);
      out.globalAlpha=.15;wick('#f3f7fa',2.5);
      if(hot<.001)continue;
      if(!inspection){out.save();out.translate(b.x,top+h/2);out.scale((b.bodyWidth+54)/2,(h+42)/2);const glow=out.createRadialGradient(0,0,0,0,0,1);glow.addColorStop(0,color+'70');glow.addColorStop(.5,color+'20');glow.addColorStop(1,color+'00');out.globalAlpha=hot*.4;out.fillStyle=glow;out.fillRect(-1,-1,2,2);out.restore();}
      out.globalAlpha=hot;wick(color,3);out.fillStyle=color;out.fillRect(left,top,b.bodyWidth,h);
    }
    out.restore();
  }
  function render(now){
    const b=canvas.getBoundingClientRect(),w=b.width,h=b.height,dpr=canvas.width/w;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.save();ctx.scale(w/C.width,h/C.height);ctx.translate(-C.x,-C.y);
    ctx.drawImage(photo,0,0,W,H);SceneDepth.draw(ctx,{mode:'background',data:SceneData,cairn:CairnMask,texture:depth?.naturalWidth?depth:null});NameStudies.drawGroundShadow(ctx,{variant:'solid-flat',photo});
    // Back to front: photo/depth, shadow, signals, chart lines, candle bodies,
    // opaque flat name, original foreground cairn, then letter shadows on its rock faces.
    network.render(ctx,{now:held??now,reducedMotion:reduced.matches});
    const ridges=frameMarkets(w/C.width,now);drawLines(ctx,ridges);drawCandles(ctx,ridges);NameStudies.drawMiddle(ctx,{variant:'solid-flat',photo});
    ctx.save();ctx.clip(cairnShape);ctx.drawImage(photo,0,0,W,H);
    if(!(review&&params.get('stone')==='off'))NameStudies.drawGroundShadow(ctx,{variant:'solid-flat',photo});
    ctx.restore();ctx.restore();
    canvas.dataset.rendered='true';canvas.dataset.preset=review||'final';canvas.dataset.context=ctx.isContextLost?.()?'lost':'ready';
    hero.dataset.sceneState=canvas.dataset.context==='lost'?'fallback':'ready';
  }
  function tick(now){
    raf=0;if(!ready||document.hidden||!heroVisible)return;
    const dt=Math.min(50,lastFrame?now-lastFrame:16),ease=reduced.matches?1:1-Math.exp(-dt/65);lastFrame=now;
    if(target){if(!focus)focus={...target};focus.x+=(target.x-focus.x)*ease;focus.y+=(target.y-focus.y)*ease;intensity+=(1-intensity)*ease;}else intensity*=Math.exp(-dt/150);
    render(now-start);
    const changing=target&&focus&&(Math.hypot(target.x-focus.x,target.y-focus.y)>.25||intensity<.998)||!target&&intensity>.003;
    const live=held===null&&!reduced.matches,active=live&&network.render(null,{now:now-start});
    if(changing||active||(live&&idleFrame.active))raf=requestAnimationFrame(tick);else{lastFrame=0;if(live){const delay=Math.min(network.nextWake(now-start),idleFrame.nextWake);if(Number.isFinite(delay))wake=setTimeout(schedule,Math.max(1,delay));}}
  }
  function schedule(){clearTimeout(wake);wake=0;if(ready&&!document.hidden&&heroVisible&&!raf)raf=requestAnimationFrame(tick);}
  function move(e){activity();const b=canvas.getBoundingClientRect();if(e.clientY<b.top||e.clientY>b.bottom)return;target={x:C.x+(e.clientX-b.left)/b.width*C.width,y:C.y+(e.clientY-b.top)/b.height*C.height};canvas.dataset.pointerX=target.x.toFixed(2);canvas.dataset.pointerY=target.y.toFixed(2);schedule();}
  hero.addEventListener('pointermove',move);hero.addEventListener('pointerdown',move);hero.addEventListener('pointerleave',()=>{if(!review){target=null;schedule();}});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key))return;e.preventDefault();activity();if(e.key==='Escape')target=null;else{const p=target||{x:2200,y:2400};target={x:clamp(p.x+({ArrowLeft:-120,ArrowRight:120}[e.key]||0),0,W),y:clamp(p.y+({ArrowUp:-100,ArrowDown:100}[e.key]||0),C.y,C.y+C.height)};}schedule();});
  function stop(){clearTimeout(wake);cancelAnimationFrame(raf);wake=raf=0;lastFrame=0;}
  document.addEventListener('visibilitychange',()=>document.hidden?stop():(activity(),schedule()));new IntersectionObserver(es=>{heroVisible=es[0].isIntersecting;if(heroVisible){activity();schedule();}else stop();}).observe(hero);reduced.addEventListener('change',schedule);
  function resize(){
    if(!ready)return;
    const b=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),w=Math.round(b.width*dpr),h=Math.round(b.height*dpr);
    if(w<=0||h<=0)return;
    if(canvas.width!==w||canvas.height!==h){
      if(canvas.width!==w)canvas.width=w;
      if(canvas.height!==h)canvas.height=h;
      // Repaint an existing scene before the observer returns. Initial loading
      // follows the normal RAF path so its first frame is drawn only once.
      if(canvas.dataset.rendered==='true')render(performance.now()-start);
    }
    schedule();
  }
  new ResizeObserver(resize).observe(canvas);canvas.addEventListener('contextlost',()=>{canvas.dataset.context='lost';hero.dataset.sceneState='fallback';});canvas.addEventListener('contextrestored',resize);window.addEventListener('error',e=>{canvas.dataset.renderError=e.message;});
  Promise.all([decodePhoto(),depthReady,NameStudies.ready]).then(()=>{ready=true;resize();}).catch(e=>{
    hero.dataset.sceneState='fallback';canvas.tabIndex=-1;
    canvas.dataset.renderError=e.message;
  });
})();
