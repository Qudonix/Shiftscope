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
// BAND + ETP HELPERS
// NOTE: BANDS, getBand defined in shiftscope-verdict.js (loads first)
// ═══════════════════════════════════════════════════════════════════

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

// NOTE: fmt, fmtRate, fmtH defined in shiftscope-verdict.js (loads first)
// ═══════════════════════════════════════════════════════════════════
