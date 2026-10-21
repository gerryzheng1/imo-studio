from pathlib import Path
p=Path(__file__).with_name('app_shell.js');s=p.read_text(encoding='utf-8')
a=s.index('<div class="ws-settings"><section class="card">',s.index(' function settings(){'))
b=s.index('</section>',a)+len('</section>')
s=s[:a]+'<div class="ws-settings">${appearanceSettingsPanel()}'+s[b:]
s=s.replace('本机离线 · Liquid Glass 3.0','本机离线 · Liquid Glass 3.1').replace("dataset.uiVersion='3.0'","dataset.uiVersion='3.1'")
p.write_text(s,encoding='utf-8')
p=Path(__file__).with_name('app.html');s=p.read_text(encoding='utf-8').replace('Liquid Glass 3.0','Liquid Glass 3.1');p.write_text(s,encoding='utf-8')
print('Integrated simple appearance controls in the active settings page')
