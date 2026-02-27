import React, { useState, useCallback } from "react";

// ─── ODDS TABLE (18 holes · Par 72 · Rating 72.0 · Slope 113) ────────────────
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
const mlToProb = (ml) => {
  if (ml === 0) return 0.5;
  return ml < 0 ? -ml / (-ml + 100) : 100 / (ml + 100);
};
const probToML = (p) => {
  if (Math.abs(p - 0.5) < 0.001) return 0;
  return p > 0.5
    ? -Math.round((p / (1 - p)) * 100)
    : Math.round(((1 - p) / p) * 100);
};
const fmtML = (ml) => (ml === 0 ? "EVEN" : ml > 0 ? `+${ml}` : `${ml}`);

// Dynamic Weighting based on weather severity
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

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  wrap: {
    background: "#080c10",
    minHeight: "100vh",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    color: "#e8edf2",
    padding: 0,
  },
  header: {
    background: "#0d1318",
    borderBottom: "1px solid #1e2d3a",
    padding: "18px 32px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  h1: {
    fontFamily: "Georgia, serif",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "0.02em",
    margin: 0,
  },
  sub: {
    marginLeft: "auto",
    fontSize: 10,
    color: "#5a7080",
    textAlign: "right",
    lineHeight: 1.6,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  main: { maxWidth: 900, margin: "0 auto", padding: "28px 20px" },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#5a7080",
    marginBottom: 10,
  },
  card: {
    background: "#0d1318",
    border: "1px solid #1e2d3a",
    borderRadius: 6,
    padding: "20px 22px",
    marginBottom: 18,
  },
  cardTitle: {
    fontFamily: "Georgia, serif",
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 14,
    color: "#c8a84b",
  },
  label: {
    display: "block",
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#5a7080",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    background: "#080c10",
    border: "1px solid #1e2d3a",
    borderRadius: 4,
    color: "#e8edf2",
    fontFamily: "inherit",
    fontSize: 14,
    padding: "9px 11px",
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 },
  grid4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 },
  fetchBtn: {
    width: "100%",
    padding: "10px 0",
    background: "rgba(42,124,79,0.15)",
    border: "1px solid rgba(52,211,122,0.3)",
    borderRadius: 4,
    color: "#34d37a",
    fontFamily: "inherit",
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: "pointer",
    marginBottom: 14,
    transition: "all 0.2s",
  },
  calcBtn: {
    width: "100%",
    padding: 15,
    background: "#2a7c4f",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontFamily: "Georgia, serif",
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 28,
    letterSpacing: "0.03em",
  },
  statusBase: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 8,
    minHeight: 16,
    letterSpacing: "0.08em",
  },
  liveBox: {
    background: "#080c10",
    border: "1px solid #1e2d3a",
    borderRadius: 4,
    padding: "10px 14px",
    fontSize: 11,
    lineHeight: 1.8,
    marginBottom: 14,
    color: "#5a7080",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 16,
    alignItems: "center",
    textAlign: "center",
  },
  prName: {
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#5a7080",
    marginBottom: 6,
  },
  prProb: { fontSize: 12, color: "#5a7080", marginTop: 4 },
  vsText: {
    fontSize: 12,
    color: "#1e2d3a",
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
  edgeBar: {
    height: 4,
    background: "#1e2d3a",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 14,
  },
  brkRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid rgba(30,45,58,0.5)",
    fontSize: 12,
  },
  brkLabel: { color: "#5a7080", fontSize: 11 },
  brkVal: { fontFamily: "inherit", fontSize: 12 },
  formula: {
    background: "#080c10",
    border: "1px solid #1e2d3a",
    borderLeft: "3px solid #1a9e6e",
    padding: "13px 15px",
    borderRadius: 4,
    fontSize: 11,
    lineHeight: 1.9,
    color: "#5a7080",
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
  },
  disclaimer: {
    fontSize: 11,
    color: "#5a7080",
    lineHeight: 1.7,
    padding: "14px 16px",
    background: "#0d1318",
    border: "1px solid #1e2d3a",
    borderRadius: 6,
    fontStyle: "italic",
  },
  shareRow: { display: "flex", gap: 10, marginBottom: 18 },
  shareBtn: {
    padding: "9px 18px",
    background: "#0d1318",
    border: "1px solid #1e2d3a",
    borderRadius: 4,
    color: "#5a7080",
    fontFamily: "inherit",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
  hourRow: {
    display: "grid",
    gridTemplateColumns: "80px 1fr 1fr 1fr 1fr",
    gap: 0,
    fontSize: 10,
    borderBottom: "1px solid #1e2d3a",
  },
  hourCell: { padding: "5px 8px", color: "#5a7080", letterSpacing: "0.06em" },
  hourCellVal: {
    padding: "5px 8px",
    color: "#e8edf2",
    textAlign: "right",
    letterSpacing: "0.04em",
  },
};

function Field({
  label,
  value,
  onChange,
  type = "number",
  placeholder,
  min,
  max,
  step = "any",
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      <input
        style={S.input}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

// ─── HOURLY FORECAST TABLE display ───────────────────────────────────────────
function HourlyTable({ hours, teeTime }) {
  if (!hours || !hours.length) return null;

  // Format military time to AM/PM for display
  const formatTime = (timeStr) => {
    let [h, m] = timeStr.split(":");
    let hour = parseInt(h);
    let ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const weights = hours.map((h) => h.weight);

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#5a7080",
          marginBottom: 6,
        }}
      >
        4-Hour Round Forecast · Tee {formatTime(teeTime)}
      </div>
      <div
        style={{
          background: "#080c10",
          border: "1px solid #1e2d3a",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div style={{ ...S.hourRow, background: "#0a1018" }}>
          <div style={{ ...S.hourCell, color: "#3a5060" }}>Hour</div>
          <div style={{ ...S.hourCell, textAlign: "right", color: "#3a5060" }}>
            Wind mph
          </div>
          <div style={{ ...S.hourCell, textAlign: "right", color: "#3a5060" }}>
            Gusts mph
          </div>
          <div style={{ ...S.hourCell, textAlign: "right", color: "#3a5060" }}>
            Precip mm
          </div>
          <div style={{ ...S.hourCell, textAlign: "right", color: "#3a5060" }}>
            Temp °F
          </div>
        </div>
        {hours.map((h, i) => (
          <div
            key={i}
            style={{
              ...S.hourRow,
              background:
                i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
            }}
          >
            <div style={S.hourCell}>
              {h.label}
              <span
                style={{ color: "#3a5060", marginLeft: 4 }}
              >{`(${h.weight.toFixed(1)}×)`}</span>
            </div>
            <div
              style={{
                ...S.hourCellVal,
                color:
                  h.wind > 15 ? "#ff6b5b" : h.wind > 8 ? "#c8a84b" : "#34d37a",
              }}
            >
              {h.wind}
            </div>
            <div
              style={{
                ...S.hourCellVal,
                color: h.gusts > 20 ? "#ff6b5b" : "#e8edf2",
              }}
            >
              {h.gusts}
            </div>
            <div
              style={{
                ...S.hourCellVal,
                color: h.precip > 0 ? "#c8a84b" : "#5a7080",
              }}
            >
              {h.precip.toFixed(1)}
            </div>
            <div style={S.hourCellVal}>{h.temp}°</div>
          </div>
        ))}
        {/* weighted avg row */}
        <div
          style={{
            ...S.hourRow,
            background: "rgba(26,158,110,0.08)",
            borderTop: "1px solid #1e2d3a",
          }}
        >
          <div style={{ ...S.hourCell, color: "#1a9e6e" }}>Dyn Avg</div>
          <div style={{ ...S.hourCellVal, color: "#1a9e6e" }}>
            {weightedAvg(
              hours.map((h) => h.wind),
              weights
            ).toFixed(1)}
          </div>
          <div style={{ ...S.hourCellVal, color: "#1a9e6e" }}>
            {weightedAvg(
              hours.map((h) => h.gusts),
              weights
            ).toFixed(1)}
          </div>
          <div style={{ ...S.hourCellVal, color: "#1a9e6e" }}>
            {weightedAvg(
              hours.map((h) => h.precip),
              weights
            ).toFixed(2)}
          </div>
          <div style={{ ...S.hourCellVal, color: "#1a9e6e" }}>
            {Math.round(
              weightedAvg(
                hours.map((h) => h.temp),
                weights
              )
            )}
            °
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date().toISOString().split("T")[0];

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

  const [wind, setWind] = useState("");
  const [gusts, setGusts] = useState("");
  const [precip, setPrecip] = useState("");
  const [temp, setTemp] = useState("70");
  const [hourlyData, setHourlyData] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState({ msg: "", cls: "" });
  const [liveWeather, setLiveWeather] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState(null);

  // ── Smart Weather Fetch ──────────────────────────────────────────────────────
  const fetchWeather = useCallback(async () => {
    if (!loc.trim()) {
      setWeatherStatus({ msg: "Enter a location first", cls: "err" });
      return;
    }
    if (!roundDate || !teeTime) {
      setWeatherStatus({ msg: "Enter a valid date and tee time", cls: "err" });
      return;
    }

    setFetching(true);
    setHourlyData(null);
    setLiveWeather(null);
    setWeatherStatus({ msg: "Finding location...", cls: "loading" });

    try {
      const parts = loc.split(",");
      const searchCity = parts[0].trim();

      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchCity
        )}&count=10&language=en&format=json`
      );
      if (!geoRes.ok) throw new Error("Geocoding failed");
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(
          "Location not found. Check spelling or try just the city name."
        );
      }

      let match = geoData.results[0];

      if (parts.length > 1) {
        const searchRegion = parts[1].trim().toLowerCase();

        const states = {
          al: "alabama",
          ak: "alaska",
          az: "arizona",
          ar: "arkansas",
          ca: "california",
          co: "colorado",
          ct: "connecticut",
          de: "delaware",
          fl: "florida",
          ga: "georgia",
          hi: "hawaii",
          id: "idaho",
          il: "illinois",
          in: "indiana",
          ia: "iowa",
          ks: "kansas",
          ky: "kentucky",
          la: "louisiana",
          me: "maine",
          md: "maryland",
          ma: "massachusetts",
          mi: "michigan",
          mn: "minnesota",
          ms: "mississippi",
          mo: "missouri",
          mt: "montana",
          ne: "nebraska",
          nv: "nevada",
          nh: "new hampshire",
          nj: "new jersey",
          nm: "new mexico",
          ny: "new york",
          nc: "north carolina",
          nd: "north dakota",
          oh: "ohio",
          ok: "oklahoma",
          or: "oregon",
          pa: "pennsylvania",
          ri: "rhode island",
          sc: "south carolina",
          sd: "south dakota",
          tn: "tennessee",
          tx: "texas",
          ut: "utah",
          vt: "vermont",
          va: "virginia",
          wa: "washington",
          wv: "west virginia",
          wi: "wisconsin",
          wy: "wyoming",
        };
        const expandedRegion = states[searchRegion] || searchRegion;

        const found = geoData.results.find((r) => {
          const state = (r.admin1 || "").toLowerCase();
          const country = (r.country || "").toLowerCase();
          return (
            state.includes(expandedRegion) ||
            expandedRegion.includes(state) ||
            country.includes(expandedRegion)
          );
        });

        if (found) match = found;
      }

      const { latitude, longitude, name, admin1, country_code } = match;
      setWeatherStatus({ msg: "Fetching forecast data...", cls: "loading" });

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=mm&timezone=auto&start_date=${roundDate}&end_date=${roundDate}`
      );
      if (!weatherRes.ok) throw new Error("Weather data fetch failed");
      const weatherData = await weatherRes.json();

      const startHour = parseInt(teeTime.split(":")[0], 10);
      const hoursArray = [];

      for (let i = 0; i < 4; i++) {
        const hourIdx = startHour + i;
        if (hourIdx < 24) {
          const w = Math.round(weatherData.hourly.wind_speed_10m[hourIdx]);
          const g = Math.round(
            weatherData.hourly.wind_gusts_10m[hourIdx] ||
              weatherData.hourly.wind_speed_10m[hourIdx] * 1.4
          );
          const prc = weatherData.hourly.precipitation[hourIdx];
          const tmp = Math.round(weatherData.hourly.temperature_2m[hourIdx]);

          hoursArray.push({
            label: `Hr ${i + 1}`,
            time: `${hourIdx}:00`,
            wind: w,
            gusts: g,
            precip: prc,
            temp: tmp,
            weight: calcHourWeight(w, g, prc, tmp),
          });
        }
      }

      if (hoursArray.length === 0)
        throw new Error("No forecast available for that time today");

      const weights = hoursArray.map((h) => h.weight);

      setWind(
        weightedAvg(
          hoursArray.map((h) => h.wind),
          weights
        ).toFixed(1)
      );
      setGusts(
        weightedAvg(
          hoursArray.map((h) => h.gusts),
          weights
        ).toFixed(1)
      );
      setPrecip(
        weightedAvg(
          hoursArray.map((h) => h.precip),
          weights
        ).toFixed(2)
      );
      setTemp(
        String(
          Math.round(
            weightedAvg(
              hoursArray.map((h) => h.temp),
              weights
            )
          )
        )
      );

      setHourlyData(hoursArray);

      const locDisplay = [name, admin1, country_code]
        .filter(Boolean)
        .join(", ");
      setLiveWeather({ location_found: locDisplay, source: "Open-Meteo API" });
      setWeatherStatus({
        msg: "✓ 4-hour forecast loaded successfully",
        cls: "ok",
      });
    } catch (e) {
      setWeatherStatus({ msg: `⚠ ${e.message}`, cls: "err" });
    }
    setFetching(false);
  }, [loc, teeTime, roundDate]);

  // ── Calculate ─────────────────────────────────────────────────────────────
  const calculate = useCallback(() => {
    const p1i = parseFloat(p1hcp);
    const p2i = parseFloat(p2hcp);
    if (isNaN(p1i) || isNaN(p2i)) {
      alert("Please enter both handicap indexes.");
      return;
    }

    const rat = parseFloat(rating) || 72.0;
    const slp = parseFloat(slope) || 113;
    const pr = parseInt(par) || 72;
    const w = parseFloat(wind) || 0;
    const g = parseFloat(gusts) || 0;
    const prc = parseFloat(precip) || 0;
    const tmp = parseFloat(temp) || 70;
    const n1 = p1name.trim() || "Player 1";
    const n2 = p2name.trim() || "Player 2";

    const ch1 = courseHcp(p1i, slp, rat, pr);
    const ch2 = courseHcp(p2i, slp, rat, pr);
    const row = clampIdx(ch1);
    const col = clampIdx(ch2);
    const baseML = TABLE[row][col];

    const windScore = 0.134 * w + 0.067 * g;
    const precipScore = Math.min(prc * 1.8, 2.0);
    const tempScore = Math.max(0, (55 - tmp) / 25) * 0.5;
    const rawPCC = windScore + precipScore + tempScore - 1.0;
    const pcc = clamp(Math.round(rawPCC * 2) / 2, -1, 3);

    const varianceFactor = 1 + Math.max(0, pcc) * 0.07;
    const baseProb = mlToProb(baseML);
    const edge = baseProb - 0.5;
    const adjProb = 0.5 + edge / varianceFactor;
    const adjML = probToML(adjProb);
    const p2Prob = 1 - adjProb;
    const p2ML = probToML(p2Prob);

    setResult({
      n1,
      n2,
      p1i,
      p2i,
      ch1,
      ch2,
      row,
      col,
      baseML,
      adjML,
      p2ML,
      adjProb,
      p2Prob,
      pcc,
      rawPCC,
      windScore,
      precipScore,
      tempScore,
      varianceFactor,
      rat,
      slp,
      pr,
      w,
      g,
      prc,
      tmp,
      usedHourly: !!hourlyData,
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
    hourlyData,
  ]);

  const statusColor = { loading: "#c8a84b", ok: "#34d37a", err: "#ff6b5b" };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div
          style={{
            width: 10,
            height: 26,
            background: "#34d37a",
            borderRadius: 1,
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 10,
              width: 0,
              height: 0,
              borderTop: "8px solid #34d37a",
              borderRight: "14px solid transparent",
            }}
          />
        </div>
        <h1 style={S.h1}>Golf Match Odds</h1>
        <div style={S.sub}>
          Weather-Adjusted · PCC Simulation
          <br />
          Gross Stroke Play · 18 Holes
        </div>
      </div>

      <div style={S.main}>
        {/* Players */}
        <div style={S.sectionLabel}>Players</div>
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardTitle}>● Player 1</div>
            <Field
              label="Name (optional)"
              value={p1name}
              onChange={setP1name}
              type="text"
              placeholder="Player 1"
            />
            <Field
              label="Handicap Index"
              value={p1hcp}
              onChange={setP1hcp}
              placeholder="e.g. 8.4"
              min={0}
              max={54}
              step="0.1"
            />
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>● Player 2</div>
            <Field
              label="Name (optional)"
              value={p2name}
              onChange={setP2name}
              type="text"
              placeholder="Player 2"
            />
            <Field
              label="Handicap Index"
              value={p2hcp}
              onChange={setP2hcp}
              placeholder="e.g. 14.2"
              min={0}
              max={54}
              step="0.1"
            />
          </div>
        </div>

        {/* Course */}
        <div style={S.sectionLabel}>Course</div>
        <div style={S.card}>
          <div style={S.grid4}>
            <Field
              label="Course Rating™"
              value={rating}
              onChange={setRating}
              placeholder="72.0"
              min={60}
              max={80}
              step="0.1"
            />
            <Field
              label="Slope Rating™"
              value={slope}
              onChange={setSlope}
              placeholder="113"
              min={55}
              max={155}
            />
            <Field
              label="Par"
              value={par}
              onChange={setPar}
              placeholder="72"
              min={70}
              max={74}
            />
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Tee</label>
              <select style={{ ...S.input, appearance: "none" }}>
                <option>Men's</option>
                <option>Women's</option>
              </select>
            </div>
          </div>
        </div>

        {/* Weather */}
        <div style={S.sectionLabel}>Playing Conditions</div>
        <div style={S.card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Weather
            </span>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "rgba(42,124,79,0.2)",
                color: "#34d37a",
                border: "1px solid rgba(52,211,122,0.25)",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              4-Hour Forecast
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#5a7080",
              marginBottom: 14,
              fontStyle: "italic",
            }}
          >
            Fetches an hourly forecast for the full round window (tee time + 4
            hrs). Applies a <strong>dynamic weighting system</strong> where
            hours with more severe weather automatically carry more weight in
            the final average.
          </div>

          <div style={S.grid3}>
            <Field
              label="City / Course Location"
              value={loc}
              onChange={setLoc}
              type="text"
              placeholder="e.g. Corvallis, OR"
            />
            <Field
              label="Tee Time"
              value={teeTime}
              onChange={setTeeTime}
              type="time"
            />
            <Field
              label="Round Date"
              value={roundDate}
              onChange={setRoundDate}
              type="date"
            />
          </div>

          {weatherStatus.msg && (
            <div
              style={{
                ...S.statusBase,
                color: statusColor[weatherStatus.cls] || "#5a7080",
              }}
            >
              {weatherStatus.msg}
            </div>
          )}

          <button style={S.fetchBtn} onClick={fetchWeather} disabled={fetching}>
            {fetching
              ? "⟳ Searching hourly forecast…"
              : "⬇ Fetch 4-Hour Round Forecast"}
          </button>

          {liveWeather && (
            <div style={{ ...S.liveBox, marginBottom: 10 }}>
              <span style={{ color: "#1a9e6e" }}>location: </span>
              <span style={{ color: "#e8edf2" }}>
                {liveWeather.location_found}
              </span>
              {liveWeather.source && (
                <>
                  <br />
                  <span style={{ color: "#1a9e6e" }}>source: </span>
                  <span style={{ color: "#e8edf2" }}>{liveWeather.source}</span>
                </>
              )}
            </div>
          )}

          {/* Hourly breakdown table */}
          <HourlyTable hours={hourlyData} teeTime={teeTime} />

          {/* Manual override / weighted result fields */}
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#3a5060",
              marginBottom: 8,
            }}
          >
            {hourlyData
              ? "Dynamic Weighted Round Averages (editable)"
              : "Manual Entry"}
          </div>
          <div style={S.grid4}>
            <Field
              label="Wind Speed (mph)"
              value={wind}
              onChange={setWind}
              placeholder="0"
              min={0}
              max={60}
              step="0.1"
            />
            <Field
              label="Gusts (mph)"
              value={gusts}
              onChange={setGusts}
              placeholder="0"
              min={0}
              max={80}
              step="0.1"
            />
            <Field
              label="Precipitation (mm/hr)"
              value={precip}
              onChange={setPrecip}
              placeholder="0"
              min={0}
              max={50}
              step="0.01"
            />
            <Field
              label="Temp (°F)"
              value={temp}
              onChange={setTemp}
              placeholder="70"
              min={-10}
              max={120}
            />
          </div>
        </div>

        <button style={S.calcBtn} onClick={calculate}>
          Calculate Match Odds
        </button>

        {result && (
          <Results r={result} hourlyData={hourlyData} teeTime={teeTime} />
        )}
      </div>
    </div>
  );
}

// ─── RESULTS PANEL ───────────────────────────────────────────────────────────
function Results({ r, hourlyData, teeTime }) {
  const copy = (text) =>
    navigator.clipboard.writeText(text).then(() => alert("Copied!"));

  const pccPct = clamp(((r.pcc + 1) / 4) * 100, 3, 97);

  const formatTimeDisplay = (timeStr) => {
    let [h, m] = timeStr.split(":");
    let hour = parseInt(h);
    let ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const oddsText =
    `⛳ Golf Match Odds (Weather-Adjusted)\n` +
    `${r.n1} (HCP ${r.p1i}) vs ${r.n2} (HCP ${r.p2i})\n` +
    `Course: Rating ${r.rat} / Slope ${r.slp} / Par ${r.pr}\n` +
    (r.usedHourly ? `Conditions: 4-hr dyn weighted avg — ` : `Conditions: `) +
    `${parseFloat(r.w).toFixed(1)} mph wind, ${parseFloat(r.g).toFixed(
      1
    )} mph gusts, ${parseFloat(r.prc).toFixed(2)} mm precip, ${r.tmp}°F\n` +
    `Simulated PCC: ${r.pcc >= 0 ? "+" : ""}${
      r.pcc
    }\n──────────────────────\n` +
    `${r.n1}: ${fmtML(r.adjML)} (${(r.adjProb * 100).toFixed(1)}% win)\n` +
    `${r.n2}: ${fmtML(r.p2ML)} (${(r.p2Prob * 100).toFixed(1)}% win)`;

  const formulaText =
    `CH_${r.n1} = round(${r.p1i} × (${r.slp}/113) + (${r.rat}−${r.pr})) = ${r.ch1}\n` +
    `CH_${r.n2} = round(${r.p2i} × (${r.slp}/113) + (${r.rat}−${r.pr})) = ${r.ch2}\n` +
    `BaseML = TABLE[${r.row}][${r.col}] = ${fmtML(r.baseML)} → ${(
      mlToProb(r.baseML) * 100
    ).toFixed(1)}% for ${r.n1}\n\n` +
    (r.usedHourly
      ? `[4-hour dynamic weighted avg used — worse weather weighted heavier]\n`
      : "") +
    `WindScore   = 0.134×${parseFloat(r.w).toFixed(1)} + 0.067×${parseFloat(
      r.g
    ).toFixed(1)} = ${r.windScore.toFixed(3)}\n` +
    `PrecipScore = min(${parseFloat(r.prc).toFixed(
      2
    )}×1.8, 2.0) = ${r.precipScore.toFixed(3)}\n` +
    `TempScore   = max(0,(55−${r.tmp})/25)×0.5 = ${r.tempScore.toFixed(3)}\n` +
    `Raw_PCC     = ${r.rawPCC.toFixed(3)} → PCC = ${r.pcc >= 0 ? "+" : ""}${
      r.pcc
    }\n\n` +
    `Variance_factor = ${r.varianceFactor.toFixed(4)}\n` +
    `Adj_Prob(${r.n1}) = ${(r.adjProb * 100).toFixed(2)}% → ${fmtML(
      r.adjML
    )}\n` +
    `Adj_Prob(${r.n2}) = ${(r.p2Prob * 100).toFixed(2)}% → ${fmtML(r.p2ML)}`;

  const BrkRow = ({ label, val, color }) => (
    <div style={S.brkRow}>
      <span style={S.brkLabel}>{label}</span>
      <span style={{ ...S.brkVal, color: color || "#e8edf2" }}>{val}</span>
    </div>
  );

  return (
    <div>
      <div style={S.sectionLabel}>Match Result</div>
      <div style={{ ...S.card, marginBottom: 8 }}>
        <div style={S.heroGrid}>
          <div>
            <div style={S.prName}>{r.n1}</div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 38,
                fontWeight: 900,
                lineHeight: 1,
                color: r.adjProb >= 0.5 ? "#34d37a" : "#ff6b5b",
              }}
            >
              {fmtML(r.adjML)}
            </div>
            <div style={S.prProb}>{(r.adjProb * 100).toFixed(1)}% win prob</div>
          </div>
          <div style={S.vsText}>VS</div>
          <div>
            <div style={S.prName}>{r.n2}</div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 38,
                fontWeight: 900,
                lineHeight: 1,
                color: r.p2Prob >= 0.5 ? "#34d37a" : "#ff6b5b",
              }}
            >
              {fmtML(r.p2ML)}
            </div>
            <div style={S.prProb}>{(r.p2Prob * 100).toFixed(1)}% win prob</div>
          </div>
        </div>
        <div style={S.edgeBar}>
          <div
            style={{
              height: "100%",
              width: `${r.adjProb * 100}%`,
              background: "linear-gradient(to right, #34d37a, #1a9e6e)",
              borderRadius: 2,
              transition: "width 0.8s ease",
            }}
          />
        </div>
        {r.usedHourly && (
          <div
            style={{
              marginTop: 10,
              fontSize: 10,
              color: "#1a9e6e",
              letterSpacing: "0.08em",
              textAlign: "center",
            }}
          >
            ↑ Based on 4-hour dynamic forecast from tee time{" "}
            {formatTimeDisplay(teeTime)}
          </div>
        )}
      </div>

      <div style={S.shareRow}>
        <button style={S.shareBtn} onClick={() => copy(oddsText)}>
          Copy Odds
        </button>
        <button style={S.shareBtn} onClick={() => copy(formulaText)}>
          Copy Breakdown
        </button>
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#5a7080",
              marginBottom: 12,
              borderBottom: "1px solid #1e2d3a",
              paddingBottom: 8,
            }}
          >
            Handicap Calculation
          </div>
          <BrkRow label={`${r.n1} HCP Index`} val={r.p1i.toFixed(1)} />
          <BrkRow label={`${r.n1} Course HCP`} val={r.ch1} />
          <BrkRow label={`${r.n2} HCP Index`} val={r.p2i.toFixed(1)} />
          <BrkRow label={`${r.n2} Course HCP`} val={r.ch2} />
          <BrkRow
            label="Stroke Diff"
            val={`${r.ch1 > r.ch2 ? "+" : ""}${r.ch1 - r.ch2} strokes`}
            color="#c8a84b"
          />
          <BrkRow
            label="Table Lookup"
            val={`[${r.row}][${r.col}] = ${fmtML(r.baseML)}`}
          />
        </div>
        <div style={S.card}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#5a7080",
              marginBottom: 12,
              borderBottom: "1px solid #1e2d3a",
              paddingBottom: 8,
            }}
          >
            Simulated PCC {r.usedHourly ? "· 4hr avg" : ""}
          </div>
          <BrkRow
            label="Wind Factor"
            val={r.windScore.toFixed(3)}
            color={r.windScore > 0.5 ? "#ff6b5b" : "#34d37a"}
          />
          <BrkRow
            label="Precip Factor"
            val={r.precipScore.toFixed(3)}
            color={r.precipScore > 0.3 ? "#ff6b5b" : "#34d37a"}
          />
          <BrkRow
            label="Temp Factor"
            val={r.tempScore.toFixed(3)}
            color={r.tempScore > 0.2 ? "#ff6b5b" : "#34d37a"}
          />
          <BrkRow
            label="Simulated PCC"
            val={`${r.pcc >= 0 ? "+" : ""}${r.pcc.toFixed(1)}`}
            color="#c8a84b"
          />
          <BrkRow label="Variance Factor" val={r.varianceFactor.toFixed(4)} />
          <BrkRow
            label="Edge Compression"
            val={`−${((1 - 1 / r.varianceFactor) * 100).toFixed(1)}%`}
            color="#c8a84b"
          />
        </div>
      </div>

      {/* PCC meter */}
      <div style={S.card}>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 12,
            color: "#c8a84b",
          }}
        >
          Playing Conditions Meter
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <span
            style={{ fontSize: 10, color: "#5a7080", whiteSpace: "nowrap" }}
          >
            −1 Easy
          </span>
          <div
            style={{
              flex: 1,
              height: 6,
              background: "#1e2d3a",
              borderRadius: 3,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: `${pccPct}%`,
                transform: "translate(-50%,-50%)",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#c8a84b",
                border: "2px solid #0d1318",
                boxShadow: "0 0 8px rgba(200,168,75,0.6)",
                transition: "left 0.8s ease",
              }}
            />
            {[25, 50, 75].map((p) => (
              <div
                key={p}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${p}%`,
                  transform: "translateY(-50%)",
                  width: 1,
                  height: 10,
                  background: "#1e2d3a",
                }}
              />
            ))}
          </div>
          <span
            style={{ fontSize: 10, color: "#5a7080", whiteSpace: "nowrap" }}
          >
            +3 Hard
          </span>
          <span
            style={{
              fontSize: 14,
              color: "#c8a84b",
              width: 32,
              textAlign: "right",
            }}
          >
            {r.pcc >= 0 ? "+" : ""}
            {r.pcc.toFixed(1)}
          </span>
        </div>
        <div style={{ ...S.formula, marginTop: 14 }}>{formulaText}</div>
      </div>

      <div style={S.disclaimer}>
        <strong>Methodology:</strong> Course Handicap via WHS Rule 6.1. Odds
        from 18-hole gross table (Par 72, Rating 72.0, Slope 113). Weather
        fetched as a 4-hour hourly forecast spanning the full round window;
        hours dynamically weighted based on weather severity. Simulated PCC
        replicates WHS Rule 5.6 intent. Wind coefficients from peer-reviewed
        research (~1.15 strokes/8.6 mph elite; scaled for amateurs). For
        entertainment only — not an official GHIN calculation.
      </div>
    </div>
  );
}
