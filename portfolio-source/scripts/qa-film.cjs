/* Isolated development QA. No personal profile, account access or external writes.
 * Editorial hero: one MP4 source selected once, before first load. No WebM.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const base=process.env.PORTFOLIO_QA_URL||'http://127.0.0.1:4174';
const directory=path.resolve('.qa');
const expected=width=>({src:width<=720?'/hero-editorial-mobile.mp4':'/hero-editorial.mp4',poster:width<=720?'/hero-editorial-poster-mobile.jpg':'/hero-editorial-poster.jpg',width:width<=720?640:1280,height:800});
const mediaPattern=/\/hero-editorial(?:-mobile)?\.mp4(?:[?#]|$)/;
const readVideo=page=>page.locator('[data-hero-video]').evaluate(v=>({time:v.currentTime,width:v.videoWidth,height:v.videoHeight,src:v.currentSrc,duration:v.duration,paused:v.paused,poster:v.poster,attributeSrc:v.getAttribute('src'),sources:[...v.querySelectorAll('source')].map(s=>({src:s.getAttribute('src'),type:s.type})),mp4:v.dataset.mp4,mobile:v.dataset.mobile,webm:v.dataset.webm}));
function assertAssetChoice(state,width){
 const e=expected(width);
 assert.equal(new URL(state.src).pathname,e.src,'Viewport-specific MP4');
 assert.equal(new URL(state.poster).pathname,e.poster,'Viewport-specific poster');
 assert.equal(state.width,e.width);assert.equal(state.height,e.height);
 assert.ok(Math.abs(state.duration-20)<.3,'Expected 20-second editorial film');
 assert.equal(state.sources.length,1,'Exactly one source, not sequential codec fallbacks');
 assert.equal(state.sources[0].type,'video/mp4');assert.equal(new URL(state.sources[0].src,base).pathname,e.src);
 assert.equal(state.mp4,'/hero-editorial.mp4');assert.equal(state.mobile,'/hero-editorial-mobile.mp4');
 assert.ok(!state.webm,'No obsolete WebM dataset');
}
async function playing(page){await page.waitForFunction(()=>{const v=document.querySelector('[data-hero-video]');return v.readyState>=2&&!v.paused&&v.currentTime>.1})}
(async()=>{
 await fs.mkdir(directory,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const results=[];
 try{
  for(const width of [320,390,720,721,768,1440]){
   const context=await browser.newContext({viewport:{width,height:900}});
   try{
    const page=await context.newPage(),errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(mediaPattern.test(r.url()))requests.push(new URL(r.url()).pathname)});
    await page.goto(base+'/index.html',{waitUntil:'networkidle'});await playing(page);
    const before=(await readVideo(page)).time;await page.waitForTimeout(500);
    const state=await readVideo(page);assertAssetChoice(state,width);
    assert.ok(state.time>before,'Decoded video advances');
    assert.deepEqual([...new Set(requests)],[expected(width).src],'Only chosen viewport film downloaded');
    await page.getByRole('button',{name:'Pause hero video'}).click();
    const paused=(await readVideo(page)).time;await page.waitForTimeout(500);
    assert.ok((await readVideo(page)).paused);assert.ok(Math.abs((await readVideo(page)).time-paused)<.05);
    await page.screenshot({path:path.join(directory,'film-home-'+width+'.png')});
    await page.locator('#selected').scrollIntoViewIfNeeded();await page.waitForTimeout(300);
    await page.locator('[data-film-hero]').scrollIntoViewIfNeeded();await page.waitForTimeout(300);
    assert.ok((await readVideo(page)).paused,'Explicit pause survives re-entry');
    await page.getByRole('button',{name:'Play hero video'}).click();await playing(page);
    await page.locator('.nocturne-evidence').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('[data-hero-video]').paused);
    await page.locator('[data-film-hero]').scrollIntoViewIfNeeded();await playing(page);
    assert.equal(await page.locator('.studio-hero,.studio-viewport,.hero-experience').count(),0,'Old heroes never overlap');
    assert.deepEqual(errors,[]);
    results.push({case:'playback-pause-offscreen-'+width,status:'pass',...state});
   }finally{await context.close()}
  }
  for(const mode of ['reduced','save-data','no-js','autoplay-denied','media-unavailable']){
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});
   try{
    if(mode==='save-data')await context.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true}));
    if(mode==='autoplay-denied')await context.addInitScript(()=>{HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('Autoplay blocked','NotAllowedError'))});
    const page=await context.newPage(),mediaRequests=[],errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(mediaPattern.test(r.url()))mediaRequests.push(r.url())});
    if(mode==='media-unavailable')await page.route(mediaPattern,route=>route.abort('failed'));
    await page.goto(base+'/index.html',{waitUntil:'networkidle'});await page.waitForTimeout(700);
    if(mode==='media-unavailable')await page.waitForFunction(()=>document.querySelector('[data-film-hero]').dataset.filmError==='true');
    const data=await readVideo(page);
    if(['reduced','save-data','no-js'].includes(mode)){
     assert.ok(data.paused);assert.equal(mediaRequests.length,0,mode+': never automatically download film');
     assert.equal(data.src,'');assert.ok(!data.attributeSrc);assert.deepEqual(data.sources,[]);
     assert.notEqual(await page.locator('[data-film-hero]').getAttribute('data-film-error'),'true','Unloaded film must not raise false error');
    }
    if(['autoplay-denied','media-unavailable'].includes(mode)){
     assert.ok(data.paused);assert.equal(data.sources.length,1);assert.equal(data.sources[0].type,'video/mp4');
     assert.ok(mediaRequests.every(url=>new URL(url).pathname===expected(390).src));
    }
    if(mode==='media-unavailable'){
     assert.equal(await page.locator('[data-film-hero]').getAttribute('data-film-error'),'true');
     assert.ok(await page.locator('[data-film-toggle]').isHidden());
    }
    if(mode==='autoplay-denied'){
     assert.ok(await page.getByRole('button',{name:'Play hero video'}).isVisible());
     assert.ok(await page.getByRole('link',{name:'Start a conversation'}).isVisible());
     assert.notEqual(await page.locator('[data-film-hero]').getAttribute('data-film-error'),'true','Denied autoplay is not a broken file');
     await page.getByRole('button',{name:'Play hero video'}).click();
     assert.match(await page.locator('[data-film-status]').innerText(),/unavailable|explore/i,'Explicit denied play has honest status');
    }
    // With JS off, the desktop poster is a valid static default. No viewport script can run.
    if(mode==='no-js'){
     assert.ok(['/hero-editorial-poster.jpg','/hero-editorial-poster-mobile.jpg'].includes(new URL(data.poster).pathname));
     assert.ok(await page.locator('[data-film-toggle]').isHidden());
    }else assert.equal(new URL(data.poster).pathname,expected(390).poster);
    assert.equal((await page.request.get(data.poster)).status(),200);
    assert.ok(await page.getByRole('link',{name:'Explore the work',exact:true}).first().isVisible());
    await page.screenshot({path:path.join(directory,'film-fallback-'+mode+'.png')});
    if(['reduced','save-data'].includes(mode)){
     await page.getByRole('button',{name:'Play hero video'}).click();await playing(page);
     assertAssetChoice(await readVideo(page),390);
    }
    assert.deepEqual(errors,[]);results.push({case:mode,status:'pass',...data});
   }finally{await context.close()}
  }
 }finally{await browser.close()}
 await fs.writeFile(path.join(directory,'film-report.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({filmChecks:results.length,status:'pass',report:path.join(directory,'film-report.json')}));
})().catch(error=>{console.error(error);process.exit(1)});
