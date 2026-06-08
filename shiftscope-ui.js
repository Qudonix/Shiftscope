// ONBOARDING
// ═══════════════════════════════════════════════════════════════════
function obNext(step){
  if(step===3){
    const rate=parseFloat(document.getElementById('ob-rate').value);
    if(!rate||rate<=0){alert('Please enter a valid hourly rate.');return;}
    profile.rate=rate;
    const active=document.querySelector('#ob-prof-grid .prof-card.active');
    if(active)profile.professionP=parseFloat(active.dataset.p);
  }
  document.querySelectorAll('.onboard-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('ob-step-'+step).classList.add('active');
}
function selectProf(el){
  document.querySelectorAll('#ob-prof-grid .prof-card').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  profile.professionP=parseFloat(el.dataset.p);
}
function stepOb(id,delta,min,max){
  const el=document.getElementById(id);
  let v=Math.round((parseFloat(el.value)+delta)*4)/4;
  v=Math.min(Math.max(v,min),max);
  el.value=v;
  const h=Math.floor(v),m=Math.round((v-h)*60);
  document.getElementById(id+'-val').textContent=h+'h'+(m>0?' '+m+'m':'');
}
function finishOnboarding(){
  loadPrefs();
  profile.contracted=parseFloat(document.getElementById('ob-contracted').value)||9.25;
  profile.otMult=parseFloat(document.getElementById('ob-ot-mult').value)||1.5;
  profile.sleepHours=7.5;profile.streakDays=1;profile.daysOffAgo=1;
  lastFatigue=deriveFatigueFromProxy(profile.sleepHours,profile.streakDays,profile.daysOffAgo);
  sessionBaseline=lastFatigue;
  saveState();
  showMainApp();
}

// ═══════════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════════
function saveState(){
  try{
    localStorage.setItem('ss_profile',JSON.stringify(profile));
    localStorage.setItem('ss_fatigue',lastFatigue!==null?String(lastFatigue):'');
    localStorage.setItem('ss_baseline',sessionBaseline!==null?String(sessionBaseline):'');
    localStorage.setItem('ss_history',JSON.stringify(shiftHistory));
    localStorage.setItem('ss_onboarded','1');
    localStorage.setItem('ss_ver','63');
  }catch(e){}
}
function loadState(){
  try{
    if(!localStorage.getItem('ss_onboarded'))return false;
    if(localStorage.getItem('ss_ver')!=='63'){localStorage.clear();return false;}
    const p=localStorage.getItem('ss_profile');
    if(p)Object.assign(profile,JSON.parse(p));
    const f=localStorage.getItem('ss_fatigue');if(f)lastFatigue=parseFloat(f);
    const b=localStorage.getItem('ss_baseline');
    if(b)sessionBaseline=parseFloat(b);else if(lastFatigue!==null)sessionBaseline=lastFatigue;
    const h=localStorage.getItem('ss_history');if(h)shiftHistory=JSON.parse(h);
    return true;
  }catch(e){return false;}
}

// ═══════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════
function setSeg(groupId,btn){
  document.querySelectorAll('#'+groupId+' .seg-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}
function stepField(id,delta,min,max){
  const el=document.getElementById(id);
  let v=Math.min(Math.max(parseInt(el.value)+delta,min),max);
  el.value=v;
  document.getElementById(id+'-val').textContent=v;
  updateDurationDisplays();
}
function setMinSeg(segId,hiddenId,btn,val){
  qcMarkInputChanged();
  document.querySelectorAll('#'+segId+' .seg-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(hiddenId).value=val;
  updateQCDisplays();
}
function checkNMW(v,id){document.getElementById(id).style.display=parseFloat(v)<11.44&&v!==''?'block':'none';}

function updateScorePill(overrideScore){
  // BADGE RULE:
  //   Before calculate() runs: shows baseline ("Before shift: N")
  //   After  calculate() runs: shows projected ("Projected: N")
  // The label changes so the number is never ambiguous.
  const pill=document.getElementById('current-score-pill');
  if(!pill)return;
  const isProjected = overrideScore !== undefined;
  const pillScore = isProjected ? overrideScore
    : (sessionBaseline !== null ? sessionBaseline : lastFatigue);
  if(pillScore===null){pill.textContent='Fatigue: —';return;}
  const b=getBand(pillScore);
  pill.textContent = isProjected
    ? `Projected: ${Math.round(pillScore)}`
    : `Before shift: ${Math.round(pillScore)}`;
  pill.style.color=b.color;
  pill.style.borderColor=b.color+'60';
  pill.style.background=b.color+'18';
}
function selectShiftType(el,cls,intensity){
  qcMarkInputChanged();
  document.querySelectorAll('.shift-type-card').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('shift-intensity').value=intensity;
}

function initQC(){
  const contracted=profile.contracted||9.25;
  const bh=Math.floor(contracted);
  const bm=Math.round((contracted-bh)*60);
  const bm15=Math.round(bm/15)*15;
  document.getElementById('base-h').value=bh;
  document.getElementById('base-m').value=bm15;
  document.getElementById('base-h-val').textContent=bh;
  document.querySelectorAll('#base-m-seg .seg-btn').forEach(btn=>{
    btn.classList.toggle('active',parseInt(btn.textContent.replace(':',''))===bm15);
  });
  // Restore strategy mode display
  const strat=profile.strategyMode||'balanced';
  document.getElementById('qc-strategy').value=strat;
  document.querySelectorAll('#qc-strategy-grid .strategy-card').forEach(c=>c.classList.remove('active'));
  const activeCards=document.querySelectorAll('#qc-strategy-grid .strategy-card');
  const stratMap=['protect_energy','balanced','push_savings','urgent_cash'];
  activeCards.forEach((c,i)=>{if(stratMap[i]===strat)c.classList.add('active');});
  updateQCDisplays();

  qcInitWeekStrip();
  qcRenderState();
}

function toggleBaseEdit(){
  const panel=document.getElementById('base-edit-panel');
  const arrow=document.getElementById('base-edit-arrow');
  const open=panel.style.display!=='none';
  panel.style.display=open?'none':'block';
  arrow.style.transform=open?'':'rotate(90deg)';
}
function toggleSplitShift(){
  const panel=document.getElementById('split-panel');
  const arrow=document.getElementById('split-arrow');
  const open=panel.style.display!=='none';
  panel.style.display=open?'none':'block';
  arrow.style.transform=open?'':'rotate(90deg)';
  updateQCDisplays();
}
function stepBaseH(delta){
  qcMarkInputChanged();
  const el=document.getElementById('base-h');
  let v=Math.min(Math.max(parseInt(el.value)+delta,0),18);
  el.value=v;document.getElementById('base-h-val').textContent=v;
  updateQCDisplays();
}
function stepExtra(delta){
  qcMarkInputChanged();
  const el=document.getElementById('extra-h');
  let v=Math.min(Math.max(parseInt(el.value)+delta,0),12);
  el.value=v;document.getElementById('extra-h-val').textContent=v;
  updateQCDisplays();
}
function getQCHours(){
  const baseH=parseInt(document.getElementById('base-h').value)||0;
  const baseM=parseInt(document.getElementById('base-m').value)||0;
  const extraH=parseInt(document.getElementById('extra-h').value)||0;
  const extraM=parseInt(document.getElementById('extra-m').value)||0;
  const base=baseH+baseM/60,extra=extraH+extraM/60;
  const splitOpen=document.getElementById('split-panel').style.display!=='none';
  let doneH=base;
  if(splitOpen){
    const dh=parseInt(document.getElementById('done-h').value)||0;
    const dm=parseInt(document.getElementById('done-m').value)||0;
    doneH=dh+dm/60;
  }
  return{base,extra,total:base+extra,doneH};
}
function updateQCDisplays(){
  const{base,extra,total}=getQCHours();
  const contracted=profile.contracted||9.25;
  const bdEl=document.getElementById('base-day-display');
  if(bdEl)bdEl.textContent=fmtH(base);
  const ptEl=document.getElementById('projected-total-display');
  const ptBase=document.getElementById('pt-base');
  const ptExtra=document.getElementById('pt-extra');
  if(ptEl)ptEl.textContent=fmtH(total);
  if(ptBase)ptBase.textContent=fmtH(base);
  if(ptExtra)ptExtra.textContent='+ '+fmtH(extra);
  const ot=Math.max(0,total-contracted);
  const banner=document.getElementById('ot-auto-banner');
  const txt=document.getElementById('ot-auto-text');
  if(banner&&txt){
    if(ot>0.05){
      txt.innerHTML='<span style="color:rgba(252,211,77,0.6)">Standard day</span><span>'+fmtH(base)+'</span>'
        +'<span style="color:rgba(252,211,77,0.6)">Extra offered</span><span>+ '+fmtH(extra)+'</span>'
        +'<span style="color:rgba(252,211,77,0.6)">Overtime hours</span><span>'+fmtH(ot)+'</span>'
        +'<span style="color:rgba(252,211,77,0.6)">OT rate</span><span>'+(profile.otMult||1.5)+'x</span>';
      banner.style.display='block';
    }else{banner.style.display='none';}
  }
}
function updateDurationDisplays(){
  const dh=parseInt(document.getElementById('done-h')?.value)||0;
  const dm=parseInt(document.getElementById('done-m')?.value)||0;
  const dd=document.getElementById('done-display');
  if(dd)dd.textContent=(dh===0&&dm===0)?'0h':dh+'h'+(dm>0?' '+dm+'m':'');
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: GOAL IMPACT CARD
// ═══════════════════════════════════════════════════════════════════
function renderGoalImpact(gi) {
  const p1 = document.getElementById('goal-impact-p1');
  const p2 = document.getElementById('goal-impact-p2');
  if (!gi) {
    if (p1) p1.style.display = 'none';
    if (p2) p2.style.display = 'none';
    return;
  }

  // ── P1: compact goal chip ──
  if (p1) {
    p1.style.display = 'block';
    // Progress bar (income/fatigue types)
    const showBar = gi.pctBefore !== null && gi.pctAfter !== null;
    const barHTML = showBar ? `
      <div style="margin:8px 0 4px;height:6px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;position:relative;">
        <div style="position:absolute;left:0;top:0;height:100%;width:${gi.pctBefore}%;background:rgba(255,255,255,0.2);border-radius:3px;transition:width 0.4s;"></div>
        <div style="position:absolute;left:0;top:0;height:100%;width:${gi.pctAfter}%;background:${gi.statusColor};border-radius:3px;opacity:0.85;transition:width 0.4s;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.58rem;color:var(--dim);margin-top:2px;">
        <span>Now: ${gi.type === 'fatigue' ? Math.round(gi.pctBefore) + '%' : gi.pctBefore + '%'}</span>
        <span style="color:${gi.statusColor};">After: ${gi.pctAfter}% ${gi.pctAfter >= 100 ? '✓' : ''}</span>
      </div>` : '';

    // Contribution line
    let contribLine = '';
    if (gi.type === 'income' || gi.type === 'monthly') {
      contribLine = `<div style="font-size:0.65rem;color:var(--dim);margin-top:5px;">This shift: <span style="color:${gi.statusColor};font-weight:700;">${fmt(gi.thisShiftContribution)} net</span>${gi.extraContribution > 0 ? ` (${fmt(gi.extraContribution)} from extra hours)` : ''}</div>`;
    }

    // Build context-aware lead line based on proximity to target
    let p1LeadLine = `<div style="font-size:0.75rem;color:var(--muted);line-height:1.4;">${gi.summary}</div>`;
    if (gi.pctAfter !== null) {
      const remaining = gi.remainingAfter;
      const contrib = gi.thisShiftContribution;
      if (gi.pctAfter >= 100) {
        // Target reached with this shift
        p1LeadLine = `<div style="font-size:0.82rem;font-weight:700;color:${gi.statusColor};line-height:1.4;">Target reached with this shift. ✓</div>`;
      } else if (gi.pctAfter >= 80 && gi.type !== 'fatigue') {
        // Very close — lead with gap remaining
        p1LeadLine = `<div style="font-size:0.82rem;font-weight:700;color:${gi.statusColor};line-height:1.4;">${remaining > 0 ? fmt(remaining) + ' to go.' : 'On target.'} This shift covers ${fmt(contrib)} of it.</div>`;
      } else if (gi.shiftsToClose <= 2 && gi.type !== 'fatigue') {
        // Close in shifts
        p1LeadLine = `<div style="font-size:0.78rem;font-weight:600;color:var(--muted);line-height:1.4;">${gi.shiftsToClose === 1 ? 'One more similar shift closes the week.' : 'Two more similar shifts close the gap.'}</div>`;
      } else {
        p1LeadLine = `<div style="font-size:0.75rem;color:var(--muted);line-height:1.4;">${gi.summary}</div>`;
      }
    }

    p1.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;">
        <div style="font-size:0.6rem;font-weight:700;color:var(--dim);letter-spacing:0.08em;text-transform:uppercase;">${gi.label || 'Goal'}</div>
        <div style="font-size:0.75rem;font-weight:800;color:${gi.statusColor};">${gi.status}</div>
      </div>
      ${p1LeadLine}
      ${barHTML}
      ${contribLine}
    `;
  }

  // ── P2: full goal card ──
  if (p2) {
    p2.style.display = 'block';

    const showBar = gi.pctBefore !== null && gi.pctAfter !== null;
    const barHTML = showBar ? `
      <div style="margin:10px 0 4px;height:8px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;position:relative;">
        <div style="position:absolute;left:0;top:0;height:100%;width:${gi.pctBefore}%;background:rgba(255,255,255,0.15);border-radius:4px;"></div>
        <div style="position:absolute;left:0;top:0;height:100%;width:${gi.pctAfter}%;background:${gi.statusColor};border-radius:4px;opacity:0.8;transition:width 0.5s;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:var(--muted);margin-top:4px;">
        <span>Current week: ${gi.pctBefore}%</span>
        <span style="color:${gi.statusColor};font-weight:700;">After this shift: ${gi.pctAfter}%${gi.pctAfter >= 100 ? ' ✓' : ''}</span>
      </div>` : '';

    let detailRows = '';
    if (gi.type === 'income' || gi.type === 'monthly') {
      detailRows = `
        <div class="recovery-row" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
          <span class="recovery-label">Target</span>
          <span class="recovery-val">${fmt(gi.target)}</span>
        </div>
        <div class="recovery-row">
          <span class="recovery-label">Earned this week (saved)</span>
          <span class="recovery-val" style="color:var(--white);">${fmt(gi.progress)}</span>
        </div>
        <div class="recovery-row">
          <span class="recovery-label">This shift adds (net)</span>
          <span class="recovery-val" style="color:#4ADE80;">${fmt(gi.thisShiftContribution)}</span>
        </div>
        ${gi.extraContribution > 0 ? `<div class="recovery-row">
          <span class="recovery-label">Of which: extra hours net</span>
          <span class="recovery-val" style="color:#38BDF8;">${fmt(gi.extraContribution)}</span>
        </div>` : ''}
        <div class="recovery-row">
          <span class="recovery-label">Remaining after this shift</span>
          <span class="recovery-val" style="color:${gi.statusColor};">${gi.done ? '✓ Done' : fmt(gi.remainingAfter)}</span>
        </div>
        ${gi.shiftsToClose > 0 ? `<div class="recovery-row">
          <span class="recovery-label">More shifts like this to close gap</span>
          <span class="recovery-val">~${gi.shiftsToClose}</span>
        </div>` : ''}
      `;
    } else if (gi.type === 'fatigue') {
      detailRows = `
        <div class="recovery-row" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
          <span class="recovery-label">Your fatigue ceiling</span>
          <span class="recovery-val">${Math.round(gi.ceiling)} / 100</span>
        </div>
        <div class="recovery-row">
          <span class="recovery-label">Estimated end-of-shift fatigue</span>
          <span class="recovery-val" style="color:${gi.statusColor};">${Math.round(gi.fullFatigue)}</span>
        </div>
        <div class="recovery-row">
          <span class="recovery-label">Headroom remaining</span>
          <span class="recovery-val" style="color:${gi.overCeiling ? '#EF4444' : '#22C55E'};">${gi.overCeiling ? 'Exceeded' : '+' + Math.round(gi.headroom) + ' pts'}</span>
        </div>
      `;
    } else if (gi.type === 'balance') {
      detailRows = `
        <div class="recovery-row" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
          <span class="recovery-label">Effort-to-pay ratio</span>
          <span class="recovery-val" style="color:${gi.statusColor};">${gi.etp.toFixed(1)}</span>
        </div>
        <div class="recovery-row">
          <span class="recovery-label">Best balance target</span>
          <span class="recovery-val">Above 6.5</span>
        </div>
      `;
    }

    p2.innerHTML = `
      <div style="font-size:0.65rem;font-weight:800;letter-spacing:1.5px;color:var(--muted);margin-bottom:10px;">GOAL IMPACT — ${(gi.label || 'GOAL').toUpperCase()}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div style="font-size:1.1rem;font-weight:900;color:${gi.statusColor};">${gi.status}</div>
      </div>
      <div style="font-size:0.82rem;color:var(--muted);line-height:1.5;">${gi.summary}</div>
      ${barHTML}
      ${detailRows}
    `;
  }
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: PUSH RANGE BAR
// ═══════════════════════════════════════════════════════════════════
function renderPushRangeBar(pushRange, extraHours) {
  const { efficientMin, efficientMax, stretchMax } = pushRange;
  const maxDisplay = Math.max(stretchMax * 1.35, extraHours * 1.1, 6);
  const pct = v => Math.min(100, (v / maxDisplay) * 100);

  function buildTrack(trackEl, labelsEl) {
    if (!trackEl) return;
    trackEl.innerHTML = `
      <div class="range-zone" style="left:0;width:${pct(efficientMin)}%;background:rgba(255,255,255,0.04);"></div>
      <div class="range-zone" style="left:${pct(efficientMin)}%;width:${pct(efficientMax)-pct(efficientMin)}%;background:rgba(34,197,94,0.25);border-left:2px solid #22C55E;border-right:2px solid #22C55E;"></div>
      <div class="range-zone" style="left:${pct(efficientMax)}%;width:${pct(stretchMax)-pct(efficientMax)}%;background:rgba(245,158,11,0.18);border-right:2px solid #F59E0B;"></div>
      <div class="range-zone" style="left:${pct(stretchMax)}%;right:0;background:rgba(239,68,68,0.1);"></div>
      ${extraHours > 0 ? `<div class="range-marker" style="left:${pct(extraHours)}%;"></div>` : ''}
    `;
    if (labelsEl) {
      labelsEl.innerHTML = `
        <span>0h</span>
        <span style="color:#22C55E;">+${fmtH(efficientMin)}–+${fmtH(efficientMax)}</span>
        <span style="color:#F59E0B;">+${fmtH(stretchMax)}</span>
        <span style="color:#EF4444;">Over</span>
      `;
    }
  }

  // P1 compact bar
  buildTrack(document.getElementById('push-range-track'), document.getElementById('push-range-labels'));
  // P2 full bar
  buildTrack(document.getElementById('sum-push-range-track'), document.getElementById('sum-push-range-labels'));

  // P1 compact efficient label
  const p1eff = document.getElementById('pr-efficient');
  if (p1eff) p1eff.textContent = `+${fmtH(efficientMin)} – +${fmtH(efficientMax)} extra`;

  // P2 detail tiles
  document.getElementById('sum-pr-efficient').textContent = `+${fmtH(efficientMin)} – +${fmtH(efficientMax)}`;
  const _prInline = document.getElementById('pr-efficient-inline');
  if(_prInline) _prInline.textContent = `+${fmtH(efficientMin)}–${fmtH(efficientMax)}`;
  document.getElementById('pr-stretch').textContent   = `+${fmtH(efficientMax)} – +${fmtH(stretchMax)}`;
  document.getElementById('pr-overreach').textContent = `above +${fmtH(stretchMax)}`;

  // P2 zone message
  const msgEl = document.getElementById('pr-zone-msg');
  if (msgEl) {
    if (extraHours > stretchMax) {
      msgEl.textContent = `Your choice (${fmtH(extraHours)} extra) is in the overreach zone — ${fmtH(extraHours - stretchMax)} past the stretch ceiling.`;
      msgEl.style.color = '#FCA5A5';
    } else if (extraHours > efficientMax) {
      msgEl.textContent = `Your choice (${fmtH(extraHours)} extra) is in the stretch zone — ${fmtH(extraHours - efficientMax)} above the efficient range.`;
      msgEl.style.color = '#FCD34D';
    } else if (extraHours >= efficientMin) {
      msgEl.textContent = `Your choice (${fmtH(extraHours)} extra) sits within today's efficient push range. Good return-to-fatigue ratio.`;
      msgEl.style.color = '#86EFAC';
    } else if (extraHours > 0) {
      msgEl.textContent = `Your choice (${fmtH(extraHours)} extra) is below the efficient range. You could extend to +${fmtH(efficientMax)} without significant recovery cost.`;
      msgEl.style.color = '#a5b4fc';
    } else {
      msgEl.textContent = `No extra hours entered. Today's efficient push range is +${fmtH(efficientMin)} to +${fmtH(efficientMax)} extra.`;
      msgEl.style.color = 'var(--muted)';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// GOAL IMPACT ENGINE
// Computes how today's shift moves the needle on the user's goal.
// Returns a structured object for rendering in both P1 and P2.
// ═══════════════════════════════════════════════════════════════════
function computeGoalImpact(totalNet, marginalNet, fullFatigue, etp) {
  const goal = profile.goal || {};
  const type = goal.type || 'income';

  // Refresh weekly progress from history (last 7 saved shifts)
  const weekNet = shiftHistory.slice(0, 7).reduce((s, h) => s + h.net, 0);
  const weekFatigue = shiftHistory.length > 0
    ? shiftHistory.slice(0, 7).reduce((s, h) => s + h.fatigue, 0) / Math.min(shiftHistory.slice(0,7).length, 7)
    : null;

  if (type === 'income' || type === 'monthly') {
    const target = goal.weeklyTarget || 500;
    const progress = weekNet;
    const afterThisShift = progress + totalNet;
    const remaining = Math.max(0, target - progress);
    const remainingAfter = Math.max(0, target - afterThisShift);
    const pctBefore = Math.min(100, (progress / target) * 100);
    const pctAfter  = Math.min(100, (afterThisShift / target) * 100);
    const gained = pctAfter - pctBefore;
    const done = afterThisShift >= target;

    // How many more similar shifts to close the gap after this one
    const shiftsToClose = remainingAfter > 0 && totalNet > 0
      ? Math.ceil(remainingAfter / totalNet) : 0;

    let status, statusColor, summary;
    if (done) {
      status = 'Target reached'; statusColor = '#22C55E';
      summary = `${fmt(target)} weekly target met. Any further shifts this week are discretionary.`;
    } else if (remainingAfter <= 0) {
      status = 'On track'; statusColor = '#4ADE80';
      summary = `This shift closes the gap. ${fmt(remainingAfter <= 0 ? 0 : remainingAfter)} remaining.`;
    } else {
      status = `${fmt(remainingAfter)} to go`; statusColor = '#38BDF8';
      summary = shiftsToClose === 1
        ? `One more similar shift would reach your target.`
        : shiftsToClose > 0
          ? `~${shiftsToClose} more similar shifts to reach ${fmt(target)}.`
          : `This shift adds ${fmt(totalNet)} net toward your ${fmt(target)} target.`;
    }

    return {
      type, target, progress, afterThisShift, remaining, remainingAfter,
      pctBefore: Math.round(pctBefore), pctAfter: Math.round(pctAfter),
      gained: Math.round(gained), done, shiftsToClose,
      thisShiftContribution: totalNet,
      extraContribution: marginalNet,
      status, statusColor, summary,
      label: type === 'monthly' ? 'Monthly savings' : 'Weekly income',
    };
  }

  if (type === 'fatigue') {
    const ceiling = goal.ceiling || 45;
    const overCeiling = fullFatigue > ceiling;
    const nearCeiling = fullFatigue > ceiling * 0.85;
    const headroom = Math.max(0, ceiling - fullFatigue);
    const status = overCeiling ? 'Above ceiling' : nearCeiling ? 'Approaching' : 'Within ceiling';
    const statusColor = overCeiling ? '#EF4444' : nearCeiling ? '#F59E0B' : '#22C55E';
    const summary = overCeiling
      ? `Estimated fatigue (${Math.round(fullFatigue)}) is above your ceiling of ${Math.round(ceiling)}.`
      : nearCeiling
        ? `Fatigue is within ${Math.round(ceiling - fullFatigue)} points of your ceiling.`
        : `${Math.round(headroom)} points of headroom below your fatigue ceiling.`;
    return {
      type, ceiling, fullFatigue, headroom, overCeiling, nearCeiling,
      status, statusColor, summary, label: 'Fatigue ceiling',
      pctBefore: Math.min(100, Math.round((weekFatigue||0) / ceiling * 100)),
      pctAfter:  Math.min(100, Math.round(fullFatigue / ceiling * 100)),
    };
  }

  if (type === 'balance') {
    const isStrong = etp >= 6.5;
    const isFair = etp >= 4.0;
    const status = isStrong ? 'Strong return' : isFair ? 'Fair return' : 'Weak return';
    const statusColor = isStrong ? '#22C55E' : isFair ? '#F59E0B' : '#EF4444';
    const summary = isStrong
      ? `ETP of ${etp.toFixed(1)} is a strong result for Best Balance goal.`
      : isFair
        ? `ETP of ${etp.toFixed(1)} is fair — look for shifts above 6.5 for best balance.`
        : `ETP of ${etp.toFixed(1)} is below your Best Balance target. Consider a shorter shift or lighter intensity.`;
    return {
      type, etp,
      status, statusColor, summary, label: 'Best balance',
      pctBefore: null, pctAfter: null,
    };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CALCULATE
// ═══════════════════════════════════════════════════════════════════

// Sync scenario panel inputs to the hidden IDs that calculate() reads
function syncScenarioInputs() {
  if (!checkModeIsScenario) return;
  // Copy scenario base-h/base-m to the hidden inputs calculate() reads
  var bh = document.getElementById('base-h-scen');
  var bm = document.getElementById('base-m-scen');
  var bhTarget = document.getElementById('base-h');
  var bmTarget = document.getElementById('base-m');
  if (bh && bhTarget) bhTarget.value = bh.value;
  if (bm && bmTarget) bmTarget.value = bm.value;
  // Copy scenario extra values
  var exhScen = document.getElementById('extra-h-val-scen');
  var exhLive = document.getElementById('extra-h-val');
  var exhHidden = document.getElementById('extra-h');
  if (exhScen && exhHidden) exhHidden.value = exhScen.textContent || '0';
  var exmScen = document.getElementById('extra-m-scen');
  var exmLive = document.getElementById('extra-m');
  if (exmScen && exmLive) exmLive.value = exmScen.value;
}

function calculate(){
  const errBox=document.getElementById('qc-error');
  errBox.style.display='none';
  syncScenarioInputs();

  // Micro-moment: show "Reading..." on button while engine runs
  const _calcBtn = document.getElementById('qc-calc-btn');
  if(_calcBtn){
    _calcBtn.textContent = 'Reading…';
    _calcBtn.disabled = true;
    _calcBtn.style.opacity = '0.7';
  }

  const I          = parseFloat(document.getElementById('shift-intensity')?.value)||1.0;
  const P          = profile.professionP;
  const rate       = profile.rate;
  const otMult     = profile.otMult||1.5;
  const contracted = profile.contracted||9.25;
  const region     = document.getElementById('tax-region').value;
  const strategyMode = document.getElementById('qc-strategy').value || profile.strategyMode || 'balanced';
  profile.strategyMode = strategyMode;

  const{base,extra,total,doneH}=getQCHours();

  // Validation
  const errors=[];
  if(extra<0.25)errors.push('Extra hours must be at least 15 minutes.');
  if(rate<=0)errors.push('Set your hourly rate in Settings.');
  if(total>24)errors.push('Projected total cannot exceed 24 hours.');
  if(errors.length){errBox.textContent=errors.join(' ');errBox.style.display='block';return;}

  // ── PAY CALC ──
  const baseWithinContracted=Math.min(base,contracted);
  const baseOverContracted=Math.max(0,base-contracted);
  const baseGross=baseWithinContracted*rate+baseOverContracted*rate*otMult;
  const alreadyUsed=Math.min(base,contracted);
  const extraBasicH=Math.max(0,Math.min(extra,contracted-alreadyUsed));
  const extraOTH=Math.max(0,extra-extraBasicH);
  const extraGross=extraBasicH*rate+extraOTH*rate*otMult;
  const totalGross=baseGross+extraGross;
  const{net:totalNet,deductions:totalDed}=calcNetPay(totalGross,region);
  const{net:baseNet}=calcNetPay(baseGross,region);
  const marginalNet=totalNet-baseNet;
  const marginalGross=extraGross;
  const marginalTax=marginalGross-marginalNet;
  const netLow=totalNet*0.93,netHigh=totalNet*1.07;
  const taxPct=totalGross>0?totalDed/totalGross*100:0;

  // ── FATIGUE ──
  // SINGLE V2 CALL: calcFatigueV2 scores the FULL shift (base + extra) in one pass.
  // This guarantees the three reconcilable metrics:
  //   baselineFatigue  = score entering today's shift (from history or proxy)
  //   addedFatigue     = DutyLoad(base+extra) + CircadianPenalty  [shift cost]
  //   projectedFatigue = addedFatigue + contextFatigue            [displayed total]
  //
  // We do NOT call calcFatigue twice. The old two-call approach (base then extra)
  // re-applied SP and CP on the extra hours, inflating marginalFatigue incorrectly.
  if(sessionBaseline===null) sessionBaseline=deriveFatigueFromProxy(profile.sleepHours||7.5,profile.streakDays||1,profile.daysOffAgo||1);
  const baselineFatigue=sessionBaseline;  // formal metric: score BEFORE shift
  const So=profile.sleepHours||7.5;
  const t0=profile.shiftStartHour!==undefined?profile.shiftStartHour:7;
  const Sd=profile.streakDays||1;
  const Dr=profile.daysOffAgo||1;
  const splitOpen=document.getElementById('split-panel').style.display!=='none';
  const shiftHoursForCalc = splitOpen ? doneH + extra : base + extra;
  const fatigueResult = calcFatigueV2(shiftHoursForCalc, I, P, baselineFatigue, So, t0, Sd, Dr);
  const fullFatigue     = fatigueResult.projectedFatigue;   // PROJECTED — shown after calc
  const addedFatigue    = fatigueResult.addedFatigue;       // shift cost (DL + CP)
  // marginalFatigue = added fatigue from the EXTRA portion only.
  // Computed by comparing full shift V2 against base-only V2.
  // Both use the same context inputs — no SP/CP inflation.
  const baseOnlyResult  = calcFatigueV2(splitOpen?doneH:base, I, P, baselineFatigue, So, t0, Sd, Dr);
  const marginalFatigue = Math.max(0, fullFatigue - baseOnlyResult.projectedFatigue);
  // Explanation trail — always uses V2, always consistent with displayed numbers
  const fatigueTrace    = explainFatigue(shiftHoursForCalc, I, P, baselineFatigue, So, t0, Sd, Dr);

  const etp=totalNet/Math.max(fullFatigue,1);
  const etpLabel=getETPLabel(etp,fullFatigue,total);
  const band=getBand(fullFatigue);

  // ── RECOVERY-AWARE ENGINE ──
  const pushRange = computePushRange(base, I, P, sessionBaseline, strategyMode);
  const recoveryImpact = computeRecoveryImpact(extra, total, I, P, sessionBaseline);

  // ── VERDICT (v2) ──
  const verdict = getVerdictV2(fullFatigue, etp, extra, pushRange, recoveryImpact, strategyMode, marginalNet);

  // ── WEEKLY STRATEGY NOTE ──
  const weeklyNote = getWeeklyStrategyNote(extra, pushRange, recoveryImpact, strategyMode, marginalNet, totalNet);

  // ── DEBUG AUDIT (console.table — open browser console to read) ──
  buildDebugOutput(fatigueResult, pushRange, verdict, baselineFatigue);

  // ── CO-PILOT ──
  const copilot = getCopilot(fullFatigue, etp, So, totalGross, totalNet, false, fatigueTrace);

  // ── GOAL IMPACT ──
  const goalImpact = computeGoalImpact(totalNet, marginalNet, fullFatigue, etp);
  lastCalcResult={
    date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),
    basicH:extra,otH:extraOTH,totalH:total,
    shiftType:I===0.8?'Light':I===1.0?'Standard':'Heavy',
    rate,otMult,gross:totalGross,net:totalNet,
    fatigue:fullFatigue,band:band.name,bandColor:band.color,
    etp,isNightShift:false,region,
    _verdict:{label:verdict.label,summary:verdict.summary,emoji:verdict.emoji||'•',color:verdict.color}
  };

  updateScorePill(fullFatigue);

  // ── RENDER: FATIGUE EXPLANATION TRAIL (P2) ──
  const traceCard=document.getElementById('fatigue-trace-card');
  const traceList=document.getElementById('fatigue-trace-list');
  if(traceCard&&traceList&&fatigueTrace&&fatigueTrace.reasons&&fatigueTrace.reasons.length>0){
    traceCard.style.display='block';
    traceList.innerHTML=fatigueTrace.reasons.map(r=>
      `<div style="font-size:0.72rem;color:var(--muted);padding:5px 9px;background:rgba(255,255,255,0.03);border-radius:7px;border-left:2px solid rgba(56,189,248,0.3);">${r}</div>`
    ).join('');
  } else if(traceCard){traceCard.style.display='none';}

  // ── RENDER: VERDICT — P1 decision card ──
  const vCard=document.getElementById('out-verdict-card');
  if(vCard){
    vCard.style.borderColor=verdict.color+'55';
    vCard.style.background=verdict.color+'0D';
    vCard.style.borderColor=verdict.color+'44';
    document.getElementById('out-verdict-emoji').textContent=verdict.emoji||'•';
    const lbl=document.getElementById('out-verdict-label');
    // Get varied language copy
    const _band=verdictLabelToBand(verdict.label);
    const _vlCtx={etp:etp,fatigue:fullFatigue,strategyMode:strategyMode,isStreak:(profile.streakDays||1)>=4,isCritical:fullFatigue>=86};
    const _vlCopy=getVerdictCopy(_band,_vlCtx);
    lbl.textContent=_vlCopy.headline||verdict.label; lbl.style.color=verdict.color;
    const sum=document.getElementById('out-verdict-summary');
    if(sum){sum.textContent=_vlCopy.summary||verdict.summary; sum.style.color=verdict.color;}
    // Rotate support phrase by verdict band
    let _pcat='cat1';
    if(verdict.color==='#F97316'||verdict.color==='#FBBF24'||verdict.color==='#FB923C') _pcat='cat2';
    else if(verdict.color==='#EF4444'||verdict.color==='#DC2626') _pcat='cat3';
    const _supportPhrase = getPhrase(_pcat, true);
    const _actionLine=_vlCopy&&_vlCopy.action?_vlCopy.action+' ':'';
    const _reasonEl=document.getElementById('out-verdict-reason');
    if(_reasonEl) _reasonEl.textContent = verdict.reason + ' ' + _actionLine + (_supportPhrase ? ' ' + _supportPhrase : '');
  }
  // P2 summary echo
  const sumEcho=document.getElementById('sum-verdict-echo');
  if(sumEcho){
    sumEcho.style.borderColor=verdict.color+'44';
    sumEcho.style.background=verdict.color+'0D';
    document.getElementById('sum-verdict-emoji').textContent=verdict.emoji||'•';
    const sl=document.getElementById('sum-verdict-label');
    sl.textContent=verdict.label; sl.style.color=verdict.color;
    const ss=document.getElementById('sum-verdict-summary');
    if(ss){ss.textContent=verdict.summary; ss.style.color=verdict.color;}

    // Wire new Review page elements
    const _smn=document.getElementById('sum-marginal-net');
    if(_smn){_smn.textContent=fmt(marginalNet);}
    const _smg=document.getElementById('sum-marginal-gross');
    if(_smg){_smg.textContent=fmt(marginalGross);}
    const _smf=document.getElementById('sum-marginal-fatigue');
    if(_smf){_smf.textContent='+'+Math.round(marginalFatigue)+' pts'; _smf.style.color=band.color;}
    const _ssi=document.getElementById('sum-score-inline');
    if(_ssi){_ssi.textContent=Math.round(fullFatigue);}
    const _sbi=document.getElementById('sum-band-inline');
    if(_sbi){_sbi.textContent=band.name; _sbi.style.color=band.color;}
    const _rmn=document.getElementById('review-marginal-net');
    if(_rmn){_rmn.textContent=fmt(marginalNet);}
    const _rtd=document.getElementById('review-tax-drag');
    if(_rtd&&marginalGross>0){const drag=marginalGross-marginalNet;_rtd.textContent=`Tax drag: ${fmt(drag)} (${Math.round(drag/marginalGross*100)}%)`;}
    // Also update gross detail in money section header
    const _mgd=document.getElementById('out-marginal-gross-detail');
    if(_mgd){_mgd.textContent='gross '+fmt(marginalGross);}
    // Sync out-gross to show gross label
    const _og=document.getElementById('out-gross');
    if(_og){_og.textContent='gross '+fmt(totalGross);}
  }

  // ── RENDER: P1 GLANCE METRICS ──
  // Total hours
  document.getElementById('out-total-h').textContent=fmtH(total);
  document.getElementById('pt-base').textContent=fmtH(base);
  document.getElementById('pt-extra').textContent=fmtH(extra);
  // Extra net pay
  document.getElementById('out-marginal-net').textContent=fmt(marginalNet);
  document.getElementById('out-marginal-gross').textContent=fmt(marginalGross);
  // Added fatigue (P1 small card)
  const mFatEl=document.getElementById('out-marginal-fatigue');
  mFatEl.textContent='+'+Math.round(marginalFatigue);
  mFatEl.style.color=marginalFatigue>20?'#F87171':marginalFatigue>10?'#FBBF24':'#4ADE80';
  const scoreInline=document.getElementById('out-score-inline');
  if(scoreInline){scoreInline.textContent=Math.round(fullFatigue); scoreInline.style.color=band.color;}
  // ETP (P1)
  document.getElementById('out-etp-val').textContent=etp.toFixed(1);
  document.getElementById('out-etp-val').style.color=etp>=6.5?'#4ADE80':etp>=5?'#A3E635':etp>=3.5?'#FBBF24':etp>=2?'#F97316':'#EF4444';
  document.getElementById('out-etp-pill').innerHTML=`<span class="etp-pill ${etpLabel.cls}">${etpLabel.label}</span>`;
  // Mode fit note (P1)
  const modeFitEl=document.getElementById('out-mode-fit');
  if(modeFitEl){
    const strat=STRATEGY[strategyMode]||STRATEGY.balanced;
    modeFitEl.textContent=`${strat.icon} ${strat.label} mode — ${weeklyNote.split('.')[0]}.`;
    modeFitEl.style.display='block';
  }

  // ── RENDER: GOAL IMPACT (P1 + P2) ──
  renderGoalImpact(goalImpact);
  renderPushRangeBar(pushRange, extra);

  // ── RENDER: P2 — CURRENT CHOICE ──
  document.getElementById('out-base-h').textContent=fmtH(base);
  const extEl=document.getElementById('out-extra-h');
  extEl.textContent='+'+fmtH(extra);
  extEl.style.color=extra>pushRange.stretchMax?'#F87171':extra>pushRange.efficientMax?'#FCD34D':'#38BDF8';
  document.getElementById('out-marginal-gross-detail').textContent=fmt(marginalGross);
  const mFatDetail=document.getElementById('out-marginal-fatigue-detail');
  if(mFatDetail){mFatDetail.textContent='+'+Math.round(marginalFatigue);mFatDetail.style.color=marginalFatigue>20?'#F87171':marginalFatigue>10?'#FBBF24':'#4ADE80';}
  // Marginal verdict sentence
  const marginalETP=marginalNet/Math.max(marginalFatigue,1);
  let marginalMsg='';
  if(extra<0.5)marginalMsg='Very short addition. Minimal pay and fatigue impact.';
  else if(marginalETP>=6)marginalMsg='These extra hours are still paying well. Return per fatigue point is strong.';
  else if(marginalETP>=4)marginalMsg='These extra hours still pay, but value is weakening compared to the core day.';
  else if(marginalETP>=2)marginalMsg='Diminishing returns. Fatigue cost is outpacing the net gain.';
  else marginalMsg='After tax, these extra hours return little net pay for the fatigue they add.';
  // Shift-type causal note: explain WHY Heavy changes ETP and range
  const stk2=getShiftTypeKey(I);
  if(stk2==='heavy')marginalMsg+=' Heavy intensity raises duty load by 20% (×1.20), compresses the efficient range (×0.82), and increases recovery debt (×1.50) — all reducing ETP relative to a Standard shift of the same length.';
  else if(stk2==='light')marginalMsg+=' Light intensity lowers duty load by 20% (×0.80), expands the efficient range (×1.15), and reduces recovery debt (×0.70) — all improving ETP relative to a Standard shift of the same length.';
  if(extraOTH>0)marginalMsg+=` (${fmtH(extraOTH)} at OT rate ${otMult}x — gross boosted, but tax reduces the net benefit.)`;
  document.getElementById('out-marginal-verdict').textContent=marginalMsg;

  // ── RENDER: RECOVERY IMPACT (P2) ──
  const { tomorrowCapacityLoss, recoveryDebt, cumulativeRisk } = recoveryImpact;
  const tomorrowLabel = tomorrowCapacityLoss < 10 ? { label: 'Full capacity', color: '#22C55E' }
    : tomorrowCapacityLoss < 25 ? { label: 'Slightly reduced', color: '#86EFAC' }
    : tomorrowCapacityLoss < 45 ? { label: 'Reduced capacity', color: '#F59E0B' }
    : { label: 'Rest advised', color: '#EF4444' };
  const tmrEl=document.getElementById('rec-tomorrow-state');
  tmrEl.textContent=tomorrowLabel.label; tmrEl.style.color=tomorrowLabel.color;
  const capEl=document.getElementById('rec-capacity-loss');
  capEl.textContent=`−${tomorrowCapacityLoss}%`;
  capEl.style.color=tomorrowCapacityLoss>30?'#EF4444':tomorrowCapacityLoss>15?'#F59E0B':'#22C55E';
  const debtEl=document.getElementById('rec-debt-score');
  debtEl.textContent=`${recoveryDebt} / 10`;
  debtEl.style.color=recoveryDebt>7?'#EF4444':recoveryDebt>4?'#F59E0B':'#22C55E';
  const cumEl=document.getElementById('rec-cumulative');
  cumEl.textContent=cumulativeRisk;
  cumEl.style.color=cumulativeRisk==='High'?'#EF4444':cumulativeRisk==='Medium'?'#F59E0B':'#22C55E';

  // ── RENDER: FATIGUE BAND (P2) ──
  document.getElementById('out-band-name').textContent=band.name;
  document.getElementById('out-band-name').style.color=band.color;
  document.getElementById('out-band-meaning').textContent=band.meaning;
  document.getElementById('out-score').innerHTML=`${Math.round(fullFatigue)}<span>/100</span>`;
  document.getElementById('band-marker').style.left=fullFatigue+'%';

  // ── RENDER: PAY (P2) ──
  let grossDetail=fmtH(baseWithinContracted+extraBasicH)+' @ '+fmtRate(rate)+'/hr';
  if(extraOTH>0)grossDetail+=' + '+fmtH(extraOTH)+' OT @ '+fmtRate(rate*otMult)+'/hr';
  const _ogEl=document.getElementById('out-gross');if(_ogEl)_ogEl.textContent='gross '+fmt(totalGross);
  document.getElementById('out-gross-detail').textContent=grossDetail;
  document.getElementById('out-net').textContent=fmt(totalNet);
  const _onr=document.getElementById('out-net-range');if(_onr)_onr.textContent=fmt(netLow)+' – '+fmt(netHigh);
  const _otEl=document.getElementById('out-tax');if(_otEl)_otEl.textContent='Tax drag: '+fmt(totalDed);
  const _otp=document.getElementById('out-tax-pct');if(_otp)_otp.textContent=taxPct.toFixed(0)+'% of gross';

  // ── RENDER: ETP DETAIL (P2) ──
  const etpValDetail=document.getElementById('out-etp-val-detail');
  if(etpValDetail){etpValDetail.textContent=etp.toFixed(1); etpValDetail.style.color=etp>=6.5?'#4ADE80':etp>=5?'#A3E635':etp>=3.5?'#FBBF24':etp>=2?'#F97316':'#EF4444';}
  const etpPillDetail=document.getElementById('out-etp-pill-detail');
  if(etpPillDetail)etpPillDetail.innerHTML=`<span class="etp-pill ${etpLabel.cls}">${etpLabel.label}</span>`;
  const etpNoteEl=document.getElementById('out-etp-note');
  if(etpNoteEl)etpNoteEl.textContent=etpLabel.note||'';

  // ── RENDER: WEEKLY STRATEGY + CO-PILOT (P2) ──
  document.getElementById('out-weekly-strategy').textContent=weeklyNote;
  document.getElementById('out-copilot').textContent=copilot;
  // Check overflow after text is set (defer to let DOM render)
  setTimeout(function(){
    copilotCheckOverflow('out-weekly-strategy');
    copilotCheckOverflow('out-copilot');
  }, 50);

  // ── RENDER: 7-DAY OUTLOOK (P2) ──
  buildMiniOutlook(fullFatigue,I,P);

  // Show P1 output, scroll to it
  document.getElementById('qc-output').style.display='block';
  // Reset save confirm
  const _saveConfirm=document.getElementById('p1-saved-confirm');
  if(_saveConfirm)_saveConfirm.style.display='none';
  // State machine: result is ready
  qcOnResultReady();
  // Reset button state
  const _cb = document.getElementById('qc-calc-btn');
  if(_cb){ _cb.disabled = false; _cb.style.opacity = ''; _cb.textContent = 'Get the read'; }
  // Scroll to result panel
  setTimeout(function(){
    var out = document.getElementById('qc-output');
    var scr = document.getElementById('tab-quickcheck');
    if(out && scr){ scr.scrollTop = out.offsetTop - 70; }
  }, 80);
  saveState();
}

function buildMiniOutlook(startF,I,P){
  const chart=document.getElementById('mini-chart');
  chart.innerHTML='';
  let f=startF,hasDanger=false;
  const t0=profile.shiftStartHour!==undefined?profile.shiftStartHour:7;
  for(let d=0;d<7;d++){
    const isRest=(d===5||d===6);
    const restSo=isRest?9:profile.sleepHours||7.5;
    const streakD=isRest?0:Math.min(d+1,6);
    f=calcFatigue(isRest?0:profile.contracted,isRest?0:I,P,f,restSo,isRest?7:t0,streakD,isRest?0:1);
    const b=getBand(f);
    const bar=document.createElement('div');
    bar.className='mini-bar';
    bar.style.height=Math.max(f,8)+'%';
    bar.style.background=isRest?'rgba(255,255,255,0.1)':b.color;
    bar.style.opacity=isRest?'0.4':'1';
    chart.appendChild(bar);
    if(f>=56&&!isRest)hasDanger=true;
  }
  const warn=document.getElementById('outlook-warn');
  if(hasDanger){warn.textContent='Repeating this pattern pushes fatigue into the Red band within the week. An earlier rest day changes the picture significantly.';warn.style.display='block';}
  else{warn.style.display='none';}
}

// ═══════════════════════════════════════════════════════════════════
// FORECAST ENGINE (unchanged from original)
// ═══════════════════════════════════════════════════════════════════
function buildPatternGrid(){
  const grid=document.getElementById('pattern-grid');grid.innerHTML='';
  DAY_NAMES.forEach((day,i)=>{
    const div=document.createElement('div');
    div.className='pattern-day'+(fcPattern[i]?'':' rest-day');
    div.innerHTML=`<div class="day-label">${day}</div><div class="day-type">${fcPattern[i]?'Work':'Rest'}</div>`;
    div.onclick=()=>{fcPattern[i]=!fcPattern[i];buildPatternGrid();runForecast();};
    grid.appendChild(div);
  });
}
function stepFcHours(delta){
  fcHours=Math.round((fcHours+delta)*4)/4;
  fcHours=Math.min(Math.max(fcHours,0.25),24);
  document.getElementById('fc-hours-val').textContent=fmtH(fcHours);
  runForecast();
}
function getForecastVerdict(peakFatigue,avgFatigue,weeklyH){
  if(peakFatigue>=76||(avgFatigue>=65))return{label:'Unsustainable',summary:'Fatigue accumulation is too high to sustain.',reason:'This pattern produces critical fatigue levels. Add rest days or reduce hours.',color:'#DC2626'};
  if(peakFatigue>=65||avgFatigue>=52)return{label:'Recovery risk',summary:'Rest days too limited for this workload.',reason:'Fatigue builds consistently across the week. An additional rest day would change the picture significantly.',color:'#EF4444'};
  if(peakFatigue>=55||avgFatigue>=42)return{label:'Borderline',summary:'Workable short-term. Not robust.',reason:'Fatigue reaches elevated levels and may not fully clear on rest days. Watch the pattern.',color:'#F97316'};
  if(peakFatigue>=44||avgFatigue>=34)return{label:'Manageable',summary:'Manages well. Fatigue builds toward the week end.',reason:'Sustainable with the current rest day structure. Cumulative load warrants watching over a longer run.',color:'#FBBF24'};
  return{label:'Sustainable',summary:'Pattern is stable at these hours and intensity.',reason:'Fatigue stays within manageable limits throughout the week. Rest day structure is holding.',color:'#4ADE80'};
}
function runForecast(){
  const P=profile.professionP;
  const rate=profile.rate;
  const region=document.getElementById('tax-region')?.value||profile.region||'england';
  let f=lastFatigue!==null?lastFatigue:20;
  const days=[];let totalNet=0,workDays=0;
  const t0=profile.shiftStartHour!==undefined?profile.shiftStartHour:7;
  let streakCount=0;
  for(let d=0;d<28;d++){
    const dow=d%7,isWork=fcPattern[dow];
    const So=isWork?(profile.sleepHours||7.5):9;
    if(isWork) streakCount++; else streakCount=0;
    const daysSinceRest=isWork?Math.min(streakCount,7):0;
    f=calcFatigue(isWork?fcHours:0,fcShiftI,P,f,So,isWork?t0:7,streakCount,daysSinceRest);
    if(isWork){const gross=fcHours*rate;const{net}=calcNetPay(gross,region);totalNet+=net;workDays++;}
    days.push({fatigue:f,isWork});
  }
  const chart=document.getElementById('fc-chart');chart.innerHTML='';
  days.forEach((day,i)=>{
    const b=getBand(day.fatigue);
    const wrap=document.createElement('div');wrap.className='fc-bar-wrap';
    const bar=document.createElement('div');bar.className='fc-bar';
    bar.style.height=Math.max(day.fatigue,4)+'%';
    bar.style.background=day.isWork?b.color:'rgba(255,255,255,0.08)';
    bar.title=`Day ${i+1}: ${b.name} (${Math.round(day.fatigue)})`;
    const lbl=document.createElement('div');lbl.className='fc-day-label';
    lbl.textContent=(i+1)%7===1?`W${Math.floor(i/7)+1}`:'';
    wrap.appendChild(bar);wrap.appendChild(lbl);chart.appendChild(wrap);
  });
  const peak=Math.round(Math.max(...days.map(d=>d.fatigue)));
  const peakBand=getBand(peak);
  document.getElementById('fc-peak').textContent=peak;document.getElementById('fc-peak').style.color=peakBand.color;
  document.getElementById('fc-income').textContent=fmt(totalNet);
  document.getElementById('fc-days').textContent=workDays;
  const dangerAlert=document.getElementById('fc-alert-danger');
  let consec=0,maxConsec=0;
  days.forEach(d=>{if(d.fatigue>=56&&d.isWork){consec++;maxConsec=Math.max(maxConsec,consec);}else consec=0;});
  if(maxConsec>=5){dangerAlert.textContent=`⚠ Fatigue exceeds Orange band for ${maxConsec} consecutive work days.`;dangerAlert.style.display='block';}
  else{dangerAlert.style.display='none';}
  const totalHoursPerWeek=fcPattern.filter(Boolean).length*fcHours;
  const wtrAlert=document.getElementById('fc-alert-wtr');
  if(totalHoursPerWeek>48){wtrAlert.textContent=`⚠ This pattern averages ${totalHoursPerWeek.toFixed(1)} hours/week — above the WTR 48h limit.`;wtrAlert.style.display='block';}
  else{wtrAlert.style.display='none';}
  const avgFatigue=days.reduce((s,d)=>s+d.fatigue,0)/days.length;
  const fcVerdict=getForecastVerdict(peak,avgFatigue,totalHoursPerWeek);
  const fcvCard=document.getElementById('fc-verdict-card');
  if(fcvCard){
    fcvCard.style.borderColor=fcVerdict.color+'44';fcvCard.style.background=fcVerdict.color+'0D';
    const lbl=document.getElementById('fc-verdict-label');const sum=document.getElementById('fc-verdict-summary');
    const rsn=document.getElementById('fc-verdict-reason');const fct=document.getElementById('fc-verdict-factors');
    if(lbl){lbl.textContent=fcVerdict.label;lbl.style.color=fcVerdict.color;}
    if(sum){sum.textContent=fcVerdict.summary;sum.style.color=fcVerdict.color;}
    if(rsn)rsn.textContent=fcVerdict.reason + ' ' + getPhrase('cat8', true);
    if(fct){
      const factors=[];
      if(totalHoursPerWeek>48)factors.push('Work hours exceed the WTR 48h weekly limit');
      if(fcPattern.filter(Boolean).length>=6)factors.push('Work days are too closely stacked');
      if(fcShiftI>=1.15)factors.push('Shift intensity is elevated');
      if(peak>=55)factors.push('Peak fatigue reaches elevated levels');
      if(peak<45)factors.push('Fatigue stays within manageable limits');
      if(avgFatigue>=45)factors.push('Average fatigue is above the moderate threshold');
      fct.innerHTML=factors.length?'<strong style="display:block;margin-bottom:4px;font-size:0.65rem;letter-spacing:1px;">SCORING FACTORS</strong>'+factors.map(f=>'· '+f).join('<br>'):'';
    }
  }
  return days;
}
function runOptimiser(){
  const P=profile.professionP;
  const days28=runForecast();
  const currentPeak=Math.max(...days28.map(d=>d.fatigue));
  let bestPeak=currentPeak,bestDow=-1;
  for(let dow=0;dow<7;dow++){
    if(!fcPattern[dow])continue;
    const testPattern=[...fcPattern];testPattern[dow]=false;
    let f=lastFatigue!==null?lastFatigue:20;
    const testDays=[];
    let sc=0;
    const t0o=profile.shiftStartHour!==undefined?profile.shiftStartHour:7;
    for(let d=0;d<28;d++){const isWork=testPattern[d%7];if(isWork)sc++;else sc=0;const So=isWork?(profile.sleepHours||7.5):9;f=calcFatigue(isWork?fcHours:0,fcShiftI,P,f,So,isWork?t0o:7,sc,isWork?Math.min(sc,7):0);testDays.push(f);}
    const testPeak=Math.max(...testDays);
    if(testPeak<bestPeak){bestPeak=testPeak;bestDow=dow;}
  }
  const result=document.getElementById('optimiser-result'),msg=document.getElementById('optimiser-msg');
  if(bestDow===-1){msg.textContent='Your current rest day placement is already optimal.';}
  else{const red=Math.round(currentPeak-bestPeak);msg.textContent=`Moving rest day to ${DAY_NAMES[bestDow]} reduces peak fatigue by ${red} points — from ${getBand(currentPeak).name} (${Math.round(currentPeak)}) to ${getBand(bestPeak).name} (${Math.round(bestPeak)}).`;}
  result.style.display='block';
}

// ═══════════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════════



function togglePref(checkId, toggleId){
  const cb=document.getElementById(checkId);
  const tgl=document.getElementById(toggleId);
  if(!cb||!tgl)return;
  cb.checked=!cb.checked;
  tgl.style.background=cb.checked?'#3b82f6':'var(--border)';
  savePrefs();
}
function savePrefs(){
  try{
    const prefs={
      sundayReminder:document.getElementById('pref-sunday-reminder')?.checked||false,
      streakAlert:document.getElementById('pref-streak-alert')?.checked||true,
      goalAlert:document.getElementById('pref-goal-alert')?.checked||true,
    };
    localStorage.setItem('ss_prefs',JSON.stringify(prefs));
  }catch(e){}
}
function loadPrefs(){
  try{
    const raw=localStorage.getItem('ss_prefs');
    if(!raw)return;
    const prefs=JSON.parse(raw);
    const streakCb=document.getElementById('pref-streak-alert');
    const streakTgl=document.getElementById('streak-toggle');
    const goalCb=document.getElementById('pref-goal-alert');
    const goalTgl=document.getElementById('goal-alert-toggle');
    if(streakCb&&prefs.streakAlert===false){streakCb.checked=false;if(streakTgl)streakTgl.style.background='var(--border)';}
    if(goalCb&&prefs.goalAlert===false){goalCb.checked=false;if(goalTgl)goalTgl.style.background='var(--border)';}
  }catch(e){}
}

function updateStreakAlert(){
  const alertEl=document.getElementById('qc-streak-alert');
  const alertText=document.getElementById('qc-streak-alert-text');
  if(!alertEl||!alertText)return;
  const streak=profile.streakDays||1;
  const savedFatigue=lastFatigue||0;
  // Use saved history to get last known fatigue if available
  const lastKnownFat=shiftHistory.length>0?shiftHistory[0].fatigue:savedFatigue;
  if(streak>=5){
    alertEl.style.display='block';
    alertText.textContent=`Fifth day in a row. Efficient range is compressed — cumulative load is the main driver today.`;
  } else if(streak>=4){
    alertEl.style.display='block';
    alertText.textContent=`Fourth day in a row. The efficient range is tighter than earlier this week.`;
  } else if(streak>=3&&lastKnownFat>=56){
    alertEl.style.display='block';
    alertText.textContent=`Third consecutive day. Recovery cost is compounding.`;
  } else if(lastKnownFat>=76){
    alertEl.style.display='block';
    alertText.textContent=`Red band carry from prior shifts. The efficient range is reduced today.`;
  } else {
    alertEl.style.display='none';
    alertText.textContent='';
  }
}


