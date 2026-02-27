import React, { useState, useCallback } from "react";

// ─── ODDS TABLE ──────────────────────────────────────────────────────────────
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
const courseHcp = (idx, slope, rating, par) => Math.round(idx * (slope / 113) + (rating - par));
const mlToProb = ml => (ml === 0 ? 0.5 : ml < 0 ? (-ml) / (-ml + 100) : 100 / (ml + 100));
const probToML = p => (Math.abs(p - 0.5) < 0.001 ? 0 : p > 0.5 ? -Math.round((p / (1 - p)) * 100) : Math.round(((1 - p) / p) * 100));
const fmtML = ml => (ml === 0 ? "EVEN" : ml > 0 ? `+${ml}` : `${ml}`);

const calcHourWeight = (w, g, prc, tmp) => {
  const windScore = 0.134 * w + 0.067 * g;
  const precipScore = Math.min(prc * 1.8, 2.0);
  const tempScore = Math.max(0, (55 - tmp) / 25) * 0.5;
  return 1.0 + windScore + precipScore + tempScore;
};

const weightedAvg = (vals, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.reduce((sum, v, i) => sum + v * weights[i], 0) / total;
};

const THEMES = {
  dark: { bgMain: "#080c10", bgCard: "#0d1318", border: "#1e2d3a", textMain: "#e8edf2", textMuted: "#5a7080", accent: "#c8a84b", green: "#34d37a", red: "#ff6b5b", greenFade: "rgba(42,124,79,0.15)", greenBorder: "rgba(52,211,122,0.3)" },
  light: { bgMain: "#f1f5f9", bgCard: "#ffffff", border: "#cbd5e1", textMain: "#0f172a", textMuted: "#64748b", accent: "#b45309", green: "#16a34a", red: "#dc2626", greenFade: "rgba(22,163,74,0.1)", greenBorder: "rgba(22,163,74,0.3)" }
};

const STATE_MAP = {
  "or": "oregon", "wa": "washington", "ca": "california", "id": "idaho", "nv": "nevada", "az": "arizona", "ut": "utah", "mt": "montana", "wy": "wyoming", "co": "colorado", "nm": "new mexico", "nd": "north dakota", "sd": "south dakota", "ne": "nebraska", "ks": "kansas", "ok": "oklahoma", "tx": "texas", "mn": "minnesota", "ia": "iowa", "mo": "missouri", "ar": "arkansas", "la": "louisiana", "wi": "wisconsin", "il": "illinois", "ms": "mississippi", "mi": "michigan", "in": "indiana", "ky": "kentucky", "tn": "tennessee", "al": "alabama", "oh": "ohio", "ga": "georgia", "fl": "florida", "ny": "new york", "pa": "pennsylvania", "nc": "north carolina", "sc": "south carolina", "va": "virginia", "wv": "west virginia", "md": "maryland", "de": "delaware", "nj": "new jersey", "ct": "connecticut", "ri": "rhode island", "ma": "massachusetts", "nh": "new hampshire", "vt": "vermont", "me": "maine", "hi": "hawaii", "ak": "alaska"
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date().toISOString().split('T')[0];
  const [isLightMode, setIsLightMode] = useState(false);
  const t = isLightMode ? THEMES.light : THEMES.dark;

  const [p1name, setP1name] = useState("");
  const [p2name, setP2name] = useState("");
  const [p1hcp, setP1hcp] = useState("");
  const [p2hcp, setP2hcp] = useState("");
  const [rating, setRating] = useState("72.0");
  const [slope, setSlope] = useState("113");
  const [par, setPar] = useState("72");
  const [loc, setLoc] = useState("");
  const [roundDate, setRoundDate] = useState(today);
  const [teeTime, setTeeTime] = useState("08:00");
  const [roundHours, setRoundHours] = useState(4);
  const [wind, setWind] = useState("");
  const [gusts, setGusts] = useState("");
  const [precip, setPrecip] = useState("");
  const [temp, setTemp] = useState("70");
  const [hourlyData, setHourlyData] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState({ msg: "", cls: "" });
  const [liveWeather, setLiveWeather] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState(null);

  const fetchWeather = useCallback(async () => {
    if (!loc.trim()) { setWeatherStatus({ msg: "Enter a location first", cls: "err" }); return; }
    setFetching(true); setWeatherStatus({ msg: "Verifying location...", cls: "loading" });

    try {
      // Step 1: Sanitize Input (Extract City and State)
      const parts = loc.split(',');
      const searchCity = parts[0].trim();
      const inputST = parts.length > 1 ? parts[1].trim().toLowerCase() : null;
      const fullStateName = STATE_MAP[inputST] || inputST;

      // Step 2: Search for City
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=20&language=en&format=json`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found.");
      }
      
      // Step 3: Strict State Matching
      let match = null;
      if (inputST) {
        match = geoData.results.find(r => 
          r.country_code === 'US' && 
          ((r.admin1 || "").toLowerCase().includes(fullStateName) || (r.admin1_id && r.admin1_id.toString().includes(inputST)))
        );
      } else {
        match = geoData.results.find(r => r.country_code === 'US') || geoData.results[0];
      }

      if (!match) throw new Error(`Could not find ${searchCity} in ${inputST.toUpperCase()}.`);

      const { latitude, longitude, name, admin1 } = match;

      // Step 4: Fetch Weather
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
      setLiveWeather({ location_found: `${name}, ${admin1}` });
      setWeatherStatus({ msg: "✓ Success", cls: "ok" });
    } catch (e) { setWeatherStatus({ msg: `⚠ ${e.message}`, cls: "err" }); }
    setFetching(false);
  }, [loc, teeTime, roundDate, roundHours]);

  const calculate = useCallback(() => {
    const p1i = parseFloat(p1hcp); const p2i = parseFloat(p2hcp);
    if (isNaN(p1i) || isNaN(p2i)) return;
    const rat = parseFloat(rating); const slp = parseFloat(slope); const pr = parseInt(par);
    const ch1 = courseHcp(p1i, slp, rat, pr); const ch2 = courseHcp(p2i, slp, rat, pr);
    const baseML = TABLE[clampIdx(ch1)][clampIdx(ch2)];
    const w = parseFloat(wind); const g = parseFloat(gusts); const prc = parseFloat(precip); const tmp = parseFloat(temp);
    
    const windScore = 0.134 * w + 0.067 * g;
    const precipScore = Math.min(prc * 1.8, 2.0);
    const tempScore = Math.max(0, (55 - tmp) / 25) * 0.5;
    const rawPCC = windScore + precipScore + tempScore - 1.0;
    const pcc = clamp(Math.round(rawPCC * 2) / 2, -1, 3);
    const varianceFactor = 1 + (Math.max(0, pcc) * 0.07);
    const adjProb = 0.5 + (mlToProb(baseML) - 0.5) / varianceFactor;
    
    setResult({ n1: p1name || "P1", n2: p2name || "P2", p1i, p2i, ch1, ch2, adjML: probToML(adjProb), p2ML: probToML(1 - adjProb), adjProb, p2Prob: 1 - adjProb, pcc, windScore, precipScore, tempScore });
  }, [p1hcp, p2hcp, rating, slope, par, wind, gusts, precip, temp, p1name, p2name]);

  return (
    <div style={{ background: t.bgMain, color: t.textMain, minHeight: "100vh", fontFamily: "monospace" }}>
      <header style={{ background: t.bgCard, padding: "10px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Golf Odds Calculator</h2>
        <button onClick={() => setIsLightMode(!isLightMode)} style={{ borderRadius: "20px", cursor: "pointer", background: t.bgMain, color: t.textMain, border: `1px solid ${t.border}`, padding: "5px 15px" }}>
          {isLightMode ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <section style={{ background: t.bgCard, padding: "15px", borderRadius: "8px", border: `1px solid ${t.border}` }}>
            <Field label="Player 1 Name" value={p1name} onChange={setP1name} type="text" t={t} />
            <Field label="Player 1 Index" value={p1hcp} onChange={setP1hcp} t={t} />
          </section>
          <section style={{ background: t.bgCard, padding: "15px", borderRadius: "8px", border: `1px solid ${t.border}` }}>
            <Field label="Player 2 Name" value={p2name} onChange={setP2name} type="text" t={t} />
            <Field label="Player 2 Index" value={p2hcp} onChange={setP2hcp} t={t} />
          </section>
        </div>
        <section style={{ background: t.bgCard, padding: "15px", borderRadius: "8px", border: `1px solid ${t.border}`, marginTop: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <Field label="Rating" value={rating} onChange={setRating} t={t} />
            <Field label="Slope" value={slope} onChange={setSlope} t={t} />
            <Field label="Par" value={par} onChange={setPar} t={t} />
          </div>
        </section>
        <section style={{ background: t.bgCard, padding: "15px", borderRadius: "8px", border: `1px solid ${t.border}`, marginTop: "20px" }}>
          
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", fontSize: "10px", color: t.textMuted, textTransform: "uppercase", marginBottom: "5px" }}>Course Location</label>
            <div style={{ fontSize: "9px", color: t.accent, marginBottom: "4px" }}>City, ST (e.g. Corvallis, OR)</div>
            <input type="text" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="City, ST"
              style={{ width: "100%", background: t.bgMain, border: `1px solid ${t.border}`, color: t.textMain, padding: "8px", boxSizing: "border-box", borderRadius: "4px" }} 
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Field label="Tee Time" value={teeTime} onChange={setTeeTime} type="time" t={t} />
            <Field label="Date" value={roundDate} onChange={setRoundDate} type="date" t={t} />
          </div>
          <div style={{ marginTop: "10px" }}>
            <label style={{ fontSize: "12px", color: t.textMuted }}>Round Length: {roundHours}h</label>
            <input type="range" min="3" max="6" value={roundHours} onChange={(e) => setRoundHours(parseInt(e.target.value))} style={{ width: "100%", accentColor: t.green }} />
          </div>
          <button onClick={fetchWeather} style={{ width: "100%", padding: "10px", marginTop: "10px", background: t.greenFade, color: t.green, border: `1px solid ${t.greenBorder}`, cursor: "pointer", borderRadius: "4px" }}>
            {fetching ? "Syncing..." : `Fetch Local Forecast`}
          </button>
          
          {liveWeather && (
            <div style={{ marginTop: "12px", padding: "8px", background: t.bgMain, borderRadius: "4px", border: `1px solid ${t.border}`, textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: t.textMuted, textTransform: "uppercase" }}>Synced to:</span>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: t.green }}>{liveWeather.location_found}</div>
            </div>
          )}

          {weatherStatus.msg && <p style={{ fontSize: "11px", textAlign: "center", color: (weatherStatus.cls === 'ok' ? t.green : t.red), marginTop: "8px" }}>{weatherStatus.msg}</p>}
          <HourlyTable hours={hourlyData} t={t} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginTop: "10px" }}>
            <Field label="Wind" value={wind} onChange={setWind} t={t} />
            <Field label="Gusts" value={gusts} onChange={setGusts} t={t} />
            <Field label="Precip" value={precip} onChange={setPrecip} t={t} />
            <Field label="Temp" value={temp} onChange={setTemp} t={t} />
          </div>
        </section>
        <button onClick={calculate} style={{ width: "100%", padding: "15px", background: t.green, color: "white", border: "none", borderRadius: "8px", marginTop: "20px", fontWeight: "bold", cursor: "pointer" }}>
          Calculate Match Odds
        </button>
        {result && <Results r={result} t={t} />}
      </main>
    </div>
  );
}

// ─── STABLE SUB-COMPONENTS ────────────────────────────────────────────────────
function Field({ label, value, onChange, t, type = "number" }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <label style={{ display: "block", fontSize: "10px", color: t.textMuted, textTransform: "uppercase", marginBottom: "5px" }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", background: t.bgMain, border: `1px solid ${t.border}`, color: t.textMain, padding: "8px", boxSizing: "border-box", borderRadius: "4px" }} />
    </div>
  );
}

function HourlyTable({ hours, t }) {
  if (!hours) return null;
  return (
    <div style={{ marginTop: "15px", background: t.bgMain, borderRadius: "4px", padding: "10px", fontSize: "11px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: t.textMuted, borderBottom: `1px solid ${t.border}`, paddingBottom: "5px", marginBottom: "5px" }}>
        <span>Hour</span><span>Wind</span><span>Precip</span><span>Temp</span>
      </div>
      {hours.map((h, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i === hours.length - 1 ? "none" : `1px solid ${t.border}` }}>
          <span>{h.label} <small style={{ color: t.textMuted }}>({h.weight.toFixed(1)}x)</small></span>
          <span>{h.wind}mph</span><span>{h.precip}mm</span><span>{h.temp}°F</span>
        </div>
      ))}
    </div>
  );
}

function Results({ r, t }) {
  const fmtML = ml => (ml === 0 ? "EVEN" : ml > 0 ? `+${ml}` : `${ml}`);
  return (
    <div style={{ marginTop: "30px", background: t.bgCard, padding: "20px", borderRadius: "8px", border: `2px solid ${t.green}` }}>
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", textAlign: "center" }}>
        <div><p style={{ margin: 0, fontSize: "12px", color: t.textMuted }}>{r.n1}</p><h1 style={{ margin: 0, color: r.adjProb > 0.5 ? t.green : t.red }}>{fmtML(r.adjML)}</h1></div>
        <div style={{ fontWeight: "bold" }}>VS</div>
        <div><p style={{ margin: 0, fontSize: "12px", color: t.textMuted }}>{r.n2}</p><h1 style={{ margin: 0, color: r.p2Prob > 0.5 ? t.green : t.red }}>{fmtML(r.p2ML)}</h1></div>
      </div>
      <div style={{ marginTop: "20px", borderTop: `1px solid ${t.border}`, paddingTop: "15px" }}>
        <p style={{ fontSize: "12px", color: t.textMuted, textAlign: "center" }}>Simulated PCC: <strong>{r.pcc >= 0 ? "+" : ""}{r.pcc}</strong></p>
      </div>
    </div>
  );
}
