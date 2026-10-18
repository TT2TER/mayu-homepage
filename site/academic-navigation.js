(() => {
 const root=document.querySelector('#academic-content')?.shadowRoot;if(!root)return;
 function go(hash,behavior,moveFocus=false){
  let id;try{id=decodeURIComponent(hash.slice(1))}catch{return false}
  const section=root.getElementById(id);if(!section)return false;
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
  if(go(hash,matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',keyboard)){
   e.preventDefault();history.pushState(null,'',hash);
  }
 });
 addEventListener('hashchange',()=>go(location.hash,'instant'));
 const navigation=performance.getEntriesByType('navigation')[0];
 // Browser restoration owns reload and history positions; only new links need a hash jump.
 if(location.hash&&navigation?.type==='navigate')requestAnimationFrame(()=>go(location.hash,'instant'));
})();
