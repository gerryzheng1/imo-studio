import pathlib,json,base64,zipfile,io,sys
if hasattr(sys.stdout,"reconfigure"):
 sys.stdout.reconfigure(encoding="utf-8")
P=pathlib.Path(__file__).parent
# Install pinned browser dependencies with npm install in the project root.
import os
deps=pathlib.Path(os.environ.get('IMO_NODE_MODULES',str(P.parent/'node_modules'))).resolve()
if not (deps/'jszip').is_dir() or not (deps/'pdfjs-dist').is_dir():
 raise SystemExit('Missing dependencies: run npm install in the project root, or set IMO_NODE_MODULES.')
html=(P/'app.html').read_text(encoding='utf-8')
values={'LIB':(deps/'jszip/dist/jszip.min.js').read_text(encoding='utf-8'),'CONFIG':(P/'config.json').read_text(encoding='utf-8'),'CORE':(P/'core.js').read_text(encoding='utf-8'),'ENGINE':(P/'engine.js').read_text(encoding='utf-8'),'UI':(P/'ui.js').read_text(encoding='utf-8'),'DEFAULT_CONFIG':(P/'default-config.json').read_text(encoding='utf-8'),'PORT_CATALOG':(P/'port-catalog.json').read_text(encoding='utf-8'),'TEMPLATE_PACK':base64.b64encode((P/'default-templates.zip').read_bytes()).decode(),'V12_STYLE':(P/'v12.css').read_text(encoding='utf-8')}
values['LEGACY_TEMPLATE_CONFIG']=(P/'legacy-template-config.json').read_text(encoding='utf-8')
for key,name in [('LAYOUT','layout.js'),('DEFAULTS','defaults.js'),('PORTS','ports.js'),('STORES','stores.js'),('VISUAL','visual.js'),('SETTINGS','settings.js'),('PROJECT_STORAGE','project_storage.js'),('EDITORS','editors.js'),('OUTPUT_OPTIONS','output_options.js'),('HELP','help.js'),('LIFECYCLE','lifecycle.js'),('STORES_ARCHIVE','stores_archive.js'),('PERSON_PORTS','person_ports.js'),('ROUTE_HISTORY','route_history.js'),('NAMING','naming.js'),('HISTORY','history.js'),('WORKFLOW','workflow.js'),('MIGRATION','migration.js'),('DECLARATION_DEFAULTS','declaration_defaults.js'),('EFFECTS_ARCHIVE','effects_archive.js'),('VIEW_MEMORY','view_memory.js'),('ROUTE_INVENTORY','route_inventory.js'),('MULTIPORT','multiport.js'),('MULTIPORT_STOCK','multiport_stock.js'),('MULTIPORT_EXPORT','multiport_export.js'),('MULTIPORT_UI','multiport_ui.js'),('APP_SHELL','app_shell.js'),('APP_HELP','app_help.js'),('FUSION_GLASS','css_glass.js')]:values[key]=(P/name).read_text(encoding='utf-8')
values['WORKFLOW_STYLE']=(P/'workflow.css').read_text(encoding='utf-8')
values['MULTIPORT_STYLE']=(P/'multiport.css').read_text(encoding='utf-8')
values['APP_STYLE']='\n'.join((P/name).read_text(encoding='utf-8') for name in ['liquid_desk.css','yzrt_material.css','appearance.css','prism_glass.css','flow32.css'])
values['YZRT_LICENSE']=(P/'reference-yzrt'/'LICENSE').read_text(encoding='utf-8')
pdf=deps/'pdfjs-dist'
assets=io.BytesIO()
with zipfile.ZipFile(assets,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for folder in ['cmaps','standard_fonts']:
  for p in sorted((pdf/folder).iterdir()):
   if p.is_file():z.writestr(folder+'/'+p.name,p.read_bytes())
values.update({'PDF_MAIN':base64.b64encode((pdf/'build/pdf.min.mjs').read_bytes()).decode(),'PDF_WORKER':base64.b64encode((pdf/'build/pdf.worker.min.mjs').read_bytes()).decode(),'PDF_ASSETS':base64.b64encode(assets.getvalue()).decode(),'PDF_LICENSE':(pdf/'LICENSE').read_text(encoding='utf-8'),'PDF':(P/'pdf_import.js').read_text(encoding='utf-8')})
source=html
for k,v in values.items():html=html.replace('__'+k+'__',v.replace('</script','<\\/script'))
out=P.parent/'outputs'/'IMO_Generator.html';out.parent.mkdir(exist_ok=True);out.write_text(html,encoding='utf-8')
print(str(out),out.stat().st_size)
# File:// compatible folder edition: classic script tags; no fetch, modules or server.
folder=out.parent/'IMO文件包生成器';folder.mkdir(exist_ok=True)
assets_dir=folder/'assets';assets_dir.mkdir(exist_ok=True)
folder_html=source.replace("script-src 'unsafe-inline' blob:","script-src 'self' 'unsafe-inline' blob:").replace("style-src 'unsafe-inline'","style-src 'self' 'unsafe-inline'").replace("connect-src 'none'","connect-src 'self'")
for key,file in [('LIB','jszip.min.js'),('CORE','core.js'),('LAYOUT','layout.js'),('ENGINE','engine.js'),('UI','ui.js'),('PDF','pdf_import.js'),('DEFAULTS','defaults.js'),('PORTS','ports.js'),('STORES','stores.js'),('VISUAL','visual.js'),('SETTINGS','settings.js'),('PROJECT_STORAGE','project_storage.js'),('EDITORS','editors.js'),('OUTPUT_OPTIONS','output_options.js'),('HELP','help.js'),('LIFECYCLE','lifecycle.js'),('STORES_ARCHIVE','stores_archive.js'),('PERSON_PORTS','person_ports.js'),('ROUTE_HISTORY','route_history.js'),('NAMING','naming.js'),('HISTORY','history.js'),('WORKFLOW','workflow.js'),('MIGRATION','migration.js'),('DECLARATION_DEFAULTS','declaration_defaults.js'),('EFFECTS_ARCHIVE','effects_archive.js'),('VIEW_MEMORY','view_memory.js'),('ROUTE_INVENTORY','route_inventory.js'),('MULTIPORT','multiport.js'),('MULTIPORT_STOCK','multiport_stock.js'),('MULTIPORT_EXPORT','multiport_export.js'),('MULTIPORT_UI','multiport_ui.js'),('APP_SHELL','app_shell.js'),('APP_HELP','app_help.js'),('FUSION_GLASS','css_glass.js')]:
 (assets_dir/file).write_text(values[key],encoding='utf-8')
 folder_html=folder_html.replace('<script>__'+key+'__</script>','<script src="assets/'+file+'"></script>')
# The PDF reader's embedded bytes live in a local data script for easy packaging.
data_keys={'imo-pdf-main':'PDF_MAIN','imo-pdf-worker':'PDF_WORKER','imo-pdf-assets':'PDF_ASSETS','imo-pdf-license':'PDF_LICENSE'}
data_script=[]
for element_id,key in data_keys.items():
 import re
 folder_html=re.sub(r'<script id="'+element_id+r'"[^>]*>__[A-Z_]+__</script>','',folder_html)
 data_script.append('(function(){var e=document.createElement("script");e.id='+json.dumps(element_id)+';e.type="application/octet-stream";e.textContent='+json.dumps(values[key])+';document.body.append(e)})();')
(assets_dir/'pdf-data.js').write_text('\n'.join(data_script),encoding='utf-8')
folder_html=folder_html.replace('<script src="assets/core.js">','<script src="assets/pdf-data.js"></script><script src="assets/core.js">')
for key,value in values.items():folder_html=folder_html.replace('__'+key+'__',value.replace('</script','<\\/script'))
style=re.search(r'<style>([\s\S]*?)</style>',folder_html)
(assets_dir/'style.css').write_text(style[1],encoding='utf-8')
folder_html=folder_html[:style.start()]+'<link rel="stylesheet" href="assets/style.css">'+folder_html[style.end():]
(folder/'打开生成器.html').write_text(folder_html,encoding='utf-8')
templates_dir=folder/'内置空模板';templates_dir.mkdir(exist_ok=True)
for file in (P/'default-input'/'cleaned').glob('*.xlsx'):(templates_dir/file.name).write_bytes(file.read_bytes())
config_dir=folder/'配置参考';config_dir.mkdir(exist_ok=True)
for source_file in ['config.json','default-config.json','port-catalog.json']:(config_dir/source_file).write_bytes((P/source_file).read_bytes())
(assets_dir/'JSZip-LICENSE.markdown').write_bytes((deps/'jszip/LICENSE.markdown').read_bytes())
(assets_dir/'PDFjs-LICENSE.txt').write_bytes((pdf/'LICENSE').read_bytes())
(folder/'启动生成器.exe').write_bytes((P/'IMO_Launcher.exe').read_bytes())
(folder/'保存工程').mkdir(exist_ok=True)
(config_dir/'LocalLauncher.cs').write_bytes((P/'LocalLauncher.cs').read_bytes())
reference_dir=folder/'第三方源代码'/'yzrt'
for name in ['LICENSE','SOURCE_METADATA.json','纯CSS液态玻璃/index.html','纯CSS液态玻璃/css/styles.css']:
 target=reference_dir/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((P/'reference-yzrt'/name).read_bytes())
(folder/'第三方源码与许可.md').write_bytes((P.parent/'THIRD_PARTY_NOTICES.md').read_bytes())
# Remove only the known, retired generated asset; never touch project saves.
retired_asset=assets_dir/'fusion_glass.js'
if retired_asset.is_file() and 'assets/fusion_glass.js' not in folder_html:retired_asset.unlink()
print('Folder edition ready:',len(list(folder.rglob('*'))),'entries')
