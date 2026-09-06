(() => {
  const canvas = document.getElementById('particle-engine');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const count = innerWidth < 760 ? 2100 : 4600;
  const names = ['Mathematics', 'Compute', 'Intelligence', 'Quantum'];
  const controls = [...document.querySelectorAll('[data-shape]')];
  const pause = document.querySelector('.motion-toggle');
  let width = 1, height = 1, scale = 1, active = 0, paused = motion.matches;
  let frame = 0, last = 0, elapsed = 0, phase = 0, visible = true;
  let pointer = { x: -9999, y: -9999 }, rotation = { x: .12, y: -.3 };
  const sample = document.createElement('canvas');
  sample.width = sample.height = 500;
  const pen = sample.getContext('2d', {willReadFrequently: true});
  const rand = (min, max) => min + Math.random() * (max - min);
  function mask(draw) {
    pen.clearRect(0,0,500,500); pen.fillStyle = '#fff'; pen.strokeStyle = '#fff'; draw(pen);
    const pixels = pen.getImageData(0,0,500,500).data, points = [];
    for(let y=25;y<475;y+=3) for(let x=25;x<475;x+=3) if(pixels[(y*500+x)*4+3]>100) points.push({x:(x-250)/190,y:(y-250)/190,z:rand(-.08,.08)});
    return points;
  }
  const maths = mask(p => {
    p.textAlign='center';p.textBaseline='middle';p.font='280px Georgia';p.fillText('∑',250,255);
    p.font='42px Georgia';p.fillText('∫  ∇  ∞',250,431);p.font='30px Georgia';p.fillText('f(x) = intelligence',250,60);
  });
  const chip = [];
  for(let i=0;i<count;i++){
    const side=i%10;
    if(side<5) {const edge=i%4;const t=rand(-.66,.66);chip.push({x:edge<2?t:(edge===2?-.66:.66),y:edge<2?(edge===0?-.66:.66):t,z:rand(-.16,.16)});}
    else if(side<8) {const pin=Math.floor(rand(0,12)),t=-.59+pin*.107,out=rand(.68,1.04),e=i%4;chip.push({x:e<2?t:(e===2?-out:out),y:e<2?(e===0?-out:out):t,z:rand(-.03,.03)});}
    else {const grid=Math.floor(rand(0,7));chip.push({x:i%2?rand(-.48,.48):-.48+grid*.16,y:i%2?-.48+grid*.16:rand(-.48,.48),z:-.16});}
  }
  const center=mask(p=>{p.textAlign='center';p.textBaseline='middle';p.font='bold 90px sans-serif';p.fillText('AI',250,250)});
  for(let i=0;i<500;i++)chip[i]={...center[i%center.length],z:.19};
  const robot = mask(p=>{
    p.lineWidth=7;p.lineJoin='round';
    p.beginPath();p.roundRect(102,130,296,238,48);p.stroke();
    p.strokeRect(72,207,23,84);p.strokeRect(405,207,23,84);
    p.beginPath();p.moveTo(250,130);p.lineTo(250,84);p.stroke();p.beginPath();p.arc(250,69,13,0,Math.PI*2);p.stroke();
    p.fillRect(153,210,53,22);p.fillRect(294,210,53,22);
    p.lineWidth=5;p.beginPath();p.moveTo(194,303);p.lineTo(217,315);p.lineTo(283,315);p.lineTo(306,303);p.stroke();
    p.beginPath();p.moveTo(160,405);p.lineTo(202,374);p.lineTo(298,374);p.lineTo(340,405);p.stroke();
  });
  const quantum=[];
  for(let i=0;i<count;i++){
    const a=rand(0,Math.PI*2),ring=i%3,b=ring*Math.PI/3,r=i%5===0?rand(0,.2):1;
    const x=Math.cos(a)*r, y=Math.sin(a)*.36*r;
    quantum.push({x:x*Math.cos(b)-y*Math.sin(b)+rand(-.015,.015),y:x*Math.sin(b)+y*Math.cos(b)+rand(-.015,.015),z:Math.sin(a)*.5*r});
  }
  const sources=[maths,chip,robot,quantum];
  const targets=sources.map(points=>Array.from({length:count},(_,i)=>points[Math.floor(i*points.length/count)]));
  const particles=Array.from({length:count},(_,i)=>({x:rand(-2,2),y:rand(-1.5,1.5),z:rand(-2,2),vx:0,vy:0,vz:0,size:rand(.6,1.55),tone:i%8}));
  const dust=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),r:rand(.3,1)}));
  function resize(){
    const box=canvas.getBoundingClientRect(); width=box.width;height=box.height;scale=Math.min(width*.31,height*.34);
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    if(paused) render(0);
  }
  function choose(index){
    active=index;phase=0;
    controls.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
    document.getElementById('shape-name').textContent=names[index];
    document.getElementById('shape-number').textContent='0'+(index+1)+' / 04';
    if(paused){particles.forEach((p,i)=>Object.assign(p,targets[active][i],{vx:0,vy:0,vz:0}));render(0);}
  }
  function render(dt){
    const light=document.documentElement.dataset.theme==='light';
    ctx.clearRect(0,0,width,height);
    const glow=ctx.createRadialGradient(width*.51,height*.48,0,width*.51,height*.48,scale*1.7);
    glow.addColorStop(0,light?'rgba(98,155,45,.10)':'rgba(117,190,45,.08)');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    ctx.fillStyle=light?'#6d924455':'#a9de6655';
    dust.forEach(d=>{const x=d.x*width,y=(d.y*height+elapsed*2)%height;ctx.fillRect(x,y,d.r,d.r)});
    const angleY=rotation.y+(paused?0:Math.sin(elapsed*.22)*.14),angleX=rotation.x;
    const cy=Math.cos(angleY),sy=Math.sin(angleY),cx=Math.cos(angleX),sx=Math.sin(angleX);
    const step=Math.min(dt*60,2);
    for(let i=0;i<count;i++){
      const p=particles[i],t=targets[active][i];
      if(!paused){
        p.vx=(p.vx+(t.x-p.x)*.028*step)*Math.pow(.84,step);p.vy=(p.vy+(t.y-p.y)*.028*step)*Math.pow(.84,step);p.vz=(p.vz+(t.z-p.z)*.028*step)*Math.pow(.84,step);
        p.x+=p.vx*step;p.y+=p.vy*step;p.z+=p.vz*step;
      }
      const rx=p.x*cy+p.z*sy,rz=-p.x*sy+p.z*cy,ry=p.y*cx-rz*sx,z=p.y*sx+rz*cx,depth=3.6/(3.6-z);
      const x=width*.52+rx*scale*depth,y=height*.46+ry*scale*depth;
      const dx=x-pointer.x,dy=y-pointer.y,dist=Math.hypot(dx,dy);
      if(!paused&&dist<85&&dist>1){p.vx+=dx/dist*.018*(1-dist/85);p.vy+=dy/dist*.018*(1-dist/85);}
      ctx.globalAlpha=Math.max(.25,Math.min(1,.72+z*.3));
      ctx.fillStyle=light?(p.tone<2?'#1e5e41':'#4f821d'):(p.tone===0?'#eefbde':p.tone===1?'#7adfc2':p.tone<5?'#bafa72':'#6aab36');
      const size=p.size*depth*(width<500?.83:1);ctx.fillRect(x,y,size,size);
    }
    ctx.globalAlpha=1;
  }
  function tick(now){
    frame=0;if(paused||!visible||document.hidden)return;
    const dt=last?Math.min((now-last)/1000,.04):.016;last=now;elapsed+=dt;phase+=dt;
    if(phase>6.5)choose((active+1)%4);
    render(dt);frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&!paused&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick)}}
  function syncPause(){pause.textContent=paused?'▷':'Ⅱ';pause.setAttribute('aria-label',paused?'Play animation':'Pause animation');pause.setAttribute('aria-pressed',String(paused));if(paused){cancelAnimationFrame(frame);frame=0;render(0)}else start()}
  controls.forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.shape))));
  pause.addEventListener('click',()=>{paused=!paused;syncPause()});
  canvas.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect();pointer={x:e.clientX-b.left,y:e.clientY-b.top};rotation.y=-.3+(pointer.x/width-.5)*.38;rotation.x=.12+(pointer.y/height-.5)*.2});
  canvas.addEventListener('pointerleave',()=>{pointer={x:-9999,y:-9999}});
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0}},{threshold:0}).observe(canvas);
  document.addEventListener('visibilitychange',start);
  document.addEventListener('themechange',()=>{if(paused)render(0)});
  motion.addEventListener('change',e=>{paused=e.matches;syncPause()});
  if(paused)particles.forEach((p,i)=>Object.assign(p,targets[0][i]));
  resize();syncPause();start();
})();
