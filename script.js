(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const normalize = (s) => (s || '').toLowerCase().normalize('NFKC');
  const searchBox = $('#searchBox');
  const result = $('#searchResult');
  const isSmallScreen = () => window.matchMedia('(max-width: 900px)').matches;

  // --- Mobile-friendly collapsible chapters ---
  const chapterSections = $$('.markdown-body section.level2');
  chapterSections.forEach((sec, i) => {
    sec.classList.add('collapsible-section');
    const h2 = $(':scope > h2', sec);
    if (!h2) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'section-toggle';
    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = 'この章を閉じる';
    h2.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', () => setCollapsed(sec, !sec.classList.contains('collapsed')));
    // Smartphone default: keep the first chapter of each document open, collapse the rest.
    if (isSmallScreen()) {
      const doc = sec.closest('.doc-panel')?.id || 'doc';
      const previousSameDoc = chapterSections.slice(0, i).some(x => (x.closest('.doc-panel')?.id || 'doc') === doc);
      if (previousSameDoc) setCollapsed(sec, true);
    }
  });

  function setCollapsed(sec, collapsed){
    sec.classList.toggle('collapsed', collapsed);
    const btn = $(':scope > .section-toggle', sec);
    if (btn) {
      btn.setAttribute('aria-expanded', String(!collapsed));
      btn.textContent = collapsed ? 'この章を開く' : 'この章を閉じる';
    }
  }
  function setAllChapters(collapsed){
    chapterSections.forEach(sec => setCollapsed(sec, collapsed));
  }
  $('#expandAll')?.addEventListener('click', () => setAllChapters(false));
  $('#collapseAll')?.addEventListener('click', () => setAllChapters(true));

  // --- Fast section-level search ---
  const sectionBlocks = $$('main > .section-block');
  const docPanels = $$('.doc-panel');
  const searchTargets = [...chapterSections, ...sectionBlocks];
  const indexed = searchTargets.map(el => ({ el, text: normalize(el.textContent), parent: el.closest('.doc-panel') }));
  let searchTimer = null;

  function runSearch(){
    const q = normalize(searchBox?.value.trim());
    document.body.classList.toggle('searching', Boolean(q));
    searchTargets.forEach(el => { el.classList.remove('hidden-by-search','search-hit','highlight-hit'); });
    docPanels.forEach(el => el.classList.remove('hidden-by-search'));
    if(!q){
      result.textContent = '検索語を入力すると該当セクションを絞り込みます。';
      return;
    }
    const hitParents = new Set();
    let shown = 0;
    indexed.forEach(({el,text,parent}) => {
      const hit = text.includes(q);
      el.classList.toggle('hidden-by-search', !hit);
      el.classList.toggle('search-hit', hit);
      if(hit){
        shown++;
        if(parent) hitParents.add(parent);
        if(el.classList.contains('collapsible-section')) setCollapsed(el, false);
      }
    });
    docPanels.forEach(panel => panel.classList.toggle('hidden-by-search', !hitParents.has(panel)));
    result.textContent = shown ? `${shown} セクションがヒットしました。該当章は自動で開いています。` : '該当セクションは見つかりません。表記を変えて再検索してください。';
  }
  searchBox?.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 120); });
  $('#clearSearch')?.addEventListener('click', () => { if(searchBox) searchBox.value=''; runSearch(); searchBox?.focus(); });
  $('#printPage')?.addEventListener('click', () => window.print());

  // --- Progress checkboxes ---
  const progressInputs = $$('[data-progress]');
  progressInputs.forEach(input => {
    const key = 'french-study-' + input.dataset.progress;
    input.checked = localStorage.getItem(key) === '1';
    input.closest('.check-card')?.classList.toggle('done', input.checked);
    input.addEventListener('change', () => {
      localStorage.setItem(key, input.checked ? '1' : '0');
      input.closest('.check-card')?.classList.toggle('done', input.checked);
    });
  });

  // --- Copy section title ---
  $$('[data-copy-section]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-copy-section');
      const sec = document.getElementById(id);
      const title = sec?.querySelector('.doc-heading h2')?.innerText || id;
      try{
        await navigator.clipboard.writeText(title);
        btn.textContent = 'コピー済み';
        setTimeout(()=>btn.textContent='章タイトルをコピー',1200);
      }catch(e){ alert(title); }
    });
  });

  // --- Save/restore reading position ---
  let scrollSaveTimer = null;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => localStorage.setItem('french-study-scrollY', String(window.scrollY)), 180);
    $('#backToTop')?.classList.toggle('show', window.scrollY > 800);
  }, {passive:true});
  $('#continueReading')?.addEventListener('click', () => {
    const y = Number(localStorage.getItem('french-study-scrollY') || '0');
    window.scrollTo({top:y, behavior:'smooth'});
  });

  // --- Font size toggle ---
  const fontClasses = ['font-small','font-base','font-large'];
  function applyFontSize(mode){
    document.body.classList.remove('font-small','font-large');
    if(mode === 'small') document.body.classList.add('font-small');
    if(mode === 'large') document.body.classList.add('font-large');
    localStorage.setItem('french-study-font', mode);
    const label = mode === 'small' ? '文字:小' : mode === 'large' ? '文字:大' : '文字:標準';
    const btn = $('#fontSizeToggle'); if(btn) btn.textContent = label;
  }
  const savedFont = localStorage.getItem('french-study-font') || 'base';
  applyFontSize(savedFont);
  $('#fontSizeToggle')?.addEventListener('click', () => {
    const current = localStorage.getItem('french-study-font') || 'base';
    const next = current === 'base' ? 'large' : current === 'large' ? 'small' : 'base';
    applyFontSize(next);
  });

  // --- Quick jump buttons ---
  function jumpTo(el){
    if(!el) return;
    const parentChapter = el.closest('.collapsible-section');
    if(parentChapter) setCollapsed(parentChapter, false);
    setTimeout(() => el.scrollIntoView({behavior:'smooth', block:'start'}), 20);
  }
  function randomFrom(list){ return list.length ? list[Math.floor(Math.random()*list.length)] : null; }
  $('#randomDialogue')?.addEventListener('click', () => jumpTo(randomFrom($$('#dialogues .markdown-body h3').filter(h => /^\d{3}/.test(h.textContent.trim())))));
  $('#randomExercise')?.addEventListener('click', () => jumpTo(randomFrom($$('#exercises .markdown-body section.level2 h2'))));
  $('#randomRule')?.addEventListener('click', () => jumpTo(randomFrom($$('#textbook .markdown-body section.level2 h2'))));

  // --- Mobile bottom nav helpers ---
  $('#focusSearchMobile')?.addEventListener('click', () => { searchBox?.focus(); searchBox?.scrollIntoView({behavior:'smooth', block:'center'}); });
  $('#topMobile')?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  $('#backToTop')?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
})();
