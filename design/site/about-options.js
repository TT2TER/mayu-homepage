(() => {
 const journey=document.querySelector('.scene-journey');if(!journey)return;
 const first=document.querySelector('.first'),second=document.querySelector('.second');
 const narrow=matchMedia('(max-width:1100px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 function update(){
  const staticMode=narrow.matches||reduced.matches;
  const start=journey.offsetTop+Math.max(0,journey.querySelector('.hero').offsetHeight-innerHeight);
  const t=Math.max(0,Math.min(1,(scrollY-start)/(innerHeight*.5)));
  const a=staticMode?1:1-Math.max(0,Math.min(1,t*3-0.3));
  const b=staticMode?1:Math.max(0,Math.min(1,t*3-1.3));
  for(const [el,v] of [[first,a],[second,b]]){el.style.opacity=v;el.style.visibility=v>.01?'visible':'hidden';el.inert=v<.5;}
 }
 let pending=false;addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;update()})}},{passive:true});
 addEventListener('resize',update);narrow.addEventListener('change',update);reduced.addEventListener('change',update);update();
})();