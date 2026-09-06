(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const sheet=document.querySelector('link[href^="premium.css"]');if(sheet)document.head.append(sheet);
  const nav=document.querySelector('.site-nav');
  if(nav&&!nav.querySelector('[href="cv.html"]')){const a=document.createElement('a');a.href='cv.html';a.textContent='CV';if(location.pathname.endsWith('cv.html'))a.setAttribute('aria-current','page');nav.append(a);}
  document.querySelectorAll('.wordmark>span').forEach(s=>s.textContent='·');
  if(!reduced.matches){
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('arrived');observer.unobserve(e.target)}}),{threshold:.08});
    document.querySelectorAll('.section-heading,.feature-work,.human-copy,.capability-card,.education-row,.dual-cta>a,.detail-project,.cv-entry,.math-statement').forEach((el,i)=>{el.classList.add('soft-reveal');el.style.setProperty('--delay',(i%3)*65+'ms');observer.observe(el)});
  }
  let mediaPaused=reduced.matches,heroPaused=reduced.matches;
  const films=[...document.querySelectorAll('.ambient-film')];
  const button=document.querySelector('.film-control');
  const inView=new Set();
  const sync=()=>{films.forEach(v=>{if(mediaPaused||(v.classList.contains('engine-film')&&heroPaused)||document.hidden||!inView.has(v))v.pause();else v.play().catch(()=>{})});if(button){button.textContent=mediaPaused?'Play background film':'Pause background film';button.setAttribute('aria-pressed',String(mediaPaused));}};
  const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)inView.add(e.target);else inView.delete(e.target)});sync()},{rootMargin:'100px'});
  films.forEach(v=>{v.muted=true;observer.observe(v)});
  button?.addEventListener('click',()=>{mediaPaused=!mediaPaused;sync()});
  reduced.addEventListener('change',e=>{mediaPaused=e.matches;sync()});
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('hero:state',e=>{heroPaused=e.detail.paused;sync()});
})();
