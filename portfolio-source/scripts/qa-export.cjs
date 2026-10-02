/* Read-only local verification of the flattened GitHub upload artifact.
 * Desktop/mobile editorial MP4s must each resolve from the flat export.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const base=process.env.EXPORT_QA_URL||'http://127.0.0.1:4324';
(async()=>{
 const files=await fs.readdir('pages-ready-video');
 for(const required of ['hero-editorial.mp4','hero-editorial-mobile.mp4','hero-editorial-poster.jpg','hero-editorial-poster-mobile.jpg'])assert.ok(files.includes(required),'Required export asset: '+required);
 for(const file of files){const response=await fetch(base+'/'+encodeURIComponent(file),{method:'HEAD'});assert.equal(response.status,200,'Export file: '+file)}
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const failures=[],errors=[],destinations=new Set(),films=[];
 try{
  const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();
  page.on('response',r=>{if(r.status()>=400)failures.push(r.status()+' '+r.url())});page.on('pageerror',e=>errors.push(e.message));
  for(const name of ['index','work','automations','research','cv','tutoring','contact']){
   await page.goto(base+'/'+name+'.html',{waitUntil:'networkidle'});assert.equal(await page.locator('h1').count(),1);
   for(const href of await page.locator('a[href]').evaluateAll(links=>links.map(a=>a.href))){if(new URL(href).origin===new URL(base).origin)destinations.add(href)}
  }
  const documents=new Map();
  for(const destination of destinations){
   const url=new URL(destination),key=url.origin+url.pathname;let html=documents.get(key);
   if(html===undefined){const response=await fetch(key);assert.equal(response.status,200,key);html=await response.text();documents.set(key,html)}
   if(url.hash){const id=decodeURIComponent(url.hash.slice(1));assert.ok(html.includes('id="'+id+'"'),'Missing target: '+destination)}
  }
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:900});
   const requests=[],listen=r=>{if(/\/hero-editorial(?:-mobile)?\.mp4(?:[?#]|$)/.test(r.url()))requests.push(new URL(r.url()).pathname)};
   page.on('request',listen);
   await page.goto(base+'/index.html',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>{const v=document.querySelector('[data-hero-video]');return v.currentTime>.1&&!v.paused});
   const state=await page.locator('[data-hero-video]').evaluate(v=>({src:new URL(v.currentSrc).pathname,width:v.videoWidth,height:v.videoHeight,duration:v.duration,poster:new URL(v.poster).pathname,sources:[...v.querySelectorAll('source')].map(s=>({src:new URL(s.src).pathname,type:s.type}))}));
   const suffix=width<=720?'-mobile':'',src='/hero-editorial'+suffix+'.mp4';
   assert.equal(state.src,src);assert.equal(state.width,width<=720?640:1280);assert.equal(state.height,800);
   assert.ok(Math.abs(state.duration-20)<.3,'20-second film');
   assert.equal(state.poster,width<=720?'/hero-editorial-poster-mobile.jpg':'/hero-editorial-poster.jpg');
   assert.deepEqual(state.sources,[{src,type:'video/mp4'}],'One valid MP4 source');
   assert.deepEqual([...new Set(requests)],[src],'No unneeded desktop/mobile film download');
   page.off('request',listen);films.push({viewport:width,...state});
  }
  await page.setViewportSize({width:390,height:900});
  await page.goto(base+'/index.html',{waitUntil:'networkidle'});
  await page.locator('.works-wheel').scrollIntoViewIfNeeded();await page.locator('.works-wheel[data-enhanced=true]').waitFor();
  await page.getByRole('button',{name:'Next project',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.works-wheel-stage').dataset.turn==='1.000');
  assert.equal(await page.locator('.works-wheel-card').count(),6);
  const images=await page.locator('.works-wheel-card img').evaluateAll(images=>images.map(i=>({src:i.src,loaded:i.complete&&i.naturalWidth>0})));
  assert.ok(images.every(i=>i.loaded&&!i.src.includes('/work-covers/')),'Flattened cover paths hydrate and load');
  assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);
 }finally{await browser.close()}
 const report={files:files.length,internalDestinations:destinations.size,routes:7,films,wheel:'hydrated and turned',failures,errors,status:'pass'};
 await fs.mkdir(path.resolve('.qa'),{recursive:true});await fs.writeFile(path.resolve('.qa/export-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(error=>{console.error(error);process.exit(1)});
