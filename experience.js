(() => {
  const root=document.documentElement;
  try {root.dataset.theme=localStorage.getItem('omar-theme')||'dark'}catch{root.dataset.theme='dark'}
  if(!document.body.classList.contains('portfolio-v2')){
    document.body.classList.add('redesigned-page');
    const old=document.querySelector('.nav-wrap');
    if(old){
      const header=document.createElement('header');header.className='site-header';
      header.innerHTML='<a class="wordmark" href="index.html" aria-label="Omar Aboelella home">omar<span>®</span><small>ABOELELLA</small></a><nav class="site-nav" aria-label="Main navigation"><a href="work.html">Work</a><a href="automations.html">Automations</a><a href="tutoring.html">Tutoring</a><a href="research.html">Researches</a></nav><div class="header-tools"><button class="theme-switch" aria-label="Switch theme">◐</button><a class="contact-pill" href="mailto:omerapoua0@gmail.com">Let’s talk <span>↗</span></a><button class="menu-toggle" aria-expanded="false" aria-label="Open navigation">☰</button></div>';
      old.replaceWith(header);
    }
    const css=document.querySelector('link[href^="redesign.css"]');if(css)document.head.append(css);
  }
  const theme=document.querySelector('.theme-switch');
  const updateTheme=()=>{theme?.setAttribute('aria-label',root.dataset.theme==='light'?'Switch to dark mode':'Switch to light mode');document.dispatchEvent(new Event('themechange'))};
  theme?.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';try{localStorage.setItem('omar-theme',root.dataset.theme)}catch{}updateTheme()});updateTheme();
  const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('.site-nav');
  if(menu&&nav){root.classList.add('has-menu-js');nav.id='primary-navigation';menu.setAttribute('aria-controls',nav.id)}
  function closeMenu(restore=false){const wasOpen=nav?.classList.contains('open');nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Open navigation');if(menu)menu.textContent='Menu';if(restore&&wasOpen)menu?.focus()}
  menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');menu.textContent=open?'Close':'Menu'});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu(true)});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu()});
  document.querySelector('.site-header')?.addEventListener('focusout',e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget))closeMenu()});
  matchMedia('(min-width:1081px)').addEventListener('change',()=>closeMenu());
  const currentPage=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.site-nav a,.mobile-shortcuts a').forEach(a=>{if(a.getAttribute('href')===currentPage)a.setAttribute('aria-current','page');a.addEventListener('click',()=>closeMenu())});
  const fieldFocused=()=>root.classList.toggle('editing-field',document.activeElement?.matches('input,textarea,select')||false);
  document.addEventListener('focusin',fieldFocused);document.addEventListener('focusout',()=>setTimeout(fieldFocused,0));
  const slider=document.querySelector('.skill-slider');
  const scrollSkills=direction=>slider?.scrollBy({left:direction*(slider.querySelector('article').getBoundingClientRect().width+20),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  document.querySelectorAll('[data-slide]').forEach(b=>b.addEventListener('click',()=>scrollSkills(Number(b.dataset.slide))));
  slider?.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();scrollSkills(e.key==='ArrowRight'?1:-1)}});
  const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
})();
