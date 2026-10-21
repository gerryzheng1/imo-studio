from pathlib import Path
P=Path(__file__).parent
f=P/'ui.js';s=f.read_text(encoding='utf-8')
s=s.replace("v==='plannedPorts'?'未来港口计划':", "v==='settings'?'总设置':v==='plannedPorts'?'未来港口计划':")
s=s.replace('const fn={templates:templateView,','const fn={settings:()=>settingsView(),templates:templateView,')
f.write_text(s,encoding='utf-8')
f=P/'app.html';s=f.read_text(encoding='utf-8')
s=s.replace('<nav id="nav"></nav></aside>','<nav id="nav"></nav><div class="sidebar-bottom"><button data-action="showSettings" class="settings-nav">⚙ 总设置</button></div></aside>')
s=s.replace('所有数据只在当前浏览器处理，无网络请求','所有资料在本机处理，不上传外部服务')
s=s.replace('<button data-action="saveProject">保存工程</button>','<button data-action="saveProject">保存工程</button><button data-action="saveProjectAs">另存为</button><button data-action="projectHistory">工程记录</button>')
s=s.replace('<input id="defaultsFile"','<input id="uiSettingsFile" type="file" accept=".json"><input id="defaultsFile"')
s=s.replace('<script>__VISUAL__</script>','<script>__VISUAL__</script><script>__SETTINGS__</script><script>__PROJECT_STORAGE__</script>')
f.write_text(s,encoding='utf-8')
f=P/'engine.js';s=f.read_text(encoding='utf-8')
s=s.replace("const name='IMO_'+safeName(state.ship.name)+'_'+safeName(port)+'_'+String(v[v.mode+'Date']).replace(/-/g,'')+'.zip';", "const name=typeof zipPackageName==='function'?zipPackageName():'IMO_'+safeName(state.ship.name)+'_'+safeName(port)+'_'+String(v[v.mode+'Date']).replace(/-/g,'')+'.zip';")
f.write_text(s,encoding='utf-8')
f=P/'project_storage.js';s=f.read_text(encoding='utf-8')
s=s.replace("r.onsuccess=()=>resolve(r.result);r.onerror", "r.onsuccess=()=>{if(mode==='get')resolve(r.result)};r.onerror")
old="if(typeof uiSettings!=='object'||uiSettings.autoRestore){if(!await restoreLatestProject(false)&&projectStorage.notice)$('#status').textContent=projectStorage.notice}else if(uiSettings.startPage!=='resume'){currentView=uiSettings.startPage;render()}"
new="const restored=(typeof uiSettings!=='object'||uiSettings.autoRestore)?await restoreLatestProject(false):false;if(!restored){if(typeof uiSettings==='object'&&uiSettings.startPage!=='resume'){currentView=uiSettings.startPage;render()}lastSavedRevision=revision;if(projectStorage.notice)$('#status').textContent=projectStorage.notice}"
assert old in s
s=s.replace(old,new)
f.write_text(s,encoding='utf-8')
# Existing tests retain the original downloadable project workflow via its explicit action.
for name in ['verify_browser.mjs','verify_secondary.mjs','verify_pdf_import.mjs','verify_v12.mjs']:
 f=P/name;s=f.read_text(encoding='utf-8').replace("await page.locator('[data-action=saveProject]').click();","await page.evaluate(()=>actions.exportProject());")
 f.write_text(s,encoding='utf-8')
