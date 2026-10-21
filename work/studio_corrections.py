from pathlib import Path
P=Path(__file__).resolve().parent
p=P/'app_shell.js';s=p.read_text(encoding='utf-8')
s=s.replace("$('#nav').innerHTML=nav();$('#topTitle')", "$('#nav').innerHTML=nav();const picker=$('#mobilePageSelect');if(picker){picker.innerHTML='<optgroup label=\"本港资料\">'+[['voyage','靠港资料'],['crewChanges','人员变动'],...documents.map(([v,l])=>[v,l]),['check','预览与输出']].map(([v,l])=>`<option value=\"${v}\">${l}</option>`).join('')+'</optgroup><optgroup label=\"常用资料\">'+[['declarationDefaults','申报默认方案'],['ship','船舶档案'],['profiles','船员档案'],['records','工程记录'],['settings','总设置'],['help','使用说明']].map(([v,l])=>`<option value=\"${v}\">${l}</option>`).join('')+'</optgroup>';picker.value=view}$('#topTitle')")
s=s.replace("  const el=e.target;\n", "  const el=e.target;\n  if(el.id==='mobilePageSelect'){actions.wsGo({dataset:{view:el.value}});return}\n")
# Source uses CRLF or LF depending on editor; replacement above normalizes on write.
if "el.id==='mobilePageSelect'" not in s:
 s=s.replace("  const el=e.target;", "  const el=e.target;\n  if(el.id==='mobilePageSelect'){actions.wsGo({dataset:{view:el.value}});return}")
s=s.replace(" const ready=IMOApp.ready;", " const historyTools=$('.history-tools');if(historyTools)$('#topTitle').closest('.top').append(historyTools);\n const ready=IMOApp.ready;")
# Delete dead two-sidebar functions from the superseded structure.
a=s.index(' function portRail(){');b=s.index(' function voyageDetails()',a);s=s[:a]+s[b:]
a=s.index(' function captureFocus(){');b=s.index(' function renderApp()',a);s=s[:a]+s[b:]
p.write_text(s,encoding='utf-8')
p=P/'app.html';s=p.read_text(encoding='utf-8').replace('<nav id="nav"></nav>', '<div class="mobile-page-picker"><select id="mobilePageSelect" aria-label="选择要打开的资料或文件"></select></div><nav id="nav"></nav>');p.write_text(s,encoding='utf-8')
# Update test navigation to reflect the actual new flow, without relaxing assertions.
for name in ['verify_multiport_stock_browser.mjs','verify_v2_confirmations.mjs']:
 p=P/name;s=p.read_text(encoding='utf-8').replace("'[data-action=wsTab][data-tab=stores]'", "'[data-action=wsGo][data-view=stores]'")
 s=s.replace("await page.locator('[data-action=wsTab][data-tab=declarations]').click();await page.locator('[data-action=wsEditor][data-view=health]').click();", "await page.locator('[data-action=wsGo][data-view=health]').click();")
 if name=='verify_multiport_stock_browser.mjs':
  s=s.replace("await page.locator('[data-bind=\"voyage.mode\"]').selectOption('departure');", "await page.evaluate(()=>{currentView='voyage';render()});await page.locator('[data-bind=\"voyage.mode\"]').selectOption('departure');await page.evaluate(()=>{currentView='stores';render()});")
 p.write_text(s,encoding='utf-8')
p=P/'capture_studio.mjs';s=p.read_text(encoding='utf-8').replace("state.voyage.stay='2 DAYS';", "state.voyage.stay='2 DAYS';state.stores=[{id:'demo-cigs',name:'Cigarette (200sticks/Ctn)',quantity:'20',unit:'Ctn',location:'BONDED STORE',category:''},{id:'demo-beer',name:'Beer (330ml × 24 cans)',quantity:'12',unit:'Case',location:'BONDED STORE',category:''},{id:'demo-rope',name:'Rope fibre',quantity:'2400',unit:'m',location:'DECK STORES',category:''},{id:'demo-paint',name:'Paints',quantity:'2060',unit:'Ltrs',location:'DECK STORES',category:''},{id:'demo-fuel',name:'VLSFO',quantity:'1056',unit:'MT',location:'ENGINE STORES',category:''},{id:'demo-rice',name:'Rice',quantity:'650',unit:'kgs',location:'PROVISIONS',category:''},{id:'demo-beef',name:'Beef',quantity:'210',unit:'kgs',location:'PROVISIONS',category:''}];")
p.write_text(s,encoding='utf-8')
