from pathlib import Path
P=Path(__file__).resolve().parent
def replace_file(name,old,new):
 p=P/name;s=p.read_text(encoding='utf-8');assert old in s,(name,old[:100]);p.write_text(s.replace(old,new),encoding='utf-8')
replace_file('build.py',"('ROUTE_INVENTORY','route_inventory.js')", "('DECLARATION_DEFAULTS','declaration_defaults.js'),('EFFECTS_ARCHIVE','effects_archive.js'),('VIEW_MEMORY','view_memory.js'),('ROUTE_INVENTORY','route_inventory.js')")
replace_file('app.html','<script>__ROUTE_INVENTORY__</script>','<script>__DECLARATION_DEFAULTS__</script><script>__EFFECTS_ARCHIVE__</script><script>__VIEW_MEMORY__</script><script>__ROUTE_INVENTORY__</script>')
replace_file('multiport.js',"ROUTE_KEYS=['ports','plannedPorts','storeSnapshots','provisionRates']", "ROUTE_KEYS=['ports','plannedPorts','storeSnapshots','provisionRates','declarationDefaults','effectsSnapshots']")
replace_file('multiport.js',"provisionRates:clone(s.provisionRates||{}),customPorts:", "provisionRates:clone(s.provisionRates||{}),declarationDefaults:clone(s.declarationDefaults),effectsSnapshots:clone(s.effectsSnapshots||[]),customPorts:")
replace_file('multiport.js',"next.workflow={...clone(source.workflow),lastGenerated:null};return next;", "next.workflow={...clone(source.workflow),lastGenerated:null};next.declarationDefaults=clone(w.shared.declarationDefaults||source.declarationDefaults);next.effectsSnapshots=clone(w.shared.effectsSnapshots||source.effectsSnapshots||[]);next.effectsAsOf={port:'',date:'',snapshotId:''};next.declarationSources={};return next;")
replace_file('multiport.js',"const t=newTask(data,plan.id,key);", "DeclarationDefaults.applyTo(data,DeclarationDefaults.keys,{automatic:true});const t=newTask(data,plan.id,key);")
replace_file('multiport.js',"sharedCheck[k]=clone(w.shared[k]);", "sharedCheck[k]=clone(w.shared[k]??sharedCheck[k]);")
replace_file('multiport.js',"'storeSnapshots','provisionRates','nilItems'", "'storeSnapshots','provisionRates','declarationDefaults','effectsSnapshots','nilItems'")
replace_file('editors.js','input.focus()', 'input.focus({preventScroll:true})')
