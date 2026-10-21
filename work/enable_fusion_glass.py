from pathlib import Path
P=Path(__file__).resolve().parent
p=P/'build.py';s=p.read_text(encoding='utf-8').replace("values['APP_STYLE']=(P/'document_shell.css').read_text(encoding='utf-8')", "values['APP_STYLE']=(P/'document_shell.css').read_text(encoding='utf-8')+'\\n'+(P/'fusion_glass.css').read_text(encoding='utf-8')");s=s.replace("('APP_HELP','app_help.js')", "('APP_HELP','app_help.js'),('FUSION_GLASS','fusion_glass.js')");p.write_text(s,encoding='utf-8')
p=P/'app.html';s=p.read_text(encoding='utf-8').replace('<script>__APP_SHELL__</script>', '<script>__APP_SHELL__</script><script>__FUSION_GLASS__</script>');p.write_text(s,encoding='utf-8')
p=P/'package_v21.py';s=p.read_text(encoding='utf-8').replace("'document_shell.css'", "'document_shell.css','fusion_glass.css'");p.write_text(s,encoding='utf-8')
p=P/'final_v21_check.mjs';s=p.read_text(encoding='utf-8').replace('scripts.length,34','scripts.length,35').replace('34 local scripts','35 local scripts');p.write_text(s,encoding='utf-8')
