(() => {
  const stage=document.querySelector('.particle-stage'),layer=document.getElementById('robot-scene');
  if(!stage||!layer)return;
  const canvas=layer.querySelector('canvas'),status=document.getElementById('robot-status');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const scene='https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';
  const runtime='https://unpkg.com/@splinetool/runtime@1.10.22/build/runtime.js';
  let app=null,loading=null,failed=false,ready=false,shown=false,settled=false;
  const equations=document.getElementById('equation-scene');
  let state={index:-1,paused:motion.matches,visible:true},timer=0,loadTimer=0;
  const hint=()=>state.index===3&&!ready;
  function setShown(value){
    if(shown===value)return;
    shown=value;stage.classList.toggle('robot-visible',value);
    layer.setAttribute('aria-hidden',String(!value));
    document.dispatchEvent(new CustomEvent('hero:robot',{detail:{visible:value}}));
  }
  function sync(){
    const selected=state.index===3;
    stage.classList.toggle('equations-visible',state.index===1);
    equations?.setAttribute('aria-hidden',String(state.index!==1));
    document.dispatchEvent(new CustomEvent('hero:robot-status',{detail:{pending:!ready&&!failed}}));
    setShown(selected&&ready&&settled);
    status.hidden=!hint();
    if(hint())status.textContent=failed?'3D scene unavailable · showing the particle sculpture':'Loading the interactive robot…';
    if(!app||!ready)return;
    if(shown&&state.visible&&!state.paused&&!document.hidden)app.play();else app.stop();
  }
  async function size(){
    if(!app)return;
    const {width,height}=layer.getBoundingClientRect();
    if(width<1||height<1)return;
    app.setSize(Math.round(width),Math.round(height));
    app.setZoom(width<450?.78:.92);
    // A stopped WebGL canvas needs one painted frame after a resize, too.
    app.play();
    app.requestRender();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    sync();
  }
  async function loadRobot(){
    if(loading||ready||failed)return loading;
    loading=(async()=>{
      const abort=new AbortController();
      loadTimer=setTimeout(()=>{abort.abort();failed=true;sync()},25000);
      try{
        const {Application}=await import(runtime);
        if(failed)return;
        app=new Application(canvas,{renderMode:'auto'});
        await app.load(scene,undefined,{signal:abort.signal});
        if(failed){app.dispose();app=null;return;}
        app.setBackgroundColor('transparent');
        // Keep authored interactions inside the artwork, not over page links.
        app.setGlobalEvents(false);
        // Paint before revealing or stopping: reduced-motion visitors must
        // receive a real still frame rather than an empty WebGL canvas.
        await size();ready=true;sync();
      }catch{
        failed=true;ready=false;app?.dispose();app=null;sync();
      }finally{clearTimeout(loadTimer);loading=null;}
    })();
    return loading;
  }
  document.addEventListener('hero:state',e=>{
    const first=state.index===-1,changed=state.index!==e.detail.index;state=e.detail;
    if(changed){
      clearTimeout(timer);settled=false;
      if(state.index===3){
        settled=first||state.paused||motion.matches;
        if(!settled)timer=setTimeout(()=>{settled=true;sync()},2500);
      }
    }
    // Warm up during mathematics; on data-saving connections load on selection.
    if(state.visible&&(state.index===3||(state.index===1&&!navigator.connection?.saveData&&!motion.matches)))loadRobot();
    if(state.index===3&&state.paused){settled=true;clearTimeout(timer);}
    sync();
  });
  canvas.addEventListener('webglcontextlost',()=>{failed=true;ready=false;setShown(false);sync()});
  new ResizeObserver(()=>{if(ready)size()}).observe(layer);
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('themechange',()=>{if(ready)size()});
  addEventListener('pagehide',()=>app?.stop());
  addEventListener('pageshow',sync);
})();
