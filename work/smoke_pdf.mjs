import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const c=await browser.newContext({viewport:{width:1600,height:1100}});await c.setOffline(true);const p=await c.newPage();const errors=[],http=[];p.on('pageerror',e=>errors.push(e.message));c.on('request',r=>{if(/^https?:/.test(r.url()))http.push(r.url())});p.on('console',m=>{if(m.type()==='error')console.log('console error',m.text().slice(0,500))});
 await p.goto(pathToFileURL(path.resolve('outputs/IMO_Generator.html')).href);await p.waitForFunction(()=>!!IMOApp.pdfImport);
 await p.locator('#shipPdfFile').setInputFiles(path.resolve('work/pdf-input/9.TRTR Ship particulars.pdf'));await p.waitForFunction(()=>!busy,{},{timeout:60000});
 console.log('modal',await p.locator('#modalRoot').innerText());
 const result=await p.evaluate(()=>shipPdfPending?{fileName:shipPdfPending.fileName,pageCount:shipPdfPending.pageCount,pages:shipPdfPending.pages,candidates:shipPdfPending.candidates}:null);
 await fs.writeFile('work/pdf-input/browser-extracted.json',JSON.stringify(result,null,2));
 await p.screenshot({path:'work/pdf-input/import-dialog.png',fullPage:true});
 console.log('errors',errors,'http',http);
}finally{await browser.close()}
