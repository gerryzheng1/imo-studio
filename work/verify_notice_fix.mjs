import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const passed=[],errors=[],external=[];
const fixture=JSON.parse(await fs.readFile('work/baseline-state.json','utf8'));
for(const channel of (process.env.IMO_BROWSERS||'chrome,msedge').split(',')){
 const browser=await chromium.launch({...(channel==='chromium'?{}:{channel}),headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await p.context().setOffline(true);p.on('pageerror',e=>errors.push(channel+': '+e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url())});
  await p.goto(pathToFileURL(path.resolve('outputs/IMO_Generator.html')).href);await p.evaluate(()=>IMOApp.ready);
  await p.evaluate(async s=>{const b=blankState();IMOApp.setState({...b,...s,preferences:{...b.preferences,...s.preferences},multiport:b.multiport});uiSettings.leaveWarn=false;uiSettings.afterGenerateSave=false;await MultiPort.create([],{includeCurrent:true});currentView='check';render()},fixture);
  for(const [name,width,height,theme] of [['desktop',1440,900,'light'],['mobile',390,844,'light'],['short',844,390,'light'],['dark',1280,800,'dark']]){
   await p.setViewportSize({width,height});const bounds=await p.evaluate(theme=>{closeModal();uiSettings.theme=theme;applyUISettings();toast('已恢复工程：20261021_093849_064_Shanghai.imoproject.json');const r=$('.toast').getBoundingClientRect(),c=getComputedStyle($('.toast'));return {width:r.width,height:r.height,x:r.x,y:r.y,bottom:r.bottom,topInset:c.top,viewport:innerHeight}},theme);
   assert.ok(bounds.height>=40&&bounds.height<=90,name+': compact notification');assert.ok(bounds.x>=8&&bounds.y>=8&&bounds.bottom<height,name+': notice within viewport');assert.ok(bounds.width<=Math.min(420,width-24));await p.locator('.toast-dismiss').click();assert.equal(await p.locator('.toast').count(),0);
   passed.push(channel+': '+name+' notice has content-sized height and a working close control');
   await p.locator('.footer [data-action=wsMore]').click();
   const layout=await p.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}},d=$('.dialog'),a=d.querySelector(':scope>.actions'),body=d.querySelector('.dialog-body');return {dialog:rect(d),actions:rect(a),body:rect(body),buttons:[...a.children].map(rect),background:getComputedStyle(a).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth}});
   assert.ok(layout.body.bottom<=layout.actions.top+1,name+': separate content/footer');assert.ok(layout.actions.bottom<=layout.dialog.bottom-8,name+': inset footer');assert.equal(layout.background,'rgba(0, 0, 0, 0)');assert.equal(layout.overflow,false);for(const b of layout.buttons){assert.ok(b.left>=layout.actions.left&&b.right<=layout.actions.right+1);assert.ok(b.bottom<=layout.actions.bottom+1)}
   await p.locator('#modalRoot .actions [data-action=closeModal]').click();assert.equal(await p.locator('.dialog').count(),0);assert.equal(await p.locator('.footer [data-action=wsMore]').evaluate(e=>e===document.activeElement),true);passed.push(channel+': '+name+' project actions stay inset without an opaque overlapping footer and restore focus');
  }
  await p.setViewportSize({width:390,height:480});await p.evaluate(()=>modal('长内容及换行检查',Array.from({length:35},(_,i)=>'<p>第 '+(i+1)+' 项资料需要核对。</p>').join(''),'<button data-action="closeModal">继续填写</button><button data-action="closeModal">另存为独立工程备份</button><button class="primary" data-action="closeModal">核对后下载本份 XLSX</button>'));
  const long=await p.evaluate(()=>{const d=$('.dialog'),b=d.querySelector('.dialog-body'),a=d.querySelector(':scope>.actions'),r=e=>{const s=e.getBoundingClientRect();return {top:s.top,bottom:s.bottom,left:s.left,right:s.right}},before=r(a);b.scrollTop=b.scrollHeight;return {dialog:r(d),body:r(b),before,after:r(a),scroll:b.scrollTop,buttons:[...a.children].map(r),height:innerHeight}});
  assert.ok(long.scroll>100);assert.deepEqual(long.after,long.before);assert.ok(long.body.bottom<=long.before.top+1);assert.ok(long.dialog.bottom<=long.height-5);for(const b of long.buttons){assert.ok(b.top>=long.before.top&&b.bottom<=long.before.bottom+1&&b.right<=long.before.right+1)}await p.keyboard.press('Escape');passed.push(channel+': long content scrolls independently while wrapped footer actions remain visible on a short phone');
  await p.evaluate(()=>toast('旧通知'));await p.waitForTimeout(2200);await p.evaluate(()=>toast('新通知：'+ '较长文件名_'.repeat(40)));await p.waitForTimeout(1500);assert.equal(await p.locator('.toast').count(),1);assert.match(await p.locator('.toast-message').innerText(),/^新通知/);assert.ok((await p.locator('.toast').boundingBox()).height<=90);assert.equal(await p.locator('.toast-message').getAttribute('title'),await p.locator('.toast-message').textContent());await p.waitForTimeout(2200);assert.equal(await p.locator('.toast').count(),0);passed.push(channel+': the newest notice replaces the old one, resets its timer, remains bounded and dismisses automatically');
 }finally{await browser.close()}
}
assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await fs.writeFile('work/notice-fix-report.json',JSON.stringify({passed,errors,external},null,2));console.log('PASS '+passed.length+' notification and dialog groups');
