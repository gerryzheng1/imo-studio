from pathlib import Path
import re
P=Path(__file__).resolve().parent
p=P/'effects_archive.js';s=p.read_text(encoding='utf-8');old='<strong>${plan.matches.length} 人可以匹配</strong><p>将恢复'
new='<strong>${plan.matches.length} 人可以匹配</strong>${plan.matches.length?\'<ul class="snapshot-match-names" aria-label="将恢复的船员">\'+plan.matches.map(r=>\'<li>\'+esc(r.name||r.id)+\'</li>\').join(\'\')+\'</ul>\':\'\'}<p>将恢复'
assert old in s;s=s.replace(old,new);p.write_text(s,encoding='utf-8')
p=P/'settings.js';s=p.read_text(encoding='utf-8').replace("blue:'#007aff',teal:'#00897b',violet:'#8354d8'", "blue:'#005fc5',teal:'#006f64',violet:'#7140bc'");p.write_text(s,encoding='utf-8')
# Font size is a real existing preference: use rem for chrome, leaving table typography independent.
p=P/'document_shell.css';s=p.read_text(encoding='utf-8');s=s.replace('font-size:14px;line-height:1.55','font-size:14px;line-height:1.55',1)
a=s.index('\n:root[data-theme=dark]');s=s[:a]+re.sub(r'font-size:(\d+)px',lambda m:'font-size:'+format(int(m[1])/14,'.6g')+'rem',s[a:]);s+='\n.snapshot-match-names{columns:2;max-height:200px;overflow:auto;padding-left:22px;margin:14px 0;font-size:12px;color:var(--ink)}.snapshot-match-names li{padding:2px 0;break-inside:avoid}@media(max-width:760px){.snapshot-match-names{columns:1}}\n'
p.write_text(s,encoding='utf-8')
