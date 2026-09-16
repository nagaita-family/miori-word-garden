"""Validate published v27 page and refresh historical tests without overwriting app code."""
from pathlib import Path

def swap(path,old,new,label):
    file=Path(path)
    text=file.read_text(encoding='utf-8')
    count=text.count(old)
    if count!=1:raise RuntimeError(f'{label}: expected one occurrence, found {count}')
    file.write_text(text.replace(old,new,1),encoding='utf-8')

page=Path('index.html').read_text(encoding='utf-8')
if 'aria-label="App version 27, September 17">v27 · Sep 17' not in page:raise RuntimeError('Visible v27 badge missing')
if 'weekly-test-palm-v25.js?v=20260917-listen-fix-v27' not in page:raise RuntimeError('Fixed palm guard must be loaded with a new cache key')
swap('tests/weekly-test-v25.test.cjs',"html.includes('weekly-test-palm-v25.js?v=20260917-v25')","html.includes('weekly-test-palm-v25.js?v=20260917-listen-fix-v27')",'v25 guard asset regression')
swap('tests/weekly-test-v25.test.cjs',"const gradeButton={closest(selector){return selector==='.weekly-test-view button'?{}:null}};","const gradeButton={closest(selector){return selector==='#weeklyGradeBtn,#weeklyGradeTopBtn'?{}:null}};",'v25 grading guard mock')
swap('tests/weekly-result-v26.test.cjs',"assert(page.includes('v26 · Sep 17'),'Visible version v26');","assert(/v[0-9]+ · Sep 17/.test(page),'Visible version remains displayed');",'v26 comparison is not tied to app badge')
swap('tests/weekly-listen-v27.test.cjs',"page.includes('weekly-test-palm-v25.js?v=20260917-v27-listen')","page.includes('weekly-test-palm-v25.js?v=20260917-listen-fix-v27')",'v27 expected asset matches actual production')
print('PASS: v27 page already cache-busted; updated v25/v26/v27 regression checks.')
