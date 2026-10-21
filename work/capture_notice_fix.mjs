import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const dir=process.env.IMO_NOTICE_CAPTURE||process.argv[2]||'.impeccable/review/notice-fix-before';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const metrics={};
const shape=()=>{
 const keys=['top','bottom','height','width','position','overflowY','display','backgroundColor'];
 const get=selector=>{const el=document.querySelector(selector);if(!el)return null;const c=getComputedStyle(el),r=el.getBoundingClientRect();return {rect:{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom},css:Object.fromEntries(keys.map(k=>[k,c[k]]))}};
 return {toast:get('.toast'),dialog:get('.dialog'),actions:get('.dialog>.actions'),body:get('.dialog-body')};
};
try{
 await p.goto(pathToFileURL(path.resolve('outputs/IMO_Generator.html')).href);
 await p.evaluate(()=>IMOApp.ready);
 await p.evaluate(async s=>{const b=blankState();IMOApp.setState({...b,...s,preferences:{...b.preferences,...s.preferences},multiport:b.multiport});state.ship.name='PACIFIC DEMO';uiSettings.leaveWarn=false;uiSettings.afterGenerateSave=false;await MultiPort.create([],{includeCurrent:true});currentView='check';render()},JSON.parse(await fs.readFile('work/baseline-state.json','utf8')));
 for(const [name,width,height,theme] of [['desktop',1440,900,'light'],['mobile',390,844,'light'],['short',844,390,'light'],['dark',1280,800,'dark']]){
  await p.setViewportSize({width,height});await p.evaluate(theme=>{closeModal();uiSettings.theme=theme;applyUISettings();render();toast('已恢复工程：20261021_093849_064_Shanghai.imoproject.json')},theme);
  await p.screenshot({path:dir+'/'+name+'-toast.png',animations:'disabled'});metrics[name+'-toast']=await p.evaluate(shape);
  await p.evaluate(()=>$('#toastRoot').replaceChildren());await p.locator('.footer [data-action=wsMore]').click();
  await p.screenshot({path:dir+'/'+name+'-actions.png',animations:'disabled'});metrics[name+'-actions']=await p.evaluate(shape);
 }
 await fs.writeFile(dir+'/metrics.json',JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics));
}finally{await browser.close()}
