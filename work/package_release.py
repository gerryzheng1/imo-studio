from pathlib import Path
import zipfile,json,hashlib
P=Path(__file__).parent;out=P.parent/'outputs';folder=out/'IMO文件包生成器'
guide=(out/'使用说明_v1.2.md').read_text(encoding='utf-8')
(out/'使用说明与验收记录.md').write_text(guide,encoding='utf-8')
(folder/'使用说明.md').write_text(guide,encoding='utf-8')
quick='''IMO 文件包生成器 1.2 — 开始使用

1. 请先完整解压，再双击“启动生成器.exe”。保留旁边的 assets 文件夹。
2. 10 份空模板自动载入。已有工程请导入一次，再保存。
3. 填写或导入船舶、船员、本次航次和专项资料；健康与 NIL 须明确确认。
4. 检查资料后生成 ZIP，其中含 10 个独立可编辑 XLSX。
5. 保存工程默认写入同目录的“保存工程”，按日期时间命名，最多留存最新 10 份。
6. 下次运行启动器自动读取最新工程；另存为可保留独立备份。
7. 左下角“总设置”可选择保存文件夹、自动保存、主题、字号和其他操作偏好。

直接打开“打开生成器.html”也能生成文件，但浏览器首次读写文件夹需要用户选择并授权。
想自动使用同目录“保存工程”，请选择 Windows 启动器。
所有资料在本机处理，启动器只使用 127.0.0.1 本机地址，不上传外部服务。
关闭页面后可从系统托盘菜单退出启动器。

详细用法和已验证功能、实际限制见“使用说明.md”。原生 Excel/WPS 打印尚未完成验收。
'''
(folder/'开始使用.txt').write_text(quick,encoding='utf-8-sig')
# Ship no runtime settings, sessions, or user engineering files.
for part in folder.rglob('*'):
 if part.name in ['本地设置.json','.imo-local-session.json'] or part.name.endswith('.imoproject.json'):raise RuntimeError('Unexpected runtime data in release: '+str(part))
assert not list((folder/'保存工程').iterdir())
archive=out/'IMO文件包生成器_离线版_v1.2.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for part in sorted(folder.rglob('*')):
  rel=part.relative_to(out).as_posix()
  if part.is_dir():z.writestr(rel+'/',b'')
  else:z.write(part,rel)
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert sum(n.endswith('.xlsx') for n in z.namelist())==10
 assert any(n.endswith('/启动生成器.exe') for n in z.namelist())
 assert any(n.endswith('/保存工程/') for n in z.namelist())
checks={}
for name in ['browser-verification.json','secondary-verification.json','pdf-input/pdf-verification.json','v12-verification.json','xml-verification.json','v12-xml-verification.json','storage-settings-verification.json']:
 f=P/name
 if f.exists():
  data=json.loads(f.read_text(encoding='utf-8'));checks[name]=len(data.get('passed',[])) if 'passed' in data else data.get('count')
(P/'release-verification.json').write_text(json.dumps({'checks':checks,'zipBytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()},ensure_ascii=False,indent=2),encoding='utf-8')
print('ZIP bytes:',archive.stat().st_size,'files:',len(list(folder.rglob('*'))),'verification:',json.dumps(checks))
