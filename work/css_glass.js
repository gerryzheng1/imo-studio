// CSS glass material is in yzrt_material.css. One bounded, static Canvas paints
// the local backdrop; motion is compositor-only and never redraws it every frame.
const StudioGlass=(()=>{
 'use strict';
 const canvas=document.createElement('canvas');canvas.id='studioGlassBackdrop';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
 const ctx=canvas.getContext('2d',{alpha:false}),systemMotion=matchMedia('(prefers-reduced-motion: reduce)'),systemTransparency=matchMedia('(prefers-reduced-transparency: reduce)');
 let paintFrame=0,paintCount=0,lastKey='',effectiveMotion=false,effectiveTransparency=false;
 const root=()=>document.documentElement;
 function field(){
  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight),scale=Math.min(devicePixelRatio||1,1.25,Math.sqrt(2000000/(w*h))),dark=root().dataset.theme==='dark',style=root().dataset.backgroundStyle||'ocean';
  const width=Math.max(1,Math.floor(w*scale)),height=Math.max(1,Math.floor(h*scale)),key=[width,height,dark,style].join('|');if(key===lastKey)return;lastKey=key;paintCount++;
  canvas.width=width;canvas.height=height;ctx.setTransform(width/w,0,0,height/h,0,0);
  if(style==='plain'){ctx.fillStyle=dark?'#17283b':'#edf3f8';ctx.fillRect(0,0,w,h);return}
  const aurora=style==='aurora',ground=ctx.createLinearGradient(0,0,w,h);
  const palette=aurora?(dark?['#2d2c50','#204d50','#4c304b']:['#e6d3ed','#c4e4df','#ecd1cd']):(dark?['#1a3455','#153849','#293259']:['#c6dbed','#bbdae2','#cfceed']);
  palette.forEach((color,i)=>ground.addColorStop(i/2,color));ctx.fillStyle=ground;ctx.fillRect(0,0,w,h);
  const glow=(x,y,r,inner)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,inner);g.addColorStop(1,dark?'#10203000':'#e6f6ff00');ctx.fillStyle=g;ctx.fillRect(0,0,w,h)};
  glow(w*.12,h*.11,w*.64,dark?'#5978bb75':'#ffffffde');glow(w*.88,h*.16,w*.5,aurora?(dark?'#ad7a9959':'#f4bcdd96'):(dark?'#654d9452':'#c5aff7b0'));glow(w*.8,h*.94,w*.48,dark?'#9a71612e':'#ffe0c6b8');glow(-w*.12,h*.9,w*.57,aurora?(dark?'#2691805c':'#8dcfc2c7'):(dark?'#22acb54a':'#87d4dfc7'));
  const ribbon=(offset,weight,alpha)=>{ctx.save();ctx.globalAlpha=alpha;ctx.translate(0,offset);const path=new Path2D();path.moveTo(-w*.15,h*1.03);path.bezierCurveTo(w*.06,h*.08,w*.55,h*1.12,w*1.1,-h*.1);const ink=ctx.createLinearGradient(0,h,w,0);const colors=aurora?(dark?['#1e5661','#4a5e77','#825e79','#9a7994']:['#a4cccb','#c8d9e6','#d4b8d2','#edcadb']):(dark?['#0e4967','#446086','#505080','#7a709f']:['#80bfd5','#bedbe8','#b5b2de','#dbc9f1']);colors.forEach((c,i)=>ink.addColorStop(i/3,c));ctx.lineCap='round';ctx.strokeStyle=ink;ctx.lineWidth=weight;ctx.shadowColor=dark?'#041a38a8':'#627d9c5c';ctx.shadowBlur=40;ctx.shadowOffsetY=24;ctx.stroke(path);ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.translate(0,-weight*.42);ctx.strokeStyle=dark?'#b2efff28':'#ffffff85';ctx.lineWidth=3;ctx.stroke(path);ctx.translate(0,weight*.86);ctx.strokeStyle=dark?'#010e2a50':'#397b9b31';ctx.lineWidth=2;ctx.stroke(path);ctx.restore()};
  ribbon(-h*.21,Math.max(90,w*.14),.44);ribbon(h*.17,Math.max(150,w*.21),.58);
  ctx.save();ctx.globalAlpha=dark?.22:.45;ctx.translate(w*.89,h*.88);ctx.rotate(-.5);const sheen=ctx.createLinearGradient(0,-h*.24,0,h*.18);sheen.addColorStop(0,'#ffffff00');sheen.addColorStop(.42,'#ffffff00');sheen.addColorStop(.5,dark?'#b9d6ff':'#ffffff');sheen.addColorStop(.56,dark?'#6bb6db00':'#a0cfe81c');sheen.addColorStop(1,'#ffffff00');ctx.fillStyle=sheen;ctx.beginPath();ctx.ellipse(0,0,w*.52,h*.2,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 function schedule(){if(paintFrame)return;paintFrame=requestAnimationFrame(()=>{paintFrame=0;field()})}
 function refreshPreferences(){
  effectiveTransparency=systemTransparency.matches||root().dataset.glassStyle==='clear';
  effectiveMotion=systemMotion.matches||root().dataset.motion==='reduced'||effectiveTransparency||root().dataset.backgroundStyle==='plain';
  root().dataset.effectsMotion=effectiveMotion?'reduced':'full';root().dataset.effectsTransparency=effectiveTransparency?'reduced':'full';canvas.style.animationPlayState=document.hidden?'paused':'running';schedule();
 }
 new MutationObserver(refreshPreferences).observe(root(),{attributes:true,attributeFilter:['data-theme','data-glass-style','data-background-style','data-corner-style','data-motion']});
 addEventListener('resize',schedule,{passive:true});document.addEventListener('visibilitychange',refreshPreferences);systemMotion.addEventListener('change',refreshPreferences);systemTransparency.addEventListener('change',refreshPreferences);
 document.addEventListener('pointermove',e=>{if(effectiveTransparency)return;const el=e.target.closest('.liquid-library,.portbar,.liquid-dock,.welcome-port-lens');if(!el)return;const r=el.getBoundingClientRect();if(!r.width||!r.height)return;el.style.setProperty('--glass-x',(e.clientX-r.left)/r.width*100+'%');el.style.setProperty('--glass-y',(e.clientY-r.top)/r.height*100+'%')},{passive:true});
 document.addEventListener('pointerdown',e=>{const el=e.target.closest('.port-stop,.dock-item,.nav.active');if(el)el.classList.add('glass-pressed')},{passive:true});
 const release=()=>document.querySelectorAll('.glass-pressed').forEach(el=>el.classList.remove('glass-pressed'));document.addEventListener('pointerup',release,{passive:true});document.addEventListener('pointercancel',release,{passive:true});addEventListener('blur',release);
 refreshPreferences();const ready=IMOApp.ready;IMOApp.ready=Promise.resolve(ready).then(()=>{refreshPreferences();field();return true});
 return {field,schedule,sync:refreshPreferences,refreshPreferences,get filters(){return 0},get reducedMotion(){return effectiveMotion},get status(){return {renderer:'css',paintCount,pixelCount:canvas.width*canvas.height,reducedMotion:effectiveMotion,reducedTransparency:effectiveTransparency,background:root().dataset.backgroundStyle||'ocean'}}};
})();
globalThis.StudioGlass=StudioGlass;
