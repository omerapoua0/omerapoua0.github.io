(() => {
 const sheet=document.querySelector('link[href^="math-design.css"]');
 if(sheet)document.head.append(sheet);
 addEventListener('DOMContentLoaded',()=>{if(sheet)document.head.append(sheet)});
 const layer=document.getElementById('equation-scene');if(!layer)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=false,paused=true,visible=false;
 const sync=()=>layer.classList.toggle('math-still',!active||paused||!visible||document.hidden||reduced.matches);
 document.addEventListener('hero:state',e=>{active=e.detail.index===1;paused=e.detail.paused;visible=e.detail.visible;sync()});
 document.addEventListener('visibilitychange',sync);
 reduced.addEventListener('change',sync);
 sync();
})();
