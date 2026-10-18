from pathlib import Path
import json,subprocess
root=Path(__file__).resolve().parent.parent;p=root/'reports/v1-preview'
d=json.loads((p/'deploy-receipt.json').read_text());url=d['deploy_url'];checks=[]
def curl(args):
 return subprocess.run(['curl','-q','--http1.1','--silent','--show-error','--retry','3','--retry-all-errors','--retry-delay','1','--max-time','40']+args,capture_output=True,check=True)
for name in ['','robots.txt','sitemap.xml','sitemap-baidu.xml','style.css','assets/mountain-display.jpg','assets/scene-depth.png','index.html']:
 file=name or 'index.html';headers=p/('live-'+file.replace('/','-')+'.headers');body=p/('live-'+file.replace('/','-'))
 r=curl(['--max-redirs','0','-D',str(headers),'-o',str(body),'-w','%{http_code}',url+'/'+name]);code=int(r.stdout);h=headers.read_text().lower()
 if name=='index.html':assert code==301 and ('location: /\n' in h or 'location: '+url.lower()+'/' in h)
 else:
  assert code==200,(name,code)
  assert body.read_bytes()==(root/'dist'/file).read_bytes(),('Content mismatch',name)
  assert 'x-robots-tag:' in h and 'noindex' in h
 checks.append(dict(path='/'+name,status=code,matchesBuild=name!='index.html',noindex='noindex' in h))
for agent in ['Googlebot','bingbot','Baiduspider','OAI-SearchBot','ChatGPT-User','GPTBot','ClaudeBot','PerplexityBot','Applebot']:
 r=curl(['--fail','-A',agent,url+'/']);assert r.stdout==(root/'dist/index.html').read_bytes();checks.append(dict(crawler=agent,sameHtml=True))
r=subprocess.run(['netlify','api','getSite','--data',json.dumps({'site_id':d['site_id']})],capture_output=True,text=True,check=True);s=json.loads(r.stdout);pub=s['published_deploy'];assert pub['id']=='6acfcfa419176816085ab3f5'
after=dict(publishedDeployId=pub['id'],commit=pub['commit_ref'],state=pub['state'],productionUnchanged=True)
(p/'production-after.json').write_text(json.dumps(after,indent=2));(p/'live-checks.json').write_text(json.dumps(dict(url=url,transport='HTTP/1.1 after HTTP/2 protocol error',checks=checks,production=after),indent=2));print(json.dumps(dict(url=url,checks=len(checks),production=after)))
