/* Isolated developer QA. No personal profile or external enquiry submission.
 * Normal film playback belongs to a separate check; this suite uses reduced motion. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const base=process.env.PORTFOLIO_QA_URL||'http://127.0.0.1:4322';
const origin=new URL(base).origin,output=path.resolve('.qa');
const routes=['index','work','automations','research','cv','tutoring','contact'];
const results=[],outbound=[];
async function check(name,run){try{await run();results.push({name,status:'pass'})}catch(e){results.push({name,status:'fail',message:e.message});console.error(name,e.message)}}
async function isolated(browser,options={}){
 const context=await browser.newContext({reducedMotion:'reduce',...options});
 await context.route('**/*',route=>{const r=route.request();if(new URL(r.url()).origin!==origin||!['GET','HEAD'].includes(r.method())){outbound.push({url:r.url(),method:r.method()});return route.abort()}return route.continue()});return context;
}
async function setTheme(context,value){await context.addInitScript(value=>localStorage.setItem('omar-theme',value),value)}
async function inspect(page,route,width,colour){
 const errors=[],http=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)http.push(r.status()+' '+r.url())});
 assert.equal((await page.goto(base+'/'+route+'.html',{waitUntil:'networkidle'})).status(),200);
 await page.evaluate(async()=>{await Promise.all([...document.images].map(async i=>{i.loading='eager';try{await i.decode()}catch{}}))});
 const s=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,theme:document.documentElement.dataset.theme,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}));
 assert.equal(s.h1,1,'One H1');assert.ok(s.doc<=s.width+1,'Overflow '+s.doc+' at '+width);assert.equal(s.theme,colour);
 assert.deepEqual(s.broken,[],'Broken images');assert.deepEqual(errors,[],'Page errors');assert.deepEqual(http,[],'HTTP failures');
 assert.equal(await page.locator('.studio,[data-studio],.studio-experience').count(),0,'Old studio absent');
 if(route==='index'){
  const v=await page.locator('[data-hero-video]').evaluate(v=>({paused:v.paused,current:v.currentSrc,src:v.getAttribute('src'),sources:[...v.querySelectorAll('source')].map(s=>s.getAttribute('src')),poster:v.poster}));
  assert.ok(v.paused,'Reduced film paused');assert.equal(v.current,'','Reduced film not fetched');assert.ok(!v.src&&v.sources.every(s=>!s),'No active video source');
  assert.equal((await page.request.get(v.poster)).status(),200,'Poster exists');
  if(width>720){
   const covers=await page.locator('.works-wheel-list-card>img').evaluateAll(es=>es.map(e=>({w:e.clientWidth,h:e.clientHeight})));
   assert.ok(covers.every(r=>Math.abs(r.w/r.h-1000/690)<.025),'Fallback covers retain 1000:690 aspect ratio');
  }
 }
 if(width===1440&&['index','tutoring'].includes(route)){
  await page.screenshot({path:path.join(output,route+'-desktop-'+colour+'.png'),fullPage:true});
  await page.screenshot({path:path.join(output,route+'-viewport-'+colour+'.png')});
 }
}
async function menuCheck(page){
 await page.goto(base+'/index.html',{waitUntil:'networkidle'});
 const menu=page.locator('.menu-toggle'),nav=page.getByRole('navigation',{name:'Main navigation'});
 assert.equal(await menu.getAttribute('aria-expanded'),'false');assert.equal(await nav.isVisible(),false);
 await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');assert.ok(await nav.isVisible());
 await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');assert.ok(await menu.evaluate(e=>document.activeElement===e),'Escape returns focus');
 await menu.click();await nav.locator('a[href="/work.html"]').click();await page.waitForURL('**/work.html');
 assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false','Link closes menu');
}
async function formCheck(page,kind,colour){
 await page.goto(base+'/'+kind+'.html',{waitUntil:'networkidle'});
 const next=page.locator('[data-next]'),status=page.locator('[data-status]');
 await next.click();assert.match(await status.innerText(),/Choose an option/);
 if(kind==='tutoring'){
  await page.locator('input[value="Maths"]').check();await next.click();await next.click();assert.match(await status.innerText(),/Choose an option/);
  await page.locator('input[value="GCSE Higher"]').check();await next.click();await next.click();assert.match(await status.innerText(),/required field/);
  await page.locator('[name=goal]').selectOption({label:'Prepare for exams'});await page.locator('[name=days]').selectOption({label:'Flexible'});await page.locator('[name=time]').selectOption({label:'Evening'});await next.click();
  await page.locator('[name=relationship]').selectOption({label:'A parent or guardian'});
 }else{await page.locator('input[value="Project"]').check();await next.click();await page.locator('[name=message]').fill('Local test draft. Nothing is submitted.')}
 await page.locator('[name=name]').fill('QA Visitor');await page.locator('[name=email]').fill('bad');await next.click();assert.match(await status.innerText(),/valid email/);
 await page.locator('[name=email]').fill('qa@example.com');await next.click();
 const review=page.locator('[data-review]');assert.ok(await review.isVisible());
 const draft=await page.locator('[data-draft]').inputValue();assert.match(draft,/QA Visitor/);assert.match(draft,/qa@example.com/);assert.match(draft,kind==='tutoring'?/GCSE Higher/:/Local test draft/);
 const href=await page.locator('[data-email]').getAttribute('href');assert.ok(href.startsWith('mailto:omerapoua0@gmail.com?'));assert.match(decodeURIComponent(href),/QA Visitor/);assert.match(await review.innerText(),/Nothing has been sent/);
 const buttons=await review.locator('.form-actions').evaluate(e=>[...e.children].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})));
 assert.ok(buttons.every(b=>b.w>250&&b.h>=48),'Mobile review controls full width and 48px high');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Review overflow');
 await review.screenshot({path:path.join(output,kind+'-review-mobile-'+colour+'.png')});
 await page.locator('[data-edit]').click();assert.ok(await page.locator(kind==='tutoring'?'input[value="Maths"]':'input[value="Project"]').isChecked());assert.equal(await page.locator('[name=name]').inputValue(),'QA Visitor','Edit preserves detail');
 // Never activate mailto or clipboard controls. Inspect prepared data only.
}
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  for(const colour of ['dark','light'])for(const width of [320,390,768,1440]){
   const context=await isolated(browser,{viewport:{width,height:900}});await setTheme(context,colour);
   for(const route of routes){const page=await context.newPage();await check(route+' '+width+' '+colour,()=>inspect(page,route,width,colour));await page.close()}
   if(width<1060){const page=await context.newPage();await check('menu '+width+' '+colour,()=>menuCheck(page));await page.close()}await context.close();
  }
  const nojs=await isolated(browser,{viewport:{width:390,height:844},javaScriptEnabled:false});
  for(const route of routes){const page=await nojs.newPage();await check(route+' no-js',async()=>{
   assert.equal((await page.goto(base+'/'+route+'.html')).status(),200);
   const nav=page.getByRole('navigation',{name:'Main navigation'});assert.ok(await nav.isVisible());assert.ok(await nav.locator('a[href="/work.html"]').isVisible(),'No-JS projects reachable');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No-JS overflow');
   if(['contact','tutoring'].includes(route))assert.ok(await page.locator('noscript a[href="mailto:omerapoua0@gmail.com"]').isVisible(),'Email fallback');
   if(route==='index')assert.equal(await page.locator('[data-hero-video] source[src]').count(),0);
  });await page.close()}await nojs.close();
  for(const colour of ['dark','light']){
   const context=await isolated(browser,{viewport:{width:390,height:844}});await setTheme(context,colour);
   for(const kind of ['tutoring','contact']){const page=await context.newPage();await check(kind+' review/edit '+colour,()=>formCheck(page,kind,colour));await page.close()}
   const page=await context.newPage();await check('theme toggle '+colour,async()=>{
    await page.goto(base+'/tutoring.html',{waitUntil:'networkidle'});await page.locator('.theme-toggle').click();
    const expected=colour==='dark'?'light':'dark';assert.equal(await page.locator('html').getAttribute('data-theme'),expected);assert.equal(await page.evaluate(()=>localStorage.getItem('omar-theme')),expected);
   });await context.close();
  }
  await check('No external requests or submissions',async()=>assert.deepEqual(outbound,[]));
 }finally{await browser.close()}
 const report={base,results,passed:results.filter(r=>r.status==='pass').length,failed:results.filter(r=>r.status==='fail').length,outbound,normalHeroPlayback:'Separate root check',noExternalSubmission:true};
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({checks:results.length,passed:report.passed,failed:report.failed,screenshots:output}));if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
