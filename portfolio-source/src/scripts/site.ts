const themeButton = document.querySelector<HTMLButtonElement>('.theme-toggle');
function themeLabel(){themeButton?.setAttribute('aria-label',document.documentElement.dataset.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');}
themeLabel();
themeButton?.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme=theme; try{localStorage.setItem('omar-theme',theme)}catch{} themeLabel();});
const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
const nav = document.querySelector<HTMLElement>('.site-nav');
function closeMenu(){menu?.setAttribute('aria-expanded','false'); menu?.setAttribute('aria-label','Open menu'); nav?.classList.remove('is-open');}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded',String(open)); menu.setAttribute('aria-label',open ? 'Close menu' : 'Open menu'); nav?.classList.toggle('is-open',open);});
document.addEventListener('keydown',event=>{if(event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true'){closeMenu(); menu.focus();}});
nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
window.matchMedia('(min-width: 1060px)').addEventListener('change',closeMenu);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
if(!reduced.matches && 'IntersectionObserver' in window){
  const observer = new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.animate([{opacity:.35,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:750,easing:'cubic-bezier(.16,1,.3,1)',fill:'none'}); observer.unobserve(entry.target);}});},{threshold:.08});
  document.querySelectorAll('[data-reveal]').forEach(element=>observer.observe(element));
}
if('IntersectionObserver' in window){
  const mediaObserver = new IntersectionObserver(entries=>entries.forEach(entry=>{const video=entry.target as HTMLVideoElement; if(entry.isIntersecting && !reduced.matches){if(video.dataset.src && !video.getAttribute('src')){video.src=video.dataset.src;}video.play().catch(()=>{});}else{video.pause();}}),{threshold:.2});
  document.querySelectorAll<HTMLVideoElement>('video[data-preview]').forEach(video=>mediaObserver.observe(video));
}
export {};
