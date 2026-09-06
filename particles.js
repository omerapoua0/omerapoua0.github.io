(() => {
  const canvas = document.getElementById('particle-engine');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const count = innerWidth < 760 ? 4200 : 11500;
  const names = ['Possibility', 'Mathematics', 'Compute', 'Intelligence', 'Quantum'];
  const controls = [...document.querySelectorAll('[data-shape]')];
  const pause = document.querySelector('.motion-toggle');
  let width = 1, height = 1, scale = 1, active = 0, paused = motion.matches;
  let frame = 0, last = 0, elapsed = 0, phase = 0, visible = true;
  let pointer = { x: -9999, y: -9999 }, rotation = { x: .12, y: -.3 }, desiredRotation = {...rotation};
  let morphAge=0,departing=-1,departureStrength=0;
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
    p.font='42px Georgia';p.fillText('∫  ∇  ∞',250,431);p.font='30px Georgia';p.fillText('P(A | B) ∝ P(B | A) P(A)',250,60);
  });
  // Sample actual volumes, not 2D icon masks. Each point carries its material
  // and surface normal so the same lighting model survives every transition.
  const chip = [], robot = [], chipFaces=[],robotFaces=[];
  const face=(out,vertices,normal,material=0)=>out.push({vertices,normal,material});
  const point=(out,x,y,z,nx=0,ny=0,nz=1,material=0)=>out.push({x,y,z,nx,ny,nz,material});
  function box(out,x,y,z,w,h,d,steps,material=0){
    if(out===chip){
      const l=x-w/2,r=x+w/2,t=y-h/2,b=y+h/2,f=z+d/2,k=z-d/2;
      face(chipFaces,[[l,t,f],[r,t,f],[r,b,f],[l,b,f]],[0,0,1],material);
      face(chipFaces,[[l,t,k],[r,t,k],[r,b,k],[l,b,k]],[0,0,-1],material);
      face(chipFaces,[[l,t,k],[l,t,f],[l,b,f],[l,b,k]],[-1,0,0],material);
      face(chipFaces,[[r,t,k],[r,t,f],[r,b,f],[r,b,k]],[1,0,0],material);
      face(chipFaces,[[l,t,k],[r,t,k],[r,t,f],[l,t,f]],[0,-1,0],material);
      face(chipFaces,[[l,b,k],[r,b,k],[r,b,f],[l,b,f]],[0,1,0],material);
    }
    for(let a=0;a<=steps;a++)for(let b=0;b<=steps;b++){
      const u=a/steps-.5,v=b/steps-.5;
      point(out,x+u*w,y+v*h,z+d/2,0,0,1,material);
      point(out,x+u*w,y+v*h,z-d/2,0,0,-1,material);
      if(b%2===0){
        point(out,x-w/2,y+u*h,z+v*d,-1,0,0,material);
        point(out,x+w/2,y+u*h,z+v*d,1,0,0,material);
        point(out,x+u*w,y-h/2,z+v*d,0,-1,0,material);
        point(out,x+u*w,y+h/2,z+v*d,0,1,0,material);
      }
    }
  }
  function line(out,a,b,steps,material=1){
    if(out===chip){
      const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len*.004,ny=dx/len*.004;
      face(chipFaces,[[a[0]+nx,a[1]+ny,a[2]],[b[0]+nx,b[1]+ny,b[2]],[b[0]-nx,b[1]-ny,b[2]],[a[0]-nx,a[1]-ny,a[2]]],[0,0,1],material);
    }
    for(let i=0;i<=steps;i++){const t=i/steps;point(out,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,0,0,1,material);}
  }
  // Substrate, floating interposer and tiled silicon die, with routed contacts.
  box(chip,0,0,-.20,1.70,1.70,.12,45,2);
  box(chip,0,0,-.04,1.32,1.32,.12,40,0);
  box(chip,0,0,.13,.91,.91,.17,34,0);
  for(let x=0;x<4;x++)for(let y=0;y<4;y++){
    box(chip,-.324+x*.216,-.324+y*.216,.24,.188,.188,.035,7,2);
    for(let route=0;route<4;route++)line(chip,[-.40+x*.216,-.385+y*.216+route*.038,.261],[-.25+x*.216,-.385+y*.216+route*.038,.261],6,1);
  }
  for(let edge=0;edge<4;edge++)for(let i=0;i<18;i++){
    const t=-.74+i*.087,turn=([x,y,z])=>edge===0?[x,y,z]:edge===1?[-y,x,z]:edge===2?[-x,-y,z]:[y,-x,z];
    line(chip,turn([t,.71,-.125]),turn([t,.94,-.125]),10,1);
    line(chip,turn([t*.68,.49,.03]),turn([t,.71,-.125]),10,1);
    box(chip,...turn([t,.96,-.18]),edge%2?.065:.025,edge%2?.025:.065,.065,2,1);
  }
  // An industrial android: curved ceramic shell, recessed optical visor,
  // machined temples and a ribbed neck. No cartoon mouth or antenna.
  for(let row=0;row<=105;row++)for(let col=0;col<165;col++){
    const v=.06+row/105*(Math.PI-.12),u=col/165*Math.PI*2;
    const ny=-Math.cos(v),r=Math.sin(v),front=Math.sin(u);
    const jaw=ny>.28?1-(ny-.28)*.35:1;
    const x=.60*r*Math.cos(u)*jaw,y=-.36+ny*.77,z=.48*r*front;
    const visor=ny>-.22&&ny<.12&&front>.40;
    const seam=Math.abs(Math.cos(u))<.018&&front<0;
    if(!seam)point(robot,x,y,visor?z-.045:z,Math.cos(u)*r,ny,front*r,visor?3:0);
  }
  // One continuous optical light follows the curvature of the visor.
  for(let i=0;i<340;i++){
    const u=.43+i/339*(Math.PI-.86);
    for(let j=0;j<3;j++)point(robot,.568*Math.cos(u),-.405+j*.006,.457*Math.sin(u),Math.cos(u),0,Math.sin(u),4);
  }
  for(const side of [-1,1])for(let i=0;i<100;i++)for(let j=0;j<14;j++){
    const a=i/100*Math.PI*2,r=.105+j*.003;
    point(robot,side*(.562+j*.001),-.31+Math.cos(a)*r,Math.sin(a)*r,side,0,0,j<3?1:2);
  }
  for(let row=0;row<30;row++)for(let i=0;i<80;i++){
    const a=i/80*Math.PI*2,r=.21+(row%6<2?.018:0);
    point(robot,Math.cos(a)*r,.34+row*.01,Math.sin(a)*r,Math.cos(a),0,Math.sin(a),row%6<2?1:2);
  }
  for(let row=0;row<35;row++)for(let col=0;col<125;col++){
    const u=col/124*Math.PI,v=row/34,w=.31+.62*Math.sin(v*Math.PI/2);
    point(robot,Math.cos(u)*w,.62+v*.42,Math.sin(u)*(.29+v*.05),Math.cos(u)*.7,-.4,Math.sin(u),v<.07?1:0);
  }
  function shell(v,u){
    const ny=-Math.cos(v),r=Math.sin(v),front=Math.sin(u),jaw=ny>.28?1-(ny-.28)*.35:1;
    const visor=ny>-.22&&ny<.12&&front>.4;
    return {p:[.60*r*Math.cos(u)*jaw,-.36+ny*.77,.48*r*front-(visor?.045:0)],n:[Math.cos(u)*r,ny,front*r],m:visor?3:0};
  }
  for(let row=0;row<48;row++)for(let col=0;col<80;col++){
    const v=.06+row/48*(Math.PI-.12),u=col/80*Math.PI*2,dv=(Math.PI-.12)/48,du=Math.PI*2/80;
    const a=shell(v,u),b=shell(v+dv,u),c=shell(v+dv,u+du),d=shell(v,u+du),mid=shell(v+dv/2,u+du/2);
    face(robotFaces,[a.p,b.p,c.p,d.p],mid.n,mid.m);
    robotFaces[robotFaces.length-1].normals=[a.n,b.n,c.n,d.n];
  }
  for(let i=0;i<100;i++){
    const u=.43+i/100*(Math.PI-.86),v=.43+(i+1)/100*(Math.PI-.86);
    face(robotFaces,[[.568*Math.cos(u),-.409,.457*Math.sin(u)],[.568*Math.cos(v),-.409,.457*Math.sin(v)],[.568*Math.cos(v),-.395,.457*Math.sin(v)],[.568*Math.cos(u),-.395,.457*Math.sin(u)]],[Math.cos(u),0,Math.sin(u)],4);
  }
  for(let row=0;row<20;row++)for(let col=0;col<48;col++){
    const vertex=(r,c)=>{const u=c/48*Math.PI,v=r/20;return [Math.cos(u)*(.31+.62*Math.sin(v*Math.PI/2)),.62+v*.42,Math.sin(u)*(.29+v*.05)];};
    const u=(col+.5)/48*Math.PI;
    face(robotFaces,[vertex(row,col),vertex(row+1,col),vertex(row+1,col+1),vertex(row,col+1)],[Math.cos(u)*.7,-.4,Math.sin(u)],row===0?1:0);
    robotFaces[robotFaces.length-1].normals=[col,col,col+1,col+1].map(c=>[Math.cos(c/48*Math.PI)*.7,-.4,Math.sin(c/48*Math.PI)]);
  }
  for(let row=0;row<15;row++)for(let col=0;col<48;col++){
    const u=col/48*Math.PI*2,v=(col+1)/48*Math.PI*2,r=.21+(row%3===0?.018:0),y=.34+row*.02;
    face(robotFaces,[[Math.cos(u)*r,y,Math.sin(u)*r],[Math.cos(v)*r,y,Math.sin(v)*r],[Math.cos(v)*r,y+.02,Math.sin(v)*r],[Math.cos(u)*r,y+.02,Math.sin(u)*r]],[Math.cos(u),0,Math.sin(u)],row%3===0?1:2);
  }
  for(const side of [-1,1])for(let i=0;i<64;i++){
    const u=i/64*Math.PI*2,v=(i+1)/64*Math.PI*2;
    face(robotFaces,[[side*.594,-.31,0],[side*.594,-.31+Math.cos(u)*.145,Math.sin(u)*.145],[side*.594,-.31+Math.cos(v)*.145,Math.sin(v)*.145]],[side,0,0],2);
  }
  const quantum=[];
  for(let i=0;i<count;i++){
    const a=rand(0,Math.PI*2),ring=i%3,b=ring*Math.PI/3,r=i%5===0?rand(0,.2):1;
    const x=Math.cos(a)*r, y=Math.sin(a)*.36*r;
    quantum.push({x:x*Math.cos(b)-y*Math.sin(b)+rand(-.015,.015),y:x*Math.sin(b)+y*Math.cos(b)+rand(-.015,.015),z:Math.sin(a)*.5*r});
  }
  const knot=[];
  for(let i=0;i<count;i++){
    const u=(i%180)/180*Math.PI*2,v=Math.floor(i/180)/Math.ceil(count/180)*Math.PI*2;
    const center=t=>({x:(1.55+.56*Math.cos(3*t))*Math.cos(2*t),y:(1.55+.56*Math.cos(3*t))*Math.sin(2*t),z:.56*Math.sin(3*t)});
    const c=center(u),next=center(u+.001),tx=next.x-c.x,ty=next.y-c.y,tz=next.z-c.z,len=Math.hypot(tx,ty,tz),t={x:tx/len,y:ty/len,z:tz/len};
    const nl=Math.hypot(t.x,t.y),n={x:-t.y/nl,y:t.x/nl,z:0},bin={x:-t.z*n.y,y:t.z*n.x,z:t.x*n.y-t.y*n.x};
    const r=.19,nx=n.x*Math.cos(v)+bin.x*Math.sin(v),ny=n.y*Math.cos(v)+bin.y*Math.sin(v),nz=n.z*Math.cos(v)+bin.z*Math.sin(v);knot.push({x:(c.x+r*nx)*.52,y:(c.y+r*ny)*.52,z:(c.z+r*nz)*.52,nx,ny,nz,material:0});
  }
  const sources=[knot,maths,chip,robot,quantum];
  // A small GPU material pass supplies continuous studio reflections. The
  // canvas renderer below remains the fallback when WebGL is unavailable.
  function createSurfaceRenderer(){
    const surface=document.createElement('canvas');
    const gl=surface.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
    if(!gl)return null;
    let contextLost=false;
    surface.addEventListener('webglcontextlost',()=>{contextLost=true;});
    const vertex=`attribute vec3 position;attribute vec3 normal;attribute float material;
      uniform vec2 angles;uniform vec2 viewport;uniform float scale;
      varying vec3 vNormal;varying vec3 vPosition;varying float vMaterial;
      vec3 rotate(vec3 p){float cy=cos(angles.y),sy=sin(angles.y),cx=cos(angles.x),sx=sin(angles.x);vec3 r=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);return vec3(r.x,r.y*cx-r.z*sx,r.y*sx+r.z*cx);}
      void main(){vec3 p=rotate(position);float depth=3.6/(3.6-p.z);gl_Position=vec4(.04+2.0*p.x*scale*depth/viewport.x,.08-2.0*p.y*scale*depth/viewport.y,-p.z*.2,1.0);vNormal=rotate(normal);vPosition=p;vMaterial=material;}`;
    const fragment=`precision mediump float;varying vec3 vNormal;varying vec3 vPosition;varying float vMaterial;uniform float lightTheme;
      void main(){vec3 n=normalize(vNormal);vec3 view=normalize(vec3(0.0,0.0,3.6)-vPosition);vec3 key=normalize(vec3(-.6,-.8,1.0));vec3 h=normalize(key+view);
      float diffuse=max(dot(n,key),0.0);float broad=pow(max(dot(n,h),0.0),18.0);float sharp=pow(max(dot(n,normalize(vec3(-.1,-.6,1.0))),0.0),95.0);float rim=pow(1.0-max(dot(n,view),0.0),3.0);
      vec3 base=vec3(.43,.41,.38);float metal=.7;
      if(vMaterial>.5&&vMaterial<1.5){base=vec3(.47,.27,.12);metal=.95;}
      if(vMaterial>1.5&&vMaterial<2.5){base=vec3(.085,.095,.12);metal=.85;}
      if(vMaterial>2.5&&vMaterial<3.5){base=vec3(.008,.012,.018);metal=.8;}
      vec3 color=base*(.16+diffuse*.72)+mix(vec3(1.0),base,.45)*broad*.55+vec3(1.0,.94,.83)*sharp*.55+vec3(.30,.35,.43)*rim*metal*.48;
      if(vMaterial>3.5)color=vec3(.96,.72,.40);
      color+=base*lightTheme*.06;gl_FragColor=vec4(pow(color,vec3(.8)),1.0);}`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Surface shader compilation failed');return s;}
    try{
      const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
      const positions=gl.getAttribLocation(program,'position'),normals=gl.getAttribLocation(program,'normal'),materials=gl.getAttribLocation(program,'material');
      const uniforms=Object.fromEntries(['angles','viewport','scale','lightTheme'].map(n=>[n,gl.getUniformLocation(program,n)]));
      const meshes=[chipFaces,robotFaces].map(faces=>{const data=[];
        for(const f of faces)for(let j=1;j<f.vertices.length-1;j++)for(const i of [0,j,j+1])data.push(...f.vertices[i],...(f.normals?.[i]||f.normal),f.material);
        const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer,count:data.length/7};
      });
      return {draw(index,w,h,s,ax,ay,light){
        if(contextLost||gl.isContextLost())return null;
        const dpr=Math.min(devicePixelRatio||1,2);if(surface.width!==Math.round(w*dpr)||surface.height!==Math.round(h*dpr)){surface.width=Math.round(w*dpr);surface.height=Math.round(h*dpr);}
        gl.viewport(0,0,surface.width,surface.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.useProgram(program);
        const mesh=meshes[index];gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
        for(const [location,size,offset] of [[positions,3,0],[normals,3,12],[materials,1,24]]){gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,28,offset);}
        gl.uniform2f(uniforms.angles,ax,ay);gl.uniform2f(uniforms.viewport,w,h);gl.uniform1f(uniforms.scale,s);gl.uniform1f(uniforms.lightTheme,light?1:0);gl.drawArrays(gl.TRIANGLES,0,mesh.count);return surface;
      }};
    }catch{return null;}
  }
  let surfaceRenderer;
  try{surfaceRenderer=createSurfaceRenderer();}catch{surfaceRenderer=null;}
  const surfaceFallbacks=new Map();
  const targets=sources.map(points=>Array.from({length:count},(_,i)=>points[Math.floor(i*points.length/count)]));
  const particles=Array.from({length:count},(_,i)=>({x:targets[0][i].x*1.10,y:targets[0][i].y*1.10,z:targets[0][i].z+.1,ox:0,oy:0,size:rand(.85,1.35),tone:i%8}));
  const projected=Array.from({length:count},()=>({}));
  let pose={x:.42,y:0};
  const palettes=[false,true].map(light=>Array.from({length:5},(_,material)=>Array.from({length:64},(_,i)=>{
    const l=i/63;
    if(material===4)return light?'#8f4829':'#f6d9ab';
    if(material===3)return light?`hsl(225 9% ${15+l*19}%)`:`hsl(225 9% ${5+l*8}%)`;
    if(material===1)return `hsl(28 ${light?33:39}% ${light?22+l*40:15+l*68}%)`;
    if(material===2)return `hsl(240 7% ${light?15+l*37:8+l*37}%)`;
    return `hsl(35 ${light?8:12}% ${light?20+l*45:13+l*79}%)`;
  })));
  let origins=particles.map(p=>({x:p.x,y:p.y,z:p.z}));
  const dust=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),r:rand(.3,1)}));
  function resize(){
    const box=canvas.getBoundingClientRect(); width=box.width;height=box.height;scale=Math.min(width*.31,height*.34);
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    if(paused) render(0);
  }
  function choose(index){
    departing=active;const settled=Math.max(0,Math.min(1,(morphAge-1.7)/1.5));departureStrength=settled*settled*(3-2*settled);
    origins=particles.map(p=>({x:p.x,y:p.y,z:p.z}));morphAge=0;active=index;phase=0;
    controls.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
    controls.forEach(b=>b.style.setProperty('--progress','0%'));
    document.getElementById('shape-name').textContent=names[index];
    document.getElementById('shape-number').textContent='0'+(index+1)+' / 05';
    if(paused){particles.forEach((p,i)=>Object.assign(p,targets[active][i],{ox:0,oy:0}));origins=particles.map(p=>({x:p.x,y:p.y,z:p.z}));morphAge=3.2;pose={x:index===2?.55:index===0?.42:.03,y:index===2?-.38:0};render(0);}
  }
  function render(dt){
    const light=document.documentElement.dataset.theme==='light';
    ctx.clearRect(0,0,width,height);
    const glow=ctx.createRadialGradient(width*.51,height*.48,0,width*.51,height*.48,scale*1.7);
    glow.addColorStop(0,light?'rgba(189,108,68,.07)':'rgba(173,102,68,.06)');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    ctx.fillStyle=light?'#8e786633':'#c7a88644';
    dust.forEach(d=>{const x=d.x*width,y=(d.y*height+elapsed*2)%height;ctx.fillRect(x,y,d.r,d.r)});
    const smoothing=1-Math.exp(-dt*3.5);
    rotation.x+=(desiredRotation.x-rotation.x)*smoothing;rotation.y+=(desiredRotation.y-rotation.y)*smoothing;
    const targetX=active===2?.55:active===0?.42:.03,targetY=active===2?-.38:0;
    pose.x+=(targetX-pose.x)*smoothing;pose.y+=(targetY-pose.y)*smoothing;
    const angleY=rotation.y+pose.y+(paused?0:Math.sin(elapsed*.12)*.14),angleX=rotation.x+pose.x;
    const cy=Math.cos(angleY),sy=Math.sin(angleY),cx=Math.cos(angleX),sx=Math.sin(angleX);
    morphAge+=dt;
    const surfaceProgress=paused?1:Math.max(0,Math.min(1,(morphAge-1.7)/1.5));
    const surfaceOpacity=surfaceProgress*surfaceProgress*(3-2*surfaceProgress);
    const departureProgress=Math.max(0,1-morphAge/.85),departureOpacity=paused?0:departureStrength*departureProgress*departureProgress;
    const solidOnly=(active===2||active===3)&&(paused||morphAge>3.5);
    if(!solidOnly){
    for(let i=0;i<count;i++){
      const p=particles[i],t=targets[active][i];
      if(!paused){
        const u=Math.max(0,Math.min(1,(morphAge-(i%17)*.008)/3.1)),e=u*u*u*(u*(u*6-15)+10),o=origins[i];
        const arc=Math.sin(Math.PI*e)*.12;
        p.x=o.x+(t.x-o.x)*e+arc*Math.sin(i*.13);
        p.y=o.y+(t.y-o.y)*e+arc*Math.cos(i*.13);
        p.z=o.z+(t.z-o.z)*e+arc;
      }
      const rx=p.x*cy+p.z*sy,rz=-p.x*sy+p.z*cy,ry=p.y*cx-rz*sx,z=p.y*sx+rz*cx,depth=3.6/(3.6-z);
      const x=width*.52+rx*scale*depth,y=height*.46+ry*scale*depth;
      const dx=x-pointer.x,dy=y-pointer.y,dist=Math.hypot(dx,dy);
      if(!paused){const force=dist<100&&dist>1?Math.pow(1-dist/100,2)*7:0;const k=1-Math.exp(-dt*5);p.ox+=(dx/Math.max(dist,1)*force-p.ox)*k;p.oy+=(dy/Math.max(dist,1)*force-p.oy)*k;}
      const nx=(t.nx||0)*cy+(t.nz??1)*sy,nz=-(t.nx||0)*sy+(t.nz??1)*cy,ny=(t.ny||0)*cx-nz*sx,nzz=(t.ny||0)*sx+nz*cx;
      const diffuse=Math.max(0,-nx*.45-ny*.6+nzz*.65),spec=Math.pow(Math.max(0,-nx*.25-ny*.38+nzz*.89),24);
      const lighting=Math.min(1,.12+diffuse*.68+spec*.48);
      const q=projected[i];q.x=x+p.ox;q.y=y+p.oy;q.z=z;q.size=p.size*depth*(width<500?1.0:1.25);q.material=t.material||0;
      q.light=Math.round(lighting*63);q.alpha=t.nx===undefined?.8:nzz<-.1?.16:1;
    }
    // Painter's order gives overlapping layers and the visor real depth.
    projected.sort((a,b)=>a.z-b.z);
    for(const q of projected){
      const cover=Math.max((active===2||active===3)?surfaceOpacity:0,(departing===2||departing===3)?departureOpacity:0);
      if(cover===1)continue;
      ctx.globalAlpha=q.alpha*(1-cover*.90);ctx.fillStyle=palettes[light?1:0][q.material][q.light];
      ctx.fillRect(q.x,q.y,q.size,q.size);
    }
    }
    function drawSurface(shape,opacity){
      if((shape!==2&&shape!==3)||opacity<=0)return;
      const surfaceFrame=surfaceRenderer?.draw(shape-2,width,height,scale,angleX,angleY,light);
      if(surfaceFrame){ctx.globalAlpha=opacity;ctx.drawImage(surfaceFrame,0,0,width,height);return;}
      // Without GPU support, retain a still material view while the particle
      // transitions remain animated. Do not repeatedly rasterize thousands of faces.
      const cacheKey=[shape,width,height,light].join(':');
      if(surfaceFallbacks.has(cacheKey)){ctx.globalAlpha=opacity;ctx.drawImage(surfaceFallbacks.get(cacheKey),0,0,width,height);return;}
      const fallback=document.createElement('canvas');fallback.width=Math.round(width);fallback.height=Math.round(height);
      const ink=fallback.getContext('2d');
      const faces=shape===2?chipFaces:robotFaces,drawFaces=[];
      for(const f of faces){
        const [a,b,c]=f.normal,nx=a*cy+c*sy,nz=-a*sy+c*cy,ny=b*cx-nz*sx,nzz=b*sx+nz*cx;
        if(nzz<-.025)continue;
        const vertices=f.vertices.map(([x,y,z])=>{
          const rx=x*cy+z*sy,rz=-x*sy+z*cy,ry=y*cx-rz*sx,zz=y*sx+rz*cx,depth=3.6/(3.6-zz);
          return [width*.52+rx*scale*depth,height*.46+ry*scale*depth,zz];
        });
        const diffuse=Math.max(0,-nx*.45-ny*.6+nzz*.65),spec=Math.pow(Math.max(0,-nx*.25-ny*.38+nzz*.89),32);
        const lighting=Math.min(1,.12+diffuse*.65+spec*.53);
        drawFaces.push({vertices,z:vertices.reduce((sum,p)=>sum+p[2],0)/vertices.length,color:palettes[light?1:0][f.material][Math.round(lighting*63)],material:f.material});
      }
      drawFaces.sort((a,b)=>a.z-b.z);
      for(const f of drawFaces){
        ink.beginPath();f.vertices.forEach((p,i)=>i?ink.lineTo(p[0],p[1]):ink.moveTo(p[0],p[1]));ink.closePath();
        ink.fillStyle=f.color;ink.strokeStyle=f.color;ink.lineWidth=.6;ink.fill();ink.stroke();
        if(shape===2&&f.material!==1){ink.strokeStyle=light?'#c5b49c55':'#f3ddbb44';ink.lineWidth=.7;ink.stroke();}
      }
      if(surfaceFallbacks.size>4)surfaceFallbacks.clear();surfaceFallbacks.set(cacheKey,fallback);
      ctx.globalAlpha=opacity;ctx.drawImage(fallback,0,0,width,height);
    }
    drawSurface(departing,departureOpacity);drawSurface(active,surfaceOpacity);
    ctx.globalAlpha=1;
  }
  function tick(now){
    frame=0;if(paused||!visible||document.hidden)return;
    const dt=last?Math.min((now-last)/1000,.04):.016;last=now;elapsed+=dt;phase+=dt;
    if(phase>11)choose((active+1)%5);
    controls[active]?.style.setProperty('--progress',(phase/11*100)+'%');
    render(dt);frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&!paused&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick)}}
  function syncPause(){pause.textContent=paused?'▷':'Ⅱ';pause.setAttribute('aria-label',paused?'Play animation':'Pause animation');pause.setAttribute('aria-pressed',String(paused));if(paused){cancelAnimationFrame(frame);frame=0;render(0)}else start()}
  controls.forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.shape))));
  pause.addEventListener('click',()=>{paused=!paused;syncPause()});
  canvas.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect();pointer={x:e.clientX-b.left,y:e.clientY-b.top};desiredRotation.y=-.3+(pointer.x/width-.5)*.26;desiredRotation.x=.12+(pointer.y/height-.5)*.14});
  canvas.addEventListener('pointerleave',()=>{pointer={x:-9999,y:-9999};desiredRotation={x:.12,y:-.3}});
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0}},{threshold:0}).observe(canvas);
  document.addEventListener('visibilitychange',start);
  document.addEventListener('themechange',()=>{if(paused)render(0)});
  motion.addEventListener('change',e=>{paused=e.matches;syncPause()});
  if(paused)particles.forEach((p,i)=>Object.assign(p,targets[0][i]));
  resize();syncPause();start();
})();
