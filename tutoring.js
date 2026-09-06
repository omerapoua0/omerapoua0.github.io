const studyForm = document.getElementById('tutoring-form');
const steps = [...document.querySelectorAll('.form-step')];
const count = document.getElementById('step-count');
const next = document.querySelector('.next-button');
const back = document.querySelector('.back-button');
const submit = document.querySelector('.submit-button');
const previewSubject = document.getElementById('preview-subject');
const previewLevel = document.getElementById('preview-level');
let current = 1;
function renderStep() { steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === current)); count.textContent = `0${current} / 03`; back.style.visibility = current === 1 ? 'hidden' : 'visible'; next.style.display = current === 3 ? 'none' : 'inline-flex'; submit.style.display = current === 3 ? 'inline-flex' : 'none'; document.querySelectorAll('.step-rail i').forEach((item, index) => item.classList.toggle('done', index < current)); }
function pop(button) { const particle = document.createElement('span'); particle.className = 'choice-pop'; particle.textContent = ['✦','+','∿','•'][Math.floor(Math.random() * 4)]; button.append(particle); setTimeout(() => particle.remove(), 800); }
document.querySelectorAll('[data-subject]').forEach(button => button.addEventListener('click', () => { studyForm.elements.subject.value = button.dataset.subject; previewSubject.textContent = button.dataset.subject; document.querySelectorAll('[data-subject]').forEach(x => x.classList.remove('selected')); button.classList.add('selected'); pop(button); current = 2; renderStep(); }));
document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => { studyForm.elements.level.value = button.dataset.level; previewLevel.textContent = button.dataset.level; document.querySelectorAll('[data-level]').forEach(x => x.classList.remove('selected')); button.classList.add('selected'); pop(button); current = 3; renderStep(); }));
next.addEventListener('click', () => { const status=studyForm.querySelector('.form-status'); if(current===1&&!studyForm.elements.subject.value){status.textContent='Choose your subject to continue.';return} if(current===2&&!studyForm.elements.level.value){status.textContent='Choose your level to continue.';return} status.textContent=''; if (current < 3) { current++; renderStep(); } }); back.addEventListener('click', () => { if (current > 1) { current--; renderStep(); } });
document.querySelectorAll('[data-feeling]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-feeling]').forEach(x => x.classList.remove('selected')); button.classList.add('selected'); document.documentElement.dataset.feeling = button.dataset.feeling; }));
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelectorAll('.choice-grid button').forEach((card) => { card.addEventListener('pointermove', (event) => { const box = card.getBoundingClientRect(); card.style.transform = `perspective(500px) rotateX(${(box.height / 2 - (event.clientY - box.top)) / 15}deg) rotateY(${((event.clientX - box.left) - box.width / 2) / 15}deg) translateY(-6px)`; }); card.addEventListener('pointerleave', () => { card.style.transform = ''; }); });
renderStep();
