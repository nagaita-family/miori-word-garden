"""Only refresh regression assertions for the latest cache-busted app asset."""
from pathlib import Path
old='app.js?v=20260917-learning-groups-v32a'
new='app.js?v=20260917-backup-controls-v33'
changed=[]
for path in Path('tests').glob('*.test.cjs'):
    text=path.read_text(encoding='utf-8')
    if old not in text:continue
    path.write_text(text.replace(old,new),encoding='utf-8')
    changed.append(path.name)
print('Refreshed expected asset URL:',', '.join(changed))
