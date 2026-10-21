from pathlib import Path
p=Path(__file__).with_name('fusion_glass.js');s=p.read_text(encoding='utf-8')
a=s.index('roles=[');b=s.index(';let lightFrame',a)
s=s[:a]+'''roles=[['route','.portbar',26,8,1.65,28],['dock','.liquid-dock',30,6,1.75,30],['library','#fileLibrary',30,20,1.6,26],['paper','main#content:not(.is-home)',29,18,1.25,15],['welcome','.welcome-port-lens',38,6,1.7,32],['selection','.dock-item.active',23,3,1.5,14],['port','.port-stop.active',20,3,1.5,18]]''' +s[b:]
a=s.index(' function field(');b=s.index('\n function roundedDistance',a)
s=s[:a]+''' function field(t=0){
  const w=innerWidth,h=innerHeight,scale=Math.min(devicePixelRatio||1,1.25),dark=document.documentElement.dataset.theme==='dark';
  if(canvas.width!==Math.round(w*scale)||canvas.height!==Math.round(h*scale)){canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale)}
  ctx.setTransform(scale,0,0,scale,0,0);const ground=ctx.createLinearGradient(0,0,w,h);ground.addColorStop(0,dark?'#1a3455':'#c6dbed');ground.addColorStop(.5,dark?'#153849':'#bbdae2');ground.addColorStop(1,dark?'#293259':'#cfceed');ctx.fillStyle=ground;ctx.fillRect(0,0,w,h);
  const glow=(x,y,r,inner)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,inner);g.addColorStop(1,dark?'#10203000':'#e6f6ff00');ctx.fillStyle=g;ctx.fillRect(0,0,w,h)};
  glow(w*.12,h*.11,w*.64,dark?'#5978bb75':'#ffffffde');glow(w*.88,h*.16,w*.5,dark?'#654d9452':'#c5aff7b0');glow(w*.8,h*.94,w*.48,dark?'#9a71612e':'#ffe0c6b8');glow(-w*.12,h*.9,w*.57,dark?'#22acb54a':'#87d4dfc7');
  const drift=Math.sin(t*.045)*7;
  // Authored geometric water ribbons. Their contour, highlight and shadow are
  // separate optical bands so refraction remains visible through the lenses.
  const ribbon=(offset,weight,alpha)=>{
   ctx.save();ctx.globalAlpha=alpha;ctx.translate(0,offset+drift);const path=new Path2D();path.moveTo(-w*.15,h*1.03);path.bezierCurveTo(w*.06,h*.08,w*.55,h*1.12,w*1.1,-h*.1);
   const ink=ctx.createLinearGradient(0,h,w,0);ink.addColorStop(0,dark?'#0e4967':'#80bfd5');ink.addColorStop(.35,dark?'#446086':'#bedbe8');ink.addColorStop(.7,dark?'#505080':'#b5b2de');ink.addColorStop(1,dark?'#7a709f':'#dbc9f1');
   ctx.lineCap='round';ctx.strokeStyle=ink;ctx.lineWidth=weight;ctx.shadowColor=dark?'#041a38a8':'#627d9c5c';ctx.shadowBlur=40;ctx.shadowOffsetY=24;ctx.stroke(path);ctx.shadowBlur=0;ctx.shadowOffsetY=0;
   ctx.translate(0,-weight*.42);ctx.strokeStyle=dark?'#b2efff28':'#ffffff85';ctx.lineWidth=3;ctx.stroke(path);
   ctx.translate(0,weight*.86);ctx.strokeStyle=dark?'#010e2a50':'#397b9b31';ctx.lineWidth=2;ctx.stroke(path);ctx.restore();
  };
  ribbon(-h*.21,Math.max(90,w*.14),.44);ribbon(h*.17,Math.max(150,w*.21),.58);
  // Light is broad enough to keep text calm, with a crisp far-field meniscus.
  ctx.save();ctx.globalAlpha=dark?.22:.45;ctx.translate(w*.89,h*.88);ctx.rotate(-.5);const sheen=ctx.createLinearGradient(0,-h*.24,0,h*.18);sheen.addColorStop(0,'#ffffff00');sheen.addColorStop(.42,dark?'#c3eeff00':'#ffffff00');sheen.addColorStop(.5,dark?'#b9d6ff':'#ffffff');sheen.addColorStop(.56,dark?'#6bb6db00':'#a0cfe81c');sheen.addColorStop(1,'#ffffff00');ctx.fillStyle=sheen;ctx.beginPath();ctx.ellipse(0,0,w*.52,h*.2,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
''' +s[b:]
s=s.replace("time-lastPaint>60","time-lastPaint>125")
s=s.replace("['.sidebar','.portbar','.footer-actions']","['.liquid-library','.portbar','.liquid-dock','#content']")
s=s.replace("e.target.closest('.sidebar,.portbar,.footer-actions')","e.target.closest('.liquid-library,.portbar,.liquid-dock,.welcome-port-lens')")
s=s.replace("e.target.closest('.port-stop,.nav.active')","e.target.closest('.port-stop,.dock-item,.nav.active')")
p.write_text(s,encoding='utf-8')
print('Replaced optical stage and refractive roles for the complete reset')
