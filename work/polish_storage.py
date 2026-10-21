from pathlib import Path
P=Path(__file__).parent
f=P/'project_storage.js';s=f.read_text(encoding='utf-8')
s=s.replace("notice:''};return projectStorage}","notice:s.notice||''};return projectStorage}")
s=s.replace("toast('工程已保存：'+result.path+'；历史最多保留 '+projectLimit()+' 条。')", "toast('工程已保存：'+result.name+'（历史最多 '+projectLimit()+' 条）')")
# Cancelling a system picker is an ordinary cancellation, never a false save result.
s=s.replace("actions.saveProject=()=>task(()=>saveProjectSnapshot());", "async function saveProjectFlow(options){try{return await saveProjectSnapshot(options)}catch(e){if(e.name==='AbortError')return false;throw e}}\nactions.saveProject=()=>task(()=>saveProjectFlow());")
s=s.replace("actions.saveProjectAs=()=>task(()=>saveProjectSnapshot({as:true}));", "actions.saveProjectAs=()=>task(()=>saveProjectFlow({as:true}));")
f.write_text(s,encoding='utf-8')
f=P/'settings.js';s=f.read_text(encoding='utf-8')
old="setInterval(()=>{if(!uiSettings.autoSaveMinutes"
assert old in s
s=s.replace(old,"function autoSaveProjectIfDue(){if(!uiSettings.autoSaveMinutes")
s=s.replace("if(!launchToken&&!projectFolder)return;task(async()=>", "if(!launchToken&&!projectFolder)return;return task(async()=>")
s=s.replace("}},30000);", "}};setInterval(autoSaveProjectIfDue,30000);")
# The replacement above follows the actual ending of the callback below.
s=s.replace("})},30000);", "})};setInterval(autoSaveProjectIfDue,30000);")
s=s.replace("if(e.key.toLowerCase()==='s'){e.preventDefault();e.shiftKey?", "if(e.key.toLowerCase()==='s'){e.preventDefault();if(busy){toast('当前操作正在处理，请完成后再保存工程。');return}e.shiftKey?")
s=s.replace("const csvSettingsBefore=csvText;", "")
s=s.replace("const exportCsvSettingsBefore=exportCsv;", "")
s=s.replace("validateUISettings,applyUISettings,zipPackageName};", "validateUISettings,applyUISettings,zipPackageName,autoSaveProjectIfDue};")
f.write_text(s,encoding='utf-8')
f=P/'core.js';s=f.read_text(encoding='utf-8').replace("$('#status').textContent=message;}","$('#status').textContent=message;$('#status').title=message;}")
f.write_text(s,encoding='utf-8')
