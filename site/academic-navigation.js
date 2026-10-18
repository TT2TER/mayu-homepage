(() => {
 const host=document.querySelector('#academic-content'),root=host?.shadowRoot||host;if(!root)return;
 const positions=new Map();let serial=0,activeEntry,restoring=false,restoreVersion=0;
 function entry(){
  const state=history.state&&typeof history.state==='object'?history.state:{};
  if(state.__mayuEntry)return state.__mayuEntry;
  const id=String(performance.timeOrigin)+'-'+(++serial);
  history.replaceState({...state,__mayuEntry:id},'');return id;
 }
 function cancelRestore(){restoreVersion++;restoring=false;}
 function remember(){if(root===host&&!restoring&&history.state?.__mayuEntry===activeEntry)positions.set(activeEntry,[scrollX,scrollY]);}
 if(root===host){
  activeEntry=entry();
  addEventListener('scroll',remember,{passive:true});
  addEventListener('popstate',()=>{
   const destination=entry();if(destination===activeEntry)return;
   cancelRestore();activeEntry=destination;const saved=positions.get(destination);if(!saved)return;
   restoring=true;const token=restoreVersion;requestAnimationFrame(()=>{
    if(token!==restoreVersion||activeEntry!==destination)return;
    scrollTo({left:saved[0],top:saved[1],behavior:'instant'});
    requestAnimationFrame(()=>{if(token===restoreVersion&&activeEntry===destination){restoring=false;remember();}});
   });
  });
  addEventListener('hashchange',()=>{const destination=entry();if(destination!==activeEntry){cancelRestore();activeEntry=destination;}});
 }
 function go(hash,behavior,moveFocus=false){
  let id;try{id=decodeURIComponent(hash.slice(1))}catch{return false}
  const section=root.querySelector('#'+CSS.escape(id));if(!section)return false;
  section.scrollIntoView({behavior,block:'start'});
  if(moveFocus){
   const target=section.querySelector('h2,h3')||section;
   if(!target.hasAttribute('tabindex')){
    target.setAttribute('tabindex','-1');
    target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});
   }
   target.focus({preventScroll:true});
  }
  return true;
 }
 document.addEventListener('click',e=>{
  const anchor=e.composedPath().find(n=>n instanceof HTMLAnchorElement);
  if(!anchor||!anchor.getAttribute('href')?.startsWith('#')||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const hash=anchor.getAttribute('href');
  const keyboard=e.detail===0;
  let id;try{id=decodeURIComponent(hash.slice(1))}catch{return}
  if(root.querySelector('#'+CSS.escape(id))){
   e.preventDefault();cancelRestore();remember();
   history.pushState(null,'',hash);if(root===host)activeEntry=entry();
   go(hash,matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',keyboard);
  }
 });
 // Native fragments locate sections; saved offsets refine same-document history.
 // Shadow prototypes need an explicit bridge to their internal section IDs.
 if(root!==host)addEventListener('hashchange',()=>go(location.hash,'instant'));
 const navigation=performance.getEntriesByType('navigation')[0];
 // Fresh links resolve sections; reload and cross-document return use browser restoration.
 if(location.hash&&navigation?.type==='navigate')requestAnimationFrame(()=>go(location.hash,'instant'));
})();
