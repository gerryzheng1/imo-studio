from pathlib import Path
import runpy
import shutil

root = Path(__file__).resolve().parent.parent
source = Path(r'C:/Users/bridge/.codex/visualizations/2026/10/18/01a14ed2-8069-7323-8d63-b00192b7860f')
renderer = Path(r'C:/Users/bridge/.codex/plugins/cache/openai-bundled/visualize/1.0.50/skills/visualize/scripts/render.py')
kit = runpy.run_path(str(renderer))
fragment = (source / 'imo-macos-preview.html').read_text(encoding='utf-8')
icons = (root / 'node_modules/lucide/dist/umd/lucide.min.js').read_text(encoding='utf-8').replace('</script', '<\\/script')
document = kit['_render_document']('<script>' + icons + '</script>\n' + fragment, 'IMO 文件包 · 界面效果预览')
destination = root / 'outputs' / '界面效果预览.html'
destination.write_text(document, encoding='utf-8')
shutil.copy2(source / 'preview-desktop.png', root / 'outputs' / '界面效果_主界面.png')
shutil.copy2(source / 'preview-settings.png', root / 'outputs' / '界面效果_总设置.png')
print(destination)
