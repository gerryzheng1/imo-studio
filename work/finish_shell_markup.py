from pathlib import Path
p=Path(__file__).resolve().parent/'app.html'
s=p.read_text(encoding='utf-8').replace('<nav id="nav"></nav>','<div class="mobile-tools"><button data-action="wsGo" data-view="check">输出</button><button data-action="wsGo" data-view="declarationDefaults">默认方案</button><button data-action="wsGo" data-view="settings">设置</button></div><nav id="nav"></nav>')
p.write_text(s,encoding='utf-8')
