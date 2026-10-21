import {spawn} from 'node:child_process';
import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const file of ['verify_stay_prefill.mjs','verify_completed_ports.mjs','verify_route_navigation.mjs','verify_notice_fix.mjs','verify_replacement_templates.mjs','verify_flow32.mjs','verify_route_inventory.mjs','verify_liquid_reset_regression.mjs','verify_liquid_reset_workflow.mjs','verify_yzrt_navigation.mjs','verify_yzrt_appearance.mjs','verify_modal_keyboard.mjs','verify_home_scroll.mjs','verify_liquid_reset_outputs.mjs','verify_multiport.mjs','verify_liquid_reset_stock.mjs']){
 const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(root,'work',file)],{cwd:root,stdio:'inherit',windowsHide:true});child.on('error',reject);child.on('exit',resolve)});
 if(code!==0)process.exit(code||1);
}
