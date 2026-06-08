
// ═══════════════════════════════════════════════════════════════════
// SHIFTSCOPE PHRASE LIBRARY v1
// 200 phrases across 10 categories. Rotation is index-based,
// stored per category in localStorage under 'ss_phrase_idx'.
// Locked UI labels (Good push, Skip it, etc.) are NOT in this library.
// ═══════════════════════════════════════════════════════════════════

const PHRASES = {

  // CAT 1 — POSITIVE VERDICT support lines
  cat1: [
    "Within range. Solid return for today.",
    "Good push. Fatigue is manageable.",
    "The return holds up. Efficient range covered.",
    "Low recovery cost. Strong net return.",
    "The extra hours sit where they should today.",
    "Clean push. The numbers work.",
    "Effort-to-pay is strong today.",
    "Within today's efficient window.",
    "The read supports it. Good conditions.",
    "The pay, fatigue, and recovery all check out today.",
    "Good conditions today. The push range is open.",
    "Fatigue is low. The return on these hours is solid.",
    "The extra hours sit inside today's efficient range.",
    "Within range and the strain is low.",
    "Recovery debt is low. The return is proportionate.",
    "Strong effort-to-pay on these hours.",
    "The read is green. The extra hours return well today.",
    "Low recovery cost. Decent return for today's conditions.",
    "The return holds up. Efficient range covered.",
    "Solid push. The numbers work for today."
  ],

  // CAT 2 — BORDERLINE VERDICT support lines
  cat2: [
    "Stretch zone. The pay is real, so is the recovery cost.",
    "Past the efficient range. Tomorrow takes a hit.",
    "The trade-off is live.",
    "The return is there. So is the strain.",
    "Above the efficient ceiling. Not clean.",
    "Stretch territory. The full breakdown is worth a look.",
    "The pay justifies a one-off push. Not a pattern.",
    "Past the window. Factor in what tomorrow looks like.",
    "The numbers are close. This is the grey zone.",
    "Marginal today. The full breakdown is worth a look.",
    "The hours pay. The recovery cost is what tips this one.",
    "In the stretch zone. The pay is there. The recovery cost is building.",
    "Possible. The efficient range is behind you.",
    "Not the cleanest push today. Conditions have been better this week.",
    "Past the efficient ceiling. The net return starts to compress.",
    "Workable. Not comfortable.",
    "The return justifies a one-off push, not a repeat.",
    "It's a stretch today. Worth knowing what you're deciding.",
    "The trade-off is real. Both things are true today.",
    "Technically achievable. The recovery cost is real."
  ],

  // CAT 3 — RED / HIGH STRAIN VERDICT support lines
  cat3: [
    "Not today. Recovery cost outweighs the return.",
    "Red band. The efficient range is gone.",
    "The return doesn't cover the recovery cost.",
    "Too much load accumulated. The push range is closed.",
    "Fatigue is too high for these hours to return well.",
    "Past the ceiling. More hours cost more than they earn.",
    "Skip it. The numbers don't hold up today.",
    "The strain is outpacing the return.",
    "At this fatigue level, rest returns more than overtime.",
    "Five days in a row changes the calculation. The range is gone.",
    "What this shift costs in recovery outweighs what it pays.",
    "Different conditions from earlier in the week. The read reflects that.",
    "At this fatigue level, the return doesn't cover the recovery cost.",
    "Cumulative load this week has closed the efficient range.",
    "The efficient range closed earlier in the week. Today reflects that.",
    "Fatigue is too high. More hours at this level cost more than they return.",
    "Past the efficient ceiling. The return doesn't justify the cost.",
    "High fatigue, diminishing return.",
    "Recovery tonight returns more than these hours.",
    "The read is red. The decision is still yours."
  ],

  // CAT 4 — WEEKLY SUMMARY OPENERS
  cat4: [
    "Here's the week.",
    "The week in full.",
    "What the week cost and what it returned.",
    "The pattern is on record.",
    "End of the tracked week.",
    "The numbers from this week.",
    "The week ran its course. Here's the shape.",
    "What happened this week.",
    "The week is complete.",
    "Pay, fatigue, and pattern.",
    "The week is on record. Here's what it shows.",
    "Three things defined this week.",
    "The week ran within range. Here's the breakdown.",
    "Here's the honest summary.",
    "The week ran its course.",
    "Here's what the week actually delivered.",
    "The pattern for the week.",
    "The week is tracked. Here's what it shows.",
    "Pay, fatigue, and whether the pattern held.",
    "The read for this week."
  ],

  // CAT 5 — FATIGUE INTERPRETATION LINES
  cat5: [
    "Heavy shift — duty load runs higher than standard. Same hours, more strain.",
    "Night start adds a circadian penalty regardless of how much sleep you got.",
    "Cumulative load is the main driver today, not this shift in isolation.",
    "The fatigue estimate reflects timing, intensity, and the pattern — not just duration.",
    "Sleep debt is compressing recovery. Even a modest shift reads higher today.",
    "Fatigue is elevated but within the Amber band. Manageable with rest tonight.",
    "The circadian window makes night shifts more costly than identical day shifts.",
    "Accumulated load from the week is showing in today's estimate. That's expected.",
    "Recovery credit from last night's rest has been applied. The baseline is lower.",
    "Duty load on a heavy shift runs 20% higher than standard.",
    "The fatigue estimate tracks the pattern across the week, not just today.",
    "Three consecutive days is where the compounding starts.",
    "Short sleep before a night shift is the highest-cost combination in the model.",
    "The strain is within the Green band. No compression on today's push range.",
    "Projected fatigue is the estimate after the full shift — not a current reading.",
    "Fatigue in the Amber band means the efficient range is tighter than a fresh baseline.",
    "The model weights shift start time because the circadian penalty is consistent.",
    "Recovery debt from a Red-band shift carries into the next 24 to 48 hours.",
    "A rest day after a high-strain run resets the baseline faster than lighter shifts.",
    "The fatigue figure is a planning estimate, not a medical reading."
  ],

  // CAT 6 — GOAL PROGRESS LINES
  cat6: [
    "Target reached. Any further shifts this week are discretionary.",
    "On track. Current pace reaches the target.",
    "Past the target. Anything additional this week is a surplus.",
    "The target is within one shift's reach.",
    "This shift contributes toward the weekly total. The gap is closing.",
    "Current pace is consistent with hitting the target.",
    "Goal hit. The week outperformed the target.",
    "The target pressure is real this week. This shift closes a meaningful share of it.",
    "One shift behind pace. Recoverable without overreaching the fatigue ceiling.",
    "Past target. The efficient range is still open if there's more to take.",
    "The target gap is within reach at current conditions.",
    "Two more shifts at this rate closes the gap before the week ends.",
    "The target is achievable without exceeding the Amber band.",
    "Weekly target reached. The rest of the week is on your terms.",
    "Closing in on the target. The conditions today are workable.",
    "At this rate, the monthly target closes on schedule.",
    "Goal is set. Progress updates as you save shifts.",
    "The target is within range. No overreach required to reach it.",
    "The weekly gap is closing at the right pace.",
    "On target and within the efficient band. Both at the same time."
  ],

  // CAT 7 — PAYDAY REFLECTION LINES
  cat7: [
    "The payslip covers gross. This is what you actually cleared.",
    "Tax drag this period compressed the take-home from the gross figure.",
    "The best-return shift was the one where ETP and conditions aligned.",
    "Peak fatigue this week reflects the cumulative cost of the pattern.",
    "The most efficient push of the week was the one with the lowest strain-to-pay ratio.",
    "The shift pattern this week was consistent with the weekly label.",
    "Gross looked better than take-home on some of this week's shifts. That's the tax effect.",
    "The highest-earning shift and the highest-cost shift were sometimes the same day.",
    "Rest days had a measurable effect on the push range for mid-week shifts.",
    "The week delivered at a consistent effort-to-pay level.",
    "The fatigue cost of this week will show in next week's baseline.",
    "The overtime rate made a measurable difference on shifts that crossed the threshold.",
    "The pattern this week was more efficient than the prior run.",
    "The week closed with the pattern label it earned.",
    "Next week opens based on how this week finished.",
    "Pay, fatigue, and pattern all tracked consistently this week.",
    "The ETP average reflects how efficiently effort converted into net pay.",
    "Gross and net diverged this week. The real take-home is lower.",
    "The week is complete. The week is on record.",
    "The pattern held within range this week."
  ],

  // CAT 8 — FORECAST ASSESSMENT LINES
  cat8: [
    "At this pattern, peak fatigue is projected to reach the Amber band mid-week.",
    "The forecast shows the week is sustainable if rest days hold.",
    "Adjusting the rest day shifts peak fatigue down meaningfully.",
    "This pattern generates stable week load at the current intensity.",
    "Five consecutive days at this intensity is the ceiling. The model reflects that.",
    "A lighter day mid-week extends the efficient window for the back half.",
    "The forecast hits the target without exceeding the Amber band. The pattern is viable.",
    "At heavy intensity, four days is the sustainable ceiling in this configuration.",
    "One rest day fewer costs recovery capacity across the second half of the week.",
    "The net for this configuration is within range. The fatigue cost matches it.",
    "The model projects peak fatigue inside the manageable band. The pattern works.",
    "This configuration works. It returns a fair net and keeps the week inside the Amber band.",
    "The week becomes overloaded past day four. A rest day before that prevents it.",
    "Adding a night shift changes the fatigue curve for the full week. The forecast shows it.",
    "One heavy shift shifts the whole week's fatigue projection. Adjust the rest day accordingly.",
    "The pattern modelled is viable. Strain stays proportionate to the return.",
    "This is a workable week. The fatigue peak lands within the manageable ceiling.",
    "The forecast is based on the intensity and timing settings chosen. Adjust either to see the effect.",
    "The projected ETP for this pattern is in the fair-to-strong range.",
    "The week holds together at these settings. Rest days are the variable that matters most."
  ],

  // CAT 9 — SHARE CARD SUMMARY LINES
  cat9: [
    "The week in plain numbers.",
    "Pay earned. Fatigue spent. Whether it was worth it.",
    "The pattern held.",
    "The pattern stretched.",
    "The pattern overloaded.",
    "Earned the target this week.",
    "The week ran efficiently.",
    "The week cost more than the week returned in net pay.",
    "The efficient range stayed open throughout. Good position all week.",
    "Fatigue stayed inside the manageable band all week.",
    "The week closed at Amber. A rest day resets it.",
    "The week closed in the Red band. Next week opens in deficit.",
    "The week closed in the Green band. Next week opens fresh.",
    "ETP held up across all shifts.",
    "One shift had a weak effort-to-pay. The rest of the week was solid.",
    "Consistent pattern this week. No outlier shifts.",
    "One heavy shift changed the shape of the whole week.",
    "Rest days did the job. The efficient range stayed open.",
    "The week tracked close to the forecast.",
    "The read is on record. [ShiftScope]"
  ],

  // CAT 10 — NEXT STEP RECOMMENDATION LINES
  cat10: [
    "Run a QuickCheck before the next offer comes in.",
    "A rest day keeps the range open for the back half of the week.",
    "Fatigue is low. Good position if an offer comes in.",
    "Save this shift. It sharpens next week's read.",
    "The target gap is within reach without overreaching.",
    "The week is at its ceiling. Rest before the next push.",
    "No action needed. The range is open.",
    "Check the push range before accepting anything heavy.",
    "The baseline resets after tonight. Check the read tomorrow.",
    "Next week opens fresh from here.",
    "The goal gap is achievable without exceeding the Amber band this week.",
    "The pattern is sustainable. Keep the rest days in place.",
    "One more shift at today's rate closes the gap.",
    "The read is ready when the next offer comes in.",
    "Save this shift to sharpen next week's read.",
    "Goal is set. Progress updates as you save shifts.",
    "The range is open if an offer comes in.",
    "The efficient range widens after a rest day.",
    "Check the read again before accepting the next shift.",
    "Next week opens with a solid baseline."
  ]

};

// ═══════════════════════════════════════════════════════════════════
// VERDICT LANGUAGE LIBRARY — bounded variation system
// Engine outputs: band, etp, fatigue level, range position
// Language layer renders copy. Engine never changes.
// ═══════════════════════════════════════════════════════════════════

const VERDICT_LANG = {

  // ── GREEN: Good push ──────────────────────────────────────────
  green: {
    headlines: [
      "Good push",
      "Within range",
      "Clean read",
      "Works today",
      "Solid push",
      "The range holds",
      "Clear window",
      "In the zone",
      "Strong conditions",
      "The numbers work",
      "Good conditions",
      "Efficient push",
      "Runs well today",
      "Range covered",
      "Favourable read",
      "The push lands",
      "Window is open",
      "Solid position",
      "Well within range",
      "Returns well today",
    ],
    summaries_standard: [
      "Within today's efficient range. The return is solid for the fatigue cost.",
      "The extra hours sit inside today's window. Pay and strain are proportionate.",
      "Efficient range covered. Low recovery cost at today's baseline.",
      "The numbers line up. Good conditions for an extra push.",
      "Inside range. The return justifies the fatigue cost today.",
      "Fatigue is manageable. The net return holds up well.",
      "Clean push today. Efficient range, low recovery debt.",
      "The window is open. These hours return well at today's conditions.",
      "Effort-to-pay is strong. The push sits where it should.",
      "Well within today's efficient range. Recovery cost is low.",
    ],
    summaries_strong_etp: [
      "Strong effort-to-pay on these hours. The range holds.",
      "Efficient hours, solid return. The pay justifies the strain.",
      "High efficiency today. The extra hours convert well.",
      "Strong return per fatigue point. Good push for today's conditions.",
      "ETP is strong. The pattern holds up for another push.",
    ],
    summaries_elevated_fatigue: [
      "Within range — fatigue is elevated going in. Worth doing with care.",
      "The window is there but fatigue is higher than ideal. Manageable.",
      "Inside range. Fatigue is carrying from earlier in the week — factor that in.",
      "These hours work today. Fatigue is building but the return covers it.",
      "Within the efficient window. Recovery tonight matters more than usual.",
    ],
    actions: [
      "The read supports it.",
      "The numbers back this one.",
      "A legitimate push for today.",
      "The conditions are right.",
      "Strong enough to take it.",
      "Worth taking at these conditions.",
      "The window is open — use it.",
      "Conditions favour this push.",
    ],
  },

  // ── AMBER: Borderline / Controlled push ──────────────────────
  amber: {
    headlines: [
      "Borderline",
      "Stretch zone",
      "Worth a look",
      "Past the window",
      "Close call",
      "The trade-off is live",
      "In the stretch",
      "Marginal read",
      "On the edge",
      "Possible — with cost",
      "Above the ceiling",
      "Workable, not clean",
      "Recovery cost rising",
      "Stretch territory",
      "The gap is closing",
      "Just past range",
      "Controlled push",
      "Runs at a cost",
      "Viable — just",
      "The return is there",
    ],
    summaries_standard: [
      "Past the efficient range. The pay is there — recovery cost is rising.",
      "In the stretch zone. The money is real. So is the strain.",
      "Above the efficient ceiling. Worth knowing before you answer.",
      "The trade-off is live. Both the return and the cost are genuine today.",
      "Just past the window. Tomorrow's capacity takes a measurable hit.",
      "Marginal conditions. The return is positive but the strain is climbing.",
      "Recovery cost is outpacing the efficient range. One-off territory.",
      "Stretch zone. The pay holds up — the recovery debt is the variable.",
      "Past efficient range by a margin. Whether it's worth it depends on tomorrow.",
      "The return justifies a push but not a pattern. Use this carefully.",
    ],
    summaries_savings_mode: [
      "In the stretch zone — justifiable in savings mode. Use it once.",
      "Past the window. In savings mode the return covers the push.",
      "Stretch territory. For a savings-driven week, the return covers the cost.",
      "Recovery cost is real, but savings mode makes this defensible today.",
      "Above efficient range. Savings pressure makes this a considered call.",
    ],
    summaries_protect_mode: [
      "In stretch territory. Protection mode suggests pulling back.",
      "Past the efficient ceiling. Protect-energy mode flags this as too costly.",
      "The range is behind you. In protection mode, this is not the right push.",
      "Stretch zone — the recovery cost contradicts a protect-energy approach.",
      "Above range. Today's conditions and protection mode don't align.",
    ],
    actions: [
      "The decision is yours.",
      "The full breakdown is worth a look.",
      "Run the full review before committing.",
      "Factor in tomorrow before you answer.",
      "One-off territory — not a pattern.",
      "The trade-off is yours to weigh.",
      "The numbers are close. Read the full breakdown.",
      "Check what tomorrow looks like first.",
    ],
  },

  // ── RED: Skip it ──────────────────────────────────────────────
  red: {
    headlines: [
      "Skip it",
      "Not today",
      "Past the ceiling",
      "Recovery first",
      "Not worth it today",
      "The range is gone",
      "High cost, low return",
      "Fatigue too high",
      "Overreach today",
      "The numbers don't hold",
      "Recovery cost wins",
      "Too much today",
      "Let this one go",
      "The strain dominates",
      "Counterproductive today",
      "The push doesn't land",
      "Load too high",
      "Cost outweighs return",
      "Pattern ceiling hit",
      "Not the right push",
    ],
    summaries_standard: [
      "Recovery cost outweighs the return. The strain account is running high.",
      "At this fatigue level, the return doesn't cover the recovery cost.",
      "Past the efficient ceiling. More hours cost more than they earn today.",
      "The numbers don't hold up at this load. Recovery is the priority.",
      "The return looks reasonable. The recovery cost is the problem today.",
      "Fatigue is too high for these hours to return well.",
      "Cumulative load has closed the efficient range. The push doesn't land.",
      "High strain, diminishing return. This is what the engine is built to catch.",
      "The pay is there. The recovery cost is higher. That's the honest read.",
      "Past the window. What tomorrow costs is more than today's net returns.",
    ],
    summaries_critical: [
      "Strain is critical. More hours at this level cost more than they return.",
      "Fatigue is in the danger range. Rest returns more than any overtime today.",
      "At this load, additional hours are counterproductive. Full stop.",
      "Critical fatigue. The next productive push follows a rest day.",
      "Recovery first. The engine is clear on this one.",
    ],
    summaries_streak: [
      "Fifth consecutive day. The efficient range has closed. Rest resets it.",
      "Four or more days in a row changes the calculation. The push range is gone.",
      "The streak is the main driver, not today's hours in isolation.",
      "Consecutive load has compressed the range. Today's cost carries into tomorrow.",
      "Pattern ceiling reached. The next efficient push comes after a rest day.",
    ],
    actions: [
      "Rest resets the range.",
      "The next push lands better after a rest day.",
      "Tomorrow's position improves with rest tonight.",
      "A rest day is the productive move here.",
      "The efficient range opens again after rest.",
      "The read is clear. Let this one go.",
      "Recovery is the strategic call today.",
      "The numbers say no. That's the honest read.",
    ],
  },

  // ── INDIGO: Below range (Comfortable — room to extend) ───────
  indigo: {
    headlines: [
      "Room to extend",
      "Comfortable today",
      "Below your range",
      "Headroom available",
      "Easy push available",
      "More efficient hours available",
      "Light day — window is open",
      "The range is there",
      "Under the efficient floor",
      "Clean baseline today",
    ],
    summaries_standard: [
      "Below your efficient range. More headroom available if the hours are there.",
      "You're under the efficient floor today. The window is open for more.",
      "Comfortable position. The efficient range extends well beyond today's hours.",
      "Light load so far. The efficient range is open if an offer comes in.",
      "Below the efficient ceiling — room to push further today if needed.",
    ],
    actions: [
      "The range is open.",
      "More headroom available today.",
      "The window is there if you need it.",
      "Good position to extend if an offer comes in.",
      "The efficient range is well clear of today's hours.",
    ],
  },

  // ── NEUTRAL: Base day only ────────────────────────────────────
  neutral: {
    headlines: [
      "Base day only",
      "No extra hours",
      "Standard day",
      "The baseline",
      "Just the base",
    ],
    summaries_standard: [
      "No extra hours entered. The efficient range is open if needed.",
      "Standard day logged. The push window is available if an offer comes in.",
      "Base shift only. No extra hours to evaluate.",
      "No extra hours. The efficient range is clear for the day.",
    ],
    actions: [
      "Add extra hours to get a read.",
      "The window is open — enter extra hours to see the verdict.",
      "Efficient range shown above for reference.",
    ],
  },
};


// ── COPILOT EXPAND/COLLAPSE ────────────────────────────────────────
function toggleCopilot(btn){
  const msg = btn.previousElementSibling;
  if(!msg) return;
  const expanded = msg.classList.toggle('expanded');
  btn.textContent = expanded ? 'Show less' : 'Read more';
}

function copilotCheckOverflow(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  const wrap = el.parentElement;
  if(!wrap) return;
  const btn = wrap.querySelector('.copilot-expand-btn');
  if(!btn) return;
  // Show button only if text actually overflows the 3-line cap
  const lineH = parseFloat(getComputedStyle(el).lineHeight) || 22;
  const cap = lineH * 3 * 1.1; // slight tolerance
  if(el.scrollHeight > cap){
    btn.style.display = 'block';
    btn.textContent = 'Read more';
    el.classList.remove('expanded');
  } else {
    btn.style.display = 'none';
  }
}

// ── VERDICT LANGUAGE RENDERER ────────────────────────────────────
// Persistent rotation system — state survives reloads via localStorage.
// Each pool (headline / summary / action) rotates independently.
// Anti-repeat: same-band call always advances to a different variant.
// Anti-combo-repeat: tracks last full combination hash to avoid
//   identical headline+summary pairs on back-to-back checks.

const VL_STORAGE_KEY = 'ss_vl_idx';

function _vlLoadState() {
  try {
    const raw = localStorage.getItem(VL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
}
function _vlSaveState(state) {
  try { localStorage.setItem(VL_STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}

// Pick next variant from arr, advancing past the last-used index.
// Advances by a step of 1 but skips if that would repeat lastCombo.
function _pickVariant(arr, key, state, lastCombo) {
  if (!arr || arr.length === 0) return { text: '', idx: 0 };
  const last = (state[key] !== undefined) ? state[key] : -1;
  // Advance one step
  let idx = (last + 1) % arr.length;
  // If this would create the same combo as last time, advance one more
  if (lastCombo && arr.length > 1) {
    const candidate = arr[idx];
    if (lastCombo.includes(candidate)) {
      idx = (idx + 1) % arr.length;
    }
  }
  state[key] = idx;
  return { text: arr[idx], idx };
}

function getVerdictCopy(band, context) {
  const ctx = context || {};
  const etp = ctx.etp || 0;
  const fatigue = ctx.fatigue || 0;
  const strategy = ctx.strategyMode || 'balanced';
  const isStreak = ctx.isStreak || false;
  const isCritical = ctx.isCritical || false;

  const lib = VERDICT_LANG[band];
  if (!lib) return { headline: 'Check complete', summary: '', action: '' };

  // Load persistent state and last combo
  const state = _vlLoadState();
  const lastComboKey = 'last_combo_' + band;
  const lastCombo = state[lastComboKey] || '';

  // Select headline
  const headlineResult = _pickVariant(lib.headlines, band + '_h', state, lastCombo);

  // Select summary pool based on context
  let summaryPool = lib.summaries_standard || [];
  let summaryPoolKey = band + '_s';
  if (band === 'green') {
    if (etp >= 7 && lib.summaries_strong_etp) {
      summaryPool = lib.summaries_strong_etp;
      summaryPoolKey = band + '_s_strong';
    } else if (fatigue >= 55 && lib.summaries_elevated_fatigue) {
      summaryPool = lib.summaries_elevated_fatigue;
      summaryPoolKey = band + '_s_elev';
    }
  } else if (band === 'amber') {
    if ((strategy === 'push_savings' || strategy === 'urgent_cash') && lib.summaries_savings_mode) {
      summaryPool = lib.summaries_savings_mode;
      summaryPoolKey = band + '_s_save';
    } else if (strategy === 'protect_energy' && lib.summaries_protect_mode) {
      summaryPool = lib.summaries_protect_mode;
      summaryPoolKey = band + '_s_prot';
    }
  } else if (band === 'red') {
    if (isCritical && lib.summaries_critical) {
      summaryPool = lib.summaries_critical;
      summaryPoolKey = band + '_s_crit';
    } else if (isStreak && lib.summaries_streak) {
      summaryPool = lib.summaries_streak;
      summaryPoolKey = band + '_s_str';
    }
  }

  const summaryResult = _pickVariant(summaryPool, summaryPoolKey, state, lastCombo);

  // Select action — rotates independently of headline/summary
  const actionResult = _pickVariant(lib.actions || [], band + '_a', state, lastCombo);

  // Store the new combo hash to prevent exact repeat next call
  state[lastComboKey] = headlineResult.text + '||' + summaryResult.text;

  // Persist updated indices
  _vlSaveState(state);

  return {
    headline: headlineResult.text,
    summary: summaryResult.text,
    action: actionResult.text
  };
}

// Expose for debugging in dev
function vlDebugState() {
  const s = _vlLoadState();
  console.log('VL state:', JSON.stringify(s, null, 2));
  return s;
}

// Maps engine verdict label to band key
function verdictLabelToBand(label) {
  if (!label) return 'neutral';
  const l = label.toLowerCase();
  if (l.includes('good push') || l.includes('worth doing') || l.includes('comfortable')) return 'green';
  if (l.includes('borderline') || l.includes('controlled') || l.includes('caution')) return 'amber';
  if (l.includes('skip') || l.includes('recovery first')) return 'red';
  if (l.includes('room') || l.includes('below')) return 'indigo';
  if (l.includes('base day')) return 'neutral';
  return 'neutral';
}


// ── ROTATION ENGINE ───────────────────────────────────────────────
function getPhraseIdx(cat) {
  try {
    const raw = localStorage.getItem('ss_phrase_idx');
    const idx = raw ? JSON.parse(raw) : {};
    return idx[cat] || 0;
  } catch(e) { return 0; }
}
function advancePhraseIdx(cat, total) {
  try {
    const raw = localStorage.getItem('ss_phrase_idx');
    const idx = raw ? JSON.parse(raw) : {};
    idx[cat] = ((idx[cat] || 0) + 3) % total;
    localStorage.setItem('ss_phrase_idx', JSON.stringify(idx));
  } catch(e) {}
}
function getPhrase(cat, advance=false) {
  const arr = PHRASES[cat];
  if(!arr || arr.length === 0) return '';
  const i = getPhraseIdx(cat) % arr.length;
  if(advance) advancePhraseIdx(cat, arr.length);
  return arr[i];
}
function getPhraseByOffset(cat, offset) {
  const arr = PHRASES[cat];
  if(!arr || arr.length === 0) return '';
  return arr[Math.abs(offset) % arr.length];
}

// ═══════════════════════════════════════════════════════════════════
// TAX ENGINE
// ═══════════════════════════════════════════════════════════════════
function calcTax(annualGross, region) {
  const PA = 12570;
  const BRT = 50270;
  const HRT = 125140;
  const effectivePA = annualGross > 100000 ? Math.max(0, PA - (annualGross - 100000) / 2) : PA;
  const taxable = Math.max(0, annualGross - effectivePA);
  let tax = 0;
  if (region === 'scotland') {
    const bands = [[13991,0.19],[13991,0.20],[31092,0.21],[62430,0.42],[Infinity,0.47]];
    let rem = taxable;
    for (const [w, r] of bands) { const s = Math.min(rem, w); tax += s * r; rem -= s; if (rem <= 0) break; }
  } else {
    const basic = Math.min(Math.max(0, taxable), BRT - effectivePA);
    const higher = Math.min(Math.max(0, taxable - (BRT - effectivePA)), HRT - BRT);
    const add = Math.max(0, taxable - (HRT - effectivePA));
    tax = basic * 0.20 + higher * 0.40 + add * 0.45;
  }
  const NI_PT=12570,NI_UEL=50270;
  let ni=0;
  if(annualGross>NI_PT) ni=(Math.min(annualGross,NI_UEL)-NI_PT)*0.12+Math.max(0,annualGross-NI_UEL)*0.02;
  return{annualTax:tax,annualNI:ni};
}

function calcNetPay(grossShift, region) {
  const daysPerWeek=Math.max(1,fcPattern.filter(Boolean).length);
  const shiftsPerYear=daysPerWeek*52;
  const ann=grossShift*shiftsPerYear;
  const{annualTax,annualNI}=calcTax(ann,region);
  const net=grossShift-annualTax/shiftsPerYear-annualNI/shiftsPerYear;
  return{net:Math.max(0,net),deductions:annualTax/shiftsPerYear+annualNI/shiftsPerYear};
}

// ═══════════════════════════════════════════════════════════════════
// BAND + ETP HELPERS (unchanged)
// ═══════════════════════════════════════════════════════════════════
const BANDS=[
  {max:25, name:'Green',      meaning:'Good to go — sustainable pace',        color:'#22C55E'},
  {max:35, name:'Light Green',meaning:'Manageable — monitor as week builds',  color:'#86EFAC'},
  {max:45, name:'Yellow',     meaning:'Fatiguing — plan recovery tonight',    color:'#FDE68A'},
  {max:55, name:'Amber',      meaning:'Heavy load — limit OT, rest well',     color:'#F59E0B'},
  {max:65, name:'Orange',     meaning:'High strain — no additional shifts',   color:'#F97316'},
  {max:75, name:'Red',        meaning:'Near limit — mandatory rest required', color:'#EF4444'},
  {max:85, name:'Dark Red',   meaning:'Dangerous fatigue — do not drive',     color:'#DC2626'},
  {max:100,name:'Black',      meaning:'Critical — stop work immediately',     color:'#374151'},
];
function getBand(s){return BANDS.find(b=>s<=b.max)||BANDS[BANDS.length-1];}

function getETPLabel(etp,fatigue,totalH){
  const patternDays=Math.max(1,fcPattern.filter(Boolean).length);
  const estWeeklyH=totalH*patternDays;
  if(fatigue>=76) return{label:'UNSUSTAINABLE',cls:'etp-low',note:'Fatigue is in the critical zone.'};
  if(estWeeklyH>60) return{label:'OVERLOAD RISK',cls:'etp-low',note:'Estimated weekly hours exceed 60. WTR opt-out required above 48h.'};
  if(fatigue>=66) return{label:'HIGH STRAIN',cls:'etp-low',note:'Fatigue cost is high relative to pay.'};
  if(etp>=6.5&&fatigue<45) return{label:'EXCELLENT',cls:'etp-high',note:'Strong net return per fatigue point.'};
  if(etp>=5.0&&fatigue<55) return{label:'GOOD VALUE',cls:'etp-high',note:'Good balance of pay and fatigue cost.'};
  if(etp>=3.5&&fatigue<60) return{label:'FAIR VALUE',cls:'etp-fair',note:'Reasonable return — monitor pattern.'};
  if(etp>=2.0) return{label:'WEAK RETURN',cls:'etp-fair',note:'Pay return relative to fatigue cost is below average.'};
  return{label:'POOR VALUE',cls:'etp-low',note:'This shift costs significantly more in fatigue than it returns in net pay.'};
}

function getCopilot(fatigue, etp, So, gross, net, isNightShift, fatigueTrace) {
  const taxPct = gross > 0 ? (gross-net)/gross*100 : 0;
  const taxDrag = gross > 0 ? (gross - net).toFixed(0) : 0;
  const goal   = profile.goal || {};
  const trace  = fatigueTrace || { reasons: [] };
  const topReason = trace.reasons && trace.reasons.length > 0 ? trace.reasons[0] : null;
  const etpQual = etp>=7?'strong':etp>=5?'fair':etp>=3?'weak':'poor';

  // Critical and high fatigue — state the mechanism, not the worry
  if(fatigue>=86) return `Fatigue is in the critical range. At this level, more hours increase strain without meaningful return. Rest before the next shift.`;
  if(fatigue>=76) {
    let msg = `Fatigue is high. Recovery debt carries into the next shift.`;
    if(topReason) msg += ` Main driver: ${topReason}.`;
    return msg;
  }
  if(fatigue>=66) {
    let msg = `Fatigue is elevated. A full rest before the next heavy shift reduces cumulative load.`;
    if(topReason) msg += ` Main driver: ${topReason}.`;
    return msg;
  }

  // Goal-specific reads
  if(goal.type==='fatigue'){
    const ceil=goal.ceiling||45;
    if(fatigue>ceil) return `This shift puts fatigue above your chosen ceiling of ${Math.round(ceil)}. The fatigue account is in deficit against your target.`;
    if(fatigue>ceil*0.85) return `Approaching your fatigue ceiling. One more shift at this level reaches your limit.`;
  }
  if(goal.type==='balance'){
    if(etp>=6.5) return `Effort-to-pay is ${etp.toFixed(1)} — ${etpQual} return. Strain and income are tracking well together this shift.`;
    if(etp<4.0) return `Effort-to-pay is ${etp.toFixed(1)} — ${etpQual}. Fatigue is outpacing the financial return on these hours.`;
  }

  // Tax drag surface
  if(taxPct>38 && gross>0) return `Tax drag on this shift is £${taxDrag}. The gross figure is ${Math.round(taxPct)}% higher than what clears into your pay. After-tax return: £${net.toFixed(0)}.`;

  // ETP + fatigue band combinations
  if(fatigue>=56) {
    let msg = etp<4
      ? `Fatigue is elevated and effort-to-pay is ${etpQual} at ${etp.toFixed(1)}. The fatigue account is outpacing the financial return on these hours.`
      : `Fatigue is elevated. Effort-to-pay is ${etpQual} at ${etp.toFixed(1)} — the financial return is there, but recovery cost is building.`;
    if(topReason) msg += ` Main driver: ${topReason}.`;
    return msg;
  }
  if(fatigue>=46) {
    let msg = `Load is building. Manageable today — compounds without rest days.`;
    if(topReason) msg += ` ${topReason}.`;
    return msg;
  }

  // Sleep debt surface
  if(So<6) return `Rest before this shift was short. Under 6 hours of sleep increases fatigue sensitivity even when the strain estimate looks manageable.`;

  // Low fatigue, good ETP — confirm it cleanly
  // Append a cat5 fatigue interpretation line based on fatigue level
  const _f5offset = Math.round(fatigue);
  const _fatPhrase = getPhraseByOffset('cat5', _f5offset);

  if(fatigue<36 && etp>=6) return `Fatigue is low and effort-to-pay is ${etpQual}. The pay, fatigue, and recovery all check out today. ${_fatPhrase}`;

  return `Fatigue is in the manageable range. Effort-to-pay: ${etp.toFixed(1)} — ${etpQual}. ${_fatPhrase}`;
}

// ═══════════════════════════════════════════════════════════════════
// FORMAT HELPERS
// ═══════════════════════════════════════════════════════════════════
function fmt(n){return'£'+n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function fmtRate(n){if(n%1===0)return'£'+n.toFixed(0);if((n*10)%1===0)return'£'+n.toFixed(1);return'£'+n.toFixed(2);}
function fmtH(h){const wh=Math.floor(h),wm=Math.round((h%1)*60);return wm===0?`${wh}h`:`${wh}h ${wm}m`;}

// ═══════════════════════════════════════════════════════════════════
