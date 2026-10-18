"""Rebuild homepage assets with Python/Pillow and the existing scene geometry."""
from pathlib import Path
import subprocess
from PIL import Image
base = Path(__file__).resolve().parent
with Image.open(base / 'assets/mountain-original.jpg') as image:
    image.resize((2880, 2160), Image.Resampling.LANCZOS).save(
        base / 'assets/mountain-display.jpg', 'JPEG', quality=90, optimize=True,
        icc_profile=image.info.get('icc_profile'))
script = r"""
const fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('foreground-data.js','utf8'),ctx);
const mask=require('./scene-depth.js').buildMask({mode:'background',data:require('./scene-data.js'),cairn:require('./cairn-mask.js'),person:ctx.window.FOREGROUND_PATH});
process.stdout.write(Buffer.from(mask.pixels));
"""
pixels = subprocess.check_output(['node', '-e', script], cwd=base)
Image.frombytes('RGBA', (1008, 756), pixels).save(base / 'assets/scene-depth.png', optimize=True)
for name in ['mountain-display.jpg', 'scene-depth.png']:
    print(name, (base / 'assets' / name).stat().st_size)
