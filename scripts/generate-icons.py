#!/usr/bin/env python3
"""Generate browser icons from the brand SVG. Requires rsvg-convert (librsvg)."""
from pathlib import Path
import struct
import subprocess
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
source = ET.parse(root / 'src/assets/images/eddndev.svg').getroot()
shape = source.find('{http://www.w3.org/2000/svg}path').attrib['d']
favicon = root / 'public/favicon.svg'
favicon.write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="384" height="384" viewBox="0 0 384 384">
  <rect width="384" height="384" rx="72" fill="#0b0910"/>
  <path transform="translate(0 72)" fill="#b7a6ec" fill-rule="evenodd" d="{shape}"/>
</svg>
''')


def render(size):
    return subprocess.check_output([
        'rsvg-convert', '--width', str(size), '--height', str(size), str(favicon),
    ])


(root / 'public/favicon.png').write_bytes(render(512))
(root / 'public/apple-touch-icon.png').write_bytes(render(180))
images = [(size, render(size)) for size in [16, 32, 48, 64, 128, 256]]
# ICO directory entries point to lossless PNG payloads at each native resolution.
offset = 6 + 16 * len(images)
entries = []
for size, image in images:
    entries.append(struct.pack('<BBBBHHII', size % 256, size % 256, 0, 0, 1, 32, len(image), offset))
    offset += len(image)
icon = struct.pack('<HHH', 0, 1, len(images)) + b''.join(entries) + b''.join(image for _, image in images)
(root / 'public/favicon.ico').write_bytes(icon)
