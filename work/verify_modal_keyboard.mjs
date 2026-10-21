import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const fixture=JSON.parse(await fs.readFile('work/baseline-state.json','utf8'));
const checks=[],errors=[],requests=[];
const pass=message=>{checks.push(message);console.log('PASS '+message)};
const target=pathToFileURL(path.resolve(process.env.IMO_TEST_HTML||'outputs/IMO_Generator.html')).href;
const inside=page=>page.evaluate(()=>!!document.activeElement.closest('#modalRoot .dialog'));

for(const channel of(process.env.IMO_BROWSERS||'chrome,msedge').split(',')){
 const browser=await chromium.launch({...(channel==='chromium'?{}:{channel}),headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1512,height:1050},reducedMotion:'reduce'});
  await page.context().setOffline(true);
  page.on('pageerror',error=>errors.push(channel+': '+error.message));
  page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url())});
  await page.goto(target);
  await page.evaluate(()=>IMOApp.ready);
  await page.evaluate(()=>{uiSettings.leaveWarn=false;uiSettings.afterGenerateSave=false});

  const more=page.locator('.footer [data-action=wsMore]');
  await more.click();
  assert.equal(await page.locator('.shell').evaluate(element=>element.inert),true);
  assert.equal(await page.locator('#modalRoot .dialog').evaluate(element=>document.getElementById(element.getAttribute('aria-labelledby'))?.textContent===element.getAttribute('aria-label')),true);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'saveProjectAs');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'closeModal');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'saveProjectAs');
  const uiBefore=await page.evaluate(()=>JSON.stringify(WorkspaceUI.ui));
  for(let count=0;count<16;count++){
   await page.keyboard.press(count%4===0?'Shift+Tab':'Tab');
   assert.equal(await inside(page),true,'focus stays in the actual project menu');
  }
  await page.evaluate(()=>document.querySelector('.brand-home').focus());
  assert.equal(await inside(page),true);
  assert.equal(await page.evaluate(()=>JSON.stringify(WorkspaceUI.ui)),uiBefore);
  pass(channel+': project menu has an accessible title, inert background and forward/backward keyboard containment');

  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#modalRoot .dialog').count(),0);
  assert.equal(await page.locator('.shell').evaluate(element=>element.hasAttribute('inert')),false);
  assert.equal(await more.evaluate(element=>element===document.activeElement),true);
  await more.click();
  await page.locator('#modalRoot [data-action=closeModal]').click();
  assert.equal(await more.evaluate(element=>element===document.activeElement),true);
  assert.equal(await page.locator('.shell').evaluate(element=>element.inert),false);
  pass(channel+': Escape and the Close button both restore the original opener and release the background');

  await page.evaluate(async snapshot=>{
   const blank=blankState();
   state={...blank,...snapshot,preferences:{...blank.preferences,...snapshot.preferences},multiport:blank.multiport};
   changed();
   await MultiPort.create([],{includeCurrent:true});
   currentView='stores';
   render();
  },fixture);
  const storeId=await page.locator('[data-bulk-row=stores]').first().getAttribute('data-id');
  const originalQuantity=await page.evaluate(id=>state.stores.find(row=>row.id===id).quantity,storeId);
  await page.locator('[data-bulk-row=stores]').first().check();
  const bulk=page.locator('[data-action=openBulkEdit][data-view=stores]').first();
  assert.equal(await bulk.isVisible(),true,'selecting a row exposes its bulk-edit action');
  await bulk.click();
  const firstTitle=await page.locator('#modalRoot .dialog').getAttribute('aria-labelledby');
  await page.selectOption('#bulkField','quantity');
  await page.locator('#bulkValue').fill('142');
  await page.locator('#modalRoot [data-action=previewBulkEdit]').click();
  assert.notEqual(await page.locator('#modalRoot .dialog').getAttribute('aria-labelledby'),firstTitle);
  assert.equal(await page.locator('#modalRoot .dialog').count(),1);
  assert.equal(await page.locator('.shell').evaluate(element=>element.inert),true);
  for(let count=0;count<6;count++){
   await page.keyboard.press(count%2?'Tab':'Shift+Tab');
   assert.equal(await inside(page),true);
  }
  await page.keyboard.press('Escape');
  assert.equal(await bulk.evaluate(element=>element===document.activeElement),true);
  assert.equal(await page.evaluate(id=>state.stores.find(row=>row.id===id).quantity,storeId),originalQuantity);
  assert.equal(await page.locator('.shell').evaluate(element=>element.inert),false);
  pass(channel+': a real bulk-edit preview replaces its dialog without losing the first opener or changing unconfirmed data');

  await bulk.click();
  await page.selectOption('#bulkField','quantity');
  await page.locator('#bulkValue').fill('142');
  await page.locator('#modalRoot [data-action=previewBulkEdit]').click();
  await page.locator('#modalRoot [data-action=confirmBulkEdit]').click();
  assert.equal(await page.evaluate(id=>state.stores.find(row=>row.id===id).quantity,storeId),'142');
  assert.equal(await page.locator('#modalRoot .dialog').count(),0);
  assert.equal(await page.locator('.shell').evaluate(element=>element.inert),false);
  assert.equal(await page.locator('[data-grid=stores]').count()>0,true);
  await page.locator('[data-bulk-row=stores]').first().uncheck();
  assert.equal(await page.evaluate(()=>selectedBulkIds('stores').size),0);
  assert.equal(await page.locator('.bulk-toolbar[data-bulk-toolbar=stores]:visible').count(),0);
  pass(channel+': confirmation preserves the bulk-edit business action, releases its modal session and deselection hides the toolbar');

  await more.click();
  await page.evaluate(()=>modal('Keyboard fallback','<p>No enabled controls.</p>','<button disabled>Busy</button>'));
  assert.equal(await page.locator('#modalRoot .dialog').evaluate(element=>element===document.activeElement),true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#modalRoot .dialog').evaluate(element=>element===document.activeElement),true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.locator('#modalRoot .dialog').evaluate(element=>element===document.activeElement),true);
  await page.keyboard.press('Escape');
  assert.equal(await more.evaluate(element=>element===document.activeElement),true);
  pass(channel+': a replacement with no enabled controls retains dialog focus and restores the initial opener');

  await page.evaluate(()=>{
   document.querySelector('.shell').setAttribute('inert','existing-policy');
   modal('Preserved background','<p>Prior inert state must survive.</p>');
   modal('Replacement background','<p>The session remains isolated.</p>');
  });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.shell').getAttribute('inert'),'existing-policy');
  await page.evaluate(()=>document.querySelector('.shell').removeAttribute('inert'));
  await page.evaluate(()=>closeModal());
  assert.equal(await page.locator('.shell').evaluate(element=>element.hasAttribute('inert')),false);
  pass(channel+': replacement and repeated closing preserve the exact pre-existing inert attribute');

  await page.locator('#filesDock').click();
  assert.equal(await page.locator('#fileLibrary').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'fileSearch');
  assert.equal(await page.locator('.shell').evaluate(element=>element.inert),false);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#modalRoot .dialog').count(),0);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#fileLibrary').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'filesDock');
  pass(channel+': native file-library popover keeps its own keyboard, Escape and opener behavior outside a modal session');
 }catch(error){
  errors.push(channel+': '+(error.stack||error.message||String(error)));
  await fs.writeFile('work/modal-keyboard-report.json',JSON.stringify({checks,errors,requests},null,2));
  throw error;
 }finally{await browser.close()}
}
assert.deepEqual(errors,[]);
assert.deepEqual(requests,[]);
await fs.writeFile('work/modal-keyboard-report.json',JSON.stringify({checks,errors,requests},null,2));
console.log('PASS '+checks.length+' modal keyboard groups');
