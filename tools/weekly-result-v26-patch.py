"""Patch only weekly result rendering and versioned assets; fail on changed source."""
from pathlib import Path


def replace_once(path, before, after, name):
    file = Path(path)
    original = file.read_text(encoding='utf-8')
    count = original.count(before)
    if count != 1:
        raise RuntimeError(f'{name}: expected one match, got {count}')
    file.write_text(original.replace(before, after, 1), encoding='utf-8')

replace_once('app.js',
    """<div><b>${item.answer?esc(item.answer):'<i>No answer</i>'}</b>${item.correct?'':`<small>Correct spelling: <strong>${esc(word)}</strong></small>`}</div>""",
    """<div>${item.correct?`<b>${esc(item.answer)}</b>`:(window.WordGardenWeeklyDiff?.render(item.answer,word)||`<b>${item.answer?esc(item.answer):'<i>No answer</i>'}</b><small>Correct spelling: <strong>${esc(word)}</strong></small>`)}</div>""",
    'Add comparison only to incorrect weekly results')

replace_once('index.html',
    '  <link rel="stylesheet" href="weekly-test-v24.css?v=20260917-v24">',
    '  <link rel="stylesheet" href="weekly-test-v24.css?v=20260917-v24">\n  <link rel="stylesheet" href="weekly-result-compare-v26.css?v=20260917-v26">',
    'Load v26 comparison stylesheet')
replace_once('index.html',
    'aria-label="App version 25, September 17">v25 · Sep 17',
    'aria-label="App version 26, September 17">v26 · Sep 17',
    'Change visible version')
replace_once('index.html',
    '  <script src="app.js?v=20260917-weekly-review-v25"></script>',
    '  <script src="weekly-result-compare-v26.js?v=20260917-v26"></script>\n  <script src="app.js?v=20260917-weekly-results-v26"></script>',
    'Load v26 comparison helper before app and refresh cache')
replace_once('index.html',
    '<!-- v25 production: test palm protection and missed-word stages 3 then 4 -->',
    '<!-- v26 production: aligned, readable spelling differences in weekly results -->',
    'Update version comment')

# Existing regression tests should verify their original features without fixing a future app version.
replace_once('tests/weekly-test-v24.test.cjs',
    "page.includes('app.js?v=20260917-weekly-review-v25')&&/v[0-9]+ · Sep 17/.test(page)",
    "page.includes('app.js?v=20260917-weekly-results-v26')&&/v[0-9]+ · Sep 17/.test(page)",
    'Maintain v24 layout test after cache-bust change')
replace_once('tests/weekly-test-v25.test.cjs',
    "html.includes('app.js?v=20260917-weekly-review-v25')&&html.includes('v25 · Sep 17')",
    "html.includes('app.js?v=20260917-weekly-results-v26')&&/v[0-9]+ · Sep 17/.test(html)",
    'Maintain v25 palm and short-review regression after version update')
print('v26 patched: wrong-answer comparison only; correct results, grading, review, palm guard and persistence untouched.')
