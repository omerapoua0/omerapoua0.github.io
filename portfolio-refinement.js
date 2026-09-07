(() => {
 const sheet=document.querySelector('link[href^="portfolio-refinement.css"]');
 // Preserve the existing theme-layer order; these are narrowly scoped overrides.
 addEventListener('DOMContentLoaded',()=>{if(sheet)document.head.append(sheet)});
 const atmosphere=document.querySelector('.hero-atmosphere');
 if(!atmosphere)return;
 const cloud=atmosphere.querySelector('img'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=reduced.matches,visible=true;
 function sync(){atmosphere.classList.toggle('atmosphere-paused',paused||reduced.matches||!visible||document.hidden)}
 document.addEventListener('hero:state',e=>{paused=e.detail.paused;visible=e.detail.visible;sync()});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 // This optional decoration should not consume data on a data-saving connection.
 if(!navigator.connection?.saveData){
  cloud.addEventListener('load',()=>atmosphere.classList.add('clouds-ready'),{once:true});
  cloud.src=cloud.dataset.cloudSrc;
 }
 const film=document.querySelector('.engine-film');if(film)film.defaultPlaybackRate=film.playbackRate=.72;
 sync();
})();
