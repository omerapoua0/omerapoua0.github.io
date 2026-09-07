/* Enneper's minimal surface, sampled on a circular parameter domain.
   Geometry is shared by the GPU view and the still fallback renderer. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OmarMathSurface=api})(typeof window!=='undefined'?window:globalThis,()=>{
 const radius=1.4;
 const unit=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l)};
 function sample(r,t){
  const u=r*Math.cos(t),v=r*Math.sin(t),s=.58;
  const p=[(u-u*u*u/3+u*v*v)*s,(-v+v*v*v/3-v*u*u)*s,(u*u-v*v)*s];
  const a=[1-u*u+v*v,-2*u*v,2*u],b=[2*u*v,-1+v*v-u*u,-2*v];
  const n=unit([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]);
  return {p,n,uv:[u,v]};
 }
 function geometry(rings=48,segments=144){
  const data=[];
  const push=p=>data.push(...p.p,...p.n,...p.uv);
  for(let i=0;i<rings;i++)for(let j=0;j<segments;j++){
   const a=sample(radius*i/rings,2*Math.PI*j/segments),b=sample(radius*(i+1)/rings,2*Math.PI*j/segments),c=sample(radius*(i+1)/rings,2*Math.PI*(j+1)/segments),d=sample(radius*i/rings,2*Math.PI*(j+1)/segments);
   if(i){push(a);push(b);push(d)}push(b);push(c);push(d);
  }
  return new Float32Array(data);
 }
 function rotate(p,x,y){const cy=Math.cos(y),sy=Math.sin(y),cx=Math.cos(x),sx=Math.sin(x),xx=p[0]*cy+p[2]*sy,zz=-p[0]*sy+p[2]*cy;return[xx,p[1]*cx-zz*sx,p[1]*sx+zz*cx]}
 const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUv;uniform vec2 uAngle;uniform float uAspect;varying vec3 vNormal;varying vec3 vPosition;varying vec2 vUv;
 vec3 turn(vec3 p){float cx=cos(uAngle.x),sx=sin(uAngle.x),cy=cos(uAngle.y),sy=sin(uAngle.y);vec3 q=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);return vec3(q.x,q.y*cx-q.z*sx,q.y*sx+q.z*cx);}
 void main(){vec3 p=turn(aPosition);vPosition=p;vNormal=turn(aNormal);vUv=aUv;float lens=7.0/(7.0-p.z);gl_Position=vec4(p.x*.68*lens/uAspect,p.y*.68*lens,-p.z/8.0,1.0);}`;
 const fragment=`precision mediump float;varying vec3 vNormal;varying vec3 vPosition;varying vec2 vUv;uniform float uLight;
 void main(){vec3 n=normalize(vNormal);vec3 eye=normalize(vec3(0.,0.,7.)-vPosition);if(dot(n,eye)<0.)n=-n;
 vec3 key=normalize(vec3(-.45,.7,1.));float diffuse=max(dot(n,key),0.);float spec=pow(max(dot(n,normalize(key+eye)),0.),64.);float broad=pow(max(dot(n,normalize(vec3(.75,-.15,1.))),0.),14.);float fresnel=pow(1.-max(dot(n,eye),0.),3.);
 vec3 deep=mix(vec3(.035,.13,.115),vec3(.035,.11,.09),uLight);vec3 pearl=mix(vec3(.68,.79,.76),vec3(.48,.61,.56),uLight);vec3 color=mix(deep,pearl,pow(diffuse,.8))*(.46+.55*diffuse);
 color+=vec3(.82,.97,.9)*spec*.8+vec3(.15,.29,.4)*broad*.35+vec3(.24,.57,.47)*fresnel*.65;
 float rim=smoothstep(1.38,1.4,length(vUv));color+=vec3(.48,.68,.59)*rim*.3;
 gl_FragColor=vec4(color,1.);}`;
 function createRenderer(canvas){
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)return null;
  let program,buffer;const shaders=[];
  try{
   const compile=(type,source)=>{const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Surface shader unavailable');return s};
   program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Surface renderer unavailable');
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const vertices=geometry();gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
   for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,12],['aUv',2,24]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset)}
   const angle=gl.getUniformLocation(program,'uAngle'),aspect=gl.getUniformLocation(program,'uAspect'),light=gl.getUniformLocation(program,'uLight');gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
   return {draw(w,h,x,y,isLight){gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform2f(angle,x,y);gl.uniform1f(aspect,w/h);gl.uniform1f(light,isLight?1:0);gl.drawArrays(gl.TRIANGLES,0,vertices.length/8)},dispose(){gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s))}};
  }catch{if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));return null}
 }
 // Static, deterministic fallback: no animation loop or GPU required.
 function drawStill(ctx,width,height,x=-.58,y=.58){
  const vertices=geometry(100,320),faces=[];const key=unit([-.45,.7,1]);
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  ctx.clearRect(0,0,width,height);
  for(let i=0;i<vertices.length;i+=24){
   const ps=[0,8,16].map(o=>rotate(Array.from(vertices.slice(i+o,i+o+3)),x,y));
   let n=unit(rotate([0,1,2].map(k=>(vertices[i+3+k]+vertices[i+11+k]+vertices[i+19+k])/3),x,y));if(n[2]<0)n=n.map(v=>-v);
   const d=Math.max(0,dot(n,key)),spec=Math.max(0,dot(n,unit([key[0],key[1],key[2]+1])))**64,f=(1-Math.max(0,n[2]))**3;
   const deep=[.035,.13,.115],pearl=[.68,.79,.76],shine=[.82,.97,.9],rim=[.24,.57,.47];
   const color=deep.map((v,k)=>Math.round(Math.min(1,((v+(pearl[k]-v)*d**.8)*(.46+.55*d)+shine[k]*spec*.8+rim[k]*f*.65))*255));
   faces.push({z:ps.reduce((s,p)=>s+p[2],0)/3,color:'rgb('+color.join(',')+')',p:ps.map(p=>{const lens=7/(7-p[2]);return[width/2+p[0]*.34*height*lens,height/2-p[1]*.34*height*lens]})});
  }
  faces.sort((a,b)=>a.z-b.z);for(const face of faces){ctx.beginPath();face.p.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=ctx.strokeStyle=face.color;ctx.lineWidth=.6;ctx.fill();ctx.stroke()}
 }
 return {sample,geometry,rotate,createRenderer,drawStill,vertex,fragment};
});
