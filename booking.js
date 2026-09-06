(() => {
  const form=document.getElementById('lesson-form');if(!form)return;
  const steps=[...form.querySelectorAll('[data-step]')],progress=[...form.querySelectorAll('.booking-progress li')],back=form.querySelector('.booking-back'),error=form.querySelector('.booking-error'),dialog=document.getElementById('booking-review');
  let step=0,brief='';
  const values=()=>Object.fromEntries([...form.querySelectorAll('input,select,textarea')].filter(el=>el.type!=='radio'||el.checked).map(el=>[el.name,el.value.trim()]));
  function render(focus=true){
    steps.forEach((el,i)=>{el.hidden=i!==step;el.disabled=i!==step});
    progress.forEach((el,i)=>{el.classList.toggle('active',i===step);el.classList.toggle('completed',i<step);if(i===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});
    back.hidden=step===0;
    document.getElementById('booking-step-label').textContent='Step '+(step+1)+' of 4';
    document.getElementById('booking-next-label').textContent=step===3?'Review my enquiry':'Continue';
    error.textContent='';
    if(focus){steps[step].querySelector('legend').focus({preventScroll:true});const r=form.getBoundingClientRect();if(r.top<96)form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}
  }
  form.addEventListener('change',()=>{
    const data=values();document.getElementById('lesson-subject').textContent=data.subject||'Your choice';document.getElementById('lesson-level').textContent=data.level||'Your starting point';document.getElementById('lesson-time').textContent=data.days&&data.time?data.days+' · '+data.time:'Let’s find a time';
  });
  form.addEventListener('input',e=>e.target.removeAttribute('aria-invalid'));
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const invalid=[...steps[step].querySelectorAll('input,select,textarea')].find(el=>!el.checkValidity()||(el.required&&el.type!=='radio'&&!el.value.trim()));
    if(invalid){error.textContent=invalid.type==='radio'?'Choose an option to continue.':invalid.type==='email'?'Enter a valid email address.':'Please complete '+(invalid.closest('label')?.childNodes[0]?.textContent?.trim().toLowerCase()||'the required field')+'.';invalid.setAttribute('aria-invalid','true');invalid.focus();return}
    if(step<3){step++;render();return}
    const data=values();
    brief='Tutoring enquiry\n\nName: '+data.name+'\nEmail: '+data.email+'\nEnquiring as: '+data.relationship+'\nSubject: '+data.subject+'\nLevel: '+data.level+'\nPreferred days: '+data.days+'\nPreferred time: '+data.time+'\nTime zone: '+data.timezone+'\nGoal: '+data.goal+'\n\n'+data.message;
    const summary=document.getElementById('booking-summary');summary.replaceChildren();
    [['Student / contact',data.name],['Email',data.email],['Subject & level',data.subject+' · '+data.level],['Preferred time',data.days+' · '+data.time],['Time zone',data.timezone],['Goal',data.goal]].forEach(([label,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);summary.append(row)});
    document.getElementById('booking-email').href='mailto:omerapoua0@gmail.com?subject='+encodeURIComponent('Lesson enquiry — '+data.subject+' / '+data.level)+'&body='+encodeURIComponent(brief);
    document.querySelector('.copy-status').textContent='';dialog.showModal();document.body.style.overflow='hidden';
  });
  back.addEventListener('click',()=>{if(step>0){step--;render()}});
  dialog.querySelector('.booking-dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.style.overflow='';form.querySelector('.booking-next').focus({preventScroll:true})});
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close()});
  dialog.querySelector('.copy-enquiry').addEventListener('click',async()=>{const status=dialog.querySelector('.copy-status');try{await navigator.clipboard.writeText(brief);status.textContent='Copied. Paste it into an email to omerapoua0@gmail.com.'}catch{status.textContent='Copy unavailable here. Use the email button above.'}});
  render(false);
})();
