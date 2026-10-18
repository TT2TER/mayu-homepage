import {mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
execFileSync(process.execPath,[path.join(root,'design/site/build-single.mjs')],{stdio:'inherit'});
let html=await readFile(path.join(root,'design/site/index.html'),'utf8');
const seo=await readFile(path.join(root,'seo-head.html'),'utf8');
html=html.replace(/<title>[\s\S]*?<\/title>/,'').replace('</head>',()=>seo+'\n</head>');
// Scope the previously isolated academic styles while making its text available
// directly in the HTML to crawlers and browsers with scripting disabled.
function scopeCSS(css){
 css=css.replace(/\/\*[\s\S]*?\*\//g,'');
 let result='',cursor=0;
 while(cursor<css.length){
  const open=css.indexOf('{',cursor);if(open<0){if(css.slice(cursor).trim())throw Error('Unexpected CSS tail');break;}
  const header=css.slice(cursor,open).trim();let close=open+1,depth=1;
  for(;close<css.length&&depth;close++){if(css[close]==='{')depth++;else if(css[close]==='}')depth--;}
  if(depth)throw Error('Unbalanced academic CSS');
  const body=css.slice(open+1,close-1);
  if(header.startsWith('@media'))result+=header+'{'+scopeCSS(body)+'}\n';
  else{
   if(header.startsWith('@'))throw Error('Unsupported academic CSS rule '+header);
   const selectors=header.split(',').map(s=>s.trim()).map(s=>s.includes(':host')?s.replace(/:host\b/g,'#academic-content'):s==='html'?'#academic-content':'#academic-content '+s.replace(/\bmain\b/g,'.academic-sections'));
   result+=selectors.join(',')+'{'+body+'}\n';
  }
  cursor=close;
 }
 return result;
}
const template=/<template shadowrootmode="open"><style>([\s\S]*?)<\/style>([\s\S]*?)<\/template>/;
if(!template.test(html))throw Error('Academic content template missing');
html=html.replace(template,(_,css,body)=>'<style>#academic-content,#academic-content *{all:revert;box-sizing:border-box}\n'+scopeCSS(css)+'</style>'+body.replace('<main>','<div class="academic-sections">').replace('</main>','</div>'));
html=html.replace('<canvas data-photo=',()=>'<h1 class="accessible-name">Yu Ma <span lang="zh-CN">马煜</span></h1><canvas data-photo=');
html=html.replace('</head>','<style>.accessible-name{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style></head>');
if(html.includes('shadowrootmode'))throw Error('Shadow content remained in production HTML');
const dist=path.join(root,'dist');await rm(dist,{recursive:true,force:true});await mkdir(path.join(dist,'assets'),{recursive:true});
const assets={};
for(const name of ['mountain-display.avif','mountain-progressive.jpg','scene-depth.png','hero-preview.webp']){
 const bytes=await readFile(path.join(root,'design/site/assets',name));
 const ext=path.extname(name),stem=path.basename(name,ext),hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
 const target=`assets/${stem}.${hash}${ext}`;
 assets[name]={url:target,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 await writeFile(path.join(dist,target),bytes);
 html=html.replaceAll('assets/'+name,target);
}
await writeFile(path.join(root,'index.html'),html);await writeFile(path.join(dist,'index.html'),html);
for(const name of ['style.css','robots.txt','sitemap.xml','sitemap-baidu.xml','_redirects'])await copyFile(path.join(root,name),path.join(dist,name));
// Keep the published JPEG URL available for external references and old documents.
await copyFile(path.join(root,'design/site/assets/mountain-display.jpg'),path.join(dist,'assets/mountain-display.jpg'));
await copyFile(path.join(root,'design/site/assets/scene-depth.png'),path.join(dist,'assets/scene-depth.png'));
await writeFile(path.join(dist,'asset-manifest.json'),JSON.stringify(assets,null,2));
const preview=process.env.DEPLOY_TARGET==='preview';
let headers=Object.values(assets).map(a=>`/${a.url}\n  Cache-Control: public, max-age=31536000, immutable\n`).join('\n');
headers+='\n/assets/mountain-display.jpg\n  Cache-Control: public, max-age=14400, must-revalidate\n\n/assets/scene-depth.png\n  Cache-Control: public, max-age=14400, must-revalidate\n\n/\n  Cache-Control: public, max-age=0, must-revalidate\n\n/index.html\n  Cache-Control: public, max-age=0, must-revalidate\n';
if(preview){
 headers+='\n/*\n  X-Robots-Tag: noindex, nofollow\n';
 const redirects=await readFile(path.join(dist,'_redirects'),'utf8');
 await writeFile(path.join(dist,'_redirects'),redirects.replace('/index.html https://mayu.my/','/index.html /'));
}
await writeFile(path.join(dist,'_headers'),headers);
console.log(JSON.stringify({built:'dist',preview,academicContent:'light DOM',canonical:'https://mayu.my/'}));
