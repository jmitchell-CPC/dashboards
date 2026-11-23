const fmt$ = (n, compact) => {
  if (n === null || n === undefined) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (compact) {
    if (abs >= 1000000) return sign + "$" + (abs/1000000).toFixed(1) + "M";
    if (abs >= 1000) return sign + "$" + (abs/1000).toFixed(0) + "K";
    return sign + "$" + abs.toFixed(0);
  }
  return sign + "$" + abs.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0});
};
const fmtPct = n => (n===null||n===undefined) ? "—" : (n>0?"+":"") + n.toFixed(1) + "%";

const tooltip = document.getElementById("tooltip");
function showTip(evt, html){
  tooltip.innerHTML = html;
  tooltip.classList.add("show");
  positionTip(evt);
}
function positionTip(evt){
  const pad = 14;
  let x = evt.pageX + pad, y = evt.pageY + pad;
  tooltip.style.left = x + "px";
  tooltip.style.top = y + "px";
}
function hideTip(){ tooltip.classList.remove("show"); }


/* ---------------- constants taken directly from the October 2026 package ---------------- */
// Balance sheet at Oct 31, 2026 vs. Dec 31, 2025 (BS 10.26, "PP" comparative column)
const BS_OCT = {cash:407793.42, cashDec:121685.05, ap:97317.90, apDec:128797.77, sba:350000, equity:26088.11, ytdNI:158685.75, leasehold:124506.20, leaseholdDec:56513, barInv:18279.57, barInvDec:11208.36, accumDep:-523.99, fixedAssets:133318.05, sep:{cash:371716.67, equity:-3649.44, ytdNI:128948.20}};
// Net income for Jan–May as restated in the later monthly packages (Jan: Mar pkg, Feb: Apr pkg, Mar: May pkg, Apr: Jun pkg, May: Jul pkg)
const RESTATED_JAN_MAY = {Jan:-16299.34, Feb:-6320.84, Mar:11977.17, Apr:-2387.17, May:41484.49};
// Aug–Oct totals (2026 package vs. 2025 package), used for the profit-opportunity sizing
const AO = {"rev26": 710690.91, "rev25": 534713.63, "ni26": 89262.65, "ni25": 28035.31, "cc26": 23166.1, "cc25": 16864.95, "disc26": 18661.61, "disc25": 14989.76, "cogs26": 182188.74, "cogs25": 131642.96, "pay26": 225421.2, "pay25": 205175.43, "bookkeeping26": 11100.0, "interest26": 7272.88, "cat": {"Liquor": {"sales": 127044.0, "buy": 11118.43}, "N/A beverages": {"sales": 23930.5, "buy": 3342.29}, "Beer": {"sales": 47426.25, "buy": 14938.55}, "Wine": {"sales": 45071.0, "buy": 14250.36}, "Food": {"sales": 485830.77, "buy": 138539.11}}};
// September net income vs. budget (September as restated in the Aug–Oct package)
const SEP_NI_BUD = {delta:-26063.34, growth:-56.9};
const MONTH_FULL = {Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May',Jun:'June',Jul:'July',Aug:'August',Sep:'September',Oct:'October'};
const sumKey = k => DATA.reduce((a,d)=>a+d[k],0);
const pctOf = (a,b) => a/b*100;

/* ---------------- KPI tiles ---------------- */
function renderKPIs(){
  const totalRev = sumKey("revenue");
  const totalNI = sumKey("net_income");
  const first = DATA[0], last = DATA[DATA.length-1];
  const cashDelta = (last.cash-first.cash)/first.cash*100;
  const avgMargin = totalNI/totalRev*100;
  const bestM = DATA.reduce((a,b)=> b.net_margin>a.net_margin?b:a);
  const revGrowth = (last.revenue/first.revenue-1)*100;

  const tiles = [
    {label:"Total revenue (Jan–Oct)", value: fmt$(totalRev), delta: "+"+revGrowth.toFixed(1)+"% Jan → Oct", cls:"up"},
    {label:"Total net income (Jan–Oct)", value: fmt$(totalNI), delta: "Oct 31 balance sheet shows "+fmt$(BS_OCT.ytdNI)+" — see tie-out", cls:"down"},
    {label:"Cash on hand (Oct 31)", value: fmt$(last.cash), delta: fmtPct(cashDelta) + " since January (SBA-loan funded)", cls: cashDelta>=0?"up":"down"},
    {label:"Net margin (Jan–Oct blended)", value: avgMargin.toFixed(1)+"%", delta: "Peak "+bestM.net_margin.toFixed(1)+"% in "+MONTH_FULL[bestM.month]+"; Oct "+last.net_margin.toFixed(1)+"%", cls: avgMargin>=0?"up":"down"},
  ];
  document.getElementById("kpiRow").innerHTML = tiles.map(t=>`
    <div class="kpi">
      <div class="label">${t.label}</div>
      <div class="value">${t.value}</div>
      <div class="delta ${t.cls}">${t.delta}</div>
    </div>`).join("");
}

/* ---------------- narrative ---------------- */
function renderNarrative(){
  const jan = DATA[0], jul = DATA[6], aug = DATA[7], sep = DATA[8], oct = DATA[9];
  const revGrowth = (oct.revenue/jan.revenue-1)*100;
  const octVsSep = (oct.revenue/sep.revenue-1)*100, octVsJul = (oct.revenue/jul.revenue-1)*100;
  const totNI = sumKey("net_income"), totRev = sumKey("revenue");
  const netOfLoan = oct.cash - BS_OCT.sba, netOfLoanDec = BS_OCT.cashDec;
  const el = document.getElementById("narrative");
  el.innerHTML = `
    <p><strong>Revenue is up ${revGrowth.toFixed(1)}% since January and recovered in October after two softer months.</strong> Total revenue rose from ${fmt$(jan.revenue)} in January to ${fmt$(oct.revenue)} in October. October was ${octVsSep.toFixed(1)}% above September and ${Math.abs(octVsJul).toFixed(1)}% below July's peak of ${fmt$(jul.revenue)}; August and September had each slipped from the month before. Beverage has run ahead of budget and food behind it all year, and October followed the same pattern (see the budget pages).</p>
    <p><strong>October profit rebounded, but it is flattered by missing charges.</strong> HBG lost ${fmt$(Math.abs(jan.net_income))} in January and ${fmt$(Math.abs(DATA[1].net_income))} in February, then was profitable every month from March on. Net income was ${fmt$(aug.net_income)} in August (${aug.net_margin}% margin), ${fmt$(sep.net_income)} in September (${sep.net_margin}%, restated down from $20,822 in the new package) and ${fmt$(oct.net_income)} in October (${oct.net_margin}%). October carries no loan interest (booked at $3,636 in both August and September) and only $46 of liability insurance against about $1,255 in a normal month, which together overstate October profit by roughly $4,800; sales tax expense also swung to a $3,456 charge after a $1,348 credit in September. Cost of goods sold ran ${oct.cogs_pct}% of revenue, the highest since July (${jul.cogs_pct}%). Total January–October net income on the statements is ${fmt$(totNI)} (${(totNI/totRev*100).toFixed(1)}% margin); the October 31 balance sheet reports ${fmt$(BS_OCT.ytdNI)} year to date, which is reconciled on the "YTD vs. Budget" page.</p>
    <p><strong>Payroll leverage is still the main driver of the improvement, but it stopped improving.</strong> Payroll stayed in a range of about ${fmt$(Math.min(...DATA.map(d=>d.payroll)),true)}–${fmt$(Math.max(...DATA.map(d=>d.payroll)),true)} a month while revenue grew, so it fell from ${jan.payroll_pct}% of revenue in January to ${oct.payroll_pct}% in October, up from ${sep.payroll_pct}% in September. It is also the line furthest over budget, which is why it leads the profit opportunities on the "Profit Opportunities" page.</p>
    <p><strong>Cash is up sharply, but it is loan-funded rather than earned.</strong> Cash on hand rose from ${fmt$(jan.cash)} at the end of January to ${fmt$(oct.cash)} at the end of October, but the balance sheet carries a ${fmt$(BS_OCT.sba)} SBA loan that did not exist at December 31, 2025 — net of that loan, cash is about ${fmt$(netOfLoan)} versus ${fmt$(netOfLoanDec)} at year-end. Cash rose ${fmt$(oct.cash_chg)} in October after slipping ${fmt$(Math.abs(sep.cash_chg))} in September. The loan balance is still ${fmt$(BS_OCT.sba)} and no interest was booked in October, so the monthly loan payment does not appear to be recorded yet. Accounts payable rose ${fmt$(oct.ap-sep.ap)} to ${fmt$(oct.ap)}.</p>
  `;
}

/* ---------------- shared chart helpers ---------------- */
function niceMax(v){
  if (v<=0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v/p;
  let f;
  if (n<=1) f=1; else if (n<=2) f=2; else if (n<=2.5) f=2.5; else if (n<=5) f=5; else f=10;
  return f*p;
}
function niceMin(v){
  if (v>=0) return 0;
  return -niceMax(Math.abs(v));
}

/* ---------------- Chart 1: Revenue bars + Net income line ---------------- */
function drawRevNI(){
  const W=1000, H=340, ML=56, MR=20, MT=16, MB=34;
  const plotW = W-ML-MR, plotH = H-MT-MB;
  const n = DATA.length;
  const bandW = plotW/n;
  const barW = Math.min(38, bandW*0.5);
  const maxV = niceMax(Math.max(...DATA.map(d=>d.revenue)));
  const minV = niceMin(Math.min(...DATA.map(d=>d.net_income), 0));
  const y = v => MT + plotH - ( (v-minV)/(maxV-minV) )*plotH;
  const zeroY = y(0);

  let gridlines="", yticks="";
  const steps=5;
  for(let i=0;i<=steps;i++){
    const v = minV + (maxV-minV)*i/steps;
    const yy = y(v);
    gridlines += `<line x1="${ML}" x2="${W-MR}" y1="${yy}" y2="${yy}" class="gridline"/>`;
    yticks += `<text x="${ML-8}" y="${yy+3}" text-anchor="end" class="axis-label">${fmt$(v,true)}</text>`;
  }

  let bars="", points=[], xticks="";
  DATA.forEach((d,i)=>{
    const cx = ML + bandW*i + bandW/2;
    const bx = cx - barW/2;
    const by = y(d.revenue);
    const bh = zeroY - by;
    bars += `<rect x="${bx}" y="${by}" width="${barW}" height="${bh}" rx="4" fill="var(--brand)" data-i="${i}" class="bar-rev"/>`;
    points.push([cx, y(d.net_income)]);
    xticks += `<text x="${cx}" y="${H-10}" text-anchor="middle" class="axis-label">${d.month}</text>`;
  });

  const linePath = points.map((p,i)=> (i===0?"M":"L")+p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
  let dots="";
  points.forEach((p,i)=>{
    dots += `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="var(--brand-ink)" stroke="var(--paper)" stroke-width="2" data-i="${i}" class="dot-ni"/>`;
  });

  const svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    ${gridlines}
    <line x1="${ML}" x2="${W-MR}" y1="${zeroY}" y2="${zeroY}" stroke="var(--muted)" stroke-width="1"/>
    ${bars}
    <path d="${linePath}" fill="none" stroke="var(--brand-ink)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    ${yticks}
    ${xticks}
  </svg>`;
  const wrap = document.getElementById("chartRevNI");
  wrap.innerHTML = svg;
  const svgEl = wrap.querySelector("svg");

  function hit(i,evt){
    const d = DATA[i];
    showTip(evt, `<b>${d.month} 2026</b><br>Revenue: ${fmt$(d.revenue)}<br>Net income: ${fmt$(d.net_income)} (${d.net_margin}%)`);
  }
  svgEl.querySelectorAll(".bar-rev").forEach(el=>{
    el.addEventListener("mousemove", e=>hit(+el.dataset.i, e));
    el.addEventListener("mouseleave", hideTip);
  });
  svgEl.querySelectorAll(".dot-ni").forEach(el=>{
    el.addEventListener("mousemove", e=>hit(+el.dataset.i, e));
    el.addEventListener("mouseleave", hideTip);
  });
}

/* ---------------- generic single-series area/bar chart ---------------- */
function drawSingleSeries(containerId, key, color, opts){
  opts = opts || {};
  const W=470, H=260, ML=54, MR=16, MT=14, MB=30;
  const plotW = W-ML-MR, plotH = H-MT-MB;
  const n = DATA.length;
  const bandW = plotW/n;
  const vals = DATA.map(d=>d[key]);
  const maxV = niceMax(Math.max(...vals));
  const minV = 0;
  const y = v => MT + plotH - ((v-minV)/(maxV-minV))*plotH;

  let gridlines="", yticks="";
  const steps=4;
  for(let i=0;i<=steps;i++){
    const v = minV + (maxV-minV)*i/steps;
    const yy=y(v);
    gridlines += `<line x1="${ML}" x2="${W-MR}" y1="${yy}" y2="${yy}" class="gridline"/>`;
    yticks += `<text x="${ML-8}" y="${yy+3}" text-anchor="end" class="axis-label">${fmt$(v,true)}</text>`;
  }

  let points=[], xticks="";
  DATA.forEach((d,i)=>{
    const cx = ML + bandW*i + bandW/2;
    points.push([cx, y(d[key])]);
    xticks += `<text x="${cx}" y="${H-8}" text-anchor="middle" class="axis-label">${d.month}</text>`;
  });
  const zeroY = y(0);
  const areaPath = "M"+ML+","+zeroY+" " + points.map(p=>"L"+p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ") + ` L${ML+plotW},${zeroY} Z`;
  const linePath = points.map((p,i)=> (i===0?"M":"L")+p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
  let dots="";
  points.forEach((p,i)=>{ dots += `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${color}" stroke="var(--paper)" stroke-width="2" data-i="${i}" class="dot-${containerId}"/>`; });

  document.getElementById(containerId).innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    ${gridlines}
    <path d="${areaPath}" fill="${color}" opacity="0.10"/>
    <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    ${yticks}
    ${xticks}
  </svg>`;
  const svgEl = document.getElementById(containerId).querySelector("svg");
  svgEl.querySelectorAll(`.dot-${containerId}`).forEach(el=>{
    el.addEventListener("mousemove", e=>{
      const d = DATA[+el.dataset.i];
      const label = opts.label || key;
      showTip(e, `<b>${d.month} 2026</b><br>${label}: ${fmt$(d[key])}`);
    });
    el.addEventListener("mouseleave", hideTip);
  });
}

/* ---------------- stacked expense chart ---------------- */
const EXPENSE_SERIES = [
  {key:"financial", label:"Financial", color:"var(--s1)"},
  {key:"occupancy", label:"Occupancy", color:"var(--s2)"},
  {key:"operations", label:"Operations", color:"var(--s3)"},
  {key:"payroll", label:"Payroll", color:"var(--s4)"},
  {key:"repairs", label:"Repairs & maintenance", color:"var(--s5)"},
  {key:"supplies", label:"Supplies", color:"var(--s6)"},
];

function renderExpLegend(){
  document.getElementById("expLegend").innerHTML = EXPENSE_SERIES.map(s=>
    `<span class="legend-item"><span class="swatch" style="background:${s.color};"></span>${s.label}</span>`).join("");
}

function drawExpenses(){
  const W=1000, H=360, ML=56, MR=20, MT=16, MB=34;
  const plotW = W-ML-MR, plotH = H-MT-MB;
  const n = DATA.length;
  const bandW = plotW/n;
  const barW = Math.min(52, bandW*0.6);
  const gap = 2;

  const totals = DATA.map(d=> EXPENSE_SERIES.reduce((a,s)=>a+d[s.key],0));
  const maxV = niceMax(Math.max(...totals));
  const y = v => MT + plotH - (v/maxV)*plotH;
  const zeroY = y(0);

  let gridlines="", yticks="";
  const steps=5;
  for(let i=0;i<=steps;i++){
    const v = maxV*i/steps;
    const yy=y(v);
    gridlines += `<line x1="${ML}" x2="${W-MR}" y1="${yy}" y2="${yy}" class="gridline"/>`;
    yticks += `<text x="${ML-8}" y="${yy+3}" text-anchor="end" class="axis-label">${fmt$(v,true)}</text>`;
  }

  let bars="", xticks="";
  DATA.forEach((d,i)=>{
    const cx = ML + bandW*i + bandW/2;
    const bx = cx - barW/2;
    let cursorY = zeroY;
    EXPENSE_SERIES.forEach((s,si)=>{
      const val = d[s.key];
      const segH = (val/maxV)*plotH;
      const topY = cursorY - segH;
      const isTop = si === EXPENSE_SERIES.length-1;
      bars += `<rect x="${bx}" y="${topY+ (si>0?gap:0)}" width="${barW}" height="${Math.max(segH-(si>0?gap:0),0)}"
        rx="${isTop?4:0}" fill="${s.color}" data-i="${i}" data-s="${si}" class="exp-seg"/>`;
      cursorY = topY;
    });
    xticks += `<text x="${cx}" y="${H-10}" text-anchor="middle" class="axis-label">${d.month}</text>`;
  });

  document.getElementById("chartExpenses").innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    ${gridlines}
    <line x1="${ML}" x2="${W-MR}" y1="${zeroY}" y2="${zeroY}" stroke="var(--muted)" stroke-width="1"/>
    ${bars}
    ${yticks}
    ${xticks}
  </svg>`;

  const svgEl = document.getElementById("chartExpenses").querySelector("svg");
  svgEl.querySelectorAll(".exp-seg").forEach(el=>{
    el.addEventListener("mousemove", e=>{
      const i = +el.dataset.i, si = +el.dataset.s;
      const d = DATA[i], s = EXPENSE_SERIES[si];
      showTip(e, `<b>${d.month} 2026 — ${s.label}</b><br>${fmt$(d[s.key])} (${(d[s.key]/d.revenue*100).toFixed(1)}% of revenue)`);
    });
    el.addEventListener("mouseleave", hideTip);
  });
}

/* ---------------- expense breakdown table (contrast relief for the stacked chart) ---------------- */
function cellPct(val, revenue){
  return `${fmt$(val)} <span style="color:var(--muted);font-size:11px;">(${(val/revenue*100).toFixed(1)}%)</span>`;
}
function renderExpenseTable(){
  const thead = `<thead><tr><th>Month</th>${EXPENSE_SERIES.map(s=>`<th>${s.label}</th>`).join("")}<th>Total opex</th></tr></thead>`;
  const rows = DATA.map(d=>`<tr><td>${d.month}</td>${EXPENSE_SERIES.map(s=>`<td>${cellPct(d[s.key], d.revenue)}</td>`).join("")}<td>${cellPct(d.total_expenses, d.revenue)}</td></tr>`).join("");
  document.getElementById("expenseTable").innerHTML = thead + `<tbody>${rows}</tbody>`;
  const note = document.createElement("p");
  note.className = "chart-sub";
  note.style.marginTop = "8px";
  note.textContent = "Figures show the dollar amount with its share of that month's revenue in parentheses.";
  const table = document.getElementById("expenseTable");
  if (!table.nextElementSibling || !table.nextElementSibling.classList.contains("pct-note")) {
    note.classList.add("pct-note");
    table.parentElement.appendChild(note);
  }
}
/* ---------------- September/October detailed P&L ---------------- */
function renderPnlDetail(){
  const skipSections = new Set(["Other Income","Other Expenses"]);
  const rows = PNL_DETAIL.filter(r => !(r.type==="section" && skipSections.has(r.label)));

  function deltaCell(a, b){
    if (a===null || b===null || a===undefined || b===undefined) return `<td class="dash">—</td>`;
    const d = b - a;
    const cls = d>0 ? "pos" : (d<0 ? "neg" : "");
    const sign = d>0 ? "+" : "";
    return `<td class="${cls}">${sign}${fmt$(d)}</td>`;
  }
  function moneyCell(v){ return v===null||v===undefined ? `<td class="dash">—</td>` : `<td>${fmt$(v)}</td>`; }
  function pctCell(v){ return v===null||v===undefined ? `<td class="dash">—</td>` : `<td>${v.toFixed(1)}%</td>`; }

  const body = rows.map(r=>{
    if (r.type==="section"){
      return `<tr class="pnl-section"><td colspan="6">${r.label}</td></tr>`;
    }
    if (r.type==="header"){
      return `<tr class="pnl-header"><td class="item">${r.label}</td><td class="dash">—</td><td class="dash">—</td><td class="dash">—</td><td class="dash">—</td><td class="dash">—</td></tr>`;
    }
    const rowClass = r.type==="grandtotal" ? "pnl-grandtotal" : (r.type==="subtotal" ? "pnl-subtotal" : "pnl-leaf");
    return `<tr class="${rowClass}"><td class="item">${r.label}</td>${moneyCell(r.sep)}${pctCell(r.sep_pct)}${moneyCell(r.oct)}${pctCell(r.oct_pct)}${deltaCell(r.sep, r.oct)}</tr>`;
  }).join("");

  const thead = `<thead><tr>
    <th>Line item</th>
    <th>Sep 2026</th><th>% of rev.</th>
    <th>Oct 2026</th><th>% of rev.</th>
    <th>Sep → Oct Δ</th>
  </tr></thead>`;

  document.getElementById("pnlDetailTable").innerHTML = thead + `<tbody>${body}</tbody>`;
}

/* ---------------- detail table ---------------- */
function renderTable(){
  const cols = [
    {label:"Month", key:"month", fmt: v=>v},
    {label:"Revenue", key:"revenue", fmt: v=>fmt$(v)},
    {label:"COGS", key:"cogs", fmt: v=>fmt$(v)},
    {label:"Gross profit", key:"gross_profit", fmt: v=>fmt$(v)},
    {label:"GP margin", key:"gp_margin", fmt: v=>v.toFixed(1)+"%"},
    {label:"Opex", key:"total_expenses", fmt: v=>fmt$(v)},
    {label:"Net income", key:"net_income", fmt: v=>fmt$(v), signed:true},
    {label:"Net margin", key:"net_margin", fmt: v=>v.toFixed(1)+"%", signed:true},
    {label:"Cash (EOM)", key:"cash", fmt: v=>fmt$(v)},
    {label:"AP (EOM)", key:"ap", fmt: v=>fmt$(v)},
    {label:"Total equity", key:"equity", fmt: v=>fmt$(v), signed:true},
  ];
  const totalRow = {
    month:"Total / avg",
    revenue: DATA.reduce((a,d)=>a+d.revenue,0),
    cogs: DATA.reduce((a,d)=>a+d.cogs,0),
    gross_profit: DATA.reduce((a,d)=>a+d.gross_profit,0),
    gp_margin: DATA.reduce((a,d)=>a+d.gross_profit,0)/DATA.reduce((a,d)=>a+d.revenue,0)*100,
    total_expenses: DATA.reduce((a,d)=>a+d.total_expenses,0),
    net_income: DATA.reduce((a,d)=>a+d.net_income,0),
    net_margin: DATA.reduce((a,d)=>a+d.net_income,0)/DATA.reduce((a,d)=>a+d.revenue,0)*100,
    cash: DATA[DATA.length-1].cash,
    ap: DATA[DATA.length-1].ap,
    equity: DATA[DATA.length-1].equity,
  };
  function cellClass(col, v){
    if(!col.signed) return "";
    return v<0 ? "neg" : (v>0 ? "pos" : "");
  }
  const thead = `<thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead>`;
  const rows = DATA.map(d=>`<tr>${cols.map(c=>`<td class="${cellClass(c,d[c.key])}">${c.fmt(d[c.key])}</td>`).join("")}</tr>`).join("");
  const total = `<tr class="total-row">${cols.map(c=>`<td class="${cellClass(c,totalRow[c.key])}">${c.fmt(totalRow[c.key])}</td>`).join("")}</tr>`;
  document.getElementById("detailTable").innerHTML = thead + `<tbody>${rows}${total}</tbody>`;
}

/* ---------------- shared comparison-table renderer (budget and prior-year) ---------------- */
// Variance coloring is favorability-aware: for revenue/profit rows a positive variance is good;
// for cost rows (expense:true) a positive variance (spending above the comparison) is unfavorable.
function favCls(r, v){
  if (v===0 || v===null || v===undefined) return "";
  const good = r.expense ? v<0 : v>0;
  return good ? "pos" : "neg";
}
function renderCompareTable(tableId, rows, heads){
  const body = rows.map(r=>{
    const a = r.budget!==undefined ? r.budget : r.py;
    const b = r.actual!==undefined ? r.actual : r.cy;
    const av = r.pct ? a.toFixed(1)+"%" : fmt$(a);
    const bv = r.pct ? b.toFixed(1)+"%" : fmt$(b);
    const sign = r.delta>0 ? "+" : "";
    const dv = r.pct ? `${sign}${r.delta.toFixed(1)} pts` : `${sign}${fmt$(r.delta)}`;
    let gv;
    if (r.pct) gv = `<td class="dash">—</td>`;
    else if (r.growth===null || r.growth===undefined) gv = `<td class="dash">n/m</td>`;
    else gv = `<td class="${favCls(r,r.growth)}">${r.growth>0?"+":""}${r.growth.toFixed(1)}%</td>`;
    return `<tr class="${r.bold?"yoy-bold":""}"><td class="item">${r.label}</td><td>${av}</td><td>${bv}</td><td class="${favCls(r,r.delta)}">${dv}</td>${gv}</tr>`;
  }).join("");
  document.getElementById(tableId).innerHTML =
    `<thead><tr><th>Category</th><th>${heads[0]}</th><th>${heads[1]}</th><th>Variance</th><th>${heads[2]}</th></tr></thead><tbody>${body}</tbody>`;
}
const findIn = (arr,label) => arr.find(r=>r.label===label);
const OTHER = "Other (advertising, property tax, misc.)";


/* ---------------- October actual vs. budget ---------------- */
function renderBudgetOct(){
  renderCompareTable("octBudgetTable", OCT_VS_BUDGET, ["Oct Budget","Oct Actual","Variance %"]);
  const f = l => findIn(OCT_VS_BUDGET,l);
  const rev=f("Total Revenue"), bev=f("Beverage Sales"), food=f("Food Sales"), cogs=f("Cost of Goods Sold"), gp=f("Gross Profit"), gpm=f("Gross Profit Margin");
  const pay=f("Payroll"), fin=f("Financial"), occ=f("Occupancy"), ops=f("Operations"), rep=f("Repairs & Maintenance"), sup=f("Supplies"), oth=f(OTHER);
  const tot=f("Total Expenses"), noi=f("Net Operating Income"), ni=f("Net Income"), nm=f("Net Margin");
  const oct = DATA[9], sep = DATA[8], aug = DATA[7];
  const budCogsPct = cogs.budget/rev.budget*100;
  const augOctCogsPct = (aug.cogs+sep.cogs+oct.cogs)/(aug.revenue+sep.revenue+oct.revenue)*100;
  // hourly (front-of-house + kitchen) vs. salaried (management wages + bonuses), October budget vs. actual
  const hourlyAct = 48205.49, hourlyBud = 38745;
  const mgmtAct = 18367.32, mgmtBud = 20000;
  const sepNI = SEP_NI_BUD;
  const missingInt = 3636.44, missingIns = 1208.99;
  const niAdj = ni.actual - missingInt - missingIns;
  document.getElementById("octBudgetNarrative").innerHTML = `
    <p><strong>October came much closer to budget than September: net income of ${fmt$(ni.actual)} was ${fmt$(Math.abs(ni.delta))} (${Math.abs(ni.growth).toFixed(1)}%) below the ${fmt$(ni.budget)} budget, compared with a ${fmt$(Math.abs(sepNI.delta))} (${Math.abs(sepNI.growth).toFixed(1)}%) miss in September — and revenue beat plan.</strong> Net margin was ${nm.actual.toFixed(1)}% against a budgeted ${nm.budget.toFixed(1)}%. Total expenses of ${fmt$(tot.actual)} ran ${fmt$(tot.delta)} (+${tot.growth.toFixed(1)}%) over the ${fmt$(tot.budget)} budget, while gross profit was only ${fmt$(gp.delta)} above budget. (Net income is the cleanest comparison: the budget carries about $2,081 a month of loan interest below operating income, while the statements book actual loan interest inside Financial, so the operating-income variance of ${fmt$(Math.abs(noi.delta))} is overstated by roughly that amount.) <strong>The October result is also flattered:</strong> no loan interest (${fmt$(missingInt)} in each of August and September) and only $46 of liability insurance were booked. Adding back about ${fmt$(missingInt+missingIns)} for those two items, October net income would be about ${fmt$(niAdj)}, which is ${fmt$(Math.abs(niAdj-ni.budget))} (${Math.abs((niAdj-ni.budget)/ni.budget*100).toFixed(0)}%) below budget — still a clear improvement on September, but a smaller one than the headline suggests.</p>
    <p><strong>Revenue was ${fmt$(rev.delta)} (+${rev.growth.toFixed(1)}%) above budget after a slight miss in September, with the same mix shift seen all year.</strong> Beverage sales ran ${fmt$(bev.delta)} (+${bev.growth.toFixed(1)}%) ahead of budget while food sales were ${fmt$(Math.abs(food.delta))} (${Math.abs(food.growth).toFixed(1)}%) behind. Food is about two-thirds of sales, so beverage is carrying the top line; a food budget that assumed more covers and less bar volume is worth revisiting for the final two months.</p>
    <p><strong>Cost of goods sold was over budget, and the rate is rising.</strong> COGS came in ${fmt$(cogs.delta)} (+${cogs.growth.toFixed(1)}%) over budget at ${oct.cogs_pct}% of revenue against ${budCogsPct.toFixed(1)}% budgeted, so gross margin was ${gpm.actual.toFixed(1)}% against ${gpm.budget.toFixed(1)}%. The rate has climbed each month since August (${aug.cogs_pct}% → ${sep.cogs_pct}% → ${oct.cogs_pct}%); the August–October average is ${augOctCogsPct.toFixed(1)}%. COGS looks purchase-driven, so a month-end inventory count would show whether the higher rate is real or timing.</p>
    <p><strong>Three lines explain the profit gap.</strong> <em>Payroll</em> was ${fmt$(pay.delta)} (+${pay.growth.toFixed(1)}%) over, ${(pay.actual/rev.actual*100).toFixed(1)}% of revenue against ${(pay.budget/rev.budget*100).toFixed(1)}% budgeted: hourly front-of-house and kitchen wages were about ${fmt$(hourlyAct-hourlyBud)} over budget, partly offset by management wages and bonuses about ${fmt$(mgmtBud-mgmtAct)} under. <em>Operations</em> were ${fmt$(ops.delta)} (+${ops.growth.toFixed(1)}%) over, driven by $1,950 of accounting fees that have no budget line, dues &amp; subscriptions of $2,363 and an $11,960 management fee (5% of sales). <em>Cost of goods sold</em> (above) added ${fmt$(cogs.delta)}.</p>
    <p><strong>Several lines were under budget, and one of them is suspect.</strong> Supplies were ${fmt$(Math.abs(sup.delta))} (${Math.abs(sup.growth).toFixed(0)}%) under after September's one-offs (office supplies $31 and building repairs $360 in October versus $2,671 and $4,825 in September), and Repairs &amp; Maintenance was ${fmt$(Math.abs(rep.delta))} (${Math.abs(rep.growth).toFixed(0)}%) under — although a further $1,942 of "repairs &amp; maintenance" was booked below the operating line under Other Expenses and does not appear in this comparison. Occupancy was ${fmt$(occ.delta)} (+${occ.growth.toFixed(1)}%) over, with rent unchanged at $16,047. Financial was ${fmt$(fin.delta)} (+${fin.growth.toFixed(1)}%) over even without any loan interest, because of a ${fmt$(3456.21)} Sales Tax Expense <em>charge</em> (September carried a $1,348 credit) partly offset by a $1,217 cash-over/short gain; both are worth confirming with the bookkeeper. The "Other" line of ${fmt$(oth.actual)} is advertising &amp; marketing, which has no budget category.</p>
  `;
}

/* ---------------- YTD actual vs. budget (+ tie-out to the balance sheet) ---------------- */
function renderBudget(){
  renderCompareTable("budgetTable", BUDGET_YTD, ["YTD Budget","YTD Actual","Variance %"]);
  const f = l => findIn(BUDGET_YTD,l);
  const rev=f("Total Revenue"), bev=f("Beverage Sales"), food=f("Food Sales"), cogs=f("Cost of Goods Sold"), gp=f("Gross Profit"), gpm=f("Gross Profit Margin");
  const pay=f("Payroll"), fin=f("Financial"), occ=f("Occupancy"), ops=f("Operations"), rep=f("Repairs & Maintenance"), sup=f("Supplies"), oth=f(OTHER);
  const tot=f("Total Expenses"), noi=f("Net Operating Income"), ni=f("Net Income"), nm=f("Net Margin");
  const octB = l => findIn(OCT_VS_BUDGET,l);

  // tie-out to the October 31 balance sheet
  const stmtNI = sumKey("net_income");
  const origJanMay = DATA.slice(0,5).reduce((a,d)=>a+d.net_income,0);
  const restJanMay = Object.values(RESTATED_JAN_MAY).reduce((a,b)=>a+b,0);
  const restate = restJanMay - origJanMay;
  const feeEst = -(DATA[3].revenue + DATA[4].revenue)*0.05;
  const resid = BS_OCT.ytdNI - (stmtNI + restate + feeEst);
  const bsVar = BS_OCT.ytdNI - ni.budget;
  const octCogs = octB("Cost of Goods Sold"), octNI = octB("Net Income");
  const cogsPriorYtd = cogs.delta - octCogs.delta;                       // YTD COGS variance as of the September review
  const augCogsDelta = DATA[7].cogs - 63621.19;                          // August COGS vs. August budget (restated August actual)
  const opsAdj = ops.delta - feeEst;                                     // feeEst is negative -> adds back
  const payPct = pay.actual/rev.actual*100, payBudPct = pay.budget/rev.budget*100;
  const bsNiOct = BS_OCT.ytdNI - BS_OCT.sep.ytdNI;                       // October net income implied by the balance sheet
  const loanIntYtd = 20775;                                              // budgeted Jan–Oct interest expense (carried below operating income)

  document.getElementById("budgetNarrative").innerHTML = `
    <p><strong>Year-to-date profit is well behind budget — ${fmt$(Math.abs(ni.delta))} (${Math.abs(ni.growth).toFixed(1)}%) behind on the monthly statements, and about ${fmt$(Math.abs(bsVar))} (${Math.abs(bsVar/ni.budget*100).toFixed(1)}%) behind on the balance-sheet basis.</strong> Net income of ${fmt$(ni.actual)} on the statements compares to a ${fmt$(ni.budget)} budget, and net margin of ${nm.actual.toFixed(1)}% to ${nm.budget.toFixed(1)}% budgeted. October added a further ${fmt$(Math.abs(octNI.delta))} to the gap (far less than September's ${fmt$(Math.abs(SEP_NI_BUD.delta))}), but October itself is missing loan interest and most of a month's liability insurance, so the true gap is somewhat wider. The tie-out below shows why the October 31 balance sheet (${fmt$(BS_OCT.ytdNI)}) is lower than the statements. Net income is the cleanest comparison: the budget carries about ${fmt$(loanIntYtd)} of year-to-date loan interest below operating income, while the statements book actual loan interest inside Financial.</p>
    <p><strong>Revenue is essentially on plan (${Math.abs(rev.growth).toFixed(1)}% below budget), masking a mix shift.</strong> Total revenue of ${fmt$(rev.actual)} against ${fmt$(rev.budget)} budgeted: beverage is ${fmt$(bev.delta)} (+${bev.growth.toFixed(1)}%) ahead while food is ${fmt$(Math.abs(food.delta))} (${Math.abs(food.growth).toFixed(1)}%) behind, so the profit gap is not a sales problem — it is a cost problem.</p>
    <p><strong>Gross margin is now slightly below plan (${gpm.actual.toFixed(1)}% vs. ${gpm.budget.toFixed(1)}%), and the cushion is gone.</strong> COGS was ${fmt$(Math.abs(cogsPriorYtd))} ${cogsPriorYtd<0?"under":"over"} budget year to date through September; after October's ${fmt$(octCogs.delta)} overage it is ${fmt$(Math.abs(cogs.delta))} (${Math.abs(cogs.growth).toFixed(1)}%) <em>over</em>. The favorable variance had come largely from August (${fmt$(Math.abs(augCogsDelta))} under, which looks like purchasing timing), and the COGS rate has risen every month since. Monthly inventory counts would show whether the underlying food-cost rate is on plan.</p>
    <p><strong>Payroll is the largest variance in the P&amp;L — and, together with supplies, larger than the entire net-income shortfall.</strong> Actual payroll of ${fmt$(pay.actual)} is ${fmt$(pay.delta)} (+${pay.growth.toFixed(1)}%) over the ${fmt$(pay.budget)} budget, ${payPct.toFixed(1)}% of revenue against ${payBudPct.toFixed(1)}% budgeted. Supplies are ${fmt$(sup.delta)} (+${sup.growth.toFixed(1)}%) over, Financial is ${fmt$(fin.delta)} (+${fin.growth.toFixed(1)}%) over (card fees and SBA-loan interest), and Occupancy is essentially on budget (+${occ.growth.toFixed(1)}%). The unbudgeted "Other" line adds ${fmt$(oth.actual)} (advertising &amp; marketing, property tax and miscellaneous entries). Combined, total expenses of ${fmt$(tot.actual)} are ${fmt$(tot.delta)} (+${tot.growth.toFixed(1)}%) over the ${fmt$(tot.budget)} budget.</p>
    <p><strong>The apparent savings in Operations are mostly a bookkeeping artifact.</strong> Operations is ${fmt$(Math.abs(ops.delta))} (${Math.abs(ops.growth).toFixed(1)}%) under budget, but the April and May statements carry no management fee (about ${fmt$(Math.abs(feeEst))} at 5% of revenue). Adding that back, Operations is within ${fmt$(Math.abs(opsAdj))} of budget — so there is no large offset to the payroll overage. Repairs &amp; Maintenance is still ${fmt$(Math.abs(rep.delta))} (${Math.abs(rep.growth).toFixed(1)}%) under budget, although $1,942 of October repairs &amp; maintenance was booked below the operating line.</p>
  `;

  const row = (lab, val, cls, strong) => `<tr class="${strong?"yoy-bold":""}"><td class="item">${lab}</td><td class="${cls||""}">${val<0?"-":""}${fmt$(Math.abs(val))}</td></tr>`;
  document.getElementById("tieoutTable").innerHTML = `<thead><tr><th>Net income, January–October 2026</th><th>Amount</th></tr></thead><tbody>
    ${row("Sum of the monthly statements used in this dashboard (Jan–May as originally issued; Jun–Oct from the later monthly packages, with August and September as restated in the Aug–Oct package)", stmtNI, "", true)}
    ${row("Jan–May restatements in the later monthly packages (Jan −$768, Feb −$234, Mar −$2,080, Apr −$3,205, May −$2,785)", restate, restate<0?"neg":"pos")}
    ${row("Management fee not booked in the April and May statements (estimated at 5% of revenue: Apr "+fmt$(DATA[3].revenue*0.05)+" + May "+fmt$(DATA[4].revenue*0.05)+")", feeEst, "neg")}
    ${row("Remaining difference, not explained by the files provided — essentially unchanged from September (October alone: statement "+fmt$(DATA[9].net_income)+" vs. "+fmt$(bsNiOct)+" implied by the balance sheet; the "+fmt$(DATA[9].net_income-bsNiOct)+" gap matches the September restatement)", resid, resid<0?"neg":"pos")}
    ${row("Year-to-date net income per the October 31, 2026 balance sheet", BS_OCT.ytdNI, "", true)}
    ${row("Budgeted year-to-date net income", ni.budget, "")}
    ${row("Variance, balance-sheet basis (actual less budget)", bsVar, bsVar<0?"neg":"pos", true)}
  </tbody>`;
}

/* ---------------- prior-year comparison pages ---------------- */
function renderYoYSummary(tableId, narrativeId, sumRows, pyLab, cyLab, narrativeFn){
  renderCompareTable(tableId, sumRows, [pyLab, cyLab, "Growth"]);
  document.getElementById(narrativeId).innerHTML = narrativeFn(l => findIn(sumRows,l));
}
const legalDetail = (rows,label) => rows.find(r=>r.label===label && r.type==="leaf");

function octYoYNarrative(f){
  const rev=f("Total Revenue"), bev=f("Beverage Sales"), food=f("Food Sales"), cogs=f("Cost of Goods Sold"), gpm=f("Gross Profit Margin"), gp=f("Gross Profit");
  const fin=f("Financial"), occ=f("Occupancy"), ops=f("Operations"), pay=f("Payroll"), rep=f("Repairs & Maintenance"), sup=f("Supplies");
  const tot=f("Total Expenses"), noi=f("Net Operating Income"), ni=f("Net Income"), nm=f("Net Margin");
  const d = lab => legalDetail(FULL_YOY_OCT, lab);
  const inc = lab => FULL_YOY_OCT.find(r=>r.type==="leaf" && r.label===lab);
  const cc=d("Credit Card Fees"), mw=d("Management Wages"), bart=d("Bartender Wages"), mg=d("Management"), stx=d("Sales Tax Expense"), dues=d("Dues and Subscriptions"), pt=d("Payroll Taxes");
  const fo=findIn(FULL_YOY_OCT.filter(r=>r.type==="subtotal"),"Front of House Wages");
  const liq=inc("Liquor"), beer=inc("Beer"), wine=inc("Wine");
  const sub = lab => FULL_YOY_OCT.find(r=>r.type==="subtotal" && r.label===lab);
  const flow = ni.delta/rev.delta*100;
  const aoG = (AO.rev26/AO.rev25-1)*100, aoFlow = (AO.ni26-AO.ni25)/(AO.rev26-AO.rev25)*100;
  return `
    <p><strong>Revenue grew ${rev.growth.toFixed(1)}% year over year and net income nearly doubled — but October 2026 is flattered by missing charges.</strong> October 2026 revenue of ${fmt$(rev.cy)} was up ${fmt$(rev.delta)} from ${fmt$(rev.py)} in October 2025, with food up ${food.growth.toFixed(1)}% and beverage up ${bev.growth.toFixed(1)}% (liquor +${liq.growth.toFixed(0)}%, wine +${wine.growth.toFixed(0)}%, beer +${beer.growth.toFixed(1)}%). Net income rose from ${fmt$(ni.py)} (margin ${nm.py.toFixed(1)}%) to ${fmt$(ni.cy)} (margin ${nm.cy.toFixed(1)}%), so ${flow.toFixed(0)}¢ of every additional revenue dollar reached the bottom line — below the roughly ${aoFlow.toFixed(0)}¢ for August–October as a whole, because cost of goods sold grew much faster than sales this month. Revenue growth was ${aoG.toFixed(1)}% over the three months (${fmt$(AO.rev26)} vs. ${fmt$(AO.rev25)}), with net income of ${fmt$(AO.ni26)} versus ${fmt$(AO.ni25)}; the three-month view is the fairer yardstick.</p>
    <p><strong>Gross margin fell ${Math.abs(gpm.delta).toFixed(1)} points year over year.</strong> COGS grew ${cogs.growth.toFixed(1)}% against ${rev.growth.toFixed(1)}% revenue growth, rising from ${(cogs.py/rev.py*100).toFixed(1)}% to ${(cogs.cy/rev.cy*100).toFixed(1)}% of revenue and holding gross profit growth to ${gp.growth.toFixed(1)}% (${fmt$(gp.delta)}). Food purchases rose ${(sub('Food Purchases').growth).toFixed(1)}% against food sales up ${food.growth.toFixed(1)}%, and beverage purchases rose ${(sub('Beverage Purchases').growth).toFixed(1)}% against beverage sales up ${bev.growth.toFixed(1)}%. Either the kitchen and bar are buying ahead of sales or inventory is being built (bar inventory is $18,280 versus $11,208 at year-end), so a month-end count matters here.</p>
    <p><strong>Payroll leverage still did the work, though less than before.</strong> Payroll rose ${fmt$(pay.delta)} (+${pay.growth.toFixed(1)}%) against ${rev.growth.toFixed(1)}% revenue growth, falling from ${(pay.py/rev.py*100).toFixed(1)}% to ${(pay.cy/rev.cy*100).toFixed(1)}% of revenue. Management wages were up only ${Math.abs(mw.growth).toFixed(1)}% and kitchen wages rose 7.7%, while front-of-house wages rose ${fmt$(fo.delta)} (+${fo.growth.toFixed(1)}%, with bartender wages ${fmt$(bart.py)} → ${fmt$(bart.cy)}). Payroll taxes rose ${pt.growth.toFixed(1)}% and workers' comp added $1,079 (none a year ago), while employee healthcare fell sharply ($535 against about $1,175 a year ago) — a line to confirm is complete. Occupancy was up ${fmt$(occ.delta)} (+${occ.growth.toFixed(1)}%).</p>
    <p><strong>Operations and financial costs grew faster than revenue; October 2025 also carried one-offs.</strong> Operations rose ${fmt$(ops.delta)} (+${ops.growth.toFixed(1)}%): the management fee is up ${fmt$(mg.delta)} (+${mg.growth.toFixed(1)}%) with sales, $1,950 of accounting fees are new, and dues &amp; subscriptions are up ${fmt$(dues.delta)}. Financial rose ${fmt$(fin.delta)} (+${fin.growth.toFixed(1)}%): card fees up ${fmt$(cc.delta)} (+${cc.growth.toFixed(1)}%) and a ${fmt$(stx.cy)} Sales Tax Expense charge, partly offset by a $1,217 cash-over/short gain; liability insurance was only $46 against $1,124 a year ago and no loan interest was booked, which flatters this year's figure. Supplies fell ${fmt$(Math.abs(sup.delta))}. October 2025 included $3,438 of property tax that has no October 2026 counterpart, which helps this year's comparison.</p>
    <p><strong>Comparison caveats.</strong> Both years' October statements carry a management fee (5% of revenue), so that line is comparable. October 2026 omits loan interest (about $3,636) and most of a month's liability insurance (about $1,209), the Sales Tax Expense swung from a credit in September to a charge, and $1,942 of repairs &amp; maintenance was booked below the operating line, so the run-rate profit differs from the reported figure (see the "Profit Opportunities" page).</p>
  `;
}

/* ---------------- full line-item P&L, any month (2026 vs. 2025) ---------------- */
function renderFullYoyDetail(tableId, rows, pyLab, cyLab){
  const skipSections = new Set(["Other Income","Other Expenses"]);
  rows = rows.filter(r => !(r.type==="section" && skipSections.has(r.label)));
  const moneyCell = v => v===null||v===undefined ? `<td class="dash">—</td>` : `<td>${fmt$(v)}</td>`;
  const pctCell = v => v===null||v===undefined ? `<td class="dash">—</td>` : `<td>${v.toFixed(1)}%</td>`;
  function deltaCell(r){
    if (r.delta===null || r.delta===undefined) return `<td class="dash">—</td>`;
    return `<td class="${favCls({expense:r.exp},r.delta)}">${r.delta>0?"+":""}${fmt$(r.delta)}</td>`;
  }
  function growthCell(r){
    if (r.growth===null || r.growth===undefined) return `<td class="dash">${r.delta===null||r.delta===undefined?"—":"n/m"}</td>`;
    return `<td class="${favCls({expense:r.exp},r.growth)}">${r.growth>0?"+":""}${r.growth.toFixed(1)}%</td>`;
  }
  const body = rows.map(r=>{
    if (r.type==="section") return `<tr class="pnl-section"><td colspan="7">${r.label}</td></tr>`;
    if (r.type==="header") return `<tr class="pnl-header"><td class="item">${r.label}</td>${'<td class="dash">—</td>'.repeat(6)}</tr>`;
    const rowClass = r.type==="grandtotal" ? "pnl-grandtotal" : (r.type==="subtotal" ? "pnl-subtotal" : "pnl-leaf");
    return `<tr class="${rowClass}"><td class="item">${r.label}</td>${moneyCell(r.py)}${pctCell(r.py_pct)}${moneyCell(r.cy)}${pctCell(r.cy_pct)}${deltaCell(r)}${growthCell(r)}</tr>`;
  }).join("");
  document.getElementById(tableId).innerHTML = `<thead><tr><th>Line item</th><th>${pyLab}</th><th>% of rev.</th><th>${cyLab}</th><th>% of rev.</th><th>Variance</th><th>Growth</th></tr></thead><tbody>${body}</tbody>`;
}


/* ---------------- profit opportunities ---------------- */
function renderOpps(){
  const ytdRev = sumKey("revenue"), n = DATA.length;
  const annRev = ytdRev/n*12;                 // conservative: YTD-average month x 12
  const onePt = annRev*0.01;
  const oct = DATA[9], sep = DATA[8], aug = DATA[7];
  const pay = findIn(BUDGET_YTD,"Payroll"), rev = findIn(BUDGET_YTD,"Total Revenue");
  const payPct = pay.actual/rev.actual*100, payBud = pay.budget/rev.budget*100;
  const octPayBud = findIn(OCT_VS_BUDGET,"Payroll").budget/findIn(OCT_VS_BUDGET,"Total Revenue").budget*100;
  const aoCogs = AO.cogs26/AO.rev26*100;
  const octCogsBud = findIn(OCT_VS_BUDGET,"Cost of Goods Sold").budget/findIn(OCT_VS_BUDGET,"Total Revenue").budget*100;
  const cat = AO.cat; const cr = k => cat[k].buy/cat[k].sales*100;
  const ccPct26 = AO.cc26/AO.rev26*100, ccPct25 = AO.cc25/AO.rev25*100;
  const dPct26 = AO.disc26/AO.rev26*100, dPct25 = AO.disc25/AO.rev25*100;
  const revGrowth = (AO.rev26/AO.rev25-1)*100, niDelta = AO.ni26-AO.ni25, flow = niDelta/(AO.rev26-AO.rev25)*100;
  const octFlow = (oct.net_income-16262.06)/(oct.revenue-184599.63)*100;
  const foodAnn = sumKey("food_sales")/n*12;
  const bwAnn = (cat.Beer.sales+cat.Wine.sales)*4;
  const sbaInterestYr = BS_OCT.sba*0.0875;
  const loanRate = 3636.44*12/BS_OCT.sba*100;

  // October quality-of-earnings (computed first so the KPI tile can use it)
  const cogsAdj = (oct.cogs_pct - aoCogs)/100*oct.revenue;
  const adj = [
    ["Reported October net income", oct.net_income, true],
    ["Loan interest not booked (August and September each carried $3,636)", -3636.44],
    ["Liability insurance under-booked ($46 vs. about $1,255 in a normal month)", -1208.99],
    ["Sales Tax Expense charge (swung from a $1,348 credit in September; treated as zero)", 3456.21],
    ["Cash over/short gain (a one-off credit in October)", -1216.63],
    ["Employee healthcare and sick pay light versus the August–September average", -2045.89],
    ["COGS rate above the Aug–Oct average ("+oct.cogs_pct+"% vs. "+aoCogs.toFixed(1)+"%), if purchasing reverses", cogsAdj],
  ];
  const total = adj.reduce((a,r)=>a+r[1],0);
  // KPI tiles
  const tiles = [
    {label:"Aug–Oct revenue vs. 2025", value:"+"+revGrowth.toFixed(1)+"%", delta:fmt$(AO.rev26)+" vs. "+fmt$(AO.rev25), cls:"up"},
    {label:"Aug–Oct net income vs. 2025", value:"+"+((AO.ni26/AO.ni25-1)*100).toFixed(0)+"%", delta:fmt$(AO.ni26)+" vs. "+fmt$(AO.ni25), cls:"up"},
    {label:"Flow-through on added revenue", value:flow.toFixed(0)+"¢", delta:"per extra $1 of sales (Aug–Oct, YoY); October alone "+octFlow.toFixed(0)+"¢", cls:"up"},
    {label:"Oct margin, reported vs. run-rate", value:oct.net_margin.toFixed(1)+"%", delta:"≈ "+(total/oct.revenue*100).toFixed(1)+"% run-rate after normalizing (see below)", cls:"flat"},
  ];
  document.getElementById("oppKpis").innerHTML = tiles.map(t=>`<div class="kpi"><div class="label">${t.label}</div><div class="value">${t.value}</div><div class="delta ${t.cls}">${t.delta}</div></div>`).join("");

  document.getElementById("oppIntro").innerHTML = `
    <p><strong>The year's growth is real, and October's profit rebound is mostly real too — but cost of goods is now the main drag on how much of it reaches the bottom line.</strong> Over August–October, revenue grew ${revGrowth.toFixed(1)}% against 2025 and net income rose ${fmt$(niDelta)} — about ${flow.toFixed(0)}¢ of each added revenue dollar, but only ${octFlow.toFixed(0)}¢ in October alone, because COGS rose 56% year over year against 30% revenue growth. Payroll still fell from ${(AO.pay25/AO.rev25*100).toFixed(1)}% to ${(AO.pay26/AO.rev26*100).toFixed(1)}% of revenue over the three months, while rent was flat. The opportunities below are about protecting and rebuilding that flow-through: the biggest levers are labor scheduling, measuring and controlling the cost of goods, and the cost of money (card fees, SBA interest and idle cash). All sizing uses a conservative annual revenue base of about ${fmt$(annRev,true)} (the January–October monthly average × 12) and is illustrative, not a forecast.</p>`;

  const opp = [
    ["1. Flex payroll to sales",
     `YTD payroll is ${payPct.toFixed(1)}% of revenue against ${payBud.toFixed(1)}% budgeted (${fmt$(pay.delta)} over). October's ${oct.payroll_pct}% compares with a ${octPayBud.toFixed(1)}% October budget; hourly front-of-house and kitchen wages were about $9,500 over budget while management wages ran about $1,600 under. Year over year, front-of-house wages are up 32.8% in October (bartender wages $385 → $2,595) while kitchen wages rose 7.7%.`,
     `Each 1 pt of revenue ≈ ${fmt$(onePt)}/yr. Closing half of the ${(oct.payroll_pct-octPayBud).toFixed(1)}-pt gap to the October budget ≈ ${fmt$((oct.payroll_pct-octPayBud)/2*onePt)}/yr. Start with schedules built to forecast covers by daypart, and a bar-staffing review.`],
    ["2. Make COGS a measured number, not a purchases number",
     `COGS was ${oct.cogs_pct}% of revenue in October, ${sep.cogs_pct}% in September and ${aug.cogs_pct}% in August, against a ${aoCogs.toFixed(1)}% August–October average and a ${octCogsBud.toFixed(1)}% October budget. Liquor purchases were ${cr("Liquor").toFixed(1)}% of liquor sales over the quarter but 11.4% in October (11.7% in October 2025), so the swings look like ordering and coding timing rather than a true change in cost. Food purchases are up 56% and beverage purchases up 56% year over year.`,
     `Each 1 pt of COGS ≈ ${fmt$(onePt)}/yr. Booking a bar and food inventory count every month makes the number trustworthy and surfaces over-pouring, waste and comps. The October 31 balance sheet carries bar inventory of $18,280 versus $11,208 at year-end, so part of the rise may be stock-building.`],
    ["3. Price and mix toward the high-margin categories",
     `Purchase cost as a share of sales (Aug–Oct): liquor ${cr("Liquor").toFixed(1)}%, N/A beverages ${cr("N/A beverages").toFixed(1)}%, beer ${cr("Beer").toFixed(1)}%, wine ${cr("Wine").toFixed(1)}%, food ${cr("Food").toFixed(1)}%. Liquor sales are up 30% year over year in October while beer is up 10%; food is the weakest line versus budget (${findIn(BUDGET_YTD,"Food Sales").growth.toFixed(1)}% YTD, ${findIn(OCT_VS_BUDGET,"Food Sales").growth.toFixed(1)}% in October).`,
     `1% of net food price ≈ ${fmt$(foodAnn*0.01)}/yr; 3% on beer and wine ≈ ${fmt$(bwAnn*0.03)}/yr at the Aug–Oct run rate. Lean into the cocktail program, review beer and wine pricing and by-the-glass costs, and test price on top food sellers before adding promotions.`],
    ["4. Card processing and discounts",
     `Card fees were ${ccPct26.toFixed(2)}% of revenue over August–October versus ${ccPct25.toFixed(2)}% in 2025 (${fmt$(AO.cc26)} for the three months, and 3.12% in October). Sales discounts were ${dPct26.toFixed(2)}% of revenue versus ${dPct25.toFixed(2)}% — improving, and ${fmt$(AO.disc26)} over the period.`,
     `Each 0.25 pt of revenue ≈ ${fmt$(annRev*0.0025)}/yr on either line. Ask the processor for a rate review (interchange-plus pricing), and audit discount and comp codes and approvals; consider dual-pricing options only if consistent with brand and California rules.`],
    ["5. Put idle cash to work against the SBA loan",
     `Cash of ${fmt$(oct.cash)} earned $1 of interest in October, while the ${fmt$(BS_OCT.sba)} SBA loan (about prime + 2, roughly 8.75%, to be confirmed against the loan documents) cost ${fmt$(3636.44)} of interest in each of August and September (${fmt$(AO.interest26)} over Aug–Oct) and nothing in October. The booked amount equals about ${loanRate.toFixed(1)}% a year, well above 8.75%, and the loan balance has not moved from ${fmt$(BS_OCT.sba)}, so the interest and the payment schedule need to be checked against the loan statement.`,
     `Each $100K applied to the loan saves about ${fmt$(100000*0.0875)}/yr of interest (confirm prepayment terms and keep enough operating cash on hand); at minimum, sweep surplus cash to an interest-bearing account. Full loan carrying cost is about ${fmt$(sbaInterestYr)}/yr at 8.75%.`],
    ["6. Right-size the bookkeeping engagement",
     `Bookkeeping costs ${fmt$(3700)}/month (${fmt$(3700*12)}/yr) and October added ${fmt$(1950)} of accounting fees on top. The books were restated again in this package — September net income moved from $20,822 to ${fmt$(sep.net_income)} — and October is missing loan interest and most of a month's liability insurance. The September 3 review in this project estimated about ${fmt$(2270)}/month of the scope could be absorbed by a hybrid model.`,
     `≈ ${fmt$(2270*12)}/yr (planning estimate — validate with a parallel close before giving notice). Pair it with a standing close checklist so management fee, interest, insurance and utilities are booked every month.`],
    ["7. Spend growth dollars where each $1 clearly pays back",
     `Advertising &amp; promotion plus advertising &amp; marketing totaled about ${fmt$(615.32+600)} in October against a ${fmt$(1771.88)} monthly budget. Revenue recovered in October but is still below July's peak and food is behind budget. At about ${flow.toFixed(0)}¢ of flow-through, each $1 of marketing needs roughly $${(100/flow).toFixed(2)} of added sales to break even.`,
     `Each additional $100K of annual revenue ≈ ${fmt$(flow*1000,true)} of profit. Target the weak spots: weekday food covers, off-peak dayparts, private events (the Event Deposits account shows the demand exists) and local-resident loyalty — and hold discretionary supplies and small equipment to budget so growth dollars are not absorbed by cost.`],
  ];
  document.getElementById("oppTable").innerHTML = `<thead><tr><th style="width:21%">Opportunity</th><th>What the data shows</th><th style="width:31%">Sizing and first step</th></tr></thead><tbody>${
    opp.map(o=>`<tr><td class="item"><strong>${o[0]}</strong></td><td class="item">${o[1]}</td><td class="item">${o[2]}</td></tr>`).join("")}</tbody>`;

  document.getElementById("oppAdjTable").innerHTML = `<thead><tr><th>October net income, illustrative run-rate</th><th>Amount</th></tr></thead><tbody>${
    adj.map(r=>`<tr class="${r[2]?"yoy-bold":""}"><td class="item">${r[0]}</td><td class="${r[1]<0&&!r[2]?"neg":(r[1]>0&&!r[2]?"pos":"")}">${r[1]<0?"-":(r[2]?"":"+")}${fmt$(Math.abs(r[1]))}</td></tr>`).join("")}
    <tr class="yoy-bold"><td class="item">Illustrative run-rate net income (${(total/oct.revenue*100).toFixed(1)}% margin on October revenue)</td><td>${fmt$(total)}</td></tr></tbody>`;

  // Biggest year-over-year cost movers (Oct 2026 vs Oct 2025)
  let sec=null, movers=[];
  FULL_YOY_OCT.forEach(r=>{ if(r.type==="section") sec=r.label; if(r.type==="leaf" && sec==="Expenses"){ const py=r.py||0, cy=r.cy||0; movers.push({label:r.label, py, cy, d:cy-py}); } });
  movers.sort((a,b)=>b.d-a.d);
  const up = movers.slice(0,8);
  document.getElementById("oppMovers").innerHTML = `<thead><tr><th>Expense line</th><th>Oct 2025</th><th>Oct 2026</th><th>Change</th></tr></thead><tbody>${
    up.map(m=>`<tr><td class="item">${m.label}</td><td>${fmt$(m.py)}</td><td>${fmt$(m.cy)}</td><td class="neg">+${fmt$(m.d)}</td></tr>`).join("")}</tbody>`;

  document.getElementById("oppClean").innerHTML = `
    <p><strong>Close the books completely each month.</strong> The management fee (5% of revenue, about $12K a month) is still absent from the April and May statements (about $21K); September was restated again in the Aug–Oct package (net income $20,822 → ${fmt$(sep.net_income)}), and October carries no loan interest and only $46 of liability insurance. A fixed-asset line also grew by about $73K this year while accumulated depreciation is still about $524, so depreciation does not appear to be booked. Until every month is booked on the same basis, month-to-month margins and budget variances are not reliable.</p>
    <p><strong>Resolve the open accounting questions that move profit.</strong> Sales Tax Expense swung from a $1,348 credit in September to a $3,456 charge in October — one of the two is mis-posted. Also open: the SBA loan (the balance is unchanged at ${fmt$(BS_OCT.sba)} with no principal payments and no October interest), $1,942 of repairs &amp; maintenance booked under Other Expenses below the operating line, the Event Deposits and gift-card balances, and an inventory count at each month-end. The companion red-flag review lists these with the supporting detail and questions for the bookkeeper.</p>
    <p><strong>Ask Sorren for a restated January–October P&amp;L.</strong> The October 31 balance sheet reports ${fmt$(BS_OCT.ytdNI)} of year-to-date net income, about ${fmt$(sumKey("net_income")-BS_OCT.ytdNI)} below the sum of the monthly statements; one consistent year-to-date P&amp;L would let this dashboard replace the tie-out with a single source.</p>`;
}

/* ---------------- init ---------------- */
renderKPIs();
renderNarrative();
drawRevNI();
drawSingleSeries("chartCash","cash","var(--brand)",{label:"Cash on hand"});
drawSingleSeries("chartAP","ap","var(--accent)",{label:"Accounts payable"});
renderExpLegend();
drawExpenses();
renderExpenseTable();
renderTable();
renderBudgetOct();
renderYoYSummary("octYoyTable","octYoyNarrative",YOY_SUM_OCT,"Oct 2025","Oct 2026",octYoYNarrative);
renderFullYoyDetail("octYoyDetailTable", FULL_YOY_OCT, "Oct 2025", "Oct 2026");
renderBudget();
renderOpps();
renderPnlDetail();

window.addEventListener("resize", ()=>{ drawRevNI(); drawSingleSeries("chartCash","cash","var(--brand)",{label:"Cash on hand"}); drawSingleSeries("chartAP","ap","var(--accent)",{label:"Accounts payable"}); drawExpenses(); });

/* ---------------- page tabs ---------------- */
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("page-"+btn.dataset.tab).classList.add("active");
    window.scrollTo({top:0, behavior:"instant"});
    if (btn.dataset.tab==="overview") { drawRevNI(); drawSingleSeries("chartCash","cash","var(--brand)",{label:"Cash on hand"}); drawSingleSeries("chartAP","ap","var(--accent)",{label:"Accounts payable"}); drawExpenses(); }
  });
});