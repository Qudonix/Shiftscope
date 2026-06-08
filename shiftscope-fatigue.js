
// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════
let profile = {
  professionP: 1.0,
  rate: 20.50,
  region: 'england',
  contracted: 9.25,
  otMult: 1.5,
  sleepHours: 7.5,
  streakDays: 1,
  daysOffAgo: 1,
  shiftStartHour: 7,
  strategyMode: 'balanced',
  goal: { type: 'income', weeklyTarget: 500 }
};
let lastFatigue    = null;
let sessionBaseline = null;
let lastCalcResult  = null;
let shiftHistory   = [];
let fcHours        = 8;
let fcShiftI       = 1.0;
let fcPattern      = [true,true,true,true,true,false,false];
const DAY_NAMES    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ═══════════════════════════════════════════════════════════════════
// STRATEGY MODE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════
const STRATEGY = {
  protect_energy: { tolerance: 0.60, label: 'Protect energy',    icon: '🛡' },
  balanced:       { tolerance: 1.00, label: 'Balanced',          icon: '⚖️' },
  push_savings:   { tolerance: 1.35, label: 'Push for savings',  icon: '📈' },
  urgent_cash:    { tolerance: 1.60, label: 'Urgent cash',       icon: '⚡' },
};

function selectStrategy(el, key) {
  qcMarkInputChanged();
  document.querySelectorAll('#qc-strategy-grid .strategy-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('qc-strategy').value = key;
  profile.strategyMode = key;
}
// showQCSummary defined above with showTab

function showQCSummary(){
  if(!lastCalcResult){ return; }
  showTab('qcsummary');
}
function showQCBack(){
  showTab('quickcheck');
  setTimeout(function(){
    var screen = document.getElementById('tab-quickcheck');
    if(screen) screen.scrollTop = 0;
  }, 50);
}


function updateSleepLabel(label){
  const el=document.getElementById('sleep-label');
  const map={Poor:'Poor (<5h)',Short:'Short (5–6h)',Good:'Good (7–8h)',Full:'Full (>8h)'};
  if(el)el.textContent=map[label]||label;
}
function updateStreakLabel(label){
  const el=document.getElementById('streak-label');
  const map={'1st':'1st day','2nd':'2nd in a row','3–4':'3–4 in a row','5+':'5+ in a row'};
  if(el)el.textContent=map[label]||label;
}
function updateStartLabel(h){
  const el=document.getElementById('start-label');
  if(!el)return;
  const map={0:'Night (00–04)',5:'Early (05–06)',7:'Day (07–19)',20:'Evening (20–23)'};
  el.textContent=map[h]||'Day (07–19)';
}
function setSleep(h) {
  profile.sleepHours = h;
}
function setShiftStart(h) {
  qcMarkInputChanged();
  profile.shiftStartHour = h;
  updateStartLabel(h);
}
function setStreak(days, daysOff) {
  qcMarkInputChanged();
  profile.streakDays = days;
  profile.daysOffAgo = daysOff;
  updateStreakAlert();
}

// ═══════════════════════════════════════════════════════════════════
// SHIFTSCOPE FATIGUE ENGINE v2 — LOCKED
//
// Science-informed occupational fatigue framework.
// Consistent with biomathematical fatigue modelling (SAFTE/FAID/
// Three-Process Model) and fatigue-risk-management literature.
//
// ─── FORMAL METRIC DEFINITIONS ──────────────────────────────────
//
//   baselineFatigue   = fatigue score BEFORE today's shift begins.
//                       Derived from sleep, streak, and rest history.
//                       Badge shows this before calculate() is called.
//
//   addedFatigue      = the fatigue cost the SHIFT ITSELF generates.
//                       = DutyLoad (adjusted for type) + CircadianPenalty
//                       This is what Heavy vs Light directly changes.
//
//   projectedFatigue  = full score after today's shift completes.
//                       = addedFatigue + contextFatigue (SP + CL - RC)
//                       Badge ALWAYS shows this after calculate() runs.
//
//   RECONCILIATION INVARIANT:
//     projectedFatigue = addedFatigue + contextFatigue
//     Users must always be able to verify: baseline → added → projected.
//
// ─── SHIFT TYPE CAUSAL MAP (LOCKED) ─────────────────────────────
//
//   Light  (I = 0.8)
//     Duty Load multiplier:       ×0.80  (DL 20% lower than Standard)
//     Streak penalty multiplier:  ×0.80
//     Recovery debt multiplier:   ×0.70
//     Efficient range ceiling:    ×1.15  (more headroom for OT hours)
//     ETP effect: lower DL → lower projectedFatigue → higher ETP
//     Tone: softer — sustained hours cost less per hour
//
//   Standard (I = 1.0) — reference case, all multipliers = 1.0
//
//   Heavy  (I = 1.2)
//     Duty Load multiplier:       ×1.20  (DL 20% higher than Standard)
//     Streak penalty multiplier:  ×1.20
//     Recovery debt multiplier:   ×1.50
//     Efficient range ceiling:    ×0.82  (less headroom — range compresses)
//     ETP effect: higher DL → higher projectedFatigue → lower ETP
//     Tone: firmer — each extra hour costs more in fatigue and recovery
//
// ─── RECOMMENDATION THRESHOLD TABLE (LOCKED) ────────────────────
//
//   These are fixed numeric rules. Not prompt improvisation.
//
//   projectedFatigue ≥ 86            → "Recovery first"     [hard]
//   projectedFatigue ≥ 76            → "Skip it"            [hard]
//   extraHours > stretchMax
//     urgent_cash AND recoveryDebt<7 → "Caution — Overreach"
//     otherwise                      → "Skip it"
//   extraHours > efficientMax AND ≤ stretchMax
//     protect_energy                 → "Skip it"
//     push_savings OR urgent_cash    → "Controlled push"
//     balanced                       → "Borderline"
//   extraHours ≥ efficientMin AND ≤ efficientMax
//     projectedFatigue ≥ 56          → "Worth doing — with care"
//     projectedFatigue < 56          → "Good push"
//   0 < extraHours < efficientMin    → "Comfortable — room to extend"
//   extraHours = 0                   → "Base day only"
//
// ─── EFFICIENT RANGE BAND DEFINITIONS ───────────────────────────
//
//   efficientMax (extra hrs above base) is computed as:
//     rawMax = (4.0 − fatigueLoad×3.5 − intensityPenalty×2.0)
//              × stratTolerance × circadianFactor × sleepFactor
//              × shiftType.rangeFactor   ← Heavy compresses, Light expands
//   Thresholds derive from rawMax:
//     efficientMin = rawMax × 0.40
//     stretchMax   = max(rawMax + 0.5, rawMax × 1.55)
//
// ═══════════════════════════════════════════════════════════════════

// ── SHIFT TYPE CONSTANTS ─────────────────────────────────────────
const SHIFT_TYPE = {
  light:    { I: 0.8, dutyMult: 0.80, recoveryMult: 0.70, rangeFactor: 1.15, label: 'Light' },
  standard: { I: 1.0, dutyMult: 1.00, recoveryMult: 1.00, rangeFactor: 1.00, label: 'Standard' },
  heavy:    { I: 1.2, dutyMult: 1.20, recoveryMult: 1.50, rangeFactor: 0.82, label: 'Heavy' },
};
function getShiftTypeKey(I) {
  if (I <= 0.85) return 'light';
  if (I <= 1.05) return 'standard';
  return 'heavy';
}

// ── RAW DUTY LOAD CURVE (intensity-independent base) ─────────────
// This is the Standard reference curve before shift-type multiplier.
function rawDutyLoad(H) {
  if (H <= 0)  return 0;
  if (H <= 8)  return H * 2.0;
  if (H <= 10) return 16 + (H - 8) * 3.5;
  if (H <= 12) return 23 + (H - 10) * 5.0;
  return            33 + (H - 12) * 7.0;
}

/**
 * PRIMARY ENGINE — unified single call.
 * Returns a full breakdown object (not just a scalar).
 *
 * @param {number} totalHours       - Full shift hours (base + extra combined)
 * @param {number} intensity        - 0.8 / 1.0 / 1.2
 * @param {number} professionP      - Profession multiplier from onboarding
 * @param {number} baselineFatigue  - Score entering the shift (pre-shift)
 * @param {number} sleepOpportunity - Hours of sleep before shift
 * @param {number} shiftStartHour   - 24h start hour
 * @param {number} streakDays       - Consecutive workdays including today
 * @param {number} daysSinceRest    - Days since last full rest day
 * @returns {object} Full breakdown with projectedFatigue, addedFatigue, etc.
 */

// ── WTD BREAK RECOVERY UTILITY ────────────────────────────────────
// Returns recovery credit (fatigue points) for a given break duration
// Also returns the WTD status (compliant / below minimum / no break required)

function wtdBreakCredit(breakMinutes, hoursWorkedBeforeBreak) {
  var bm = breakMinutes || 0;
  var hw = hoursWorkedBeforeBreak || 0;

  // WTD minimum check
  var wtdMin = hw >= 9 ? 30 : hw >= 6 ? 20 : 0;
  var wtdStatus = bm === 0 && wtdMin === 0 ? 'not_required' :
                  bm >= wtdMin ? 'compliant' : 'below_minimum';
  var wtdShortfall = Math.max(0, wtdMin - bm);

  // Recovery credit (capped at 30 points)
  var credit = 0;
  if      (bm <= 0)   credit = 0;
  else if (bm <= 15)  credit = 2;
  else if (bm <= 20)  credit = 3;
  else if (bm <= 30)  credit = 5;
  else if (bm <= 45)  credit = 8;
  else if (bm <= 60)  credit = 11;
  else if (bm <= 90)  credit = 16;
  else if (bm <= 120) credit = 20;
  else if (bm <= 180) credit = 26;
  else                credit = 30;

  return {
    credit,
    wtdStatus,
    wtdMin,
    wtdShortfall,
    compliant: wtdStatus !== 'below_minimum'
  };
}

// Compute fatigue at start of job 2, given:
// - fatigueAfterJob1: projected fatigue after completing job 1
// - breakMinutes: actual break taken between jobs
// - hoursWorkedJob1: hours worked in job 1 (for WTD check)
function fatigueAtJob2Start(fatigueAfterJob1, breakMinutes, hoursWorkedJob1) {
  var btd = wtdBreakCredit(breakMinutes, hoursWorkedJob1);
  var reduced = Math.max(fatigueAfterJob1 - btd.credit, 0);
  return {
    baseline: Math.round(reduced * 10) / 10,
    breakCredit: btd.credit,
    wtdStatus: btd.wtdStatus,
    wtdMin: btd.wtdMin,
    wtdShortfall: btd.wtdShortfall
  };
}

function calcFatigueV2(totalHours, intensity, professionP, baselineFatigue,
                       sleepOpportunity, shiftStartHour, streakDays, daysSinceRest) {

  const H   = Math.max(totalHours || 0, 0);
  const I   = intensity || 1.0;
  const P   = professionP || 1.0;
  const F0  = Math.min(Math.max(baselineFatigue || 0, 0), 100);
  const So  = Math.min(Math.max(sleepOpportunity || 7, 2), 12);
  const t0  = shiftStartHour !== undefined ? shiftStartHour : 7;
  const Sd  = Math.max(streakDays || 1, 1);
  const Dr  = Math.max(daysSinceRest || 1, 0);
  const stk = getShiftTypeKey(I);
  const st  = SHIFT_TYPE[stk];

  // ─── A. ADDED FATIGUE — the shift itself creates this ────────
  // DutyLoad: hours-based, scaled by shift type multiplier
  const DL_raw = rawDutyLoad(H);
  const DL     = DL_raw * st.dutyMult * Math.sqrt(P);

  // Circadian Penalty: timing of shift (adverse windows)
  let CP = 0;
  if      (t0 >= 0  && t0 < 4)  CP = 18;
  else if (t0 >= 4  && t0 < 6)  CP = 14;
  else if (t0 >= 6  && t0 < 7)  CP = 8;
  else if (t0 >= 13 && t0 < 16) CP = 5;
  else if (t0 >= 20 && t0 < 24) CP = 10;
  if ((t0 + H) > 24 || (t0 < 6 && H > 6)) CP = Math.max(CP, 16);

  const addedFatigue = DL + CP;

  // ─── B. CONTEXT FATIGUE — conditions, not the shift ──────────
  // Sleep Pressure: homeostatic build-up from insufficient sleep
  const SLEEP_NEED = 8.0;
  const sleepDebt  = Math.max(0, SLEEP_NEED - So);
  const SP = sleepDebt <= 2
    ? sleepDebt * 4.5
    : 9.0 + (sleepDebt - 2) * 6.5;

  // Cumulative Load: consecutive days + carry-forward from prior shifts
  const residualCarry = F0 * 0.30;
  const streakPenalty = Sd <= 1 ? 0
    : Math.pow(Sd - 1, 1.3) * 2.0 * st.dutyMult;  // intensity amplifies streak
  const CL = residualCarry + streakPenalty;

  // Recovery Credit: sleep quality and rest days reduce total load
  const sleepBonus   = Math.min(Math.max(0, So - 6) * 2.5, 12);
  const restDayBonus = Dr === 0 ? 10 : Dr === 1 ? 5 : Dr === 2 ? 2 : 0;
  const RC = sleepBonus + restDayBonus;

  const contextFatigue = SP + CL - RC;

  // ─── C. PROJECTED TOTAL ───────────────────────────────────────
  const raw  = addedFatigue + contextFatigue;
  const floor = H <= 0 ? 0 : H >= 12 ? 42 : H >= 10 ? 32 : H >= 8 ? 20 : 12;
  const projectedFatigue = Math.min(Math.max(raw, floor, 0), 100);

  return {
    projectedFatigue,
    addedFatigue:    Math.round(addedFatigue),
    contextFatigue:  Math.round(contextFatigue),
    DL: Math.round(DL), DL_raw: Math.round(DL_raw),
    CP, SP: Math.round(SP), CL: Math.round(CL), RC: Math.round(RC),
    H, I, P, F0, So, t0, Sd, Dr, stk,
    shiftTypeLabel: st.label,
    dutyMult: st.dutyMult,
    recoveryMult: st.recoveryMult,
    rangeFactor: st.rangeFactor,
  };
}

/**
 * Scalar wrapper — used by Forecast/Optimiser loops that only need the number.
 */
function calcFatigue(totalHours, intensity, professionP, baselineFatigue,
                     sleepOpportunity, shiftStartHour, streakDays, daysSinceRest) {
  return calcFatigueV2(totalHours, intensity, professionP, baselineFatigue,
                       sleepOpportunity, shiftStartHour, streakDays, daysSinceRest)
         .projectedFatigue;
}

/**
 * BASELINE ESTIMATOR — fatigue score BEFORE today's shift.
 * No DutyLoad included. Only sleep pressure, streak, rest credit.
 */
function deriveFatigueFromProxy(sleepHours, streakDays, daysOffAgo) {
  const So = Math.min(Math.max(sleepHours || 7.5, 2), 12);
  const Sd = Math.max(streakDays || 1, 1);
  const Dr = Math.max(daysOffAgo || 1, 0);

  const sleepDebt     = Math.max(0, 8 - So);
  const SP            = sleepDebt <= 2 ? sleepDebt * 4.5 : 9.0 + (sleepDebt - 2) * 6.5;
  const streakPenalty = Sd <= 1 ? 0 : Math.pow(Sd - 1, 1.3) * 2.0;
  const sleepBonus    = Math.min(Math.max(0, So - 6) * 2.5, 12);
  const restDayBonus  = Dr === 0 ? 10 : Dr === 1 ? 5 : Dr === 2 ? 2 : 0;
  const RC            = sleepBonus + restDayBonus;

  const raw = SP + streakPenalty - RC + 8;
  return Math.min(Math.max(raw, 3), 65);
}

/**
 * EXPLANATION TRAIL — human-readable component breakdown.
 * Always uses calcFatigueV2 to guarantee consistency with displayed numbers.
 */
function explainFatigue(totalHours, intensity, professionP, baselineFatigue,
                        sleepOpportunity, shiftStartHour, streakDays, daysSinceRest) {
  const r = calcFatigueV2(totalHours, intensity, professionP, baselineFatigue,
                           sleepOpportunity, shiftStartHour, streakDays, daysSinceRest);
  const reasons = [];
  if (r.SP >= 5)  reasons.push(`Sleep pressure (+${r.SP} pts) — ${r.So.toFixed(1)}h rest before shift`);
  if (r.CP >= 5)  reasons.push(`Shift timing (+${r.CP} pts) — ${r.t0 < 7 ? 'early or night start' : r.t0 >= 20 ? 'evening into night' : 'post-lunch window'}`);
  reasons.push(`${r.shiftTypeLabel} shift ${fmtH(r.H)} — duty load +${r.DL} pts (${r.dutyMult}× type multiplier on raw ${r.DL_raw})`);
  if (r.CL >= 5)  reasons.push(`Cumulative load (+${r.CL} pts) — ${r.Sd > 1 ? r.Sd + ' consecutive days' : 'prior fatigue carry-forward'}`);
  if (r.RC >= 5)  reasons.push(`Recovery credit (−${r.RC} pts) — ${r.Dr === 0 ? 'rest day' : r.So >= 7 ? 'good sleep' : 'some recovery'}`);
  return { ...r, reasons };
}

// ═══════════════════════════════════════════════════════════════════
// DEBUG OUTPUT (internal audit — open browser console to read)
// ═══════════════════════════════════════════════════════════════════
let _lastDebug = null;
function buildDebugOutput(fatigueResult, pushRange, verdict, baselineIn) {
  _lastDebug = {
    '01_baselineFatigue':    Math.round(baselineIn),
    '02_shiftType':          fatigueResult.shiftTypeLabel,
    '03_dutyMultiplier':     fatigueResult.dutyMult + '  (Light=0.80 / Std=1.00 / Heavy=1.20)',
    '04_rangeFactor':        fatigueResult.rangeFactor + '  (Light=1.15 / Std=1.00 / Heavy=0.82)',
    '05_recoveryMult':       fatigueResult.recoveryMult + '  (Light=0.70 / Std=1.00 / Heavy=1.50)',
    '06_DL_raw':             fatigueResult.DL_raw + '  (Standard reference curve)',
    '07_DL_adjusted':        fatigueResult.DL   + '  (after dutyMult × √profession)',
    '08_circadianPenalty':   fatigueResult.CP,
    '09_addedFatigue':       fatigueResult.addedFatigue + '  (DL_adjusted + CP — shift cost)',
    '10_contextFatigue':     fatigueResult.contextFatigue + '  (SP + CL − RC — conditions)',
    '11_projectedFatigue':   Math.round(fatigueResult.projectedFatigue) + '  (addedFatigue + contextFatigue)',
    '12_reconciliation':     `${Math.round(baselineIn)} baseline + ${fatigueResult.addedFatigue} added + ${fatigueResult.contextFatigue} context = ${Math.round(fatigueResult.projectedFatigue)}`,
    '13_efficientRange':     `+${fmtH(pushRange.efficientMin)} – +${fmtH(pushRange.efficientMax)}`,
    '14_stretchMax':         `+${fmtH(pushRange.stretchMax)}`,
    '15_verdictLabel':       verdict.label,
    '16_verdictThreshold':   verdict._threshold || '(unlabelled path)',
    '17_verdictReason':      verdict.reason,
  };
  try {
    console.group('%cShiftScope Engine Audit', 'color:#38BDF8;font-weight:bold;');
    console.table(_lastDebug);
    console.groupEnd();
  } catch(e) { /* console.table not available in this environment */ }
  return _lastDebug;
}

// ═══════════════════════════════════════════════════════════════════
// RECOVERY-AWARE ENGINE
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute the dynamic efficient push range for today.
 * Returns { efficientMin, efficientMax, stretchMax }
 * All values are EXTRA hours above base day.
 *
 * Uses the new engine's component scores rather than a simple hours-only model.
 */
function computePushRange(base, I, P, currentFatigueBaseline, strategyMode) {
  const stratTolerance = STRATEGY[strategyMode]?.tolerance ?? 1.0;
  const So = profile.sleepHours || 7.5;
  const t0 = profile.shiftStartHour !== undefined ? profile.shiftStartHour : 7;
  const Sd = profile.streakDays || 1;
  const Dr = profile.daysOffAgo || 1;

  // Compute what the score would be at the end of a base-only shift
  const baseScore = calcFatigue(base, I, P, currentFatigueBaseline ?? 20,
                                So, t0, Sd, Dr);

  // Normalised fatigue entering the extra-hours decision (0–1)
  const fatigueLoad = baseScore / 100;

  // Circadian modifier: early/night starts reduce capacity for more hours
  let circadianFactor = 1.0;
  if      (t0 >= 0  && t0 < 4)  circadianFactor = 0.55;
  else if (t0 >= 4  && t0 < 6)  circadianFactor = 0.70;
  else if (t0 >= 6  && t0 < 7)  circadianFactor = 0.85;
  else if (t0 >= 20 && t0 < 24) circadianFactor = 0.80;

  // Sleep debt modifier
  const sleepDebt = Math.max(0, 8 - So);
  const sleepFactor = Math.max(0.4, 1.0 - sleepDebt * 0.10);

  // Shift-type range factor: Light expands headroom, Heavy compresses it.
  // Sourced from locked SHIFT_TYPE causal map — not duplicated here.
  const stk = getShiftTypeKey(I);
  const rangeFactor = SHIFT_TYPE[stk].rangeFactor;  // 1.15 / 1.00 / 0.82

  // Intensity modifier on available headroom (continuous fine-tuning)
  const intensityPenalty = (I - 0.8) * 0.7;

  // Efficient max: combination of fatigue state, circadian, sleep, strategy,
  // and shift-type range factor (the primary type-level control).
  const rawEfficientMax = Math.max(0.25,
    (4.0 - fatigueLoad * 3.5 - intensityPenalty * 2.0)
    * stratTolerance * circadianFactor * sleepFactor * rangeFactor
  );

  const efficientMin = Math.max(0.25, rawEfficientMax * 0.4);
  const efficientMax = rawEfficientMax;
  const stretchMax   = Math.max(efficientMax + 0.5, rawEfficientMax * 1.55);

  return {
    efficientMin: Math.round(efficientMin * 4) / 4,
    efficientMax: Math.round(efficientMax * 4) / 4,
    stretchMax:   Math.round(stretchMax   * 4) / 4,
  };
}

/**
 * Compute the recovery impact of today's total shift.
 * Returns { recoveryDebt (0-10), tomorrowCapacityLoss (%), cumulativeRisk }
 *
 * Debt is based on total hours beyond contracted, intensity, circadian timing,
 * and entering fatigue state — not hours alone.
 */
function computeRecoveryImpact(extraHours, totalHours, I, P, currentFatigueBaseline) {
  const contracted    = profile.contracted || 9.25;
  const hoursOverBase = Math.max(0, totalHours - contracted);
  const So            = profile.sleepHours || 7.5;
  const t0            = profile.shiftStartHour !== undefined ? profile.shiftStartHour : 7;
  const Sd            = profile.streakDays || 1;

  // Intensity: use locked SHIFT_TYPE.recoveryMult from causal map
  // (Light=0.70, Standard=1.00, Heavy=1.50 — defined once, referenced here)
  const intensityFactor = SHIFT_TYPE[getShiftTypeKey(I)].recoveryMult;

  // Circadian: night and early starts slow recovery (circadian misalignment)
  const circadianDebt = (t0 < 6 || t0 >= 20) ? 1.4 : 1.0;

  // Prior fatigue state
  const fatigueNorm = Math.min(1, (currentFatigueBaseline ?? 20) / 80);

  // Sleep opportunity affects recovery speed
  const sleepFactor = So >= 7 ? 1.0 : So >= 5 ? 1.25 : 1.5;

  // Recovery debt: 0–10 scale
  const recoveryDebt = Math.min(10,
    hoursOverBase * intensityFactor * circadianDebt * sleepFactor
    * (1 + fatigueNorm * 0.5) * 0.5
    + (Sd >= 5 ? 1.5 : Sd >= 3 ? 0.8 : 0)  // streak bonus
  );

  // Tomorrow capacity loss %
  const tomorrowCapacityLoss = Math.min(75,
    Math.round(recoveryDebt * 6.5 + (fatigueNorm > 0.6 ? 8 : 0))
  );

  // Cumulative 3–7 day strain
  const cumulativeRisk = recoveryDebt >= 7 ? 'High'
    : recoveryDebt >= 3.5 ? 'Medium'
    : 'Low';

  return {
    recoveryDebt: Math.round(recoveryDebt * 10) / 10,
    tomorrowCapacityLoss,
    cumulativeRisk,
  };
}

/**
 * Recovery-aware verdict: replaces simple ETP-based getVerdict.
 * Accounts for: fatigue band, ETP, push range position, recovery debt, strategy mode.
 */
function getVerdictV2(fatigue, etp, extraHours, pushRange, recoveryImpact, strategyMode, marginalNet) {
  const { efficientMin, efficientMax, stretchMax } = pushRange;
  const { recoveryDebt, tomorrowCapacityLoss, cumulativeRisk } = recoveryImpact;
  const strat = STRATEGY[strategyMode] || STRATEGY.balanced;
  const stratLabel = strat.label;

  // ── HARD GUARDRAILS (override everything) ──
  if (fatigue >= 86) {
    return {
      label: 'Recovery first', emoji: '⛔',
      summary: 'Strain is critical. More hours cost more than they return.',
      reason: 'At this fatigue level, additional hours increase risk without meaningful return. Rest before the next shift.',
      color: '#B91C1C',
      _threshold: 'projectedFatigue ≥ 86'
    };
  }
  if (fatigue >= 76) {
    return {
      label: 'Skip it', emoji: '❌',
      summary: 'Recovery cost outweighs the return.',
      reason: 'Fatigue is in the Red band. What this shift costs in recovery outweighs what it pays. Recovery debt carries into tomorrow.',
      color: '#EF4444',
      _threshold: 'projectedFatigue ≥ 76'
    };
  }

  // ── OVERREACH ZONE ──
  if (extraHours > stretchMax) {
    if (strategyMode === 'urgent_cash' && recoveryDebt < 7) {
      return {
        label: 'Caution — Overreach', emoji: '⚠️',
        summary: 'Past the stretch ceiling. The pay is there — recovery cost rises.',
        reason: `You are past your overreach threshold (+${fmtH(stretchMax)} extra). ${stratLabel} mode allows a stronger push, but tomorrow's capacity is meaningfully reduced. Use this as an exception, not a pattern.`,
        color: '#F97316',
        _threshold: 'extraHours > stretchMax, urgent_cash mode'
      };
    }
    return {
      label: 'Skip it', emoji: '❌',
      summary: 'Beyond your efficient range for today\'s conditions.',
      reason: `Recovery debt is high and tomorrow's capacity takes a ${tomorrowCapacityLoss}% hit. The strategic cost outweighs today's net return.`,
      color: '#EF4444',
      _threshold: 'extraHours > stretchMax'
    };
  }

  // ── STRETCH ZONE ──
  if (extraHours > efficientMax) {
    if (strategyMode === 'protect_energy') {
      return {
        label: 'Skip it', emoji: '❌',
        summary: 'Protect energy mode — stretch hours not advised today.',
        reason: 'A lighter push today preserves capacity for the rest of the week. The net difference does not justify the recovery cost in this mode.',
        color: '#EF4444',
        _threshold: 'extraHours > efficientMax, protect_energy mode'
      };
    }
    if (strategyMode === 'push_savings' || strategyMode === 'urgent_cash') {
      return {
        label: 'Controlled push', emoji: '⚠️',
        summary: 'In the stretch zone. Pay is there — recovery cost is building.',
        reason: `You are ${fmtH(extraHours - efficientMax)} past the efficient range. Recovery debt is building (${recoveryDebt}/10). Better as an occasional targeted push than a repeated daily habit.`,
        color: '#F59E0B',
        _threshold: 'extraHours > efficientMax, push_savings or urgent_cash mode'
      };
    }
    return {
      label: 'Borderline', emoji: '⚠️',
      summary: 'Past your efficient range. The trade-off is real.',
      reason: `You're ${fmtH(extraHours - efficientMax)} above today's efficient range. A steadier pattern of +${fmtH(efficientMin)}–${fmtH(efficientMax)} on workable days would likely return more across the week.`,
      color: '#F59E0B',
      _threshold: 'extraHours > efficientMax, balanced mode'
    };
  }

  // ── EFFICIENT ZONE ──
  if (extraHours >= efficientMin) {
    if (fatigue >= 56) {
      return {
        label: 'Worth doing — with care', emoji: '⚠️',
        summary: 'Within range. Fatigue is elevated going in.',
        reason: `Push range is appropriate for today, but you are carrying elevated fatigue (${Math.round(fatigue)}/100). Ensure adequate recovery tonight. Repeating at this level every day would compound strain across the week.`,
        color: '#F59E0B',
        _threshold: 'efficientMin ≤ extraHours ≤ efficientMax, fatigue ≥ 56'
      };
    }
    return {
      label: 'Good push', emoji: '✅',
      summary: 'Within range. Strong return for the fatigue cost.',
      reason: `The extra ${fmtH(extraHours)} sits within your efficient range (+${fmtH(efficientMin)}–${fmtH(efficientMax)}). Recovery cost is low. Sustainable at this level.`,
      color: '#22C55E',
      _threshold: 'efficientMin ≤ extraHours ≤ efficientMax, fatigue < 56'
    };
  }

  // ── BELOW EFFICIENT RANGE ──
  if (extraHours > 0 && extraHours < efficientMin) {
    return {
      label: 'Comfortable — room to extend', emoji: '✅',
      summary: 'Below the efficient range. More headroom available.',
      reason: `Your efficient range starts at +${fmtH(efficientMin)} extra today. You could extend to ${fmtH(efficientMax)} extra without significant recovery cost — worth considering if your goal supports it.`,
      color: '#6366f1',
      _threshold: '0 < extraHours < efficientMin'
    };
  }

  // ── NO EXTRA HOURS ──
  return {
    label: 'Base day only', emoji: '📋',
    summary: 'No extra hours. The efficient range is open if needed.',
    reason: `Your full efficient push range (+${fmtH(efficientMin)}–${fmtH(efficientMax)}) is available today if needed.`,
    color: '#64748b',
      _threshold: 'extraHours = 0'
  };
}

/**
 * Weekly strategy note — what today's decision means across the week.
 */
function getWeeklyStrategyNote(extraHours, pushRange, recoveryImpact, strategyMode, marginalNet, totalNet) {
  const { efficientMin, efficientMax, stretchMax } = pushRange;
  const { recoveryDebt, tomorrowCapacityLoss, cumulativeRisk } = recoveryImpact;
  const strat = STRATEGY[strategyMode] || STRATEGY.balanced;
  const goal  = profile.goal || {};

  const isOverreach = extraHours > stretchMax;
  const isStretch   = extraHours > efficientMax && !isOverreach;
  const isEfficient = extraHours >= efficientMin && extraHours <= efficientMax;

  let note = '';

  if (isOverreach) {
    note = `Past the efficient ceiling. Recovery debt carries forward. A steadier pattern of +${fmtH(efficientMin)}–${fmtH(efficientMax)} on workable days would likely return more across the week.`;
  } else if (isStretch) {
    note = `Stretch zone. A pattern of +${fmtH(efficientMin)}–${fmtH(efficientMax)} on workable days compounds better across the week than repeated stretch pushes.`;
  } else if (isEfficient) {
    note = `Within range. Repeating this 3–4 times builds income without significantly compressing the fatigue account.`;
  } else if (extraHours > 0) {
    note = `More efficient capacity available. Extending to +${fmtH(efficientMax)} extra would stay within your efficient range without meaningful recovery cost.`;
  }

  // Goal annotation
  if (goal.type === 'income' && goal.weeklyTarget && marginalNet > 0) {
    const weeklyProgress = goal.weeklyProgress || 0;
    const remaining      = goal.weeklyTarget - weeklyProgress;
    if (remaining > 0) {
      const shiftsNeeded = Math.ceil(remaining / totalNet);
      note += ` At today's projected total, you would need approximately ${shiftsNeeded} similar shifts to reach your £${goal.weeklyTarget} weekly target.`;
    } else {
      note += ` Your weekly target of £${goal.weeklyTarget} has been reached. Any further shifts this week are discretionary.`;
    }
  }

  // Cumululative warning
  if (cumulativeRisk === 'High') {
    note += ` ⚠ Cumulative strain risk is HIGH — this level sustained across several days will degrade your performance and safety margin.`;
  }

  // Append a cat10 next-step recommendation
  const _nextStep = getPhrase('cat10', true);
  if(_nextStep && note) note = note + ' ' + _nextStep;
  else if(_nextStep) note = _nextStep;
  return note || 'No strategic note for this combination.';
}

// ═══════════════════════════════════════════════════════════════════
