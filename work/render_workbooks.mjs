import fs from 'node:fs/promises';
import path from 'node:path';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
import JSZip from 'jszip';
const root=path.resolve('work'),out=path.join(root,'renders');await fs.mkdir(out,{recursive:true});
const ranges={1:['A1:N33','A1:M2'],2:['A1:N33','A1:M2'],3:['B2:J32'],4:['B3:H23'],5:['B2:K49'],6:['A1:J55','A4:K30'],7:['B2:K36'],8:['B2:F21'],9:['B5:K37'],10:['B3:G36']};
const inventory=JSON.parse(await fs.readFile(path.join(root,'inventory.json'),'utf8'));
for(const group of ['templates','generated/baseline']){
 for(const info of inventory){const name=(await fs.readdir(path.join(root,group))).find(x=>Number(x.match(/^\d+/)?.[0])===info.id);const p=path.join(root,group,name);try{let input=await FileBlob.load(p);if(info.id===4){const z=await JSZip.loadAsync(await fs.readFile(p));z.file('xl/workbook.xml',(await z.file('xl/workbook.xml').async('string')).replaceAll('PORTS OF CALL ','PORTS OF CALL'));input=await z.generateAsync({type:'arraybuffer'})}const wb=await SpreadsheetFile.importXlsx(input);for(let i=0;i<info.sheets.length;i++){const dest=path.join(out,(group==='templates'?'original':'baseline')+'-'+info.id+'-'+i+'.png');try{await fs.access(dest);continue}catch{}const blob=await wb.render({sheetName:info.sheets[i].name.trim(),range:ranges[info.id][i],scale:1.1});await fs.writeFile(dest,new Uint8Array(await blob.arrayBuffer()));console.log('RENDERED',path.basename(dest))}}catch(e){console.log('RENDER_FAILED',info.id,group,e.message);process.exitCode=1}}
}
