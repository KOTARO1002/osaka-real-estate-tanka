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
    xaxis: { title: "四半期" },
    yaxis: { title: "㎡単価（円/㎡）", tickformat: ",.0f" },
    hovermode: "x unified",
  };

  Plotly.react("chart-trend", [trace], layout, { displayModeBar: false, responsive: true });
}

function getLatestQuarter() {
  return state.dataset.meta.year_quarter_range[1];
}

function renderCompare(ageKey, areaKey) {
  const latest = getLatestQuarter();
  const rows = [];

  for (const city of state.dataset.cities) {
    const v = state.dataset.data[city.code]?.[latest]?.[ageKey]?.[areaKey];
    if (v) {
      rows.push({ name: city.name, avg: v.avg, n: v.n });
    }
  }
  rows.sort((a, b) => b.avg - a.avg);

  const colors = rows.map(r => r.n < 5 ? "rgba(44,108,246,0.35)" : "rgba(44,108,246,1)");

  const trace = {
    x: rows.map(r => r.name),
    y: rows.map(r => r.avg),
    type: "bar",
    marker: { color: colors },
    customdata: rows.map(r => r.n),
    hovertemplate:
      "%{x}<br>㎡単価: %{y:,.0f} 円/㎡<br>件数: %{customdata}件<extra></extra>",
  };

  const layout = {
    margin: { t: 20, l: 70, r: 20, b: 120 },
    xaxis: { tickangle: -45 },
    yaxis: { title: "㎡単価（円/㎡）", tickformat: ",.0f" },
    title: { text: `最新四半期: ${latest}`, font: { size: 12 }, x: 0 },
  };

  Plotly.react("chart-compare", [trace], layout, { displayModeBar: false, responsive: true });
}

function renderHeatmap(cityCode) {
  const latest = getLatestQuarter();
  const ageBins = state.dataset.meta.age_bins;
  const areaBins = state.dataset.meta.area_bins;
  const cityLatest = state.dataset.data[cityCode]?.[latest] || {};

  const x = ageBins.map(b => `${b[0]}-${b[1]}年`);
  const y = areaBins.map(b => `${b[0]}-${b[1]}㎡`);
  const z = [];
  const text = [];

  for (const areaBin of areaBins) {
    const row = [];
    const tRow = [];
    for (const ageBin of ageBins) {
      const v = cityLatest[`${ageBin[0]}-${ageBin[1]}`]?.[`${areaBin[0]}-${areaBin[1]}`];
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
    xaxis: { title: "築年数" },
    yaxis: { title: "専有面積" },
    title: { text: `${cityName} / ${latest}`, font: { size: 12 }, x: 0 },
  };

  Plotly.react("chart-heatmap", [trace], layout, { displayModeBar: false, responsive: true });
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
    const res = await fetch("data.json");
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
