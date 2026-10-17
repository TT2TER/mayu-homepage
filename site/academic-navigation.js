(() => {
 const root=document.querySelector('#academic-content')?.shadowRoot;if(!root)return;
 function go(hash,behavior){let id;try{id=decodeURIComponent(hash.slice(1))}catch{return false}const el=root.getElementById(id);if(!el)return false;el.scrollIntoView({behavior,block:'start'});if(!el.hasAttribute('tabindex')){el.setAttribute('tabindex','-1');el.addEventListener('blur',()=>el.removeAttribute('tabindex'),{once:true})}el.focus({preventScroll:true});return true}
 document.addEventListener('click',e=>{const anchor=e.composedPath().find(n=>n instanceof HTMLAnchorElement);if(!anchor||!anchor.getAttribute('href')?.startsWith('#')||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const hash=anchor.getAttribute('href');if(go(hash,matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth')){e.preventDefault();history.pushState(null,'',hash)}});
 addEventListener('hashchange',()=>go(location.hash,'instant'));
 if(location.hash)requestAnimationFrame(()=>go(location.hash,'instant'));
})();