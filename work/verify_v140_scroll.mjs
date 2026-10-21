import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import JSZip from 'jszip';

const passed=[],errors=[],external=[],exports=[];
const pass=label=>{passed.push(label);console.log('PASS',label)};
const baseline=JSON.parse(await fs.readFile('work/baseline-state.json','utf8'));
const ready=async page=>{await page.evaluate(()=>IMOApp.ready);await page.waitForFunction(()=>!busy)};
const switches=['autoRestore','afterGenerateSave','leaveWarn'];
function fixture(){const s=structuredClone(baseline);s.voyage={...s.voyage,arrivalPort:'Noumea',departurePort:'Noumea',arrivalDate:'2026-10-19',departureDate:'2026-10-20',month:'2026-10',linkedPlanId:'p-nou'};const names=['Port Kembla','Melbourne','Fremantle','Durban','Port Elizabeth','Santander','Southampton','Antwerp','Gothenburg','Brisbane','Shanghai'];s.ports=Array.from({length:24},(_,i)=>({id:'h-'+i,port:names[i%names.length],country:i%names.length<3||i%names.length===9?'Australia':i%names.length<5?'South Africa':i%names.length===5?'Spain':i%names.length===6?'United Kingdom':i%names.length===7?'Belgium':i%names.length===8?'Sweden':'China',security:'1',remarks:'CARGO OPERATION',arrivalDate:'2026-09-'+String(25-i).padStart(2,'0'),departureDate:'2026-09-'+String(26-i).padStart(2,'0')}));s.plannedPorts=[{id:'p-bne',port:'Brisbane',country:'Australia',security:'1',remarks:'CARGO OPERATION',arrivalDate:'2026-10-16',departureDate:'2026-10-17'},{id:'p-nou',port:'Noumea',country:'New Caledonia',security:'1',remarks:'CARGO OPERATION',arrivalDate:'2026-10-19',departureDate:'2026-10-20'},{id:'p-sha',port:'Shanghai',country:'China',security:'1',remarks:'CARGO OPERATION',arrivalDate:'2026-10-30',departureDate:'2026-10-31'}];return s}
async function set(page,s){await page.evaluate(s=>{const b=blankState();IMOApp.setState({...b,...s,voyage:{...b.voyage,...s.voyage},preferences:{...b.preferences,...s.preferences}})},s)}
async function settings(page){await page.locator('[data-action=showSettings]').click();await page.waitForFunction(()=>!busy)}
async function checkSwitches(page,expected=true){for(const key of switches)assert.equal(await page.locator(`[data-ui-pref=${key}]`).isChecked(),expected,key)}

for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true});
 try{for(const file of ['outputs/IMO_Generator.html','outputs/IMO文件包生成器/打开生成器.html']){
  const context=await browser.newContext({viewport:{width:1400,height:900}});await context.setOffline(true);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url())});
  await page.goto(pathToFileURL(path.resolve(file)).href);await ready(page);await settings(page);await checkSwitches(page);assert.equal(await page.evaluate(()=>uiSettings.autoSaveMinutes),0);
  for(const key of switches)await page.locator(`[data-ui-pref=${key}]`).uncheck();await page.reload();await ready(page);await settings(page);await checkSwitches(page,false);
  await page.evaluate(()=>{const old={...uiSettings,theme:'dark',keepCount:3,autoRestore:false,afterGenerateSave:false,leaveWarn:false};localStorage.setItem('IMO-UI-1.2',JSON.stringify(old));localStorage.removeItem('IMO-SAVE-DEFAULTS-1.3.4')});await page.reload();await ready(page);await settings(page);await checkSwitches(page);assert.equal(await page.evaluate(()=>uiSettings.theme),'dark');assert.equal(await page.evaluate(()=>uiSettings.keepCount),3);
  await page.locator('[data-action=resetUISettings]').click();await checkSwitches(page);
  pass(channel+' / '+path.basename(file)+': three defaults on; one-time upgrade preserves other settings; later manual off persists');
  await set(page,fixture());await page.locator('.nav[data-view=ports]').click();assert.equal(await page.locator('[data-port-page=current]').count(),1);assert.equal(await page.locator('.port-summary-table tbody tr').count(),10);assert.equal(await page.locator('[data-grid]').count(),0);assert.equal(await page.locator('.plan-timeline').count(),0);
  await page.locator('[data-action=portTab][data-tab=history]').click();assert.equal(await page.locator('[data-grid=ports] tbody tr').count(),24);assert.equal(await page.locator('.port-export-summary').count(),0);
  await page.locator('[data-action=portTab][data-tab=plan]').click();assert.equal(await page.locator('[data-grid=plannedPorts] tbody tr').count(),3);assert.equal(await page.locator('.plan-timeline').count(),1);assert.equal(await page.locator('.port-export-summary').count(),0);
  await page.locator('[data-table=plannedPorts][data-field=departureDate][data-id=p-bne]').fill('2026-10-18');await page.locator('[data-action=portTab][data-tab=current]').click();assert.equal(await page.locator('.port-summary-table tbody tr').first().locator('.summary-port-english').innerText(),'Brisbane');assert.match(await page.locator('.port-summary-table tbody tr').first().innerText(),/2026-10-18/);assert.equal(await page.evaluate(()=>state.ports.length),24);assert.equal(await page.evaluate(()=>state.plannedPorts.length),3);
  pass(channel+' / '+path.basename(file)+': independent current/history/plan pages; live max-10 selection retains complete records');
  if(channel==='chrome'&&file.endsWith('IMO_Generator.html')){
   await page.screenshot({path:'work/v140-scroll-port-current.png'});
   await page.locator('[data-action=portTab][data-tab=history]').click();
   const position=()=>page.evaluate(()=>{const w=document.querySelector('[data-grid=ports]').parentElement;return {top:w.scrollTop,left:w.scrollLeft,main:document.querySelector('#content').scrollTop}});
   const closePosition=(before,after,label)=>{for(const k of ['top','left','main'])assert.ok(Math.abs(before[k]-after[k])<=1,label+' '+JSON.stringify({before,after}))};
   await page.evaluate(()=>{const w=document.querySelector('[data-grid=ports]').parentElement;document.querySelector('#content').scrollTop=70;w.scrollTop=330;w.scrollLeft=w.scrollWidth});
   let pos=await position();assert.ok(pos.top>250);assert.ok(pos.left>0);
   const moveId=await page.evaluate(()=>{const w=document.querySelector('[data-grid=ports]').parentElement,v=w.getBoundingClientRect();return [...w.querySelectorAll('[data-action=moveRow][data-dir="-1"]')].find(b=>{const r=b.getBoundingClientRect();return r.top>v.top+65&&r.bottom<v.bottom-20}).dataset.id});
   await page.locator(`[data-action=moveRow][data-id="${moveId}"][data-dir="-1"]`).click();closePosition(pos,await position(),'move record');
   const remarkId=await page.evaluate(()=>{const w=document.querySelector('[data-grid=ports]').parentElement,v=w.getBoundingClientRect();return [...w.querySelectorAll('[data-action=chooseRemarks]')].find(b=>{const r=b.getBoundingClientRect();return r.top>v.top+65&&r.bottom<v.bottom-20}).dataset.id});
   pos=await position();await page.locator(`[data-action=chooseRemarks][data-id="${remarkId}"]`).click();await page.locator('[data-remark-option=BUNKER]').check();await page.locator('[data-action=applyRemarks]').click();closePosition(pos,await position(),'apply purposes');
   await page.evaluate(()=>{document.querySelector('[data-grid=ports]').parentElement.scrollLeft=0});pos=await position();
   const portId=await page.evaluate(()=>{const w=document.querySelector('[data-grid=ports]').parentElement,v=w.getBoundingClientRect();return [...w.querySelectorAll('[data-action=pickPort]')].find(b=>{const r=b.getBoundingClientRect();return r.top>v.top+65&&r.bottom<v.bottom-20}).dataset.rowId});
   await page.locator(`[data-action=pickPort][data-row-id="${portId}"]`).click();await page.locator('#portSearch').fill('AU BNE');await page.locator('#portResults .port-choice').click();closePosition(pos,await position(),'choose port');
   await page.screenshot({path:'work/v140-scroll-kept-table-position.png'});await settings(page);await page.evaluate(()=>document.querySelector('#content').scrollTop=450);const settingsTop=await page.locator('#content').evaluate(el=>el.scrollTop);assert.ok(settingsTop>200);await page.locator('[data-ui-pref=expiryDays]').selectOption('60');assert.equal(await page.locator('#content').evaluate(el=>el.scrollTop),settingsTop);
   pass('actual up-arrow, purpose modal, port picker and settings change preserve vertical/horizontal table and page positions');
   await page.locator('.nav[data-view=ports]').click();await page.locator('[data-action=portTab][data-tab=current]').click();assert.equal(await page.locator('#content').evaluate(el=>el.scrollTop),0);pass('intentional page/tab switches start at top');
  }
  await context.close();
 }}finally{await browser.close()}
}

// Exercise the default ZIP -> disk snapshot -> auto-restore flow with the real launcher.
const root=path.resolve('work/v140-scroll-native-qa-'+Date.now());await fs.cp(path.resolve('outputs/IMO文件包生成器'),root,{recursive:true});
let child,session,browser;
const api=async(p,method='GET')=>{const response=await fetch(`http://127.0.0.1:${session.port}/api/`+p,{method,headers:{'X-IMO-Token':session.token}});assert.ok(response.ok);return response.json()};
try{
 child=spawn(path.resolve('work/IMO_Launcher.exe'),['--headless','--test-root',root,'--port','39497'],{windowsHide:true,stdio:'ignore'});
 for(let i=0;i<100;i++){try{const s=JSON.parse(await fs.readFile(path.join(root,'.imo-local-session.json'),'utf8'));if(s.pid===child.pid){session=s;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert.ok(session,'launcher startup');
 browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({acceptDownloads:true,viewport:{width:1450,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(`http://127.0.0.1:${session.port}/`))external.push(r.url())});await page.goto(session.url);await ready(page);await set(page,fixture());assert.equal((await page.evaluate(()=>checkAll())).errors,0);
 const downloadPromise=page.waitForEvent('download');await page.locator('.footer [data-action=generateAll]').click();await page.waitForFunction(()=>!busy);await page.locator('[data-action=confirmGeneration]').click();const dl=await downloadPromise;const out=path.resolve('work/v140-scroll-auto-save-generated.zip');await dl.saveAs(out);await page.waitForFunction(()=>!busy);assert.equal(await page.evaluate(()=>generated.size),10);const zip=await JSZip.loadAsync(await fs.readFile(out),{checkCRC32:true});const names=Object.keys(zip.files).filter(n=>n.endsWith('.xlsx'));assert.equal(names.length,10);
 const status=await api('status');assert.equal(status.records.length,1);const project=JSON.parse(await fs.readFile(status.latestPath,'utf8'));assert.equal(project.includesTemplates,true);assert.equal(project.templates.length,10);assert.equal(project.state.ports.length,24);assert.equal(project.state.plannedPorts.length,3);assert.equal(await page.evaluate(()=>lastSavedRevision===revision),true);exports.push({zip:path.basename(out),xlsx:names});pass('real ZIP button downloads 10 XLSX and automatically saves a full engineering snapshot to the launcher save directory');
 await page.reload();await ready(page);assert.equal(await page.evaluate(()=>state.ports.length),24);assert.equal(await page.evaluate(()=>state.plannedPorts.length),3);assert.equal(await page.evaluate(()=>state.voyage.arrivalPort),'Noumea');pass('real reload automatically restores latest disk snapshot with all data/templates');
 let dialogCount=0;page.on('dialog',async dialog=>{if(dialog.type()==='beforeunload')dialogCount++;await dialog.accept()});await page.locator('.nav[data-view=voyage]').click();await page.locator('[data-bind="voyage.stay"]').fill('UNSAVED CHECK');await page.reload();await ready(page);assert.equal(dialogCount,1);assert.notEqual(await page.evaluate(()=>state.voyage.stay),'UNSAVED CHECK');pass('actual browser beforeunload dialog appears for unsaved changes');
 await browser.close();browser=null;
}finally{if(browser)await browser.close();if(session)await api('quit','POST').catch(()=>{});if(child&&child.exitCode===null){await new Promise(r=>setTimeout(r,500));if(child.exitCode===null)child.kill()}}
assert.deepEqual(errors,[]);assert.deepEqual(external,[]);pass('zero JavaScript errors or external network requests');
await fs.writeFile('work/v140-scroll-verification.json',JSON.stringify({version:'1.4.0',passed,exports,errors,external,nativeOfficePrintVerified:false},null,2));console.log('All',passed.length,'checks passed');
