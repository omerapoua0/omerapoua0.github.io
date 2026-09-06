(() => {
 const sheet=document.querySelector('link[href^="math-design.css"]');if(sheet)document.head.append(sheet);
 // Other existing theme layers are promoted by deferred scripts; keep this
 // narrow hero treatment after them without changing any other page.
 addEventListener('DOMContentLoaded',()=>{if(sheet)document.head.append(sheet)});
 const layer=document.getElementById('equation-scene'),canvas=document.getElementById('math-atmosphere');if(!layer||!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 let active=false,paused=true,visible=true,frame=0,last=0,time=0,w=1,h=1;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function draw(){
  const light=document.documentElement.dataset.theme==='light';ctx.clearRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w*.54,h*.52,0,w*.54,h*.52,w*.49);glow.addColorStop(0,light?'#0d986b09':'#56dcb714');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  const ink=ctx.createLinearGradient(0,h,w,0);ink.addColorStop(0,light?'#286eab35':'#7d9be94a');ink.addColorStop(.5,light?'#147b534a':'#6bdcaa78');ink.addColorStop(1,light?'#4677ad22':'#a9ddec24');
  ctx.strokeStyle=ink;ctx.lineWidth=.7;
  for(let lane=-20;lane<=20;lane++){
   ctx.beginPath();for(let i=0;i<=90;i++){
    const u=i/90,x=u*w;
    const envelope=Math.sin(u*Math.PI);
    const y=h*(.76-u*.44)+Math.sin(u*7+time*.18+lane*.018)*h*.13+Math.cos(u*4-time*.12)*h*.065+lane*h*.006*(.6+envelope);
    i?ctx.lineTo(x,y):ctx.moveTo(x,y);
   }ctx.stroke();
  }
  ctx.fillStyle=light?'#29684d55':'#abeed177';for(let i=0;i<32;i++){const x=((i*.618+time*.004)%1)*w,y=((i*.382)%1)*h;ctx.globalAlpha=.3+.4*Math.sin(i+time*.2)**2;ctx.fillRect(x,y,1,1)}ctx.globalAlpha=1;
 }
 function resize(){const box=layer.getBoundingClientRect();if(box.width<1)return;w=box.width;h=box.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
 function tick(now){frame=0;if(!active||paused||!visible||document.hidden)return;if(!last||now-last>=32){time+=last?Math.min((now-last)/1000,.06):.032;last=now;draw()}frame=requestAnimationFrame(tick)}
 function sync(){layer.classList.toggle('math-still',paused||!active||!visible||document.hidden);cancelAnimationFrame(frame);frame=0;last=0;if(active){resize();if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick)}}
 document.addEventListener('hero:state',e=>{active=e.detail.index===1;paused=e.detail.paused||reduced.matches;visible=e.detail.visible;sync()});
 document.addEventListener('visibilitychange',sync);document.addEventListener('themechange',draw);new ResizeObserver(resize).observe(layer);
 const stage=document.querySelector('.particle-stage');stage.addEventListener('pointermove',e=>{if(paused||!active)return;const r=stage.getBoundingClientRect();layer.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5)*12+'px');layer.style.setProperty('--my',((e.clientY-r.top)/r.height-.5)*12+'px')});
 stage.addEventListener('pointerleave',()=>{layer.style.setProperty('--mx','0px');layer.style.setProperty('--my','0px')});
})();
