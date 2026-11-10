(function(){
const D=window.PSAT_DATA, $=s=>document.querySelector(s), app=$('#app');
const params=new URLSearchParams(location.search);
const LET='ABCD';
// ---------------- RESULTS VIEW ----------------
if(params.get('result')){ renderResult(params.get('result')); return; }
const tid=parseInt(params.get('t')||'1',10);
const test=D.tests.find(t=>t.id===tid);
if(!test){app.innerHTML='<div class="wrap"><p>Test not found. <a href="tests.html">Back to tests</a></p></div>';return}
const KEY='psat.progress.t'+tid;
let st=PSAT.load(KEY,null);
let timerId=null;
const mods=[]; test.sections.forEach((s,si)=>s.modules.forEach((m,mi)=>mods.push({si,mi,sec:s,mod:m})));
function cur(){return mods[st.m]}
function persist(){PSAT.save(KEY,st)}
if(!st) intro(); else if(st.phase==='break') breakScreen(); else go();

function chrome(on){document.querySelectorAll('header.site,footer.site').forEach(e=>e.remove());if(on){PSAT.header('tests.html');PSAT.footer()}}
function intro(){
  document.body.classList.remove('testing');chrome(true);
  app.innerHTML=`<div class="wrap"><main>
  <h1>${test.name}</h1>
  <div class="card"><p>This full-length practice test follows the format of the digital PSAT/NMSQT:</p>
  <table class="std"><tr><th>Section</th><th>Modules</th><th>Time</th></tr>
  <tr><td>Reading and Writing</td><td>2 modules × 27 questions</td><td>32 minutes each</td></tr>
  <tr><td>Math</td><td>2 modules × 22 questions</td><td>35 minutes each</td></tr></table>
  <ul><li>You can move freely between questions <b>within</b> a module, but once you submit a module you can't go back.</li>
  <li>Use <b>Mark for Review</b> (⚑) to flag questions you want to come back to.</li>
  <li>There's no penalty for guessing. Answer every question.</li>
  <li>In Math, a Desmos graphing calculator and a reference sheet are available from the top bar.</li>
  <li>The timer pauses if you close this page, and your progress is saved on this device.</li>
  <li>Plan on about 2 hours 15 minutes, plus an optional 10-minute break between sections.</li></ul>
  <label class="check"><input type="checkbox" id="untimed"> Practice untimed (no countdown; good for learning, but less like test day)</label>
  <p><button class="btn" id="start">Start the test</button></p></div>
  <p><a href="tests.html">← Back to practice tests</a></p></main></div>`;
  $('#start').onclick=()=>{st={t:tid,m:0,q:0,phase:'q',answers:{},flags:{},untimed:$('#untimed').checked,remaining:mods[0].mod.minutes*60,used:0,startedAt:Date.now()};persist();go()};
}
function breakScreen(){
  stopTimer(); document.body.classList.remove('testing');chrome(false);
  app.innerHTML=`<div class="wrap"><main class="center"><h1>Nice work! Reading and Writing is done.</h1>
  <div class="card"><p>On the real test you get a <b>10-minute break</b> here. Stand up, stretch, drink some water, have a snack.</p>
  <p class="muted">Next up: Math, 2 modules, 35 minutes each.</p>
  <p><button class="btn" id="cont">Start the Math section</button></p></div></main></div>`;
  $('#cont').onclick=()=>{st.phase='q';st.m=2;st.q=0;st.remaining=mods[2].mod.minutes*60;persist();go()};
}
function go(){
  document.body.classList.add('testing');chrome(false);
  const c=cur(), qs=c.mod.questions, isMath=c.sec.id==='math';
  app.innerHTML=`<div class="tbar"><div class="wrap">
    <div class="title">Section ${c.si+1}, Module ${c.mi+1}: ${c.sec.name}<small>${test.name}</small></div>
    <div class="timer" id="timer"></div>
    <div class="tools">${isMath?'<button class="btn small secondary" id="calc">Calculator</button><button class="btn small secondary" id="ref">Reference</button>':''}
    <button class="btn small ghost" id="exit" title="Save and leave">Save &amp; exit</button></div></div></div>
    <div id="body"></div>
    <div class="bbar"><div class="wrap"><button class="btn ghost" id="back">Back</button><button class="navbtn" id="nav"></button><button class="btn" id="next">Next</button></div></div>`;
  if(isMath){$('#calc').onclick=PSAT.openCalc;$('#ref').onclick=PSAT.openReference}
  $('#exit').onclick=()=>{persist();location.href='tests.html'};
  $('#back').onclick=()=>{if(st.phase==='review'){st.phase='q';st.q=qs.length-1}else if(st.q>0)st.q--;persist();draw()};
  $('#next').onclick=()=>{if(st.phase==='review'){confirmSubmit();return} if(st.q<qs.length-1)st.q++;else st.phase='review';persist();draw()};
  $('#nav').onclick=openNavigator;
  draw(); startTimer();
}
function draw(){
  const c=cur(), qs=c.mod.questions;
  $('#nav').textContent=st.phase==='review'?'Review page':`Question ${st.q+1} of ${qs.length} ▴`;
  $('#back').disabled=st.phase!=='review'&&st.q===0;
  $('#next').textContent=st.phase==='review'?'Submit module':'Next';
  if(st.phase==='review'){ $('#body').innerHTML=`<div class="wrap" style="max-width:800px;padding-top:18px"><h2 style="margin-top:0">Check your work</h2>
    <p>On this page you can see which questions you've answered and which you've marked for review. Tap a number to go back to it. When you're ready, submit this module.</p>
    ${gridHTML()}<p class="muted tiny">You can't return to this module after submitting it.</p></div>`; bindGrid(); window.scrollTo(0,0); return;}
  const q=qs[st.q], isRW=q.sec==='rw', ans=st.answers[q.id];
  let right=`<div class="qhead"><span class="qnum">${st.q+1}</span><button class="flagbtn ${st.flags[q.id]?'on':''}" id="flag">${st.flags[q.id]?'⚑ Marked for review':'⚐ Mark for review'}</button></div>`;
  if(isRW) right+=`<p class="stem">${q.stem}</p>`; else right+=`<div class="stem">${q.stem}</div>`;
  if(q.type==='mc') right+='<div class="choices">'+q.choices.map((ch,i)=>`<button class="choice ${ans===i?'sel':''}" data-i="${i}"><span class="let">${LET[i]}</span><span class="txt">${ch}</span></button>`).join('')+'</div>';
  else right+=`<div class="spr"><label for="spr" class="muted tiny">Enter your answer (a number, fraction like 3/4, or decimal; up to 5 characters, 6 if negative):</label><br><input id="spr" inputmode="text" autocomplete="off" maxlength="6" value="${PSAT.esc(ans||'')}"><div class="preview" id="pv"></div></div>`;
  $('#body').innerHTML=isRW?`<div class="qwrap split"><div class="passage">${q.passage}</div><div>${right}</div></div>`:`<div class="qwrap" style="max-width:760px">${right}</div>`;
  $('#flag').onclick=()=>{st.flags[q.id]=!st.flags[q.id];if(!st.flags[q.id])delete st.flags[q.id];persist();draw()};
  document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(st.answers[q.id]===i)delete st.answers[q.id];else st.answers[q.id]=i;persist();draw()});
  const inp=$('#spr'); if(inp){const pv=()=>{const v=inp.value.trim();$('#pv').textContent=v?(isNaN(PSAT.parseNum(v))?'That doesn\'t look like a number yet.':'Answer preview: '+v):''};pv();
    inp.oninput=()=>{inp.value=inp.value.replace(/[^0-9.\/\-−]/g,'');const v=inp.value.trim();if(v)st.answers[q.id]=v;else delete st.answers[q.id];persist();pv()};}
  window.scrollTo(0,0);
}
function gridHTML(){
  const qs=cur().mod.questions;
  return `<div class="legend"><span>▭ dashed = unanswered</span><span style="color:var(--brand2)">■ answered</span><span style="color:var(--flag)">⚑ marked for review</span></div><div class="navgrid">`+
   qs.map((q,i)=>`<button data-go="${i}" class="${st.answers[q.id]!==undefined?'ans':''} ${st.flags[q.id]?'flg':''} ${st.phase!=='review'&&i===st.q?'cur':''}">${i+1}</button>`).join('')+'</div>';
}
function bindGrid(root){(root||document).querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{st.q=+b.dataset.go;st.phase='q';persist();const m=document.getElementById('navm');if(m)m.classList.remove('open');draw()})}
function openNavigator(){
  const m=PSAT.modal('navm',`${cur().sec.name}: Module ${cur().mi+1} Questions`,'');
  m.querySelector('.mbody').innerHTML=gridHTML()+'<p><button class="btn secondary" id="toreview">Go to Review Page</button></p>';
  bindGrid(m); m.querySelector('#toreview').onclick=()=>{st.phase='review';persist();m.classList.remove('open');draw()};
}
function confirmSubmit(){
  const qs=cur().mod.questions, un=qs.filter(q=>st.answers[q.id]===undefined).length;
  if(un&&!confirm(`You have ${un} unanswered question${un>1?'s':''}. There's no penalty for guessing. Submit this module anyway?`))return;
  submitModule();
}
function submitModule(){
  stopTimer();
  if(st.m===mods.length-1){finish();return}
  const next=st.m+1;
  if(mods[next].si!==cur().si){st.phase='break';st.m=next;persist();breakScreen();return}
  st.m=next;st.q=0;st.phase='q';st.remaining=mods[next].mod.minutes*60;persist();go();
}
function startTimer(){
  stopTimer(); const el=$('#timer');
  const paint=()=>{ if(st.untimed){el.innerHTML='Untimed';return}
    if(st.hide){el.innerHTML=`<button id="tshow">Show timer</button>`;$('#tshow').onclick=()=>{st.hide=false;paint()};return}
    const r=Math.max(0,st.remaining),mm=Math.floor(r/60),ss=String(r%60).padStart(2,'0');
    el.className='timer'+(r<=300?' low':''); el.innerHTML=`${mm}:${ss}<button id="thide">Hide</button>`;$('#thide').onclick=()=>{st.hide=true;paint()}};
  paint();
  timerId=setInterval(()=>{st.used=(st.used||0)+1;
    if(!st.untimed){st.remaining--; if(st.remaining===300)toast('5 minutes left in this module.');
      if(st.remaining<=0){persist();toast('Time is up for this module. Moving on.');setTimeout(submitModule,1200);stopTimer();return}}
    persist(); if(!st.hide||st.untimed)paint();},1000);
}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
function toast(msg){const t=document.createElement('div');t.textContent=msg;t.style.cssText='position:fixed;left:50%;top:70px;transform:translateX(-50%);background:#1d2433;color:#fff;padding:10px 16px;border-radius:10px;z-index:200;font-weight:600';document.body.append(t);setTimeout(()=>t.remove(),3500)}
function finish(){
  const rid='r'+Date.now();
  const results=PSAT.load('psat.results',[]);
  results.unshift({rid,t:tid,date:new Date().toISOString(),answers:st.answers,flags:st.flags,untimed:st.untimed,used:st.used});
  PSAT.save('psat.results',results); localStorage.removeItem(KEY);
  location.href='test.html?result='+rid;
}
// ---------------- RESULTS ----------------
function renderResult(rid){
  document.body.classList.remove('testing');PSAT.header('results.html');PSAT.footer();
  const r=PSAT.load('psat.results',[]).find(x=>x.rid===rid);
  if(!r){app.innerHTML='<div class="wrap"><main><p>Result not found on this device. <a href="results.html">My results</a></p></main></div>';return}
  const t=D.tests.find(x=>x.id===r.t); const secStats={};
  const dom={}, skill={};
  t.sections.forEach(s=>{let c=0,n=0;s.modules.forEach(m=>m.questions.forEach(q=>{n++;const ok=PSAT.isCorrect(q,r.answers[q.id]);if(ok)c++;
    const dk=s.id+'|'+q.domain;(dom[dk]=dom[dk]||{c:0,n:0,s:s.id,name:q.domain});dom[dk].n++;if(ok)dom[dk].c++;
    const sk=s.id+'|'+q.skill;(skill[sk]=skill[sk]||{c:0,n:0,s:s.id,name:q.skill,domain:q.domain});skill[sk].n++;if(ok)skill[sk].c++;}));
    secStats[s.id]={c,n,scaled:PSAT.scale(c,n)}});
  const rw=secStats.rw.scaled, m=secStats.math.scaled, si=Math.round((2*rw+m)/10);
  const row=o=>`<tr><td>${o.name}</td><td>${o.c} / ${o.n}</td><td><div class="bar"><i style="width:${Math.round(100*o.c/o.n)}%"></i></div></td><td>${Math.round(100*o.c/o.n)}%</td></tr>`;
  const tbl=(sid,src)=>`<table class="std"><tr><th>Area</th><th>Correct</th><th style="width:35%"></th><th>%</th></tr>${Object.values(src).filter(o=>o.s===sid).map(row).join('')}</table>`;
  const weakest=Object.values(skill).filter(o=>o.c/o.n<0.75).sort((a,b)=>a.c/a.n-b.c/b.n).slice(0,4);
  let rev='';
  t.sections.forEach(s=>s.modules.forEach((mo,mi)=>{
    rev+=`<h3>${s.name}, Module ${mi+1}</h3>`;
    mo.questions.forEach((q,i)=>{const a=r.answers[q.id],ok=PSAT.isCorrect(q,a);
      const tag=a===undefined?'<span class="pill skip">Omitted</span>':ok?'<span class="pill ok">Correct</span>':'<span class="pill bad">Incorrect</span>';
      const yours=a===undefined?'—':(q.type==='mc'?LET[a]:PSAT.esc(a));
      let body=(q.passage?`<div class="passage">${q.passage}</div>`:'')+`<div class="stem" style="margin-top:10px">${q.stem}</div>`;
      if(q.type==='mc') body+='<div class="choices">'+q.choices.map((ch,j)=>`<div class="choice ${j===q.answer?'correct':(j===a?'wrong':'')}"><span class="let">${LET[j]}</span><span class="txt">${ch}</span></div>`).join('')+'</div>';
      body+=`<p><b>Your answer:</b> ${yours} &nbsp; <b>Correct answer:</b> ${PSAT.fmtAnswer(q)}</p><div class="explain"><b>Explanation.</b> ${q.explanation}</div><p class="tiny muted">${q.domain} · ${q.skill}</p>`;
      rev+=`<details class="review-item" data-ok="${ok?1:0}"><summary>${tag} Q${i+1} <span class="muted tiny">${q.skill}</span>${r.flags&&r.flags[q.id]?' <span style="color:var(--flag)">⚑</span>':''}</summary>${body}</details>`;});
  }));
  app.innerHTML=`<div class="wrap"><main><h1>${t.name}: Your Results</h1><p class="muted">${new Date(r.date).toLocaleString()}${r.untimed?' · untimed':''}</p>
  <div class="score-big">
   <div class="card"><div class="muted tiny">Estimated Total</div><div class="n">${rw+m}</div><div class="tiny muted">on a 320–1520 scale</div></div>
   <div class="card"><div class="muted tiny">Reading and Writing (est.)</div><div class="n">${rw}</div><div class="tiny muted">${secStats.rw.c} of ${secStats.rw.n} correct</div></div>
   <div class="card"><div class="muted tiny">Math (est.)</div><div class="n">${m}</div><div class="tiny muted">${secStats.math.c} of ${secStats.math.n} correct</div></div>
   <div class="card"><div class="muted tiny">Selection Index (est.)</div><div class="n">${si}</div><div class="tiny muted">(2 × RW + Math) ÷ 10</div></div>
  </div>
  <div class="tip"><b>About these scores:</b> they are <b>estimates</b> made from your percent correct. They are not official College Board scores. The real PSAT/NMSQT is adaptive and weights questions by difficulty, so your actual score can be higher or lower. Use the estimate to track progress over time.</div>
  ${weakest.length?`<div class="card"><h3 style="margin-top:0">Best next steps</h3><p>Your lowest-scoring skills on this test:</p><ul>${weakest.map(o=>`<li><b>${o.name}</b> (${o.c}/${o.n}). <a href="practice.html?domain=${encodeURIComponent(o.domain)}">Practice ${o.domain}</a></li>`).join('')}</ul></div>`:''}
  <h2>Reading and Writing breakdown</h2>${tbl('rw',dom)}<details><summary class="muted">Show by skill</summary>${tbl('rw',skill)}</details>
  <h2>Math breakdown</h2>${tbl('math',dom)}<details><summary class="muted">Show by skill</summary>${tbl('math',skill)}</details>
  <h2>Answer explanations</h2><p><label class="check"><input type="checkbox" id="onlywrong"> Show only questions I missed or skipped</label></p>
  <div id="rev">${rev}</div>
  <p><a class="btn" href="results.html">All my results</a> <a class="btn secondary" href="tests.html">Practice tests</a></p></main></div>`;
  $('#onlywrong').onchange=e=>document.querySelectorAll('.review-item').forEach(d=>d.style.display=e.target.checked&&d.dataset.ok==='1'?'none':'');
}
})();
