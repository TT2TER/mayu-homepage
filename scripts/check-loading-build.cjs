const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8'),headers=fs.readFileSync(path.join(dist,'_headers'),'utf8'),assets=JSON.parse(fs.readFileSync(path.join(dist,'asset-manifest.json'),'utf8'));
for(const [name,asset] of Object.entries(assets)){
 const bytes=fs.readFileSync(path.join(dist,asset.url)),hash=createHash('sha256').update(bytes).digest('hex');
 assert.equal(hash,asset.sha256,name);assert.equal(bytes.length,asset.bytes,name);assert.ok(asset.url.includes(hash.slice(0,12)),name);
 assert.ok(html.includes(asset.url),name);assert.ok(headers.includes('/'+asset.url+'\n  Cache-Control: public, max-age=31536000, immutable'),name);
}
assert.ok(headers.includes('/\n  Cache-Control: public, max-age=0, must-revalidate'));
assert.ok(headers.includes('/index.html\n  Cache-Control: public, max-age=0, must-revalidate'));
assert.ok(!html.includes('preload" as="image" href="assets/mountain-display.jpg'));
assert.equal((html.match(/type="image\/avif"/g)||[]).length,2,'AVIF source and preload agree');
assert.ok(fs.existsSync(path.join(dist,'assets/mountain-display.jpg')));assert.ok(fs.existsSync(path.join(dist,'assets/scene-depth.png')));
console.log(JSON.stringify({passed:true,hashedAssets:Object.keys(assets).length,htmlRevalidates:true,legacyURLsRetained:true}));
