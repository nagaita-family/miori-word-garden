"""One-time guarded entrypoint update: v30 writing eraser, no app state changes."""
from pathlib import Path

def one(text, old, new, label):
    count=text.count(old)
    assert count==1, f'{label}: expected one anchor, found {count}'
    return text.replace(old,new,1)

page=Path('index.html')
s=page.read_text(encoding='utf-8')
s=one(s,'  <link rel="stylesheet" href="play-flow-v29.css?v=20260917-v29">','  <link rel="stylesheet" href="play-flow-v29.css?v=20260917-v29">\n  <link rel="stylesheet" href="writing-erase-v30.css?v=20260917-v30">','CSS asset')
s=one(s,'aria-label="App version 29, September 17">v29 · Sep 17','aria-label="App version 30, September 17">v30 · Sep 17','Version badge')
s=one(s,'  <script src="weekly-test-palm-v25.js?v=20260917-listen-fix-v27"></script>','  <script src="weekly-test-palm-v25.js?v=20260917-listen-fix-v27"></script>\n  <script src="writing-erase-v30.js?v=20260917-v30"></script>','JS asset')
s=one(s,'<!-- v29: Garden-only BGM and flowing Stage 3 gap/Stage 4 word handwriting -->','<!-- v30: focus-only two-button erase next to Stage 4 and weekly handwriting -->','Version comment')
page.write_text(s,encoding='utf-8')
old=Path('tests/play-flow-v29.test.cjs')
t=old.read_text(encoding='utf-8')
t=one(t,"assert(page.includes('v29 · Sep 17'),'Updated visible version');","assert(page.includes('v30 · Sep 17'),'Latest visible version keeps the v29 features');",'Historical version test')
old.write_text(t,encoding='utf-8')
print('v30 assets and version integrated; old v29 layout remains unchanged.')
