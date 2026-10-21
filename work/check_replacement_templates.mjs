import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const bytes=await fs.readFile('C:/1/Zheng/GPT/IMO/IMO文件包生成器_Liquid_Glass_v3.2.0/IMO文件包生成器/内置空模板.zip');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage();await p.goto(pathToFileURL(path.resolve('outputs/IMO_Generator.html')).href);await p.evaluate(()=>IMOApp.ready);
 const report=await p.evaluate(async base64=>{templates.clear();importProblems=[];const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));await acceptTemplates([new File([bytes],'replacement.zip')],{replace:true});return {problems:importProblems,templates:[...templates].map(([id,list])=>({id,name:list[0].name,count:list.length,errors:mappingErrors(CONFIG.templates.find(t=>t.id===id),list[0].book),sheets:list[0].book.sheets.map(s=>s.name)}))}},bytes.toString('base64'));
 await fs.writeFile('work/template-replacement-compatibility.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close()}
