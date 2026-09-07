(() => {
 const sheet=document.querySelector('link[href^="equation-tunnel.css"]');
 addEventListener('DOMContentLoaded',()=>{if(sheet)document.head.append(sheet)});
 const layer=document.getElementById('equation-scene'),stage=document.querySelector('.particle-stage');if(!layer||!stage)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let active=false,paused=true,visible=false;
 const stopped=()=>!active||paused||!visible||document.hidden||reduced.matches||navigator.connection?.saveData;
 const sync=()=>layer.classList.toggle('tunnel-still',!!stopped());
 document.addEventListener('hero:state',e=>{active=e.detail.index===1;paused=e.detail.paused;visible=e.detail.visible;sync()});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 stage.addEventListener('pointermove',e=>{if(stopped())return;const r=stage.getBoundingClientRect();layer.style.setProperty('--math-y',((e.clientX-r.left)/r.width-.5)*5+'deg');layer.style.setProperty('--math-x',-((e.clientY-r.top)/r.height-.5)*3+'deg')});
 stage.addEventListener('pointerleave',()=>{layer.style.setProperty('--math-y','0deg');layer.style.setProperty('--math-x','0deg')});sync();
})();
