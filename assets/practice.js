(function(){
const $=s=>document.querySelector(s), app=$('#app'), LET='ABCD';
const ALL=PSAT.allQuestions();
const DOMS={rw:['Information and Ideas','Craft and Structure','Expression of Ideas','Standard English Conventions'],math:['Algebra','Advanced Math','Problem-Solving and Data Analysis','Geometry and Trigonometry']};
const pre=new URLSearchParams(location.search).get('domain');
let S=null;
setup();
function setup(){
  const count=d=>ALL.filter(q=>q.domain===d).length;
  const stats=PSAT.load('psat.qstats',{});
  const acc=d=>{let c=0,n=0;ALL.filter(q=>q.domain===d).forEach(q=>{const s=stats[q.id];if(s){n+=s.n;c+=s.c}});return n?` · your accuracy ${Math.round(100*c/n)}%`:''};
  const box=(sec,title)=>`<div class="card"><h3 style="margin-top:0">${title}</h3>${DOMS[sec].map(d=>`<label class="check"><input type="checkbox" name="dom" value="${d}" ${pre===d?'checked':''}> ${d} <span class="muted tiny">(${count(d)} questions${acc(d)})</span></label>`).join('')}</div>`;
  app.innerHTML=`<h1>Quick Practice</h1><p>Pick one or more topics. You'll see one question at a time and get the answer and explanation right after each one. There's no timer, so take your time and learn from each explanation.</p>
  <div class="grid">${box('rw','Reading and Writing')}${box('math','Math')}</div>
  <div class="card"><label>How many questions? <select id="num"><option>5</option><option selected>10</option><option>20</option><option value="999">All available</option></select></label>
  <label class="check"><input type="checkbox" id="unseen"> Prefer questions I haven't answered yet</label>
  <p class="tiny muted">Questions come from a shared bank that includes the questions in the two full practice tests. If you want those tests to feel new, take them first.</p>
  <button class="btn" id="go">Start practice</button> <span id="msg" class="muted tiny"></span></div>`;
  $('#go').onclick=()=>{
    const doms=[...document.querySelectorAll('input[name=dom]:checked')].map(i=>i.value);
    if(!doms.length){$('#msg').textContent='Choose at least one topic.';return}
    let pool=ALL.filter(q=>doms.includes(q.domain)); shuffle(pool);
    if($('#unseen').checked) pool.sort((a,b)=>(stats[a.id]?1:0)-(stats[b.id]?1:0));
    S={qs:pool.slice(0,+$('#num').value),i:0,res:[],checked:false,resp:undefined}; show();
  };
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}
function show(){
  const q=S.qs[S.i], isMath=q.sec==='math';
  let h=`<div class="qhead"><span class="qnum">${S.i+1}</span><span class="muted tiny">of ${S.qs.length} · ${q.domain} · ${q.skill}</span>${isMath?'<span style="margin-left:auto" class="tools"><button class="btn small secondary" id="calc">Calculator</button><button class="btn small secondary" id="ref">Reference</button></span>':''}</div>`;
  if(q.passage) h+=`<div class="passage">${q.passage}</div>`;
  h+=`<div class="stem" style="margin-top:10px">${q.stem}</div>`;
  if(q.type==='mc') h+='<div class="choices">'+q.choices.map((c,i)=>`<button class="choice" data-i="${i}"><span class="let">${LET[i]}</span><span class="txt">${c}</span></button>`).join('')+'</div>';
  else h+=`<div class="spr"><label class="muted tiny" for="spr">Type your answer (number, fraction, or decimal):</label><br><input id="spr" maxlength="6" autocomplete="off"></div>`;
  h+=`<div id="fb"></div><p style="margin-top:16px"><button class="btn" id="check">Check answer</button> <button class="btn ghost" id="quit">End practice</button></p>`;
  app.innerHTML=`<div class="card">${h}</div>`;
  if(isMath){$('#calc').onclick=PSAT.openCalc;$('#ref').onclick=PSAT.openReference}
  S.checked=false;S.resp=undefined;
  document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{if(S.checked)return;document.querySelectorAll('.choice').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');S.resp=+b.dataset.i});
  const inp=$('#spr'); if(inp) inp.oninput=()=>{inp.value=inp.value.replace(/[^0-9.\/\-−]/g,'');S.resp=inp.value.trim()||undefined};
  $('#quit').onclick=summary;
  $('#check').onclick=()=>{
    if(!S.checked){ if(S.resp===undefined){$('#fb').innerHTML='<p class="muted">Choose or type an answer first (or guess!).</p>';return}
      S.checked=true; const ok=PSAT.isCorrect(q,S.resp); S.res.push({q,ok});
      const stats=PSAT.load('psat.qstats',{}); const s=stats[q.id]||{n:0,c:0}; s.n++; if(ok)s.c++; stats[q.id]=s; PSAT.save('psat.qstats',stats);
      if(q.type==='mc') document.querySelectorAll('.choice').forEach((b,i)=>{if(i===q.answer)b.classList.add('correct');else if(i===S.resp)b.classList.add('wrong')});
      $('#fb').innerHTML=`<div class="explain"><b>${ok?'✅ Correct!':'❌ Not quite.'}</b> Correct answer: <b>${PSAT.fmtAnswer(q)}</b><br>${q.explanation}</div>`;
      $('#check').textContent=S.i<S.qs.length-1?'Next question':'See summary'; $('#fb').scrollIntoView({behavior:'smooth',block:'nearest'});
    } else { if(S.i<S.qs.length-1){S.i++;show();window.scrollTo(0,0)} else summary(); }
  };
}
function summary(){
  const c=S.res.filter(r=>r.ok).length, n=S.res.length;
  if(n){const h=PSAT.load('psat.practice',[]);h.unshift({date:new Date().toISOString(),c,n,domains:[...new Set(S.res.map(r=>r.q.domain))]});PSAT.save('psat.practice',h.slice(0,100))}
  const by={};S.res.forEach(r=>{const k=r.q.skill;(by[k]=by[k]||{c:0,n:0});by[k].n++;if(r.ok)by[k].c++});
  app.innerHTML=`<h1>Practice summary</h1><div class="card center"><div style="font-size:2.4rem;font-weight:800">${c} / ${n}</div><p class="muted">correct</p></div>
  ${n?`<table class="std"><tr><th>Skill</th><th>Correct</th></tr>${Object.entries(by).map(([k,v])=>`<tr><td>${k}</td><td>${v.c} / ${v.n}</td></tr>`).join('')}</table>`:''}
  ${S.res.filter(r=>!r.ok).length?`<h2>Review what you missed</h2>${S.res.filter(r=>!r.ok).map(r=>`<div class="review-item"><div class="tiny muted">${r.q.skill}</div>${r.q.passage?`<div class="passage">${r.q.passage}</div>`:''}<div class="stem">${r.q.stem}</div>${r.q.type==='mc'?'<ol type="A">'+r.q.choices.map(c=>`<li>${c}</li>`).join('')+'</ol>':''}<div class="explain">Correct answer: <b>${PSAT.fmtAnswer(r.q)}</b>. ${r.q.explanation}</div></div>`).join('')}`:''}
  <p><a class="btn" href="practice.html">Practice again</a> <a class="btn secondary" href="guides.html">Study guides</a></p>`;
  window.scrollTo(0,0);
}
})();
