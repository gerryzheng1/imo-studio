from pathlib import Path
P=Path(__file__).resolve().parent
p=P/'verify_source_package.py';s=p.read_text(encoding='utf-8').replace('2.0.0','2.1.0').replace('IMO_Studio_v2_源码','IMO_Studio_v21_源码').replace("'v2-source-package-verification.json'", "'studio-v21-source-package-verification.json'");p.write_text(s,encoding='utf-8')
p=P/'package_v21.py';s=p.read_text(encoding='utf-8');s=s.replace("print(json.dumps(report,ensure_ascii=False))", "shutil.copy2(out/'IMO_Generator.html',out/'IMO_Studio_2.1.html')\nfor name,target in [('desktop','新版界面.png'),('defaults','申报默认方案.png'),('restore-preview','个人物品快照.png')]:shutil.copy2(root/'.impeccable'/'review'/'studio'/(name+'.png'),out/target)\nprint(json.dumps(report,ensure_ascii=False))")
s=s.replace("'baseline-state.json'", "'studio-direction.md','studio-finish-review.md','baseline-state.json'")
p.write_text(s,encoding='utf-8')
