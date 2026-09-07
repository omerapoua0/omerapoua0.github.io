(() => {
 const sheet=document.querySelector('link[href^="math-design.css"]');
 if(sheet)document.head.append(sheet);
 addEventListener('DOMContentLoaded',()=>{if(sheet)document.head.append(sheet)});
 const layer=document.getElementById('equation-scene'),canvas=document.getElementById('math-surface'),stage=document.querySelector('.particle-stage');
 if(!layer||!canvas||!window.OmarMathSurface)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=false,paused=true,visible=false,renderer=null,attempted=false,lost=false,frame=0,last=0,time=0,width=0,height=0;
 let aimX=0,aimY=0,tiltX=0,tiltY=0;
 const moving=()=>active&&!paused&&visible&&!document.hidden&&!reduced.matches&&!navigator.connection?.saveData&&!lost;
 function paint(){
  if(!renderer||!width||!height)return;
  renderer.draw(width,height,-.58+Math.sin(time*.15)*.055+tiltX,.58+Math.sin(time*.12)*.16+tiltY,document.documentElement.dataset.theme==='light');
  layer.classList.add('surface-ready');
 }
 function resize(){
  if(!active||lost)return;
  const box=canvas.getBoundingClientRect();if(!box.width||!box.height)return;
  const ratio=Math.min(devicePixelRatio||1,box.width<600?1.5:1.75);
  width=Math.round(box.width*ratio);height=Math.round(box.height*ratio);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
  if(!attempted){attempted=true;renderer=window.OmarMathSurface.createRenderer(canvas)}
  paint();
 }
 function tick(now){
  frame=0;if(!moving()||!renderer)return;
  const dt=last?Math.min((now-last)/1000,.04):.016;last=now;time+=dt;
  const ease=1-Math.exp(-dt*2.8);tiltX+=(aimX-tiltX)*ease;tiltY+=(aimY-tiltY)*ease;paint();frame=requestAnimationFrame(tick);
 }
 function sync(){
  layer.classList.toggle('math-still',!moving());cancelAnimationFrame(frame);frame=0;last=0;
  if(active){resize();if(moving()&&renderer)frame=requestAnimationFrame(tick)}
 }
 document.addEventListener('hero:state',e=>{active=e.detail.index===1;paused=e.detail.paused;visible=e.detail.visible;sync()});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 document.addEventListener('themechange',paint);new ResizeObserver(resize).observe(canvas);
 stage?.addEventListener('pointermove',e=>{if(!moving())return;const r=stage.getBoundingClientRect();aimX=((e.clientY-r.top)/r.height-.5)*.22;aimY=((e.clientX-r.left)/r.width-.5)*.35});
 stage?.addEventListener('pointerleave',()=>{aimX=aimY=0});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;layer.classList.remove('surface-ready');sync()});
 canvas.addEventListener('webglcontextrestored',()=>{renderer=null;attempted=false;lost=false;sync()});
 addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0});
 addEventListener('pageshow',sync);
 sync();
})();
