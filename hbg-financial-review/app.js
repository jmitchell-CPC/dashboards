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

/* ---------------- constants taken directly from the September 2026 package ---------------- */
// Balance sheet at Sep 30, 2026 vs. Dec 31, 2025 (BS 09.26, "PP" comparative column)
const BS_SEP = {cash:371716.67, cashDec:121685.05, ap:95058.96, apDec:128797.77, sba:350000, equity:-3649.44, ytdNI:128948.20, leasehold:124506.20, leaseholdDec:56513, aug:{cash:375097.15, equity:11255.42, ytdNI:108853.06}};
// Net income for Jan–May as restated in the later monthly packages (Jan: Mar pkg, Feb: Apr pkg, Mar: May pkg, Apr: Jun pkg, May: Jul pkg)
const RESTATED_JAN_MAY = {Jan:-16299.34, Feb:-6320.84, Mar:11977.17, Apr:-2387.17, May:41484.49};
// Q3 totals (2026 package vs. 2025 package), used for the profit-opportunity sizing
const Q3 = {
  rev26:719539.88, rev25:552661.55, ni26:84037.18, ni25:40006.15,
  cc26:23724.32, cc25:17378.12, disc26:19377.62, disc25:16783.53,
  cogs26:185968.68, cogs25:139241.78, pay26:230039.61, pay25:210920.43,
  bookkeeping26:11100, interest26:9045.18,
  cat:{ // 2026 Q3 sales vs. purchases by category
    Liquor:{sales:122427.50, buy:11508.83}, "N/A beverages":{sales:24410.00, buy:3575.97},
    Beer:{sales:47606.75, buy:14047.48}, Wine:{sales:45833.00, buy:13589.04},
    Food:{sales:498490.25, buy:143247.36}
  }
};
const MONTH_FULL = {Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May',Jun:'June',Jul:'July',Aug:'August',Sep:'September'};
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
    {label:"Total revenue (Jan–Sep)", value: fmt$(totalRev), delta: "+"+revGrowth.toFixed(1)+"% Jan → Sep", cls:"up"},
    {label:"Total net income (Jan–Sep)", value: fmt$(totalNI), delta: "Sep 30 balance sheet shows "+fmt$(BS_SEP.ytdNI)+" — see tie-out", cls:"down"},
    {label:"Cash on hand (Sep 30)", value: fmt$(last.cash), delta: fmtPct(cashDelta) + " since January (SBA-loan funded)", cls: cashDelta>=0?"up":"down"},
    {label:"Net margin (Jan–Sep blended)", value: avgMargin.toFixed(1)+"%", delta: "Peak "+bestM.net_margin.toFixed(1)+"% in "+MONTH_FULL[bestM.month]+"; Sep "+last.net_margin.toFixed(1)+"%", cls: avgMargin>=0?"up":"down"},
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
  const jan = DATA[0], jun = DATA[5], jul = DATA[6], aug = DATA[7], sep = DATA[8];
  const revGrowth = (sep.revenue/jan.revenue-1)*100;
  const sepVsAug = (sep.revenue/aug.revenue-1)*100;
  const totNI = sumKey("net_income"), totRev = sumKey("revenue");
  const peak = DATA.reduce((a,b)=> b.revenue>a.revenue?b:a);
  const netOfLoan = sep.cash - BS_SEP.sba, netOfLoanDec = BS_SEP.cashDec;
  const el = document.getElementById("narrative");
  el.innerHTML = `
    <p><strong>Revenue is up ${revGrowth.toFixed(1)}% since January, but it has now eased for two straight months.</strong> Total revenue rose from ${fmt$(jan.revenue)} in January to ${fmt$(sep.revenue)} in September, peaking at ${fmt$(peak.revenue)} in ${MONTH_FULL[peak.month]}; September came in ${Math.abs(sepVsAug).toFixed(1)}% below August, which was itself ${Math.abs((aug.revenue/jul.revenue-1)*100).toFixed(1)}% below the prior month. Food and beverage both scaled through the spring; beverage has run ahead of budget and food behind it (see the budget pages).</p>
    <p><strong>September was the weakest profit month since April, even though revenue held close to plan.</strong> HBG lost ${fmt$(Math.abs(jan.net_income))} in January and ${fmt$(Math.abs(DATA[1].net_income))} in February, then was profitable every month from March on. Net income was ${fmt$(aug.net_income)} in August (${aug.net_margin}% margin) and ${fmt$(sep.net_income)} in September (${sep.net_margin}%), compared with ${fmt$(jun.net_income)} in June (${jun.net_margin}%). The September drop came from costs, not sales: supplies (${fmt$(sep.supplies)}), repairs &amp; maintenance (${fmt$(sep.repairs)}), and a higher food-cost rate (${sep.cogs_pct}% vs. ${aug.cogs_pct}% in August). Total January–September net income on the statements is ${fmt$(totNI)} (${(totNI/totRev*100).toFixed(1)}% margin); the September 30 balance sheet reports ${fmt$(BS_SEP.ytdNI)} year to date, which is reconciled on the "YTD vs. Budget" page.</p>
    <p><strong>Payroll leverage is still the main driver of the improvement.</strong> Payroll stayed roughly flat in dollar terms (about ${fmt$(Math.min(...DATA.map(d=>d.payroll)),true)}–${fmt$(Math.max(...DATA.map(d=>d.payroll)),true)} a month) while revenue grew, so it fell from ${jan.payroll_pct}% of revenue in January to ${sep.payroll_pct}% in September. It is also the line furthest over budget, which is why it leads the profit opportunities on the "Profit Opportunities" page.</p>
    <p><strong>Cash is up sharply, but it is loan-funded rather than earned.</strong> Cash on hand rose from ${fmt$(jan.cash)} at the end of January to ${fmt$(sep.cash)} at the end of September, but the balance sheet carries a ${fmt$(BS_SEP.sba)} SBA loan that did not exist at December 31, 2025 — net of that loan, cash is about ${fmt$(netOfLoan)} versus ${fmt$(netOfLoanDec)} at year-end. Cash slipped ${fmt$(Math.abs(sep.cash_chg))} in September, the first monthly decline since February, even though the month was profitable. Accounts payable ticked up ${fmt$(sep.ap-aug.ap)} to ${fmt$(sep.ap)}.</p>
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

/* ---------------- August/September detailed P&L ---------------- */
function renderPnlDetail(){
  const skipSections = new Set(["Other Income","Other Expenses"]);
  const rows = PNL_DETAIL.filter(r => !(r.type==="section" && skipSections.has(r.label)));

  function deltaCell(aug, sep){
    if (aug===null || sep===null || aug===undefined || sep===undefined) return `<td class="dash">—</td>`;
    const d = sep - aug;
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
    return `<tr class="${rowClass}"><td class="item">${r.label}</td>${moneyCell(r.aug)}${pctCell(r.aug_pct)}${moneyCell(r.sep)}${pctCell(r.sep_pct)}${deltaCell(r.aug, r.sep)}</tr>`;
  }).join("");

  const thead = `<thead><tr>
    <th>Line item</th>
    <th>Aug 2026</th><th>% of rev.</th>
    <th>Sep 2026</th><th>% of rev.</th>
    <th>Aug → Sep Δ</th>
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

/* ---------------- September actual vs. budget ---------------- */
function renderBudgetSep(){
  renderCompareTable("sepBudgetTable", SEP_VS_BUDGET, ["Sep Budget","Sep Actual","Variance %"]);
  const f = l => findIn(SEP_VS_BUDGET,l);
  const rev=f("Total Revenue"), bev=f("Beverage Sales"), food=f("Food Sales"), cogs=f("Cost of Goods Sold"), gp=f("Gross Profit"), gpm=f("Gross Profit Margin");
  const pay=f("Payroll"), fin=f("Financial"), occ=f("Occupancy"), ops=f("Operations"), rep=f("Repairs & Maintenance"), sup=f("Supplies"), oth=f(OTHER);
  const tot=f("Total Expenses"), noi=f("Net Operating Income"), ni=f("Net Income"), nm=f("Net Margin");
  const sep = DATA[8], aug = DATA[7];
  const q3CogsPct = (DATA[6].cogs+DATA[7].cogs+DATA[8].cogs)/(DATA[6].revenue+DATA[7].revenue+DATA[8].revenue)*100;
  const budCogsPct = cogs.budget/rev.budget*100;
  // hourly (front-of-house + kitchen) vs. salaried (management wages + bonuses), September budget vs. actual
  const hourlyAct = 19127.02+25031.62, hourlyBud = 13365+22264;
  const mgmtAct = 16284.63+200, mgmtBud = 18333+1666.67;
  const loanInt = 3636.44, budInt = 2080.53;
  const finExInt = fin.actual - loanInt;
  const niAtQ3Cogs = ni.actual - (q3CogsPct/100*sep.revenue - cogs.actual);
  document.getElementById("sepBudgetNarrative").innerHTML = `
    <p><strong>September missed budget on profit by a wide margin — net income of ${fmt$(ni.actual)} was ${fmt$(Math.abs(ni.delta))} (${Math.abs(ni.growth).toFixed(1)}%) below the ${fmt$(ni.budget)} budget — even though revenue landed within ${Math.abs(rev.growth).toFixed(1)}% of plan.</strong> Net margin was ${nm.actual.toFixed(1)}% against a budgeted ${nm.budget.toFixed(1)}%. This was a cost month: total expenses of ${fmt$(tot.actual)} ran ${fmt$(tot.delta)} (+${tot.growth.toFixed(1)}%) over the ${fmt$(tot.budget)} budget, and gross profit was only ${fmt$(Math.abs(gp.delta))} short. (Net income is the cleanest comparison: the budget carries about ${fmt$(budInt)} a month of loan interest below operating income, while the statements book actual loan interest inside Financial, so the operating-income variance of ${fmt$(Math.abs(noi.delta))} is overstated by roughly that amount.)</p>
    <p><strong>Revenue was ${fmt$(Math.abs(rev.delta))} (${Math.abs(rev.growth).toFixed(1)}%) below budget, with the same mix shift seen all year.</strong> Beverage sales ran ${fmt$(bev.delta)} (+${bev.growth.toFixed(1)}%) ahead of budget while food sales were ${fmt$(Math.abs(food.delta))} (${Math.abs(food.growth).toFixed(1)}%) behind. Food is about two-thirds of sales, so the food shortfall is the real top-line gap; a budget that assumed more food and less beverage is worth revisiting for the rest of the year.</p>
    <p><strong>Cost of goods sold was close to plan, and no longer flatters the result.</strong> COGS came in ${fmt$(cogs.delta)} (+${cogs.growth.toFixed(1)}%) over budget at ${sep.cogs_pct}% of revenue against ${budCogsPct.toFixed(1)}% budgeted, so gross margin was ${gpm.actual.toFixed(1)}% against ${gpm.budget.toFixed(1)}%. August's ${aug.cogs_pct}% looked favorable and September gave part of it back; the third-quarter average is ${q3CogsPct.toFixed(1)}%, still above budget. At that quarterly average, September net income would have been roughly ${fmt$(niAtQ3Cogs)}.</p>
    <p><strong>Four lines explain most of the miss.</strong> <em>Supplies</em> were ${fmt$(sup.delta)} (+${sup.growth.toFixed(0)}%) over budget, led by operating supplies ($7,805 vs. $3,544 budgeted), office supplies ($2,671 vs. $146) and $3,229 of small equipment &amp; furniture that was not budgeted — some of that may belong on the balance sheet as equipment. <em>Payroll</em> was ${fmt$(pay.delta)} (+${pay.growth.toFixed(1)}%) over, ${(pay.actual/rev.actual*100).toFixed(1)}% of revenue against ${(pay.budget/rev.budget*100).toFixed(1)}% budgeted: hourly front-of-house and kitchen wages were about ${fmt$(hourlyAct-hourlyBud)} over budget, partly offset by management wages and bonuses about ${fmt$(mgmtBud-mgmtAct)} under. <em>Repairs &amp; Maintenance</em> were ${fmt$(rep.delta)} (+${rep.growth.toFixed(0)}%) over on a $4,825 building repair against a $1,181 monthly budget. <em>Operations</em> were ${fmt$(ops.delta)} (+${ops.growth.toFixed(1)}%) over, from $1,124 of equipment rental, higher dues &amp; subscriptions and bookkeeping of $3,700 against $3,465 budgeted; the management fee itself was on budget.</p>
    <p><strong>Occupancy and Financial were modestly over.</strong> Occupancy was ${fmt$(occ.delta)} (+${occ.growth.toFixed(1)}%) over, mainly water &amp; sewage ($2,969 vs. $1,158 budgeted); rent was on budget. Financial was ${fmt$(fin.delta)} (+${fin.growth.toFixed(1)}%) over only because it includes ${fmt$(loanInt)} of SBA-loan interest that the budget carries elsewhere — excluding it, Financial was ${fmt$(Math.abs(finExInt-fin.budget))} <em>under</em> budget, helped by a ${fmt$(1348.18)} Sales Tax Expense credit and a cash-over/short gain, both of which are worth confirming with the bookkeeper. The "Other" line of ${fmt$(oth.actual)} is ${fmt$(600)} of advertising &amp; marketing plus ${fmt$(93.15)} of meals, neither of which has a budget category.</p>
  `;
}

/* ---------------- YTD actual vs. budget (+ tie-out to the balance sheet) ---------------- */
function renderBudget(){
  renderCompareTable("budgetTable", BUDGET_YTD, ["YTD Budget","YTD Actual","Variance %"]);
  const f = l => findIn(BUDGET_YTD,l);
  const rev=f("Total Revenue"), bev=f("Beverage Sales"), food=f("Food Sales"), cogs=f("Cost of Goods Sold"), gp=f("Gross Profit"), gpm=f("Gross Profit Margin");
  const pay=f("Payroll"), fin=f("Financial"), occ=f("Occupancy"), ops=f("Operations"), rep=f("Repairs & Maintenance"), sup=f("Supplies"), oth=f(OTHER);
  const tot=f("Total Expenses"), noi=f("Net Operating Income"), ni=f("Net Income"), nm=f("Net Margin");

  // tie-out to the September 30 balance sheet
  const stmtNI = sumKey("net_income");
  const origJanMay = DATA.slice(0,5).reduce((a,d)=>a+d.net_income,0);
  const restJanMay = Object.values(RESTATED_JAN_MAY).reduce((a,b)=>a+b,0);
  const restate = restJanMay - origJanMay;
  const feeEst = -(DATA[3].revenue + DATA[4].revenue)*0.05;
  const resid = BS_SEP.ytdNI - (stmtNI + restate + feeEst);
  const bsVar = BS_SEP.ytdNI - ni.budget;
  const sepCogs = findIn(SEP_VS_BUDGET,"Cost of Goods Sold");
  const augCogsDelta = DATA[7].cogs - 63621.19;                 // August COGS vs. August budget (restated August actual)
  const cogsExAugSep = cogs.delta - augCogsDelta - sepCogs.delta;   // variance excluding Aug and Sep
  const opsAdj = ops.delta - feeEst;   // feeEst is negative -> adds back
  const payPct = pay.actual/rev.actual*100, payBudPct = pay.budget/rev.budget*100;
  const bsNiSep = BS_SEP.ytdNI - BS_SEP.aug.ytdNI;               // September net income implied by the balance sheet
  const loanIntYtd = 18697.30;                                    // budgeted Jan–Sep interest expense (carried below operating income)

  document.getElementById("budgetNarrative").innerHTML = `
    <p><strong>Year-to-date profit is well behind budget — ${fmt$(Math.abs(ni.delta))} (${Math.abs(ni.growth).toFixed(1)}%) behind on the monthly statements, and about ${fmt$(Math.abs(bsVar))} (${Math.abs(bsVar/ni.budget*100).toFixed(1)}%) behind on the balance-sheet basis.</strong> Net income of ${fmt$(ni.actual)} on the statements compares to a ${fmt$(ni.budget)} budget, and net margin of ${nm.actual.toFixed(1)}% to ${nm.budget.toFixed(1)}% budgeted. September added to the gap (${fmt$(Math.abs(findIn(SEP_VS_BUDGET,"Net Income").delta))} behind budget in the month), and the tie-out below shows why the September 30 balance sheet (${fmt$(BS_SEP.ytdNI)}) is lower still. Net income is the cleanest comparison: the budget carries about ${fmt$(loanIntYtd)} of year-to-date loan interest below operating income, while the statements book actual loan interest inside Financial.</p>
    <p><strong>Revenue is essentially on plan (${Math.abs(rev.growth).toFixed(1)}% below budget), masking a mix shift.</strong> Total revenue of ${fmt$(rev.actual)} against ${fmt$(rev.budget)} budgeted: beverage is ${fmt$(bev.delta)} (+${bev.growth.toFixed(1)}%) ahead while food is ${fmt$(Math.abs(food.delta))} (${Math.abs(food.growth).toFixed(1)}%) behind, so the profit gap is not a sales problem — it is a cost problem.</p>
    <p><strong>Gross margin matches plan (${gpm.actual.toFixed(1)}% vs. ${gpm.budget.toFixed(1)}%), but the cushion is shrinking.</strong> COGS is ${fmt$(Math.abs(cogs.delta))} (${Math.abs(cogs.growth).toFixed(1)}%) under budget year to date, yet excluding August and September, COGS was ${fmt$(Math.abs(cogsExAugSep))} ${cogsExAugSep>=0?"over":"under"} budget, and the favorable variance came from August (${fmt$(Math.abs(augCogsDelta))} under, which looks like purchasing timing); September came in ${fmt$(sepCogs.delta)} over. Monthly inventory counts would show whether the underlying food-cost rate is on plan.</p>
    <p><strong>Payroll is the largest variance in the P&amp;L — and, together with supplies, larger than the entire net-income shortfall.</strong> Actual payroll of ${fmt$(pay.actual)} is ${fmt$(pay.delta)} (+${pay.growth.toFixed(1)}%) over the ${fmt$(pay.budget)} budget, ${payPct.toFixed(1)}% of revenue against ${payBudPct.toFixed(1)}% budgeted. Supplies are ${fmt$(sup.delta)} (+${sup.growth.toFixed(1)}%) over (${fmt$(findIn(SEP_VS_BUDGET,"Supplies").delta)} of it in September alone), Financial is ${fmt$(fin.delta)} (+${fin.growth.toFixed(1)}%) over (card fees and SBA-loan interest), and Occupancy is essentially on budget (+${occ.growth.toFixed(1)}%). The unbudgeted "Other" line adds ${fmt$(oth.actual)} (advertising &amp; marketing, property tax and miscellaneous entries). Combined, total expenses of ${fmt$(tot.actual)} are ${fmt$(tot.delta)} (+${tot.growth.toFixed(1)}%) over the ${fmt$(tot.budget)} budget.</p>
    <p><strong>The apparent savings in Operations are mostly a bookkeeping artifact.</strong> Operations is ${fmt$(Math.abs(ops.delta))} (${Math.abs(ops.growth).toFixed(1)}%) under budget, but the April and May statements carry no management fee (about ${fmt$(Math.abs(feeEst))} at 5% of revenue). Adding that back, Operations is within ${fmt$(Math.abs(opsAdj))} of budget — so there is no large offset to the payroll overage. Repairs &amp; Maintenance is still ${fmt$(Math.abs(rep.delta))} (${Math.abs(rep.growth).toFixed(1)}%) under budget, but September's building repair used up nearly half of the earlier cushion.</p>
  `;

  const row = (lab, val, cls, strong) => `<tr class="${strong?"yoy-bold":""}"><td class="item">${lab}</td><td class="${cls||""}">${val<0?"-":""}${fmt$(Math.abs(val))}</td></tr>`;
  document.getElementById("tieoutTable").innerHTML = `<thead><tr><th>Net income, January–September 2026</th><th>Amount</th></tr></thead><tbody>
    ${row("Sum of the monthly statements used in this dashboard (Jan–May as originally issued; Jun–Sep from the corrected quarterly packages)", stmtNI, "", true)}
    ${row("Jan–May restatements in the later monthly packages (Jan −$768, Feb −$234, Mar −$2,080, Apr −$3,205, May −$2,785)", restate, restate<0?"neg":"pos")}
    ${row("Management fee not booked in the April and May statements (estimated at 5% of revenue: Apr "+fmt$(DATA[3].revenue*0.05)+" + May "+fmt$(DATA[4].revenue*0.05)+")", feeEst, "neg")}
    ${row("Remaining difference, not explained by the files provided (September alone: statement "+fmt$(DATA[8].net_income)+" vs. "+fmt$(bsNiSep)+" implied by the balance sheet)", resid, resid<0?"neg":"pos")}
    ${row("Year-to-date net income per the September 30, 2026 balance sheet", BS_SEP.ytdNI, "", true)}
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

function sepYoYNarrative(f){
  const rev=f("Total Revenue"), bev=f("Beverage Sales"), food=f("Food Sales"), cogs=f("Cost of Goods Sold"), gpm=f("Gross Profit Margin"), gp=f("Gross Profit");
  const fin=f("Financial"), occ=f("Occupancy"), ops=f("Operations"), pay=f("Payroll"), rep=f("Repairs & Maintenance"), sup=f("Supplies");
  const tot=f("Total Expenses"), noi=f("Net Operating Income"), ni=f("Net Income"), nm=f("Net Margin");
  const d = lab => legalDetail(FULL_YOY_SEP, lab);
  const cc=d("Credit Card Fees"), intr=d("Interest on Loan"), mw=d("Management Wages"), fo=findIn(FULL_YOY_SEP.filter(r=>r.type==="subtotal"),"Front of House Wages"), bart=d("Bartender Wages"), mg=d("Management"), stx=d("Sales Tax Expense");
  const liq=FULL_YOY_SEP.find(r=>r.type==="leaf"&&r.label==="Liquor"&&r.py===21171.01), beer=FULL_YOY_SEP.find(r=>r.type==="leaf"&&r.label==="Beer"&&r.py===14449);
  const flow = ni.delta/rev.delta*100;
  const q3g = (Q3.rev26/Q3.rev25-1)*100;
  return `
    <p><strong>Revenue grew ${rev.growth.toFixed(1)}% year over year and net income rose from almost nothing to a solid profit — but September 2025 was an unusually weak comparison month.</strong> September 2026 revenue of ${fmt$(rev.cy)} was up ${fmt$(rev.delta)} from ${fmt$(rev.py)} in September 2025, with food up ${food.growth.toFixed(1)}% and beverage up ${bev.growth.toFixed(1)}%. Liquor sales more than doubled (+${liq.growth.toFixed(0)}%) while beer grew only ${beer.growth.toFixed(1)}% — a continued shift toward cocktails and spirits. Net income rose from ${fmt$(ni.py)} (a ${nm.py.toFixed(1)}% margin) to ${fmt$(ni.cy)} (${nm.cy.toFixed(1)}%), so ${flow.toFixed(0)}¢ of every additional revenue dollar reached the bottom line, in line with the roughly ${((Q3.ni26-Q3.ni25)/(Q3.rev26-Q3.rev25)*100).toFixed(0)}¢ for the third quarter as a whole. Because September 2025 revenue fell about 18% from August 2025 while September 2026 slipped only 1%, the quarter is the fairer yardstick: third-quarter revenue is up ${q3g.toFixed(1)}% and net income is ${fmt$(Q3.ni26)} versus ${fmt$(Q3.ni25)}.</p>
    <p><strong>Gross margin improved ${gpm.delta.toFixed(1)} points, a smaller gain than in August.</strong> COGS grew ${cogs.growth.toFixed(1)}% against ${rev.growth.toFixed(1)}% revenue growth, lifting gross profit ${fmt$(gp.delta)} (+${gp.growth.toFixed(1)}%) and margin from ${gpm.py.toFixed(1)}% to ${gpm.cy.toFixed(1)}%. Compared with August 2026's 76.5%, September's food-cost rate moved back toward the quarterly level of ${(Q3.cogs26/Q3.rev26*100).toFixed(1)}% COGS, which supports treating August as the outlier.</p>
    <p><strong>Payroll leverage still did most of the work, but it was less than the sales growth would suggest.</strong> Payroll rose only ${fmt$(pay.delta)} (+${pay.growth.toFixed(1)}%) against ${rev.growth.toFixed(1)}% revenue growth, falling from ${(pay.py/rev.py*100).toFixed(1)}% to ${(pay.cy/rev.cy*100).toFixed(1)}% of revenue. Management wages were down ${fmt$(Math.abs(mw.delta))} (${Math.abs(mw.growth).toFixed(1)}%) and kitchen wages rose just 5%, while front-of-house wages rose ${fmt$(fo.delta)} (+${fo.growth.toFixed(1)}%, with bartender wages up ${bart.growth.toFixed(0)}%). Sick pay (+$1,116), workers' comp ($1,079, none a year ago) and employee healthcare (+$859) added to the total. Occupancy was up ${fmt$(occ.delta)} (+${occ.growth.toFixed(1)}%), mostly water &amp; sewage (+$1,836), and the management fee rose ${fmt$(mg.delta)} (+${mg.growth.toFixed(1)}%) with sales.</p>
    <p><strong>Supplies, repairs and financial costs grew faster than revenue.</strong> Supplies rose ${fmt$(sup.delta)} (+${sup.growth.toFixed(0)}%), including $3,229 of small equipment &amp; furniture and $2,670 of office supplies; Repairs &amp; Maintenance rose ${fmt$(rep.delta)} on a $4,825 building repair. Financial rose ${fmt$(fin.delta)} (+${fin.growth.toFixed(1)}%): ${fmt$(intr.cy)} of SBA-loan interest (no loan a year ago) and card fees up ${fmt$(cc.delta)} (+${cc.growth.toFixed(1)}%), partly offset by a ${fmt$(Math.abs(stx.delta))} credit in Sales Tax Expense that is an open question with the bookkeeper. Total expenses rose ${fmt$(tot.delta)} (+${tot.growth.toFixed(1)}%) against ${rev.growth.toFixed(1)}% revenue growth.</p>
    <p><strong>Comparison caveats.</strong> Both years' September statements now carry a management fee (5% of revenue), so that line is comparable. Several September 2026 items are lumpy or one-time in nature (the building repair, small equipment, office supplies), and the Sales Tax Expense credit and cash over/short gain flatter the month, so a fair run-rate for September 2026 profit differs from the reported figure (see the "Profit Opportunities" page).</p>
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
  const sep = DATA[8], aug = DATA[7];
  const pay = findIn(BUDGET_YTD,"Payroll"), rev = findIn(BUDGET_YTD,"Total Revenue");
  const payPct = pay.actual/rev.actual*100, payBud = pay.budget/rev.budget*100;
  const sepPayBud = findIn(SEP_VS_BUDGET,"Payroll").budget/findIn(SEP_VS_BUDGET,"Total Revenue").budget*100;
  const q3Cogs = Q3.cogs26/Q3.rev26*100;
  const sepCogsBud = findIn(SEP_VS_BUDGET,"Cost of Goods Sold").budget/findIn(SEP_VS_BUDGET,"Total Revenue").budget*100;
  const cat = Q3.cat; const cr = k => cat[k].buy/cat[k].sales*100;
  const ccPct26 = Q3.cc26/Q3.rev26*100, ccPct25 = Q3.cc25/Q3.rev25*100;
  const dPct26 = Q3.disc26/Q3.rev26*100, dPct25 = Q3.disc25/Q3.rev25*100;
  const revGrowth = (Q3.rev26/Q3.rev25-1)*100, niDelta = Q3.ni26-Q3.ni25, flow = niDelta/(Q3.rev26-Q3.rev25)*100;
  const foodAnn = sumKey("food_sales")/n*12;
  const bwAnn = (cat.Beer.sales+cat.Wine.sales)*4;
  const sbaInterestYr = BS_SEP.sba*0.0875;
  const loanRate = 3636.44*12/BS_SEP.sba*100;

  // September quality-of-earnings (computed first so the KPI tile can use it)
  const cogsAdj = (q3Cogs - sep.cogs_pct)/100*sep.revenue;
  const adj = [
    ["Reported September net income", sep.net_income, true],
    ["Small equipment &amp; furniture purchases (new line; may be capital items)", 3229.16],
    ["Building repair above the $1,181 monthly budget (appears to be a one-off job)", 4824.99-1181.25],
    ["Office supplies above the $146 monthly budget", 2670.99-146.37],
    ["COGS rate below the Q3 average ("+sep.cogs_pct+"% vs. "+q3Cogs.toFixed(1)+"%), if purchasing timing reverses", -cogsAdj],
    ["Sales Tax Expense credit (recurring credit; accuracy under review)", -1348.18],
    ["Loan interest above a steady-state month (approx. $2,550 at 8.75%)", 3636.44-sbaInterestYr/12],
  ];
  const total = adj.reduce((a,r)=>a+r[1],0);
  // KPI tiles
  const tiles = [
    {label:"Q3 revenue vs. 2025", value:"+"+revGrowth.toFixed(1)+"%", delta:fmt$(Q3.rev26)+" vs. "+fmt$(Q3.rev25), cls:"up"},
    {label:"Q3 net income vs. 2025", value:"+"+((Q3.ni26/Q3.ni25-1)*100).toFixed(0)+"%", delta:fmt$(Q3.ni26)+" vs. "+fmt$(Q3.ni25), cls:"up"},
    {label:"Flow-through on added revenue", value:flow.toFixed(0)+"¢", delta:"per extra $1 of sales (Q3, YoY)", cls:"up"},
    {label:"Sep margin, reported vs. run-rate", value:sep.net_margin.toFixed(1)+"%", delta:"≈ "+(total/sep.revenue*100).toFixed(1)+"% run-rate after normalizing (see below)", cls:"flat"},
  ];
  document.getElementById("oppKpis").innerHTML = tiles.map(t=>`<div class="kpi"><div class="label">${t.label}</div><div class="value">${t.value}</div><div class="delta ${t.cls}">${t.delta}</div></div>`).join("");

  document.getElementById("oppIntro").innerHTML = `
    <p><strong>The year's growth is real, but the rate at which it reaches profit is lower than the last review showed.</strong> Over the third quarter, revenue grew ${revGrowth.toFixed(1)}% against 2025 and net income rose ${fmt$(niDelta)} — about ${flow.toFixed(0)}¢ of each added revenue dollar, down from roughly 48¢ in the June–August window reviewed last month, because September's supplies, repairs and payroll costs rose faster than sales. Payroll still fell from ${(Q3.pay25/Q3.rev25*100).toFixed(1)}% to ${(Q3.pay26/Q3.rev26*100).toFixed(1)}% of revenue, while rent was flat. The opportunities below are about protecting and rebuilding that flow-through: the biggest levers are labor scheduling, controlling the cost of goods and discretionary supplies, and the cost of money (card fees, SBA interest and idle cash). All sizing uses a conservative annual revenue base of about ${fmt$(annRev,true)} (the January–September monthly average × 12) and is illustrative, not a forecast.</p>`;

  const opp = [
    ["1. Flex payroll to sales",
     `YTD payroll is ${payPct.toFixed(1)}% of revenue against ${payBud.toFixed(1)}% budgeted (${fmt$(pay.delta)} over). September's ${sep.payroll_pct}% compares with a ${sepPayBud.toFixed(1)}% September budget; hourly front-of-house and kitchen wages were about $8,500 over budget while management wages ran about $3,500 under. Year over year, front-of-house wages are up 27.7% in September (bartenders up 127%) while kitchen wages rose 5%.`,
     `Each 1 pt of revenue ≈ ${fmt$(onePt)}/yr. Closing half of the ${(sep.payroll_pct-sepPayBud).toFixed(1)}-pt gap to the September budget ≈ ${fmt$((sep.payroll_pct-sepPayBud)/2*onePt)}/yr. Start with schedules built to forecast covers by daypart, and a bar-staffing review.`],
    ["2. Make COGS a measured number, not a purchases number",
     `COGS was ${sep.cogs_pct}% of revenue in September and ${aug.cogs_pct}% in August, against a ${q3Cogs.toFixed(1)}% third-quarter average and a ${sepCogsBud.toFixed(1)}% budget. Liquor purchases were only 6.2% of liquor sales in August and 5.5% in September (versus ${cr("Liquor").toFixed(1)}% for the quarter) while liquor sales kept rising, so either inventory is being drawn down or purchases are not yet booked. COGS appears to follow purchases month to month, so margin swings with ordering timing.`,
     `Each 1 pt of COGS ≈ ${fmt$(onePt)}/yr. Booking a bar and food inventory count every month makes the number trustworthy and surfaces over-pouring, waste and comps — and shows whether August's low rate was real. The September 30 balance sheet carries bar inventory of $16,742 versus $11,208 at year-end.`],
    ["3. Price and mix toward the high-margin categories",
     `Purchase cost as a share of sales (Q3): liquor ${cr("Liquor").toFixed(1)}%, N/A beverages ${cr("N/A beverages").toFixed(1)}%, beer ${cr("Beer").toFixed(1)}%, wine ${cr("Wine").toFixed(1)}%, food ${cr("Food").toFixed(1)}%. Liquor sales are up 104% year over year in September while beer is up 11%; food is the weakest line versus budget (${findIn(BUDGET_YTD,"Food Sales").growth.toFixed(1)}% YTD, ${findIn(SEP_VS_BUDGET,"Food Sales").growth.toFixed(1)}% in September).`,
     `1% of net food price ≈ ${fmt$(foodAnn*0.01)}/yr; 3% on beer and wine ≈ ${fmt$(bwAnn*0.03)}/yr at the Q3 run rate. Lean into the cocktail program, review beer and wine pricing and by-the-glass costs, and test price on top food sellers before adding promotions.`],
    ["4. Card processing and discounts",
     `Card fees were ${ccPct26.toFixed(2)}% of revenue in Q3 versus ${ccPct25.toFixed(2)}% in 2025 (${fmt$(Q3.cc26)} for the quarter, and 3.35% in September). Sales discounts were ${dPct26.toFixed(2)}% of revenue versus ${dPct25.toFixed(2)}% — improving, and ${fmt$(Q3.disc26)} for the quarter.`,
     `Each 0.25 pt of revenue ≈ ${fmt$(annRev*0.0025)}/yr on either line. Ask the processor for a rate review (interchange-plus pricing), and audit discount and comp codes and approvals; consider dual-pricing options only if consistent with brand and California rules.`],
    ["5. Put idle cash to work against the SBA loan",
     `Cash of ${fmt$(DATA[8].cash)} earned ${fmt$(1.25)} of interest in September, while the ${fmt$(BS_SEP.sba)} SBA loan (about prime + 2, roughly 8.75%, to be confirmed against the loan documents) cost ${fmt$(3636.44)} of interest in each of August and September (${fmt$(Q3.interest26)} over Q3) — equivalent to about ${loanRate.toFixed(1)}% a year, well above 8.75%, so the booked interest is worth checking against the loan statement.`,
     `Each $100K applied to the loan saves about ${fmt$(100000*0.0875)}/yr of interest (confirm prepayment terms and keep enough operating cash on hand); at minimum, sweep surplus cash to an interest-bearing account. Full loan carrying cost is about ${fmt$(sbaInterestYr)}/yr at 8.75%.`],
    ["6. Right-size the bookkeeping engagement",
     `Bookkeeping costs ${fmt$(3700)}/month (${fmt$(3700*12)}/yr), and the books were restated again in this package — August net income moved from ${fmt$(39601.96)} to ${fmt$(aug.net_income)} — with open items on inventory, sales-tax expense, event deposits and the Jan–Sep balance-sheet tie-out. The September 3 review in this project estimated about ${fmt$(2270)}/month of the scope could be absorbed by a hybrid model.`,
     `≈ ${fmt$(2270*12)}/yr (planning estimate — validate with a parallel close before giving notice). Pair it with a standing close checklist so management fee, interest and utilities are booked every month.`],
    ["7. Spend growth dollars where each $1 clearly pays back",
     `Advertising &amp; promotion plus advertising &amp; marketing totaled about ${fmt$(768.36+600)} in September against a ${fmt$(1771.88)} budget, and revenue has eased two months in a row while food is behind budget. At about ${flow.toFixed(0)}¢ of flow-through, each $1 of marketing needs roughly $${(100/flow).toFixed(2)} of added sales to break even.`,
     `Each additional $100K of annual revenue ≈ ${fmt$(flow*1000,true)} of profit. Target the weak spots: weekday food covers, off-peak dayparts, private events (the Event Deposits account shows the demand exists) and local-resident loyalty — and hold discretionary supplies and small equipment to budget so growth dollars are not absorbed by cost.`],
  ];
  document.getElementById("oppTable").innerHTML = `<thead><tr><th style="width:21%">Opportunity</th><th>What the data shows</th><th style="width:31%">Sizing and first step</th></tr></thead><tbody>${
    opp.map(o=>`<tr><td class="item"><strong>${o[0]}</strong></td><td class="item">${o[1]}</td><td class="item">${o[2]}</td></tr>`).join("")}</tbody>`;

  document.getElementById("oppAdjTable").innerHTML = `<thead><tr><th>September net income, illustrative run-rate</th><th>Amount</th></tr></thead><tbody>${
    adj.map(r=>`<tr class="${r[2]?"yoy-bold":""}"><td class="item">${r[0]}</td><td class="${r[1]<0&&!r[2]?"neg":(r[1]>0&&!r[2]?"pos":"")}">${r[1]<0?"-":(r[2]?"":"+")}${fmt$(Math.abs(r[1]))}</td></tr>`).join("")}
    <tr class="yoy-bold"><td class="item">Illustrative run-rate net income (${(total/sep.revenue*100).toFixed(1)}% margin on September revenue)</td><td>${fmt$(total)}</td></tr></tbody>`;

  // Biggest year-over-year cost movers (Sep 2026 vs Sep 2025)
  let sec=null, movers=[];
  FULL_YOY_SEP.forEach(r=>{ if(r.type==="section") sec=r.label; if(r.type==="leaf" && sec==="Expenses"){ const py=r.py||0, cy=r.cy||0; movers.push({label:r.label, py, cy, d:cy-py}); } });
  movers.sort((a,b)=>b.d-a.d);
  const up = movers.slice(0,8);
  document.getElementById("oppMovers").innerHTML = `<thead><tr><th>Expense line</th><th>Sep 2025</th><th>Sep 2026</th><th>Change</th></tr></thead><tbody>${
    up.map(m=>`<tr><td class="item">${m.label}</td><td>${fmt$(m.py)}</td><td>${fmt$(m.cy)}</td><td class="neg">+${fmt$(m.d)}</td></tr>`).join("")}</tbody>`;

  document.getElementById("oppClean").innerHTML = `
    <p><strong>Close the books completely each month.</strong> The management fee (5% of revenue, about $12K a month) is still absent from the April and May statements (about $21K); the August figures changed again in the September package (net income ${fmt$(39601.96)} → ${fmt$(aug.net_income)}), and loan interest, gas &amp; electric, water &amp; sewage and janitorial were missing from the first August package. Until every month is booked on the same basis, month-to-month margins and budget variances are not reliable.</p>
    <p><strong>Resolve the open accounting questions that move profit.</strong> Sales Tax Expense has been running as a credit of roughly $1.3–1.7K a month — if it is mis-posted, profit is overstated by that amount. Also open: the SBA loan balance (the September balance sheet shows ${fmt$(BS_SEP.sba)}, versus $350,750 on the August balance sheet), the interest booked on it, the Event Deposits and gift-card balances, whether September's $3,229 of small equipment should be capitalized, and an inventory count at each month-end.</p>
    <p><strong>Ask Sorren for a restated January–September P&amp;L.</strong> The September 30 balance sheet reports ${fmt$(BS_SEP.ytdNI)} of year-to-date net income, about ${fmt$(sumKey("net_income")-BS_SEP.ytdNI)} below the sum of the monthly statements; one consistent year-to-date P&amp;L would let this dashboard replace the tie-out with a single source.</p>`;
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
renderBudgetSep();
renderYoYSummary("sepYoyTable","sepYoyNarrative",YOY_SUM_SEP,"Sep 2025","Sep 2026",sepYoYNarrative);
renderFullYoyDetail("sepYoyDetailTable", FULL_YOY_SEP, "Sep 2025", "Sep 2026");
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