(() => {
 const css=document.querySelector('link[href^="atelier.css"]');if(css)document.head.append(css);
 document.querySelectorAll('.contact-pill,.footer-call').forEach(a=>{a.href='contact.html'});
 document.querySelectorAll('.detail-project').forEach(project=>{
  const a=document.createElement('a');a.className='similar-project';a.href='contact.html?topic=project';a.textContent='Discuss a similar challenge ↗';project.lastElementChild.append(a);
 });
 const form=document.getElementById('contact-form');if(!form)return;
 let draft='';
 const note=document.querySelector('.contact-error'),ready=document.getElementById('contact-ready');
 const copy=async(value,output)=>{try{await navigator.clipboard.writeText(value);output.textContent='Copied.'}catch{output.textContent='Copy unavailable. You can select the email address above.'}};
 document.querySelector('.copy-address')?.addEventListener('click',e=>copy('omerapoua0@gmail.com',e.currentTarget));
 const initial=new URLSearchParams(location.search).get('topic');
 if(['project','opportunity','research'].includes(initial)){form.querySelector('[value="'+initial+'"]').checked=true}
 const labels={project:'A project or automation',opportunity:'A role or opportunity',research:'A research conversation'};
 form.addEventListener('input',()=>{ready.hidden=true;note.textContent=''});
 form.addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(form),message=String(data.get('message')||'').trim(),name=String(data.get('name')||'').trim(),topic=String(data.get('topic'));
  if(!message){note.textContent='A sentence or two about your idea is enough.';form.elements.message.focus();return}
  draft=labels[topic]+'\n\n'+message+(name?'\n\nFrom: '+name:'');
  document.getElementById('contact-email').href='mailto:omerapoua0@gmail.com?subject='+encodeURIComponent(labels[topic])+'&body='+encodeURIComponent(draft);
  ready.hidden=false;ready.querySelector('h2').focus({preventScroll:true});ready.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
 });
 document.querySelector('.copy-draft')?.addEventListener('click',e=>copy(draft,e.currentTarget));
})();
