import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1512,height:1050}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('outputs/IMO_Generator.html')).href);await page.evaluate(()=>IMOApp.ready);
 await page.screenshot({path:'work/v2-welcome.png'});
 const baseline=JSON.parse(await fs.readFile('work/baseline-state.json','utf8'));
 await page.evaluate(async s=>{const b=blankState();IMOApp.setState({...b,...s,preferences:{...b.preferences,...s.preferences},multiport:b.multiport});state.plannedPorts=[{id:'design-bne',port:'Brisbane',country:'Australia',arrivalDate:'2026-11-03',departureDate:'2026-11-05',security:'1',remarks:'CARGO OPERATION'},{id:'design-nou',port:'Noumea',country:'New Caledonia',arrivalDate:'2026-11-08',departureDate:'2026-11-09',security:'1',remarks:'CARGO OPERATION'},{id:'design-sha',port:'Shanghai',country:'China',arrivalDate:'2026-11-18',departureDate:'2026-11-20',security:'1',remarks:'CARGO OPERATION'}];state.voyage.linkedPlanId='design-bne';changed();await MultiPort.create(['design-nou','design-sha'],{includeCurrent:true});render()},baseline);
 await page.screenshot({path:'work/v2-workspace.png'});
 await page.locator('[data-action=wsTab][data-tab=stores]').click();await page.screenshot({path:'work/v2-stores.png'});
 await page.locator('[data-action=wsSection][data-section=settings]').click();await page.waitForFunction(()=>!busy);await page.screenshot({path:'work/v2-settings.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('[data-action=wsSection][data-section=workspace]').click();await page.screenshot({path:'work/v2-mobile.png'});
 console.log(JSON.stringify({errors,templates:await page.evaluate(()=>templates.size),tasks:await page.evaluate(()=>MultiPort.tasks().length)}));
}finally{await browser.close()}
