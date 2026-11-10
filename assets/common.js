(function(){
const NAV=[['index.html','Home'],['tests.html','Practice Tests'],['practice.html','Quick Practice'],['guides.html','Study Guides'],['results.html','My Results']];
window.PSAT = window.PSAT || {};
PSAT.header = function(active){
  const h=document.createElement('header'); h.className='site';
  h.innerHTML='<div class="wrap"><a class="logo" href="index.html"><span>PSAT</span> Practice</a><nav class="main">'+
   NAV.map(([u,t])=>`<a href="${u}"${u===active?' class="on"':''}>${t}</a>`).join('')+'</nav></div>';
  document.body.prepend(h);
};
PSAT.footer = function(){
  const f=document.createElement('footer'); f.className='site';
  f.innerHTML='<div class="wrap">PSAT Practice is an independent study site and is not affiliated with or endorsed by College Board or National Merit Scholarship Corporation. PSAT/NMSQT is a registered trademark of College Board and National Merit Scholarship Corporation. All practice questions on this site are original. Scores shown here are estimates only.<br>Your progress is saved only in this browser on this device.</div>';
  document.body.append(f);
};
// ---------- storage ----------
PSAT.load=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
PSAT.save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
// ---------- data helpers ----------
PSAT.allQuestions=function(){
  const out=[];const D=window.PSAT_DATA;
  D.tests.forEach(t=>t.sections.forEach(s=>s.modules.forEach((m,mi)=>m.questions.forEach(q=>out.push(Object.assign({src:`Practice Test ${t.id}, ${s.name} Module ${mi+1}`},q))))));
  D.practiceExtra.forEach(q=>out.push(Object.assign({src:'Practice bank'},q)));
  return out;
};
PSAT.byId=function(){const m={};PSAT.allQuestions().forEach(q=>m[q.id]=q);return m};
// ---------- answer checking ----------
function parseNum(s){
  if(s==null) return NaN; s=String(s).trim().replace(/−/g,'-').replace(/\s+/g,'');
  if(!/^-?(\d+\.?\d*|\.\d+)(\/-?\d+\.?\d*)?$/.test(s)) return NaN;
  if(s.includes('/')){const [a,b]=s.split('/');const d=parseFloat(b);return d===0?NaN:parseFloat(a)/d}
  return parseFloat(s);
}
PSAT.parseNum=parseNum;
PSAT.isCorrect=function(q,resp){
  if(resp===undefined||resp===null||resp==='') return false;
  if(q.type==='mc') return resp===q.answer;
  const v=parseNum(resp), a=parseNum(q.answer);
  if(isNaN(v)) return false;
  if(Math.abs(v-a)<1e-9) return true;
  // repeating decimals: accept answers that fill the box (e.g. .6666 or .6667 for 2/3)
  const dec=String(resp).replace('-','').split('.')[1];
  return dec!==undefined && dec.length>=3 && Math.abs(v-a)<1e-3 && Math.abs(a*1000-Math.round(a*1000))>1e-9;
};
PSAT.fmtAnswer=function(q){return q.type==='mc'?'ABCD'[q.answer]:q.answer};
// ---------- estimated scaled score ----------
// Rough conversion from percent correct to the 160-760 section scale. This is NOT an official
// College Board conversion; real scores depend on question difficulty and the adaptive module.
const CURVE=[[0,160],[.10,230],[.20,300],[.30,360],[.40,410],[.50,460],[.60,510],[.70,560],[.80,620],[.90,680],[.95,720],[1,760]];
PSAT.scale=function(correct,total){
  const p=total?correct/total:0;
  for(let i=1;i<CURVE.length;i++){const [p0,s0]=CURVE[i-1],[p1,s1]=CURVE[i];
    if(p<=p1){const s=s0+(s1-s0)*(p-p0)/(p1-p0);return Math.min(760,Math.max(160,Math.round(s/10)*10))}}
  return 760;
};
PSAT.esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// ---------- reference sheet + calculator modals ----------
PSAT.REFERENCE=`<div class="formula">
<div><b>Circle</b><br>A = πr²<br>C = 2πr</div>
<div><b>Rectangle</b><br>A = ℓw</div>
<div><b>Triangle</b><br>A = ½bh</div>
<div><b>Pythagorean theorem</b><br>c² = a² + b²</div>
<div><b>Special right triangles</b><br>30°-60°-90°: x, x√3, 2x<br>45°-45°-90°: s, s, s√2</div>
<div><b>Rectangular prism</b><br>V = ℓwh</div>
<div><b>Cylinder</b><br>V = πr²h</div>
<div><b>Sphere</b><br>V = (4/3)πr³</div>
<div><b>Cone</b><br>V = (1/3)πr²h</div>
<div><b>Pyramid</b><br>V = (1/3)ℓwh</div>
</div><p class="tiny">The number of degrees of arc in a circle is 360. The number of radians of arc in a circle is 2π. The sum of the measures in degrees of the angles of a triangle is 180.</p>`;
PSAT.modal=function(id,title,html,cls){
  let m=document.getElementById(id);
  if(!m){m=document.createElement('div');m.className='modal';m.id=id;
    m.innerHTML=`<div class="box ${cls||''}" role="dialog" aria-label="${title}"><div class="mhead"><h3>${title}</h3><button class="btn small ghost" data-close>Close</button></div><div class="mbody"></div></div>`;
    document.body.append(m);
    m.addEventListener('click',e=>{if(e.target===m||e.target.hasAttribute('data-close'))m.classList.remove('open')});
    m.querySelector('.mbody').innerHTML=html; if(cls==='calc'){m.querySelector('.mbody').style.cssText='flex:1;display:flex;flex-direction:column'}}
  m.classList.add('open'); return m;
};
PSAT.openReference=()=>PSAT.modal('refm','Math Reference Sheet',PSAT.REFERENCE);
PSAT.openCalc=()=>PSAT.modal('calcm','Graphing Calculator (Desmos)',
 `<p class="tiny muted" style="margin:0 0 6px">Free Desmos graphing calculator, the same kind built into the real test app. If it doesn't load, <a href="https://www.desmos.com/calculator" target="_blank" rel="noopener">open Desmos in a new tab</a>. Your timer keeps running.</p><iframe src="https://www.desmos.com/calculator" title="Desmos graphing calculator" loading="lazy" allow="clipboard-write"></iframe>`,'calc');
})();
