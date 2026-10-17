/* White foreground glyphs with a ground silhouette rendered after the rear lettering. */
(() => {
 const middle=NameStudies.drawMiddle;
 let textures;
 function prepare(){if(textures)return textures;const face=document.createElement('canvas');face.width=430;face.height=240;const fc=face.getContext('2d');fc.font='600 170px "PingFang SC", "Heiti SC", sans-serif';fc.fillStyle='#fff';fc.fillText('马煜',24,190);const ink=document.createElement('canvas');ink.width=430;ink.height=240;const ic=ink.getContext('2d');ic.drawImage(face,0,0);ic.globalCompositeOperation='source-in';ic.fillStyle='#020507';ic.fillRect(0,0,430,240);return textures={face,ink};}
 const x=470,baseline=1425,top=baseline-190;
 NameStudies.drawMiddle=function(ctx,options){const result=middle(ctx,options),t=prepare();
  if(new URLSearchParams(location.search).get('chineseShadow')!=='off'){
   ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.9;ctx.translate(x,baseline);ctx.transform(1,0,-1.3,-.68,0,0);ctx.filter='blur(2px)';ctx.drawImage(t.ink,0,-190);ctx.restore();
   ctx.save();ctx.globalAlpha=.45;ctx.translate(x,baseline);ctx.transform(1,0,-.12,-.06,0,0);ctx.filter='blur(1px)';ctx.drawImage(t.ink,0,-190);ctx.restore();
  }
  ctx.save();ctx.shadowColor='#11181ec0';ctx.shadowOffsetX=3;ctx.shadowOffsetY=3;ctx.shadowBlur=5;ctx.drawImage(t.face,x,top);ctx.restore();return result;};
})();