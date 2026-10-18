// Local, compressed HTTP fixtures for repeatable before/after browser checks.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),port=Number(process.env.PERF_PORT||4179);
const roots={baseline:path.join(root,'reports/performance-20261019/baseline'),candidate:path.join(root,'dist')};
const types={'.html':'text/html; charset=utf-8','.avif':'image/avif','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.css':'text/css','.xml':'application/xml','.txt':'text/plain','.json':'application/json'};
http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),parts=decodeURIComponent(url.pathname).split('/').filter(Boolean),mode=parts.shift(),base=roots[mode];
  if(!base){res.writeHead(404).end();return;}
  const file=path.resolve(base,parts.join('/')||'index.html');
  if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  const ext=path.extname(file);let bytes=fs.readFileSync(file);
  res.setHeader('Content-Type',types[ext]||'application/octet-stream');
  res.setHeader('Cache-Control',ext==='.html'?'public, max-age=0, must-revalidate':mode==='candidate'?'public, max-age=31536000, immutable':'public, max-age=14400, must-revalidate');
  if(ext==='.html'&&req.headers['accept-encoding']?.includes('gzip')){bytes=zlib.gzipSync(bytes);res.setHeader('Content-Encoding','gzip');res.setHeader('Vary','Accept-Encoding');}
  res.setHeader('Content-Length',bytes.length);res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);
 }catch{res.writeHead(500).end();}
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
