import React, { useState, useCallback } from "react";

// ─── ODDS TABLE (18 holes · Par 72 · Rating 72.0 · Slope 113) ────────────────
const TABLE = [
  [0,-138,-190,-262,-363,-507,-715,-1020,-1477,-2169,-3238,-4915,-7589,-11921,-19048,-30952],
  [138,0,-137,-188,-258,-356,-495,-694,-985,-1415,-2064,-3058,-4602,-7043,-10961,-17343],
  [190,137,0,-137,-186,-255,-350,-483,-674,-951,-1359,-1968,-2892,-4319,-6553,-10107],
  [262,188,137,0,-136,-185,-251,-344,-473,-656,-920,-1306,-1878,-2741,-4062,-6113],
  [363,258,186,136,0,-135,-183,-248,-338,-462,-638,-890,-1256,-1796,-2602,-3827],
  [507,356,255,185,135,0,-135,-182,-245,-332,-453,-622,-863,-1210,-1719,-2475],
  [715,495,350,251,183,135,0,-134,-180,-242,-327,-444,-606,-837,-1167,-1648],
  [1020,694,483,344,248,182,134,0,-134,-179,-240,-322,-435,-592,-812,-1127],
  [1477,985,674,473,338,245,180,134,0,-133,-178,-237,-317,-426,-578,-789],
  [2169,1415,951,656,462,332,242,179,133,0,-133,-176,-234,-312,-418,-564],
  [3238,2064,1359,920,638,453,327,240,178,133,0,-132,-175,-232,-308,-411],
  [4915,3058,1968,1306,890,622,444,322,237,176,132,0,-132,-174,-229,-304],
  [7589,4602,2892,1878,1256,863,606,435,317,234,175,132,0,-132,-173,-227],
  [11921,7043,4319,2741,1796,1210,837,592,426,312,232,174,132,0,-131,-172],
  [19048,10961,6553,4062,2602,1719,1167,812,578,418,308,229,173,131,0,-131],
  [30952,17343,10107,6113,3827,2475,1648,1127,789,564,411,304,227,172,131,0],
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const clampIdx = v => clamp(Math.round(v), 0, 15);
const courseHcp = (idx, slope, rating, par) =>
  Math.round(idx * (slope / 113) + (rating - par));
const mlToProb = ml => {
  if (ml === 0) return 0.5;
  return ml < 0 ? (-ml) / (-ml + 100) : 100 / (ml + 100);
};
const probToML = p => {
  if (Math.abs(p - 0.5) < 0.001) return 0;
  return p > 0.5 ? -Math.round((p / (1 - p)) * 100) : Math.round(((1 - p) / p) * 100);
};
const fmtML = ml => ml === 0 ? "EVEN" : ml > 0 ? `+${ml}` : `${ml}`;

const calcHourWeight = (w, g, prc, tmp) => {
  const windScore   = 0.134 * w + 0.067 * g;
  const precipScore = Math.min(prc * 1.8, 2.0);
  const tempScore   = Math.max(0, (55 - tmp) / 25) * 0.5;
  return 1.0 + windScore + precipScore + tempScore;
};

const weightedAvg = (vals, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.reduce((sum, v, i) => sum + v * weights[i], 0) / total;
};

// ─── THEMES ──────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bgMain: "#080c10", bgCard: "#0d1318", bgHeader: "#0a1018",
    border: "#1e2d3a", textMain: "#e8edf2", textMuted: "#5a7080",
    accent: "#c8a84b", green: "#34d37a", red: "#ff6b5b",
    greenFade: "rgba(42,124,79,0.15)", greenBorder: "rgba(52,211,122,0.3)"
  },
  light: {
    bgMain: "#f1f5f9", bgCard: "#ffffff", bgHeader: "#f8fafc",
    border: "#cbd5e1", textMain: "#0f172a", textMuted: "#64748b",
    accent: "#b45309", green: "#16a34a", red: "#dc2626",
    greenFade: "rgba(22,163,74,0.1)", greenBorder: "rgba(22,163,74,0.3)"
  }
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date().toISOString().split('T')[0];

  const [isLightMode, setIsLightMode] = useState(false);
  const t = isLightMode ? THEMES.light : THEMES.dark;

  const [p1name, setP1name] = useState("");
  const [p2name, setP2name] = useState("");
  const [p1hcp,  setP1hcp]  = useState("");
  const [p2hcp,  setP2hcp]  = useState("");
  const [rating, setRating] = useState("72.0");
  const [slope,  setSlope]  = useState("113");
  const [par,    setPar]    = useState("72");
  const [loc,    setLoc]    = useState("");
  
  const [roundDate,  setRoundDate]  = useState(today);
  const [teeTime,    setTeeTime]    = useState("08:00"); 
  const [roundHours, setRoundHours] = useState(4);
  
  const [wind,   setWind]   = useState("");
  const [gusts,  setGusts]  = useState("");
  const [precip, setPrecip] = useState("");
  const [temp,   setTemp]   = useState("70");
  const [hourlyData, setHourlyData] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState({ msg: "", cls: "" });
  const [liveWeather, setLiveWeather]     = useState(null);
  const [fetching, setFetching]           = useState(false);
  const [result, setResult]               = useState(null);

  const fetchWeather = useCallback(async () => {
    if (!loc.trim()) { setWeatherStatus({ msg: "Enter a location first", cls: "err" }); return; }
    if (!roundDate || !teeTime) { setWeatherStatus({ msg: "Enter a valid date and tee time", cls: "err" }); return; }
    
    setFetching(true);
    setHourlyData(null);
    setLiveWeather(null);
    setWeatherStatus({ msg: "Finding location...", cls: "loading" });

    try {
      const parts = loc.split(',');
      const searchCity = parts[0].trim();

      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=10&language=en&format=json`);
      if (!geoRes.ok) throw new Error("Geocoding failed");
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) throw new Error("Location not found.");
      
      let match = geoData.results[0];
      if (parts.length > 1) {
        const searchRegion = parts[1].trim().toLowerCase();
        const states = { "al": "alabama", "ak": "alaska", "az": "arizona", "ar": "arkansas", "ca": "california", "co": "colorado", "ct": "connecticut", "de": "delaware", "fl": "florida", "ga": "georgia", "hi": "hawaii", "id": "idaho", "il": "illinois", "in": "indiana", "ia": "iowa", "ks": "kansas", "ky": "kentucky", "la": "louisiana", "me": "maine", "md": "maryland", "ma": "massachusetts", "mi": "michigan", "mn": "minnesota", "ms": "mississippi", "mo": "missouri", "mt": "montana", "ne": "nebraska", "nv": "nevada", "nh": "new hampshire", "nj": "new jersey", "nm": "new mexico", "ny": "new york", "nc": "north carolina", "nd": "north dakota", "oh": "ohio", "ok": "oklahoma", "or": "oregon", "pa": "pennsylvania", "ri": "rhode island", "sc": "south carolina", "sd": "south dakota", "tn": "tennessee", "tx": "texas", "ut": "utah", "vt": "vermont", "va": "virginia", "wa": "washington", "wv": "west virginia", "wi": "wisconsin", "wy": "wyoming" };
        const expandedRegion = states[searchRegion] || searchRegion;
        const found = geoData.results.find(r => (r.admin1 || "").toLowerCase().includes(expandedRegion));
        if (found) match = found;
      }
      
      const { latitude, longitude, name, admin1, country_code } = match;
      setWeatherStatus({ msg: "Fetching forecast...", cls: "loading" });

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=mm&timezone=auto&start_date=${roundDate}&end_date=${roundDate}`);
      const weatherData = await weatherRes.json();
      const startHour = parseInt(teeTime.split(':')[0], 10);
      const hoursArray = [];
      
      for (let i = 0; i < roundHours; i++) {
        const hourIdx = startHour + i;
        if (hourIdx < 24) {
          const w = Math.round(weatherData.hourly.wind_speed_10m[hourIdx]);
          const g = Math.round(weatherData.hourly.wind_gusts_10m[hourIdx] || w * 1.4);
          const prc = weatherData.hourly.precipitation[hourIdx];
          const tmp = Math.round(weatherData.hourly.temperature_2m[hourIdx]);
          hoursArray.push({ label: `Hr ${i + 1}`, wind: w, gusts: g, precip: prc, temp: tmp, weight: calcHourWeight(w, g, prc, tmp) });
        }
      }

      const weights = hoursArray.map(h => h.weight);
      setWind(weightedAvg(hoursArray.map(h => h.wind), weights).toFixed(1));
      setGusts(weightedAvg(hoursArray.map(h => h.gusts), weights).toFixed(1));
      setPrecip(weightedAvg(hoursArray.map(h => h.precip), weights).toFixed(2));
      setTemp(String(Math.round(weightedAvg(hoursArray.map(h => h.temp), weights))));
      setHourlyData(hoursArray);
      setLiveWeather({ location_found: `${name}, ${admin1}`, source: "Open-Meteo API" });
      setWeatherStatus({ msg: `✓ ${roundHours}-hour forecast loaded`, cls: "ok" });
    } catch (e) {
      setWeatherStatus({ msg: `⚠ ${e.message}`, cls: "err" });
    }
    setFetching(false);
  }, [loc, teeTime, roundDate, roundHours]);

  const calculate = useCallback(() => {
    const p1i = parseFloat(p1hcp); const p2i = parseFloat(p2hcp);
    if (isNaN(p1i) || isNaN(p2i)) { alert("Enter both indexes."); return; }
    const rat = parseFloat(rating); const slp = parseFloat(slope); const pr = parseInt(par);
    const w = parseFloat(wind); const g = parseFloat(gusts); const prc = parseFloat(precip); const tmp = parseFloat(temp);
    const n1 = p1name || "Player 1"; const n2 = p2name || "Player 2";
    const ch1 = courseHcp(p1i, slp, rat, pr); const ch2 = courseHcp(p2i, slp, rat, pr);
    const row = clampIdx(ch1); const col = clampIdx(ch2);
    const baseML = TABLE[row][col];
    const windScore = 0.134 * w + 0.067 * g; const precipScore = Math.min(prc * 1.8, 2.0);
    const tempScore = Math.max(0, (55 - tmp) / 25) * 0.5;
    const rawPCC = windScore + precipScore + tempScore - 1.0;
    const pcc = clamp(Math.round(rawPCC * 2) / 2, -1, 3);
    const varianceFactor = 1 + (Math.max(0, pcc) * 0.07);
    const adjProb = 0.5 + (mlToProb(baseML) - 0.5) / varianceFactor;
    setResult({ n1, n2, p1i, p2i, ch1, ch2, row, col, baseML, adjML: probToML(adjProb), p2ML: probToML(1 - adjProb), adjProb, p2Prob: 1 - adjProb, pcc, rawPCC, windScore, precipScore, tempScore, varianceFactor, rat, slp, pr, w, g, prc, tmp, usedHourly: !!hourlyData, roundHours });
  }, [p1hcp, p2hcp, rating, slope, par, wind, gusts, precip, temp, p1name, p2name, hourlyData, roundHours]);

  const S = {
    wrap: { background: t.bgMain, minHeight: "100vh", fontFamily: "'DM Mono', monospace", color: t.textMain, padding: 0 },
    header: { background: t.bgCard, borderBottom: `1px solid ${t.border}`, padding: "18px 32px", display: "flex", alignItems: "center" },
    h1: { fontFamily: "Georgia, serif", fontSize: 22, margin: 0 },
    themeBtn: { marginLeft: "auto", background: t.bgMain, border: `1px solid ${t.border}`, color: t.textMain, borderRadius: 20, padding: "6px 12px", cursor: "pointer" },
    main: { maxWidth: 900, margin: "0 auto", padding: "28px 20px" },
    card: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 6, padding: "20px 22px", marginBottom: 18 },
    label: { display: "block", fontSize: 10, textTransform: "uppercase", color: t.textMuted, marginBottom: 5 },
    input: { width: "100%", background: t.bgMain, border: `1px solid ${t.border}`, borderRadius: 4, color: t.textMain, padding: "9px 11px", boxSizing: "border-box" },
    fetchBtn: { width: "100%", padding: "10px 0", background: t.greenFade, border: `1px solid ${t.greenBorder}`, color: t.green, cursor: "pointer", marginBottom: 14 },
    calcBtn: { width: "100%", padding: 15, background: "#2a7c4f", color: "#fff", cursor: "pointer", marginBottom: 28, border: "none", borderRadius: 6, fontWeight: 700 }
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h1 style={S.h1}>Golf Match Odds</h1>
        <button style={S.themeBtn} onClick={() => setIsLightMode(!isLightMode)}>{isLightMode ? "🌙 Dark" : "☀️ Light"}</button>
      </div>
      <div style={S.main}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={S.card}>
            <Field label="P1 Name" value={p1name} onChange={setP1name} type="text" t={t} />
            <Field label="P1 Index" value={p1hcp} onChange={setP1hcp} t={t} />
          </div>
          <div style={S.card}>
            <Field label="P2 Name" value={p2name} onChange={setP2name} type="text" t={t} />
            <Field label="P2 Index" value={p2hcp} onChange={setP2hcp} t={t} />
          </div>
        </div>
        <div style={S.card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <Field label="Rating" value={rating} onChange={setRating} t={t} />
            <Field label="Slope" value={slope} onChange={setSlope} t={t} />
            <Field label="Par" value={par} onChange={setPar} t={t} />
          </div>
        </div>
        <div style={S.card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Field label="Location" value={loc} onChange={setLoc} type="text" t={t} />
            <Field label="Tee Time" value={teeTime} onChange={setTeeTime} type="time" t={t} />
            <Field label="Date" value={roundDate} onChange={setRoundDate} type="date" t={t} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Round Length: {roundHours}h</label>
            <input type="range" min="3" max="6" value={roundHours} onChange={e => setRoundHours(parseInt(e.target.value))} style={{ width: "100%" }} />
          </div>
          {weatherStatus.msg && <div style={{ fontSize: 11, textAlign: "center", color: statusColor[weatherStatus.cls] }}>{weatherStatus.msg}</div>}
          <button style={S.fetchBtn} onClick={fetchWeather}>Fetch {roundHours}h Forecast</button>
          <HourlyTable hours={hourlyData} t={t} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
            <Field label="Wind" value={wind} onChange={setWind} t={t} />
            <Field label="Gusts" value={gusts} onChange={setGusts} t={t} />
            <Field label="Precip" value={precip} onChange={setPrecip} t={t} />
            <Field label="Temp" value={temp} onChange={setTemp} t={t} />
          </div>
        </div>
        <button style={S.calcBtn} onClick={calculate}>Calculate Odds</button>
        {result && <Results r={result} t={t} />}
      </div>
    </div>
  );
}

// ─── STABLE COMPONENTS (OUTSIDE APP) ─────────────────────────────────────────
function Field({ label, value, onChange, t, type = "number" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", color: t.textMuted, marginBottom: 5 }}>{label}</label>
      <input 
        style={{ width: "100%", background: t.bgMain, border: `1px solid ${t.border}`, borderRadius: 4, color: t.textMain, padding: "9px 11px", boxSizing: "border-box" }} 
        type={type} value={value} onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}

function HourlyTable({ hours, t }) {
  if (!hours) return null;
  return (
    <div style={{ background: t.bgMain, borderRadius: 4, padding: 10, fontSize: 10, marginBottom: 14 }}>
      {hours.map((h, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, padding: "4px 0" }}>
          <span>{h.label} ({h.weight.toFixed(1)}x)</span>
          <span>{h.wind}mph | {h.precip}mm | {h.temp}°</span>
        </div>
      ))}
    </div>
  );
}

function Results({ r, t }) {
  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 6, padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", textAlign: "center", alignItems: "center" }}>
        <div><div style={{ fontSize: 10, color: t.textMuted }}>{r.n1}</div><div style={{ fontSize: 32, fontWeight: 900 }}>{fmtML(r.adjML)}</div></div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>VS</div>
        <div><div style={{ fontSize: 10, color: t.textMuted }}>{r.n2}</div><div style={{ fontSize: 32, fontWeight: 900 }}>{fmtML(r.p2ML)}</div></div>
      </div>
      <div style={{ marginTop: 14, fontSize: 11, color: t.textMuted }}>Simulated PCC: {r.pcc >= 0 ? "+" : ""}{r.pcc}</div>
    </div>
  );
}
