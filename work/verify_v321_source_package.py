from pathlib import Path
import json,os,subprocess,sys,time,zipfile
root=Path(__file__).resolve().parent.parent;target=root/'work'/('source-v321-qa-'+str(int(time.time()*1000)))
with zipfile.ZipFile(root/'outputs'/'IMO_Liquid_Glass_v3.2.1_开发源码.zip') as z:
 assert z.testzip() is None
 z.extractall(target)
checkout=target/'IMO_Studio_v3_源码'
environment=dict(os.environ,IMO_NODE_MODULES=str((root/'node_modules').resolve()))
r=subprocess.run([sys.executable,'work/build.py'],cwd=checkout,env=environment,capture_output=True,text=True,encoding='utf-8')
assert r.returncode==0,r.stdout+'\n'+r.stderr
html=(checkout/'outputs'/'IMO文件包生成器'/'打开生成器.html').read_text(encoding='utf-8')
assert '__APP_' not in html and 'fileLibrary' in html and 'Liquid Glass 3.2.1' in html
assert 'imo-yzrt-license' in html and 'css_glass.js' in html and 'fusion_glass.js' not in html
assert (checkout/'work'/'reference-yzrt'/'LICENSE').is_file()
assert len(list((checkout/'outputs'/'IMO文件包生成器'/'内置空模板').glob('*.xlsx')))==10
report={'passed':True,'sourceCheckout':str(checkout),'independentBuild':True,'dependencies':'Locally installed pinned dependencies supplied with IMO_NODE_MODULES; no network needed.'}
(root/'work'/'prism321-source-package-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS version 3.2.1 source ZIP builds independently from a fresh extracted directory')
