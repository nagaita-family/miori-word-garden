/* v26: compare the spelling Miori wrote with the correct word, even when lengths differ. */
(()=>{
'use strict';
const htmlEscape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const compact=value=>String(value??'').replace(/\s+/g,'');
function align(written,correct){
  const a=[...compact(written)],b=[...compact(correct)];
  const m=a.length,n=b.length;
  const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=m;i>=0;i--)for(let j=n;j>=0;j--){
    if(i===m)dp[i][j]=n-j;
    else if(j===n)dp[i][j]=m-i;
    else if(a[i].toLowerCase()===b[j].toLowerCase())dp[i][j]=dp[i+1][j+1];
    else dp[i][j]=1+Math.min(dp[i+1][j+1],dp[i+1][j],dp[i][j+1]);
  }
  const cells=[];let i=0,j=0;
  while(i<m||j<n){
    if(i<m&&j<n&&a[i].toLowerCase()===b[j].toLowerCase()&&dp[i][j]===dp[i+1][j+1]){
      cells.push({kind:'match',written:a[i++],correct:b[j++]});continue;
    }
    const extra=i<m&&dp[i][j]===1+dp[i+1][j];
    const missing=j<n&&dp[i][j]===1+dp[i][j+1];
    const replace=i<m&&j<n&&dp[i][j]===1+dp[i+1][j+1];
    // Prefer preserving a matching neighbor over highlighting a string of shifted letters.
    if(extra&&i+1<m&&j<n&&a[i+1].toLowerCase()===b[j].toLowerCase()){
      cells.push({kind:'extra',written:a[i++],correct:''});continue;
    }
    if(missing&&i<m&&j+1<n&&a[i].toLowerCase()===b[j+1].toLowerCase()){
      cells.push({kind:'missing',written:'',correct:b[j++]});continue;
    }
    if(replace){cells.push({kind:'replace',written:a[i++],correct:b[j++]});continue;}
    if(missing){cells.push({kind:'missing',written:'',correct:b[j++]});continue;}
    if(extra){cells.push({kind:'extra',written:a[i++],correct:''});continue;}
    // Defensive fallback; the edit-distance recurrence normally guarantees a move.
    if(i<m&&j<n)cells.push({kind:'replace',written:a[i++],correct:b[j++]});
    else if(i<m)cells.push({kind:'extra',written:a[i++],correct:''});
    else cells.push({kind:'missing',written:'',correct:b[j++]});
  }
  return cells;
}
function render(written,correct){
  const answer=compact(written),target=compact(correct);
  if(!target)return'';
  if(!answer)return`<div class="weekly-diff" aria-label="No answer. Correct spelling: ${htmlEscape(target)}"><span class="weekly-diff-label">YOU WROTE</span><div class="weekly-diff-empty">No answer</div><span class="weekly-diff-label">CORRECT SPELLING</span><div class="weekly-diff-whole">${htmlEscape(target)}</div></div>`;
  if(answer.length>80||target.length>80)return`<div class="weekly-diff"><span class="weekly-diff-label">YOU WROTE</span><div class="weekly-diff-whole weekly-diff-long">${htmlEscape(answer)}</div><span class="weekly-diff-label">CORRECT SPELLING</span><div class="weekly-diff-whole weekly-diff-long">${htmlEscape(target)}</div></div>`;
  const cells=align(answer,target);
  const top=cells.map(cell=>{
    if(cell.kind==='missing')return'<span class="weekly-diff-cell is-missing" aria-label="Missing letter here" title="Missing letter">+</span>';
    const cls=cell.kind==='match'?'is-match':cell.kind==='extra'?'is-extra':'is-replace';
    const name=cell.kind==='extra'?'Extra letter':cell.kind==='replace'?'Different letter':'Matching letter';
    return`<span class="weekly-diff-cell ${cls}" aria-label="${name}: ${htmlEscape(cell.written)}">${htmlEscape(cell.written)}</span>`;
  }).join('');
  const bottom=cells.map(cell=>{
    if(cell.kind==='extra')return'<span class="weekly-diff-cell is-gap" aria-label="No letter here">·</span>';
    return`<span class="weekly-diff-cell ${cell.kind==='match'?'is-match':'is-correction'}" aria-label="Correct letter: ${htmlEscape(cell.correct)}">${htmlEscape(cell.correct)}</span>`;
  }).join('');
  const hasMissing=cells.some(cell=>cell.kind==='missing');
  return`<div class="weekly-diff" role="group" aria-label="Compare your spelling with the correct spelling"><span class="weekly-diff-label">YOU WROTE</span><div class="weekly-diff-letters">${top}</div><span class="weekly-diff-label">CORRECT SPELLING</span><div class="weekly-diff-letters">${bottom}</div><small class="weekly-diff-legend">Red = check this letter${hasMissing?' · + = a missing letter':''}. The highlighted letters below show what to write.</small></div>`;
}
window.WordGardenWeeklyDiff=Object.freeze({align,render});
})();
