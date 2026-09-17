"""One-time v35 release: refresh helper cache key and its historical regression assertions."""
from pathlib import Path
html_path=Path('index.html')
html=html_path.read_text(encoding='utf-8')
def one(text,old,new):
    if text.count(old)!=1:raise RuntimeError(f'Expected exactly one occurrence of {old!r}, found {text.count(old)}')
    return text.replace(old,new,1)
html=one(html,'word-auto-fill-v34.js?v=20260917-v34','word-auto-fill-v34.js?v=20260917-v35')
html=one(html,'App version 34, September 17','App version 35, September 17')
html=one(html,'v34 · Sep 17','v35 · Sep 17')
html_path.write_text(html,encoding='utf-8')
helper=Path('word-auto-fill-v34.js')
text=helper.read_text(encoding='utf-8')
text=one(text,"cute:['かわいい','かわいい']","cute:['pleasantly pretty or sweet','かわいい']")
helper.write_text(text,encoding='utf-8')
for path in Path('tests').glob('*.test.cjs'):
    old=path.read_text(encoding='utf-8')
    new=old.replace('word-auto-fill-v34.js?v=20260917-v34','word-auto-fill-v34.js?v=20260917-v35').replace('v34 · Sep 17','v35 · Sep 17')
    if new!=old:path.write_text(new,encoding='utf-8')
print('v35: reliable lookup helper, distinct cache URL and refreshed version assertions; saved state untouched.')
