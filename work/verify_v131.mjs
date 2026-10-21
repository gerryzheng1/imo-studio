import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import JSZip from 'jszip';

const baseline=JSON.parse(await fs.readFile('work/baseline-state.json','utf8'));
const passed=[],errors=[],network=[],generated=[];
const pass=(name,detail)=>{passed.push({name,detail});console.log('PASS',name,detail||'')};
const files=[path.resolve('outputs/IMO_Generator.html'),path.resolve('outputs/IMO文件包生成器/打开生成器.html')];
const historyNames=['Port Kembla','Melbourne','Fremantle','Durban','Port Elizabeth','Santander','Southampton','Antwerp','Gothenburg','Brisbane','Shanghai'];
function fixture(){const s=structuredClone(baseline);s.voyage={...s.voyage,arrivalPort:'Noumea',departurePort:'Noumea',arrivalDate:'2026-10-19',departureDate:'2026-10-20',linkedPlanId:'plan-nou'};s.ports=historyNames.map((port,i)=>({id:'history-'+i,port,country:i<3||i===9?'Australia':i<5?'South Africa':i===5?'Spain':i===6?'United Kingdom':i===7?'Belgium':i===8?'Sweden':'China',security:'1',remarks:i===0?'CARGO OPERATION,BUNKER,CREW CHANGE':'CARGO OPERATION',arrivalDate:'2026-10-'+String(12-i).padStart(2,'0'),departureDate:'2026-10-'+String(13-i).padStart(2,'0')}));s.plannedPorts=[{id:'plan-bne',port:'Brisbane',country:'Australia',security:'1',remarks:'CARGO OPERATION,BUNKER',arrivalDate:'2026-10-16',departureDate:'2026-10-17'},{id:'plan-nou',port:'Noumea',country:'New Caledonia',security:'1',remarks:'CARGO OPERATION',arrivalDate:'2026-10-19',departureDate:'2026-10-20'},{id:'plan-sha',port:'Shanghai',country:'China',security:'1',remarks:'CARGO OPERATION',arrivalDate:'2026-10-30',departureDate:'2026-10-31'}];return s}
async function set(page,s){await page.evaluate(s=>{const b=blankState();IMOApp.setState({...b,...s,voyage:{...b.voyage,...s.voyage},preferences:{...b.preferences,...s.preferences},nilItems:s.nilItems||b.nilItems,storeSnapshots:s.storeSnapshots||[],provisionRates:s.provisionRates||{}});currentView='ports';portTab='history';render()},s)}
async function nav(page,view){await page.evaluate(view=>{closeModal();currentView=view;render()},view)}
function field(page,view,key,id){return page.locator(`[data-table="${view}"][data-field="${key}"]${id?`[data-id="${id}"]`:''}`).first()}
async function clipboard(locator,text){return locator.evaluate((el,text)=>{const transfer=new DataTransfer();transfer.setData('text/plain',text);return !el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:transfer,bubbles:true,cancelable:true}))},text)}

for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true});
 try{for(const [edition,file] of files.entries()){
  const context=await browser.newContext({viewport:{width:1660,height:1120},acceptDownloads:true});await context.setOffline(true);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(channel+':'+e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
  await page.goto(pathToFileURL(file).href);await page.evaluate(()=>IMOApp.ready);assert.equal(await page.evaluate(()=>templates.size),10);assert.match(await page.locator('.brand-sub').innerText(),/1\.3\.1/);
  await set(page,fixture());assert.equal(await page.locator('.date-mode').count(),0);assert.equal(await page.locator('.date-editor select').count(),0);
  const arrival=field(page,'ports','arrivalDate');assert.equal(await arrival.getAttribute('type'),'text');await arrival.fill('2026/10/12');assert.equal(await page.evaluate(()=>state.ports[0].arrivalDate),'2026/10/12');
  for(const text of ['NIL','待确认','2026-02-30']){await arrival.fill(text);assert.equal(await page.evaluate(()=>state.ports[0].arrivalDate),text)}
  assert.ok(await page.evaluate(()=>checkAll().results.find(r=>r.id===4).errors.some(e=>e.includes('日期'))));
  await page.evaluate(()=>render());assert.equal(await field(page,'ports','arrivalDate').inputValue(),'2026-02-30');await field(page,'ports','arrivalDate').fill('2026-10-12');
  const calendar=field(page,'ports','arrivalDate').locator('..').locator('.date-calendar-picker');assert.equal(await calendar.inputValue(),'2026-10-12');
  await page.evaluate(()=>{window.calendarOpened=0;const show=HTMLInputElement.prototype.showPicker;HTMLInputElement.prototype.showPicker=function(){window.calendarOpened++;return show.call(this)}});
  await page.bringToFront();await calendar.click();assert.equal(await page.evaluate(()=>calendarOpened),1);await page.waitForTimeout(450);
  await page.keyboard.press('ArrowRight');await page.waitForTimeout(150);await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('[data-table=ports][data-field=arrivalDate]').value==='2026-10-13',null,{timeout:3000});
  const picked=await field(page,'ports','arrivalDate').inputValue();assert.equal(picked,'2026-10-13','real native calendar keyboard selection');assert.equal(await page.evaluate(()=>state.ports[0].arrivalDate),picked);await page.keyboard.press('Escape');
  pass(channel+' / '+edition+': direct dates, NIL/custom text, invalid-date checks and actual native calendar selection');

  const before=await page.evaluate(()=>state.ports.length);await page.locator('[data-action=addRow][data-view=ports]').click();
  assert.deepEqual(await page.evaluate(()=>({security:state.ports.at(-1).security,remarks:state.ports.at(-1).remarks})),{security:'1',remarks:'CARGO OPERATION'});
  assert.equal(await page.locator('.remarks-editor').last().locator('.remarks-preview').innerText(),'货物作业');
  await page.evaluate(()=>{state.ports.pop();portTab='plan';render()});await page.locator('[data-action=addRow][data-view=plannedPorts]').click();
  assert.deepEqual(await page.evaluate(()=>({security:state.plannedPorts.at(-1).security,remarks:state.plannedPorts.at(-1).remarks})),{security:'1',remarks:'CARGO OPERATION'});
  await page.evaluate(()=>{state.plannedPorts.pop();portTab='history';render()});assert.equal(await page.evaluate(()=>state.ports.length),before);
  pass(channel+' / '+edition+': manual history and planned-port defaults, with editable values');

  const remarks=field(page,'ports','remarks');assert.equal(await remarks.evaluate(el=>el.tagName),'TEXTAREA');
  assert.equal(await remarks.inputValue(),'CARGO OPERATION,BUNKER,CREW CHANGE');
  assert.match(await remarks.locator('..').locator('.remarks-preview').innerText(),/货物作业.*加油.*船员换班/s);
  const dimensions=await remarks.evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight}));assert.ok(dimensions.scroll<=dimensions.client+2,JSON.stringify(dimensions));
  await remarks.fill('CARGO OPERATION,BUNKER,CREW CHANGE,SPARE PARTS');assert.match(await remarks.locator('..').locator('.remarks-preview').innerText(),/SPARE PARTS/);
  assert.equal(await clipboard(remarks,'CARGO OPERATION\nBUNKER'),false);await remarks.fill('CARGO OPERATION\nBUNKER');assert.equal(await page.evaluate(()=>state.ports[0].remarks),'CARGO OPERATION\nBUNKER');
  assert.equal(await page.evaluate(()=>state.ports.length),before);
  await page.locator('[data-action=chooseRemarks]').first().click();await page.locator('[data-remark-option="CREW CHANGE"]').check();await page.locator('#customRemarks').fill('SPARE PARTS');await page.locator('[data-action=applyRemarks]').click();
  assert.equal(await page.evaluate(()=>state.ports[0].remarks),'CARGO OPERATION,BUNKER,CREW CHANGE,SPARE PARTS');
  pass(channel+' / '+edition+': complete wrapping remarks, live translated preview, multiline text and purpose choices');

  const meta=page.locator('[data-grid=ports] .port-meta').first();assert.equal(await meta.locator(':scope > :first-child').getAttribute('class'),'locode-badge');assert.match(await meta.innerText(),/AU PKL.*肯布拉港/s);
  assert.equal(await page.locator('.port-summary-table tbody tr').count(),10);assert.equal(await page.locator('.port-summary-table thead th').count(),7);
  assert.deepEqual(await page.locator('.port-summary-table thead th').allTextContents(),['序号','UN/LOCODE','港口','到港日期','离港日期','备注 / 用途','记录来源']);
  assert.equal(await page.locator('.port-summary-table tbody tr').first().locator('td').nth(2).locator('.summary-port-english').innerText(),'Brisbane');
  assert.match(await page.locator('.port-summary-table tbody tr').first().innerText(),/前序计划，需核实/);
  assert.equal(await page.evaluate(()=>state.ports.length),11);assert.equal(await page.evaluate(()=>state.plannedPorts.length),3);
  pass(channel+' / '+edition+': LOCODE before Chinese; aligned seven-column preview preserves max-10 route/history selection');

  const saved=await page.evaluate(()=>structuredClone(state));await set(page,{...fixture(),ports:[fixture().ports[0]]});
  await clipboard(field(page,'ports','remarks'),'BUNKER\t2026-10-10\t2026-10-11\nCREW CHANGE\t2026-10-12\t2026-10-13');
  assert.equal(await page.evaluate(()=>state.ports.length),2);assert.equal(await page.evaluate(()=>state.ports[1].arrivalDate),'2026-10-12');assert.equal(await page.evaluate(()=>state.ports[1].security),'');
  await page.evaluate(()=>applyImportedRows('ports',[{port:'Brisbane',country:'Australia',security:'',remarks:'',arrivalDate:'2026-10-01',departureDate:'2026-10-02'}],'replace'));
  assert.equal(await page.evaluate(()=>state.ports[0].security),'');assert.equal(await page.evaluate(()=>state.ports[0].remarks),'');
  pass(channel+' / '+edition+': tabular paste expands rows; explicit imported blanks remain blank');

  await set(page,saved);await nav(page,'voyage');assert.equal(await page.locator('[data-bind="voyage.arrivalDate"]').getAttribute('type'),'text');await page.locator('[data-bind="voyage.arrivalDate"]').fill('2026-10-20');assert.equal(await page.evaluate(()=>state.plannedPorts.find(p=>p.id==='plan-nou').arrivalDate),'2026-10-20');
  await nav(page,'health');assert.equal(await page.locator('[data-bind="health.certDate"]').getAttribute('type'),'text');assert.equal(await page.locator('.date-mode').count(),0);
  await nav(page,'vaccines');await field(page,'vaccines','cholera').fill('lifelong');assert.equal(await field(page,'vaccines','cholera').inputValue(),'lifelong');await nav(page,'profiles');assert.equal(await field(page,'profiles','birthDate').getAttribute('type'),'text');
  pass(channel+' / '+edition+': voyage linkage, health certificate, personnel and vaccine date editors use the same direct input');

  if(channel==='chrome'&&edition===0){
   await set(page,saved);await page.locator('.port-export-summary').screenshot({path:'work/v131-port-preview.png'});
   await page.evaluate(()=>{document.querySelector('.port-export-summary details').open=false;const table=document.querySelector('[data-grid=ports]');table.parentElement.scrollTop=0;table.parentElement.scrollLeft=0;table.scrollIntoView({block:'center'});document.querySelector('#toastRoot').replaceChildren()});
   await page.screenshot({path:'work/v131-port-editor.png'});
   await page.setViewportSize({width:1100,height:900});await page.screenshot({path:'work/v131-port-editor-narrow.png'});
   await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.screenshot({path:'work/v131-port-editor-dark.png'});
   await page.evaluate(()=>{document.documentElement.dataset.theme='light';currentView='help';render()});assert.match(await page.locator('#help-voyage').innerText(),/保安等级默认 1/);assert.match(await page.locator('#help-faq').textContent(),/没有日期填写方式下拉框/);
   pass('desktop, narrow and dark-mode screenshots; beginner guide updated');
  }
  await context.close();
 }}finally{await browser.close()}
}

// Reopen the exact release engine and inspect actual XLSX bytes, not DOM-only previews.
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const context=await browser.newContext();await context.setOffline(true);const page=await context.newPage();await page.goto(pathToFileURL(files[0]).href);await page.evaluate(()=>IMOApp.ready);await set(page,fixture());await field(page,'ports','remarks').fill('CARGO OPERATION,BUNKER,CREW CHANGE,SPARE PARTS');await field(page,'ports','arrivalDate').fill('2026/10/12');
 const checks=await page.evaluate(()=>checkAll());assert.equal(checks.errors,0,JSON.stringify(checks.results.filter(r=>r.errors.length)));
 const result=await page.evaluate(async()=>{const out=[];for(const id of [1,2,4,6,10]){const r=await generateWorkbook(id);out.push({id,name:r.name,base64:toBase64(r.bytes)})}const book=await readBook((await generateWorkbook(4)).bytes),cfg=CONFIG.templates.find(c=>c.id===4).sheets[0],first=cfg.table.rows[0],next=cfg.table.rows[1];return{files:out,port:cellText(book.sheets[0].cells.get(cfg.table.columns.port+first),book.strings),remarks:cellText(book.sheets[0].cells.get(cfg.table.columns.remarks+next),book.strings),count:sectionRecords('ports',4).length,sheets:book.sheets.map(s=>s.name)}});
 assert.equal(result.port,'Brisbane');assert.equal(result.remarks,'CARGO OPERATION,BUNKER,CREW CHANGE,SPARE PARTS');assert.equal(result.count,10);assert.equal(result.sheets.length,1);
 await fs.mkdir('work/v131-generated',{recursive:true});for(const file of result.files){const bytes=Buffer.from(file.base64,'base64');const zip=await JSZip.loadAsync(bytes,{checkCRC32:true});assert.ok(zip.file('xl/workbook.xml'));await fs.writeFile(path.join('work/v131-generated',file.name),bytes);generated.push({id:file.id,name:file.name,bytes:bytes.length})}
 pass('five real XLSX generated: arrival, departure, max-10 ports with full remarks, health and vaccination');
}finally{await browser.close()}
assert.deepEqual(errors,[]);assert.deepEqual(network,[]);pass('zero JavaScript errors and zero external network requests in all four offline browser/edition combinations');
await fs.writeFile('work/v131-verification.json',JSON.stringify({version:'1.3.1',passed,errors,network,generated},null,2));console.log('All',passed.length,'targeted checks passed');
