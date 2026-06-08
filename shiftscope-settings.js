// ═══════════════════════════════════════════════════════════════════
// WEEK STRIP — temporal anchoring for QuickCheck
// ═══════════════════════════════════════════════════════════════════

const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
let qcDayForIndex = -1; // 0=Mon ... 6=Sun, -1=today

function qcGetTodayIndex() {
  // JS getDay(): 0=Sun,1=Mon...6=Sat → convert to Mon=0
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function qcGetWeekDayLabel(idx) {
  return DAYS_SHORT[idx];
}

function qcGetCheckDayIndex() {
  return qcDayForIndex === -1 ? qcGetTodayIndex() : qcDayForIndex;
}

// Returns array of 7 day state objects for the week strip
function qcBuildWeekDays() {
  const todayIdx = qcGetTodayIndex();
  const checkIdx = qcGetCheckDayIndex();
  // Build from saved shift history (this week = last 7 days)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - todayIdx); // Monday
  weekStart.setHours(0,0,0,0);

  const days = DAYS_SHORT.map((name, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    // Check shift history for this day
    const saved = shiftHistory.find(s => {
      if (!s.date) return false;
      const parts = s.date.split('/');
      if (parts.length < 3) return false;
      const sd = new Date(parseInt('20'+parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
      return sd.toDateString() === dayDate.toDateString();
    });
    return {
      idx: i,
      name,
      date: dayDate,
      isToday: i === todayIdx,
      isChecking: i === checkIdx,
      isFuture: i > todayIdx,
      isPast: i < todayIdx,
      savedShift: saved || null,
      shiftType: saved ? (saved.shiftType || 'standard') : null,
    };
  });
  return days;
}

function qcRenderWeekStrip() {
  const row = document.getElementById('qc-week-row');
  const ctxLine = document.getElementById('qc-week-context-line');
  if (!row) return;
  const days = qcBuildWeekDays();
  const todayIdx = qcGetTodayIndex();
  const checkIdx = qcGetCheckDayIndex();

  row.innerHTML = days.map(d => {
    let stateClass = '';
    let dotStyle = '';
    let label = '';
    if (d.savedShift) {
      stateClass = d.savedShift.shiftType === 'Heavy' ? 'worked-heavy saved-check' : 'worked-std saved-check';
      label = d.savedShift.shiftType === 'Heavy' ? 'Heavy' : 'Std';
    } else if (d.isChecking && !d.isToday) {
      stateClass = 'checking';
      label = 'Checking';
    } else if (d.isChecking && d.isToday) {
      stateClass = 'checking today';
      label = 'Today';
    } else if (d.isToday) {
      stateClass = 'today';
      label = 'Today';
    } else if (d.isFuture) {
      stateClass = 'future';
      label = '';
    } else {
      stateClass = 'rest';
      label = '';
    }
    return `<div class="week-day-cell ${stateClass}" onclick="qcSetDayFor(${d.idx})" title="${d.name}">
      <span class="wdc-name">${d.name}</span>
      <span class="wdc-dot"></span>
      <span class="wdc-label">${label}</span>
    </div>`;
  }).join('');

  // Context line
  const checkDay = days[checkIdx];
  const dayName = checkIdx === todayIdx ? 'Today' : DAYS_SHORT[checkIdx];
  const priorWorked = days.filter(d => d.idx < checkIdx && d.savedShift).length;
  const priorHeavy = days.filter(d => d.idx < checkIdx && d.savedShift && d.savedShift.shiftType === 'Heavy').length;

  let ctx = `Checking ${dayName}`;
  if (priorWorked > 0) {
    ctx += ` · ${priorWorked} day${priorWorked > 1 ? 's' : ''} worked before this`;
    if (priorHeavy > 0) ctx += ` (${priorHeavy} heavy)`;
  } else {
    ctx += ' · First shift this week';
  }
  if (ctxLine) ctxLine.textContent = ctx;

  // Update day selector button
  qcUpdateDaySelector(dayName, checkIdx, todayIdx, priorWorked);
}

function qcUpdateDaySelector(dayName, checkIdx, todayIdx, priorWorked) {
  const btn = document.getElementById('qc-day-for');
  const sub = document.getElementById('qc-day-for-sub');
  if (btn) {
    const label = checkIdx === todayIdx ? 'Today · ' + DAYS_SHORT[checkIdx] : DAYS_SHORT[checkIdx];
    btn.textContent = label;
  }
  if (sub) {
    sub.textContent = priorWorked > 0 ? `${priorWorked} day${priorWorked>1?'s':''} in` : 'fresh start';
  }
}

function qcSetDayFor(idx) {
  const todayIdx = qcGetTodayIndex();
  qcDayForIndex = idx === todayIdx ? -1 : idx;
  // Auto-update streak based on prior days in week
  qcAutoSetStreak(idx);
  qcRenderWeekStrip();
  qcUpdateDayContext();
  qcMarkInputChanged();
}

function qcCycleDayFor() {
  const todayIdx = qcGetTodayIndex();
  const current = qcGetCheckDayIndex();
  const next = (current + 1) % 7;
  qcSetDayFor(next);
}

function qcAutoSetStreak(checkIdx) {
  // Look at history to count consecutive days up to checkIdx
  const days = qcBuildWeekDays();
  let consecutive = 0;
  // Count days before checkIdx that have saved shifts
  for (let i = checkIdx - 1; i >= 0; i--) {
    if (days[i].savedShift) consecutive++;
    else break;
  }
  // Map to streak segments and update UI
  const streakSeg = document.getElementById('streak-seg');
  if (!streakSeg) return;
  const btns = streakSeg.querySelectorAll('.seg-btn');
  let targetBtn, days_val, rest_val, label;
  if (consecutive === 0) {
    targetBtn = btns[0]; days_val = 1; rest_val = 1; label = 'None';
  } else if (consecutive === 1) {
    targetBtn = btns[1]; days_val = 2; rest_val = 1; label = '1 day';
  } else if (consecutive <= 3) {
    targetBtn = btns[2]; days_val = 4; rest_val = 2; label = '2–3 days';
  } else {
    targetBtn = btns[3]; days_val = 6; rest_val = 4; label = '4+ days';
  }
  if (targetBtn && streakSeg) {
    btns.forEach(b => b.classList.remove('active'));
    targetBtn.classList.add('active');
    setStreak(days_val, rest_val);
    updateStreakLabel(label);
  }
}

function qcUpdateDayContext() {
  qcRenderWeekStrip();
}

function qcInitWeekStrip() {
  qcDayForIndex = -1; // default to today
  qcAutoSetStreak(qcGetTodayIndex());
  qcRenderWeekStrip();
}



// ═══════════════════════════════════════════════════════════════════
// RECOVERY STATE ENGINE
// Converts raw fatigue + history into a named, contextual state
// ═══════════════════════════════════════════════════════════════════

function getRecoveryState() {
  const fatigue = lastFatigue !== null ? lastFatigue : 20;
  const history = shiftHistory;
  
  // Count consecutive worked days ending today (or most recent)
  const todayIdx = qcGetTodayIndex();
  const days = qcBuildWeekDays();
  let streak = 0;
  for (let i = todayIdx - 1; i >= 0; i--) {
    if (days[i] && days[i].savedShift) streak++;
    else break;
  }
  // Also count if today has a saved shift
  if (days[todayIdx] && days[todayIdx].savedShift) streak++;

  // Trend: compare today's fatigue vs 2 days ago
  let trend = 'stable'; // 'rising' | 'stable' | 'easing'
  if (history.length >= 2) {
    const recent = history[0].fatigue || fatigue;
    const older  = history[Math.min(2, history.length-1)].fatigue || fatigue;
    if (recent > older + 5) trend = 'rising';
    else if (recent < older - 5) trend = 'easing';
  }

  // State classification
  let state, colour, label, description, trendLabel;

  if (fatigue < 25 && streak === 0) {
    state = 'fresh';
    colour = '#4ADE80';
    label = 'Fresh';
    description = 'Clean baseline. Full range available today.';
  } else if (fatigue < 40) {
    state = 'good';
    colour = '#4ADE80';
    label = 'Good';
    description = 'Low carry-over. Good conditions for a push.';
  } else if (fatigue < 55) {
    state = 'building';
    colour = '#FBBF24';
    label = 'Building';
    description = 'Load is accumulating. Efficient range is narrowing.';
  } else if (fatigue < 72) {
    state = 'strained';
    colour = '#F97316';
    label = 'Strained';
    description = 'High cumulative load. Recovery is the priority today.';
  } else {
    state = 'limit';
    colour = '#EF4444';
    label = 'Near limit';
    description = 'Critical load. Additional hours cost more than they return.';
  }

  const trendArrow = trend === 'rising' ? '↑' : trend === 'easing' ? '↓' : '→';
  const trendColour = trend === 'rising' ? '#F97316' : trend === 'easing' ? '#4ADE80' : 'var(--muted)';
  trendLabel = trend === 'rising' ? 'Rising' : trend === 'easing' ? 'Easing' : 'Stable';

  return { state, colour, label, description, trend, trendArrow, trendColour, trendLabel,
           fatigue: Math.round(fatigue), streak };
}

function getWeekPositionText() {
  const todayIdx = qcGetTodayIndex();
  const days = qcBuildWeekDays();
  const dayName = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][todayIdx];
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

  // Count consecutive worked days up to and including today
  let streak = 0;
  for (let i = todayIdx; i >= 0; i--) {
    if (days[i] && days[i].savedShift) streak++;
    else break;
  }

  const workedThisWeek = days.filter(d => d.savedShift).length;

  if (streak === 0 && workedThisWeek === 0) {
    return { headline: `${dayName} ${timeOfDay}`, sub: 'No shifts logged this week. Fresh start.' };
  } else if (streak === 0) {
    return { headline: `${dayName} ${timeOfDay}`, sub: `${workedThisWeek} shift${workedThisWeek>1?'s':''} this week. Rest day today.` };
  } else if (streak === 1) {
    return { headline: `${dayName} ${timeOfDay}`, sub: 'First day of a run. Full range available.' };
  } else {
    return { headline: `${dayName} ${timeOfDay}`, sub: `Day ${streak} in a row. Load is carrying forward.` };
  }
}

// Auto-context for Check tab: derive inputs from history automatically
function getLiveContext() {
  const todayIdx = qcGetTodayIndex();
  const days = qcBuildWeekDays();

  // Streak (consecutive days before today)
  let streak = 0;
  for (let i = todayIdx - 1; i >= 0; i--) {
    if (days[i] && days[i].savedShift) streak++;
    else break;
  }

  // Most recent shift type from history
  const recentShift = shiftHistory[0];
  const shiftTypeGuess = recentShift ? recentShift.shiftType : 'Standard';

  // Sleep: if last shift ended recently, assume short sleep; else good
  const lastFat = lastFatigue !== null ? lastFatigue : 20;
  const sleepGuess = lastFat > 55 ? 6 : lastFat > 40 ? 7.5 : 7.5;

  // Start hour: use profile default (day shift)
  const startHour = 7;

  // Days since rest: how many consecutive days worked
  const daysSinceRest = streak;

  return {
    streak: streak + 1,           // including today
    daysSinceRest,
    shiftType: shiftTypeGuess,
    sleepHours: sleepGuess,
    startHour,
    baselineLabel: streak === 0 ? 'First shift this week' :
                   streak === 1 ? '1 day before this' :
                   `${streak} days before this`,
  };
}


// ═══════════════════════════════════════════════════════════════════
// TODAY SCREEN + LIVE MODE JS
// ═══════════════════════════════════════════════════════════════════

var checkModeIsScenario = false;

function toggleCheckMode() {
  checkModeIsScenario = !checkModeIsScenario;
  var live = document.getElementById('qc-live-panel');
  var scen = document.getElementById('qc-scenario-panel');
  var knob = document.getElementById('qc-mode-knob');
  var toggle = document.getElementById('qc-mode-toggle');
  var lbl = document.getElementById('qc-mode-label');
  if (checkModeIsScenario) {
    if(live) live.style.display = 'none';
    if(scen) scen.style.display = 'block';
    if(knob) knob.style.left = '22px';
    if(toggle) toggle.style.background = 'rgba(251,191,36,0.2)';
    if(toggle) toggle.style.borderColor = 'rgba(251,191,36,0.4)';
    if(lbl) lbl.style.color = 'var(--muted)';
    // Set hidden mode flag
    var modeEl = document.querySelector('#qc-scenario-panel #qc-live-mode');
    if(modeEl) modeEl.value = '0';
  } else {
    if(live) live.style.display = 'block';
    if(scen) scen.style.display = 'none';
    if(knob) knob.style.left = '3px';
    if(toggle) toggle.style.background = 'var(--card2)';
    if(toggle) toggle.style.borderColor = 'var(--border)';
    if(lbl) lbl.style.color = 'var(--sky)';
    var modeEl2 = document.querySelector('#qc-live-panel #qc-live-mode');
    if(modeEl2) modeEl2.value = '1';
  }
  // Reset any existing result
  qcNewCheck();
}

function qcShowScenario() {
  if (!checkModeIsScenario) toggleCheckMode();
}

function renderLiveContext() {
  var ctx = getLiveContext();
  var container = document.getElementById('qc-live-context-lines');
  if (!container) return;

  var dayName = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][qcGetTodayIndex()];
  var now = new Date();
  var timeStr = now.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
  var contracted = profile.contracted || 9.25;
  var bh = Math.floor(contracted);
  var bm = Math.round((contracted - bh) * 60);
  var baseStr = bh + 'h' + (bm > 0 ? ' ' + bm + 'm' : '');

  var startH = profile.shiftStartHour !== undefined ? profile.shiftStartHour : 7;
  var startStr = startH < 10 ? '0'+startH+':00' : startH+':00';
  var startLabel = startH === 0 ? 'Night (00:00)' : startH === 5 ? 'Early (05:00)' : startH === 7 ? 'Day (07:00)' : startH === 20 ? 'Evening (20:00)' : startStr;

  // If current time > start time, show elapsed
  var elapsedStr = '';
  if (now.getHours() > startH) {
    var elapsed = now.getHours() - startH + Math.round(now.getMinutes()/60*10)/10;
    elapsedStr = ' · ' + Math.floor(elapsed) + 'h in';
  }

  var lines = [
    { icon: '📅', label: 'Today', value: dayName + ' · ' + timeStr },
    { icon: '🕐', label: 'Shift starts', value: startLabel + elapsedStr },
    { icon: '⏱', label: 'Base shift', value: baseStr },
    { icon: '📊', label: 'Context', value: ctx.baselineLabel },
    { icon: '😴', label: 'Rest assumed', value: ctx.sleepHours >= 7 ? 'Good (7–8h)' : 'Short (<7h)' },
  ];

  container.innerHTML = lines.map(function(l) {
    return '<div style="display:flex;align-items:center;gap:8px;">' +
      '<span style="font-size:0.8rem;flex-shrink:0;">' + l.icon + '</span>' +
      '<span style="font-size:0.72rem;color:var(--dim);flex-shrink:0;">' + l.label + '</span>' +
      '<span style="font-size:0.72rem;color:var(--muted);margin-left:auto;text-align:right;">' + l.value + '</span>' +
      '</div>';
  }).join('');

  // Sync base-h/base-m hidden inputs from profile
  var bhEl = document.getElementById('base-h');
  var bmEl = document.getElementById('base-m');
  if (bhEl) bhEl.value = bh;
  if (bmEl) bmEl.value = bm;

  // Auto-set streak from history
  qcAutoSetStreak(qcGetCheckDayIndex());
}

function renderTodayScreen() {
  var rs = getRecoveryState();
  var wp = getWeekPositionText();

  // Headline
  var hl = document.getElementById('today-headline');
  var sub = document.getElementById('today-sub');
  if (hl) hl.textContent = wp.headline;
  if (sub) sub.textContent = wp.sub;

  // Recovery card
  var card = document.getElementById('today-recovery-card');
  if (card) {
    card.style.background = rs.colour + '0D';
    card.style.borderColor = rs.colour + '40';
  }
  var stateLabel = document.getElementById('today-state-label');
  if (stateLabel) { stateLabel.textContent = rs.label; stateLabel.style.color = rs.colour; }
  var trendPill = document.getElementById('today-trend-pill');
  if (trendPill) { trendPill.style.borderColor = rs.trendColour + '60'; }
  var arrow = document.getElementById('today-trend-arrow');
  if (arrow) { arrow.textContent = rs.trendArrow; arrow.style.color = rs.trendColour; }
  var trendLbl = document.getElementById('today-trend-label');
  if (trendLbl) { trendLbl.textContent = rs.trendLabel; trendLbl.style.color = rs.trendColour; }
  var rawFat = document.getElementById('today-fatigue-raw');
  if (rawFat) rawFat.textContent = 'Load: ' + rs.fatigue + '/100';
  var desc = document.getElementById('today-state-desc');
  if (desc) desc.textContent = rs.description;

  // Recovery state pill in topbar
  var pill = document.getElementById('recovery-state-pill');
  var pillDot = document.getElementById('rs-pill-dot');
  var pillLabel = document.getElementById('rs-pill-label');
  var pillArrow = document.getElementById('rs-pill-arrow');
  if (pillDot) pillDot.style.background = rs.colour;
  if (pillLabel) { pillLabel.textContent = rs.label; pillLabel.style.color = rs.colour; }
  if (pillArrow) { pillArrow.textContent = rs.trendArrow; pillArrow.style.color = rs.trendColour; }
  if (pill) { pill.style.background = rs.colour + '10'; pill.style.borderColor = rs.colour + '40'; }

  // Week strip
  renderTodayWeekStrip();

  // Stats
  var todayIdx = qcGetTodayIndex();
  var days = qcBuildWeekDays();
  var streak = 0;
  for (var i = todayIdx - 1; i >= 0; i--) {
    if (days[i] && days[i].savedShift) streak++; else break;
  }
  var weekShifts = shiftHistory.filter(function(s) {
    if (!s.date) return false;
    var now = new Date();
    var weekStart = new Date(now);
    weekStart.setDate(now.getDate() - todayIdx);
    weekStart.setHours(0,0,0,0);
    var parts = s.date.split('/');
    if (parts.length < 3) return false;
    var sd = new Date(parseInt('20'+parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
    return sd >= weekStart;
  });
  var weekNet = weekShifts.reduce(function(a,s){return a+(s.net||0);},0);

  var statStreak = document.getElementById('today-stat-streak');
  var statNet = document.getElementById('today-stat-net');
  var statShifts = document.getElementById('today-stat-shifts');
  if (statStreak) statStreak.textContent = streak > 0 ? streak + ' day' + (streak>1?'s':'') : 'Fresh';
  if (statNet) statNet.textContent = weekNet > 0 ? '£' + Math.round(weekNet) : '—';
  if (statShifts) statShifts.textContent = weekShifts.length > 0 ? weekShifts.length : '—';

  // CTA text
  var cta = document.getElementById('today-cta-check');
  var now2 = new Date();
  var hour = now2.getHours();
  if (cta) {
    cta.textContent = hour < 14 ? "Check today's shift →" :
                      hour < 18 ? "Check tonight's shift →" : "Check this shift →";
  }
  // Show confirm button if today has an unconfirmed saved shift
  var confirmBtn = document.getElementById('today-cta-confirm');
  if (confirmBtn) {
    var todayDate = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
    var todayEntry = shiftHistory.find(function(s){ return s.date === todayDate && !s.confirmed; });
    confirmBtn.style.display = todayEntry ? 'block' : 'none';
  }

  // Empty state
  var empty = document.getElementById('today-empty');
  var statsRow = document.getElementById('today-stats-row');
  if (shiftHistory.length === 0) {
    if (empty) empty.style.display = 'block';
    if (statsRow) statsRow.style.display = 'none';
  } else {
    if (empty) empty.style.display = 'none';
    if (statsRow) statsRow.style.display = 'grid';
  }
}

function renderTodayWeekStrip() {
  var row = document.getElementById('today-week-row');
  var ctx = document.getElementById('today-week-context');
  if (!row) return;
  var days = qcBuildWeekDays();
  var todayIdx = qcGetTodayIndex();
  row.innerHTML = days.map(function(d) {
    var cls = '';
    var label = '';
    if (d.savedShift) {
      cls = d.savedShift.shiftType === 'Heavy' ? 'worked-heavy saved-check' : 'worked-std saved-check';
      label = d.savedShift.shiftType === 'Heavy' ? 'Heavy' : 'Std';
    } else if (d.isToday) {
      cls = 'today';
      label = 'Today';
    } else if (d.isFuture) {
      cls = 'future';
    } else {
      cls = 'rest';
    }
    return '<div class="week-day-cell ' + cls + '" style="cursor:default;">' +
      '<span class="wdc-name">' + d.name + '</span>' +
      '<span class="wdc-dot"></span>' +
      '<span class="wdc-label">' + label + '</span>' +
      '</div>';
  }).join('');
  if (ctx) {
    var worked = days.filter(function(d){return d.savedShift;}).length;
    ctx.textContent = worked > 0 ? worked + ' shift' + (worked>1?'s':'') + ' logged this week' : 'No shifts logged yet this week';
  }
}

// Update recovery pill whenever history changes
function updateRecoveryPill() {
  var rs = getRecoveryState();
  var pillDot = document.getElementById('rs-pill-dot');
  var pillLabel = document.getElementById('rs-pill-label');
  var pillArrow = document.getElementById('rs-pill-arrow');
  var pill = document.getElementById('recovery-state-pill');
  if (pillDot) pillDot.style.background = rs.colour;
  if (pillLabel) { pillLabel.textContent = rs.label; pillLabel.style.color = rs.colour; }
  if (pillArrow) { pillArrow.textContent = rs.trendArrow; pillArrow.style.color = rs.trendColour; }
  if (pill) { pill.style.background = rs.colour + '10'; pill.style.borderColor = rs.colour + '40'; }
}

// ═══════════════════════════════════════════════════════════════════
// QUICKCHECK STATE MACHINE
// States: 'draft' | 'result' | 'stale' | 'saved'
// ═══════════════════════════════════════════════════════════════════

let qcState = 'draft';          // current state
let qcSnapshotInputs = null;    // locked inputs used for last result
let qcResultTime = null;        // timestamp of last calculation
let qcInputsChangedSinceResult = false;

// Called whenever any QC input changes
function qcMarkInputChanged() {
  if (qcState === 'result' || qcState === 'saved') {
    qcState = 'stale';
    qcInputsChangedSinceResult = true;
    qcRenderState();
  }
}

// Capture current input values as a snapshot
function qcCaptureSnapshot() {
  const baseH = parseInt(document.getElementById('base-h')?.value) || 9;
  const baseM = parseInt(document.getElementById('base-m')?.value) || 15;
  const extraH = parseInt(document.getElementById('extra-h')?.value) || 0;
  const extraM = parseInt(document.getElementById('extra-m')?.value) || 0;
  const intensity = parseFloat(document.getElementById('shift-intensity')?.value) || 1.0;
  const shiftTypeEl = document.querySelector('.shift-type-card.active .shift-type-name');
  const shiftType = shiftTypeEl ? shiftTypeEl.textContent : 'Std';
  const sleepLabelEl = document.getElementById('sleep-label');
  const sleepLabel = sleepLabelEl ? sleepLabelEl.textContent.split(' ')[0] : 'Good';
  const streakLabelEl = document.getElementById('streak-label');
  const streakLabel = streakLabelEl ? streakLabelEl.textContent : '1st day';
  const startLabelEl = document.getElementById('start-label');
  const startLabel = startLabelEl ? startLabelEl.textContent.split(' ')[0] : 'Day';

  const todayIdx = qcGetTodayIndex();
  const checkIdx = qcGetCheckDayIndex();
  const dayForLabel = checkIdx === todayIdx ? 'Today' : DAYS_SHORT[checkIdx];
  return {
    day: dayForLabel,
    base: `${baseH}h${baseM > 0 ? ' ' + baseM + 'm' : ''}`,
    extra: `+${extraH}h${extraM > 0 ? ' ' + extraM + 'm' : ''}`,
    type: shiftType,
    start: startLabel,
    sleep: sleepLabel,
    streak: streakLabel,
  };
}

// Render snapshot chips in the bar
function qcRenderSnapshotBar(snap, timeStr) {
  const bar = document.getElementById('qc-snapshot-bar');
  const chips = document.getElementById('qc-snap-chips');
  const timeMeta = document.getElementById('qc-snap-time');
  if (!bar || !chips || !snap) return;
  chips.innerHTML = [
    snap.day || 'Today',
    `Std: ${snap.base}`,
    `Extra: ${snap.extra}`,
    snap.type,
    snap.start,
    snap.sleep,
    snap.streak
  ].map(t => `<span class="snap-chip">${t}</span>`).join('');
  if (timeMeta) timeMeta.textContent = timeStr || '';
  bar.style.display = 'block';
}

// Update save-state badge
function qcSetSaveBadge(saved) {
  const badge = document.getElementById('qc-save-state-badge');
  if (!badge) return;
  if (saved) {
    badge.className = 'saved';
    badge.textContent = '✓ Saved to Your Week Read';
  } else {
    badge.className = 'unsaved';
    badge.textContent = '○ Unsaved';
  }
}

// Render state visuals
function qcRenderState() {
  const formArea = document.getElementById('qc-form-area');
  const calcBtn = document.getElementById('qc-calc-btn');
  const staleBanner = document.getElementById('qc-stale-banner');
  const output = document.getElementById('qc-output');
  const snapBar = document.getElementById('qc-snapshot-bar');

  switch(qcState) {
    case 'draft':
      
      if (calcBtn) calcBtn.textContent = 'Get the read';
      if (staleBanner) staleBanner.style.display = 'none';
      if (snapBar) snapBar.style.display = 'none';
      if (output) output.style.display = 'none';
      break;

    case 'result':
      if (calcBtn) calcBtn.textContent = 'Get the read';
      if (staleBanner) staleBanner.style.display = 'none';
      if (output) output.style.display = 'block';
      qcSetSaveBadge(false);
      break;

    case 'stale':
      
      if (calcBtn){ calcBtn.textContent = 'Recalculate'; calcBtn.disabled = false; calcBtn.style.opacity = ''; }
      if (staleBanner) staleBanner.style.display = 'block';
      break;

    case 'saved':
      if (calcBtn) calcBtn.textContent = 'Get the read';
      if (staleBanner) staleBanner.style.display = 'none';
      if (output) output.style.display = 'block';
      qcSetSaveBadge(true);
      break;
  }
}

// Edit inputs — expand form, mark stale if result exists
function qcEditInputs() {
  const formArea = document.getElementById('qc-form-area');
  
  if (qcState === 'result' || qcState === 'saved') {
    qcState = 'stale';
    const staleBanner = document.getElementById('qc-stale-banner');
    if (staleBanner) staleBanner.style.display = 'block';
    const calcBtn = document.getElementById('qc-calc-btn');
    if (calcBtn){ calcBtn.textContent = 'Recalculate'; calcBtn.disabled = false; calcBtn.style.opacity = ''; }
  }
  // Scroll form into view
  const formEl = document.getElementById('qc-form-area');
  var scr2 = document.getElementById('tab-quickcheck');
  if(scr2) scr2.scrollTop = 0;
}

// New check — reset everything to draft
function qcNewCheck() {
  qcState = 'draft';
  qcSnapshotInputs = null;
  qcResultTime = null;
  qcInputsChangedSinceResult = false;
  const output = document.getElementById('qc-output');
  if (output) output.style.display = 'none';
  const snapBar = document.getElementById('qc-snapshot-bar');
  if (snapBar) snapBar.style.display = 'none';
  const staleBanner = document.getElementById('qc-stale-banner');
  if (staleBanner) staleBanner.style.display = 'none';
  const savedConfirm = document.getElementById('p1-saved-confirm');
  if (savedConfirm) savedConfirm.style.display = 'none';
  qcRenderState();
  // Scroll to top of QC tab
  const tab = document.getElementById('tab-quickcheck');
  if(tab){ tab.scrollTop = 0; }
}

// Hook: called when calculate() completes successfully
function qcOnResultReady() {
  qcState = 'result';
  qcSnapshotInputs = qcCaptureSnapshot();
  qcResultTime = new Date();
  qcInputsChangedSinceResult = false;
  const timeStr = qcResultTime.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
  qcRenderSnapshotBar(qcSnapshotInputs, timeStr);
  qcRenderState();
  // Update day label on result card
  const _rdl = document.getElementById('qc-result-day-label');
  if (_rdl && qcSnapshotInputs) _rdl.textContent = (qcSnapshotInputs.day || 'Today').toUpperCase();
}

// Hook: called when shift is saved from P1
function qcOnSaved() {
  qcState = 'saved';
  qcRenderState();
  const savedConfirm = document.getElementById('p1-saved-confirm');
  if (savedConfirm) savedConfirm.style.display = 'block';
}


function saveShiftFromP1(){
  if(!lastCalcResult)return;
  // Don't save scenario results to real week
  if(checkModeIsScenario){
    var conf=document.getElementById('p1-saved-confirm');
    if(conf){conf.textContent='⚠ Scenario mode — not saved to your week.';conf.style.color='#FCD34D';conf.style.display='block';}
    return;
  }
  lastFatigue=lastCalcResult.fatigue;
  sessionBaseline=lastCalcResult.fatigue;
  // Avoid duplicate saves
  if(shiftHistory.length>0&&shiftHistory[0].id&&(Date.now()-shiftHistory[0].id)<5000)return;
  shiftHistory.unshift({...lastCalcResult,id:Date.now()});
  if(shiftHistory.length>84)shiftHistory=shiftHistory.slice(0,84);
  saveState();renderHistory();updateGoalProgress();updateShareCard();updateRecoveryPill();
  // Animate the week strip cell for today/checked day
  qcRenderWeekStrip();
  const checkIdx = qcGetCheckDayIndex();
  const cells = document.querySelectorAll('.week-day-cell');
  if(cells && cells[checkIdx]){
    cells[checkIdx].classList.add('just-saved');
    setTimeout(()=>cells[checkIdx].classList.remove('just-saved'), 600);
  }
  // State machine: mark as saved
  qcOnSaved();
}

function saveShift(){
  if(!lastCalcResult)return;
  lastFatigue=lastCalcResult.fatigue;
  sessionBaseline=lastCalcResult.fatigue;
  shiftHistory.unshift({...lastCalcResult,id:Date.now()});
  if(shiftHistory.length>84)shiftHistory=shiftHistory.slice(0,84);
  saveState();renderHistory();updateGoalProgress();
  showShiftSavedScreen();
}


function updateShareCard(){
  const weekShifts=shiftHistory.slice(0,7);
  const textEl=document.getElementById('share-card-text');
  if(weekShifts.length===0){
    if(textEl){textEl.textContent='Save shifts in QuickCheck to generate your week read.';textEl.style.color='var(--muted)';}
    const copyBtn=document.getElementById('share-copy-btn');
    if(copyBtn)copyBtn.style.opacity='0.3';
    return;
  }
  const copyBtn=document.getElementById('share-copy-btn');
  if(copyBtn)copyBtn.style.opacity='1';
  const card=document.getElementById('week-share-card');
  if(card)card.style.display='block';
  const weekNet=weekShifts.reduce((s,h)=>s+h.net,0);
  const peakFat=Math.max(...weekShifts.map(h=>h.fatigue));
  const peakBand=peakFat>=76?'Red':peakFat>=56?'Amber':peakFat>=36?'Yellow':'Green';
  const avgEtp=weekShifts.filter(h=>h.etp).length>0?weekShifts.filter(h=>h.etp).reduce((s,h)=>s+h.etp,0)/weekShifts.filter(h=>h.etp).length:null;
  const etpLabel=avgEtp?avgEtp>=7?'Strong return':avgEtp>=5?'Fair return':avgEtp>=3?'Weak return':'Poor return':'—';
  const restDays=7-weekShifts.length;
  const patternLabel=peakFat>=76?'Overloaded':peakFat>=56&&restDays<=1?'At risk':peakFat>=56?'Watch the pattern':peakFat>=36?'Building well':'Sustainable';
  const isPublic=document.getElementById('share-public-mode')&&document.getElementById('share-public-mode').checked;
  let text='';
  const _cat9 = getPhrase('cat9', true);
  if(isPublic){
    text=`Week: ${peakBand} band · ${weekShifts.length} shift${weekShifts.length!==1?'s':''} · ${restDays} rest day${restDays!==1?'s':''}
`;
    if(avgEtp)text+=`ETP: ${etpLabel}
`;
    text+=`Pattern: ${patternLabel}
`;
    text+=`${_cat9}
`;
    text+=`[ShiftScope — is it worth it?]`;
  } else {
    text=`This week:
`;
    text+=`Net earned: ${fmt(weekNet)}
`;
    text+=`Peak fatigue: ${Math.round(peakFat)}/100 — ${peakBand}
`;
    if(avgEtp)text+=`ETP average: ${avgEtp.toFixed(1)} — ${etpLabel}
`;
    text+=`${weekShifts.length} shift${weekShifts.length!==1?'s':''}, ${restDays} rest day${restDays!==1?'s':''}
`;
    text+=`Pattern: ${patternLabel}
`;
    text+=`${_cat9}\n`;
    text+=`[ShiftScope]`;
  }
  const el=document.getElementById('share-card-text');
  if(el){el.textContent=text;el.style.color='var(--white)';}
}
function copyWeekRead(){
  const el=document.getElementById('share-card-text');
  if(!el)return;
  try{
    navigator.clipboard.writeText(el.textContent).then(()=>{
      const btn=document.getElementById('share-copy-btn');
      if(btn){const orig=btn.textContent;btn.textContent='Copied';setTimeout(()=>{btn.textContent=orig;},1800);}
    });
  } catch(e){
    const ta=document.createElement('textarea');ta.value=el.textContent;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    const btn=document.getElementById('share-copy-btn');
    if(btn){const orig=btn.textContent;btn.textContent='Copied';setTimeout(()=>{btn.textContent=orig;},1800);}
  }
}

function showInputHelp(){
  document.getElementById('input-help-sheet').style.display='block';
  document.getElementById('input-help-overlay').style.display='block';
}

function showShiftSavedScreen(){
  // Remove any existing instance
  const existing=document.getElementById('shift-saved-screen');
  if(existing)existing.remove();
  // Build clean full-screen overlay — covers everything including nav bar
  const saved=document.createElement('div');
  saved.id='shift-saved-screen';
  saved.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 28px;text-align:center;';
  saved.innerHTML=`
    <div style="font-size:3rem;margin-bottom:24px;line-height:1;">✅</div>
    <div style="font-family:var(--head);font-size:clamp(1.5rem,6vw,2rem);font-weight:900;letter-spacing:-0.03em;color:#ffffff;margin-bottom:12px;line-height:1.15;">Shift saved.</div>
    <div style="font-size:clamp(0.82rem,3vw,0.95rem);color:#94a3b8;line-height:1.7;max-width:min(290px,85vw);margin-bottom:32px;">Your read is on record. The more shifts you track, the sharper your weekly picture gets.</div>
    <button onclick="document.getElementById('shift-saved-screen').remove();showQCBack();" style="width:100%;max-width:320px;padding:16px;background:#3b82f6;border:none;border-radius:14px;color:#ffffff;font-family:var(--head);font-size:0.95rem;font-weight:800;cursor:pointer;margin-bottom:12px;letter-spacing:-0.01em;">Back to QuickCheck</button>
    <button onclick="document.getElementById('shift-saved-screen').remove();showTab('history');" style="width:100%;max-width:min(320px,90vw);padding:16px;background:none;border:1px solid rgba(56,189,248,0.35);border-radius:14px;color:#38bdf8;font-family:var(--head);font-size:clamp(0.88rem,3vw,0.95rem);font-weight:700;cursor:pointer;">See my week</button>
  `;
  document.body.appendChild(saved);
}
function renderHistory(){
  const empty=document.getElementById('history-empty');
  const stats=document.getElementById('history-stats');
  const list=document.getElementById('history-list');
  const trendWrap=document.getElementById('trend-chart');
  if(shiftHistory.length===0){empty.style.display='block';stats.style.display='none';document.getElementById('s-shift-count').textContent='0';document.getElementById('s-baseline-status').textContent='Building...';return;}
  empty.style.display='none';stats.style.display='block';
  const totalNet=shiftHistory.reduce((s,h)=>s+h.net,0);
  const avgFat=shiftHistory.reduce((s,h)=>s+h.fatigue,0)/shiftHistory.length;
  // Hidden compat
  document.getElementById('hist-avg-fat').value=Math.round(avgFat);
  document.getElementById('hist-shifts').value=shiftHistory.length;
  document.getElementById('s-shift-count').textContent=shiftHistory.length;
  document.getElementById('s-baseline-status').textContent=shiftHistory.length>=10?'Active ✓':`${10-shiftHistory.length} more shifts to activate`;
  // WEEK READ — toplines
  const weekShifts7=shiftHistory.slice(0,7);
  const weekNet7=weekShifts7.reduce((s,h)=>s+h.net,0);
  const peakFat=weekShifts7.length>0?Math.max(...weekShifts7.map(h=>h.fatigue)):null;
  const peakBand=peakFat>=76?'Red':peakFat>=56?'Amber':peakFat>=36?'Yellow':'Green';
  const peakColor=peakFat>=76?'#F87171':peakFat>=56?'#FB923C':peakFat>=36?'#FBBF24':'#4ADE80';
  const avgEtp=weekShifts7.filter(h=>h.etp).length>0?weekShifts7.filter(h=>h.etp).reduce((s,h)=>s+h.etp,0)/weekShifts7.filter(h=>h.etp).length:null;
  const etpLabel=avgEtp?avgEtp>=7?'Strong return':avgEtp>=5?'Fair return':avgEtp>=3?'Weak return':'Poor return':'—';
  const restDays7=7-weekShifts7.length;
  const patternLabel=peakFat>=76?'Overloaded':peakFat>=56&&restDays7<=1?'At risk':peakFat>=56?'Watch the pattern':peakFat>=36?'Building well':'Sustainable';
  // Update topline elements
  const elNet=document.getElementById('hist-net');
  if(elNet)elNet.textContent=fmt(weekNet7);
  const elPeak=document.getElementById('hist-peak-fat');
  if(elPeak){elPeak.textContent=peakFat?`${Math.round(peakFat)} ${peakBand}`:'—';elPeak.style.color=peakFat?peakColor:'var(--muted)';}
  const elEtp=document.getElementById('hist-etp-avg');
  if(elEtp){elEtp.textContent=avgEtp?avgEtp.toFixed(1):'—';elEtp.style.color=avgEtp?avgEtp>=7?'#4ADE80':avgEtp>=5?'#FBBF24':'#F87171':'var(--muted)';}
  const elPattern=document.getElementById('hist-week-pattern');
  if(elPattern){elPattern.textContent=patternLabel;elPattern.style.color=patternLabel==='Overloaded'||patternLabel==='At risk'?'#F87171':patternLabel==='Watch the pattern'?'#FB923C':patternLabel==='Building well'?'#4ADE80':'var(--muted)';}
  // INTERPRETATION — How the week played out
  const interpCard=document.getElementById('week-read-interpretation');
  const interpText=document.getElementById('week-read-text');
  if(interpCard&&interpText&&weekShifts7.length>0){
    interpCard.style.display='block';
    const shiftWord=weekShifts7.length===1?'1 shift':`${weekShifts7.length} shifts`;
    const restWord=restDays7===1?'1 rest day':`${restDays7} rest days`;
    const etpStr=avgEtp?`ETP average ${avgEtp.toFixed(1)} — ${etpLabel.toLowerCase()}.`:'';
    let interp='';
    if(patternLabel==='Overloaded'){
      const _opener4 = getPhrase('cat4', true);
      interp=`${_opener4} ${shiftWord}, ${restWord}. Peak fatigue hit the Red band — the pattern was stretched past its sustainable ceiling. ${etpStr} Next week opens carrying that cost.`;
    } else if(patternLabel==='At risk'){
      const _opener4b = getPhrase('cat4', false);
      interp=`${_opener4b} ${shiftWord}, ${restWord}. Fatigue reached Amber with limited recovery time. ${etpStr} The cumulative load carries forward.`;
    } else if(patternLabel==='Watch the pattern'){
      const _opener4c = getPhrase('cat4', false);
      interp=`${_opener4c} ${shiftWord}, ${restWord}. Fatigue built into Amber. ${etpStr} An extra rest day keeps the pattern more robust across the month.`;
    } else if(patternLabel==='Building well'){
      const _opener4d = getPhrase('cat4', false);
      interp=`${_opener4d} ${shiftWord}, ${restWord}. ${etpStr} Fatigue accumulated at a manageable rate. The pattern held.`;
    } else {
      const _opener4e = getPhrase('cat4', false);
      interp=`${_opener4e} ${shiftWord}, ${restWord}. ${etpStr} Fatigue stayed in the Green band throughout.`;
    }
    interpText.textContent=interp;
  } else if(interpCard){
    interpCard.style.display='none';
  }
  const insightsEl=document.getElementById('history-insights');
  if(insightsEl){
    insightsEl.style.display='block';
    const sorted=[...shiftHistory].filter(s=>s.etp).sort((a,b)=>b.etp-a.etp);
    const best=sorted[0],worst=sorted[sorted.length-1];
    if(best&&document.getElementById('hist-best'))document.getElementById('hist-best').textContent=`${best.date}: ${fmtH(best.totalH||best.basicH||0)} ${best.shiftType} · ETP ${best.etp.toFixed(1)} · ${getPhrase('cat7',false).split('.')[0]}.`;
    if(worst&&worst!==best&&document.getElementById('hist-worst'))document.getElementById('hist-worst').textContent=`${worst.date}: ${fmtH(worst.totalH||worst.basicH||0)} ${worst.shiftType} · ETP ${worst.etp.toFixed(1)}`;
  }
  updateShareCard();
  trendWrap.innerHTML='';
  const recent=shiftHistory.slice(0,28).reverse();
  recent.forEach(sh=>{const bar=document.createElement('div');bar.className='trend-bar';bar.style.height=Math.max(sh.fatigue,4)+'%';bar.style.background=sh.bandColor||'#38BDF8';bar.title=`${sh.date}: ${sh.band} (${Math.round(sh.fatigue)})`;trendWrap.appendChild(bar);});
  list.innerHTML='';
  shiftHistory.slice(0,14).forEach(sh=>{
    const div=document.createElement('div');div.className='history-shift';
    const totalH=(sh.basicH||sh.totalH||0)+(sh.otH||0);
    const etpLbl=sh.etp?sh.etp>=7?'Strong':sh.etp>=5?'Fair':sh.etp>=3?'Weak':'Poor':'—';div.innerHTML=`<div class="hs-left"><div class="hs-date">${sh.date}</div><div class="hs-detail">${fmtH(totalH)} · ${sh.shiftType}</div><div class="hs-sub">After tax ${fmt(sh.net)} · ETP ${sh.etp?sh.etp.toFixed(1)+' '+etpLbl:'—'}</div></div><div class="hs-right"><div class="hs-net">${fmt(sh.net)}</div><div class="hs-band" style="background:${sh.bandColor}22;color:${sh.bandColor};border:1px solid ${sh.bandColor}44;">${sh.band}</div></div>`;
    list.appendChild(div);
  });
  // Sync goal progress card shown in History
  const _gt=(document.getElementById('goal-type')||{}).value||'income';
  const _tgt=parseFloat((document.getElementById('goal-amount')||{}).value)||500;
  const _wnet=shiftHistory.slice(0,7).reduce((s,h)=>s+h.net,0);
  const _hfill=document.getElementById('hist-goal-fill');
  if(_hfill&&_gt!=='fatigue'){
    const _pct=Math.min((_wnet/_tgt)*100,100);
    _hfill.style.width=_pct+'%';
    const _hc=document.getElementById('hist-goal-current');if(_hc)_hc.textContent=fmt(_wnet);
    const _ht=document.getElementById('hist-goal-target');if(_ht)_ht.textContent=fmt(_tgt);
    const _hl=document.getElementById('hist-goal-label');
    if(_hl){
      if(_pct>=100) _hl.textContent = getPhrase('cat6', true);
      else if(shiftHistory.length===0) _hl.textContent = 'Save shifts in QuickCheck to track your goal here.';
      else _hl.textContent = _pct.toFixed(0)+'% of your weekly target covered so far.';
    }
  }
}
function clearHistory(){if(!confirm('Clear all shift history?'))return;shiftHistory=[];lastFatigue=null;sessionBaseline=null;renderHistory();updateGoalProgress();updateScorePill();}
function resetApp(){if(!confirm('Reset ShiftScope completely?'))return;try{localStorage.clear();}catch(e){}lastFatigue=null;sessionBaseline=null;shiftHistory=[];showOnboarding();}

// ═══════════════════════════════════════════════════════════════════
// GOALS
// ═══════════════════════════════════════════════════════════════════
function selectGoalType(el,type){
  document.querySelectorAll('.goal-type-card').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('goal-type').value=type;
  document.getElementById('goal-income-field').style.display=type==='fatigue'?'none':'block';
  document.getElementById('goal-fatigue-field').style.display=type==='fatigue'?'block':'none';
  if(!profile.goal)profile.goal={};
  profile.goal.type=type;
  saveState();updateGoalProgress();
}
function updateGoalProgress(){
  const type=document.getElementById('goal-type').value;
  const target=parseFloat(document.getElementById('goal-amount').value)||500;
  if(!profile.goal)profile.goal={};
  profile.goal.weeklyTarget=target;
  profile.goal.weeklyProgress=shiftHistory.slice(0,7).reduce((s,h)=>s+h.net,0);
  profile.goal.ceiling=parseFloat(document.getElementById('fatigue-ceiling')?.value)||45;
  document.getElementById('goal-target-display').textContent=type==='fatigue'?(document.querySelector('#fatigue-ceiling-seg .seg-btn.active')?.textContent||'Amber'):fmt(target);
  const weekShifts=shiftHistory.slice(0,7);
  const weekNet=weekShifts.reduce((s,h)=>s+h.net,0);
  const weekAvgFat=weekShifts.length>0?weekShifts.reduce((s,h)=>s+h.fatigue,0)/weekShifts.length:0;
  let current=0,pct=0;
  if(type==='income'||type==='monthly'||type==='balance'){current=weekNet;pct=Math.min((current/target)*100,100);document.getElementById('goal-current-val').textContent=fmt(current);}
  else if(type==='fatigue'){const ceiling=parseFloat(document.getElementById('fatigue-ceiling').value)||45;current=weekAvgFat;pct=weekShifts.length>0?Math.max(0,100-((current/ceiling)*100)):100;document.getElementById('goal-current-val').textContent=Math.round(current)||'—';}
  document.getElementById('goal-progress-fill').style.width=pct+'%';
  const gap=target-weekNet;
  const gapCard=document.getElementById('goal-gap-card'),gapMsg=document.getElementById('goal-gap-msg');
  if(weekShifts.length>0&&type!=='fatigue'&&gap>0){gapCard.style.display='block';const hours=gap/0.72/(profile.rate||20.50);gapMsg.textContent=`${fmt(gap)} still to reach your target. A similar shift would close approximately ${fmt(Math.min(gap, (profile.rate||20.50)*1.5*0.72*3))} of that gap after tax.`;}
  else if(gap<=0&&weekShifts.length>0){gapCard.style.display='block';gapMsg.textContent='✓ '+getPhrase('cat6', false);}
  else{gapCard.style.display='none';}
  const recEl=document.getElementById('goal-recommendation');
  if(weekShifts.length===0){recEl.textContent='Save at least one shift to generate recommendations.';}
  else if(type==='balance'){const best=weekShifts.reduce((a,b)=>a.etp>b.etp?a:b);recEl.textContent=`Your highest effort-to-pay shift: ${fmtH(best.totalH||best.basicH)} ${best.shiftType} (ETP ${best.etp?.toFixed(1)||'—'}).`;}
  else{recEl.textContent=`Based on your profile, a ${fmtH(profile.contracted)} standard shift earns approximately ${fmt(profile.contracted*profile.rate*0.72)} net. To reach ${fmt(target)}, you need approximately ${Math.ceil(target/(profile.contracted*profile.rate*0.72))} similar shifts.`;}
  document.getElementById('goal-progress-label').textContent=pct>=100?'✓ Target reached this week!':weekShifts.length===0?'Save shifts to track progress':`${pct.toFixed(0)}% of target reached`;
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════
function setSettingStartTime(h){
  profile.shiftStartHour = h;
  document.getElementById('s-start-time').value = h;
  saveSettings();
}

function saveSettings(){
  profile.professionP=parseFloat(document.getElementById('s-profession').value)||1.0;
  profile.rate=parseFloat(document.getElementById('s-rate').value)||20.50;
  profile.region=document.getElementById('s-region').value||'england';
  profile.contracted=parseFloat(document.getElementById('s-contracted').value)||9.25;
  profile.otMult=parseFloat(document.getElementById('s-ot-mult').value)||1.5;
  profile.shiftStartHour=parseInt(document.getElementById('s-start-time').value)||7;
  saveState();
  try{initQC();}catch(e){}
  runForecast();
}
function stepSetting(id,delta,min,max){
  const el=document.getElementById(id);
  let v=Math.round((parseFloat(el.value)+delta)*4)/4;
  v=Math.min(Math.max(v,min),max);
  el.value=v;
  document.getElementById(id+'-val').textContent=fmtH(v);
  saveSettings();
}
function showHealthInfo(){const inf=document.getElementById('health-info');inf.style.display=inf.style.display==='none'?'block':'none';}

// ═══════════════════════════════════════════════════════════════════
// NAV + INIT
// ═══════════════════════════════════════════════════════════════════
function showMainApp(){
  document.getElementById('onboarding').style.display='none';
  var app=document.getElementById('main-app');
  app.style.cssText='display:flex;height:100%;flex:1;min-height:0;flex-direction:column;overflow:hidden;';
  // CSS handles screen visibility via .screen / .screen.active
  if(sessionBaseline===null)sessionBaseline=deriveFatigueFromProxy(profile.sleepHours||7.5,profile.streakDays||1,profile.daysOffAgo||1);
  try{document.getElementById('s-rate').value=profile.rate;}catch(e){}
  try{
    var startH = profile.shiftStartHour !== undefined ? profile.shiftStartHour : 7;
    document.getElementById('s-start-time').value = startH;
    var startBtns = document.querySelectorAll('#s-start-seg .seg-btn');
    var startVals = [0, 5, 7, 20];
    startBtns.forEach(function(btn, i){ 
      btn.classList.toggle('active', startVals[i] === startH); 
    });
  }catch(e){}
  try{document.getElementById('s-profession').value=profile.professionP;}catch(e){}
  try{document.getElementById('s-contracted').value=profile.contracted||9.25;document.getElementById('s-contracted-val').textContent=fmtH(profile.contracted||9.25);}catch(e){}
  try{document.getElementById('s-ot-mult').value=profile.otMult||1.5;}catch(e){}
  buildPatternGrid();runForecast();renderHistory();updateGoalProgress();updateScorePill();
  fixScreenHeights();
  setTimeout(function(){
    showTab('today');
    setTimeout(updateRecoveryPill, 200);
  }, 50);
}
function showOnboarding(){
  document.getElementById('onboarding').style.display='block';
  document.getElementById('main-app').style.display='none';
}
// All known screens — explicit list so we control every display toggle



function showQCVerdict(){ /* no-op: single-tab model */ }
function qcBackToInput(){ qcEditInputs(); }



function showTab(name){
  fixScreenHeights();
  document.querySelectorAll('.screen').forEach(function(s){
    s.classList.remove('active');
    s.style.display='';
  });
  document.querySelectorAll('.nav-tab').forEach(function(t){ t.classList.remove('active'); });
  var scr = document.getElementById('tab-'+name);
  if(scr) scr.classList.add('active');
  var nav = document.getElementById('nav-'+name);
  if(nav) nav.classList.add('active');
  if(name==='today'){ setTimeout(function(){ renderTodayScreen(); fixScreenHeights(); }, 20); }
  if(name==='quickcheck'){initQC();updateStreakAlert();qcRenderState();renderLiveContext();}
  if(name==='forecast')runForecast();
  if(name==='history'){renderHistory();updateShareCard();}
  if(name==='goals')updateGoalProgress();
}


// Global error handler — surfaces real errors in restrictive WebViews


// ═══════════════════════════════════════════════════════════════════
// END OF DAY CONFIRM SYSTEM
// Allows user to correct planned estimate with actuals
// ═══════════════════════════════════════════════════════════════════

var eodTargetIndex = -1;  // index in shiftHistory being confirmed
var eodBreak = 0;         // break hours between jobs
var eodIntensity = 1.0;

function openEodSheet(histIdx) {
  eodTargetIndex = histIdx !== undefined ? histIdx : 0;
  var entry = shiftHistory[eodTargetIndex];
  if (!entry) return;

  // Pre-fill with current values
  var totalH = entry.actualTotalH !== undefined ? entry.actualTotalH : (entry.totalH || 9.25);
  document.getElementById('eod-total-h').value = totalH;
  updateEodDisplay(totalH);

  // Set intensity
  eodIntensity = entry.actualIntensity !== undefined ? entry.actualIntensity :
                 (entry.shiftType === 'Heavy' ? 1.2 : entry.shiftType === 'Light' ? 0.8 : 1.0);
  document.querySelectorAll('#eod-confirm-sheet .shift-type-card').forEach(function(c){c.classList.remove('active');});
  var typeMap = {0.8:'light',1.0:'standard',1.2:'heavy'};
  var activeType = typeMap[eodIntensity] || 'standard';
  var typeCard = document.querySelector('#eod-confirm-sheet .shift-type-card.' + activeType);
  if(typeCard) typeCard.classList.add('active');

  // Show entry date
  var intro = document.getElementById('eod-intro');
  if(intro) intro.textContent = 'Updating: ' + (entry.date || 'today') + '. Replaces the planned estimate in your week.';

  // Show sheet
  document.getElementById('eod-backdrop').style.display = 'block';
  document.getElementById('eod-confirm-sheet').style.display = 'block';
}

function closeEodSheet() {
  document.getElementById('eod-backdrop').style.display = 'none';
  document.getElementById('eod-confirm-sheet').style.display = 'none';
}

function updateEodDisplay(val) {
  var h = Math.floor(val);
  var m = Math.round((val - h) * 60);
  var display = h + 'h' + (m > 0 ? ' ' + m + 'm' : '');
  var el = document.getElementById('eod-total-h-val');
  if(el) el.textContent = display;
  document.getElementById('eod-total-h').value = val;
}

function stepEod(id, delta, min, max) {
  var current = parseFloat(document.getElementById(id).value) || 0;
  var next = Math.round((current + delta) * 4) / 4;
  next = Math.min(max, Math.max(min, next));
  updateEodDisplay(next);
}

function selectEodType(el, intensity) {
  document.querySelectorAll('#eod-confirm-sheet .shift-type-card').forEach(function(c){c.classList.remove('active');});
  el.classList.add('active');
  eodIntensity = intensity;
  document.getElementById('eod-intensity').value = intensity;
}

function confirmEodShift() {
  var entry = shiftHistory[eodTargetIndex];
  if (!entry) { closeEodSheet(); return; }

  var actualH = parseFloat(document.getElementById('eod-total-h').value) || entry.totalH;
  var breakH = eodBreak || 0;
  var job1H = entry.basicH || (entry.totalH ? Math.min(entry.totalH, profile.contracted || 9.25) : 9.25);
  var breakMins = Math.round(breakH * 60);

  // Get WTD-adjusted baseline for job 2
  var wtdAdj = fatigueAtJob2Start(
    entry.baselineFatigue !== undefined ? (entry.baselineFatigue + (entry.addedFatigue || 0)) : (lastFatigue || 35),
    breakMins,
    job1H
  );

  // Recalculate fatigue with actual hours and WTD-adjusted baseline
  var streak = entry.streak || profile.streakDays || 1;
  var daysOff = entry.daysOffAgo || profile.daysOffAgo || 1;
  var sleepH = entry.sleepHours || profile.sleepHours || 7.5;
  var startH = entry.startHour || profile.shiftStartHour || 7;

  var actualFatigue = calcFatigueV2(
    actualH, eodIntensity, profile.professionP,
    wtdAdj.baseline, sleepH, startH, streak, daysOff
  ).projectedFatigue;

  // Store WTD info on the entry
  entry.wtdStatus = wtdAdj.wtdStatus;
  entry.wtdBreakCredit = wtdAdj.breakCredit;
  entry.wtdMin = wtdAdj.wtdMin;
  entry.breakMinutes = breakMins;

  // Recalculate pay with actual hours
  var contracted = profile.contracted || 9.25;
  var rate = entry.rate || profile.rate || 20.50;
  var otMult = entry.otMult || profile.otMult || 1.5;
  var otH = Math.max(0, actualH - contracted);
  var basePayH = Math.min(actualH, contracted);
  var actualGross = (basePayH * rate) + (otH * rate * otMult);
  var region = entry.region || profile.region || 'england';
  var actualTax = calcTax(actualGross * 52, region) / 52;
  var actualNet = actualGross - actualTax;

  // Update the history entry
  entry.actualTotalH = actualH;
  entry.actualIntensity = eodIntensity;
  entry.actualBreakH = breakH;
  entry.fatigue = Math.round(actualFatigue * 10) / 10;
  entry.gross = Math.round(actualGross * 100) / 100;
  entry.net = Math.round(actualNet * 100) / 100;
  entry.confirmed = true;
  entry.shiftType = eodIntensity === 0.8 ? 'Light' : eodIntensity === 1.2 ? 'Heavy' : 'Standard';
  entry.confirmedAt = new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'});

  // Update lastFatigue if this is the most recent entry
  if (eodTargetIndex === 0) {
    lastFatigue = entry.fatigue;
    sessionBaseline = entry.fatigue;
  }

  saveState();
  renderHistory();
  updateGoalProgress();
  updateShareCard();
  updateRecoveryPill();
  if (typeof renderTodayScreen === 'function') renderTodayScreen();
  closeEodSheet();

  // Flash confirmation
  setTimeout(function() {
    var btn = document.getElementById('eod-confirm-btn');
    if(btn) { var orig = btn.textContent; btn.textContent = '✓ Confirmed'; setTimeout(function(){ btn.textContent = orig; },1500); }
  }, 100);
}

// Open EOD sheet for today's most recent shift

function updateEodWtd() {
  var totalH = parseFloat(document.getElementById('eod-total-h').value) || 9.25;
  var breakMins = Math.round(eodBreak * 60);
  var statusEl = document.getElementById('eod-wtd-status');
  if (!statusEl) return;

  var wtd = wtdBreakCredit(breakMins, totalH);

  if (wtd.wtdStatus === 'not_required') {
    statusEl.style.display = 'none';
    return;
  }

  statusEl.style.display = 'block';
  if (wtd.wtdStatus === 'compliant') {
    statusEl.style.background = 'rgba(74,222,128,0.08)';
    statusEl.style.border = '1px solid rgba(74,222,128,0.2)';
    statusEl.style.color = '#4ADE80';
    statusEl.textContent = '✓ WTD compliant — ' + breakMins + ' min break on ' + totalH.toFixed(1) + 'h shift.';
  } else {
    statusEl.style.background = 'rgba(239,68,68,0.08)';
    statusEl.style.border = '1px solid rgba(239,68,68,0.2)';
    statusEl.style.color = '#F87171';
    statusEl.textContent = '⚠ WTD: ' + totalH.toFixed(1) + 'h shift requires ' + wtd.wtdMin + ' min break. ' + wtd.wtdShortfall + ' min short.';
  }

  // Also show fatigue impact
  var entry = shiftHistory[eodTargetIndex];
  if (entry && breakMins > 0) {
    var credit = wtd.credit;
    statusEl.textContent += ' Break reduces fatigue carry by ' + credit + ' pts.';
  }
}

function confirmTodayShift() {
  if (shiftHistory.length === 0) return;
  // Find today's entry
  var today = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
  var todayIdx = shiftHistory.findIndex(function(s){ return s.date === today; });
  openEodSheet(todayIdx >= 0 ? todayIdx : 0);
}


// ── SCREEN HEIGHT FIX ─────────────────────────────────────────────
// Sets explicit pixel heights on all screens after DOM ready.
// Bypasses all WebView CSS height inheritance issues.
function fixScreenHeights() {
  var topbar = document.querySelector('.topbar');
  var topH = topbar ? topbar.offsetHeight : 60;
  if (topH < 40) topH = 60;
  var screens = document.querySelectorAll('.screen');
  screens.forEach(function(s) {
    s.style.paddingTop = (topH + 4) + 'px';
  });
  // Also fix tab-qcsummary which is position:fixed overlay
  // tab-qcsummary uses same .screen CSS
}
window.addEventListener('resize', fixScreenHeights);
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(fixScreenHeights, 0);
  setTimeout(fixScreenHeights, 200); // second pass after any reflow
});

window.onerror = function(msg, src, line, col, err) {
  console.error('ShiftScope error:', msg, 'line:', line, err && err.stack ? err.stack.split('\n')[1] : '');
  return false;
};

(function init(){
  try {
    showOnboarding();
    if(loadState())showMainApp();
  } catch(e) {
    console.error('ShiftScope init error:', e.message, e.stack);
    showOnboarding(); // fallback to fresh start
  }
})();

updateDurationDisplays();
