"""Update only obsolete source-string assertions in the v24 regression suite."""
from pathlib import Path
path=Path('tests/weekly-test-v24.test.cjs')
s=path.read_text(encoding='utf-8')
changes=[
 ("assert(sheet.includes('weeklyAnswerText(input.value)'),'The stored draft is cleaned');", "assert(sheet.includes('weeklyAnswerText(input.value,state.lib[id].word)'),'The stored draft is cleaned');"),
 ("assert(grade.includes('weeklyAnswerText(input.value)'),'Grading the last active field ignores spaces too');", "assert(grade.includes('weeklyAnswerText(input.value,state.lib[input.dataset.id].word)'),'Grading the last active field ignores spaces too');"),
]
for old,new in changes:
    count=s.count(old)
    if count!=1:raise RuntimeError(f'Expected one legacy assertion, got {count}: {old}')
    s=s.replace(old,new,1)
path.write_text(s,encoding='utf-8')
print('Updated v24 checks to verify v28 normalized drafts and grade-time input.')
