/* Small Chinese name standing on the same rocky foreground plane. */
(() => {
 const original=NameStudies.drawMiddle,shadow=NameStudies.drawGroundShadow;
 const layer=document.createElement('canvas');layer.width=220;layer.height=100;
 const c=layer.getContext('2d');c.font='600 44px "PingFang SC", "Heiti SC", sans-serif';c.fillStyle='#fff';c.fillText('马煜',18,60);
 const ink=document.createElement('canvas');ink.width=220;ink.height=100;const ic=ink.getContext('2d');ic.drawImage(layer,0,0);ic.globalCompositeOperation='source-in';ic.fillStyle='#020507';ic.fillRect(0,0,220,100);
 const x=145,y=1380;
 NameStudies.drawGroundShadow=function(ctx,options){const result=shadow(ctx,options);ctx.save();ctx.globalAlpha=.75;ctx.globalCompositeOperation='multiply';ctx.translate(x,y+61);ctx.transform(1,0,-.55,-.31,0,0);ctx.filter='blur(1.2px)';ctx.drawImage(ink,0,-61);ctx.restore();return result;};
 NameStudies.drawMiddle=function(ctx,options){const result=original(ctx,options);ctx.save();ctx.drawImage(layer,x,y);ctx.restore();return result;};
})();