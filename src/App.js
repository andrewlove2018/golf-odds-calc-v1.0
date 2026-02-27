import React, { useState, useCallback } from "react";

// ─── ODDS TABLE ──────────────────────────────────────────────────────────────
const TABLE = [
  [
    0, -138, -190, -262, -363, -507, -715, -1020, -1477, -2169, -3238, -4915,
    -7589, -11921, -19048, -30952,
  ],
  [
    138, 0, -137, -188, -258, -356, -495, -694, -985, -1415, -2064, -3058,
    -4602, -7043, -10961, -17343,
  ],
  [
    190, 137, 0, -137, -186, -255, -350, -483, -674, -951, -1359, -1968, -2892,
    -4319, -6553, -10107,
  ],
  [
    262, 188, 137, 0, -136, -185, -251, -344, -473, -656, -920, -1306, -1878,
    -2741, -4062, -6113,
  ],
  [
    363, 258, 186, 136, 0, -135, -183, -248, -338, -462, -638, -890, -1256,
    -1796, -2602, -3827,
  ],
  [
    507, 356, 255, 185, 135, 0, -135, -182, -245, -332, -453, -622, -863, -1210,
    -1719, -2475,
  ],
  [
    715, 495, 350, 251, 183, 135, 0, -134, -180, -242, -327, -444, -606, -837,
    -1167, -1648,
  ],
  [
    1020, 694, 483, 344, 248, 182, 134, 0, -134, -179, -240, -322, -435, -592,
    -812, -1127,
  ],
  [
    1477, 985, 674, 473, 338, 245, 180, 134, 0, -133, -178, -237, -317, -426,
    -578, -789,
  ],
  [
    2169, 1415, 951, 656, 462, 332, 242, 179, 133, 0, -133, -176, -234, -312,
    -418, -564,
  ],
  [
    3238, 2064, 1359, 920, 638, 453, 327, 240, 178, 133, 0, -132, -175, -232,
    -308, -411,
  ],
  [
    4915, 3058, 1968, 1306, 890, 622, 444, 322, 237, 176, 132, 0, -132, -174,
    -229, -304,
  ],
  [
    7589, 4602, 2892, 1878, 1256, 863, 606, 435, 317, 234, 175, 132, 0, -132,
    -173, -227,
  ],
  [
    11921, 7043, 4319, 2741, 1796, 1210, 837, 592, 426, 312, 232, 174, 132, 0,
    -131, -172,
  ],
  [
    19048, 10961, 6553, 4062, 2602, 1719, 1167, 812, 578, 418, 308, 229, 173,
    131, 0, -131,
  ],
  [
    30952, 17343, 10107, 6113, 3827, 2475, 1648, 1127, 789, 564, 411, 304, 227,
    172, 131, 0,
  ],
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const clampIdx = (v) => clamp(Math.round(v), 0, 15);
const courseHcp = (idx, slope, rating, par) =>
  Math.round(idx * (slope / 113) + (rating - par));
const probToML = (p) => {
  if (p >= 0.99) return -10000;
  if (p <= 0.01) return 10000;
  return p > 0.5
    ? -Math.round((p / (1 - p)) * 100)
    : Math.round(((1 - p) / p) * 100);
};
const fmtML = (ml) => (ml === 0 ? "EVEN" : ml > 0 ? `+${ml}` : `${ml}`);

const normalCDF = (x, mean, std) => {
  const z = (x - mean) / std;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
};

const THEMES = {
  dark: {
    bgMain: "#080c10",
    bgCard: "#0d1318",
    border: "#1e2d3a",
    textMain: "#e8edf2",
    textMuted: "#5a7080",
    accent: "#c8a84b",
    green: "#34d37a",
    red: "#ff6b5b",
    greenFade: "rgba(42,124,79,0.15)",
    greenBorder: "rgba(52,211,122,0.3)",
  },
  light: {
    bgMain: "#f1f5f9",
    bgCard: "#ffffff",
    border: "#cbd5e1",
    textMain: "#0f172a",
    textMuted: "#64748b",
    accent: "#b45309",
    green: "#16a34a",
    red: "#dc2626",
    greenFade: "rgba(22,163,74,0.1)",
    greenBorder: "rgba(22,163,74,0.3)",
  },
};

const STATE_CODES = {
  or: "oregon",
  wa: "washington",
  ca: "california",
  id: "idaho",
  nv: "nevada",
  az: "arizona",
  ut: "utah",
  mt: "montana",
  wy: "wyoming",
  co: "colorado",
  nm: "new mexico",
  nd: "north dakota",
  sd: "south dakota",
  ne: "nebraska",
  ks: "kansas",
  ok: "oklahoma",
  tx: "texas",
  mn: "minnesota",
  ia: "iowa",
  mo: "missouri",
  ar: "arkansas",
  la: "louisiana",
  wi: "wisconsin",
  il: "illinois",
  ms: "mississippi",
  mi: "michigan",
  in: "indiana",
  ky: "kentucky",
  tn: "tennessee",
  al: "alabama",
  oh: "ohio",
  ga: "georgia",
  fl: "florida",
  ny: "new york",
  pa: "pennsylvania",
  nc: "north carolina",
  sc: "south carolina",
  va: "virginia",
  wv: "west virginia",
  md: "maryland",
  de: "delaware",
  nj: "new jersey",
  ct: "connecticut",
  ri: "rhode island",
  ma: "massachusetts",
  nh: "new hampshire",
  vt: "vermont",
  me: "maine",
  hi: "hawaii",
  ak: "alaska",
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date().toISOString().split("T")[0];
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
    if (!loc.trim()) {
      setWeatherStatus({ msg: "Enter a location first", cls: "err" });
      return;
    }
    setFetching(true);
    setWeatherStatus({ msg: "Verifying location...", cls: "loading" });
    try {
      const parts = loc.split(",");
      const searchCity = parts[0].trim();
      const inputST = parts.length > 1 ? parts[1].trim().toLowerCase() : null;
      const fullST = STATE_CODES[inputST] || inputST;

      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchCity
        )}&count=10&language=en&format=json`
      );
      const geoData = await geoRes.json();
      if (!geoData.results) throw new Error("Location not found.");

      let match = geoData.results.find(
        (r) =>
          r.country_code === "US" &&
          (inputST ? (r.admin1 || "").toLowerCase().includes(fullST) : true)
      );
      if (!match)
        match =
          geoData.results.find((r) => r.country_code === "US") ||
          geoData.results[0];

      const { latitude, longitude, name, admin1 } = match;
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=mm&timezone=auto&start_date=${roundDate}&end_date=${roundDate}`
      );
      const weatherData = await weatherRes.json();

      const startHour = parseInt(teeTime.split(":")[0], 10);
      const hoursArray = [];
      for (let i = 0; i < roundHours; i++) {
        const hourIdx = startHour + i;
        if (hourIdx < 24) {
          const w = Math.round(weatherData.hourly.wind_speed_10m[hourIdx]);
          const g = Math.round(
            weatherData.hourly.wind_gusts_10m[hourIdx] || w * 1.4
          );
          const prc = weatherData.hourly.precipitation[hourIdx];
          const tmp = Math.round(weatherData.hourly.temperature_2m[hourIdx]);
          const weight =
            0.134 * w +
            0.067 * g +
            Math.min(prc * 1.8, 2.0) +
            Math.max(0, (55 - tmp) / 25) * 0.5 +
            1.0;
          hoursArray.push({
            label: `Hr ${i + 1}`,
            wind: w,
            gusts: g,
            precip: prc,
            temp: tmp,
            weight,
          });
        }
      }
      const weights = hoursArray.map((h) => h.weight);
      const wAvg = (vals) =>
        vals.reduce((sum, v, i) => sum + v * weights[i], 0) /
        weights.reduce((a, b) => a + b, 0);
      setWind(wAvg(hoursArray.map((h) => h.wind)).toFixed(1));
      setGusts(wAvg(hoursArray.map((h) => h.gusts)).toFixed(1));
      setPrecip(wAvg(hoursArray.map((h) => h.precip)).toFixed(2));
      setTemp(String(Math.round(wAvg(hoursArray.map((h) => h.temp)))));
      setHourlyData(hoursArray);
      setLiveWeather({ location_found: `${name}, ${admin1}` });
      setWeatherStatus({ msg: "✓ Forecast loaded", cls: "ok" });
    } catch (e) {
      setWeatherStatus({ msg: `⚠ ${e.message}`, cls: "err" });
    }
    setFetching(false);
  }, [loc, teeTime, roundDate, roundHours]);

  const calculate = useCallback(() => {
    const p1i = parseFloat(p1hcp);
    const p2i = parseFloat(p2hcp);
    if (isNaN(p1i) || isNaN(p2i)) return;
    const rat = parseFloat(rating);
    const slp = parseFloat(slope);
    const pr = parseInt(par);
    const ch1 = courseHcp(p1i, slp, rat, pr);
    const ch2 = courseHcp(p2i, slp, rat, pr);
    const w = parseFloat(wind);
    const g = parseFloat(gusts);
    const prc = parseFloat(precip);
    const tmp = parseFloat(temp);
    const pcc = clamp(
      Math.round(
        (0.134 * w +
          0.067 * g +
          Math.min(prc * 1.8, 2.0) +
          Math.max(0, (55 - tmp) / 25) * 0.5 -
          1.0) *
          2
      ) / 2,
      -1,
      3
    );
    setResult({
      n1: p1name || "P1",
      n2: p2name || "P2",
      p1i,
      p2i,
      ch1,
      ch2,
      pcc,
    });
  }, [
    p1hcp,
    p2hcp,
    rating,
    slope,
    par,
    wind,
    gusts,
    precip,
    temp,
    p1name,
    p2name,
  ]);

  return (
    <div
      style={{
        background: t.bgMain,
        color: t.textMain,
        minHeight: "100vh",
        fontFamily: "monospace",
      }}
    >
      <header
        style={{
          background: t.bgCard,
          padding: "10px 20px",
          borderBottom: `1px solid ${t.border}`,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ margin: 0 }}>Golf Odds Calculator</h2>
        <button
          onClick={() => setIsLightMode(!isLightMode)}
          style={{
            borderRadius: "20px",
            background: t.bgMain,
            color: t.textMain,
            border: `1px solid ${t.border}`,
            padding: "5px 15px",
            cursor: "pointer",
          }}
        >
          {isLightMode ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <section
            style={{
              background: t.bgCard,
              padding: "15px",
              borderRadius: "8px",
              border: `1px solid ${t.border}`,
            }}
          >
            <Field
              label="P1 Name"
              value={p1name}
              onChange={setP1name}
              type="text"
              t={t}
            />
            <Field label="P1 Index" value={p1hcp} onChange={setP1hcp} t={t} />
          </section>
          <section
            style={{
              background: t.bgCard,
              padding: "15px",
              borderRadius: "8px",
              border: `1px solid ${t.border}`,
            }}
          >
            <Field
              label="P2 Name"
              value={p2name}
              onChange={setP2name}
              type="text"
              t={t}
            />
            <Field label="P2 Index" value={p2hcp} onChange={setP2hcp} t={t} />
          </section>
        </div>
        <section
          style={{
            background: t.bgCard,
            padding: "15px",
            borderRadius: "8px",
            border: `1px solid ${t.border}`,
            marginTop: "20px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
            }}
          >
            <Field label="Rating" value={rating} onChange={setRating} t={t} />
            <Field label="Slope" value={slope} onChange={setSlope} t={t} />
            <Field label="Par" value={par} onChange={setPar} t={t} />
          </div>
        </section>
        <section
          style={{
            background: t.bgCard,
            padding: "15px",
            borderRadius: "8px",
            border: `1px solid ${t.border}`,
            marginTop: "20px",
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                display: "block",
                fontSize: "10px",
                color: t.textMuted,
                textTransform: "uppercase",
                marginBottom: "5px",
              }}
            >
              Course Location (City, ST)
            </label>
            <input
              type="text"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              placeholder="Corvallis, OR"
              style={{
                width: "100%",
                background: t.bgMain,
                border: `1px solid ${t.border}`,
                color: t.textMain,
                padding: "8px",
                boxSizing: "border-box",
                borderRadius: "4px",
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <Field
              label="Tee Time"
              value={teeTime}
              onChange={setTeeTime}
              type="time"
              t={t}
            />
            <Field
              label="Date"
              value={roundDate}
              onChange={setRoundDate}
              type="date"
              t={t}
            />
          </div>
          <div style={{ marginTop: "10px" }}>
            <label style={{ fontSize: "12px", color: t.textMuted }}>
              Round Length: {roundHours}h
            </label>
            <input
              type="range"
              min="3"
              max="6"
              value={roundHours}
              onChange={(e) => setRoundHours(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: t.green }}
            />
          </div>
          <button
            onClick={fetchWeather}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              background: t.greenFade,
              color: t.green,
              border: `1px solid ${t.greenBorder}`,
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            {fetching ? "Syncing..." : `Fetch Local Forecast`}
          </button>
          {liveWeather && (
            <div
              style={{
                fontSize: "12px",
                color: t.green,
                textAlign: "center",
                marginTop: "5px",
              }}
            >
              Synced: {liveWeather.location_found}
            </div>
          )}
          <HourlyTable hours={hourlyData} t={t} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <Field label="Wind" value={wind} onChange={setWind} t={t} />
            <Field label="Gusts" value={gusts} onChange={setGusts} t={t} />
            <Field label="Precip" value={precip} onChange={setPrecip} t={t} />
            <Field label="Temp" value={temp} onChange={setTemp} t={t} />
          </div>
        </section>
        <button
          onClick={calculate}
          style={{
            width: "100%",
            padding: "15px",
            background: t.green,
            color: "white",
            border: "none",
            borderRadius: "8px",
            marginTop: "20px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Calculate Match Odds
        </button>
        {result && <PropBoard r={result} t={t} />}
      </main>
    </div>
  );
}

function Field({ label, value, onChange, t, type = "number" }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <label
        style={{
          display: "block",
          fontSize: "10px",
          color: t.textMuted,
          textTransform: "uppercase",
          marginBottom: "5px",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: t.bgMain,
          border: `1px solid ${t.border}`,
          color: t.textMain,
          padding: "8px",
          boxSizing: "border-box",
          borderRadius: "4px",
        }}
      />
    </div>
  );
}

function HourlyTable({ hours, t }) {
  if (!hours) return null;
  return (
    <div
      style={{
        marginTop: "15px",
        background: t.bgMain,
        borderRadius: "4px",
        padding: "10px",
        fontSize: "11px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: `1px solid ${t.border}`,
          paddingBottom: "5px",
          marginBottom: "5px",
          color: t.textMuted,
        }}
      >
        <span>Hour</span>
        <span>Wind</span>
        <span>Precip</span>
        <span>Temp</span>
      </div>
      {hours.map((h, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "5px 0",
            borderBottom:
              i === hours.length - 1 ? "none" : `1px solid ${t.border}`,
          }}
        >
          <span>{h.label}</span>
          <span>{h.wind}mph</span>
          <span>{h.precip}mm</span>
          <span>{h.temp}°F</span>
        </div>
      ))}
    </div>
  );
}

function PropBoard({ r, t }) {
  const [wager1, setWager1] = useState("");
  const [wager2, setWager2] = useState("");
  const [selectedBet, setSelectedBet] = useState(null);

  const isP1Fav = r.ch1 <= r.ch2;
  const fav = isP1Fav
    ? { name: r.n1, ch: r.ch1, i: r.p1i }
    : { name: r.n2, ch: r.ch2, i: r.p2i };
  const dog = isP1Fav
    ? { name: r.n2, ch: r.ch2, i: r.p2i }
    : { name: r.n1, ch: r.ch1, i: r.p1i };

  const sF = {
    mu: fav.ch + 3.0 + (r.pcc > 0 ? r.pcc * (1 + fav.i / 20) : r.pcc),
    sigma: 2.5 + 0.08 * fav.ch,
  };
  const sD = {
    mu: dog.ch + 3.0 + (r.pcc > 0 ? r.pcc * (1 + dog.i / 20) : r.pcc),
    sigma: 2.5 + 0.08 * dog.ch,
  };
  const sigT = Math.sqrt(Math.pow(sF.sigma, 2) + Math.pow(sD.sigma, 2));

  const chDiff = Math.abs(r.ch1 - r.ch2);
  const props = [];

  const minStrokes = chDiff <= 1 ? -3 : chDiff <= 2 ? -2 : 0;
  const maxStrokes = chDiff + 5;

  for (let s = minStrokes; s <= maxStrokes; s++) {
    const muDelta = sF.mu - (sD.mu - s);
    const probFavWins = normalCDF(0, muDelta, sigT);
    props.push({
      strokes: s,
      label:
        s < 0
          ? `${dog.name} giving ${Math.abs(s)} strokes`
          : `${fav.name} giving ${s} strokes`,
      giver: s < 0 ? dog.name : fav.name,
      receiver: s < 0 ? fav.name : dog.name,
      ml: probToML(probFavWins),
      prob: (probFavWins * 100).toFixed(1),
    });
  }

  const syncWagers = (val, source) => {
    if (!selectedBet || val === "") {
      setWager1("");
      setWager2("");
      return;
    }
    const num = parseFloat(val);
    const ml = selectedBet.ml;
    if (source === "giver") {
      setWager1(val);
      const opp = ml > 0 ? num * (ml / 100) : num / (Math.abs(ml) / 100);
      setWager2(opp.toFixed(2));
    } else {
      setWager2(val);
      const opp = ml > 0 ? num / (ml / 100) : num * (Math.abs(ml) / 100);
      setWager1(opp.toFixed(2));
    }
  };

  return (
    <div
      style={{
        marginTop: "20px",
        background: t.bgCard,
        padding: "15px",
        borderRadius: "8px",
        border: `1px solid ${t.border}`,
      }}
    >
      <h3
        style={{
          fontSize: "10px",
          color: t.accent,
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        Match Props
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2.5fr 1fr 1fr 1fr",
          gap: "5px",
          fontSize: "11px",
          textAlign: "center",
        }}
      >
        <div style={{ color: t.textMuted }}>Line</div>
        <div style={{ color: t.textMuted }}>ML</div>
        <div style={{ color: t.textMuted }}>Win%</div>
        <div />
        {props
          .sort((a, b) => a.strokes - b.strokes)
          .map((p, i) => (
            <React.Fragment key={i}>
              <div
                style={{
                  padding: "8px 0",
                  borderBottom: `1px dotted ${t.border}`,
                  color: p.strokes === chDiff ? t.green : t.textMain,
                }}
              >
                {p.label} {p.strokes === chDiff ? "(Fair)" : ""}
              </div>
              <div
                style={{
                  padding: "8px 0",
                  borderBottom: `1px dotted ${t.border}`,
                  color: p.ml <= 0 ? t.green : t.red,
                }}
              >
                {fmtML(p.ml)}
              </div>
              <div
                style={{
                  padding: "8px 0",
                  borderBottom: `1px dotted ${t.border}`,
                }}
              >
                {p.prob}%
              </div>
              <button
                onClick={() => {
                  setSelectedBet(p);
                  setWager1("");
                  setWager2("");
                }}
                style={{
                  background:
                    selectedBet?.strokes === p.strokes &&
                    selectedBet?.giver === p.giver
                      ? t.green
                      : t.bgMain,
                  color:
                    selectedBet?.strokes === p.strokes &&
                    selectedBet?.giver === p.giver
                      ? "white"
                      : t.textMain,
                  border: `1px solid ${t.border}`,
                  cursor: "pointer",
                  fontSize: "9px",
                  borderRadius: "4px",
                }}
              >
                SELECT
              </button>
            </React.Fragment>
          ))}
      </div>
      {selectedBet && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: t.bgMain,
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "11px", color: t.accent, fontWeight: "bold" }}>
            BET: {selectedBet.label}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginTop: "15px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "9px",
                  color: t.textMuted,
                  display: "block",
                }}
              >
                {selectedBet.giver} Risks
              </label>
              <input
                type="number"
                value={wager1}
                onChange={(e) => syncWagers(e.target.value, "giver")}
                placeholder="$"
                style={{
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  color: t.textMain,
                  padding: "8px",
                  width: "90px",
                  textAlign: "center",
                }}
              />
            </div>
            <div style={{ fontSize: "20px", marginTop: "15px" }}>vs</div>
            <div>
              <label
                style={{
                  fontSize: "9px",
                  color: t.textMuted,
                  display: "block",
                }}
              >
                {selectedBet.receiver} Risks
              </label>
              <input
                type="number"
                value={wager2}
                onChange={(e) => syncWagers(e.target.value, "receiver")}
                placeholder="$"
                style={{
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  color: t.textMain,
                  padding: "8px",
                  width: "90px",
                  textAlign: "center",
                }}
              />
            </div>
          </div>
          <p
            style={{ fontSize: "10px", color: t.textMuted, marginTop: "15px" }}
          >
            Winner takes the pot:{" "}
            <strong style={{ color: t.green }}>
              ${(parseFloat(wager1 || 0) + parseFloat(wager2 || 0)).toFixed(2)}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}
