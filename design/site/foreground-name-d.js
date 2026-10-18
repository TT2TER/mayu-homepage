/* Foreground ivory glyphs with a projected silhouette on the rocky ground. */
(() => {
 const middle=NameStudies.drawMiddle,ground=NameStudies.drawGroundShadow;
 const layer=document.createElement('canvas');layer.width=430;layer.height=240;
 const c=layer.getContext('2d');c.font='600 170px "PingFang SC", "Heiti SC", sans-serif';c.fillStyle='#f5f0df';c.fillText('马煜',24,190);
 const ink=document.createElement('canvas');ink.width=430;ink.height=240;const ic=ink.getContext('2d');ic.drawImage(layer,0,0);ic.globalCompositeOperation='source-in';ic.fillStyle='#020507';ic.fillRect(0,0,430,240);
 const x=470,baseline=1380,top=baseline-190;
 NameStudies.drawGroundShadow=function(ctx,options){const result=ground(ctx,options);ctx.save();ctx.globalCompositeOperation='multiply';ctx.translate(x,baseline);ctx.transform(1,0,-.55,-.31,0,0);ctx.globalAlpha=.88;ctx.filter='blur(2px)';ctx.drawImage(ink,0,-190);ctx.restore();return result;};
 NameStudies.drawMiddle=function(ctx,options){const result=middle(ctx,options);ctx.save();ctx.shadowColor='#101314dd';ctx.shadowOffsetX=5;ctx.shadowOffsetY=6;ctx.shadowBlur=9;ctx.drawImage(layer,x,top);ctx.restore();return result;};
})();