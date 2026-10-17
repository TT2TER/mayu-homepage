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
const photo=(await readFile(path.join(base,'assets/mountain-original.jpg'))).toString('base64');
const scripts=[];
for(const match of [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)]){
 let source=await read(match[1]);
 source=source.replace("photo.src='assets/mountain-original.jpg'",()=>`photo.src='data:image/jpeg;base64,${photo}'`);
 scripts.push(`<script>\n${source.replace(/<\/script/gi,'<\\/script')}\n</script>`);
 html=html.replace(match[0],'');
}
html=html.replace('</body>',()=>scripts.join('\n')+'\n</body>');
await writeFile(path.join(base,'interactive.html'),html);
await writeFile(path.join(base,'index.html'),html);
console.log('Built approved printed-left homepage with embedded photograph, styles, academic body and interaction modules.');
