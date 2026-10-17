import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=path.dirname(fileURLToPath(import.meta.url));
const read=file=>readFile(path.join(base,file),'utf8');
let html=await read('study.html');
html=html.replace('<link rel="stylesheet" href="study.css">',`<style>${await read('study.css')}</style>`);
html=html.replace(/<script src="[^"]+" defer><\/script>/g,'');
const photo=(await readFile(path.join(base,'assets/mountain-original.jpg'))).toString('base64');
const modules=['scene-data.js','foreground-data.js','cairn-mask.js','candle-core.js','scene-core.js','market-candles.js','name-studies.js','signal-network.js','scene-depth.js','study.js'];
const scripts=[];
for(const name of modules){let text=await read(name);if(name==='study.js')text=text.replace("photo.src='assets/mountain-original.jpg'",`photo.src='data:image/jpeg;base64,${photo}'`);scripts.push(`<script>\n${text.replace(/<\/script/gi,'<\\/script')}\n</script>`);}
html=html.replace('</body>',scripts.join('\n')+'\n</body>');
await writeFile(path.join(base,'interactive.html'),html);
await writeFile(path.join(base,'index.html'),html);
console.log('Built index.html and interactive.html with embedded photograph and source modules.');
