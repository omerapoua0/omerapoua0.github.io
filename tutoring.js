const studyForm = document.getElementById('tutoring-form');
const steps = [...document.querySelectorAll('.form-step')];
const count = document.getElementById('step-count');
const next = document.querySelector('.next-button');
const back = document.querySelector('.back-button');
const submit = document.querySelector('.submit-button');
let current = 1;
function renderStep() { steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === current)); count.textContent = `0${current} / 03`; back.style.visibility = current === 1 ? 'hidden' : 'visible'; next.style.display = current === 3 ? 'none' : 'inline-flex'; submit.style.display = current === 3 ? 'inline-flex' : 'none'; }
document.querySelectorAll('[data-subject]').forEach(button => button.addEventListener('click', () => { studyForm.elements.subject.value = button.dataset.subject; document.querySelectorAll('[data-subject]').forEach(x => x.classList.remove('selected')); button.classList.add('selected'); current = 2; renderStep(); }));
document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => { studyForm.elements.level.value = button.dataset.level; document.querySelectorAll('[data-level]').forEach(x => x.classList.remove('selected')); button.classList.add('selected'); current = 3; renderStep(); }));
next.addEventListener('click', () => { if (current < 3) { current++; renderStep(); } }); back.addEventListener('click', () => { if (current > 1) { current--; renderStep(); } });
document.querySelectorAll('[data-feeling]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-feeling]').forEach(x => x.classList.remove('selected')); button.classList.add('selected'); }));
renderStep();
