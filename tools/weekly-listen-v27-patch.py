"""Release v27: refresh palm script URL and keep prior regression tests version-agnostic."""
from pathlib import Path

def swap(path,old,new,label):
    file=Path(path)
    text=file.read_text(encoding='utf-8')
    count=text.count(old)
    if count!=1:raise RuntimeError(f'{label}: expected one occurrence, found {count}')
    file.write_text(text.replace(old,new,1),encoding='utf-8')

swap('index.html','aria-label="App version 26, September 17">v26 · Sep 17','aria-label="App version 27, September 17">v27 · Sep 17','Version badge')
swap('index.html','weekly-test-palm-v25.js?v=20260917-v25','weekly-test-palm-v25.js?v=20260917-v27-listen','Cache bust fixed guard')
swap('index.html','<!-- v26 production: aligned, readable spelling differences in weekly results -->','<!-- v27 production: Listen stays responsive while grading buttons retain palm protection -->','Version comment')
swap('tests/weekly-test-v25.test.cjs',"html.includes('weekly-test-palm-v25.js?v=20260917-v25')","html.includes('weekly-test-palm-v25.js?v=20260917-v27-listen')",'v25 guard asset regression')
swap('tests/weekly-test-v25.test.cjs',"const gradeButton={closest(selector){return selector==='.weekly-test-view button'?{}:null}};","const gradeButton={closest(selector){return selector==='#weeklyGradeBtn,#weeklyGradeTopBtn'?{}:null}};",'v25 grading guard mock')
swap('tests/weekly-result-v26.test.cjs',"assert(page.includes('v26 · Sep 17'),'Visible version v26');","assert(/v[0-9]+ · Sep 17/.test(page),'Visible version remains displayed');",'v26 comparison is not tied to app badge')
print('Applied v27 index cache refresh and adjusted version-sensitive historical tests.')
