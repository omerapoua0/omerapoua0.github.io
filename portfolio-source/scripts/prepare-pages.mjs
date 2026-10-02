// Flat, self-contained video portfolio export for GitHub's root file uploader.
// Source assets and the earlier pages-ready export are never modified.
import { readdir, readFile, writeFile, mkdtemp, copyFile, rename, stat } from 'node:fs/promises';
import path from 'node:path';
const source=path.resolve('dist');
const destination=path.resolve('pages-ready-video');
const fileMap=new Map();
const owners=new Map();
async function inventory(directory){
  const entries=(await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name));
  for(const entry of entries){
    const from=path.join(directory,entry.name);
    if(entry.isDirectory()){await inventory(from);continue;}
    if(!entry.isFile())throw new Error(`Unsupported export entry: ${from}`);
    const relative=path.relative(source,from).split(path.sep).join('/');
    // Case-insensitive collision checks also protect Windows/macOS extraction.
    const key=entry.name.toLowerCase();
    if(owners.has(key))throw new Error(`Filename collision: ${owners.get(key)} and ${relative}`);
    owners.set(key,relative);
    fileMap.set(relative,entry.name);
  }
}
await inventory(source);
if(!fileMap.has('index.html'))throw new Error('dist/index.html is missing; build the website first.');

function rewriteText(content){
  for(const [relative,basename] of fileMap){
    if(relative===basename)continue;
    content=content.replaceAll(`/${relative}`,`/${basename}`);
    // Vite's lazy-module preload manifest uses paths without a leading slash.
    for(const quote of ['"',"'",'`']){
      content=content.replaceAll(`${quote}${relative}${quote}`,`${quote}${basename}${quote}`);
      content=content.replaceAll(`${quote}./${relative}${quote}`,`${quote}./${basename}${quote}`);
    }
  }
  return content.replaceAll('/_astro/','/').replaceAll('/studio/','/')
    // Compiled StudioScene's default assetBase must resolve models at root.
    .replace(/(['"`])\/studio\1/g,'$1$1');
}
function rewriteGltf(content,relative){
  const document=JSON.parse(content);
  for(const resource of [...(document.buffers??[]),...(document.images??[])]){
    if(!resource.uri||resource.uri.startsWith('data:'))continue;
    if(/^(?:[a-z]+:|\/\/)/i.test(resource.uri))throw new Error(`External glTF dependency: ${relative}: ${resource.uri}`);
    const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(relative),decodeURI(resource.uri)));
    const filename=fileMap.get(dependency);
    if(!filename)throw new Error(`Missing glTF dependency: ${relative}: ${resource.uri}`);
    resource.uri=filename;
  }
  return `${JSON.stringify(document,null,2)}\n`;
}

// Prepare in isolation. A failed validation cannot damage an earlier export.
const staging=await mkdtemp(path.join(path.dirname(destination),'.pages-ready-video-build-'));
for(const [relative,basename] of fileMap){
  const from=path.join(source,relative);
  const target=path.join(staging,basename);
  if(basename.endsWith('.gltf'))await writeFile(target,rewriteGltf(await readFile(from,'utf8'),relative));
  else if(/\.(html|css|js|mjs|xml|txt|json|webmanifest|svg)$/i.test(basename))await writeFile(target,rewriteText(await readFile(from,'utf8')));
  else await copyFile(from,target);
}
await writeFile(path.join(staging,'.nojekyll'),'');
let backup;
try{
  await stat(destination);
  backup=`${destination}-backup-${Date.now()}`;
  await rename(destination,backup);
}catch(error){if(error.code!=='ENOENT')throw error;}
await rename(staging,destination);
const count=new Set([...fileMap.values(),'.nojekyll']).size;
const bytes=(await Promise.all((await readdir(destination)).map(async name=>(await stat(path.join(destination,name))).size))).reduce((sum,size)=>sum+size,0);
console.log(`Prepared ${count} flat static files (${bytes} bytes) in ${destination}`);
if(backup)console.log(`Previous video export retained at ${backup}`);
