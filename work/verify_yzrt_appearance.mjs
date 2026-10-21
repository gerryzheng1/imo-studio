import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const url=pathToFileURL(path.resolve('outputs/IMO_Generator.html')).href;
const fixture=JSON.parse(await fs.readFile('work/baseline-state.json','utf8'));
const report={entry:'outputs/IMO_Generator.html',checks:[],metrics:{},errors:[],requests:[],failures:[]};
const browsers=(process.env.IMO_BROWSERS||'chrome,msedge').split(',').filter(Boolean);
const pass=(channel,text)=>{report.checks.push(channel+': '+text);console.log('PASS '+report.checks.at(-1))};
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));

async function ready(page){
 await page.goto(url);
 await page.evaluate(()=>IMOApp.ready);
 await page.waitForFunction(()=>!busy);
 await settle(page);
}
function observe(page,channel){
 page.on('pageerror',e=>report.errors.push(channel+': '+(e.stack||e.message)));
 page.on('request',r=>{if(/^https?:/i.test(r.url()))report.requests.push({channel,url:r.url()})});
}
async function openSettings(page){
 await page.locator('#sharedDock').click();
 await page.locator('#nav [data-view=settings]').click();
 await page.waitForFunction(()=>!busy);
 await page.locator('.appearance-settings').waitFor();
 await settle(page);
}
async function openGlassOptions(page){
 const box=page.locator('#appearanceGlassOptions');
 if(!await box.evaluate(e=>e.open))await box.locator(':scope > summary').click();
}
async function select(page,key,value){
 const locator=page.locator('.appearance-settings [data-ui-pref="'+key+'"]');
 await locator.selectOption(value);
 await page.waitForFunction(({key,value})=>String(IMOApp.settings.value[key])===value,{key,value});
 await settle(page);
}
async function openConfigurationBackup(page){
 const disclosure=page.locator('details.settings-disclosure').filter({has:page.locator('[data-action=exportUISettings]')});
 if(!await disclosure.evaluate(e=>e.open))await disclosure.locator(':scope > summary').click();
}
async function importSettings(page,settings,name='appearance-test.json'){
 const chooser=page.waitForEvent('filechooser');
 await page.locator('[data-action=importUISettings]').click();
 await (await chooser).setFiles({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify({kind:'IMO-UI-SETTINGS',schema:1,settings}))});
 await page.waitForFunction(()=>!busy);
 await settle(page);
}
async function exportedSettings(page){
 const promise=page.waitForEvent('download');
 await page.locator('[data-action=exportUISettings]').click();
 const stream=await (await promise).createReadStream(),chunks=[];
 assert.ok(stream,'settings download has a readable stream');
 for await(const chunk of stream)chunks.push(chunk);
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function media(cdp,motion='no-preference',transparency='no-preference'){
 await cdp.send('Emulation.setEmulatedMedia',{features:[
  {name:'prefers-reduced-motion',value:motion},
  {name:'prefers-reduced-transparency',value:transparency}
 ]});
}
async function noLegacyFilters(page){
 assert.equal(await page.locator('svg filter,feDisplacementMap,feImage').count(),0);
 assert.equal(await page.evaluate(()=>StudioGlass.filters),0);
 const urls=await page.evaluate(()=>[...document.querySelectorAll('.portbar,.liquid-dock,.liquid-library,#content')].map(e=>getComputedStyle(e).backdropFilter));
 assert.ok(urls.every(value=>!value.includes('url(')),JSON.stringify(urls));
}

for(const channel of browsers){
 let browser;
 try{
  browser=await chromium.launch({...(channel==='chromium'?{}:{channel}),headless:true});
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'no-preference'});
  await context.setOffline(true);
  const page=await context.newPage();observe(page,channel);
  const cdp=await context.newCDPSession(page);await media(cdp);
  await ready(page);
  assert.equal(await page.evaluate(()=>templates.size),10);
  assert.equal(await page.evaluate(()=>StudioGlass.status.renderer),'css');
  await noLegacyFilters(page);
  pass(channel,'offline startup uses the CSS renderer and retains all ten original templates without SVG filters');

  await openSettings(page);
  assert.equal(await page.locator('#appearanceGlassOptions').evaluate(e=>e.open),false);
  assert.equal(await page.locator('.appearance-settings [data-ui-pref]').count(),8);
  assert.equal(await page.locator('[data-ui-pref*=author],[data-ui-pref*=watermark]').count(),0);
  const author=await page.locator('#authorCredit').innerText();
  pass(channel,'appearance starts with four common choices and a closed glass/background section, with fixed author credit');

  await openGlassOptions(page);
  await select(page,'glassStyle','soft');
  assert.match(await page.locator('.portbar').evaluate(e=>getComputedStyle(e).backdropFilter),/blur\(16px\)/);
  await select(page,'backgroundStyle','aurora');
  await select(page,'cornerStyle','soft');
  assert.equal(await page.locator('.portbar').evaluate(e=>getComputedStyle(e).borderTopLeftRadius),'20px');
  await select(page,'motion','reduced');
  assert.equal(await page.locator('html').getAttribute('data-effects-motion'),'reduced');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('IMO-UI-1.2')));
  assert.deepEqual([saved.glassStyle,saved.backgroundStyle,saved.cornerStyle,saved.motion],['soft','aurora','soft','reduced']);
  assert.deepEqual(await page.evaluate(()=>{const d=document.documentElement.dataset;return[d.glassStyle,d.backgroundStyle,d.cornerStyle,d.motion]}),['soft','aurora','soft','reduced']);
  assert.equal(await page.locator('#authorCredit').innerText(),author);
  pass(channel,'all four new preference controls visibly apply and persist without changing the author credit');

  await page.reload();await page.evaluate(()=>IMOApp.ready);await page.waitForFunction(()=>!busy);await settle(page);
  assert.deepEqual(await page.evaluate(()=>{const s=IMOApp.settings.value;return[s.glassStyle,s.backgroundStyle,s.cornerStyle,s.motion]}),['soft','aurora','soft','reduced']);
  assert.equal(await page.evaluate(()=>StudioGlass.status.background),'aurora');
  await openSettings(page);
  assert.equal(await page.locator('#appearanceGlassOptions').evaluate(e=>e.open),false);
  pass(channel,'a real reload restores all four preferences while keeping advanced appearance choices initially collapsed');

  await openConfigurationBackup(page);
  const exported=await exportedSettings(page);
  assert.equal(exported.kind,'IMO-UI-SETTINGS');assert.equal(exported.schema,1);
  assert.deepEqual([exported.settings.glassStyle,exported.settings.backgroundStyle,exported.settings.cornerStyle,exported.settings.motion],['soft','aurora','soft','reduced']);
  await page.locator('[data-action=resetAppearance]').click();await settle(page);
  await importSettings(page,exported.settings);
  assert.deepEqual(await page.evaluate(()=>{const s=IMOApp.settings.value;return[s.glassStyle,s.backgroundStyle,s.cornerStyle,s.motion]}),['soft','aurora','soft','reduced']);
  pass(channel,'the actual export download and import picker round-trip the complete appearance configuration');

  const legacy={theme:'dark',accent:'teal',fontSize:16,keepCount:3,autoRestore:false,leaveWarn:false,autoSaveMinutes:5,projectPattern:'ProjectFixed',zipPattern:'BundleFixed',expiryDays:60,previewZoom:1.2};
  await importSettings(page,legacy,'legacy-settings.json');
  const upgraded=await page.evaluate(()=>structuredClone(IMOApp.settings.value));
  assert.deepEqual([upgraded.glassStyle,upgraded.backgroundStyle,upgraded.cornerStyle,upgraded.motion],['liquid','ocean','rounded','auto']);
  for(const [key,value]of Object.entries(legacy))assert.equal(upgraded[key],value,key);
  pass(channel,'legacy settings import supplies the new defaults and preserves previous save, naming, zoom and behavior preferences');

  for(const key of ['glassStyle','backgroundStyle','cornerStyle','motion']){
   const before=await page.evaluate(()=>JSON.stringify(IMOApp.settings.value));
   await importSettings(page,{...upgraded,[key]:'invalid-value'},'invalid-'+key+'.json');
   assert.ok((await page.locator('#modalRoot .errorbox').innerText()).includes(key));
   assert.equal(await page.evaluate(()=>JSON.stringify(IMOApp.settings.value)),before);
   await page.locator('#modalRoot [data-action=closeModal]').click();
  }
  pass(channel,'the real importer rejects each invalid appearance enum atomically and explains the invalid field');

  await page.evaluate(()=>{uiSettings=validateUISettings({...uiSettings,theme:'dark',accent:'violet',fontSize:18,tableFont:16,density:'relaxed',glassStyle:'clear',backgroundStyle:'plain',cornerStyle:'soft',motion:'reduced',keepCount:3,autoSaveMinutes:5,autoRestore:false,afterGenerateSave:false,leaveWarn:false,projectPattern:'KeepProjectName',zipPattern:'KeepZipName',expiryDays:90,previewZoom:1.2,shortcuts:false,showHints:false,stickyHeaders:false,startPage:'ship',csvDelimiter:'\t',csvBom:false});applyUISettings();render()});
  const resetBefore=await page.evaluate(()=>({settings:structuredClone(uiSettings),path:projectStorage.path,mode:projectStorage.mode,state:JSON.stringify(state)}));
  await page.locator('[data-action=resetAppearance]').click();await settle(page);
  const resetAfter=await page.evaluate(()=>({settings:structuredClone(uiSettings),defaults:structuredClone(UI_DEFAULTS),keys:[...APPEARANCE_SETTING_KEYS],path:projectStorage.path,mode:projectStorage.mode,state:JSON.stringify(state)}));
  assert.equal(resetAfter.keys.length,9);
  for(const [key,value]of Object.entries(resetBefore.settings))assert.equal(resetAfter.settings[key],resetAfter.keys.includes(key)?resetAfter.defaults[key]:value,key);
  assert.equal(resetAfter.path,resetBefore.path);assert.equal(resetAfter.mode,resetBefore.mode);assert.equal(resetAfter.state,resetBefore.state);
  assert.equal(await page.locator('#authorCredit').innerText(),author);
  pass(channel,'restore appearance resets exactly nine fields and preserves project data, save location, naming and other settings');

  await page.setViewportSize({width:1280,height:800});await openGlassOptions(page);
  await page.locator('.appearance-settings [data-ui-pref=motion]').scrollIntoViewIfNeeded();
  await page.locator('#content').evaluate(e=>{e.scrollTop=Math.min(220,e.scrollHeight-e.clientHeight)});await settle(page);
  const scrollBefore=await page.locator('#content').evaluate(e=>e.scrollTop);assert.ok(scrollBefore>0);
  await select(page,'motion','reduced');
  const scrollAfter=await page.locator('#content').evaluate(e=>e.scrollTop);
  assert.ok(Math.abs(scrollAfter-scrollBefore)<=1,JSON.stringify({scrollBefore,scrollAfter}));
  assert.equal(await page.locator('#appearanceGlassOptions').evaluate(e=>e.open),true);
  pass(channel,'changing an appearance choice preserves settings scroll and the expanded details state');

  await select(page,'glassStyle','liquid');await select(page,'backgroundStyle','ocean');await select(page,'motion','auto');
  await media(cdp,'reduce','no-preference');
  await page.waitForFunction(()=>document.documentElement.dataset.effectsMotion==='reduced');
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
  assert.equal(await page.locator('#studioGlassBackdrop').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.equal(await page.evaluate(()=>StudioGlass.status.reducedMotion),true);
  await media(cdp,'no-preference','no-preference');
  await page.waitForFunction(()=>document.documentElement.dataset.effectsMotion==='full');
  pass(channel,'system reduced motion is honored and can return to the automatic preference through CDP media changes');

  await media(cdp,'no-preference','reduce');
  await page.waitForFunction(()=>document.documentElement.dataset.effectsTransparency==='reduced');
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-transparency: reduce)').matches),true);
  assert.equal(await page.evaluate(()=>StudioGlass.status.reducedTransparency),true);
  assert.equal(await page.locator('.portbar').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
  assert.equal(await page.locator('html').getAttribute('data-effects-motion'),'reduced');
  await media(cdp);await page.waitForFunction(()=>document.documentElement.dataset.effectsTransparency==='full');
  await select(page,'glassStyle','clear');
  assert.equal(await page.locator('.portbar').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
  assert.equal(await page.locator('html').getAttribute('data-effects-transparency'),'reduced');
  await select(page,'glassStyle','liquid');
  pass(channel,'system reduced transparency and the clear mode both remove blur and decorative motion');

  const large=await browser.newContext({viewport:{width:3840,height:2160},deviceScaleFactor:2,reducedMotion:'no-preference',colorScheme:'light'});
  await large.setOffline(true);const largePage=await large.newPage();observe(largePage,channel+'-4k');await ready(largePage);
  const largeBefore=await largePage.evaluate(()=>({...StudioGlass.status,dpr:devicePixelRatio,width:document.querySelector('#studioGlassBackdrop').width,height:document.querySelector('#studioGlassBackdrop').height}));
  assert.equal(largeBefore.dpr,2);assert.ok(largeBefore.pixelCount>0&&largeBefore.pixelCount<=2000000);assert.equal(largeBefore.pixelCount,largeBefore.width*largeBefore.height);
  await largePage.waitForTimeout(650);
  const largeAfter=await largePage.evaluate(()=>StudioGlass.status);
  assert.equal(largeAfter.paintCount,largeBefore.paintCount);
  await noLegacyFilters(largePage);report.metrics[channel+'-4k']={before:largeBefore,after:largeAfter};
  await large.close();
  pass(channel,'a real 4K DPR-2 context stays below two million backdrop pixels and does not repaint while idle');

  await page.evaluate(async data=>{const blank=blankState();state={...blank,...data,preferences:{...blank.preferences,...data.preferences},multiport:blank.multiport};uiSettings.leaveWarn=false;uiSettings.afterGenerateSave=false;changed();await MultiPort.create([],{includeCurrent:true});currentView='arrival';render()},fixture);
  for(const viewport of [{width:844,height:390},{width:390,height:480}]){
   await page.setViewportSize(viewport);await settle(page);
   const inputs=page.locator('[data-grid=arrival] input[data-table][data-field]:not([readonly]):not([type=hidden])');let input;
   for(const candidate of await inputs.all())if(await candidate.isVisible()){input=candidate;break}
   assert.ok(input,'a visible editable crew field is available');
   await input.scrollIntoViewIfNeeded();await input.click();
   const original=await input.inputValue();await input.fill('SCREEN TEST');assert.equal(await input.inputValue(),'SCREEN TEST');await input.fill(original);
   const bounds=await input.evaluate(e=>{const a=e.getBoundingClientRect(),c=document.querySelector('#content').getBoundingClientRect(),d=document.querySelector('.liquid-dock').getBoundingClientRect();return {input:{top:a.top,bottom:a.bottom,height:a.height},content:{top:c.top,bottom:c.bottom,height:c.height},dock:{top:d.top,bottom:d.bottom},overflow:document.documentElement.scrollWidth>innerWidth}});
   assert.equal(bounds.overflow,false);
   assert.ok(bounds.content.height>=140,JSON.stringify(bounds));
   assert.ok(bounds.input.top>=bounds.content.top-1&&bounds.input.bottom<=Math.min(bounds.content.bottom,bounds.dock.top)+1,JSON.stringify(bounds));
   assert.equal(await page.locator('.footer [data-action=saveProject]').isVisible(),true);
   assert.equal(await page.locator('.footer [data-action=generateAll]').isVisible(),true);
   report.metrics[channel+'-'+viewport.width+'x'+viewport.height]=bounds;
  }
  await noLegacyFilters(page);
  pass(channel,'844x390 and 390x480 retain a usable editor, an unobscured editable row and available save/generate actions');
  await context.close();
 }catch(e){report.failures.push({channel,message:e.message,stack:e.stack});console.error('FAIL '+channel+': '+e.message)}finally{if(browser)await browser.close()}
}

assert.equal(report.requests.length,0,'the offline application attempted a network request');
assert.equal(report.errors.length,0,'the application raised a page error');
report.success=report.failures.length===0;
await fs.writeFile('work/yzrt-appearance-report.json',JSON.stringify(report,null,2));
if(report.failures.length)throw Error(report.failures.map(e=>e.channel+': '+e.message).join('\n'));
console.log('PASSED '+report.checks.length+' appearance groups');
