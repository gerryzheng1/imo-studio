from pathlib import Path
import json, os, subprocess, sys, time, zipfile
root=Path(__file__).resolve().parent.parent
target=root/'work'/('source-qa-'+str(int(time.time()*1000)))
with zipfile.ZipFile(root/'outputs'/'IMO_Studio_v2.1.0_开发源码.zip') as archive:
    assert archive.testzip() is None
    archive.extractall(target)
checkout=target/'IMO_Studio_v21_源码'
environment=dict(os.environ,IMO_NODE_MODULES=str((root/'node_modules').resolve()))
result=subprocess.run([sys.executable,'work/build.py'],cwd=checkout,env=environment,capture_output=True,text=True,encoding='utf-8')
assert result.returncode==0,result.stdout+'\n'+result.stderr
html=(checkout/'outputs'/'IMO文件包生成器'/'打开生成器.html').read_text(encoding='utf-8')
assert '__APP_' not in html and 'IMO Studio' in html
assert len(list((checkout/'outputs'/'IMO文件包生成器'/'内置空模板').glob('*.xlsx')))==10
report={'passed':True,'sourceCheckout':str(checkout),'independentBuild':True,'externalDependencySource':'Locally installed pinned dependencies supplied with IMO_NODE_MODULES, no network or original checkout path needed.'}
(root/'work'/'studio-v21-source-package-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS source ZIP builds independently from a fresh extracted directory')
