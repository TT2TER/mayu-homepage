/* Sequential discovery of real ridge geometry after pointer inactivity. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.IdleMarketSweep=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function create(ridges,{delay=1500,duration=3200,gap=450}={}){
  const levels=[[],[],[]];
  for(const r of ridges){const y=r.points.reduce((sum,p)=>sum+p[1],0)/r.points.length;levels[r.depth==='far'?0:y<900?1:2].push(r);}
  const groups=levels.filter(g=>g.length).map(routes=>({ids:routes.map(r=>r.id),minX:Math.min(...routes.flatMap(r=>r.points.map(p=>p[0]))),maxX:Math.max(...routes.flatMap(r=>r.points.map(p=>p[0])))}));
  const slot=duration+gap,cycle=slot*groups.length;let lastActivity=0;
  function activity(now){lastActivity=now;}
  function frame(now,disabled=false){
   const quiet=now-lastActivity;
   if(disabled||!groups.length)return{state:'disabled',active:false,pointerWeight:1,nextWake:Infinity,ids:[]};
   if(quiet<delay)return{state:'waiting',active:false,pointerWeight:1,nextWake:delay-quiet,ids:[]};
   const elapsed=(quiet-delay)%cycle,index=Math.floor(elapsed/slot),phase=elapsed-index*slot,group=groups[index];
   if(phase>=duration)return{state:'gap',active:false,pointerWeight:0,nextWake:slot-phase,ids:[],index};
   const radius=(group.maxX-group.minX)*.065+40,progress=phase/duration;
   const x=group.minX-radius*2+progress*(group.maxX-group.minX+radius*4);
   return{state:'sweeping',active:true,pointerWeight:0,nextWake:0,ids:group.ids,index,progress,x,radius};
  }
  function heat(frame,id,x){if(!frame.active||!frame.ids.includes(id))return 0;const distance=(x-frame.x)/frame.radius;return .86*Math.exp(-.5*distance*distance);}
  return Object.freeze({activity,frame,heat,groups,delay,duration,gap,cycle});
 }
 return Object.freeze({create});
});
