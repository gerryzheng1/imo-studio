from pathlib import Path
p=Path(__file__).resolve().parent/'fusion_glass.js';s=p.read_text(encoding='utf-8').replace('ctx.save();ctx.translate(-w*.18,h*.29);','ctx.save();ctx.filter="blur(13px)";ctx.translate(-w*.18,h*.29);').replace("'#ffffffee'", "'#ffffffa8'");p.write_text(s,encoding='utf-8')
