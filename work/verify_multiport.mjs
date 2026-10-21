import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import JSZip from 'jszip';

// Exercises real generated workbooks and the complete browser workspace. Run from
// the repository root after build.py. Test fixtures never touch user save folders.
const fixture=JSON.parse(await fs.readFile('work/baseline-state.json','utf8'));
const passed=[],browserErrors=[],externalRequests=[];
const pass=text=>{passed.push(text);console.log('PASS',text)};
const plans=[
 {id:'qa-plan-a',port:'Brisbane',country:'Australia',arrivalDate:'2026-11-03',departureDate:'2026-11-05',security:'1',remarks:'CARGO OPERATION'},
 {id:'qa-plan-skipped',port:'Sydney',country:'Australia',arrivalDate:'2026-11-08',departureDate:'2026-11-09',security:'1',remarks:'BUNKER'},
 {id:'qa-plan-b',port:'Noumea',country:'New Caledonia',arrivalDate:'2026-11-12',departureDate:'2026-11-13',security:'1',remarks:'CARGO OPERATION'},
 {id:'qa-plan-repeat',port:'Brisbane',country:'Australia',arrivalDate:'2026-11-17',departureDate:'2026-11-18',security:'1',remarks:'CARGO OPERATION'},
 {id:'qa-plan-terminal',port:'Shanghai',country:'China',arrivalDate:'2026-11-25',departureDate:'2026-11-26',security:'1',remarks:'CARGO OPERATION'}
];

for(const channel of (process.env.IMO_BROWSERS||'chrome,msedge').split(',')){
 const browser=await chromium.launch({...(channel==='chromium'?{}:{channel}),headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1550,height:1050}});
  await context.setOffline(true);
  const page=await context.newPage();
  page.on('pageerror',e=>browserErrors.push(channel+': '+e.stack));
  page.on('request',r=>{if(/^https?:/.test(r.url()))externalRequests.push(r.url())});
  page.on('dialog',d=>d.accept());
  await page.goto(pathToFileURL(path.resolve('outputs/IMO_Generator.html')).href);
  await page.evaluate(()=>IMOApp.ready);
  await page.waitForFunction(()=>typeof MultiPort==='object');
  async function reset(){
   await page.evaluate(({fixture,plans})=>{
    const blank=blankState();
    state={...blank,...structuredClone(fixture),voyage:{...blank.voyage,...fixture.voyage,linkedPlanId:plans[0].id},preferences:{...blank.preferences,...fixture.preferences},workflow:blank.workflow,multiport:blank.multiport};
    state.plannedPorts=structuredClone(plans);state.voyage.arrivalPort=plans[0].port;state.voyage.departurePort=plans[0].port;
    state.stores=[{id:'qa-rice',name:'Rice',quantity:'1000',unit:'kgs',location:'PROVISIONS',category:''},{id:'qa-rope',name:'Rope',quantity:'50',unit:'mtrs',location:'DECK STORES',category:''}];
    state.storesAsOf={port:plans[0].port,date:plans[0].arrivalDate,snapshotId:''};
    CONFIG=structuredClone(DEFAULT_CONFIG);uiSettings.afterGenerateSave=false;uiSettings.leaveWarn=false;applyUISettings();changed();currentView='multiport';render();resetEditHistory();
   },{fixture,plans});
  }
  await reset();
  const rejectedCreate=await page.evaluate(async()=>{const before=JSON.stringify(state.multiport);let error='';try{await MultiPort.create(['missing-plan-qa'])}catch(e){error=e.message}return {error,unchanged:JSON.stringify(state.multiport)===before}});
  assert.ok(rejectedCreate.error);assert.equal(rejectedCreate.unchanged,true);
  pass(channel+': invalid plan selection is rejected before creating any partial workspace');
  const rejectedPreset=await page.evaluate(async()=>{
   state.workflow.outputPresets=[{id:'qa-bad-preset',name:'QA INCOMPATIBLE PRESET',port:{name:'Noumea',country:'New Caledonia',locode:'NCNOU'},policy:{keys:[],fields:[JSON.stringify([5,'NOT_A_REAL_SHEET','ship.name','B6'])],columns:[],cells:[]},nilItems:structuredClone(activeNilItems()),createdAt:new Date().toISOString()}];changed();
   const before=JSON.stringify(state);let error='';try{await MultiPort.create(['qa-plan-a','qa-plan-b'],{applyPresets:true})}catch(e){error=e.message}
   const unchanged=JSON.stringify(state)===before;state.workflow.outputPresets=[];changed();resetEditHistory();return {error,unchanged};
  });
  assert.match(rejectedPreset.error,/方案/);assert.equal(rejectedPreset.unchanged,true);
  pass(channel+': a later port\'s incompatible output preset rolls back the entire task-creation transaction');
  const created=await page.evaluate(async()=>{
   await MultiPort.create(['qa-plan-a','qa-plan-b','qa-plan-repeat']);MultiPort.flush();
   return MultiPort.tasks().map(t=>({id:t.id,planId:t.planId,port:t.data.voyage.arrivalPort}));
  });
  assert.equal(new Set(created.map(t=>t.id)).size,created.length);
  for(const plan of ['qa-plan-a','qa-plan-b','qa-plan-repeat'])assert.equal(created.filter(t=>t.planId===plan).length,1);
  assert.equal(created.filter(t=>t.port==='Brisbane').length,2);
  pass(channel+': selected future stops create separate stable tasks, including repeated visits to the same port');

  const navigation=await page.evaluate(async()=>{
   resetEditHistory();const a=MultiPort.tasks().find(t=>t.planId==='qa-plan-a'),b=MultiPort.tasks().find(t=>t.planId==='qa-plan-b');
   await MultiPort.switchTask(b.id);MultiPort.step('ports');MultiPort.select([b.id]);await MultiPort.switchTask(a.id);flushEditHistory();return IMOApp.history.counts;
  });
  assert.deepEqual(navigation,{undo:0,redo:0});
  pass(channel+': changing task, workbench step and export selection does not fill the data undo stack');

  const sharedRoute=await page.evaluate(async()=>{
   state.plannedPorts.find(p=>p.id==='qa-plan-skipped').remarks='BUNKER,TRANSIT';changed();MultiPort.flush();const marked=MultiPort.tasks().filter(t=>t.stale.includes('route')).length;
   for(const t of MultiPort.tasks())MultiPort.acknowledge(t.id,['route']);
   for(const t of MultiPort.tasks())await MultiPort.switchTask(t.id);await MultiPort.switchTask(MultiPort.tasks().find(t=>t.planId==='qa-plan-a').id);
   return {marked,falseStale:MultiPort.tasks().filter(t=>t.stale.includes('route')).length};
  });
  assert.ok(sharedRoute.marked>=2);assert.equal(sharedRoute.falseStale,0);
  pass(channel+': shared route changes mark downstream review once, while later task switching never invents new route changes');

  const isolation=await page.evaluate(async()=>{
   const a=MultiPort.tasks().find(t=>t.planId==='qa-plan-a'),b=MultiPort.tasks().find(t=>t.planId==='qa-plan-b');
   await MultiPort.switchTask(a.id);state.effectsDeclaration='PORT A ONLY';state.stores[0].quantity='777';state.health.q1='Yes';changed();MultiPort.flush();
   await MultiPort.switchTask(b.id);const before={declaration:state.effectsDeclaration,stock:state.stores[0].quantity,health:state.health.q1};
   state.effectsDeclaration='PORT B ONLY';state.stores[0].quantity='666';changed();MultiPort.flush();
   await MultiPort.switchTask(a.id);return {before,after:{declaration:state.effectsDeclaration,stock:state.stores[0].quantity,health:state.health.q1},ids:{a:a.id,b:b.id}};
  });
  assert.notEqual(isolation.before.declaration,'PORT A ONLY');assert.notEqual(isolation.before.stock,'777');assert.notEqual(isolation.before.health,'Yes');
  assert.deepEqual(isolation.after,{declaration:'PORT A ONLY',stock:'777',health:'Yes'});
  pass(channel+': switching ports preserves independent inventory, declarations and health answers');

  const reversible=await page.evaluate(async()=>{
   await MultiPort.switchTask(MultiPort.tasks().find(t=>t.planId==='qa-plan-b').id);resetEditHistory();
   const before=state.effectsDeclaration;state.effectsDeclaration='UNDO PORT B';changed();flushEditHistory();
   IMOApp.history.undo();const undo={active:MultiPort.activeId(),value:state.effectsDeclaration};
   IMOApp.history.redo();const redo={active:MultiPort.activeId(),value:state.effectsDeclaration};MultiPort.flush();
   await MultiPort.switchTask(MultiPort.tasks().find(t=>t.planId==='qa-plan-a').id);
   return {before,undo,redo,other:state.effectsDeclaration};
  });
  assert.equal(reversible.before,'PORT B ONLY');assert.equal(reversible.undo.active,isolation.ids.b);assert.equal(reversible.undo.value,'PORT B ONLY');assert.equal(reversible.redo.active,isolation.ids.b);assert.equal(reversible.redo.value,'UNDO PORT B');assert.equal(reversible.other,'PORT A ONLY');
  pass(channel+': undo and redo restore the edited port without overwriting another task');

  const scopeFailure=await page.evaluate(async()=>{
   const active=MultiPort.activeId(),original={port:state.voyage.arrivalPort,declaration:state.effectsDeclaration};let error='';
   try{await MultiPort.withTask(MultiPort.tasks().find(t=>t.planId==='qa-plan-b').id,async()=>{await Promise.resolve();throw Error('EXPECTED QA ERROR')})}catch(e){error=e.message}
   return {error,active:MultiPort.activeId()===active,projection:{port:state.voyage.arrivalPort,declaration:state.effectsDeclaration},original,blocked:document.querySelector('[data-multiport-lock]')!==null};
  });
  assert.match(scopeFailure.error,/EXPECTED QA ERROR/);assert.equal(scopeFailure.active,true);assert.deepEqual(scopeFailure.projection,scopeFailure.original);assert.equal(scopeFailure.blocked,false);
  pass(channel+': failed asynchronous task inspection restores the original active projection and removes its interaction lock');

  const route=await page.evaluate(async()=>{
   const a=MultiPort.tasks().find(t=>t.planId==='qa-plan-a'),b=MultiPort.tasks().find(t=>t.planId==='qa-plan-b'),repeat=MultiPort.tasks().find(t=>t.planId==='qa-plan-repeat');
   return {a:await MultiPort.withTask(a.id,async()=>({next:state.voyage.nextPort})),b:await MultiPort.withTask(b.id,async()=>({previous:state.voyage.lastPort,next:state.voyage.nextPort,history:portOutputSelection().rows.map(r=>r.id)})),repeat:await MultiPort.withTask(repeat.id,async()=>({previous:state.voyage.lastPort,history:portOutputSelection().rows.map(r=>r.id)})),active:MultiPort.activeId()};
  });
  assert.equal(route.a.next,'Sydney');assert.equal(route.b.previous,'Sydney');assert.equal(route.b.next,'Brisbane');assert.ok(route.b.history.includes('qa-plan-skipped'));assert.ok(route.b.history.length<=10);assert.equal(route.repeat.previous,'Noumea');assert.ok(route.repeat.history.includes('qa-plan-b'));assert.equal(route.active,isolation.ids.a);
  pass(channel+': previous/next ports and latest-ten history use the complete route, including stops skipped for export');

  const actualBooks=await page.evaluate(async()=>{
   const active=MultiPort.activeId(),rows=[];
   for(const planId of ['qa-plan-a','qa-plan-b']){
    const task=MultiPort.tasks().find(t=>t.planId===planId);
    rows.push(await MultiPort.withTask(task.id,async()=>{
     const stock=await generateWorkbook(5),effects=await generateWorkbook(3),book=await readBook(stock.bytes),effectsBook=await readBook(effects.bytes);
     const values=b=>b.sheets.flatMap(s=>[...s.cells.values()].map(c=>cellText(c,b.strings)));
     return {planId,stock:values(book),effects:values(effectsBook),files:[{name:stock.name,bytes:toBase64(stock.bytes)},{name:effects.name,bytes:toBase64(effects.bytes)}]};
    }));
   }
   return {rows,activeUnchanged:MultiPort.activeId()===active};
  });
  assert.equal(actualBooks.activeUnchanged,true);
  const aBook=actualBooks.rows.find(r=>r.planId==='qa-plan-a'),bBook=actualBooks.rows.find(r=>r.planId==='qa-plan-b');
  assert.ok(aBook.stock.some(v=>Number(v)===777));assert.ok(!aBook.stock.some(v=>Number(v)===666));assert.ok(bBook.stock.some(v=>Number(v)===666));assert.ok(!bBook.stock.some(v=>Number(v)===777));
  assert.ok(aBook.effects.includes('PORT A ONLY'));assert.ok(!bBook.effects.includes('PORT A ONLY'));assert.ok(bBook.effects.includes('UNDO PORT B'));
  for(const row of actualBooks.rows)for(const file of row.files){const bytes=Buffer.from(file.bytes,'base64'),zip=await JSZip.loadAsync(bytes,{checkCRC32:true});assert.ok(zip.file('xl/workbook.xml'));await fs.writeFile('work/multiport-'+channel+'-'+row.planId+'-'+file.name,bytes)}
  pass(channel+': actual per-port stores and effects XLSX files keep the correct quantities and declarations with valid ZIP/XML containers');

  const roundtrip=await page.evaluate(async()=>{
   MultiPort.flush();const original=JSON.stringify(state.multiport),packed=packedProject();
   await loadProject(new File([JSON.stringify(packed)],'multiport-roundtrip.imoproject.json'));
   return {same:JSON.stringify(state.multiport)===original,count:MultiPort.tasks().length,active:MultiPort.activeId(),declaration:state.effectsDeclaration,undo:IMOApp.history.counts.undo};
  });
  assert.equal(roundtrip.same,true);assert.equal(roundtrip.count,created.length);assert.equal(roundtrip.active,isolation.ids.a);assert.equal(roundtrip.declaration,'PORT A ONLY');assert.equal(roundtrip.undo,0);
  pass(channel+': complete workspace and active task round-trip through real project serialization without stale editing history');

  const malformed=await page.evaluate(async()=>{
   const packed=packedProject(),task=packed.state.multiport.tasks.find(t=>t.planId==='qa-plan-b'),old=JSON.stringify(state);
   task.data.arrival.push({personId:'missing-person-qa',overrides:{}});let error='';
   try{await loadProject(new File([JSON.stringify(packed)],'bad-multiport.json'))}catch(e){error=e.message}
   return {error,unchanged:JSON.stringify(state)===old};
  });
  assert.ok(malformed.error);assert.equal(malformed.unchanged,true);
  pass(channel+': malformed inactive roster references are rejected atomically before replacing the workspace');

  const malformedPool=await page.evaluate(async()=>{
   const p=packedProject(),before=JSON.stringify(state),original=p.state.multiport.tasks.find(t=>t.planId==='qa-plan-b').templateKey;
   p.state.multiport.templateSets['qa-corrupt-inactive-pool']=structuredClone(p.state.multiport.templateSets[original]);
   p.state.multiport.templateSets['qa-corrupt-inactive-pool'].files[0].base64='%%%NOT-BASE64%%%';p.state.multiport.tasks.find(t=>t.planId==='qa-plan-b').templateKey='qa-corrupt-inactive-pool';let error='';
   try{await loadProject(new File([JSON.stringify(p)],'bad-inactive-template-pool.json'))}catch(e){error=e.message}
   return {error,unchanged:JSON.stringify(state)===before};
  });
  assert.ok(malformedPool.error);assert.equal(malformedPool.unchanged,true);
  pass(channel+': corrupt inactive template pools are validated off-screen and cannot partially replace the current workspace');
  const samePoolKey=await page.evaluate(async()=>{
   const p=packedProject(),before=JSON.stringify(state),key=p.state.multiport.tasks[0].templateKey;
   p.state.multiport.templateSets[key].files[0].base64='%%%CHANGED-BYTES-SAME-CACHE-KEY%%%';let error='';
   try{await loadProject(new File([JSON.stringify(p)],'bad-existing-cache-key.json'))}catch(e){error=e.message}
   return {error,unchanged:JSON.stringify(state)===before};
  });
  assert.ok(samePoolKey.error);assert.equal(samePoolKey.unchanged,true);
  pass(channel+': a familiar template-pool key cannot reuse cached workbooks to conceal corrupted incoming template bytes');

  const preservedBaseline=await page.evaluate(async()=>{
   const a=MultiPort.tasks().find(t=>t.planId==='qa-plan-a'),b=MultiPort.tasks().find(t=>t.planId==='qa-plan-b');
   await MultiPort.switchTask(b.id);resetEditHistory();state.effectsDeclaration='TEMPORARY EDIT';changed();flushEditHistory();
   const snapshot=await MultiPort.withTask(a.id,async()=>generationSnapshot()),baseline={version:1,generatedAt:'2026-10-18T06:00:00.000Z',snapshot,files:['QA.xlsx'],outputs:[5]};
   MultiPort.commitGenerated(a.id,baseline);MultiPort.changed();flushEditHistory();IMOApp.history.undo();MultiPort.flush();
   const saved=MultiPort.inspect(a.id).data.workflow.lastGenerated;
   return {at:saved?.generatedAt,snapshot:JSON.stringify(saved?.snapshot)===JSON.stringify(snapshot),active:MultiPort.activeId(),value:state.effectsDeclaration};
  });
  assert.equal(preservedBaseline.at,'2026-10-18T06:00:00.000Z');assert.equal(preservedBaseline.snapshot,true);assert.equal(preservedBaseline.active,isolation.ids.b);assert.equal(preservedBaseline.value,'UNDO PORT B');
  pass(channel+': undoing an edit never rolls back another port\'s successful-generation comparison baseline');

  const frozenProfiles=await page.evaluate(async()=>{
   const a=MultiPort.tasks().find(t=>t.planId==='qa-plan-a'),b=MultiPort.tasks().find(t=>t.planId==='qa-plan-b'),old=MultiPort.inspect(a.id).data.people[0].passport;
   await MultiPort.switchTask(b.id);state.people[0].passport='QA-RENEWED-MASTER';changed();MultiPort.flush();
   const frozen=MultiPort.inspect(a.id).data.people[0].passport;
   await MultiPort.refresh([a.id],['common'],{overwrite:true});
   return {old,frozen,updated:MultiPort.inspect(a.id).data.people[0].passport};
  });
  assert.equal(frozenProfiles.frozen,frozenProfiles.old);assert.equal(frozenProfiles.updated,'QA-RENEWED-MASTER');
  pass(channel+': changing shared personnel never silently alters an exported port; explicit common-data refresh updates the selected task');

  const manualCrew=await page.evaluate(async()=>{
   const a=MultiPort.tasks().find(t=>t.planId==='qa-plan-a'),b=MultiPort.tasks().find(t=>t.planId==='qa-plan-b');
   await MultiPort.switchTask(b.id);state.arrival[0].overrides??={};state.arrival[0].overrides.rank='QA MANUAL LOCAL RANK';changed();MultiPort.flush();
   await MultiPort.switchTask(a.id);if(!state.departure.some(r=>r.personId==='person-1'))state.departure.push({personId:'person-1',overrides:{}});changed();MultiPort.flush();
   await MultiPort.refresh([b.id],['crew'],{overwrite:false});
   const protectedValue=MultiPort.inspect(b.id).data.arrival[0].overrides.rank;
   await MultiPort.refresh([b.id],['crew'],{overwrite:true});
   return {protectedValue,replaced:MultiPort.inspect(b.id).data.arrival.some(r=>r.personId==='person-1')};
  });
  assert.equal(manualCrew.protectedValue,'QA MANUAL LOCAL RANK');assert.equal(manualCrew.replaced,true);
  pass(channel+': protective refresh preserves a port\'s manual roster overrides; explicit overwrite inherits the upstream departure roster');

  const batchCheck=await page.evaluate(async()=>{
   MultiPort.flush();const rows=MultiPort.tasks();
   for(const task of rows){await MultiPort.switchTask(task.id);state.voyage.stay='1 DAYS';state.passengers=[];state.declarations.passengers='none';changed();MultiPort.flush()}
   for(const task of rows){task.outputs=[4,5];task.confirmed={dates:task.planId!=='qa-plan-repeat',health:false,nil:false};task.stale=[]}
   MultiPort.changed();return MultiPortExport.check(rows.map(t=>t.id));
  });
  await fs.writeFile('work/multiport-'+channel+'-initial-check.json',JSON.stringify(batchCheck,null,2));
  assert.deepEqual(new Set(batchCheck.passing),new Set([isolation.ids.a,isolation.ids.b]));assert.equal(batchCheck.failed.length,1);assert.match(batchCheck.reports.find(r=>!r.pass).errors.join(' '),/日期/);
  pass(channel+': batch inspection checks selected documents only and leaves an unconfirmed port blocked while other ports pass');

  const failedDownload=[];const markDownload=dl=>failedDownload.push(dl.suggestedFilename());page.on('download',markDownload);
  const blocked=await page.evaluate(()=>MultiPortExport.generate(MultiPort.tasks().map(t=>t.id)));
  page.off('download',markDownload);assert.equal(blocked.success,false);assert.equal(blocked.blocked,true);assert.deepEqual(failedDownload,[]);
  pass(channel+': a failed batch is atomic and downloads no partial ZIP');

  const expectedBatchName=await page.evaluate(async ids=>{uiSettings.zipPattern='自定义_{船名}_{港口}_{日期}';await MultiPort.switchTask(ids[1]);const d=MultiPort.inspect(ids[0]).data,v=d.voyage;return '自定义_'+d.ship.name+'_'+v[v.mode+'Port']+'_'+v[v.mode+'Date'].replaceAll('-','')+'_多港口_2港.zip'},[isolation.ids.a,isolation.ids.b]);
  const batchPromise=page.waitForEvent('download');
  const batchResultPromise=page.evaluate(ids=>MultiPortExport.generate(ids),[isolation.ids.a,isolation.ids.b]);
  const batchDownload=await batchPromise;const batchPath='work/multiport-'+channel+'-batch.zip';await batchDownload.saveAs(batchPath);const batchResult=await batchResultPromise;
  assert.equal(batchResult.success,true);assert.equal(batchResult.files.length,4);assert.equal(batchDownload.suggestedFilename(),expectedBatchName);
  const batchZip=await JSZip.loadAsync(await fs.readFile(batchPath),{checkCRC32:true}),batchFiles=Object.values(batchZip.files).filter(f=>f.name.endsWith('.xlsx')),folders=new Set(batchFiles.map(f=>f.name.split('/')[0]));assert.equal(batchFiles.length,4);assert.equal(folders.size,2);
  const repeated=await page.evaluate(ids=>MultiPortExport.check(ids),[isolation.ids.a,isolation.ids.b]);assert.ok(repeated.reports.every(r=>r.unchanged));
  pass(channel+': explicitly exporting passed ports creates one ZIP with separate folders and exactly the chosen files, and records each port\'s baseline');

  const mappingChanged=await page.evaluate(async ids=>{
   CONFIG.templates.find(c=>c.id===5).title+=' QA MAPPING CHANGE';changed();MultiPort.flush();await MultiPort.refresh(ids,['templates'],{overwrite:true});for(const id of ids)MultiPort.inspect(id).stale=[];
   return MultiPortExport.check(ids);
  },[isolation.ids.a,isolation.ids.b]);
  assert.ok(mappingChanged.reports.every(r=>!r.unchanged));assert.ok(mappingChanged.reports.some(r=>r.differences.some(d=>d.category==='模板与映射')));
  pass(channel+': changed template mappings count as generation differences and cannot be skipped as unchanged');

  const staleReview=await page.evaluate(async id=>{
   const review=await MultiPortExport.check([id]),before=MultiPort.inspect(id).data.workflow.lastGenerated.generatedAt;
   state.voyage.stay='QA CHANGE AFTER BATCH REVIEW';changed();MultiPort.flush();let error='';
   try{await MultiPortExport.generate([id],{reviewStamp:review.stamp})}catch(e){error=e.message}
   return {error,baselineKept:MultiPort.inspect(id).data.workflow.lastGenerated.generatedAt===before};
  },isolation.ids.a);
  assert.match(staleReview.error,/变化/);assert.equal(staleReview.baselineKept,true);
  pass(channel+': changing data after batch review rejects the stale confirmation and preserves successful-generation baselines');

  await reset();
  const stockPreview=await page.evaluate(async()=>{
   await MultiPort.create(['qa-plan-a','qa-plan-b','qa-plan-repeat']);
   const a=MultiPort.tasks().find(t=>t.planId==='qa-plan-a'),b=MultiPort.tasks().find(t=>t.planId==='qa-plan-b'),rice=MultiPort.inspect(a.id).data.stores.find(r=>r.name==='Rice'),key=RouteInventory.rowKey(rice);
   const settings={sourceId:'current',sourceTaskId:a.id,date:'2026-11-03',rates:{[key]:'0.5'},dailyRates:{},deliveries:[{taskId:b.id,key,when:'arrival',quantity:'10'}],protectManual:true};
   window.qaStockSettings=settings;const before=MultiPort.tasks().map(t=>t.data.stores.find(r=>r.name==='Rice').quantity),result=MultiPortStock.preview(settings);
   return {before,after:MultiPort.tasks().map(t=>t.data.stores.find(r=>r.name==='Rice').quantity),result,virtual:MultiPortStock.draft.options._virtualIds};
  });
  assert.equal(stockPreview.result.ok,true);assert.equal(stockPreview.result.complete,true);assert.deepEqual(stockPreview.before,stockPreview.after);assert.deepEqual(stockPreview.virtual,['route-plan:qa-plan-skipped']);assert.equal(stockPreview.result.ports.length,4);
  const stockB=stockPreview.result.ports.find(r=>r.label.includes('Noumea')),stockRepeat=stockPreview.result.ports.at(-1);
  assert.equal(Number(stockB.arrivalRows.find(r=>r.name==='Rice').quantity),1001);assert.equal(Number(stockB.departureRows.find(r=>r.name==='Rice').quantity),1000);assert.equal(Number(stockRepeat.arrivalRows.find(r=>r.name==='Rice').quantity),996);
  pass(channel+': continuous inventory preview includes an unexported intermediate stop, sailing/stay consumption, a delivery, and changes no task quantities');

  const applied=await page.evaluate(()=>MultiPortStock.apply());assert.deepEqual(applied,{applied:3,virtual:1});
  const stockStages=await page.evaluate(async()=>{
   const b=MultiPort.tasks().find(t=>t.planId==='qa-plan-b');await MultiPort.switchTask(b.id);const arrival=state.stores.find(r=>r.name==='Rice').quantity;
   state.voyage.mode='departure';changed();MultiPort.flush();const departure=state.stores.find(r=>r.name==='Rice').quantity;
   const result=await generateWorkbook(5),book=await readBook(result.bytes),values=book.sheets.flatMap(s=>[...s.cells.values()].map(c=>cellText(c,book.strings)));
   state.voyage.mode='arrival';changed();MultiPort.flush();return {arrival,departure,back:state.stores.find(r=>r.name==='Rice').quantity,output:values};
  });
  assert.equal(Number(stockStages.arrival),1001);assert.equal(Number(stockStages.departure),1000);assert.equal(Number(stockStages.back),1001);assert.ok(stockStages.output.some(v=>Number(v)===1000));
  pass(channel+': reviewed inventory applies atomically to all prepared ports and arrival/departure switching uses the correct quantities in actual XLSX output');

  const stockGuard=await page.evaluate(()=>{
   MultiPortStock.preview(window.qaStockSettings);const old=MultiPort.tasks().map(t=>JSON.stringify(t.inventory));
   state.voyage.stay='CHANGED AFTER INVENTORY PREVIEW';changed();MultiPort.flush();let error='';try{MultiPortStock.apply()}catch(e){error=e.message}
   const staleKept=MultiPort.tasks().map(t=>JSON.stringify(t.inventory)).every((v,i)=>v===old[i]);
   const params=structuredClone(window.qaStockSettings);params.rates=Object.fromEntries(Object.keys(params.rates).map(k=>[k,'10000']));const bad=MultiPortStock.preview(params),before=MultiPort.tasks().map(t=>JSON.stringify(t.data.stores));let rejected='';try{MultiPortStock.apply()}catch(e){rejected=e.message}
   return {error,staleKept,badOk:bad.ok,rejected,unchanged:MultiPort.tasks().map(t=>JSON.stringify(t.data.stores)).every((v,i)=>v===before[i])};
  });
  assert.match(stockGuard.error,/变更/);assert.equal(stockGuard.staleKept,true);assert.equal(stockGuard.badOk,false);assert.ok(stockGuard.rejected);assert.equal(stockGuard.unchanged,true);
  pass(channel+': stale inventory previews and shortages are rejected without partially overwriting any port');

  const manualPhases=await page.evaluate(()=>{
   const id=MultiPort.activeId();state.stores.find(r=>r.name==='Rice').quantity='900';changed();MultiPort.flush();
   state.voyage.mode='departure';changed();MultiPort.flush();const departureBefore=state.stores.find(r=>r.name==='Rice').quantity;
   state.voyage.mode='arrival';changed();MultiPort.flush();const arrivalBefore=state.stores.find(r=>r.name==='Rice').quantity;
   const result=MultiPortStock.preview(window.qaStockSettings),port=result.ports.find(p=>p.id===id),calculated={arrival:port.arrivalRows.find(r=>r.name==='Rice').quantity,departure:port.departureRows.find(r=>r.name==='Rice').quantity};
   MultiPortStock.apply();state.voyage.mode='departure';changed();MultiPort.flush();return {departureBefore,arrivalBefore,ok:result.ok,complete:result.complete,calculated,after:state.stores.find(r=>r.name==='Rice').quantity};
  });
  assert.equal(Number(manualPhases.departureBefore),1000);assert.equal(Number(manualPhases.arrivalBefore),900);assert.equal(manualPhases.ok,true);assert.equal(manualPhases.complete,true);assert.equal(Number(manualPhases.calculated.arrival),900);assert.equal(Number(manualPhases.calculated.departure),899);assert.equal(Number(manualPhases.after),899);
  pass(channel+': arrival manual counts survive phase switching and rebasing, while departure stock continues from the protected count');

  const savedInventory=await page.evaluate(async()=>{
   const before=MultiPort.tasks().map(t=>({id:t.id,inventory:JSON.stringify(t.inventory),stockPhases:JSON.stringify(t.manual.stockPhases)})),packed=packedProject();
   await loadProject(new File([JSON.stringify(packed)],'estimated-multiport.json'));
   return {same:MultiPort.tasks().every((t,i)=>t.id===before[i].id&&JSON.stringify(t.inventory)===before[i].inventory&&JSON.stringify(t.manual.stockPhases)===before[i].stockPhases),mode:state.voyage.mode,quantity:state.stores.find(r=>r.name==='Rice').quantity,base:state.multiport.inventory.base.rows.find(r=>r.name==='Rice').quantity};
  });
  assert.equal(savedInventory.same,true);assert.equal(savedInventory.mode,'departure');assert.equal(Number(savedInventory.quantity),899);assert.equal(Number(savedInventory.base),1000);
  pass(channel+': saved workspace preserves both estimated phases, manual counts, current phase and the fixed opening balance without double deduction');

  await reset();
  const fullCheck=await page.evaluate(async()=>{
   await MultiPort.create(['qa-plan-a','qa-plan-b','qa-plan-repeat']);
   for(const task of MultiPort.tasks()){
    await MultiPort.switchTask(task.id);state.voyage.stay='1 DAYS';state.passengers=[];state.cases=[];state.declarations.passengers='none';state.declarations.cases='none';
    state.health={...blankState().health,...state.health};for(let n=1;n<=9;n++)state.health['q'+n]='No';state.health.measures='';state.health.stowawayPlace='';
    state.nil=Object.fromEntries([...new Set([...nilKeys,...activeNilItems().map(r=>r.key)])].map(k=>[k,'NIL']));
    state.effects={};for(const personId of new Set([...state.arrival,...state.departure].map(r=>r.personId)))state.effects[personId]={cigs:'0',beer:'NIL',wine:'0',spirit:'0',articles:'NIL',signature:''};state.effectsDeclaration='NIL';changed();MultiPort.flush();
   }
   for(const task of MultiPort.tasks()){task.outputs=[1,2,3,4,5,6,7,8,9,10];task.stale=[];await MultiPort.markConfirmed(task.id,'dates');await MultiPort.markConfirmed(task.id,'health');await MultiPort.markConfirmed(task.id,'nil')}
   return MultiPortExport.check(MultiPort.tasks().map(t=>t.id));
  });
  await fs.writeFile('work/multiport-'+channel+'-full-check.json',JSON.stringify(fullCheck,null,2));
  assert.equal(fullCheck.failed.length,0);assert.equal(fullCheck.passing.length,3);
  assert.ok((await page.evaluate(()=>MultiPort.tasks().map(t=>t.confirmed))).every(c=>c.dates&&c.health&&c.nil));
  const fullDownloadPromise=page.waitForEvent('download'),fullResultPromise=page.evaluate(()=>MultiPortExport.generate(MultiPort.tasks().map(t=>t.id))),fullDownload=await fullDownloadPromise,fullPath='work/multiport-'+channel+'-full.zip';await fullDownload.saveAs(fullPath);const fullResult=await fullResultPromise;
  assert.equal(fullResult.success,true);assert.equal(fullResult.files.length,30);
  const fullZip=await JSZip.loadAsync(await fs.readFile(fullPath),{checkCRC32:true}),fullFiles=Object.values(fullZip.files).filter(f=>f.name.endsWith('.xlsx'));assert.equal(fullFiles.length,30);assert.equal(new Set(fullFiles.map(f=>f.name.split('/')[0])).size,3);
  for(const file of fullFiles){const bytes=await file.async('nodebuffer'),bookZip=await JSZip.loadAsync(bytes,{checkCRC32:true});assert.ok(bookZip.file('xl/workbook.xml'));const target=path.resolve('work/multiport-full-generated',channel,file.name);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes)}
  pass(channel+': all three ports individually confirm dates, health and NIL before one batch produces exactly 30 complete XLSX files');

  await page.screenshot({path:'work/multiport-'+channel+'-workspace.png'});
  await context.close();
 }finally{await browser.close()}
}
assert.deepEqual(browserErrors,[]);assert.deepEqual(externalRequests,[]);
await fs.writeFile('work/multiport-verification.json',JSON.stringify({passed,browserErrors,externalRequests},null,2));
console.log('COMPLETE',passed.length,'groups');
