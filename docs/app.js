"use strict";

const state = {
  dataset: null,
  citySelect: null,
  ageSelect: null,
  areaSelect: null,
};

function ageBinLabel(bin) { return `${bin[0]}-${bin[1]}年`; }
function ageBinKey(bin) { return `${bin[0]}-${bin[1]}`; }
function areaBinLabel(bin) { return `${bin[0]}-${bin[1]}㎡`; }
function areaBinKey(bin) { return `${bin[0]}-${bin[1]}`; }

function populateSelect(selectEl, options) {
  selectEl.innerHTML = "";
  for (const { value, label } of options) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    selectEl.appendChild(opt);
  }
}

function initControls(dataset) {
  const cityOptions = dataset.cities.map(c => ({
    value: c.code, label: c.name,
  }));
  populateSelect(state.citySelect, cityOptions);

  const ageOptions = dataset.meta.age_bins.map(b => ({
    value: ageBinKey(b), label: ageBinLabel(b),
  }));
  populateSelect(state.ageSelect, ageOptions);

  const areaOptions = dataset.meta.area_bins.map(b => ({
    value: areaBinKey(b), label: areaBinLabel(b),
  }));
  populateSelect(state.areaSelect, areaOptions);
}

function getSortedQuarters(cityData) {
  return Object.keys(cityData).sort((a, b) => {
    const [ya, qa] = a.split("Q").map(Number);
    const [yb, qb] = b.split("Q").map(Number);
    return ya === yb ? qa - qb : ya - yb;
  });
}

function renderTrend(cityCode, ageKey, areaKey) {
  const cityData = state.dataset.data[cityCode] || {};
  const quarters = getSortedQuarters(cityData);
  const x = [];
  const y = [];
  const n = [];

  for (const yq of quarters) {
    const v = cityData[yq]?.[ageKey]?.[areaKey];
    x.push(yq);
    y.push(v ? v.avg : null);
    n.push(v ? v.n : 0);
  }

  const colors = n.map(c => c < 5 ? "rgba(44,108,246,0.35)" : "rgba(44,108,246,1)");

  const trace = {
    x, y,
    mode: "lines+markers",
    type: "scatter",
    name: "㎡単価",
    line: { color: "#2c6cf6" },
    marker: { color: colors, size: 8 },
    customdata: n,
    hovertemplate:
      "%{x}<br>㎡単価: %{y:,.0f} 円/㎡<br>件数: %{customdata}件<extra></extra>",
    connectgaps: false,
  };

  const layout = {
    margin: { t: 20, l: 70, r: 20, b: 50 },
    xaxis: { title: "四半期", fixedrange: true },
    yaxis: { title: "㎡単価（円/㎡）", tickformat: ",.0f", fixedrange: true },
    hovermode: "x unified",
  };

  Plotly.react("chart-trend", [trace], layout, { displayModeBar: false, responsive: true, scrollZoom: false });
}

function getLatestQuarter() {
  return state.dataset.meta.year_quarter_range[1];
}

function classifyCity(code) {
  const n = parseInt(code, 10);
  if (n >= 27102 && n <= 27128) return "osaka";
  if (n >= 27141 && n <= 27147) return "sakai";
  return "other";
}

function getMostRecentFullYear() {
  const yearsWithQ = new Map();
  for (const cityCode in state.dataset.data) {
    for (const yq in state.dataset.data[cityCode]) {
      const [y, q] = yq.split("Q").map(Number);
      if (!yearsWithQ.has(y)) yearsWithQ.set(y, new Set());
      yearsWithQ.get(y).add(q);
    }
  }
  const fullYears = [...yearsWithQ.entries()]
    .filter(([, qs]) => qs.size === 4)
    .map(([y]) => y);
  return fullYears.length ? Math.max(...fullYears) : null;
}

function getYearAggregate(cityCode, year, ageKey, areaKey) {
  const cityData = state.dataset.data[cityCode] || {};
  let totalN = 0;
  let weighted = 0;
  for (let q = 1; q <= 4; q++) {
    const v = cityData[`${year}Q${q}`]?.[ageKey]?.[areaKey];
    if (v) {
      totalN += v.n;
      weighted += v.avg * v.n;
    }
  }
  return totalN > 0 ? { avg: Math.round(weighted / totalN), n: totalN } : null;
}

function renderCompareGroup(divId, rows, label, year, opaque, translucent) {
  const sorted = [...rows].sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  const colors = sorted.map(r => (r.avg == null || r.n < 5) ? translucent : opaque);

  const trace = {
    x: sorted.map(r => r.name),
    y: sorted.map(r => r.avg),
    type: "bar",
    marker: { color: colors },
    customdata: sorted.map(r => [r.n, r.avg == null ? "データなし" : `${r.avg.toLocaleString()} 円/㎡`]),
    hovertemplate:
      "%{x}<br>㎡単価: %{customdata[1]}<br>件数: %{customdata[0]}件<extra></extra>",
  };

  const layout = {
    margin: { t: 30, l: 70, r: 20, b: 110 },
    xaxis: {
      tickangle: -45,
      fixedrange: true,
      categoryorder: "array",
      categoryarray: sorted.map(r => r.name),
      tickfont: { size: 10 },
    },
    yaxis: { title: "㎡単価（円/㎡）", tickformat: ",.0f", fixedrange: true },
    title: { text: `${label} / ${year}年通期（降順）`, font: { size: 12 }, x: 0 },
  };

  Plotly.react(divId, [trace], layout, { displayModeBar: false, responsive: true, scrollZoom: false });
}

function renderCompare(ageKey, areaKey) {
  const year = getMostRecentFullYear();
  if (year == null) return;
  const groups = { osaka: [], sakai: [], other: [] };

  for (const city of state.dataset.cities) {
    const v = getYearAggregate(city.code, year, ageKey, areaKey);
    const row = { name: city.name, avg: v?.avg ?? null, n: v?.n ?? 0 };
    groups[classifyCity(city.code)].push(row);
  }

  renderCompareGroup(
    "chart-compare-osaka", groups.osaka, "大阪市 24区", year,
    "rgba(44,108,246,1)", "rgba(44,108,246,0.35)"
  );
  renderCompareGroup(
    "chart-compare-sakai", groups.sakai, "堺市 7区", year,
    "rgba(34,163,107,1)", "rgba(34,163,107,0.35)"
  );
  renderCompareGroup(
    "chart-compare-other", groups.other, "その他 41市町村", year,
    "rgba(255,127,14,1)", "rgba(255,127,14,0.35)"
  );
}

function renderHeatmap(cityCode) {
  const year = getMostRecentFullYear();
  if (year == null) return;
  const ageBins = state.dataset.meta.age_bins;
  const areaBins = state.dataset.meta.area_bins;

  const x = ageBins.map(b => `${b[0]}-${b[1]}年`);
  const y = areaBins.map(b => `${b[0]}-${b[1]}㎡`);
  const z = [];
  const text = [];

  for (const areaBin of areaBins) {
    const row = [];
    const tRow = [];
    for (const ageBin of ageBins) {
      const ageKey = `${ageBin[0]}-${ageBin[1]}`;
      const areaKey = `${areaBin[0]}-${areaBin[1]}`;
      const v = getYearAggregate(cityCode, year, ageKey, areaKey);
      if (v) {
        row.push(v.avg);
        tRow.push(`${v.avg.toLocaleString()}<br>(${v.n}件)`);
      } else {
        row.push(null);
        tRow.push("");
      }
    }
    z.push(row);
    text.push(tRow);
  }

  const trace = {
    x, y, z,
    type: "heatmap",
    colorscale: "Viridis",
    hoverongaps: false,
    text,
    texttemplate: "%{text}",
    textfont: { color: "white", size: 11 },
    colorbar: { title: "円/㎡" },
  };

  const cityName = state.dataset.cities.find(c => c.code === cityCode)?.name || cityCode;
  const layout = {
    margin: { t: 30, l: 90, r: 20, b: 60 },
    xaxis: { title: "築年数", fixedrange: true },
    yaxis: { title: "専有面積", fixedrange: true },
    title: { text: `${cityName} / ${year}年通期`, font: { size: 12 }, x: 0 },
  };

  Plotly.react("chart-heatmap", [trace], layout, { displayModeBar: false, responsive: true, scrollZoom: false });
}

function renderAll() {
  if (!state.dataset) return;
  const cityCode = state.citySelect.value;
  const ageKey = state.ageSelect.value;
  const areaKey = state.areaSelect.value;
  renderTrend(cityCode, ageKey, areaKey);
  renderCompare(ageKey, areaKey);
  renderHeatmap(cityCode);
}

function onControlChange() {
  renderAll();
}

async function init() {
  state.citySelect = document.getElementById("city-select");
  state.ageSelect = document.getElementById("age-select");
  state.areaSelect = document.getElementById("area-select");

  const metaInfo = document.getElementById("meta-info");
  try {
    const res = await fetch("data.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.dataset = await res.json();
  } catch (e) {
    metaInfo.textContent = `データ読み込みに失敗しました: ${e.message}`;
    return;
  }

  const meta = state.dataset.meta;
  metaInfo.textContent = `期間: ${meta.year_quarter_range[0]} 〜 ${meta.year_quarter_range[1]} / 更新: ${meta.generated_at}`;

  initControls(state.dataset);

  state.citySelect.addEventListener("change", onControlChange);
  state.ageSelect.addEventListener("change", onControlChange);
  state.areaSelect.addEventListener("change", onControlChange);

  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
