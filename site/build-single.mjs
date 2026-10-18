import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=path.dirname(fileURLToPath(import.meta.url));
const read=file=>readFile(path.join(base,file),'utf8');
let html=await read('printed-left.html');
for(const match of [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)]){
 const css=await read(match[1]);
 html=html.replace(match[0],()=>`<style>\n${css}\n</style>`);
}
const scripts=[];
for(const match of [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)]){
 let source=await read(match[1]);
 scripts.push(`<script>\n${source.replace(/<\/script/gi,'<\\/script')}\n</script>`);
 html=html.replace(match[0],'');
}
html=html.replace('</body>',()=>scripts.join('\n')+'\n</body>');
await writeFile(path.join(base,'interactive.html'),html);
await writeFile(path.join(base,'index.html'),html);
console.log('Built approved printed-left homepage with cacheable image assets and embedded styles, academic body and interaction modules.');
