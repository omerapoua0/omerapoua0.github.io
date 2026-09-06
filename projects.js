(() => {
 const sheet=document.querySelector('link[href^="projects.css"]');if(sheet)document.head.append(sheet);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const states=[];
 document.querySelectorAll('.project-feature').forEach(card=>{const target=card.querySelector('h3 a');if(!target)return;const link=document.createElement('a');link.href=target.getAttribute('href');link.className='case-link';link.textContent='Explore my contribution ↗';card.querySelector('.project-summary').append(link)});
 document.querySelectorAll('.project-cinema').forEach(card=>{
  const video=card.querySelector('video'),button=card.querySelector('.project-film-control');if(!video||!button)return;
  const state={card,video,button,visible:false,userPaused:false,manualPlay:false};states.push(state);
  const update=()=>{const playing=!video.paused;button.textContent=playing?'Ⅱ Pause motion':'▷ Play motion';button.setAttribute('aria-label',(playing?'Pause ':'Play ')+card.dataset.film.toUpperCase()+' animation');button.setAttribute('aria-pressed',String(!playing));};
  const allowed=()=>state.visible&&!document.hidden&&!state.userPaused&&(state.manualPlay||(!reduced.matches&&!navigator.connection?.saveData));
  state.sync=()=>{
   if(allowed())video.play().then(()=>{if(!allowed())video.pause();update()}).catch(update);else{video.pause();update()}
  };
  video.addEventListener('play',update);video.addEventListener('pause',update);video.addEventListener('error',()=>{button.hidden=true});
  button.addEventListener('click',()=>{if(video.paused){state.userPaused=false;state.manualPlay=true;state.visible=true}else{state.userPaused=true;state.manualPlay=false}state.sync()});
  card.addEventListener('pointermove',event=>{if(reduced.matches||!fine.matches)return;const box=card.getBoundingClientRect();card.style.setProperty('--px',((event.clientX-box.left)/box.width-.5).toFixed(2));card.style.setProperty('--py',((event.clientY-box.top)/box.height-.5).toFixed(2));});
  card.addEventListener('pointerleave',()=>{card.style.setProperty('--px','0');card.style.setProperty('--py','0')});update();
 });
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{const state=states.find(s=>s.card===entry.target);if(state){state.visible=entry.isIntersecting&&entry.intersectionRatio>=.15;state.sync()}}),{threshold:.15});
 states.forEach(s=>observer.observe(s.card));
 document.addEventListener('visibilitychange',()=>states.forEach(s=>s.sync()));
 reduced.addEventListener('change',()=>states.forEach(s=>{s.manualPlay=false;s.sync()}));
})();
