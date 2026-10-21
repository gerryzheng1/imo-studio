from pathlib import Path
import shutil
P=Path(__file__).parent
if not (P/'before-pdf.html').exists():shutil.copy2(P.parent/'outputs/IMO_Generator.html',P/'before-pdf.html')
def replace(name,old,new):
 p=P/name;s=p.read_text(encoding='utf-8')
 if old not in s:raise RuntimeError('missing anchor: '+name+' '+old[:80])
 p.write_text(s.replace(old,new,1),encoding='utf-8')
replace('app.html',"script-src 'unsafe-inline';", "script-src 'unsafe-inline' blob:; worker-src blob:;")
replace('app.html','单文件离线版 1.0','单文件离线版 1.1')
replace('app.html','<input id="templateFiles"','<input id="shipPdfFile" type="file" accept=".pdf,application/pdf"><input id="templateFiles"')
replace('app.html','<script>__CORE__</script><script>__ENGINE__</script><script>__UI__</script>', '<script id="imo-pdf-main" type="application/octet-stream">__PDF_MAIN__</script>\n<script id="imo-pdf-worker" type="application/octet-stream">__PDF_WORKER__</script>\n<script id="imo-pdf-assets" type="application/octet-stream">__PDF_ASSETS__</script>\n<script id="imo-pdf-license" type="text/plain">__PDF_LICENSE__</script>\n<script>__CORE__</script><script>__ENGINE__</script><script>__UI__</script><script>__PDF__</script>')
replace('ui.js','<button data-action="shipCandidates">从已选择模板读取候选值</button>','<div class="row"><button class="primary" data-action="pickShipPdf">导入船舶资料 PDF</button><button data-action="shipCandidates">从已选择模板读取候选值</button></div>')
replace('ui.js',"function shipView(){return heading('船舶档案','公共资料填写一次，写入各表实际对应位置。确认后可以跨航次复用。')+", "function shipView(){return heading('船舶档案','公共资料填写一次，写入各表实际对应位置。确认后可以跨航次复用。支持本地读取 Ship Particulars PDF，逐项核对后导入。')+shipPdfSourceNote()+")
replace('ui.js','<button data-action="shipCandidates">读取船舶静态资料</button>', '<button data-action="pickShipPdf">读取船舶资料 PDF</button><button data-action="shipCandidates">读取船舶静态资料</button>')
replace('ui.js','工程保存船舶与船员档案、本次资料、稳定人员标识、图片选择和完整字段映射。','工程保存船舶与船员档案、本次资料、稳定人员标识、图片选择和完整字段映射。PDF 导入后的字段和来源记录也会保存，PDF 原文件不包含在工程中。')
replace('ui.js','<div class="card"><h2>数据导入与人员关联</h2>', '<div class="card"><h2>读取船舶资料 PDF</h2><p>在“船舶档案”点击“导入船舶资料 PDF”，选择文字型 PDF，核对各字段、来源页和公司用途后导入。支持提取船名、IMO、呼号、船旗、船籍港、船公司和净吨；PDF 中未列出的字段不覆盖现值。船长姓名不会从电话或邮箱推断。</p><p>国际吨位表读取 NET 列，避免误用 GROSS 或苏伊士 / 巴拿马吨位。OWNER、管理公司和租家分别显示供选择。设计定员和建造日期不作为本次人数或航次日期。</p><p>PDF.js 5.6.205（Apache-2.0）及文字读取所需字体资源已内嵌，离线读取，无上传。PDF 原文件不嵌入 HTML，也不保存到工程；工程仅保存导入字段和来源记录。暂不支持扫描件 OCR、加密 PDF，最大 25MB、50 页。推荐当前版本 Chrome / Edge。</p></div><div class="card"><h2>数据导入与人员关联</h2>')
print('PDF import integrated')
