if (!document.querySelector('link[href="subpages.css"]')) {
  const extraStyles = document.createElement('link');
  extraStyles.rel = 'stylesheet';
  extraStyles.href = 'subpages.css';
  document.head.append(extraStyles);
}
if (!document.querySelector('link[href="enhancements.css"]')) {
  const enhancementStyles = document.createElement('link');
  enhancementStyles.rel = 'stylesheet';
  enhancementStyles.href = 'enhancements.css';
  document.head.append(enhancementStyles);
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const glow = document.querySelector('.cursor-glow');
if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    glow.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
  });
  document.querySelectorAll('.magnetic').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const box = element.getBoundingClientRect();
      element.style.transform = `translate(${(event.clientX - box.left - box.width / 2) * .12}px, ${(event.clientY - box.top - box.height / 2) * .18}px)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
  });
}

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach((item) => observer.observe(item));
const evolutionStages = [...document.querySelectorAll('.evolution-stage')];
if (evolutionStages.length && !reduceMotion) {
  const evolutionLabel = document.getElementById('evolution-label');
  const evolutionCount = document.getElementById('evolution-count');
  const labels = ['From signal to system', 'Mathematics becomes model', 'Model becomes compute', 'Compute becomes autonomy'];
  let evolution = 0;
  setInterval(() => { evolution = (evolution + 1) % evolutionStages.length; evolutionStages.forEach((stage, index) => stage.classList.toggle('active', index === evolution)); if (evolutionLabel) evolutionLabel.textContent = labels[evolution]; if (evolutionCount) evolutionCount.textContent = `0${evolution + 1}`; }, 2800);
}
const meterObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('charged'); meterObserver.unobserve(entry.target); } }), { threshold:.35 });
document.querySelectorAll('.skill-meter').forEach((meter) => meterObserver.observe(meter));
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const canvas = document.getElementById('field');
if (canvas) {
const context = canvas.getContext('2d');
let particles = [];
function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = Math.min(730, innerHeight) * devicePixelRatio;
  context.scale(devicePixelRatio, devicePixelRatio);
  const count = Math.min(62, Math.floor(innerWidth / 18));
  particles = Array.from({ length: count }, () => ({ x: Math.random() * innerWidth, y: Math.random() * Math.min(730, innerHeight), vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, r: Math.random() * 1.2 + .35 }));
}
function draw() {
  if (reduceMotion) return;
  context.clearRect(0, 0, innerWidth, Math.min(730, innerHeight));
  particles.forEach((p, i) => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
    if (p.y < 0 || p.y > Math.min(730, innerHeight)) p.vy *= -1;
    context.fillStyle = 'rgba(180,255,53,.6)'; context.beginPath(); context.arc(p.x, p.y, p.r, 0, Math.PI * 2); context.fill();
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j], dx = p.x - q.x, dy = p.y - q.y, distance = Math.hypot(dx, dy);
      if (distance < 105) { context.strokeStyle = `rgba(180,255,53,${.1 * (1 - distance / 105)})`; context.beginPath(); context.moveTo(p.x, p.y); context.lineTo(q.x, q.y); context.stroke(); }
    }
  });
  requestAnimationFrame(draw);
}
resize(); draw(); addEventListener('resize', resize);
}

const form = document.getElementById('tutoring-form');
if (form) {
  const sheet = document.getElementById('success-sheet');
  const emailBrief = document.getElementById('email-brief');
  const closeButton = sheet?.querySelector('.success-close');
  let lastFocus;
  const close = () => {
    sheet?.classList.remove('show');
    sheet?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocus?.focus();
  };
  if (sheet) {
    sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-modal','true');
    sheet.setAttribute('aria-label','Your study brief is ready');
    closeButton?.addEventListener('click',close);
    sheet.addEventListener('click',e=>{if(e.target===sheet)close()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet.classList.contains('show'))close()});
    sheet.addEventListener('keydown',e=>{
      if(e.key==='Tab'){
        const items=[...sheet.querySelectorAll('button,a[href]')];
        const first=items[0],last=items[items.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    });
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const data=Object.fromEntries(new FormData(form));
    const status=form.querySelector('.form-status');
    if(!data.subject||!data.level){status.textContent='Choose a subject and level before preparing your brief.';return}
    if(!form.reportValidity())return;
    const subject=encodeURIComponent('Tutoring enquiry — '+data.subject+' ('+data.level+')');
    const body=encodeURIComponent('Name: '+data.name+'\nEmail: '+data.email+'\nSubject: '+data.subject+'\nLevel: '+data.level+'\n\n'+data.message);
    if(sheet&&emailBrief){
      lastFocus=document.activeElement;
      emailBrief.href='mailto:omerapoua0@gmail.com?subject='+subject+'&body='+body;
      sheet.classList.add('show');sheet.setAttribute('aria-hidden','false');
      document.body.style.overflow='hidden';requestAnimationFrame(()=>closeButton.focus());
      status.textContent='Your brief is ready. Open your email app to send it.';
    }
  });
}
