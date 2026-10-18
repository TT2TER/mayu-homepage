from html.parser import HTMLParser
from pathlib import Path
import json,subprocess,re,html,xml.etree.ElementTree as ET
class Page(HTMLParser):
 def __init__(self,html):
  super().__init__(convert_charrefs=True);self.ids=[];self.metas={};self.links={};self.papers=[];self.ld=[];self.capture=False;self.jsontext='';self.templates=0;self.feed(html)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='template':self.templates+=1
  if tag=='meta':self.metas[a.get('name') or a.get('property')]=a.get('content')
  if tag=='link' and a.get('rel')=='canonical':self.links['canonical']=a.get('href')
  if tag=='article' and a.get('class')=='publication':self.papers.append(a['id'])
  if tag=='script' and a.get('type')=='application/ld+json':self.capture=True;self.jsontext=''
 def handle_endtag(self,tag):
  if tag=='script' and self.capture:self.capture=False;self.ld.append(json.loads(self.jsontext))
 def handle_data(self,data):
  if self.capture:self.jsontext+=data
root=Path(__file__).resolve().parent.parent
source=subprocess.check_output(['git','show','v0.1:index.html'],cwd=root,text=True)
current=(root/'dist/index.html').read_text();old=Page(source);new=Page(current)
assert new.templates==0
assert new.metas['viewport'].replace(' ','')==old.metas['viewport'].replace(' ','')
assert {k:v for k,v in new.metas.items() if k!='viewport'}=={k:v for k,v in old.metas.items() if k!='viewport'}
assert new.links==old.links
assert new.ld==old.ld
assert len(new.ids)==len(set(new.ids)),new.ids
expected=[g['@id'].split('#')[1] for g in old.ld[0]['@graph'] if g['@type']=='ScholarlyArticle']
assert new.papers==expected
for name in ['robots.txt','sitemap.xml','sitemap-baidu.xml']:
 assert (root/'dist'/name).read_bytes()==subprocess.check_output(['git','show','v0.1:'+name],cwd=root)
for name in ['sitemap.xml','sitemap-baidu.xml']:
 xml=ET.parse(root/'dist'/name);assert [e.text for e in xml.iter() if e.tag.endswith('}loc')]==['https://mayu.my/']
def papers(text):
 return [re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',a))).strip() for a in re.findall(r'<article\b[^>]*>([\s\S]*?)</article>',text)]
assert papers(current)==papers(source),'Paper titles/authors/venues differ from production'
assert 'Grant Recipient' in current
assert 'src="/cdn-cgi/' not in current
assert (root/'dist/_headers').read_text().strip()=='/*\n  X-Robots-Tag: noindex, nofollow'
result={'metadataMatchesV01':True,'verificationTagsPreserved':True,'canonical':'https://mayu.my/','structuredEntities':len(new.ld[0]['@graph']),'paperAnchors':new.papers,'lightDomContent':True,'duplicateIds':False,'robotsAndSitemapsMatchV01':True,'draftNoindexHeader':True}
(root/'reports/v1-preview/seo-checks.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
