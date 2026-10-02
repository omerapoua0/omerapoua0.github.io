/* Offline, reproducible stock-footage edit. No runtime tooling dependencies.
 * Obtain only the individually verified Free License clips in
 * .film-sources/sources.json. Original inputs remain private, outside public/.
 * FILM_TOOLS_DIR=/absolute/tooling/dir node scripts/edit-editorial-film.cjs
 * --inspect exports original-shot contact sheet only; --preview adds 20s edit.
 */
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const execute=promisify(execFile);
const root=path.resolve(__dirname,'..');
const inputs=path.join(root,'.film-sources');
const qa=path.join(root,'.qa/editorial');
const output=path.join(root,'public');
const tooling=process.env.FILM_TOOLS_DIR;
const ffmpeg=process.env.FFMPEG_BIN||(tooling&&require(path.join(tooling,'node_modules/ffmpeg-static')));
const ffprobe=process.env.FFPROBE_BIN||(tooling&&require(path.join(tooling,'node_modules/@ffprobe-installer/ffprobe')).path);
if(!ffmpeg||!ffprobe)throw Error('Set FILM_TOOLS_DIR or FFMPEG_BIN and FFPROBE_BIN to isolated native tools.');
const FPS=24,SHOT=5.5,DISSOLVE=.5,DURATION=20;
const run=async(args)=>{const r=await execute(ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-y',...args],{maxBuffer:8*1024*1024});return r.stderr;};
const probe=async(file)=>JSON.parse((await execute(ffprobe,['-v','error','-count_frames','-show_streams','-show_format','-of','json',file],{maxBuffer:4*1024*1024})).stdout);
const digest=async(file)=>crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
async function inspect(sources){
 const frames=[];
 for(const [i,shot]of sources.shots.entries()){
  const file=path.join(qa,`source-${i+1}-${shot.id}.jpg`);frames.push(file);
  await run(['-ss',String(shot.start+1),'-i',path.join(inputs,shot.file),'-vf','scale=480:300:force_original_aspect_ratio=decrease,pad=480:300:(ow-iw)/2:(oh-ih)/2:color=0x1a101c','-frames:v','1','-q:v','2',file]);
 }
 const args=frames.flatMap(file=>['-i',file]);
 await run([...args,'-filter_complex',`${frames.map((_,i)=>`[${i}:v]`).join('')}hstack=inputs=${frames.length}[out]`,'-map','[out]','-frames:v','1','-q:v','2',path.join(qa,'source-contact-sheet.jpg')]);
}
function normalise(width,height,shot,mobile){
 const x=mobile?(shot.mobileAnchorX??shot.anchorX):shot.anchorX;
 const y=mobile?(shot.mobileAnchorY??shot.anchorY):shot.anchorY;
 const zoom=mobile?(shot.mobileZoom??shot.zoom??1):(shot.zoom??1);
 const speed=shot.speed??1;
 const interpolate=speed<1?`,minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,tpad=stop_mode=clone:stop_duration=0.2,trim=duration=${SHOT},setpts=PTS-STARTPTS`:'';
 // Neutral charcoal grade: restrained saturation, no purple cast. Framing
 // deliberately excludes stock actors' faces rather than implying they are Omar.
 return `trim=start=${shot.start}:duration=${SHOT*speed},setpts=(PTS-STARTPTS)/${speed},scale=${Math.round(width*zoom)}:${Math.round(height*zoom)}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height}:(iw-ow)*${x}:(ih-oh)*${y},setsar=1${interpolate},fps=${FPS},format=yuv420p,settb=1/${FPS},eq=contrast=1.025:brightness=-0.012:saturation=0.88`;
}
async function encode(sources,mobile=false){
 const width=mobile?640:1280,height=800,file=path.join(output,mobile?'hero-editorial-mobile.mp4':'hero-editorial.mp4');
 const count=sources.shots.length;assert.equal(count,4,'Four photographed chapters expected.');
 const chains=sources.shots.map((shot,i)=>`[${i}:v]${normalise(width,height,shot,mobile)}[n${i}]`);
 // Retain the first half-second only to crossfade the last chapter into it.
 // Removing that opening segment makes the loop seam ordinary consecutive
 // source frames: the last return frame precedes the new opening exactly.
 chains.push('[n0]split=2[first][returnraw]');
 chains.push('[returnraw]trim=duration=0.5,setpts=PTS-STARTPTS[return]');
 let current='first';
 for(let i=1;i<count;i++){
  chains.push(`[${current}][n${i}]xfade=transition=fade:duration=${DISSOLVE}:offset=${i*(SHOT-DISSOLVE)}[cross${i}]`);current=`cross${i}`;
 }
 chains.push(`[${current}][return]xfade=transition=fade:duration=${DISSOLVE}:offset=${DURATION}[circle]`);
 chains.push(`[circle]trim=start=${DISSOLVE}:duration=${DURATION},setpts=PTS-STARTPTS,format=yuv420p[out]`);
 const args=sources.shots.flatMap(shot=>['-i',path.join(inputs,shot.file)]);
 await run([...args,'-filter_complex_threads','1','-filter_complex',chains.join(';'),'-map','[out]','-an','-r',String(FPS),'-c:v','libx264','-preset','slow','-crf',mobile?'25':'24','-maxrate',mobile?'1000k':'2100k','-bufsize',mobile?'2000k':'4200k','-pix_fmt','yuv420p','-profile:v','high','-level:v','4.0','-movflags','+faststart','-map_metadata','-1',file]);
 const meta=await probe(file),stream=meta.streams.find(s=>s.codec_type==='video'),bytes=(await fs.stat(file)).size;
 assert.equal(stream.codec_name,'h264');assert.equal(stream.pix_fmt,'yuv420p');assert.equal(stream.width,width);assert.equal(stream.height,height);
 assert.equal(Number(stream.nb_read_frames),FPS*DURATION);assert.equal(Number(meta.format.duration),DURATION);
 assert.equal(meta.streams.some(s=>s.codec_type==='audio'),false);
 assert.ok(bytes<(mobile?3:6)*1024*1024,`Video too large: ${bytes}`);
 const buffer=await fs.readFile(file);assert.ok(buffer.indexOf(Buffer.from('moov'))<buffer.indexOf(Buffer.from('mdat')),'MP4 must support progressive delivery');
 await run(['-i',file,'-map','0:v:0','-f','null','-']);
 const poster=path.join(output,mobile?'hero-editorial-poster-mobile.jpg':'hero-editorial-poster.jpg');
 await run(['-i',file,'-frames:v','1','-q:v','2',poster]);
 await run(['-i',file,'-vf',`fps=1/2.5,scale=${mobile?192:320}:${mobile?240:200}:flags=lanczos,tile=4x2`,'-frames:v','1','-q:v','2',path.join(qa,mobile?'contact-mobile.jpg':'contact-desktop.jpg')]);
 // Individual frames for composition and seam inspection at original size.
 for(const stamp of [0,5,10,15,19.958333])await run(['-ss',String(stamp),'-i',file,'-frames:v','1','-q:v','2',path.join(qa,`${mobile?'mobile':'desktop'}-${stamp}.jpg`)]);
 return {file:`/${path.basename(file)}`,poster:`/${path.basename(poster)}`,width,height,duration:DURATION,fps:FPS,frames:Number(stream.nb_read_frames),codec:stream.codec_name,pixelFormat:stream.pix_fmt,audio:false,bytes,sha256:await digest(file),fastStart:true,decode:'pass'};
}
(async()=>{
 await fs.mkdir(qa,{recursive:true});await fs.mkdir(output,{recursive:true});
 const sources=JSON.parse(await fs.readFile(path.join(inputs,'sources.json'),'utf8'));
 for(const shot of sources.shots){const meta=await probe(path.join(inputs,shot.file));const duration=Number(meta.format.duration);assert.ok(duration>=shot.start+SHOT,`${shot.id}: insufficient footage`);shot.inputSHA256=await digest(path.join(inputs,shot.file));}
 await inspect(sources);if(process.argv.includes('--inspect')){console.log(path.join(qa,'source-contact-sheet.jpg'));return;}
 const desktop=await encode(sources,false);
 if(process.argv.includes('--preview')){console.log(JSON.stringify(desktop,null,2));return;}
 const mobile=await encode(sources,true);
 const manifest={name:'Structure, practice, possibility',kind:'Edited live-action editorial stock footage',created:'2026-10-02',chapters:['Physical computing','Mathematical study','Software engineering','London and finance'],edit:{shotSeconds:SHOT,dissolveSeconds:DISSOLVE,circularReturn:true,duration:DURATION},portrayal:sources.license.portrayal,license:sources.license,sources:sources.shots.map(({file,start,anchorX,anchorY,mobileAnchorX,mobileAnchorY,...entry})=>entry),desktop,mobile};
 await fs.writeFile(path.join(output,'hero-editorial-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 await fs.writeFile(path.join(qa,'decode-report.json'),JSON.stringify({status:'pass',desktop,mobile},null,2)+'\n');
 console.log(JSON.stringify({status:'pass',desktop,mobile},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
