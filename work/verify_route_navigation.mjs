import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import JSZip from 'jszip';
const fixture=JSON.parse(await fs.readFile('work/baseline-state.json','utf8'));
const checks=[],errors=[],requests=[],failures=[];
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
for(const channel of (process.env.IMO_BROWSERS||'chrome,msedge').split(',')){
 const browser=await chromium.launch({...(channel==='chromium'?{}:{channel}),headless:true});
 const pass=text=>{checks.push(channel+': '+text);console.log('PASS '+checks.at(-1))};
 try{
  const p=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce',acceptDownloads:true});
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await p.context().setOffline(true);await p.goto(pathToFileURL(path.resolve('outputs/IMO_Generator.html')).href);await p.evaluate(()=>IMOApp.ready);
  await p.evaluate(async fixture=>{
   const b=blankState();IMOApp.setState({...b,...fixture,preferences:{...b.preferences,...fixture.preferences},multiport:b.multiport});
   uiSettings.afterGenerateSave=false;uiSettings.leaveWarn=false;
   state.plannedPorts=[['route-bne','Brisbane','Australia','2026-10-16','2026-10-17'],['route-nou','Noumea','New Caledonia','2026-10-19','2026-10-20'],['route-sha','Shanghai','China','2026-10-30','2026-10-31']].map(([id,port,country,arrivalDate,departureDate])=>({id,port,country,arrivalDate,departureDate,security:'1',remarks:'CARGO OPERATION'}));
   state.ports=Array.from({length:12},(_,i)=>({id:'history-'+i,port:'HISTORY PORT '+i,country:'Australia',security:'1',remarks:'CARGO OPERATION',arrivalDate:'2026-10-'+String(14-i).padStart(2,'0'),departureDate:'2026-10-'+String(14-i).padStart(2,'0')}));
   Object.assign(state.voyage,{arrivalPort:'Shanghai',departurePort:'Shanghai',arrivalDate:'2026-10-30',departureDate:'2026-10-31',linkedPlanId:'route-sha'});
   state.declarations.ports='records';changed();await MultiPort.create([],{includeCurrent:true});currentView='ports';render();
  },fixture);
  assert.equal(await p.locator('#content [data-port-page=current]').count(),1);
  assert.equal(await p.locator('#content [data-action=portTab],#content [data-grid=plannedPorts],#content [data-grid=ports]').count(),0);
  assert.equal(await p.locator('#content [data-declaration=ports]').count(),1);
  assert.equal(await p.locator('.flow-document-actions [data-action=wsDownloadFile][data-id="4"]').count(),1);
  pass('file 4 contains its declaration, read-only selection, preview and download, with no route editor or route tabs');
  const selected=await p.evaluate(()=>portOutputSelection().rows.map(r=>r.id));assert.equal(selected.length,10);assert.deepEqual(selected.slice(0,2),['route-nou','route-bne']);assert.ok(!selected.includes('route-sha'));
  pass('the same latest-ten algorithm includes predecessor plans and excludes the current station');
  await p.locator('#content [data-action=wsVoyageTab][data-tab=plan]').click();
  assert.equal(await p.locator('.document-heading h1').innerText(),'航次与航线');assert.equal(await p.locator('[data-grid=plannedPorts]').count(),1);
  assert.equal(await p.locator('[data-flow-document]').count(),0);assert.equal(await p.locator('#content [data-action=managePorts]').count(),1);
  pass('the contextual edit link opens future planning under Voyage, outside the file switcher');
  await p.locator('[data-table=plannedPorts][data-id=route-bne][data-field=remarks]').fill('CARGO OPERATION,TRANSIT');await p.locator('[data-table=plannedPorts][data-id=route-bne][data-field=remarks]').press('Tab');await settle(p);
  assert.equal(await p.evaluate(()=>state.plannedPorts[0].remarks),'CARGO OPERATION,TRANSIT');
  await p.locator('#content [data-action=addRow][data-view=plannedPorts]').click();await settle(p);
  const added=await p.evaluate(()=>state.plannedPorts.at(-1));assert.equal(added.security,'1');assert.equal(added.remarks,'CARGO OPERATION');
  await p.locator('#content [data-action=deleteRow][data-id="'+added.id+'"]').click();await settle(p);assert.equal(await p.evaluate(()=>state.plannedPorts.length),3);
  pass('future-plan editing and add/delete remain functional with the default security and purpose');
  await p.locator('#content [data-action=wsGo][data-view=ports]').click();
  assert.match(await p.locator('.port-summary-table').innerText(),/CARGO OPERATION,TRANSIT/);assert.equal(await p.evaluate(()=>state.ports.length),12);
  pass('returning to file 4 reflects route edits without converting any plan to historical fact');
  await p.locator('.dock-item[data-view=voyage]').click();assert.equal(await p.locator('.ws-voyage-details').count(),1);
  await p.locator('[data-action=wsVoyageTab][data-tab=history]').click();assert.equal(await p.locator('[data-grid=ports]').count(),1);
  assert.equal(await p.locator('#content [data-declaration=ports]').count(),0);
  await p.locator('[data-table=ports][data-id=history-0][data-field=port]').fill('Port Kembla');await p.locator('[data-table=ports][data-id=history-0][data-field=port]').press('Tab');await settle(p);
  assert.equal(await p.evaluate(()=>state.ports[0].port),'Port Kembla');
  pass('Voyage owns historical editing; per-port declaration status remains owned by file 4');
  const before=await p.evaluate(()=>{const c=document.querySelector('#content'),w=c.querySelector('.tablewrap');c.scrollTop=160;w.scrollTop=400;w.scrollLeft=190;return {top:c.scrollTop,y:w.scrollTop,x:w.scrollLeft}});
  await p.locator('[data-table=ports][data-id=history-4][data-field=security]').evaluate(input=>{const select=input.closest('.choice-editor').querySelector('select');select.focus({preventScroll:true});select.value='2';select.dispatchEvent(new Event('change',{bubbles:true}))});await settle(p);
  const after=await p.evaluate(()=>{const c=document.querySelector('#content'),w=c.querySelector('.tablewrap');return {top:c.scrollTop,y:w.scrollTop,x:w.scrollLeft}});assert.deepEqual(after,before);
  await p.evaluate(()=>actions.wsVoyageTab({dataset:{tab:'plan'}}));await settle(p);await p.evaluate(()=>actions.wsVoyageTab({dataset:{tab:'history'}}));await settle(p);
  const restored=await p.evaluate(()=>{const c=document.querySelector('#content'),w=c.querySelector('.tablewrap');return {top:c.scrollTop,y:w.scrollTop,x:w.scrollLeft}});assert.deepEqual(restored,before);
  pass('select edits and route-tab round trips preserve main and both table scroll axes');
  for(const action of ['showPortPlan','mpManagePlans','wsRoute']){await p.evaluate(action=>actions[action](),action);assert.equal(await p.locator('[data-grid=plannedPorts]').count(),1);assert.equal(await p.evaluate(()=>currentView),'voyage')}
  await p.evaluate(()=>{currentView='plannedPorts';render()});assert.equal(await p.evaluate(()=>currentView),'voyage');assert.equal(await p.locator('[data-grid=plannedPorts]').count(),1);
  pass('all earlier manage-plan links and restored plannedPorts pages resolve to Voyage');
  for(const [origin,id,key] of [['plan','route-nou','country'],['history','history-3','arrivalDate']]){
   const message=await p.evaluate(({origin,id,key})=>{const rows=origin==='plan'?state.plannedPorts:state.ports;rows.find(r=>r.id===id)[key]='';changed();currentView='check';const r=checkAll().results.find(r=>r.id===4),index=portOutputSelection().rows.findIndex(r=>r.id===id);render();return r.errors.find(text=>text.startsWith('第 '+(index+1)+' 条：'))},{origin,id,key});
   assert.ok(message,'real engine message '+origin);await p.locator('[data-output-document="4"] details').evaluateAll(ds=>ds.forEach(d=>d.open=true));
   await p.locator('[data-output-document="4"] [data-action=wsFix]').filter({hasText:message}).first().click();await p.waitForFunction(()=>!busy);await settle(p);
   const focus=await p.evaluate(()=>{const a=document.activeElement,e=a?.matches('.value-choice')?a.closest('.choice-editor').querySelector('input'):a;return {view:currentView,tab:voyageTab,id:e?.dataset.id,key:e?.dataset.field}});
   assert.deepEqual(focus,{view:'voyage',tab:origin==='plan'?'plan':'history',id,key});
   await p.evaluate(({origin,id,key})=>{(origin==='plan'?state.plannedPorts:state.ports).find(r=>r.id===id)[key]=key==='country'?'New Caledonia':'2026-10-11';changed()},{origin,id,key});
  }
  pass('actual file-4 validation errors open the exact predecessor-plan or historical record, independent of output sorting');
  await p.evaluate(()=>{state.plannedPorts[1].arrivalDate='INVALID DATE';changed();currentView='check';checkAll();render()});
  await p.locator('[data-output-document="4"] details').evaluateAll(ds=>ds.forEach(d=>d.open=true));await p.locator('[data-output-document="4"] [data-action=wsFix]').filter({hasText:'日期无效 INVALID DATE'}).click();await p.waitForFunction(()=>!busy);
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.field),'arrivalDate');
  await p.evaluate(()=>{state.plannedPorts[1].arrivalDate='2026-10-19';state.voyage.lastPort='';changed();currentView='check';checkAll();render()});
  await p.locator('[data-output-document="4"] details').evaluateAll(ds=>ds.forEach(d=>d.open=true));await p.locator('[data-output-document="4"] [data-action=wsFix]').filter({hasText:'缺少航次资料：上一港'}).first().click();await p.waitForFunction(()=>!busy);
  assert.equal(await p.evaluate(()=>voyageTab),'details');assert.equal(await p.evaluate(()=>document.activeElement.dataset.bind),'voyage.lastPort');
  pass('invalid plan dates focus the right date field, and shared voyage errors open the port-details section');
  await p.evaluate(()=>{state.voyage.lastPort='Noumea';state.declarations.ports='';changed();currentView='check';checkAll();render()});
  await p.locator('[data-output-document="4"] [data-action=wsFix]').filter({hasText:'挂靠港 尚未确认'}).click();await p.waitForFunction(()=>!busy);assert.equal(await p.evaluate(()=>currentView),'ports');assert.equal(await p.evaluate(()=>document.activeElement.dataset.declaration),'ports');
  pass('an unconfirmed declaration returns to the file status control instead of the route editor');
  await p.evaluate(async()=>{state.declarations.ports='records';changed();const t=MultiPort.inspect(MultiPort.activeId());if(t.stale.length)await MultiPort.acknowledge(t.id);await MultiPort.markConfirmed(t.id,'dates',true);currentView='ports';render()});
  const download=p.waitForEvent('download');await p.locator('.flow-document-actions [data-action=wsDownloadFile]').click();const dl=await download;const chunks=[];for await(const c of await dl.createReadStream())chunks.push(c);const z=await JSZip.loadAsync(Buffer.concat(chunks),{checkCRC32:true});const xml=await z.file('xl/worksheets/sheet1.xml').async('string');assert.match(xml,/Noumea/);assert.match(xml,/Brisbane/);assert.match(xml,/CARGO OPERATION,TRANSIT/);assert.ok(!xml.includes('HISTORY PORT 11'));
  pass('the visible single-file action produces a real XLSX with the edited preceding stops and ten-row cutoff');
  await p.setViewportSize({width:390,height:844});await p.locator('.dock-item[data-view=voyage]').click();await p.locator('[data-action=wsVoyageTab][data-tab=plan]').click();assert.equal(await p.locator('[data-grid=plannedPorts]').count(),1);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator('#content [data-action=wsGo][data-view=ports]').click();assert.equal(await p.locator('.flow-document-actions [data-action=wsDownloadFile]').isVisible(),true);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  pass('phone layouts retain separate route editing and file download without page overflow');
 }catch(e){failures.push(channel+': '+e.stack);throw e}
 finally{await browser.close();await fs.writeFile('work/route-navigation-report.json',JSON.stringify({checks,errors,requests,failures},null,2))}
}
assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(failures,[]);console.log('PASS '+checks.length+' route navigation groups');
