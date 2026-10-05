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

/* ---------------- constants taken directly from the August 2026 package ---------------- */
// Balance sheet at Aug 31, 2026 vs. Dec 31, 2025 (BS 08.26, "PP" comparative column)
const BS_AUG = {cash:375097.15, cashDec:121685.05, ap:94236.12, apDec:128797.77, sba:350750, equity:11255.42, ytdNI:108853.06};
// Net income for Jan–May as restated in the later monthly packages (Jan: Mar pkg, Feb: Apr pkg, Mar: May pkg, Apr: Jun pkg, May: Jul pkg)
const RESTATED_JAN_MAY = {Jan:-16299.34, Feb:-6320.84, Mar:11977.17, Apr:-2387.17, May:41484.49};
// Jun–Aug totals (2026 package vs. 2025 package), used for the profit-opportunity sizing
const JJA = {
  rev26:727260.28, rev25:596787.10, ni26:104252.12, ni25:42025.14,
  cc26:23884.93, cc25:18570.86, disc26:20325.45, disc25:19006.62,
  cogs26:190787.53, cogs25:158877.40, pay26:230724.80, pay25:219537.23,
  bookkeeping26:11555, interest26:6705.15,
  cat:{ // 2026 Jun–Aug sales vs. purchases by category
    Liquor:{sales:116627.50, buy:12519.70}, "N/A beverages":{sales:24219.50, buy:3859.87},
    Beer:{sales:48877.25, buy:14737.04}, Wine:{sales:44925.00, buy:14806.85},
    Food:{sales:512825.44, buy:144864.07}
  }
};
const MONTH_FULL = {Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May',Jun:'June',Jul:'July',Aug:'August'};
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
    {label:"Total revenue (Jan–Aug)", value: fmt$(totalRev), delta: "+"+revGrowth.toFixed(1)+"% Jan → Aug", cls:"up"},
    {label:"Total net income (Jan–Aug)", value: fmt$(totalNI), delta: "Aug 31 balance sheet shows "+fmt$(BS_AUG.ytdNI)+" — see tie-out", cls:"down"},
    {label:"Cash on hand (Aug 31)", value: fmt$(last.cash), delta: fmtPct(cashDelta) + " since January (SBA-loan funded)", cls: cashDelta>=0?"up":"down"},
    {label:"Net margin (Jan–Aug blended)", value: avgMargin.toFixed(1)+"%", delta: "Peak "+bestM.net_margin.toFixed(1)+"% in "+MONTH_FULL[bestM.month]+"; Aug "+last.net_margin.toFixed(1)+"%", cls: avgMargin>=0?"up":"down"},
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
  const jan = DATA[0], jun = DATA[5], jul = DATA[6], aug = DATA[7];
  const revGrowth = (aug.revenue/jan.revenue-1)*100;
  const augVsJul = (aug.revenue/jul.revenue-1)*100;
  const totNI = sumKey("net_income"), totRev = sumKey("revenue");
  const peak = DATA.reduce((a,b)=> b.revenue>a.revenue?b:a);
  const netOfLoan = aug.cash - BS_AUG.sba, netOfLoanDec = BS_AUG.cashDec;
  const el = document.getElementById("narrative");
  el.innerHTML = `
    <p><strong>Revenue is up ${revGrowth.toFixed(1)}% since January, with a normal late-summer pullback in August.</strong> Total revenue rose from ${fmt$(jan.revenue)} in January to ${fmt$(aug.revenue)} in August, peaking at ${fmt$(peak.revenue)} in ${MONTH_FULL[peak.month]}; August eased ${Math.abs(augVsJul).toFixed(1)}% from July. Food and beverage both scaled through the spring, with beverage running ahead of budget and food behind it (see the budget pages).</p>
    <p><strong>Profit turned positive in March, but the monthly profile is lumpier than the previous version of this review showed.</strong> HBG lost ${fmt$(Math.abs(jan.net_income))} in January and ${fmt$(Math.abs(DATA[1].net_income))} in February, then was profitable every month from March on. With the 5% management fee now included for June–August, net income was ${fmt$(jun.net_income)} in June (${jun.net_margin}% margin), ${fmt$(jul.net_income)} in July (${jul.net_margin}%) and ${fmt$(aug.net_income)} in August (${aug.net_margin}%). Total January–August net income on this basis is ${fmt$(totNI)} (${(totNI/totRev*100).toFixed(1)}% margin); the August 31 balance sheet reports ${fmt$(BS_AUG.ytdNI)} year to date, which is reconciled on the "YTD vs. Budget" page.</p>
    <p><strong>Payroll leverage is still the main driver of the improvement.</strong> Payroll stayed roughly flat in dollar terms (about ${fmt$(Math.min(...DATA.map(d=>d.payroll)),true)}–${fmt$(Math.max(...DATA.map(d=>d.payroll)),true)} a month) while revenue grew, so it fell from ${jan.payroll_pct}% of revenue in January to ${aug.payroll_pct}% in August. It is also the line furthest over budget, which is why it leads the profit opportunities on the "Profit Opportunities" page.</p>
    <p><strong>Cash is up sharply, but it is loan-funded rather than earned.</strong> Cash on hand rose from ${fmt$(jan.cash)} at the end of January to ${fmt$(aug.cash)} at the end of August, but the balance sheet now carries a ${fmt$(BS_AUG.sba)} SBA loan that did not exist at December 31, 2025 — net of that loan, cash is about ${fmt$(netOfLoan)} versus ${fmt$(netOfLoanDec)} at year-end. Accounts payable has been paid down from ${fmt$(jan.ap)} to ${fmt$(aug.ap)}, although it ticked up ${fmt$(aug.ap-jul.ap)} in August (the first increase since March). Total equity of ${fmt$(aug.equity)} at August 31 is below July's ${fmt$(jul.equity)} as originally reported despite ${fmt$(aug.net_income)} of August profit — the June and July balance sheets predate the management-fee restatement and the movement may include equity activity (such as distributions) that does not show on the P&L, so it is worth confirming with Sorren.</p>
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

/* ---------------- July/August detailed P&L ---------------- */
function renderPnlDetail(){
  const skipSections = new Set(["Other Income","Other Expenses"]);
  const rows = PNL_DETAIL.filter(r => !(r.type==="section" && skipSections.has(r.label)));

  function deltaCell(jul, aug){
    if (jul===null || aug===null || jul===undefined || aug===undefined) return `<td class="dash">—</td>`;
    const d = aug - jul;
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
    return `<tr class="${rowClass}"><td class="item">${r.label}</td>${moneyCell(r.jul)}${pctCell(r.jul_pct)}${moneyCell(r.aug)}${pctCell(r.aug_pct)}${deltaCell(r.jul, r.aug)}</tr>`;
  }).join("");

  const thead = `<thead><tr>
    <th>Line item</th>
    <th>Jul 2026</th><th>% of rev.</th>
    <th>Aug 2026</th><th>% of rev.</th>
    <th>Jul → Aug Δ</th>
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

/* ---------------- August actual vs. budget ---------------- */
function renderBudgetAug(){
  renderCompareTable("augBudgetTable", AUG_VS_BUDGET, ["Aug Budget","Aug Actual","Variance %"]);
  const f = l => findIn(AUG_VS_BUDGET,l);
  const rev=f("Total Revenue"), bev=f("Beverage Sales"), food=f("Food Sales"), cogs=f("Cost of Goods Sold"), gp=f("Gross Profit"), gpm=f("Gross Profit Margin");
  const pay=f("Payroll"), fin=f("Financial"), occ=f("Occupancy"), ops=f("Operations"), rep=f("Repairs & Maintenance"), sup=f("Supplies"), oth=f(OTHER);
  const tot=f("Total Expenses"), noi=f("Net Operating Income"), ni=f("Net Income"), nm=f("Net Margin");
  const aug = DATA[7];
  const jjaCogsPct = (DATA[5].cogs+DATA[6].cogs+DATA[7].cogs)/(DATA[5].revenue+DATA[6].revenue+DATA[7].revenue)*100;
  const budCogsPct = cogs.budget/rev.budget*100;
  const niAtBudgetCogs = ni.actual - (aug.revenue*budCogsPct/100 - cogs.actual);
  const mgmtWageGap = 17967.32 - 14842.32;
  const normPayroll = pay.actual + mgmtWageGap;
  document.getElementById("augBudgetNarrative").innerHTML = `
    <p><strong>August fell short of budget on profit — net income of ${fmt$(ni.actual)} was ${fmt$(Math.abs(ni.delta))} (${Math.abs(ni.growth).toFixed(1)}%) below the ${fmt$(ni.budget)} budget — even though gross margin beat plan.</strong> This replaces the earlier read of August as a 17% beat, which was based on an incomplete P&amp;L that was missing loan interest, gas &amp; electric, water &amp; sewage and janitorial. Net operating income was ${fmt$(Math.abs(noi.delta))} (${Math.abs(noi.growth).toFixed(1)}%) behind and net margin was ${nm.actual.toFixed(1)}% against a budgeted ${nm.budget.toFixed(1)}%.</p>
    <p><strong>Revenue was ${fmt$(Math.abs(rev.delta))} (${Math.abs(rev.growth).toFixed(1)}%) below budget, with the same mix shift seen all year.</strong> Beverage sales ran ${fmt$(bev.delta)} (+${bev.growth.toFixed(1)}%) ahead of budget while food sales were ${fmt$(Math.abs(food.delta))} (${Math.abs(food.growth).toFixed(1)}%) behind. Food is about 70% of sales, so the food shortfall is the real top-line gap; a budget that assumed more food and less beverage is also worth revisiting for the rest of the year.</p>
    <p><strong>The favorable COGS variance is the only thing that kept August close, and much of it looks like purchasing timing.</strong> Cost of goods sold came in ${fmt$(Math.abs(cogs.delta))} (${Math.abs(cogs.growth).toFixed(1)}%) under budget, lifting gross margin to ${gpm.actual.toFixed(1)}% against ${gpm.budget.toFixed(1)}% budgeted. But August liquor purchases were only $2,626 (6% of liquor sales versus 18% in July), and the June–August average COGS rate was ${jjaCogsPct.toFixed(1)}% — in line with the ${budCogsPct.toFixed(1)}% budget. If August had run at the budgeted COGS rate, net income would have been roughly ${fmt$(niAtBudgetCogs)}, about ${fmt$(ni.budget-niAtBudgetCogs)} below budget instead of ${fmt$(Math.abs(ni.delta))}.</p>
    <p><strong>Expenses ran ${fmt$(tot.delta)} (+${tot.growth.toFixed(1)}%) over budget, with payroll and two unbudgeted items the main drivers.</strong> Payroll of ${fmt$(pay.actual)} was ${fmt$(pay.delta)} (+${pay.growth.toFixed(1)}%) over its budget even though management wages were about ${fmt$(mgmtWageGap)} lower than usual (a manager was unpaid on the 8/20 payroll); on a normalized basis payroll would have been about ${fmt$(normPayroll)}, or ${(normPayroll/rev.actual*100).toFixed(1)}% of revenue against ${(pay.budget/rev.budget*100).toFixed(1)}% budgeted. Financial was ${fmt$(fin.delta)} (+${fin.growth.toFixed(1)}%) over, driven by ${fmt$(3636.44)} of SBA-loan interest and ${fmt$(7844.78)} of card fees, and Occupancy was ${fmt$(occ.delta)} (+${occ.growth.toFixed(1)}%) over now that utilities are recorded. The "Other" line of ${fmt$(oth.actual)} is ${fmt$(3169)} of property taxes plus ${fmt$(600)} of advertising &amp; marketing, neither of which has a budget category.</p>
    <p><strong>Savings in Supplies, Repairs &amp; Maintenance and Operations partly offset the overages.</strong> Supplies were ${fmt$(Math.abs(sup.delta))} (${Math.abs(sup.growth).toFixed(1)}%) under budget, Repairs &amp; Maintenance ${fmt$(Math.abs(rep.delta))} (${Math.abs(rep.growth).toFixed(1)}%) under (worth watching — deferring appliance work tends to come back as a larger repair), and Operations ${fmt$(Math.abs(ops.delta))} (${Math.abs(ops.growth).toFixed(1)}%) under; Operations now includes the management fee, so this comparison is on a like-for-like basis.</p>
  `;
}

/* ---------------- YTD actual vs. budget (+ tie-out to the balance sheet) ---------------- */
function renderBudget(){
  renderCompareTable("budgetTable", BUDGET_YTD, ["YTD Budget","YTD Actual","Variance %"]);
  const f = l => findIn(BUDGET_YTD,l);
  const rev=f("Total Revenue"), bev=f("Beverage Sales"), food=f("Food Sales"), cogs=f("Cost of Goods Sold"), gp=f("Gross Profit"), gpm=f("Gross Profit Margin");
  const pay=f("Payroll"), fin=f("Financial"), occ=f("Occupancy"), ops=f("Operations"), rep=f("Repairs & Maintenance"), sup=f("Supplies"), oth=f(OTHER);
  const tot=f("Total Expenses"), noi=f("Net Operating Income"), ni=f("Net Income"), nm=f("Net Margin");

  // tie-out to the August 31 balance sheet
  const stmtNI = sumKey("net_income");
  const origJanMay = DATA.slice(0,5).reduce((a,d)=>a+d.net_income,0);
  const restJanMay = Object.values(RESTATED_JAN_MAY).reduce((a,b)=>a+b,0);
  const restate = restJanMay - origJanMay;
  const feeEst = -(DATA[3].revenue + DATA[4].revenue)*0.05;
  const resid = BS_AUG.ytdNI - (stmtNI + restate + feeEst);
  const bsVar = BS_AUG.ytdNI - ni.budget;
  const augAug = AUG_VS_BUDGET.find(r=>r.label==="Cost of Goods Sold");
  const cogsExAug = cogs.delta - augAug.delta;
  const opsAdj = ops.delta - feeEst;   // feeEst is negative -> adds back
  const payPct = pay.actual/rev.actual*100, payBudPct = pay.budget/rev.budget*100;

  document.getElementById("budgetNarrative").innerHTML = `
    <p><strong>Year-to-date profit is well behind budget — ${fmt$(Math.abs(ni.delta))} (${Math.abs(ni.growth).toFixed(1)}%) behind on the monthly statements, and about ${fmt$(Math.abs(bsVar))} (${Math.abs(bsVar/ni.budget*100).toFixed(1)}%) behind on the balance-sheet basis.</strong> Net income of ${fmt$(ni.actual)} on the statements compares to a ${fmt$(ni.budget)} budget, and net margin of ${nm.actual.toFixed(1)}% to ${nm.budget.toFixed(1)}% budgeted. The prior version of this page showed a gap of only 7.1%; it widened because June–August now carry the 5% management fee and August is corrected. The tie-out below shows why the August 31 balance sheet (${fmt$(BS_AUG.ytdNI)}) is lower still.</p>
    <p><strong>Revenue is essentially on plan (${Math.abs(rev.growth).toFixed(1)}% below budget), masking a mix shift.</strong> Total revenue of ${fmt$(rev.actual)} against ${fmt$(rev.budget)} budgeted: beverage is ${fmt$(bev.delta)} (+${bev.growth.toFixed(1)}%) ahead while food is ${fmt$(Math.abs(food.delta))} (${Math.abs(food.growth).toFixed(1)}%) behind, so the profit gap is not a sales problem — it is a cost problem.</p>
    <p><strong>Gross margin matches plan (${gpm.actual.toFixed(1)}% vs. ${gpm.budget.toFixed(1)}%), but only because of August.</strong> COGS is ${fmt$(Math.abs(cogs.delta))} (${Math.abs(cogs.growth).toFixed(1)}%) under budget year to date; excluding August's favorable ${fmt$(Math.abs(augAug.delta))}, January–July was ${fmt$(cogsExAug)} over budget. Because August looks like purchasing timing (see the August page), this is the line most likely to give back some of its gain.</p>
    <p><strong>Payroll is the largest variance in the P&amp;L — larger than the entire net-income shortfall on the monthly statements.</strong> Actual payroll of ${fmt$(pay.actual)} is ${fmt$(pay.delta)} (+${pay.growth.toFixed(1)}%) over the ${fmt$(pay.budget)} budget, ${payPct.toFixed(1)}% of revenue against ${payBudPct.toFixed(1)}% budgeted. Financial is ${fmt$(fin.delta)} (+${fin.growth.toFixed(1)}%) over (card fees and, more recently, SBA-loan interest), Supplies ${fmt$(sup.delta)} (+${sup.growth.toFixed(1)}%) over, and Occupancy essentially on budget (+${occ.growth.toFixed(1)}%). The unbudgeted "Other" line adds ${fmt$(oth.actual)} (advertising &amp; marketing, property tax and miscellaneous entries). Combined, total expenses of ${fmt$(tot.actual)} are ${fmt$(tot.delta)} (+${tot.growth.toFixed(1)}%) over the ${fmt$(tot.budget)} budget.</p>
    <p><strong>The apparent savings in Operations are mostly a bookkeeping artifact.</strong> Operations is ${fmt$(Math.abs(ops.delta))} (${Math.abs(ops.growth).toFixed(1)}%) under budget, but the April and May statements carry no management fee (about ${fmt$(Math.abs(feeEst))} at 5% of revenue). Adding that back, Operations is within ${fmt$(Math.abs(opsAdj))} of budget — so there is no large offset to the payroll overage. Repairs &amp; Maintenance is genuinely under budget by ${fmt$(Math.abs(rep.delta))} (${Math.abs(rep.growth).toFixed(1)}%), which is worth monitoring for deferred work rather than banking as a saving.</p>
  `;

  const row = (lab, val, cls, strong) => `<tr class="${strong?"yoy-bold":""}"><td class="item">${lab}</td><td class="${cls||""}">${val<0?"-":""}${fmt$(Math.abs(val))}</td></tr>`;
  document.getElementById("tieoutTable").innerHTML = `<thead><tr><th>Net income, January–August 2026</th><th>Amount</th></tr></thead><tbody>
    ${row("Sum of the monthly statements used in this dashboard (Jan–May as originally issued; Jun–Aug from the corrected Jun–Aug package)", stmtNI, "", true)}
    ${row("Jan–May restatements in the later monthly packages (Jan −$768, Feb −$234, Mar −$2,080, Apr −$3,205, May −$2,785)", restate, restate<0?"neg":"pos")}
    ${row("Management fee not booked in the April and May statements (estimated at 5% of revenue: Apr "+fmt$(DATA[3].revenue*0.05)+" + May "+fmt$(DATA[4].revenue*0.05)+")", feeEst, "neg")}
    ${row("Remaining difference, not explained by the files provided", resid, resid<0?"neg":"pos")}
    ${row("Year-to-date net income per the August 31, 2026 balance sheet", BS_AUG.ytdNI, "", true)}
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

function augYoYNarrative(f){
  const rev=f("Total Revenue"), bev=f("Beverage Sales"), food=f("Food Sales"), cogs=f("Cost of Goods Sold"), gpm=f("Gross Profit Margin"), gp=f("Gross Profit");
  const fin=f("Financial"), occ=f("Occupancy"), ops=f("Operations"), pay=f("Payroll"), rep=f("Repairs & Maintenance"), sup=f("Supplies"), oth=f("Other (advertising, property tax, uncategorized)");
  const tot=f("Total Expenses"), noi=f("Net Operating Income"), ni=f("Net Income"), nm=f("Net Margin");
  const d = lab => legalDetail(FULL_YOY_AUG, lab);
  const cc=d("Credit Card Fees"), intr=d("Interest on Loan"), mw=d("Management Wages"), fo=findIn(FULL_YOY_AUG.filter(r=>r.type==="subtotal"),"Front of House Wages"), bart=d("Bartender Wages"), mg=d("Management"), liq=FULL_YOY_AUG.find(r=>r.type==="leaf"&&r.label==="Liquor"&&r.py===25071.25), beer=FULL_YOY_AUG.find(r=>r.type==="leaf"&&r.label==="Beer"&&r.py===14395.5);
  const niExCredit = ni.py - 4263.22;   // Aug-2025 NI without the uncategorized credit
  const flow = ni.delta/rev.delta*100;
  return `
    <p><strong>Revenue grew ${rev.growth.toFixed(1)}% year over year and net income more than tripled.</strong> August 2026 revenue of ${fmt$(rev.cy)} was up ${fmt$(rev.delta)} from ${fmt$(rev.py)} in August 2025, with food up ${food.growth.toFixed(1)}% and beverage up ${bev.growth.toFixed(1)}%. Liquor sales rose ${liq.growth.toFixed(1)}% while beer fell ${Math.abs(beer.growth).toFixed(1)}% — a shift toward cocktails and spirits. Net income rose from ${fmt$(ni.py)} to ${fmt$(ni.cy)} (+${ni.growth.toFixed(0)}%) and net margin from ${nm.py.toFixed(1)}% to ${nm.cy.toFixed(1)}%, so ${flow.toFixed(0)}¢ of every additional revenue dollar reached the bottom line.</p>
    <p><strong>Gross margin improved ${gpm.delta.toFixed(1)} points, but treat part of it as timing.</strong> COGS grew only ${cogs.growth.toFixed(1)}% against ${rev.growth.toFixed(1)}% revenue growth, lifting gross profit ${fmt$(gp.delta)} (+${gp.growth.toFixed(1)}%) and margin from ${gpm.py.toFixed(1)}% to ${gpm.cy.toFixed(1)}%. July 2026, in contrast, ran a ${(71028.45/248291.82*100).toFixed(1)}% COGS rate, so the June–August average (26.2%) is the better guide to the underlying level.</p>
    <p><strong>Payroll leverage did most of the work.</strong> Payroll rose only ${fmt$(pay.delta)} (+${pay.growth.toFixed(1)}%) against ${rev.growth.toFixed(1)}% revenue growth, falling from ${(pay.py/rev.py*100).toFixed(1)}% to ${(pay.cy/rev.cy*100).toFixed(1)}% of revenue. Management wages were down ${fmt$(Math.abs(mw.delta))} (a manager was unpaid on the 8/20 payroll, a one-time effect), while front-of-house wages rose ${fmt$(fo.delta)} (+${fo.growth.toFixed(1)}%, with bartender wages up ${bart.growth.toFixed(0)}%) and kitchen wages were flat. Occupancy was up ${fmt$(occ.delta)} (+${occ.growth.toFixed(1)}%) and Operations was essentially flat (+${fmt$(ops.delta)}), though the management fee grew ${fmt$(mg.delta)} (+${mg.growth.toFixed(1)}%) with sales.</p>
    <p><strong>Financial costs are the one category growing faster than revenue.</strong> Financial rose ${fmt$(fin.delta)} (+${fin.growth.toFixed(1)}%): ${fmt$(intr.cy)} of new SBA-loan interest (no loan a year ago), card fees up ${fmt$(cc.delta)} (+${cc.growth.toFixed(1)}%) with sales, partly offset by a ${fmt$(Math.abs(findIn(FULL_YOY_AUG.filter(r=>r.type==="leaf"),"Sales Tax Expense").delta))} swing in Sales Tax Expense, which is running as a credit and is an open question with the bookkeeper. Repairs &amp; Maintenance (${rep.growth.toFixed(1)}%) and Supplies (${sup.growth.toFixed(1)}%) were both lower.</p>
    <p><strong>Two comparison caveats flatter the year-over-year result.</strong> August 2025 included a ${fmt$(4263.22)} credit in "Uncategorized Expense (Income)"; without it, August 2025 net income would have been ${fmt$(niExCredit)} and the improvement even larger. In the other direction, the August 2025 management fee was an estimate (no invoice had been received) and August 2026 profit benefits from the one-time management-wage reduction and low COGS noted above, so a fair run-rate for August 2026 profit is below the reported figure (see the "Profit Opportunities" page).</p>
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
  const aug = DATA[7];
  const pay = findIn(BUDGET_YTD,"Payroll"), rev = findIn(BUDGET_YTD,"Total Revenue");
  const payPct = pay.actual/rev.actual*100, payBud = pay.budget/rev.budget*100;
  const mgmtWageGap = 17967.32-14842.32;
  const normPayPct = (aug.payroll+mgmtWageGap)/aug.revenue*100;
  const augPayBud = findIn(AUG_VS_BUDGET,"Payroll").budget/findIn(AUG_VS_BUDGET,"Total Revenue").budget*100;
  const jjaCogs = (DATA[5].cogs+DATA[6].cogs+DATA[7].cogs)/(DATA[5].revenue+DATA[6].revenue+DATA[7].revenue)*100;
  const cat = JJA.cat; const cr = k => cat[k].buy/cat[k].sales*100;
  const ccPct26 = JJA.cc26/JJA.rev26*100, ccPct25 = JJA.cc25/JJA.rev25*100;
  const dPct26 = JJA.disc26/JJA.rev26*100, dPct25 = JJA.disc25/JJA.rev25*100;
  const revGrowth = (JJA.rev26/JJA.rev25-1)*100, niDelta = JJA.ni26-JJA.ni25, flow = niDelta/(JJA.rev26-JJA.rev25)*100;
  const foodAnn = sumKey("food_sales")/n*12;
  const bwAnn = (cat.Beer.sales+cat.Wine.sales)*4;
  const sbaInterestYr = BS_AUG.sba*0.0875;

  // August quality-of-earnings (computed first so the KPI tile can use it)
  const cogsAdj = (jjaCogs - aug.cogs_pct)/100*aug.revenue;
  const adj = [
    ["Reported August net income", aug.net_income, true],
    ["Management wages below the usual run-rate (one-time, manager unpaid on the 8/20 payroll)", -mgmtWageGap],
    ["COGS rate below the Jun–Aug average ("+aug.cogs_pct+"% vs. "+jjaCogs.toFixed(1)+"%), if purchasing timing reverses", -cogsAdj],
    ["Sales Tax Expense credit (recurring credit; accuracy under review)", 1388.48*-1],
    ["Property tax installment (if periodic, not monthly)", 3169],
    ["Loan interest above a steady-state month (approx. $2,560)", 3636.44-sbaInterestYr/12],
  ];
  const total = adj.reduce((a,r)=>a+r[1],0);
  // KPI tiles
  const tiles = [
    {label:"Jun–Aug revenue vs. 2025", value:"+"+revGrowth.toFixed(1)+"%", delta:fmt$(JJA.rev26)+" vs. "+fmt$(JJA.rev25), cls:"up"},
    {label:"Jun–Aug net income vs. 2025", value:"+"+((JJA.ni26/JJA.ni25-1)*100).toFixed(0)+"%", delta:fmt$(JJA.ni26)+" vs. "+fmt$(JJA.ni25), cls:"up"},
    {label:"Flow-through on added revenue", value:flow.toFixed(0)+"¢", delta:"per extra $1 of sales (Jun–Aug, YoY)", cls:"up"},
    {label:"Aug margin, reported vs. run-rate", value:aug.net_margin.toFixed(1)+"%", delta:"≈ "+(total/aug.revenue*100).toFixed(1)+"% run-rate after normalizing (see below)", cls:"flat"},
  ];
  document.getElementById("oppKpis").innerHTML = tiles.map(t=>`<div class="kpi"><div class="label">${t.label}</div><div class="value">${t.value}</div><div class="delta ${t.cls}">${t.delta}</div></div>`).join("");

  document.getElementById("oppIntro").innerHTML = `
    <p><strong>The year's growth is real, and it is flowing through at a high rate.</strong> Over June–August, revenue grew ${revGrowth.toFixed(1)}% against 2025 and net income rose ${fmt$(niDelta)} — about ${flow.toFixed(0)}¢ of each added revenue dollar — because rent, management wages and bookkeeping were flat to down while payroll fell from ${(JJA.pay25/JJA.rev25*100).toFixed(1)}% to ${(JJA.pay26/JJA.rev26*100).toFixed(1)}% of revenue. The opportunities below are about protecting that flow-through: the biggest levers are labor scheduling, controlling the cost of goods, and the cost of money (card fees, SBA interest and idle cash). All sizing uses a conservative annual revenue base of about ${fmt$(annRev,true)} (the January–August monthly average × 12) and is illustrative, not a forecast.</p>`;

  const opp = [
    ["1. Flex payroll to sales",
     `YTD payroll is ${payPct.toFixed(1)}% of revenue against ${payBud.toFixed(1)}% budgeted (${fmt$(pay.delta)} over). August's ${aug.payroll_pct}% is flattered by about ${fmt$(mgmtWageGap)} of one-time lower management wages; normalized it is about ${normPayPct.toFixed(1)}% against an August budget of ${augPayBud.toFixed(1)}%. Year over year, front-of-house wages are up 15.8% (bartenders up 92%) while kitchen wages are flat.`,
     `Each 1 pt of revenue ≈ ${fmt$(onePt)}/yr. Closing half of the ${(normPayPct-augPayBud).toFixed(1)}-pt gap to budget ≈ ${fmt$((normPayPct-augPayBud)/2*onePt)}/yr. Start with schedules built to forecast covers by daypart, and a bar-staffing review.`],
    ["2. Make COGS a measured number, not a purchases number",
     `August COGS was ${aug.cogs_pct}% of revenue versus a ${jjaCogs.toFixed(1)}% June–August average and a ${(findIn(AUG_VS_BUDGET,"Cost of Goods Sold").budget/findIn(AUG_VS_BUDGET,"Total Revenue").budget*100).toFixed(1)}% budget; liquor purchases were 6% of liquor sales in August versus 18% in July. COGS appears to follow purchases month to month, so margin swings with ordering timing.`,
     `Each 1 pt of COGS ≈ ${fmt$(onePt)}/yr. Booking a bar and food inventory count every month makes the number trustworthy and surface over-pouring, waste and comps — worth more than the August "beat".`],
    ["3. Price and mix toward the high-margin categories",
     `Purchase cost as a share of sales (Jun–Aug): liquor ${cr("Liquor").toFixed(1)}%, N/A beverages ${cr("N/A beverages").toFixed(1)}%, beer ${cr("Beer").toFixed(1)}%, wine ${cr("Wine").toFixed(1)}%, food ${cr("Food").toFixed(1)}%. Liquor sales are up 69% year over year in August while beer is down 8%; food is the weakest line versus budget (${findIn(BUDGET_YTD,"Food Sales").growth.toFixed(1)}% YTD).`,
     `1% of net food price ≈ ${fmt$(foodAnn*0.01)}/yr; 3% on beer and wine ≈ ${fmt$(bwAnn*0.03)}/yr at the Jun–Aug run rate. Lean into the cocktail program, review beer and wine pricing and by-the-glass costs, and test price on top food sellers before adding promotions.`],
    ["4. Card processing and discounts",
     `Card fees were ${ccPct26.toFixed(2)}% of revenue in Jun–Aug versus ${ccPct25.toFixed(2)}% in 2025 (${fmt$(JJA.cc26)} for the quarter). Sales discounts were ${dPct26.toFixed(2)}% of revenue versus ${dPct25.toFixed(2)}% — improving, and ${fmt$(JJA.disc26)} for the quarter.`,
     `Each 0.25 pt of revenue ≈ ${fmt$(annRev*0.0025)}/yr on either line. Ask the processor for a rate review (interchange-plus pricing), and audit discount and comp codes and approvals; consider dual-pricing options only if consistent with brand and California rules.`],
    ["5. Put idle cash to work against the SBA loan",
     `Cash of ${fmt$(DATA[7].cash)} earned ${fmt$(2.27)} of interest in August, while the ${fmt$(BS_AUG.sba)} SBA loan (about prime + 2, roughly 8.75% per the distribution-policy file) cost ${fmt$(3636.44)} of interest in August and ${fmt$(JJA.interest26)} over Jun–Aug. Cash is about ${fmt$(DATA[7].cash-275000)} above the $275,000 minimum-checking floor in the distribution policy.`,
     `Each $100K applied to the loan saves about ${fmt$(100000*0.0875)}/yr of interest (confirm prepayment terms; keep the floor and upcoming distributions in mind); at minimum, sweep surplus cash to an interest-bearing account. Full loan carrying cost is about ${fmt$(sbaInterestYr)}/yr.`],
    ["6. Right-size the bookkeeping engagement",
     `Bookkeeping costs ${fmt$(3700)}/month (${fmt$(3700*12)}/yr), and the books still needed an August re-issue plus open items (inventory, sales-tax expense, event deposits). The September 3 review in this project estimated about ${fmt$(2270)}/month of the scope could be absorbed by a hybrid model.`,
     `≈ ${fmt$(2270*12)}/yr (planning estimate — validate with a parallel close before giving notice). Pair it with a standing close checklist so management fee, interest and utilities are booked every month.`],
    ["7. Spend growth dollars where each $1 earns ≈ $2",
     `Advertising &amp; promotion fell 80% year over year (${fmt$(259.76)} vs. ${fmt$(1330)}) even though food is behind budget and August revenue slipped 4.6% from July. With about ${flow.toFixed(0)}¢ of flow-through, each $1 of marketing needs roughly $${(100/flow).toFixed(2)} of added sales to break even.`,
     `Each additional $100K of annual revenue ≈ ${fmt$(flow*1000,true)} of profit. Target the weak spots: weekday food covers, off-peak dayparts, private events (the Event Deposits account shows the demand exists) and local-resident loyalty.`],
  ];
  document.getElementById("oppTable").innerHTML = `<thead><tr><th style="width:21%">Opportunity</th><th>What the data shows</th><th style="width:31%">Sizing and first step</th></tr></thead><tbody>${
    opp.map(o=>`<tr><td class="item"><strong>${o[0]}</strong></td><td class="item">${o[1]}</td><td class="item">${o[2]}</td></tr>`).join("")}</tbody>`;

  document.getElementById("oppAdjTable").innerHTML = `<thead><tr><th>August net income, illustrative run-rate</th><th>Amount</th></tr></thead><tbody>${
    adj.map(r=>`<tr class="${r[2]?"yoy-bold":""}"><td class="item">${r[0]}</td><td class="${r[1]<0&&!r[2]?"neg":(r[1]>0&&!r[2]?"pos":"")}">${r[1]<0?"-":(r[2]?"":"+")}${fmt$(Math.abs(r[1]))}</td></tr>`).join("")}
    <tr class="yoy-bold"><td class="item">Illustrative run-rate net income (${(total/aug.revenue*100).toFixed(1)}% margin on August revenue)</td><td>${fmt$(total)}</td></tr></tbody>`;

  // Biggest year-over-year cost movers (Aug 2026 vs Aug 2025)
  let sec=null, movers=[];
  FULL_YOY_AUG.forEach(r=>{ if(r.type==="section") sec=r.label; if(r.type==="leaf" && sec==="Expenses" && r.label!=="Uncategorized Expense (Income)"){ const py=r.py||0, cy=r.cy||0; movers.push({label:r.label, py, cy, d:cy-py}); } });
  movers.sort((a,b)=>b.d-a.d);
  const up = movers.slice(0,8);
  document.getElementById("oppMovers").innerHTML = `<thead><tr><th>Expense line</th><th>Aug 2025</th><th>Aug 2026</th><th>Change</th></tr></thead><tbody>${
    up.map(m=>`<tr><td class="item">${m.label}</td><td>${fmt$(m.py)}</td><td>${fmt$(m.cy)}</td><td class="neg">+${fmt$(m.d)}</td></tr>`).join("")}</tbody>`;

  document.getElementById("oppClean").innerHTML = `
    <p><strong>Close the books completely each month.</strong> The management fee (5% of revenue, about $12K a month) was missing from the original June and July statements and is still absent from April and May (about $21K); loan interest, gas &amp; electric, water &amp; sewage and janitorial were missing from the first August package. Until every month is booked on the same basis, month-to-month margins and budget variances are not reliable.</p>
    <p><strong>Resolve the open accounting questions that move profit.</strong> Sales Tax Expense has been running as a credit of roughly $1.4–1.7K a month (about $4.6K for June–August) — if it is mis-posted, profit is overstated by that amount. Also open: the $350,750 SBA loan documents, Event Deposits balance (currently negative), and an inventory count at each month-end.</p>
    <p><strong>Ask Sorren for a restated January–August P&amp;L.</strong> The August 31 balance sheet reports ${fmt$(BS_AUG.ytdNI)} of year-to-date net income, about ${fmt$(sumKey("net_income")-BS_AUG.ytdNI)} below the sum of the monthly statements; one consistent year-to-date P&amp;L would let this dashboard replace the tie-out with a single source.</p>`;
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
renderBudgetAug();
renderYoYSummary("augYoyTable","augYoyNarrative",YOY_SUM_AUG,"Aug 2025","Aug 2026",augYoYNarrative);
renderFullYoyDetail("augYoyDetailTable", FULL_YOY_AUG, "Aug 2025", "Aug 2026");
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
