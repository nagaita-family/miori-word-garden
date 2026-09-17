"""One-time guarded v31 integration. Patch HTML/version and legacy version assertions."""
from pathlib import Path


def replace_once(path, old, new):
    file = Path(path)
    source = file.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one anchor, got {count}: {old[:100]}')
    file.write_text(source.replace(old, new, 1), encoding='utf-8')

replace_once('index.html',
    '  <link rel="stylesheet" href="writing-erase-v30.css?v=20260917-v30">\n</head>',
    '  <link rel="stylesheet" href="writing-erase-v30.css?v=20260917-v30">\n  <link rel="stylesheet" href="play-viewport-v31.css?v=20260917-v31">\n</head>')
replace_once('index.html',
    '<span class="app-version-badge" aria-label="App version 30, September 17">v30 · Sep 17</span>',
    '<span class="app-version-badge" aria-label="App version 31, September 17">v31 · Sep 17</span>')
replace_once('index.html',
    '<!-- v30: focus-only two-button erase next to Stage 4 and weekly handwriting -->',
    '<!-- v31: small-iPad Step 4 feedback fits or safely scrolls; Stage 3 overflow protected -->')
replace_once('tests/writing-erase-v30.test.cjs',
    "assert(page.includes('v30 · Sep 17'),'Version badge updated');",
    "assert(page.includes('v31 · Sep 17'),'Current version badge remains updated alongside v30 erasers');")
replace_once('tests/play-flow-v29.test.cjs',
    "assert(page.includes('v30 · Sep 17'),'Latest visible version keeps the v29 features');",
    "assert(page.includes('v31 · Sep 17'),'Latest visible version keeps the v29 features');")
print('v31 CSS registered, version updated, old regression assertions refreshed; saved data untouched.')
