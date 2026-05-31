
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const isSmall=()=>window.matchMedia('(max-width:900px)').matches;
  // Collapsible chapters
  const chapterSections=$$('.markdown-body section.level2');
  chapterSections.forEach((sec,i)=>{sec.classList.add('collapsible-section');const h2=$(':scope > h2',sec);if(!h2)return;const btn=document.createElement('button');btn.type='button';btn.className='section-toggle';btn.setAttribute('aria-expanded','true');btn.textContent='この章を閉じる';h2.insertAdjacentElement('afterend',btn);btn.addEventListener('click',()=>setCollapsed(sec,!sec.classList.contains('collapsed')));if(isSmall()){const doc=sec.closest('.doc-panel')?.id||'doc';const prev=chapterSections.slice(0,i).some(x=>(x.closest('.doc-panel')?.id||'doc')===doc);if(prev)setCollapsed(sec,true);}});
  function setCollapsed(sec,collapsed){sec.classList.toggle('collapsed',collapsed);const btn=$(':scope > .section-toggle',sec);if(btn){btn.setAttribute('aria-expanded',String(!collapsed));btn.textContent=collapsed?'この章を開く':'この章を閉じる';}}
  function setAll(collapsed){chapterSections.forEach(sec=>setCollapsed(sec,collapsed));}
  $('#expandAll')?.addEventListener('click',()=>setAll(false));$('#collapseAll')?.addEventListener('click',()=>setAll(true));$('#printPage')?.addEventListener('click',()=>window.print());
  $$('[data-progress]').forEach(input=>{const key='french-study-'+input.dataset.progress;input.checked=localStorage.getItem(key)==='1';input.closest('.check-card')?.classList.toggle('done',input.checked);input.addEventListener('change',()=>{localStorage.setItem(key,input.checked?'1':'0');input.closest('.check-card')?.classList.toggle('done',input.checked);});});
  let timer=null;window.addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(()=>localStorage.setItem('french-study-scrollY',String(window.scrollY)),180);$('#backToTop')?.classList.toggle('show',window.scrollY>800);},{passive:true});
  let font=localStorage.getItem('french-study-font')||'base';function applyFont(mode){document.body.classList.remove('font-small','font-large');if(mode==='small')document.body.classList.add('font-small');if(mode==='large')document.body.classList.add('font-large');localStorage.setItem('french-study-font',mode);const btn=$('#fontSizeToggle');if(btn)btn.textContent=mode==='small'?'文字:小':mode==='large'?'文字:大':'文字:標準';}applyFont(font);$('#fontSizeToggle')?.addEventListener('click',()=>{const cur=localStorage.getItem('french-study-font')||'base';applyFont(cur==='base'?'large':cur==='large'?'small':'base');});
  $('#topMobile')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));$('#backToTop')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

  // Quiz app
  const allItems = Array.isArray(window.QUIZ_ITEMS) ? window.QUIZ_ITEMS : [];
  let currentSection='all';
  let items=[];
  let index=0;
  let showingAnswer=false;
  let lastResult=null;
  const app=$('#quizApp'), bar=$('#quizProgressBar');
  const stateKey='french-quiz-state-v2';
  const doneKey='french-quiz-done-v2';
  function loadDone(){try{return JSON.parse(localStorage.getItem(doneKey)||'{}')}catch(e){return {}}}
  function saveDone(obj){localStorage.setItem(doneKey,JSON.stringify(obj));}
  function saveState(){localStorage.setItem(stateKey,JSON.stringify({section:currentSection,index:index}));}
  function loadState(){try{return JSON.parse(localStorage.getItem(stateKey)||'{}')}catch(e){return {}}}
  function setSection(sec, keepIndex=false){currentSection=sec;items=allItems.filter(x=>sec==='all'||String(x.section)===String(sec));if(!items.length)items=allItems.slice();if(!keepIndex)index=0;if(index>=items.length)index=0;showingAnswer=false;lastResult=null;$$('.quiz-launch').forEach(b=>b.classList.toggle('active',b.dataset.section===String(sec)));saveState();renderQuestion();}
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function progressText(){return `${index+1} / ${items.length}`;}
  function updateBar(){if(!bar)return;bar.style.width=items.length?`${((index)/items.length)*100}%`:'0%';}
  function current(){return items[index];}
  function renderQuestion(){if(!app)return;updateBar();const q=current();if(!q){app.innerHTML='<div class="quiz-card"><p>問題データがありません。</p></div>';return;}showingAnswer=false;lastResult=null;let controls='';if(q.options&&q.options.length){controls='<div class="choice-grid">'+q.options.map(o=>`<button class="choice-button" data-choice="${escapeHtml(o.key)}"><span class="choice-key">${escapeHtml(o.key)}</span><span>${escapeHtml(o.text)}</span></button>`).join('')+'</div>';}else{controls=`<textarea class="free-answer-box" id="freeAnswer" placeholder="ここに自分の答えをメモ。採点は自己確認です。"></textarea><button class="reveal-button" id="revealAnswer">解答を見る</button>`;}
    app.innerHTML=`<div class="quiz-card"><div class="quiz-topline"><span class="quiz-badge">SECTION ${escapeHtml(q.section)} / 問${escapeHtml(q.id)}</span><span class="quiz-count">${escapeHtml(progressText())}</span></div><p class="quiz-context">${escapeHtml(q.typeContext||q.sectionTitle||'')}</p><div class="quiz-prompt">${escapeHtml(q.prompt)}</div>${controls}<p class="mini-note">回答すると、すぐ正解画面に切り替わります。</p></div>`;
    $$('.choice-button',app).forEach(btn=>btn.addEventListener('click',()=>showAnswer(btn.dataset.choice)));
    $('#revealAnswer',app)?.addEventListener('click',()=>showAnswer(null));
    saveState();}
  function showAnswer(choice){const q=current();if(!q)return;showingAnswer=true;let status='解答確認';let cls='';if(choice&&q.correctKey){if(choice===q.correctKey){status='正解';cls='correct'}else{status=`不正解（あなたの回答: ${choice}）`;cls='wrong'}}else if(choice&&!q.correctKey){status=`回答: ${choice}`}
    const done=loadDone();done[q.id]=cls==='correct'?'correct':'seen';saveDone(done);if(bar)bar.style.width=items.length?`${((index+1)/items.length)*100}%`:'0%';
    app.innerHTML=`<div class="quiz-card answer-screen"><div class="quiz-topline"><span class="quiz-badge">SECTION ${escapeHtml(q.section)} / 問${escapeHtml(q.id)}</span><span class="quiz-count">${escapeHtml(progressText())}</span></div><div class="answer-status ${cls}">${escapeHtml(status)}</div><p class="quiz-context">正しい解答・解説</p><div class="answer-block">${escapeHtml(q.answer)}</div><div class="answer-actions"><button class="next-button" id="nextQuestion">次の問題へ</button><button class="choice-button" id="retryQuestion"><span class="choice-key">↻</span><span>この問題をもう一度</span></button></div><p class="mini-note">迷った問題は、下の「問題全文」または教科書・会話セクションに戻って確認してください。</p></div>`;
    $('#nextQuestion',app)?.addEventListener('click',next);$('#retryQuestion',app)?.addEventListener('click',renderQuestion);}
  function next(){if(index<items.length-1)index++;else index=0;renderQuestion();}
  function prev(){if(index>0)index--;else index=items.length-1;renderQuestion();}
  $('#quizPrev')?.addEventListener('click',prev);$('#quizShuffle')?.addEventListener('click',()=>{if(items.length){index=Math.floor(Math.random()*items.length);renderQuestion();}});$('#quizReset')?.addEventListener('click',()=>{if(confirm('演習の閲覧・正解記録をリセットしますか？')){localStorage.removeItem(doneKey);index=0;renderQuestion();}});
  $$('.quiz-launch').forEach(btn=>btn.addEventListener('click',()=>setSection(btn.dataset.section)));
  const saved=loadState();setSection(saved.section||'all',true);if(Number.isFinite(Number(saved.index))) {index=Math.max(0,Math.min(items.length-1,Number(saved.index)));renderQuestion();}
})();
