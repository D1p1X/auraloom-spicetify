/* Auraloom — a local, Canva-like Spicetify visual studio. */
const { React, ReactDOM } = Spicetify;
const { useCallback, useEffect, useMemo, useRef, useState } = React;
const h = React.createElement;

function AuraloomMark({ title = "Auraloom" } = {}) {
  return h("svg", { className: "hc-logo-mark", viewBox: "0 0 64 64", role: "img", "aria-label": title },
    h("rect", { x: 2, y: 2, width: 60, height: 60, rx: 18, fill: "#0b0b0d" }),
    h("rect", { x: 2.75, y: 2.75, width: 58.5, height: 58.5, rx: 17.25, fill: "none", stroke: "#f5f5f5", strokeOpacity: .28, strokeWidth: 1.5 }),
    h("path", { d: "M13 39.5 22.5 18l8.1 15.2L37 21.8 51 39.5", fill: "none", stroke: "#f5f5f5", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 4.5 }),
    h("path", { d: "M16 45.5h32", fill: "none", stroke: "#f5f5f5", strokeLinecap: "round", strokeOpacity: .42, strokeWidth: 2 }),
    h("circle", { cx: 22.5, cy: 18, r: 2.6, fill: "#f5f5f5" }),
    h("circle", { cx: 37, cy: 21.8, r: 2.6, fill: "#f5f5f5" })
  );
}

const STORAGE_KEY = "hudbacastum:project:v2";
const PROJECT_LIBRARY_KEY = "hudbacastum:saved-projects:v1";
const ANALYSIS_CACHE_KEY = "hudbacastum:track-analysis:v2";
const MAX_ANALYSIS_CACHE = 18;
const MAX_SAVED_PROJECTS = 18;
const MAX_LAYERS = 64;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const makeId = () => `hc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const persistProject = (project) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); }
  catch (_) { Spicetify.showNotification("Project is too large to save locally", true); }
};
const copyProjectSnapshot = (project) => JSON.parse(JSON.stringify(project));
const sortProjectLibrary = (items) => [...items].sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)) || Number(b.savedAt || 0) - Number(a.savedAt || 0));
const uniqueSceneName = (wanted, entries) => {
  const base = String(wanted || "Untitled scene").trim() || "Untitled scene";
  const used = new Set(entries.map((entry) => String(entry.name || "").trim().toLocaleLowerCase()));
  if (!used.has(base.toLocaleLowerCase())) return base;
  let number = 2;
  while (used.has(`${base} ${number}`.toLocaleLowerCase())) number += 1;
  return `${base} ${number}`;
};
const upsertProjectLibrary = (items, project, savedAt = Date.now()) => {
  const name = String(project.name || "Untitled scene").trim() || "Untitled scene";
  const id = project.projectId || makeId();
  const previous = items.find((entry) => entry.id === id);
  const current = { ...project, projectId: id, name };
  const entry = { id, name, savedAt, isDefault: Boolean(previous?.isDefault), project: copyProjectSnapshot(current) };
  return { project: current, entries: sortProjectLibrary([entry, ...items.filter((item) => item.id !== id)]).slice(0, MAX_SAVED_PROJECTS) };
};

const BLOCKS = [
  { type: "cover", category: "visuals", title: "Record sleeve", icon: "◒", copy: "Album art, cropped your way" },
  { type: "spectrum", category: "visuals", title: "Spectrum", icon: "≋", copy: "A kinetic frequency field" },
  { type: "orbit", category: "visuals", title: "Orbit", icon: "◎", copy: "Slow-moving concentric rings" },
  { type: "lyrics", category: "text", title: "Quote / text", icon: "✦", copy: "A custom line, note or quiet quote" },
  { type: "liveLyrics", category: "text", title: "Adaptive lyrics", icon: "♪", copy: "Best available word, line or text lyrics" },
  { type: "title", category: "text", title: "Now playing", icon: "Aa", copy: "Track name and artist" },
  { type: "chip", category: "text", title: "Studio chip", icon: "⌁", copy: "A tiny data label" },
  { type: "glow", category: "effects", title: "Glow pool", icon: "◌", copy: "Ambient colour and depth" },
  { type: "notes", category: "effects", title: "Spark field", icon: "✣", copy: "Floating particles" },
  { type: "wave", category: "visuals", title: "Wave ribbon", icon: "〰", copy: "A soft moving waveform" },
  { type: "equalizer", category: "visuals", title: "Equalizer wall", icon: "▥", copy: "Wide reactive frequency columns" },
  { type: "radar", category: "visuals", title: "Radar sweep", icon: "◔", copy: "A rotating audio radar" },
  { type: "tunnel", category: "visuals", title: "Light tunnel", icon: "◇", copy: "Depth lines that breathe with bass" },
  { type: "orbital", category: "visuals", title: "Orbital dots", icon: "◌", copy: "Small lights in a live orbit" },
  { type: "prismShape", category: "visuals", title: "Prism field", icon: "△", copy: "Shifting geometric planes" },
  { type: "arc", category: "visuals", title: "Arc meter", icon: "◡", copy: "An audio-reactive circular meter" },
  { type: "cascade", category: "visuals", title: "Cascade", icon: "⋮", copy: "Falling signal trails" },
  { type: "luma", category: "visuals", title: "Luma bloom", icon: "✦", copy: "Soft luminous pulses" },
  { type: "kinetic", category: "visuals", title: "Kinetic tiles", icon: "▦", copy: "A moving field of tiles" },
  { type: "horizon", category: "visuals", title: "Horizon line", icon: "—", copy: "A calm line that follows energy" },
  { type: "poster", category: "text", title: "Free text", icon: "T", copy: "Your own headline or note" },
  { type: "meter", category: "text", title: "Track meter", icon: "▥", copy: "A live-looking timeline strip" },
  { type: "controls", category: "text", title: "Playback bar", icon: "▶", copy: "A configurable live player strip" },
  { type: "frame", category: "shapes", title: "Graphic frame", icon: "□", copy: "A geometric focal frame" },
  { type: "rings", category: "visuals", title: "Beat rings", icon: "◉", copy: "Concentric pulses on every hit" },
  { type: "halo", category: "effects", title: "Halo portal", icon: "◌", copy: "A responsive light aperture" },
  { type: "laser", category: "effects", title: "Light fan", icon: "╱", copy: "Fine stage-light beams" },
  { type: "aurora", category: "effects", title: "Aurora veil", icon: "≈", copy: "Slow drifting colour ribbons" },
  { type: "gridwarp", category: "shapes", title: "Depth grid", icon: "⌗", copy: "A quiet perspective floor" },
  { type: "stars", category: "effects", title: "Star field", icon: "✺", copy: "A field of weightless light" },
  { type: "ticker", category: "text", title: "Lyric ticker", icon: "›", copy: "A moving live track caption" }
];

const EFFECT_DECK = [
  ["bloom", "✦", "Bloom", "soft highlight", "#ff8d6b", "energy"],
  ["prism", "◇", "Prism", "subtle colour refraction", "#a88cff", "high"],
  ["scan", "≡", "Scanlines", "editorial texture", "#93d9df", "mid"],
  ["grain", "·", "Film grain", "analog finish", "#d9b68d", "off"],
  ["strobe", "⚡", "Impact flash", "short musical impact", "#ffe9c2", "impact"],
  ["mirror", "↔", "Mirror haze", "reflective depth", "#8cb8d6", "bass"],
  ["breathe", "◌", "Stage breath", "slow camera air", "#de78ab", "energy"],
  ["flare", "✹", "Lens flare", "single warm glint", "#ffba70", "drop"],
  ["ripples", "◉", "Beat ripples", "concentric waves on every hit", "#71d9ff", "impact"],
  ["mist", "≈", "Spectral mist", "slow cover-colour haze", "#88d9ff", "energy"],
  ["trails", "≋", "Tempo trails", "motion streaks on drops", "#ff9ec8", "drop"],
  ["embers", "✺", "Embers", "high-frequency drifting sparks", "#ffc56e", "high"],
  ["chromatic", "◈", "Chromatic wash", "slow RGB gel movement", "#8ef3ff", "mid"],
  ["spotlight", "◍", "Spotlight", "a focused musical cone", "#fff0b2", "bass"],
  ["confetti", "✧", "Confetti drift", "small high-frequency flecks", "#d7a5ff", "high"]
];

const AUDIO_INPUTS = [["off", "Off"], ["bass", "Bass"], ["mid", "Mids"], ["high", "Highs"], ["energy", "Track energy"], ["impact", "Beat impact"], ["drop", "Drop / attack"]];
const makeEffects = () => Object.fromEntries(EFFECT_DECK.map(([id, _icon, _label, _copy, color, band]) => [id, { enabled: false, color, color2: "#ffffff", band, intensity: 58, sensitivity: 60, blend: "screen" }]));
const normalizeEffects = (effects) => Object.fromEntries(EFFECT_DECK.map(([id, _icon, _label, _copy, color, band]) => {
  const previous = effects?.[id];
  return [id, { enabled: typeof previous === "boolean" ? previous : false, color, color2: "#ffffff", band, intensity: 58, sensitivity: 60, blend: "screen", ...(previous && typeof previous === "object" ? previous : {}) }];
}));

const PALETTE_COLOURS = {
  clay: ["#f1a17c", "#dd5e55"], lagoon: ["#8fdcd3", "#5c9bb9"], graphite: ["#d7d0c0", "#8b8378"],
  violet: ["#ad93ff", "#e985ce"], citrus: ["#dce26e", "#ef9c57"], rose: ["#ef8dae", "#a994dc"]
};
const layerColour = (layer, project, key, index) => layer[key] || (index === 0 ? project.sceneAccent : project.sceneSignal) || PALETTE_COLOURS[project.palette]?.[index] || ["#f1a17c", "#dd5e55"][index];
const LAYER_COLOURS = {
  cover: ["#ffb26d", "#d9688a", "#fff6df", "#ffd3a5", "#20161b"], spectrum: ["#88f0d0", "#5a9dff", "#ecfff7", "#9ee9df", "#101c1c"], orbit: ["#bb9dff", "#70dcff", "#f4efff", "#d8c4ff", "#181428"], lyrics: ["#ff9fb8", "#ffcf8e", "#fff5f7", "#ffd8e3", "#26141d"], liveLyrics: ["#dce8ff", "#91b4ff", "#ffffff", "#c9dcff", "#10131b"], title: ["#ffdf96", "#ff956d", "#fff9e9", "#ffe5ae", "#251b13"], chip: ["#b8e9ff", "#9fbcff", "#f1fbff", "#bceeff", "#112028"], glow: ["#ef7faa", "#aa8dff", "#fff3f8", "#ffc4de", "#29121e"], notes: ["#80e8e7", "#8ca7ff", "#eaffff", "#b5ffff", "#112429"], wave: ["#7eeea6", "#b2f29c", "#f4ffea", "#bfffb8", "#13251a"], poster: ["#ff8a74", "#ffc27d", "#fff4ec", "#ffc3b1", "#2a1817"], meter: ["#e8ca70", "#ff9a77", "#fff9e6", "#ffe7ad", "#252012"], controls: ["#f1f1f1", "#a9a9a9", "#ffffff", "#d9d9d9", "#151515"], frame: ["#96b9ff", "#e59cff", "#f5f2ff", "#c9d7ff", "#151827"], rings: ["#6fd9ff", "#b0f4ff", "#ecfdff", "#9ceaff", "#10222a"], halo: ["#d99cff", "#ffb4ce", "#fff2ff", "#ecc4ff", "#24132b"], laser: ["#ffad75", "#ffe079", "#fff9e9", "#ffd39b", "#2b1a14"], aurora: ["#77d8ff", "#88f2bc", "#effdff", "#a5f6e5", "#112432"], gridwarp: ["#79b5ff", "#8bf1ed", "#effaff", "#b8dbff", "#111d2a"], stars: ["#fff0bb", "#b8b3ff", "#ffffff", "#fff4c7", "#17152a"], ticker: ["#ffa5ca", "#bba1ff", "#fff2f8", "#ffd2e4", "#291321"]
};
const LAYER_AUDIO = { cover: "bass", spectrum: "bass", orbit: "energy", lyrics: "mid", liveLyrics: "impact", title: "impact", chip: "impact", glow: "energy", notes: "high", wave: "mid", poster: "drop", meter: "energy", controls: "energy", frame: "impact", rings: "impact", halo: "bass", laser: "high", aurora: "energy", gridwarp: "bass", stars: "high", ticker: "mid", equalizer: "bass", radar: "mid", tunnel: "bass", orbital: "high", prismShape: "energy", arc: "impact", cascade: "drop", luma: "energy", kinetic: "mid", horizon: "bass" };
const layerStyleDefaults = (type) => ({ colorPrimary: LAYER_COLOURS[type]?.[0] || "#f1a17c", colorSecondary: LAYER_COLOURS[type]?.[1] || "#dd5e55", colorInk: LAYER_COLOURS[type]?.[2] || "#fff8ef", colorBorder: LAYER_COLOURS[type]?.[3] || "#ffffff", colorSurface: LAYER_COLOURS[type]?.[4] || "#191618", colourSource: "manual", colourCount: 2, backdropBlur: 0, backdropBleed: 0, auraEnabled: false, auraColourSource: "layer", auraColor: null, auraSize: 42, auraStrength: 46, auraBlur: 24, auraFollowMotion: true, auraBlend: "screen", audioBand: LAYER_AUDIO[type] || "energy", audioStrength: 70, audioSensitivity: 48, audioGate: 8, audioSmoothing: 0 });
// Every block owns a small set of real, type-specific instrument controls.
// These defaults also migrate older scenes, so an existing block never opens
// with an empty inspector.
const INSTRUMENT_DEFAULTS = {
  cover: {}, spectrum: { detailCount: 34, detailWeight: 6, detailGap: 5 }, orbit: { detailCount: 3, detailWeight: 2, detailScale: 100 },
  lyrics: { textWeight: 760, textTracking: 0 }, liveLyrics: {}, title: { textWeight: 760, textTracking: 0 }, chip: { textWeight: 760, textTracking: 8 },
  glow: { detailScale: 100, detailSoftness: 8 }, notes: { detailCount: 17, detailWeight: 8, detailSpread: 55 }, wave: { detailCount: 18, detailWeight: 5, detailGap: 2 },
  equalizer: { detailCount: 24, detailWeight: 6, detailGap: 3 }, radar: { detailCount: 16, detailWeight: 5, detailScale: 100 }, tunnel: { detailCount: 16, detailWeight: 5, detailScale: 100 }, orbital: { detailCount: 16, detailWeight: 5, detailScale: 100 }, prismShape: { detailCount: 16, detailWeight: 5, detailScale: 100 }, arc: { detailCount: 16, detailWeight: 5, detailScale: 100 }, cascade: { detailCount: 16, detailWeight: 5, detailScale: 100 }, luma: { detailCount: 16, detailWeight: 5, detailScale: 100 }, kinetic: { detailCount: 16, detailWeight: 5, detailScale: 100 }, horizon: { detailCount: 16, detailWeight: 5, detailScale: 100 },
  poster: { textWeight: 820, textTracking: 0 }, meter: { detailWeight: 4, detailGap: 9 }, controls: {}, frame: { detailWeight: 2, detailGap: 18 }, rings: { detailCount: 5, detailWeight: 2, detailGap: 8 }, halo: { detailCount: 3, detailWeight: 2, detailScale: 100 }, laser: { detailCount: 11, detailWeight: 2, detailSpread: 8 }, aurora: { detailCount: 3, detailSoftness: 17, detailScale: 100 }, gridwarp: { detailCount: 6, detailGap: 18, detailScale: 100 }, stars: { detailCount: 30, detailWeight: 4, detailSpread: 55 }, ticker: { textWeight: 780, textTracking: 12 }
};
const instrumentDefaults = (type) => INSTRUMENT_DEFAULTS[type] || {};
const tuning = (key, label, min, max, unit = "") => ({ key, label, min, max, unit });
// The inspector is deliberately explicit: a visual block never falls back to
// only generic transform controls. Its own sound-shaping controls live here.
const ELEMENT_TUNING = {
  cover: { title: "Cover controls", copy: "Crop, tone and music movement are available above.", builtIn: true },
  spectrum: { title: "Spectrum controls", copy: "Shape the number, weight and spacing of the frequency bars.", controls: [tuning("detailCount", "Frequency bars", 8, 64), tuning("detailWeight", "Bar thickness", 2, 18, "px"), tuning("detailGap", "Bar spacing", 0, 20, "px")] },
  orbit: { title: "Orbit controls", copy: "Build a quiet ring or a dense orbital instrument.", controls: [tuning("detailCount", "Orbit rings", 1, 8), tuning("detailWeight", "Ring weight", 1, 8, "px"), tuning("detailScale", "Inner scale", 40, 180, "%")] },
  lyrics: { title: "Lyric card type", copy: "Tune the weight and tracking of this independent text card.", controls: [tuning("textWeight", "Text weight", 300, 900), tuning("textTracking", "Letter spacing", -4, 32, "%")] },
  liveLyrics: { title: "Adaptive lyrics controls", copy: "The complete lyric layout and timing editor is available above.", builtIn: true },
  title: { title: "Track title type", copy: "Tune the typography of the now-playing label.", controls: [tuning("textWeight", "Text weight", 300, 900), tuning("textTracking", "Letter spacing", -4, 32, "%")] },
  chip: { title: "Chip type", copy: "Tune the typography of this compact status label.", controls: [tuning("textWeight", "Text weight", 300, 900), tuning("textTracking", "Letter spacing", -4, 32, "%")] },
  glow: { title: "Glow controls", copy: "Control how soft and how large the ambient pool appears.", controls: [tuning("detailSoftness", "Softness", 0, 48, "px"), tuning("detailScale", "Glow scale", 40, 180, "%")] },
  notes: { title: "Spark field controls", copy: "Set the amount, point size and spread of the field.", controls: [tuning("detailCount", "Spark count", 4, 64), tuning("detailWeight", "Spark size", 2, 20, "px"), tuning("detailSpread", "Field spread", 15, 100, "%")] },
  wave: { title: "Wave ribbon controls", copy: "Shape the density and stroke of the analyser ribbon.", controls: [tuning("detailCount", "Wave slices", 6, 48), tuning("detailWeight", "Slice width", 2, 18, "px"), tuning("detailGap", "Slice spacing", 0, 18, "px")] },
  equalizer: { title: "Equalizer controls", copy: "Choose the bar count, bar thickness and breathing room.", controls: [tuning("detailCount", "Equalizer bars", 8, 64), tuning("detailWeight", "Bar thickness", 2, 18, "px"), tuning("detailGap", "Bar spacing", 0, 18, "px")] },
  radar: { title: "Radar controls", copy: "Tune the particle density, point size and scene scale.", controls: [tuning("detailCount", "Signal points", 4, 48), tuning("detailWeight", "Point size", 2, 18, "px"), tuning("detailScale", "Instrument scale", 40, 180, "%")] },
  tunnel: { title: "Tunnel controls", copy: "Tune the detail field and scale of the light tunnel.", controls: [tuning("detailCount", "Light points", 4, 48), tuning("detailWeight", "Point size", 2, 18, "px"), tuning("detailScale", "Instrument scale", 40, 180, "%")] },
  orbital: { title: "Orbital dots controls", copy: "Tune the satellite field around the orbit.", controls: [tuning("detailCount", "Satellites", 4, 48), tuning("detailWeight", "Dot size", 2, 18, "px"), tuning("detailScale", "Instrument scale", 40, 180, "%")] },
  prismShape: { title: "Prism field controls", copy: "Tune the detail field and overall prism scale.", controls: [tuning("detailCount", "Light points", 4, 48), tuning("detailWeight", "Point size", 2, 18, "px"), tuning("detailScale", "Instrument scale", 40, 180, "%")] },
  arc: { title: "Arc meter controls", copy: "Tune the detail field and scale of the audio arc.", controls: [tuning("detailCount", "Signal points", 4, 48), tuning("detailWeight", "Point size", 2, 18, "px"), tuning("detailScale", "Instrument scale", 40, 180, "%")] },
  cascade: { title: "Cascade controls", copy: "Tune the density and scale of the falling light field.", controls: [tuning("detailCount", "Light points", 4, 48), tuning("detailWeight", "Point size", 2, 18, "px"), tuning("detailScale", "Instrument scale", 40, 180, "%")] },
  luma: { title: "Luma bloom controls", copy: "Tune the bloom detail and overall scale.", controls: [tuning("detailCount", "Light points", 4, 48), tuning("detailWeight", "Point size", 2, 18, "px"), tuning("detailScale", "Bloom scale", 40, 180, "%")] },
  kinetic: { title: "Kinetic tiles controls", copy: "Tune the tile field density and scale.", controls: [tuning("detailCount", "Tile points", 4, 48), tuning("detailWeight", "Tile size", 2, 18, "px"), tuning("detailScale", "Instrument scale", 40, 180, "%")] },
  horizon: { title: "Horizon controls", copy: "Tune the horizon detail field and scale.", controls: [tuning("detailCount", "Light points", 4, 48), tuning("detailWeight", "Point size", 2, 18, "px"), tuning("detailScale", "Instrument scale", 40, 180, "%")] },
  poster: { title: "Poster type", copy: "Tune the weight and tracking of your free text.", controls: [tuning("textWeight", "Text weight", 300, 900), tuning("textTracking", "Letter spacing", -4, 32, "%")] },
  meter: { title: "Track meter controls", copy: "Set the line thickness and spacing of the meter.", controls: [tuning("detailWeight", "Line thickness", 1, 16, "px"), tuning("detailGap", "Content spacing", 0, 28, "px")] },
  controls: { title: "Playback bar controls", copy: "Choose the player controls and information shown above.", builtIn: true },
  frame: { title: "Graphic frame controls", copy: "Tune the corner line weight and inset depth.", controls: [tuning("detailWeight", "Line thickness", 1, 12, "px"), tuning("detailGap", "Frame inset", 0, 38, "px")] },
  rings: { title: "Beat rings controls", copy: "Set the number, line weight and spacing of the rings.", controls: [tuning("detailCount", "Ring count", 1, 10), tuning("detailWeight", "Ring weight", 1, 8, "px"), tuning("detailGap", "Ring spacing", 0, 18, "px")] },
  halo: { title: "Halo portal controls", copy: "Set the number, line weight and inner portal scale.", controls: [tuning("detailCount", "Halo rings", 1, 8), tuning("detailWeight", "Ring weight", 1, 8, "px"), tuning("detailScale", "Portal scale", 40, 180, "%")] },
  laser: { title: "Light fan controls", copy: "Set the beam count, beam weight and fan spread.", controls: [tuning("detailCount", "Beam count", 1, 24), tuning("detailWeight", "Beam weight", 1, 8, "px"), tuning("detailSpread", "Fan spread", 2, 28, "°")] },
  aurora: { title: "Aurora veil controls", copy: "Set the number of veils, softness and scale.", controls: [tuning("detailCount", "Veil count", 1, 3), tuning("detailSoftness", "Softness", 0, 48, "px"), tuning("detailScale", "Veil scale", 40, 180, "%")] },
  gridwarp: { title: "Depth grid controls", copy: "Tune grid line spacing and overall perspective scale.", controls: [tuning("detailCount", "Grid layers", 2, 18), tuning("detailGap", "Grid spacing", 4, 40, "px"), tuning("detailScale", "Grid scale", 40, 180, "%")] },
  stars: { title: "Star field controls", copy: "Set the star count, star size and field spread.", controls: [tuning("detailCount", "Star count", 5, 100), tuning("detailWeight", "Star size", 1, 16, "px"), tuning("detailSpread", "Field spread", 15, 100, "%")] },
  ticker: { title: "Ticker type", copy: "Tune the weight and tracking of the running line.", controls: [tuning("textWeight", "Text weight", 300, 900), tuning("textTracking", "Letter spacing", -4, 32, "%")] }
};
// These are visual treatments, not presets: they stay local to the selected
// block so a scene can mix minimal and expressive instruments freely.
const ELEMENT_STYLES = {
  spectrum: [["bars", "Classic bars"], ["needles", "Fine needles"], ["pill", "Soft pills"]],
  wave: [["ribbon", "Ribbon"], ["pulse", "Pulse line"], ["pill", "Soft pills"]],
  equalizer: [["wall", "Equalizer wall"], ["needle", "Needle bars"], ["capsule", "Capsules"]],
  tunnel: [["infinite", "Infinite tunnel"], ["rings", "Tunnel rings"], ["grid", "Wire tunnel"]],
  radar: [["radar", "Radar"], ["scan", "Scan field"], ["target", "Target rings"]],
  orbital: [["dots", "Satellite dots"], ["trails", "Orbital trails"], ["constellation", "Constellation"]],
  prismShape: [["prism", "Prism"], ["shards", "Light shards"], ["glass", "Glass field"]],
  arc: [["arc", "Open arc"], ["gauge", "Gauge"], ["ring", "Full ring"]],
  cascade: [["cascade", "Cascade"], ["rain", "Light rain"], ["columns", "Columns"]],
  luma: [["bloom", "Luma bloom"], ["core", "Hot core"], ["mist", "Soft mist"]],
  kinetic: [["tiles", "Kinetic tiles"], ["checker", "Checker field"], ["stripes", "Diagonal stripes"]],
  horizon: [["horizon", "Horizon line"], ["sunset", "Sunset band"], ["scan", "Scan line"]],
  orbit: [["rings", "Orbital rings"], ["dashed", "Dashed orbit"], ["minimal", "Minimal orbit"]],
  glow: [["bloom", "Soft bloom"], ["halo", "Halo"], ["spot", "Focused spot"]],
  notes: [["sparks", "Sparks"], ["dust", "Fine dust"], ["stars", "Star particles"]],
  meter: [["line", "Signal line"], ["capsule", "Capsule meter"], ["minimal", "Minimal meter"]],
  frame: [["corners", "Corner frame"], ["full", "Full frame"], ["minimal", "Minimal frame"]],
  rings: [["rings", "Beat rings"], ["dashed", "Dashed rings"], ["soft", "Soft rings"]],
  halo: [["portal", "Halo portal"], ["eclipse", "Eclipse"], ["minimal", "Minimal halo"]],
  laser: [["fan", "Light fan"], ["needles", "Fine needles"], ["cross", "Cross beams"]],
  aurora: [["veil", "Aurora veil"], ["mist", "Color mist"], ["ribbons", "Light ribbons"]],
  gridwarp: [["depth", "Depth grid"], ["floor", "Grid floor"], ["wire", "Wireframe"]],
  stars: [["stars", "Star field"], ["dust", "Stardust"], ["constellation", "Constellation"]],
  ticker: [["ticker", "Ticker"], ["caption", "Caption line"], ["minimal", "Minimal line"]],
  controls: [["glass", "Glass controls"], ["minimal", "Minimal controls"], ["solid", "Solid controls"], ["compact", "Compact dock"], ["dock", "Bottom dock"], ["waveform", "Waveform deck"]],
  lyrics: [["card", "Lyric card"], ["plain", "Plain text"], ["glass", "Glass card"]],
  liveLyrics: [["studio", "Studio lyrics"], ["cinema", "Cinema lyrics"], ["plain", "Plain lyrics"]],
  title: [["line", "Track line"], ["chip", "Track chip"], ["minimal", "Minimal text"]],
  chip: [["chip", "Status chip"], ["tag", "Outline tag"], ["minimal", "Minimal tag"]],
  poster: [["poster", "Editorial poster"], ["plain", "Plain type"], ["glass", "Glass poster"]],
  cover: [["square", "Square cover"], ["round", "Round cover"], ["vinyl", "Vinyl sleeve"]]
};

const BACKGROUND_EFFECTS = [["none", "None"], ["halo", "Halo"], ["aurora", "Aurora"], ["rays", "Rays"], ["grid", "Grid"], ["mesh", "Mesh"], ["rings", "Pulse rings"], ["shards", "Light shards"], ["tide", "Wave field"], ["plasma", "Plasma"], ["starlight", "Starlight"], ["scan", "Wave scan"]];
const BACKGROUND_MODES = [["black", "Pure black"], ["solid", "Solid"], ["gradient", "Gradient"], ["cover", "Album art"], ["upload", "Upload"]];
const COLOUR_SWATCHES = ["#000000", "#ffffff", "#181a1f", "#6b7280", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
const COLOUR_SOURCE_OPTIONS = [["manual", "Manual"], ["cover", "Album cover"], ["cover-reactive", "Album + music"], ["rgb", "RGB spectrum"], ["rgb-reactive", "RGB + music"]];
const legacySceneEffect = (scene) => ({ halo: "halo", aurora: "aurora", club: "rays", gallery: "grid" }[scene] || "none");

const LAYER_DEFAULTS = {
  cover: { label: "Record sleeve", x: 49, y: 46, w: 30, opacity: 100, hue: 0, coverZoom: 100, coverX: 50, coverY: 50, coverBrightness: 100, coverSaturation: 100, coverContrast: 100, coverGloss: true, coverAudioLight: false, coverAudioGlow: false, coverAudioMode: "depth", coverAudioAmount: 52, coverAudioDepth: 46, coverMotionFluidity: 58 },
  spectrum: { label: "Spectrum", x: 50, y: 76, w: 65, opacity: 95, hue: 0 },
  orbit: { label: "Orbit", x: 49, y: 44, w: 52, opacity: 84, hue: 0 },
  lyrics: { label: "Lyric card", x: 21, y: 75, w: 28, opacity: 100, hue: 0, textOpacity: 100, textPanelOpacity: 68, textPanelColor: "#191618" },
  liveLyrics: { label: "Adaptive lyrics", x: 50, y: 58, w: 66, opacity: 100, hue: 0, lyrics: { layout: "auto", align: "center", showPrevious: true, showNext: true, showProgress: true, showTrack: true, pureText: false, wordHighlight: true, wordTrail: 42, textSize: 46, contextSize: 19, inactiveOpacity: 36, activeOpacity: 100, activeScale: 12, panelOpacity: 84, panelColor: "#07080b", lineGap: 10 } },
  title: { label: "Now playing", x: 50, y: 90, w: 44, opacity: 100, hue: 0 },
  chip: { label: "Studio chip", x: 83, y: 16, w: 19, opacity: 100, hue: 0 },
  glow: { label: "Glow pool", x: 65, y: 30, w: 45, opacity: 72, hue: 0 },
  notes: { label: "Spark field", x: 50, y: 51, w: 90, opacity: 72, hue: 0 },
  wave: { label: "Wave ribbon", x: 50, y: 61, w: 68, opacity: 88, hue: 0 },
  equalizer: { label: "Equalizer wall", x: 50, y: 62, w: 72, opacity: 88, hue: 0 }, radar: { label: "Radar sweep", x: 50, y: 48, w: 44, opacity: 82, hue: 0 }, tunnel: { label: "Light tunnel", x: 50, y: 50, w: 82, opacity: 72, hue: 0 }, orbital: { label: "Orbital dots", x: 50, y: 48, w: 48, opacity: 84, hue: 0 }, prismShape: { label: "Prism field", x: 50, y: 50, w: 64, opacity: 82, hue: 0 }, arc: { label: "Arc meter", x: 50, y: 52, w: 48, opacity: 88, hue: 0 }, cascade: { label: "Cascade", x: 50, y: 50, w: 76, opacity: 72, hue: 0 }, luma: { label: "Luma bloom", x: 50, y: 46, w: 62, opacity: 78, hue: 0 }, kinetic: { label: "Kinetic tiles", x: 50, y: 52, w: 72, opacity: 72, hue: 0 }, horizon: { label: "Horizon line", x: 50, y: 68, w: 82, opacity: 90, hue: 0 },
  poster: { label: "Free text", x: 50, y: 31, w: 36, opacity: 100, hue: 0, content: "MAKE IT\nYOURS." },
  meter: { label: "Track meter", x: 50, y: 83, w: 54, opacity: 90, hue: 0 },
  controls: { label: "Playback bar", x: 50, y: 89, w: 74, opacity: 100, hue: 0, controls: { showCover: true, showTrack: true, showProgress: true, progressStyle: "line", showTime: true, showRemaining: false, showShuffle: false, showPrevious: true, showPlay: true, showNext: true, showRepeat: false, showVolume: false } },
  frame: { label: "Graphic frame", x: 50, y: 45, w: 55, opacity: 70, hue: 0 },
  rings: { label: "Beat rings", x: 50, y: 46, w: 58, opacity: 84, hue: 0 },
  halo: { label: "Halo portal", x: 50, y: 46, w: 58, opacity: 78, hue: 0 },
  laser: { label: "Light fan", x: 50, y: 50, w: 94, opacity: 72, hue: 0 },
  aurora: { label: "Aurora veil", x: 50, y: 42, w: 92, opacity: 70, hue: 0 },
  gridwarp: { label: "Depth grid", x: 50, y: 76, w: 95, opacity: 58, hue: 0 },
  stars: { label: "Star field", x: 50, y: 45, w: 96, opacity: 64, hue: 0 },
  ticker: { label: "Lyric ticker", x: 50, y: 83, w: 72, opacity: 94, hue: 0 }
};

const createLayer = (type, overrides = {}) => ({
  id: makeId(),
  type,
  z: 0,
  locked: false,
  hidden: false,
  rotation: 0,
  radius: 16,
  blur: 0,
  blend: "normal",
  beat: 70,
  speed: 60,
  ...LAYER_DEFAULTS[type],
  ...instrumentDefaults(type),
  ...layerStyleDefaults(type),
  ...overrides
});

// The scene stack is broader than the editable-block array: canvas effects
// and cover aura are actual compositing items too. Keeping them in the same
// ordered list means a move always affects the complete rendered item, not
// merely the visible body of a block.
const STAGE_BACKGROUND_EFFECT = "scene:background-effect";
const STAGE_COVER_AURA = "scene:cover-aura";
const STAGE_VIGNETTE = "scene:vignette";
const stageLayerKey = (id) => `layer:${id}`;
const stageEffectKey = (id) => `effect:${id}`;
const stageLayerId = (key) => String(key || "").startsWith("layer:") ? String(key).slice(6) : null;
const stageEffectId = (key) => String(key || "").startsWith("effect:") ? String(key).slice(7) : null;
const stageKeysForProject = (project) => [
  STAGE_BACKGROUND_EFFECT,
  STAGE_COVER_AURA,
  ...EFFECT_DECK.map(([id]) => stageEffectKey(id)),
  STAGE_VIGNETTE,
  ...(project.layers || []).map((layer) => stageLayerKey(layer.id))
];
const normalizeStageOrder = (project) => {
  const available = stageKeysForProject(project);
  const allowed = new Set(available);
  const saved = Array.isArray(project.stageOrder) ? project.stageOrder : [];
  const ordered = [];
  const seen = new Set();
  [...saved, ...available].forEach((key) => {
    if (allowed.has(key) && !seen.has(key)) { seen.add(key); ordered.push(key); }
  });
  return ordered;
};
const stageKeyIsVisible = (project, key) => {
  if (key === STAGE_BACKGROUND_EFFECT) return (project.backgroundReactive && project.backgroundMode !== "black") || (project.backgroundEffect && project.backgroundEffect !== "none");
  if (key === STAGE_COVER_AURA) return Boolean(project.coverAuraEnabled);
  if (key === STAGE_VIGNETTE) return Number(project.vignette || 0) > 0 && project.backgroundMode !== "black";
  const effectId = stageEffectId(key);
  if (effectId) return Boolean(normalizeEffects(project.effects)[effectId]?.enabled);
  return Boolean(stageLayerId(key) && (project.layers || []).some((layer) => layer.id === stageLayerId(key)));
};
const moveVisibleStageItem = (project, key, direction) => {
  const order = normalizeStageOrder(project);
  const visible = order.filter((item) => stageKeyIsVisible(project, item));
  const visibleIndex = visible.indexOf(key);
  const nextVisibleIndex = clamp(visibleIndex + direction, 0, visible.length - 1);
  if (visibleIndex < 0 || visibleIndex === nextVisibleIndex) return order;
  const targetKey = visible[nextVisibleIndex];
  const sourceIndex = order.indexOf(key);
  const targetIndex = order.indexOf(targetKey);
  const next = [...order];
  [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
  return next;
};

const createProject = () => ({
  editorVersion: 5,
  projectId: makeId(),
  name: "Blank audio canvas",
  palette: "graphite",
  texture: "none",
  backgroundImage: "",
  backgroundMode: "black",
  backgroundEffect: "none",
  backgroundEffectColor: "#ff956d",
  backgroundEffectColor2: "#82ebe0",
  backgroundColourSource: "cover",
  backgroundColourCount: 3,
  backgroundEffectColourSource: "cover",
  backgroundEffectColourCount: 2,
  backdropBlur: 24,
  backdropOpacity: 48,
  backdropSaturation: 110,
  backdropBrightness: 58,
  backdropX: 50,
  backdropY: 50,
  backdropScale: 108,
  backgroundReactive: true,
  backgroundAudioBand: "energy",
  backgroundAudioStrength: 58,
  backgroundAudioZoom: 42,
  // Keep album art neutral by default. A user can still add a light lift in
  // Background audio reaction, but it must be an intentional choice.
  backgroundAudioLight: 0,
  coverAdaptive: true,
  coverAdaptiveStyle: "ambient",
  coverAdaptiveAmount: 62,
  coverAdaptivePalette: true,
  coverAdaptiveEffectColours: true,
  coverAuraEnabled: false,
  coverAuraBlur: 34,
  coverAuraOpacity: 58,
  coverAuraSaturation: 140,
  coverAuraBrightness: 106,
  coverAuraScale: 72,
  coverAuraBlend: "screen",
  coverAuraTint: "#ffffff",
  autoPalette: false,
  bgPrimary: "#08090b",
  bgSecondary: "#14161a",
  bgTertiary: "#22262c",
  sceneAccent: "#f2f4f7",
  sceneSignal: "#8993a0",
  uiTone: "obsidian",
  uiAccent: "#f2f4f7",
  uiAccent2: "#8993a0",
  reactive: true,
  audioGain: 100,
  audioSmoothing: 8,
  audioLeadMs: 0,
  // Balanced gives a smooth 20fps signal without continuously invalidating a
  // busy Spotify layout. Eco is for long sessions / lower-power machines;
  // High gives the most immediate audio response on capable systems.
  renderQuality: "balanced",
  effects: makeEffects(),
  stageOrder: [],
  aspect: "wide",
  scene: "none",
  ambient: 0,
  vignette: 0,
  gridSize: 9,
  grid: false,
  showGrid: false,
  smartSnap: true,
  density: 56,
  motion: 72,
  zoom: 100,
  layers: []
});

const PRESETS = {
  clay: {
    name: "Terracotta afterglow", palette: "clay", texture: "paper", density: 56, motion: 72,
    layers: [
      createLayer("glow", { x: 67, y: 30, w: 58, hue: 18 }), createLayer("notes", { x: 50, y: 50, w: 94 }),
      createLayer("orbit", { x: 50, y: 47, w: 50 }), createLayer("spectrum", { x: 50, y: 70, w: 64 }),
      createLayer("cover", { x: 50, y: 45, w: 30 }), createLayer("lyrics", { x: 22, y: 76, w: 27 }),
      createLayer("chip", { x: 83, y: 15, w: 20 }), createLayer("title", { x: 50, y: 89, w: 45 })
    ]
  },
  lagoon: {
    name: "Lagoon cassette", palette: "lagoon", texture: "grain", density: 72, motion: 92,
    layers: [
      createLayer("glow", { x: 28, y: 35, w: 66, hue: -18 }), createLayer("notes", { x: 50, y: 50, w: 96, hue: 30 }),
      createLayer("spectrum", { x: 51, y: 52, w: 76, hue: -25 }), createLayer("cover", { x: 26, y: 48, w: 27, hue: -20 }),
      createLayer("orbit", { x: 72, y: 42, w: 38, hue: 35 }), createLayer("lyrics", { x: 72, y: 75, w: 29 }),
      createLayer("title", { x: 50, y: 88, w: 58 }), createLayer("chip", { x: 15, y: 16, w: 19 })
    ]
  },
  mono: {
    name: "Graphite quiet", palette: "graphite", texture: "none", density: 22, motion: 35,
    layers: [
      createLayer("glow", { x: 50, y: 42, w: 54, opacity: 32 }), createLayer("orbit", { x: 50, y: 47, w: 43, opacity: 62 }),
      createLayer("cover", { x: 50, y: 43, w: 27, opacity: 100 }), createLayer("spectrum", { x: 50, y: 75, w: 54, opacity: 84 }),
      createLayer("title", { x: 50, y: 89, w: 50 }), createLayer("chip", { x: 82, y: 15, w: 18 })
    ]
  },
  violet: {
    name: "Ultraviolet pulse", palette: "violet", texture: "grain", scene: "aurora", aspect: "wide", ambient: 88, vignette: 28, density: 78, motion: 94,
    layers: [
      createLayer("glow", { x: 31, y: 43, w: 78, hue: -22 }), createLayer("notes", { x: 50, y: 50, w: 98, hue: 30 }),
      createLayer("frame", { x: 68, y: 45, w: 42, opacity: 85 }), createLayer("cover", { x: 32, y: 49, w: 28 }),
      createLayer("wave", { x: 65, y: 61, w: 55, hue: 30 }), createLayer("poster", { x: 72, y: 28, w: 34, content: "NEON\nHEART." }),
      createLayer("meter", { x: 50, y: 87, w: 80 }), createLayer("chip", { x: 17, y: 14, w: 20, content: "PULSE 94" })
    ]
  },
  citrus: {
    name: "Citrus collage", palette: "citrus", texture: "paper", scene: "gallery", aspect: "square", ambient: 46, vignette: 18, density: 38, motion: 46,
    layers: [
      createLayer("glow", { x: 61, y: 36, w: 70, hue: 20, opacity: 56 }), createLayer("frame", { x: 50, y: 48, w: 82, opacity: 70 }),
      createLayer("cover", { x: 30, y: 42, w: 32 }), createLayer("poster", { x: 67, y: 40, w: 42, content: "SLOW\nSUNDAY." }),
      createLayer("wave", { x: 50, y: 67, w: 86, hue: -28 }), createLayer("title", { x: 50, y: 83, w: 73 }),
      createLayer("chip", { x: 20, y: 16, w: 23, content: "SIDE A" })
    ]
  },
  rose: {
    name: "Rose story", palette: "rose", texture: "grain", scene: "club", aspect: "portrait", ambient: 72, vignette: 64, density: 62, motion: 82,
    layers: [
      createLayer("glow", { x: 50, y: 28, w: 90, hue: -18 }), createLayer("orbit", { x: 50, y: 34, w: 68, opacity: 65 }),
      createLayer("cover", { x: 50, y: 35, w: 46 }), createLayer("poster", { x: 50, y: 63, w: 68, content: "AFTER\nMIDNIGHT." }),
      createLayer("meter", { x: 50, y: 80, w: 74 }), createLayer("chip", { x: 50, y: 90, w: 42, content: "STORY MODE" }),
      createLayer("notes", { x: 50, y: 50, w: 96, hue: 16, opacity: 80 })
    ]
  }
};

function hydrateProject(parsed) {
  const defaults = createProject();
  const source = parsed && typeof parsed === "object" ? parsed : {};
  const legacyEffect = source.backgroundEffect || legacySceneEffect(source.scene);
  const layers = Array.isArray(source.layers) ? source.layers.filter((layer) => !(Number(source.editorVersion || 0) < 3 && source.name === "Blank audio canvas" && layer.type === "orbit")).slice(0, MAX_LAYERS).map((layer) => ({ ...LAYER_DEFAULTS[layer.type], ...instrumentDefaults(layer.type), ...layerStyleDefaults(layer.type), radius: 16, blur: 0, blend: "normal", beat: 70, speed: 60, ...layer, id: layer.id || makeId() })) : [];
  const project = {
    ...defaults,
    ...source,
    projectId: source.projectId || makeId(),
    backgroundEffect: legacyEffect,
    effects: normalizeEffects(source.effects),
    editorVersion: 5,
    // The first shipped blank scene contained an unwanted orbit around the cover.
    // Preserve the optional Orbit block, but remove it from that legacy starter scene.
    layers
  };
  return { ...project, stageOrder: normalizeStageOrder(project) };
}

function readProject() {
  try {
    const startup = readProjectLibrary().find((entry) => entry.isDefault === true);
    if (startup?.project && Array.isArray(startup.project.layers)) return hydrateProject(startup.project);
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && Array.isArray(parsed.layers) ? hydrateProject(parsed) : createProject();
  } catch (_) { return createProject(); }
}

const readProjectLibrary = () => {
  try {
    const items = JSON.parse(localStorage.getItem(PROJECT_LIBRARY_KEY));
    return Array.isArray(items) ? items.filter((item) => item && item.id && item.project && Array.isArray(item.project.layers)).slice(0, MAX_SAVED_PROJECTS) : [];
  } catch (_) { return []; }
};

const writeProjectLibrary = (items) => {
  const cleaned = items.slice(0, MAX_SAVED_PROJECTS);
  try { localStorage.setItem(PROJECT_LIBRARY_KEY, JSON.stringify(cleaned)); return cleaned; }
  catch (_) { Spicetify.showNotification("Saved projects are too large for local storage", true); return null; }
};

function useNowPlaying() {
  const [state, setState] = useState({ title: "Choose a track", artist: "Auraloom studio", art: "", uri: "", playing: false, durationMs: 0 });
  useEffect(() => {
    const sync = () => {
      const item = Spicetify.Player?.data?.item;
      const metadata = item?.metadata || {};
      const image = metadata.image_xlarge_url || metadata.image_large_url || metadata.image_url || "";
      const next = {
        title: metadata.title || item?.name || "Choose a track",
        artist: metadata.artist_name || metadata.artist || item?.artists?.map((artist) => artist.name).join(", ") || "Auraloom studio",
        art: image,
        uri: item?.uri || metadata.uri || "",
        playing: !Spicetify.Player?.isPaused?.(),
        durationMs: Number(item?.duration?.milliseconds || metadata.duration || item?.metadata?.duration || 0)
      };
      setState((current) => current.title === next.title && current.artist === next.artist && current.art === next.art && current.uri === next.uri && current.playing === next.playing && current.durationMs === next.durationMs ? current : next);
    };
    sync();
    const timer = window.setInterval(sync, 1100);
    return () => window.clearInterval(timer);
  }, []);
  return state;
}

const formatTime = (milliseconds = 0) => {
  const total = Math.max(0, Math.floor(Number(milliseconds) / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

function usePlaybackState(nowPlaying) {
  const [progressMs, setProgressMs] = useState(0);
  useEffect(() => {
    const sync = () => {
      const progress = Number(Spicetify.Player?.getProgress?.());
      if (Number.isFinite(progress)) setProgressMs(progress);
    };
    sync();
    const timer = window.setInterval(sync, nowPlaying.playing ? 300 : 850);
    return () => window.clearInterval(timer);
  }, [nowPlaying.uri, nowPlaying.playing]);
  const rawVolume = Number(Spicetify.Player?.getVolume?.());
  const volume = Number.isFinite(rawVolume) ? clamp(rawVolume, 0, 1) : .8;
  return { progressMs, durationMs: nowPlaying.durationMs || 0, volume };
}

const normaliseEmbeddedWordTiming = (line, lineStartMs, lineEndMs) => {
  const rawWords = Array.isArray(line?.syllables) ? line.syllables : Array.isArray(line?.words) ? line.words : Array.isArray(line?.wordTiming) ? line.wordTiming : [];
  if (!rawWords.length) return [];
  const duration = Math.max(1, lineEndMs - lineStartMs);
  return rawWords.map((word, index) => {
    const text = String(word?.word ?? word?.text ?? word?.content ?? "");
    const rawStart = Number(word?.startTimeMs ?? word?.startTime ?? word?.start ?? NaN);
    const rawEnd = Number(word?.endTimeMs ?? word?.endTime ?? word?.end ?? NaN);
    const startMs = Number.isFinite(rawStart) ? (rawStart < lineStartMs ? lineStartMs + rawStart : rawStart) : lineStartMs + duration * index / rawWords.length;
    const endMs = Number.isFinite(rawEnd) ? (rawEnd <= duration ? lineStartMs + rawEnd : rawEnd) : lineStartMs + duration * (index + 1) / rawWords.length;
    return { text, startMs: Math.max(lineStartMs, startMs), endMs: Math.max(startMs + 1, endMs), index };
  }).filter((word) => word.text.trim());
};

const normaliseTimedLyrics = (payload) => {
  const rawLines = payload?.lyrics?.lines || payload?.lines || [];
  if (!Array.isArray(rawLines)) return [];
  return rawLines.map((line, index) => {
    const startMs = Math.max(0, Number(line?.startTimeMs ?? line?.startTime ?? line?.start ?? 0));
    const endMs = Math.max(0, Number(line?.endTimeMs ?? line?.endTime ?? line?.end ?? 0));
    return { text: String(line?.words ?? line?.text ?? line?.content ?? "").trim(), startMs, endMs, words: normaliseEmbeddedWordTiming(line, startMs, endMs || startMs + 2800), index };
  }).filter((line) => line.text);
};

const lrcTimeToMs = (minutes, seconds, fraction = "") => {
  const decimal = fraction ? Number(`0.${fraction}`) : 0;
  return Math.max(0, Math.round((Number(minutes) * 60 + Number(seconds) + decimal) * 1000));
};

// Parses the public LRC interchange format instead of importing a provider's
// implementation. It works with the timed data returned by LRCLIB and keeps
// the visual layer independent from any other installed lyric extension.
const normaliseLrcLyrics = (rawLyrics) => {
  if (typeof rawLyrics !== "string") return [];
  const entries = [];
  rawLyrics.split(/\r?\n/).forEach((rawLine) => {
    const text = rawLine.replace(/^(?:\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\])+/, "").trim();
    if (!text) return;
    const tags = rawLine.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g);
    for (const tag of tags) entries.push({ text, startMs: lrcTimeToMs(tag[1], tag[2], tag[3]), endMs: 0, index: entries.length });
  });
  entries.sort((left, right) => left.startMs - right.startMs);
  return entries.map((line, index) => ({ ...line, index, endMs: entries[index + 1]?.startMs || line.startMs + 2800 }));
};

const normalisePlainLyrics = (rawLyrics) => {
  if (typeof rawLyrics !== "string") return [];
  return rawLyrics.split(/\r?\n/).map((text) => text.trim()).filter(Boolean).map((text, index) => ({ text, startMs: 0, endMs: 0, index }));
};

// NetEase's karaoke payload gives a line start/duration plus an offset and duration
// for each word. This is what enables true word-by-word highlighting rather than a
// BPM animation or a guessed cursor.
const normaliseNeteaseKaraoke = (rawLyrics) => {
  if (typeof rawLyrics !== "string") return [];
  const lines = [];
  rawLyrics.split(/\r?\n/).forEach((rawLine) => {
    const head = rawLine.match(/^\[(\d+),(\d+)\](.*)$/);
    if (!head) return;
    const startMs = Number(head[1]);
    const durationMs = Number(head[2]);
    const words = [...head[3].matchAll(/\((\d+),(\d+)\)([^()]+)/g)].map((match, index) => ({ text: match[3], startMs: startMs + Number(match[1]), endMs: startMs + Number(match[1]) + Number(match[2]), index })).filter((word) => word.text.trim());
    const text = words.map((word) => word.text).join("").trim();
    if (text) lines.push({ text, startMs, endMs: startMs + durationMs, words, index: lines.length });
  });
  return lines;
};

const distributeWordTiming = (line) => {
  if (!line?.text) return [];
  if (Array.isArray(line.words) && line.words.length) return line.words;
  const fragments = line.text.match(/\S+\s*/g) || [line.text];
  const span = Math.max(1, (line.endMs || line.startMs + 2800) - line.startMs);
  return fragments.map((text, index) => ({ text, startMs: line.startMs + span * index / fragments.length, endMs: line.startMs + span * (index + 1) / fragments.length, index, approximate: true }));
};

const lyricLookupCache = new Map();

const fetchLrcLibLyrics = async ({ uri, title, artist, durationMs }) => {
  if (!title || !artist) return { uri, status: "unavailable", lines: [], provider: "" };
  const params = new URLSearchParams({ track_name: title, artist_name: artist });
  if (Number.isFinite(durationMs) && durationMs > 0) params.set("duration", String(Math.round(durationMs / 1000)));
  const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`, { headers: { "x-user-agent": "Auraloom/1.0 (Spicetify custom app)" } });
  if (!response.ok) throw new Error("LRCLIB lookup failed");
  const payload = await response.json();
  if (payload?.instrumental) return { uri, status: "ready", lines: [{ text: "♪ Instrumental ♪", startMs: 0, endMs: durationMs || 2800, index: 0 }], provider: "LRCLIB · timed", timed: true };
  const timedLines = normaliseLrcLyrics(payload?.syncedLyrics);
  if (timedLines.length) return { uri, status: "ready", lines: timedLines, provider: "LRCLIB · timed", timed: true };
  const plainLines = normalisePlainLyrics(payload?.plainLyrics);
  return { uri, status: plainLines.length ? "ready" : "unavailable", lines: plainLines, provider: plainLines.length ? "LRCLIB · static" : "", timed: false };
};

const fetchLyricsOvh = async ({ uri, title, artist }) => {
  if (!title || !artist) return { uri, status: "unavailable", lines: [], provider: "" };
  const primaryArtist = String(artist).split(/,|\s+feat\.?\s+/i)[0].trim();
  const titleVariants = [...new Set([String(title).trim(), tidyLookupText(title)].filter(Boolean))];
  const artistVariants = [...new Set([String(artist).trim(), primaryArtist].filter(Boolean))];
  for (const candidateArtist of artistVariants) {
    for (const candidateTitle of titleVariants) {
      const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(candidateArtist)}/${encodeURIComponent(candidateTitle)}`);
      if (!response.ok) continue;
      const payload = await response.json();
      const lines = normalisePlainLyrics(payload?.lyrics);
      if (lines.length) return { uri, status: "ready", lines, provider: "Lyrics.ovh · static", timed: false };
    }
  }
  return { uri, status: "unavailable", lines: [], provider: "" };
};

const tidyLookupText = (value) => String(value || "").normalize("NFKC").replace(/\s*(?:\(|\[)(?:feat\.?|ft\.?|with)\s+[^)\]]+(?:\)|\])/i, "").replace(/\s+/g, " ").trim();
const simpleLookupText = (value) => tidyLookupText(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

// NetEase is the additional public synced source used by the official Lyrics Plus
// provider. We keep this adapter deliberately small and independently written so
// no private Musixmatch token or another extension's code is copied into Auraloom.
const fetchNeteaseLyrics = async ({ uri, title, artist, durationMs }) => {
  const requestHeaders = { "User-Agent": "Mozilla/5.0 Auraloom/1.0" };
  const queryTitle = tidyLookupText(title);
  const searchUrl = `https://music.xianqiao.wang/neteaseapiv2/search?limit=10&type=1&keywords=${encodeURIComponent(`${queryTitle} ${artist}`)}`;
  const search = await Spicetify.CosmosAsync?.get?.(searchUrl, null, requestHeaders);
  const candidates = Array.isArray(search?.result?.songs) ? search.result.songs : [];
  if (!candidates.length) throw new Error("NetEase track not found");
  const expectedTitle = simpleLookupText(queryTitle);
  const scored = candidates.map((song) => {
    const titleScore = simpleLookupText(song?.name) === expectedTitle ? 0 : 1;
    const durationScore = Number.isFinite(durationMs) && Number.isFinite(Number(song?.duration)) ? Math.min(9_999_999, Math.abs(durationMs - Number(song.duration))) : 9_999_999;
    return { song, score: titleScore * 10_000_000 + durationScore };
  }).sort((left, right) => left.score - right.score);
  const match = scored[0]?.song;
  if (!match?.id) throw new Error("NetEase match unavailable");
  const payload = await Spicetify.CosmosAsync?.get?.(`https://music.xianqiao.wang/neteaseapiv2/lyric?id=${encodeURIComponent(match.id)}`, null, requestHeaders);
  const karaokeLines = normaliseNeteaseKaraoke(payload?.klyric?.lyric);
  if (karaokeLines.length) return { uri, status: "ready", lines: karaokeLines, provider: "NetEase · word sync", timed: true, wordTimed: true };
  const timedLines = normaliseLrcLyrics(payload?.lrc?.lyric);
  if (timedLines.length) return { uri, status: "ready", lines: timedLines, provider: "NetEase · timed", timed: true };
  const plainLines = normalisePlainLyrics(payload?.lrc?.lyric);
  return { uri, status: plainLines.length ? "ready" : "unavailable", lines: plainLines, provider: plainLines.length ? "NetEase · static" : "", timed: false };
};

function useLiveLyrics(nowPlaying, enabled = true) {
  const { uri, title, artist, durationMs } = nowPlaying;
  const [lyrics, setLyrics] = useState({ uri: "", status: "idle", lines: [], provider: "" });
  useEffect(() => {
    // Do not contact a lyrics provider or keep a result in React state when a
    // scene has no visible live-lyrics block. This removes network work from
    // visual-only scenes entirely.
    if (!enabled) {
      setLyrics((current) => current.status === "idle" && current.uri === uri ? current : { uri: uri || "", status: "idle", lines: [], provider: "" });
      return undefined;
    }
    const trackId = uri?.split(":").pop();
    if (!trackId) {
      setLyrics({ uri: uri || "", status: "unavailable", lines: [], provider: "" });
      return undefined;
    }
    const cached = lyricLookupCache.get(uri);
    if (cached) { setLyrics(cached); return undefined; }
    let cancelled = false;
    setLyrics({ uri, status: "loading", lines: [], provider: "Spotify → NetEase → LRCLIB → Lyrics.ovh" });
    const load = async () => {
      // First use the lyric payload already available to the Spotify desktop client.
      // When Spotify has none, use the same public LRCLIB and NetEase source classes
      // offered by Spicetify's Lyrics Plus — without importing its implementation or credentials.
      let spotifyResult = null;
      try {
        const payload = await Spicetify.CosmosAsync?.get?.(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&vocalRemoval=false`);
        const lines = normaliseTimedLyrics(payload);
        if (lines.length) {
          spotifyResult = { uri, status: "ready", lines, provider: lines.some((line) => line.words?.length) ? "Spotify · word sync" : "Spotify · timed", timed: true, wordTimed: lines.some((line) => line.words?.length) };
          if (!cancelled) setLyrics(spotifyResult);
        }
      } catch (_) { /* Spotify lyrics are optional; try the public fallback below. */ }
      if (spotifyResult?.wordTimed) { lyricLookupCache.set(uri, spotifyResult); return; }
      const [neteaseLookup, lrcLibLookup, lyricsOvhLookup] = await Promise.allSettled([
        fetchNeteaseLyrics({ uri, title, artist, durationMs }),
        fetchLrcLibLyrics({ uri, title, artist, durationMs }),
        fetchLyricsOvh({ uri, title, artist })
      ]);
      const candidates = [spotifyResult, neteaseLookup.value, lrcLibLookup.value, lyricsOvhLookup.value].filter((result) => result?.status === "ready");
      const score = (result) => result.wordTimed ? 40 : result.provider?.startsWith("Spotify") && result.timed ? 30 : result.provider?.startsWith("LRCLIB") && result.timed ? 26 : result.timed ? 24 : result.provider?.startsWith("LRCLIB") ? 16 : 10;
      const best = candidates.sort((left, right) => score(right) - score(left))[0] || { uri, status: "unavailable", lines: [], provider: "Spotify + NetEase + LRCLIB + Lyrics.ovh" };
      lyricLookupCache.set(uri, best);
      if (!cancelled) setLyrics(best);
    };
    load();
    return () => { cancelled = true; };
  }, [enabled, uri, title, artist, durationMs]);
  return lyrics;
}

const lyricMoment = (lyrics, progressMs) => {
  const lines = lyrics?.lines || [];
  if (!lines.length) return { activeIndex: -1, progress: 0, previous: null, active: null, next: null };
  if (lyrics?.timed === false) return { activeIndex: -1, progress: 0, previous: null, active: null, next: null };
  let activeIndex = 0;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startMs <= progressMs) activeIndex = index;
    else break;
  }
  const active = lines[activeIndex];
  const next = lines[activeIndex + 1] || null;
  const endMs = active.endMs > active.startMs ? active.endMs : (next?.startMs || active.startMs + 2800);
  const words = distributeWordTiming({ ...active, endMs });
  let activeWordIndex = 0;
  for (let index = 0; index < words.length; index += 1) {
    if (words[index].startMs <= progressMs) activeWordIndex = index;
    else break;
  }
  return {
    activeIndex,
    previous: lines[activeIndex - 1] || null,
    active,
    next,
    progress: clamp((progressMs - active.startMs) / Math.max(1, endMs - active.startMs), 0, 1),
    words,
    activeWordIndex,
    wordTimed: words.some((word) => !word.approximate)
  };
};

const toHex = (value) => `#${Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0")}`;

function useCoverPalette(art) {
  const [palette, setPalette] = useState({ primary: "#9b563d", secondary: "#182436" });
  useEffect(() => {
    if (!art) return undefined;
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 24;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, 24, 24);
        const pixels = context.getImageData(0, 0, 24, 24).data;
        let r = 0; let g = 0; let b = 0; let lightR = 0; let lightG = 0; let lightB = 0; let count = 0; let lightCount = 0;
        for (let index = 0; index < pixels.length; index += 16) {
          const pr = pixels[index]; const pg = pixels[index + 1]; const pb = pixels[index + 2];
          r += pr; g += pg; b += pb; count += 1;
          if (pr + pg + pb > 320) { lightR += pr; lightG += pg; lightB += pb; lightCount += 1; }
        }
        if (!cancelled && count) {
          const primary = `${toHex(r / count)}${toHex(g / count).slice(1)}${toHex(b / count).slice(1)}`;
          const secondary = lightCount > 0
            ? `${toHex(lightR / lightCount)}${toHex(lightG / lightCount).slice(1)}${toHex(lightB / lightCount).slice(1)}`
            : "#5c7899";
          setPalette({ primary, secondary });
        }
      } catch (_) { /* Spotify image CORS can be unavailable; retain the last palette. */ }
    };
    image.src = art;
    return () => { cancelled = true; };
  }, [art]);
  return palette;
}

const average = (values, start, end) => {
  if (!Array.isArray(values)) return 0;
  let sum = 0; let count = 0;
  for (let index = start; index <= end; index += 1) { sum += Number(values[index]) || 0; count += 1; }
  return count ? sum / count : 0;
};

const indexAt = (markers, position) => {
  let low = 0; let high = markers.length - 1;
  while (low <= high) { const middle = (low + high) >> 1; if (markers[middle] <= position) low = middle + 1; else high = middle - 1; }
  return high;
};

const readAnalysisCache = () => {
  try { const parsed = JSON.parse(localStorage.getItem(ANALYSIS_CACHE_KEY)); return parsed && typeof parsed === "object" ? parsed : {}; }
  catch (_) { return {}; }
};

const saveTrackAnalysis = (uri, analysis) => {
  try {
    const cache = readAnalysisCache();
    cache[uri] = { ...analysis, savedAt: Date.now() };
    const keep = Object.entries(cache).sort((a, b) => (b[1]?.savedAt || 0) - (a[1]?.savedAt || 0)).slice(0, MAX_ANALYSIS_CACHE);
    localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(Object.fromEntries(keep)));
  } catch (_) { /* The visualizer continues normally if the client storage quota is full. */ }
};

const packTrackAnalysis = (analysis) => {
  const segments = Array.isArray(analysis?.segments) ? analysis.segments : [];
  const beats = Array.isArray(analysis?.beats) ? analysis.beats.map((beat) => Number(beat.start)).filter(Number.isFinite) : [];
  const duration = Number(analysis?.track?.duration) || (segments.at(-1)?.start || 0) + (segments.at(-1)?.duration || 0);
  // 100 ms frames keep the signal tied to the exact track position without a slow BPM clock.
  const step = .1;
  const frames = [];
  let segmentIndex = 0; let previousEnergy = 0;
  for (let time = 0; time <= duration; time += step) {
    while (segmentIndex < segments.length - 1 && Number(segments[segmentIndex].start || 0) + Number(segments[segmentIndex].duration || 0) <= time) segmentIndex += 1;
    const segment = segments[segmentIndex] || {};
    const energy = clamp((Number(segment.loudness_max) + 60) / 60, 0, 1);
    const bass = clamp(average(segment.pitches, 0, 2), 0, 1);
    const mid = clamp(average(segment.pitches, 3, 7), 0, 1);
    const high = clamp(average(segment.pitches, 8, 11), 0, 1);
    const attack = clamp(Math.max(0, energy - previousEnergy) * 2.45 + Math.max(0, Number(segment.loudness_max_start || -60) - Number(segment.loudness_start || -60)) / 22, 0, 1);
    frames.push([Math.round(energy * 100), Math.round(bass * 100), Math.round(mid * 100), Math.round(high * 100), Math.round(attack * 100)]);
    previousEnergy = energy;
  }
  return { version: 1, tempo: Number(analysis?.track?.tempo) || 0, beats, frames, step, duration };
};

function useTrackRhythm(uri, enabled = true) {
  const [rhythm, setRhythm] = useState({ uri: "", beats: [], frames: [], step: .2, tempo: 0, ready: false, cached: false });
  useEffect(() => {
    const id = uri?.split(":").pop();
    // A static scene should neither request Spotify's analysis endpoint nor
    // inflate its local cache. It starts immediately if the user re-enables
    // any audio-reactive layer.
    if (!enabled || !id || !Spicetify.CosmosAsync?.get) { setRhythm({ uri: uri || "", beats: [], frames: [], step: .2, tempo: 0, ready: false, cached: false }); return undefined; }
    let cancelled = false;
    const cached = readAnalysisCache()[uri];
    if (cached?.frames?.length) { setRhythm({ uri, beats: cached.beats || [], frames: cached.frames, step: cached.step || .2, tempo: cached.tempo || 0, ready: true, cached: true }); return undefined; }
    setRhythm({ uri, beats: [], frames: [], step: .2, tempo: 0, ready: false, cached: false });
    Spicetify.CosmosAsync.get(`https://spclient.wg.spotify.com/audio-attributes/v1/audio-analysis/${id}?format=json`)
      .then((analysis) => {
        if (cancelled) return;
        const packed = packTrackAnalysis(analysis);
        saveTrackAnalysis(uri, packed);
        setRhythm({ uri, ...packed, ready: packed.frames.length > 0, cached: false });
      })
      .catch(() => { if (!cancelled) setRhythm({ uri, beats: [], frames: [], step: .2, tempo: 0, ready: false, cached: false }); });
    return () => { cancelled = true; };
  }, [enabled, uri]);
  return rhythm;
}

const signalValue = (signal, band) => ({ bass: signal.bass, mid: signal.mid, high: signal.high, energy: signal.energy, impact: signal.impact, drop: signal.drop, off: 0 })[band] || 0;

function useTrackSignal(playing, enabled, rhythm, gain = 100, smoothing = 8, leadMs = 0, quality = "balanced") {
  const [signal, setSignal] = useState({ bass: 0, mid: 0, high: 0, energy: 0, impact: 0, drop: 0, ready: false });
  useEffect(() => {
    if (!playing || !enabled || !rhythm.ready || !rhythm.frames.length) { setSignal((current) => current.energy || current.bass ? { bass: 0, mid: 0, high: 0, energy: 0, impact: 0, drop: 0, ready: rhythm.ready } : current); return undefined; }
    let previousBeat = -1;
    let animationFrame = 0;
    let lastPaint = -Infinity;
    // Keep the music signal on its own render island. Balanced now targets a
    // true 30 fps and High targets the display refresh rate (up to 60 fps),
    // while thresholds still prevent no-op React commits between analysis
    // frames. This gives fluid motion without turning static editor controls
    // into a 60 fps render workload.
    const qualityProfile = quality === "eco"
      ? { frameMs: 1000 / 12, threshold: .014 }
      : quality === "high"
        ? { frameMs: 1000 / 60, threshold: .0025 }
        : { frameMs: 1000 / 30, threshold: .006 };
    const alpha = Number(smoothing) <= 0 ? 1 : clamp(1 - Number(smoothing) / 115, .12, .94);
    const multiplier = clamp(Number(gain || 100) / 100, .15, 2);
    const paint = (clock) => {
      // Spotify can keep an inactive Custom App alive for hours. Stop the
      // animation loop while its document is hidden and resume on return so
      // the studio never burns CPU or accumulates background render work.
      if (document.hidden) { animationFrame = 0; return; }
      if (clock - lastPaint < qualityProfile.frameMs) { animationFrame = window.requestAnimationFrame(paint); return; }
      lastPaint = clock;
      const milliseconds = Number(Spicetify.Player?.getProgress?.());
      if (!Number.isFinite(milliseconds)) { animationFrame = window.requestAnimationFrame(paint); return; }
      const seconds = Math.max(0, (milliseconds + Number(leadMs || 0)) / 1000);
      const frame = rhythm.frames[clamp(Math.floor(seconds / rhythm.step), 0, rhythm.frames.length - 1)] || [0, 0, 0, 0, 0];
      const beat = indexAt(rhythm.beats, seconds);
      const hit = beat >= 0 && beat !== previousBeat;
      previousBeat = beat;
      const targets = { energy: clamp(frame[0] / 100 * multiplier, 0, 1), bass: clamp(frame[1] / 100 * multiplier, 0, 1), mid: clamp(frame[2] / 100 * multiplier, 0, 1), high: clamp(frame[3] / 100 * multiplier, 0, 1), drop: clamp(frame[4] / 100 * multiplier, 0, 1) };
      setSignal((current) => {
        const next = { energy: current.energy + (targets.energy - current.energy) * alpha, bass: current.bass + (targets.bass - current.bass) * alpha, mid: current.mid + (targets.mid - current.mid) * alpha, high: current.high + (targets.high - current.high) * alpha, drop: current.drop + (targets.drop - current.drop) * alpha, impact: clamp(targets.drop * .62 + (hit ? .78 : 0), 0, 1), ready: true };
        // Avoid repainting every block when a 40 ms poll has not produced a visually meaningful change.
        const changed = !current.ready || ["energy", "bass", "mid", "high", "drop", "impact"].some((key) => Math.abs(next[key] - current[key]) >= qualityProfile.threshold);
        return changed ? next : current;
      });
      animationFrame = window.requestAnimationFrame(paint);
    };
    animationFrame = window.requestAnimationFrame(paint);
    const onVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        return;
      }
      if (!animationFrame) animationFrame = window.requestAnimationFrame(paint);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => { window.cancelAnimationFrame(animationFrame); document.removeEventListener("visibilitychange", onVisibilityChange); };
  }, [playing, enabled, rhythm, gain, smoothing, leadMs, quality]);
  return signal;
}

function Icon({ children, title, active, onClick, disabled }) {
  return h("button", { className: `hc-icon-btn ${active ? "is-active" : ""}`, title, onClick, disabled, type: "button" }, children);
}

function Field({ label, value, min, max, step = 1, unit = "", onChange }) {
  return h("label", { className: "hc-field" },
    h("span", null, label),
    h("span", { className: "hc-field-value" }, `${value}${unit}`),
    h("input", { type: "range", min, max, step, value, onChange: (event) => onChange(Number(event.target.value)) })
  );
}

function InstrumentTuning({ layer, onPatch }) {
  const config = ELEMENT_TUNING[layer.type];
  if (!config) return null;
  const defaults = instrumentDefaults(layer.type);
  const styles = ELEMENT_STYLES[layer.type] || [];
  return h("div", { className: "hc-layer-audio-lab hc-instrument-lab" },
    h("span", { className: "hc-section-label" }, config.title),
    h("p", null, config.copy),
    styles.length > 0 && h("label", { className: "hc-select-field" },
      h("span", null, "Visual style"),
      h("select", { value: layer.detailStyle || styles[0][0], onChange: (event) => onPatch({ detailStyle: event.target.value }) }, styles.map(([value, label]) => h("option", { key: value, value }, label)))
    ),
    config.controls?.map((control) => h(Field, {
      key: control.key,
      label: control.label,
      value: Math.round(Number(layer[control.key] ?? defaults[control.key] ?? control.min)),
      min: control.min,
      max: control.max,
      unit: control.unit,
      onChange: (value) => onPatch({ [control.key]: value })
    })),
    config.builtIn && h("small", { className: "hc-instrument-note" }, "This element has its dedicated controls in this panel.")
  );
}

function CoverTuning({ layer, onPatch }) {
  const reset = () => onPatch({ coverZoom: 100, coverX: 50, coverY: 50, coverBrightness: 100, coverSaturation: 100, coverContrast: 100, coverGloss: true, coverAudioLight: false, coverAudioGlow: false, coverAudioMode: "depth", coverAudioAmount: 52, coverAudioDepth: 46, coverMotionFluidity: 58 });
  return h("div", { className: "hc-cover-editor" },
    h("span", { className: "hc-section-label" }, "Album cover"),
    h("p", null, "Crop, tone and music movement are local to this cover. Brightening remains off until you enable it."),
    h(Field, { label: "Cover zoom", value: Math.round(layer.coverZoom ?? 100), min: 60, max: 180, unit: "%", onChange: (coverZoom) => onPatch({ coverZoom }) }),
    h("div", { className: "hc-two-fields" }, h(Field, { label: "Image left / right", value: Math.round(layer.coverX ?? 50), min: 0, max: 100, unit: "%", onChange: (coverX) => onPatch({ coverX }) }), h(Field, { label: "Image up / down", value: Math.round(layer.coverY ?? 50), min: 0, max: 100, unit: "%", onChange: (coverY) => onPatch({ coverY }) })),
    h("div", { className: "hc-two-fields" }, h(Field, { label: "Brightness", value: Math.round(layer.coverBrightness ?? 100), min: 50, max: 150, unit: "%", onChange: (coverBrightness) => onPatch({ coverBrightness }) }), h(Field, { label: "Saturation", value: Math.round(layer.coverSaturation ?? 100), min: 0, max: 200, unit: "%", onChange: (coverSaturation) => onPatch({ coverSaturation }) })),
    h(Field, { label: "Contrast", value: Math.round(layer.coverContrast ?? 100), min: 50, max: 160, unit: "%", onChange: (coverContrast) => onPatch({ coverContrast }) }),
    h("div", { className: "hc-cover-motion-lab" },
      h("span", { className: "hc-section-label" }, "Music movement"),
      h("label", { className: "hc-select-field" }, h("span", null, "Response mode"), h("select", { value: layer.coverAudioMode || "depth", onChange: (event) => onPatch({ coverAudioMode: event.target.value }) }, [["depth", "Depth — bass forward, highs shift"], ["pulse", "Pulse — precise scale"], ["tilt", "Tilt — 3D frequency balance"], ["float", "Float — gentle frequency travel"], ["still", "Still — no cover movement"]].map(([value, label]) => h("option", { key: value, value }, label)))),
      h("div", { className: "hc-two-fields" }, h(Field, { label: "Response amount", value: Math.round(layer.coverAudioAmount ?? 52), min: 0, max: 100, unit: "%", onChange: (coverAudioAmount) => onPatch({ coverAudioAmount }) }), h(Field, { label: "Depth / tilt", value: Math.round(layer.coverAudioDepth ?? 46), min: 0, max: 100, unit: "%", onChange: (coverAudioDepth) => onPatch({ coverAudioDepth }) })),
      h(Field, { label: "Motion smoothness", value: Math.round(layer.coverMotionFluidity ?? 58), min: 0, max: 100, unit: "%", onChange: (coverMotionFluidity) => onPatch({ coverMotionFluidity }) })
    ),
    h("div", { className: "hc-control-toggle-grid" }, h("label", { className: "hc-switch-row" }, h("span", null, "Cover gloss"), h("input", { type: "checkbox", checked: layer.coverGloss !== false, onChange: (event) => onPatch({ coverGloss: event.target.checked }) }), h("i")), h("label", { className: "hc-switch-row" }, h("span", null, "Brighten on music"), h("input", { type: "checkbox", checked: layer.coverAudioLight === true, onChange: (event) => onPatch({ coverAudioLight: event.target.checked }) }), h("i")), h("label", { className: "hc-switch-row" }, h("span", null, "Glow on music"), h("input", { type: "checkbox", checked: layer.coverAudioGlow === true, onChange: (event) => onPatch({ coverAudioGlow: event.target.checked }) }), h("i"))),
    h("button", { className: "hc-cover-reset", onClick: reset, type: "button" }, "Reset crop, tone and music movement")
  );
}

const hexToHsv = (hex) => {
  const safe = /^#[0-9a-f]{6}$/i.test(hex || "") ? hex.slice(1) : "ffffff";
  const r = parseInt(safe.slice(0, 2), 16) / 255; const g = parseInt(safe.slice(2, 4), 16) / 255; const b = parseInt(safe.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const delta = max - min;
  const hue = !delta ? 0 : max === r ? 60 * (((g - b) / delta + 6) % 6) : max === g ? 60 * ((b - r) / delta + 2) : 60 * ((r - g) / delta + 4);
  // Keep the full HSV value internally.  Rounding H/S/V to whole numbers here
  // made an otherwise untouched HEX colour move by one RGB step after opening
  // the picker.  The fields below show a tidy two-decimal value, but the colour
  // engine keeps the precise conversion for a lossless picker round trip.
  return { h: hue, s: max ? delta / max * 100 : 0, v: max * 100 };
};
const hsvToHex = (hue, saturation, value) => {
  const hValue = ((Number(hue) % 360) + 360) % 360; const s = clamp(Number(saturation) / 100, 0, 1); const v = clamp(Number(value) / 100, 0, 1);
  const chroma = v * s; const x = chroma * (1 - Math.abs((hValue / 60) % 2 - 1)); const m = v - chroma;
  const [r, g, b] = hValue < 60 ? [chroma, x, 0] : hValue < 120 ? [x, chroma, 0] : hValue < 180 ? [0, chroma, x] : hValue < 240 ? [0, x, chroma] : hValue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${[r, g, b].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0")).join("")}`;
};
const hexToRgb = (hex) => {
  const safe = /^#[0-9a-f]{6}$/i.test(hex || "") ? hex.slice(1) : "ffffff";
  return { r: parseInt(safe.slice(0, 2), 16), g: parseInt(safe.slice(2, 4), 16), b: parseInt(safe.slice(4, 6), 16) };
};
const rgbToHex = (r, g, b) => `#${[r, g, b].map((channel) => clamp(Math.round(Number(channel) || 0), 0, 255).toString(16).padStart(2, "0")).join("")}`;

// One colour engine powers backgrounds, finishing effects and layers. Manual
// values remain untouched; cover and RGB sources are calculated on every song
// update, while the two “+ music” modes also shift gently with real analysis.
const shiftColour = (hex, degrees = 0, saturationBoost = 0, valueBoost = 0) => {
  const hsv = hexToHsv(hex);
  return hsvToHex(hsv.h + degrees, clamp(hsv.s + saturationBoost, 0, 100), clamp(hsv.v + valueBoost, 0, 100));
};
const resolveColourSet = ({ source = "manual", count = 2, manual = [], coverPalette, audioLevel = 0 }) => {
  const safeManual = ["#ffffff", "#a0a0a0", "#202020", "#101010"].map((fallback, index) => /^#[0-9a-f]{6}$/i.test(manual[index] || "") ? manual[index] : fallback);
  const stops = clamp(Number(count) || 2, 1, 4);
  const coverPrimary = coverPalette?.primary || safeManual[0];
  const coverSecondary = coverPalette?.secondary || safeManual[1];
  const musicShift = clamp(Number(audioLevel) || 0, 0, 1) * 118;
  let colours;
  if (source === "cover" || source === "cover-reactive") {
    const shift = source === "cover-reactive" ? musicShift : 0;
    colours = [
      shiftColour(coverPrimary, shift, source === "cover-reactive" ? 9 : 0),
      shiftColour(coverSecondary, -shift * .56, source === "cover-reactive" ? 6 : 0),
      shiftColour(coverPrimary, 132 + shift * .34, 4, -4),
      shiftColour(coverSecondary, 220 - shift * .28, 8, 5)
    ];
  } else if (source === "rgb" || source === "rgb-reactive") {
    const shift = source === "rgb-reactive" ? musicShift + audioLevel * 42 : 0;
    colours = [0, 108, 212, 318].map((hue, index) => hsvToHex(hue + shift + index * audioLevel * 12, 78 + (index % 2) * 12, 100));
  } else {
    colours = safeManual;
  }
  return colours.map((colour, index) => colours[Math.min(index, stops - 1)] || colour);
};

function ColourSourceControls({ source = "manual", count = 2, onSourceChange, onCountChange, label = "Colour source" }) {
  const copy = { manual: "Your exact colours", cover: "Changes with every album cover", "cover-reactive": "Album colours shift with the song", rgb: "Fixed spectrum", "rgb-reactive": "Spectrum shifts with real music" }[source] || "Your exact colours";
  return h("div", { className: "hc-colour-source-controls" },
    h("label", { className: "hc-select-field" }, h("span", null, label), h("select", { value: source, onChange: (event) => onSourceChange(event.target.value) }, COLOUR_SOURCE_OPTIONS.map(([value, optionLabel]) => h("option", { key: value, value }, optionLabel)))),
    h("div", { className: "hc-colour-stop-row", "aria-label": "Number of active colours" }, h("span", null, "Active colours"), [1, 2, 3, 4].map((value) => h("button", { key: value, type: "button", className: Number(count) === value ? "is-active" : "", onClick: () => onCountChange(value), title: `${value} active colour${value === 1 ? "" : "s"}` }, value))),
    h("p", null, copy)
  );
}

function ColourField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pickerPosition, setPickerPosition] = useState(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const pointerIdRef = useRef(null);
  useEffect(() => setDraft(value), [value]);
  const hsv = hexToHsv(value);
  const rgb = hexToRgb(value);
  const placePicker = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect || typeof window === "undefined") return;
    const margin = 10;
    const pickerWidth = 280;
    const pickerHeight = 425;
    const left = clamp(rect.left, margin, Math.max(margin, window.innerWidth - pickerWidth - margin));
    const roomBelow = window.innerHeight - rect.bottom - margin;
    const top = roomBelow >= pickerHeight
      ? rect.bottom + 7
      : clamp(rect.top - pickerHeight - 7, margin, Math.max(margin, window.innerHeight - pickerHeight - margin));
    setPickerPosition({ left, top });
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    placePicker();
    const closeOutside = (event) => {
      if (triggerRef.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", placePicker);
    window.addEventListener("scroll", placePicker, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", placePicker);
      window.removeEventListener("scroll", placePicker, true);
    };
  }, [open, placePicker]);
  const setHueFromWheel = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = event.clientX - rect.left - radius;
    const dy = event.clientY - rect.top - radius;
    const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
    onChange(hsvToHex(hue, hsv.s, hsv.v));
  };
  const setFromColourPlane = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const saturation = clamp((event.clientX - rect.left) / rect.width * 100, 0, 100);
    const brightness = clamp((rect.bottom - event.clientY) / rect.height * 100, 0, 100);
    onChange(hsvToHex(hsv.h, saturation, brightness));
  };
  const beginPickerGesture = (kind, event) => {
    event.preventDefault();
    event.stopPropagation();
    pointerIdRef.current = { id: event.pointerId, kind };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (kind === "hue") setHueFromWheel(event); else setFromColourPlane(event);
  };
  const movePickerGesture = (kind, event) => {
    if (pointerIdRef.current?.id !== event.pointerId || pointerIdRef.current.kind !== kind) return;
    if (kind === "hue") setHueFromWheel(event); else setFromColourPlane(event);
  };
  const finishPickerGesture = (event) => {
    if (pointerIdRef.current?.id !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    pointerIdRef.current = null;
  };
  const popover = open && h("div", { ref: popoverRef, className: "hc-colour-popover hc-colour-popover--portal", role: "dialog", "aria-label": `${label} colour picker`, style: pickerPosition ? { left: `${pickerPosition.left}px`, top: `${pickerPosition.top}px` } : { visibility: "hidden" }, onPointerDown: (event) => event.stopPropagation() },
      h("div", { className: "hc-colour-wheel", title: "Drag the outer ring to set hue.", onPointerDown: (event) => beginPickerGesture("hue", event), onPointerMove: (event) => movePickerGesture("hue", event), onPointerUp: finishPickerGesture, onPointerCancel: finishPickerGesture },
        h("div", { className: "hc-colour-wheel-core", title: "Drag the central colour plane to set saturation and brightness.", style: { background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }, onPointerDown: (event) => beginPickerGesture("plane", event), onPointerMove: (event) => movePickerGesture("plane", event), onPointerUp: finishPickerGesture, onPointerCancel: finishPickerGesture }, h("i", { style: { left: `${hsv.s}%`, top: `${100 - hsv.v}%` } })),
        h("span", { className: "hc-hue-wheel-marker", style: { transform: `rotate(${hsv.h}deg)` } })
      ),
      h("p", { className: "hc-colour-help" }, "Outer ring: hue · central plane: saturation + brightness · exact values below"),
      h("div", { className: "hc-colour-swatches", title: "Saved quick colours" }, COLOUR_SWATCHES.map((swatch) => h("button", { key: swatch, type: "button", className: swatch.toLowerCase() === value.toLowerCase() ? "is-active" : "", style: { background: swatch }, title: swatch, onClick: () => onChange(swatch) }))),
      h("label", { className: "hc-colour-exact" }, h("span", null, "HEX"), h("input", { className: "hc-hex-input", value: draft, maxLength: 7, spellCheck: false, onChange: (event) => { const next = event.target.value.trim(); setDraft(next); if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toLowerCase()); }, onBlur: () => setDraft(value), "aria-label": `${label} hexadecimal colour` })),
      h("div", { className: "hc-colour-number-grid" },
        [["H", hsv.h, 0, 360, .01, (next) => onChange(hsvToHex(next, hsv.s, hsv.v))], ["S", hsv.s, 0, 100, .01, (next) => onChange(hsvToHex(hsv.h, next, hsv.v))], ["V", hsv.v, 0, 100, .01, (next) => onChange(hsvToHex(hsv.h, hsv.s, next))], ["R", rgb.r, 0, 255, 1, (next) => onChange(rgbToHex(next, rgb.g, rgb.b))], ["G", rgb.g, 0, 255, 1, (next) => onChange(rgbToHex(rgb.r, next, rgb.b))], ["B", rgb.b, 0, 255, 1, (next) => onChange(rgbToHex(rgb.r, rgb.g, next))]].map(([channel, channelValue, min, max, step, setChannel]) => h("label", { key: channel }, h("span", null, channel), h("input", { type: "number", min, max, step, inputMode: "decimal", value: step < 1 ? Number(channelValue.toFixed(2)) : channelValue, onChange: (event) => setChannel(clamp(Number(event.target.value), min, max)) })))
      )
    );
  return h("div", { className: `hc-colour-field ${open ? "is-open" : ""}` },
    h("button", { ref: triggerRef, className: "hc-colour-trigger", type: "button", title: `Edit ${label} colour`, "aria-expanded": open, onClick: () => setOpen((current) => !current) }, h("span", null, label), h("i", { style: { background: value } }), h("code", null, value.toUpperCase())),
    open && (ReactDOM?.createPortal ? ReactDOM.createPortal(popover, document.body) : popover)
  );
}

const Widget = React.memo(function Widget({ layer, stackIndex = 0, selected, nowPlaying, playback, liveLyrics, motion, audioSignal, coverPalette, onSelect, onPointerDown, onPlayerAction, detached = false }) {
  const motionDuration = Math.max(0.2, motion / 70);
  const layerDuration = Math.max(.45, 3.4 - (layer.speed ?? 60) * .028);
  const input = layer.audioBand || "energy";
  const rawAudio = signalValue(audioSignal, input);
  const gate = clamp(Number(layer.audioGate ?? 8) / 100, 0, .9);
  const sensitivity = .55 + clamp(Number(layer.audioSensitivity ?? 48) / 100, 0, 1) * 1.45;
  const audioLevel = input === "off" ? 0 : clamp((rawAudio - gate) / (1 - gate) * sensitivity * (Number(layer.audioStrength ?? 70) / 100), 0, 1);
  const layerColours = resolveColourSet({
    source: layer.colourSource || "manual",
    count: layer.colourCount ?? 2,
    manual: [layer.colorPrimary || "#f1a17c", layer.colorSecondary || "#dd5e55", layer.colorInk || "#fff8ef", layer.colorBorder || "#ffffff"],
    coverPalette,
    audioLevel
  });
  // Spotify exposes three analysed frequency bands. Interpolate them across
  // visual bars, then add only the real energy/impact signal—no BPM clock.
  const barLevel = (index, total) => {
    if (input === "off") return 0;
    const position = total <= 1 ? 0 : index / (total - 1);
    const lowToMid = audioSignal.bass + (audioSignal.mid - audioSignal.bass) * clamp(position * 2, 0, 1);
    const midToHigh = audioSignal.mid + (audioSignal.high - audioSignal.mid) * clamp((position - .5) * 2, 0, 1);
    const band = position < .5 ? lowToMid : midToHigh;
    const ripple = ((index * 17) % 9) / 100 * (audioSignal.energy || 0);
    return clamp(band * .78 + audioLevel * .24 + (audioSignal.impact || 0) * (index % 5 === 0 ? .18 : .05) + ripple, 0, 1);
  };
  const detailCount = (fallback, min, max) => clamp(Math.round(Number(layer.detailCount ?? fallback)), min, max);
  const instrumentScale = clamp(Number(layer.detailScale ?? 100) / 100, .4, 1.8);
  const detailSpread = clamp(Number(layer.detailSpread ?? 55), 0, 100);
  const detailWeight = clamp(Number(layer.detailWeight ?? 5), 1, 24);
  // Album art has a separate response curve. It uses the chosen source for
  // intensity, while the bass/high relationship supplies natural depth and
  // tilt—there is no time-based floating or rotation.
  const coverMotionMode = layer.coverAudioMode || "depth";
  const coverAmount = clamp(Number(layer.coverAudioAmount ?? 52) / 100, 0, 1);
  const coverDepth = clamp(Number(layer.coverAudioDepth ?? 46) / 100, 0, 1);
  const coverSignal = input === "off" || coverMotionMode === "still" ? 0 : clamp(audioLevel * .76 + (audioSignal.impact || 0) * .24, 0, 1);
  const coverCross = input === "off" ? 0 : clamp((audioSignal.high || 0) - (audioSignal.bass || 0), -1, 1);
  const coverLift = input === "off" ? 0 : clamp((audioSignal.mid || 0) - (audioSignal.bass || 0) * .35, -1, 1);
  const coverPulse = .018 + coverAmount * .21;
  let coverScale = 1 + coverSignal * coverPulse;
  let coverShiftX = 0; let coverShiftY = 0; let coverTiltX = 0; let coverTiltY = 0;
  if (coverMotionMode === "depth") {
    coverShiftX = coverCross * coverDepth * 14;
    coverShiftY = -coverSignal * coverDepth * 11;
    coverTiltY = coverCross * coverDepth * 4;
    coverTiltX = coverLift * coverDepth * 2;
  } else if (coverMotionMode === "tilt") {
    coverShiftX = coverCross * coverDepth * 18;
    coverShiftY = -coverSignal * coverDepth * 7;
    coverTiltX = -coverLift * coverDepth * 12;
    coverTiltY = coverCross * coverDepth * 14;
    coverScale += coverSignal * .025;
  } else if (coverMotionMode === "float") {
    coverShiftX = coverCross * coverDepth * 22;
    coverShiftY = coverLift * coverDepth * 15;
    coverScale -= coverSignal * .018;
  }
  // The local aura lives on the widget itself, not inside a particular visual
  // child. It therefore stays attached to text, controls, artwork and every
  // animated instrument while the optional audio follow tracks its movement.
  const auraStrength = clamp(Number(layer.auraStrength ?? 46) / 100, 0, 1);
  const auraColourSource = layer.auraColourSource === "manual" ? "manual" : "layer";
  const auraColour = auraColourSource === "manual" ? (layer.auraColor || layerColours[0]) : layerColours[0];
  const auraFollowsMotion = layer.auraFollowMotion !== false;
  const auraShiftX = auraFollowsMotion ? (layer.type === "cover" ? coverShiftX : ((audioSignal.high || 0) - (audioSignal.bass || 0)) * 10 * audioLevel) : 0;
  const auraShiftY = auraFollowsMotion ? (layer.type === "cover" ? coverShiftY : -audioLevel * 8) : 0;
  const auraScale = auraFollowsMotion ? 1 + audioLevel * (.07 + auraStrength * .16) : 1;
  const baseStyle = {
    // A 100-point gap makes the explicit stack authoritative. Fine depth can
    // add a subtle local adjustment without allowing a back layer to cover
    // the layer immediately above it.
    left: `${layer.x}%`, top: `${layer.y}%`, width: `${layer.w}%`, zIndex: 100 + stackIndex * 100 + clamp(Number(layer.z || 0), -45, 45),
    opacity: layer.hidden ? 0 : layer.opacity / 100,
    transform: `translate(-50%, -50%) rotate(${layer.rotation || 0}deg)`,
    filter: `hue-rotate(${layer.hue || 0}deg) blur(${layer.blur || 0}px)`,
    mixBlendMode: layer.blend || "normal",
    "--hc-motion": `${motionDuration}s`,
    "--hc-motion-fast": `${motionDuration * .72}s`,
    "--hc-motion-orbit": `${motionDuration * 7}s`,
    "--hc-motion-orbit-inner": `${motionDuration * 4.4}s`,
    "--hc-motion-breathe": `${motionDuration * 2.7}s`,
    "--hc-motion-float": `${motionDuration * 1.8}s`,
    "--hc-motion-wave": `${motionDuration * .9}s`,
    "--hc-motion-meter": `${motionDuration * 1.5}s`,
    "--hc-radius": `${layer.radius ?? 16}px`,
    "--hc-layer-ink": layer.colourSource && Number(layer.colourCount) >= 3 ? layerColours[2] : layer.colorInk || "#fff8ef",
    "--hc-layer-border": layer.colourSource && Number(layer.colourCount) >= 4 ? layerColours[3] : layer.colorBorder || "#ffffff",
    "--hc-layer-surface": layer.colorSurface || "#191618",
    "--hc-lyrics-text-opacity": `${clamp(Number(layer.textOpacity ?? 100) / 100, 0, 1)}`,
    "--hc-lyrics-panel-opacity": `${clamp(Number(layer.textPanelOpacity ?? 68) / 100, 0, 1)}`,
    "--hc-lyrics-panel-color": layer.textPanelColor || layer.colorSurface || "#191618",
    "--hc-accent": layerColours[0],
    "--hc-accent-2": layerColours[1],
    "--hc-audio-level": audioLevel.toFixed(3),
    "--hc-audio-scale": (1 + audioLevel * .22).toFixed(3),
    "--hc-audio-brightness": (1 + audioLevel * .58).toFixed(3),
    "--hc-audio-glow": `${(8 + audioLevel * 34).toFixed(1)}px`,
    "--hc-audio-opacity": (0.72 + audioLevel * .28).toFixed(3),
    "--hc-audio-transition": `${Math.round(layer.audioSmoothing ?? 0)}ms`,
    // Direct, analyser-driven values for scene instruments. These deliberately
    // use no clock or looping keyframes: when the track is quiet they settle.
    "--hc-react-scale": (1 + audioLevel * .28).toFixed(3),
    // Every instrument keeps a clear resting form. Audio adds expression on
    // top of it instead of making elements disappear between beats.
    "--hc-react-detail-scale": ((.96 + audioLevel * .52) * instrumentScale).toFixed(3),
    "--hc-react-opacity": (.48 + audioLevel * .52).toFixed(3),
    "--hc-react-brightness": (1 + audioLevel * .72).toFixed(3),
    "--hc-react-turn": `${Math.round((audioSignal.impact || 0) * 46 + (audioSignal.high || 0) * 28)}deg`,
    "--hc-react-turn-reverse": `${Math.round(-((audioSignal.impact || 0) * 34 + (audioSignal.bass || 0) * 24))}deg`,
    "--hc-react-shift-x": `${Math.round(((audioSignal.high || 0) - (audioSignal.bass || 0)) * 13)}px`,
    "--hc-react-shift-y": `${Math.round(-audioLevel * 18)}px`,
    "--hc-react-grid-shift": `${Math.round(audioLevel * 42)}px`,
    "--hc-react-background-shift": `${Math.round(audioLevel * 58)}px`,
    "--hc-detail-weight": `${detailWeight}px`,
    "--hc-detail-gap": `${clamp(Number(layer.detailGap ?? 4), 0, 40)}px`,
    "--hc-detail-softness": `${clamp(Number(layer.detailSoftness ?? 10), 0, 48)}px`,
    "--hc-detail-scale": `${instrumentScale.toFixed(3)}`,
    "--hc-text-weight": `${clamp(Number(layer.textWeight ?? 760), 300, 900)}`,
    "--hc-text-tracking": `${clamp(Number(layer.textTracking ?? 0), -4, 32) / 100}em`,
    // Cover fluidity only affects the visual movement of album art. It does
    // not alter the analysis, timing or response of the rest of the layer.
    "--hc-cover-audio-transition": `${Math.round(15 + clamp(Number(layer.coverMotionFluidity ?? 58), 0, 100) * 4.8)}ms`,
    "--hc-cover-glow-size": `${Math.round(10 + coverSignal * (12 + coverAmount * 32))}px`,
    "--hc-cover-glow-opacity": `${Math.round(12 + coverSignal * (24 + coverAmount * 54))}%`,
    "--hc-backdrop-blur": `${Math.max(0, Number(layer.backdropBlur || 0))}px`,
    "--hc-backdrop-bleed": `${Math.max(0, Number(layer.backdropBleed || 0))}px`,
    "--hc-backdrop-opacity": `${clamp(Number(layer.backdropBleed || 0) / 85, 0, .72)}`,
    "--hc-element-aura-color": auraColour,
    "--hc-element-aura-size": `${clamp(Number(layer.auraSize ?? 42), 0, 260)}px`,
    "--hc-element-aura-strength": `${auraStrength.toFixed(3)}`,
    "--hc-element-aura-blur": `${clamp(Number(layer.auraBlur ?? 24), 0, 160)}px`,
    "--hc-element-aura-scale": auraScale.toFixed(3),
    "--hc-element-aura-x": `${auraShiftX.toFixed(2)}px`,
    "--hc-element-aura-y": `${auraShiftY.toFixed(2)}px`,
    "--hc-element-aura-blend": layer.auraBlend || "screen",
    "--hc-layer-pulse": 1 + (layer.beat ?? 70) * .00075,
    "--hc-layer-glow": `${16 + (layer.beat ?? 70) * .34}px`,
    "--hc-layer-speed": `${layerDuration}s`,
    "--hc-layer-speed-2": `${layerDuration * 2}s`,
    "--hc-layer-speed-3": `${layerDuration * 2.7}s`,
    "--hc-layer-speed-4": `${layerDuration * 4}s`,
    "--hc-layer-speed-6": `${layerDuration * 6}s`
  };
  const frameProps = {
    className: `hc-widget hc-widget--${layer.type} ${selected ? "is-selected" : ""} ${layer.locked ? "is-locked" : ""} ${layer.hidden ? "is-hidden" : ""} ${layer.auraEnabled ? "has-element-aura" : ""} ${layer.type === "cover" && layer.coverAudioLight ? "allows-cover-audio-light" : ""} ${layer.type === "cover" && layer.coverAudioGlow ? "has-cover-audio-glow" : ""} ${Number(layer.backdropBlur || 0) > 0 || Number(layer.backdropBleed || 0) > 0 ? "has-backdrop-blend" : ""} ${input !== "off" ? "is-audio-reactive" : ""} ${audioLevel > .03 ? "is-audio-live" : ""}`,
    style: baseStyle,
    onPointerDown: detached ? undefined : (event) => onPointerDown(event, layer, "move"),
    onClick: detached ? undefined : (event) => { event.stopPropagation(); onSelect(layer.id); },
    "data-layer": layer.id,
    "data-instrument-style": layer.detailStyle || (ELEMENT_STYLES[layer.type]?.[0]?.[0] || "default")
  };
  let body;
  if (layer.type === "cover") {
    const coverStyle = nowPlaying.art ? {
      backgroundImage: `url(${nowPlaying.art})`,
      backgroundPosition: `${layer.coverX ?? 50}% ${layer.coverY ?? 50}%`,
      backgroundSize: `${layer.coverZoom ?? 100}%`,
      transform: `perspective(760px) translate3d(${coverShiftX.toFixed(2)}px, ${coverShiftY.toFixed(2)}px, 0) rotateX(${coverTiltX.toFixed(2)}deg) rotateY(${coverTiltY.toFixed(2)}deg) scale(${coverScale.toFixed(4)})`,
      "--hc-cover-tone": `brightness(${layer.coverBrightness ?? 100}%) saturate(${layer.coverSaturation ?? 100}%) contrast(${layer.coverContrast ?? 100}%)`
    } : null;
    body = h("div", { className: "hc-cover", style: coverStyle },
      layer.coverGloss !== false && h("span", { className: "hc-cover-gloss" }));
  } else if (layer.type === "spectrum") {
    const count = detailCount(34, 8, 64);
    body = h("div", { className: "hc-spectrum", "aria-label": "Animated spectrum" },
      Array.from({ length: count }, (_, index) => {
        const live = barLevel(index, count);
        return h("i", { key: index, style: {
          "--bar": `${22 + ((index * 37) % 76)}%`, "--live": live.toFixed(3), "--delay": `${(index % 8) * -0.13}s`,
          "--bar-low": (.12 + live * .34).toFixed(3), "--bar-high": (.32 + live * 1.04).toFixed(3),
          "--bar-scale": (.38 + live * .94).toFixed(3), "--bar-opacity": (.42 + live * .58).toFixed(3)
        } });
      }));
  } else if (layer.type === "orbit") {
    const count = detailCount(3, 1, 8);
    body = h("div", { className: "hc-orbit" }, ...Array.from({ length: count }, (_, index) => h("i", { key: index, style: { "--orbit-inset": `${Math.min(index * 12, 42)}%` } })), h("b"));
  } else if (layer.type === "lyrics") {
    body = h("div", { className: "hc-lyrics-card" },
      h("span", { className: "hc-kicker" }, "A small moment"),
      h("strong", null, layer.content || "Make the room\nmove with you."),
      h("small", null, nowPlaying.artist));
  } else if (layer.type === "liveLyrics") {
    const options = { ...LAYER_DEFAULTS.liveLyrics.lyrics, ...(layer.lyrics || {}) };
    const moment = lyricMoment(liveLyrics, playback?.progressMs || 0);
    const hasStaticLyrics = liveLyrics?.status === "ready" && liveLyrics?.timed === false && liveLyrics?.lines?.length;
    const lyricLayout = options.layout === "auto" ? (liveLyrics?.wordTimed ? "karaoke" : liveLyrics?.timed ? "focus" : "stack") : (options.layout || "stack");
    const fallback = layer.content || (liveLyrics?.status === "loading" ? "Finding lyrics…" : "Lyrics are not available for this track.");
    const activeCopy = moment.active?.text || fallback;
    const useWordHighlight = Boolean(options.wordHighlight && moment.active && moment.words?.length > 1);
    const panelStyle = {
      "--hc-live-size": `${options.textSize ?? 46}px`,
      "--hc-live-context": `${options.contextSize ?? 19}px`,
      "--hc-live-inactive": `${clamp(Number(options.inactiveOpacity ?? 36) / 100, .08, .9)}`,
      "--hc-live-text-opacity": `${clamp(Number(options.activeOpacity ?? 100) / 100, 0, 1)}`,
      "--hc-live-scale": `${1 + audioLevel * clamp(Number(options.activeScale ?? 12) / 100, 0, .4)}`,
      "--hc-live-panel": `${clamp(Number(options.panelOpacity ?? 84) / 100, .18, 1)}`,
      "--hc-live-panel-color": options.panelColor || layer.colorSurface || "#07080b",
      "--hc-live-gap": `${options.lineGap ?? 10}px`,
      "--hc-live-progress": `${Math.round(moment.progress * 100)}%`,
      "--hc-live-word-trail": `${clamp(Number(options.wordTrail ?? 42) / 100, .12, .95)}`
    };
    body = h("section", { className: `hc-live-lyrics hc-live-lyrics--${lyricLayout} ${options.pureText ? "is-pure-text" : ""} is-${options.align || "center"}`, style: panelStyle },
      options.showTrack && !options.pureText && h("header", { className: "hc-live-lyrics-head" }, h("span", null, liveLyrics?.status === "ready" ? (hasStaticLyrics ? "STATIC LYRICS" : "LIVE LYRICS") : "LYRICS"), h("b", null, nowPlaying.title), h("small", null, `${nowPlaying.artist}${liveLyrics?.provider ? ` · ${liveLyrics.provider}` : ""}`)),
      hasStaticLyrics ? h("div", { className: "hc-live-lyrics-static", "aria-label": "Static lyrics" }, liveLyrics.lines.map((line) => h("p", { key: `${line.index}-${line.text}` }, line.text))) : h("div", { className: "hc-live-lyrics-lines" },
        options.showPrevious && moment.previous && h("p", { className: "hc-live-lyrics-line is-context is-previous" }, moment.previous.text),
        h("p", { className: `hc-live-lyrics-line is-active ${useWordHighlight ? "has-word-highlight" : ""}` }, useWordHighlight ? moment.words.map((word, index) => h("span", { key: `${word.index}-${word.startMs}`, className: `hc-live-word ${index < moment.activeWordIndex ? "is-sung" : index === moment.activeWordIndex ? "is-current" : "is-future"}`, title: moment.wordTimed ? "Timed to the sung word" : "Progressive timing within this lyric line" }, word.text)) : h("span", null, activeCopy)),
        options.showNext && moment.next && h("p", { className: "hc-live-lyrics-line is-context is-next" }, moment.next.text)
      ),
      options.showProgress && !options.pureText && liveLyrics?.status === "ready" && liveLyrics?.timed !== false && h("div", { className: "hc-live-lyrics-progress", title: "Current lyric line" }, h("i"))
    );
  } else if (layer.type === "title") {
    body = h("div", { className: "hc-now-playing" },
      h("span", { className: "hc-playing-dot" }),
      h("div", null, h("b", null, layer.content || nowPlaying.title), h("small", null, nowPlaying.artist)));
  } else if (layer.type === "chip") {
    body = h("div", { className: "hc-chip" }, h("span", null, nowPlaying.playing ? "LIVE" : "PAUSED"), h("b", null, layer.content || "STUDIO 01"));
  } else if (layer.type === "glow") {
    body = h("div", { className: "hc-glow" });
  } else if (layer.type === "notes") {
    const count = detailCount(17, 4, 64);
    body = h("div", { className: "hc-notes" }, Array.from({ length: count }, (_, index) => {
      const size = detailWeight + ((index * 7) % 10);
      const live = barLevel(index, count);
      const x = 50 + (((index * 29) % 100 - 50) * detailSpread / 100);
      const y = 50 + (((index * 47) % 100 - 50) * detailSpread / 100);
      return h("i", { key: index, style: { "--x": `${x}%`, "--y": `${y}%`, "--s": `${size}px`, "--glow": `${size * 1.6}px`, "--d": `${index * -0.31}s`, "--note-scale": (.72 + live * 1.02).toFixed(3), "--note-shift": `${Math.round(-live * (7 + index % 5))}px`, "--note-opacity": (.38 + live * .62).toFixed(3) } });
    }));
  } else if (layer.type === "wave") {
    const count = detailCount(18, 6, 48);
    body = h("div", { className: "hc-wave", style: { "--hc-wave-audio": audioLevel.toFixed(3), "--wave-width": `${100 / count}%` } }, Array.from({ length: count }, (_, index) => {
      const live = barLevel(index, count);
      return h("i", { key: index, style: {
        "--wave": `${28 + ((index * 31) % 64)}%`, "--live": live.toFixed(3), "--delay": `${index * -.11}s`,
        "--wave-low": (.16 + live * .45).toFixed(3), "--wave-high": (.38 + live * 1.35).toFixed(3),
        "--wave-scale": (.36 + live * 1.16).toFixed(3), "--wave-opacity": (.42 + live * .58).toFixed(3)
      } });
    }));
  } else if (layer.type === "equalizer") {
    const count = detailCount(24, 8, 64);
    body = h("div", { className: "hc-extra-visual hc-extra-visual--equalizer", style: { "--hc-extra-audio": audioLevel.toFixed(3) } }, Array.from({ length: count }, (_, index) => {
      const live = barLevel(index, count);
      return h("i", { key: index, style: {
        "--i": index, "--h": `${14 + (index % 6) * 10}%`, "--live": live.toFixed(3),
        "--live-height": `${Math.round(14 + (index % 6) * 10 + live * 42)}%`, "--live-scale": (.54 + live * .8).toFixed(3), "--live-opacity": (.42 + live * .58).toFixed(3), "--live-brightness": (1 + live * .5).toFixed(3)
      } });
    }));
  } else if (["radar", "tunnel", "orbital", "prismShape", "arc", "cascade", "luma", "kinetic", "horizon"].includes(layer.type)) {
    const count = detailCount(16, 4, 48);
    body = h("div", { className: `hc-extra-visual hc-extra-visual--${layer.type}`, style: { "--hc-extra-audio": audioLevel.toFixed(3) } }, Array.from({ length: count }, (_, index) => {
      const live = barLevel(index, count);
      return h("i", { key: index, style: { "--i": index, "--h": `${12 + (index % 6) * 12}%`, "--x": `${(index * 37) % 100}%`, "--y": `${(index * 53) % 100}%`, "--extra-scale": (.68 + live * 1.05).toFixed(3), "--extra-shift": `${Math.round(-live * (9 + index % 5))}px`, "--extra-opacity": (.4 + live * .6).toFixed(3), "--extra-turn": `${Math.round((live - .5) * (16 + index % 4 * 8))}deg` } });
    }));
  } else if (layer.type === "poster") {
    body = h("div", { className: "hc-poster" }, h("span", null, "OPEN STUDIO"), h("strong", null, layer.content || "MAKE IT\nYOURS."), h("i", null, "✦"));
  } else if (layer.type === "meter") {
    body = h("div", { className: "hc-meter" }, h("span", null, "NOW / 02:14"), h("div", null, h("i", { style: { width: `${Math.round(38 + audioLevel * 62)}%` } })), h("b", null, nowPlaying.playing ? "LIVE SIGNAL" : "STANDBY"));
  } else if (layer.type === "controls") {
    const options = { ...LAYER_DEFAULTS.controls.controls, ...(layer.controls || {}) };
    const progress = playback?.durationMs ? clamp((playback.progressMs || 0) / playback.durationMs * 100, 0, 100) : 0;
    const progressStyle = options.progressStyle || "line";
    const playerButton = (action, label, icon) => h("button", { className: "hc-player-button", title: label, type: "button", onPointerDown: (event) => event.stopPropagation(), onClick: (event) => { event.stopPropagation(); onPlayerAction?.(action); } }, icon);
    const seek = (event) => {
      event.preventDefault(); event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      const fraction = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      onPlayerAction?.("seek", Math.round((playback?.durationMs || 0) * fraction));
    };
    const progressVisual = progressStyle === "segments"
      ? h("span", { className: "hc-player-segments", "aria-hidden": "true" }, ...Array.from({ length: 20 }, (_, index) => h("i", { key: index, className: ((index + 1) / 20) * 100 <= progress ? "is-passed" : "", style: { "--segment-height": `${28 + (index * 17) % 62}%` } })))
      : progressStyle === "waveform"
        ? h("span", { className: "hc-player-wave-progress", "aria-hidden": "true" }, ...Array.from({ length: 24 }, (_, index) => h("i", { key: index, className: ((index + 1) / 24) * 100 <= progress ? "is-passed" : "", style: { "--wave-progress-height": `${22 + (index * 23) % 60 + audioLevel * 14}%` } })))
        : h("i", { style: { width: `${progress}%` } });
    body = h("div", { className: "hc-playback-bar" },
      options.showCover && h("span", { className: "hc-player-art", style: nowPlaying.art ? { backgroundImage: `url(${nowPlaying.art})` } : null }),
      options.showTrack && h("span", { className: "hc-player-copy" }, h("b", null, nowPlaying.title), h("small", null, nowPlaying.artist)),
      h("span", { className: "hc-player-actions" },
        options.showShuffle && playerButton("shuffle", "Toggle shuffle", "⇄"),
        options.showPrevious && playerButton("previous", "Previous track", "‹"),
        options.showPlay && playerButton("play", nowPlaying.playing ? "Pause" : "Play", nowPlaying.playing ? "Ⅱ" : "▶"),
        options.showNext && playerButton("next", "Next track", "›"),
        options.showRepeat && playerButton("repeat", "Toggle repeat", "↻")
      ),
      options.showProgress && h("button", { className: `hc-player-progress hc-player-progress--${progressStyle}`, title: "Seek", type: "button", onPointerDown: (event) => { event.stopPropagation(); seek(event); }, onPointerMove: (event) => { if (event.buttons) seek(event); } }, progressVisual),
      options.showTime && h("span", { className: "hc-player-time" }, options.showRemaining ? `−${formatTime(Math.max(0, (playback?.durationMs || 0) - (playback?.progressMs || 0)))}` : `${formatTime(playback?.progressMs)} / ${formatTime(playback?.durationMs)}`),
      options.showVolume && h("input", { className: "hc-player-volume", type: "range", min: 0, max: 100, value: Math.round((playback?.volume ?? .8) * 100), title: "Volume", onPointerDown: (event) => event.stopPropagation(), onChange: (event) => onPlayerAction?.("volume", Number(event.target.value) / 100) })
    );
  } else if (layer.type === "frame") {
    body = h("div", { className: "hc-frame" }, h("i"), h("i"));
  } else if (layer.type === "rings") {
    const count = detailCount(5, 1, 10);
    const ringGap = clamp(Number(layer.detailGap ?? 8), 0, 18);
    body = h("div", { className: "hc-rings" }, Array.from({ length: count }, (_, index) => {
      const live = barLevel(index, count);
      return h("i", { key: index, style: { "--ring-inset": `${index * ringGap}%`, "--ring-delay": `${index * -.32}s`, "--ring-scale": (.9 + live * (.38 + index * .05)).toFixed(3), "--ring-opacity": (.32 + live * (.62 - index * .06)).toFixed(3) } });
    }));
  } else if (layer.type === "halo") {
    const count = detailCount(3, 1, 8);
    body = h("div", { className: "hc-halo" }, ...Array.from({ length: count }, (_, index) => {
      const live = barLevel(index, count);
      return h("i", { key: index, style: { "--halo-inset": `${Math.min(index * 17, 42)}%`, "--halo-scale": (.88 + live * .44).toFixed(3), "--halo-opacity": (.32 + live * .68).toFixed(3), "--halo-turn": `${Math.round((index % 2 ? -1 : 1) * live * 42)}deg` } });
    }), h("b", { style: { transform: `scale(${(.72 + audioLevel * .88).toFixed(3)})`, opacity: (.38 + audioLevel * .62).toFixed(3) } }));
  } else if (layer.type === "laser") {
    const count = detailCount(11, 1, 24);
    const spread = clamp(Number(layer.detailSpread ?? 8), 2, 28);
    body = h("div", { className: "hc-laser" }, Array.from({ length: count }, (_, index) => {
      const live = barLevel(index, count);
      const offset = index - (count - 1) / 2;
      return h("i", { key: index, style: { "--laser-rotate": `${offset * spread}deg`, "--laser-sway": `${offset * spread + spread * .6}deg`, "--laser-delay": `${index * -.15}s`, "--laser-live-rotate": `${offset * spread + Math.round((live - .45) * 26)}deg`, "--laser-opacity": (.22 + live * .72).toFixed(3) } });
    }));
  } else if (layer.type === "aurora") {
    const count = detailCount(3, 1, 3);
    body = h("div", { className: "hc-aurora" }, ...Array.from({ length: count }, (_, index) => {
      const live = barLevel(index, count);
      return h("i", { key: index, style: { "--aurora-x": `${Math.round((index - 1) * live * 12)}%`, "--aurora-y": `${Math.round(-live * (5 + index * 3))}%`, "--aurora-turn": `${Math.round((index - 1) * live * 18)}deg`, "--aurora-scale": (.86 + live * .56).toFixed(3), "--aurora-opacity": (.34 + live * .66).toFixed(3) } });
    }));
  } else if (layer.type === "gridwarp") {
    const count = detailCount(6, 2, 18);
    body = h("div", { className: "hc-gridwarp", style: { "--hc-grid-layers": count } }, ...Array.from({ length: count }, (_, index) => h("i", { key: index, style: { "--grid-line-y": `${14 + index / Math.max(1, count - 1) * 76}%` } })));
  } else if (layer.type === "stars") {
    const count = detailCount(30, 5, 100);
    body = h("div", { className: "hc-stars" }, Array.from({ length: count }, (_, index) => {
      const live = barLevel(index, count);
      const x = 50 + (((index * 37) % 100 - 50) * detailSpread / 100);
      const y = 50 + (((index * 61) % 100 - 50) * detailSpread / 100);
      return h("i", { key: index, style: { "--x": `${x}%`, "--y": `${y}%`, "--star": `${detailWeight + ((index * 7) % 5)}px`, "--star-delay": `${index * -.18}s`, "--star-scale": (.68 + live * 1.25).toFixed(3), "--star-opacity": (.34 + live * .66).toFixed(3) } });
    }));
  } else {
    const tickerCopy = layer.content || `${nowPlaying.title}  ·  ${nowPlaying.artist}  ·  LIVE VISUAL SCENE`;
    body = h("div", { className: "hc-ticker" }, h("span", null, `${tickerCopy}  ·  ${tickerCopy}`));
  }
  return h("div", frameProps,
    body,
    selected && !layer.locked && h("button", { className: "hc-resize-handle", title: "Resize", onPointerDown: (event) => onPointerDown(event, layer, "resize"), type: "button" }),
    selected && h("span", { className: "hc-layer-label" }, layer.label)
  );
});

const IDLE_AUDIO_SIGNAL = Object.freeze({ bass: 0, mid: 0, high: 0, energy: 0, impact: 0, drop: 0, ready: false });

// This component is intentionally isolated from the editor shell. The audio
// signal can update at 60 fps without rebuilding the project library,
// inspector, colour pickers or modal UI on every visual frame.
const LiveScene = React.memo(function LiveScene({
  project, nowPlaying, playback, liveLyrics, coverPalette, selectedId,
  onSelect, onPointerDown, onPlayerAction, canvasRef, preview,
  needsTrackAnalysis, trackRhythm, presentationTarget
}) {
  const audioSignal = useTrackSignal(nowPlaying.playing, needsTrackAnalysis, trackRhythm, project.audioGain, project.audioSmoothing, project.audioLeadMs, project.renderQuality || "balanced");
  const stageOrder = useMemo(() => normalizeStageOrder(project), [project]);
  const layersById = useMemo(() => new Map(project.layers.map((layer) => [layer.id, layer])), [project.layers]);
  const effectConfigs = useMemo(() => normalizeEffects(project.effects), [project.effects]);
  const backgroundSource = signalValue(audioSignal, project.backgroundAudioBand || "energy");
  const backgroundAudioLevel = project.backgroundReactive && project.backgroundMode !== "black" ? clamp(backgroundSource * (Number(project.backgroundAudioStrength ?? 58) / 100), 0, 1) : 0;
  const backgroundAudioZoom = clamp(Number(project.backgroundAudioZoom ?? 42) / 100, 0, 1);
  const backgroundAudioLight = clamp(Number(project.backgroundAudioLight ?? 54) / 100, 0, 1);
  const coverAdaptive = project.coverAdaptive !== false && project.backgroundMode !== "black" && Boolean(nowPlaying.art);
  const coverAdaptiveAmount = clamp(Number(project.coverAdaptiveAmount ?? 62) / 100, 0, 1);
  const coverAdaptivePalette = coverAdaptive && project.coverAdaptivePalette !== false;
  const coverAdaptiveEffects = coverAdaptive && project.coverAdaptiveEffectColours !== false;
  const showCanvasGrid = project.backgroundMode !== "black" && project.showGrid === true;
  const canvasClass = `hc-canvas quality-${project.renderQuality || "balanced"} palette-${project.palette} texture-${project.texture} aspect-${project.aspect || "wide"} background-effect-${project.backgroundEffect || legacySceneEffect(project.scene)} ${showCanvasGrid ? "has-grid" : ""} ${project.backgroundReactive && project.backgroundMode !== "black" ? "is-background-reactive" : ""} ${coverAdaptive ? "is-cover-adaptive" : ""} ${preview ? "is-preview" : ""}`;
  const colourMotion = clamp(audioSignal.energy * .52 + audioSignal.bass * .28 + audioSignal.high * .2, 0, 1);
  const backgroundColourSource = project.backgroundColourSource || (project.autoPalette || coverAdaptivePalette ? "cover" : "manual");
  const backgroundColours = resolveColourSet({ source: backgroundColourSource, count: project.backgroundColourCount ?? 3, manual: [project.bgPrimary, project.bgSecondary, project.bgTertiary], coverPalette, audioLevel: colourMotion });
  const backgroundEffectColourSource = project.backgroundEffectColourSource || (coverAdaptiveEffects ? "cover" : "manual");
  const backgroundEffectColours = resolveColourSet({ source: backgroundEffectColourSource, count: project.backgroundEffectColourCount ?? 2, manual: [project.backgroundEffectColor || "#ff956d", project.backgroundEffectColor2 || "#82ebe0"], coverPalette, audioLevel: colourMotion });
  const [activePrimary, activeSecondary, activeTertiary] = backgroundColours;
  const [effectPrimary, effectSecondary, effectTertiary] = backgroundEffectColours;
  const adaptiveBackdrop = coverAdaptive && !["cover", "upload"].includes(project.backgroundMode) && ["ambient", "artwork"].includes(project.coverAdaptiveStyle || "ambient");
  const backdropSource = project.backgroundMode === "cover" ? nowPlaying.art : project.backgroundMode === "upload" ? project.backgroundImage : adaptiveBackdrop ? nowPlaying.art : "";
  const backdropOpacity = ["cover", "upload"].includes(project.backgroundMode) ? (project.backdropOpacity ?? 44) / 100 : project.coverAdaptiveStyle === "artwork" ? .18 + coverAdaptiveAmount * .58 : .08 + coverAdaptiveAmount * .32;
  const backdropStyle = backdropSource ? {
    backgroundImage: `url(${backdropSource})`, backgroundPosition: `${project.backdropX ?? 50}% ${project.backdropY ?? 50}%`, opacity: backdropOpacity,
    transform: `scale(${((project.backdropScale ?? 108) / 100) * (1 + backgroundAudioLevel * backgroundAudioZoom * .18)})`,
    filter: `blur(${adaptiveBackdrop ? Math.max(18, project.backdropBlur ?? 34) : project.backdropBlur ?? 34}px) saturate(${(adaptiveBackdrop ? 100 + coverAdaptiveAmount * 74 : project.backdropSaturation ?? 118)}%) brightness(${(adaptiveBackdrop ? 48 + coverAdaptiveAmount * 36 : project.backdropBrightness ?? 58) + backgroundAudioLevel * backgroundAudioLight * 42}%)`,
    mixBlendMode: adaptiveBackdrop ? project.coverAdaptiveStyle === "artwork" ? "normal" : "soft-light" : undefined,
    maskImage: adaptiveBackdrop && project.coverAdaptiveStyle === "artwork" ? "none" : undefined
  } : null;
  const focalCover = project.layers.find((layer) => layer.type === "cover" && !layer.hidden) || { x: 50, y: 45 };
  const coverAuraStyle = project.coverAuraEnabled && nowPlaying.art ? {
    backgroundImage: `url(${nowPlaying.art})`, backgroundPosition: `${focalCover.x ?? 50}% ${focalCover.y ?? 45}%`, backgroundSize: `${project.coverAuraScale ?? 72}% auto`,
    opacity: clamp((project.coverAuraOpacity ?? 58) / 100 + backgroundAudioLevel * .14, 0, 1), transform: `scale(${1.08 + backgroundAudioLevel * backgroundAudioZoom * .11})`,
    filter: `blur(${project.coverAuraBlur ?? 34}px) saturate(${project.coverAuraSaturation ?? 140}%) brightness(${(project.coverAuraBrightness ?? 106) + backgroundAudioLevel * backgroundAudioLight * 48}%)`,
    mixBlendMode: project.coverAuraBlend || "screen", "--hc-cover-aura-tint": project.coverAuraTint || "#ffffff", "--hc-cover-aura-x": `${focalCover.x ?? 50}%`, "--hc-cover-aura-y": `${focalCover.y ?? 45}%`
  } : null;
  const canvasStyle = {
    "--hc-density": project.density / 100, "--hc-motion-scale": project.motion / 100, "--hc-ambient": `${project.ambient ?? 62}px`, "--hc-vignette": (project.vignette ?? 42) / 100,
    "--hc-grid-size": project.gridSize || 9, "--hc-grid-step": `${100 / (project.gridSize || 9)}%`, "--hc-bg-primary": activePrimary, "--hc-bg-secondary": activeSecondary, "--hc-bg-tertiary": activeTertiary, "--hc-bg-effect-1": effectPrimary, "--hc-bg-effect-2": effectSecondary, "--hc-bg-effect-3": effectTertiary, "--hc-backdrop-scale": (project.backdropScale ?? 108) / 100,
    "--hc-bg-audio-level": backgroundAudioLevel.toFixed(3), "--hc-bg-audio-scale": (1 + backgroundAudioLevel * backgroundAudioZoom * .18).toFixed(3), "--hc-bg-audio-brightness": (1 + backgroundAudioLevel * backgroundAudioLight * .42).toFixed(3), "--hc-bg-audio-blur": `${Math.round(backgroundAudioLevel * backgroundAudioZoom * 7)}px`, "--hc-bg-effect-opacity": (project.backgroundReactive ? .52 + backgroundAudioLevel * .48 : 1).toFixed(3), "--hc-bg-pulse-opacity": (backgroundAudioLevel * (.06 + backgroundAudioLight * .24)).toFixed(3),
    "--hc-bg-react-turn": `${Math.round((audioSignal.impact || 0) * 38 + (audioSignal.high || 0) * 18)}deg`, "--hc-bg-react-shift-x": `${Math.round(((audioSignal.high || 0) - (audioSignal.bass || 0)) * 18)}px`, "--hc-bg-react-shift-y": `${Math.round(-backgroundAudioLevel * 24)}px`, "--hc-bg-react-position": `${Math.round(backgroundAudioLevel * 76)}px`
  };
  if (project.sceneAccent) canvasStyle["--hc-accent"] = project.sceneAccent;
  if (project.sceneSignal) canvasStyle["--hc-accent-2"] = project.sceneSignal;
  const effectStyle = (config) => {
    const source = signalValue(audioSignal, config.band || "off");
    const live = config.band === "off" ? 0 : clamp(source * (.55 + (config.sensitivity ?? 60) / 100 * 1.45), 0, 1);
    const amount = clamp(Number(config.intensity ?? 58) / 100, 0, 1);
    const colours = resolveColourSet({ source: config.colourSource || (coverAdaptiveEffects ? "cover" : "manual"), count: config.colourCount ?? 2, manual: [config.color || "#ffffff", config.color2 || "#ffffff"], coverPalette, audioLevel: live });
    return { "--hc-fx-1": colours[0], "--hc-fx-2": colours[1], "--hc-fx-3": colours[2], "--hc-fx-opacity": (.02 + amount * .4 + live * .16).toFixed(3), "--hc-fx-opacity-soft": (.015 + amount * .27 + live * .1).toFixed(3), "--hc-fx-scale-live": (1 + live * (.03 + amount * .08)).toFixed(3), "--hc-fx-brightness": (1 + live * (.16 + amount * .44)).toFixed(3), "--hc-fx-turn": `${Math.round(live * (22 + amount * 34))}deg`, "--hc-fx-shift-x": `${Math.round(live * 19)}px`, "--hc-fx-shift-y": `${Math.round(-live * 13)}px`, mixBlendMode: config.blend || "screen" };
  };
  const renderStageItem = (key, index, detached = false) => {
    const zIndex = 100 + index * 100;
    if (key === STAGE_BACKGROUND_EFFECT) return h("div", { key, className: "hc-scene-stage-item hc-scene-stage-item--background", style: { zIndex } }, project.backgroundReactive && project.backgroundMode !== "black" && h("div", { className: "hc-background-pulse" }), project.backgroundEffect && project.backgroundEffect !== "none" && h("div", { className: `hc-background-effect hc-background-effect--${project.backgroundEffect}`, style: { opacity: canvasStyle["--hc-bg-effect-opacity"] } }));
    if (key === STAGE_COVER_AURA) return coverAuraStyle && h("div", { key, className: "hc-cover-aura", style: { ...coverAuraStyle, zIndex } });
    if (key === STAGE_VIGNETTE) return Number(project.vignette || 0) > 0 && h("div", { key, className: "hc-canvas-vignette", style: { zIndex } });
    const effectId = stageEffectId(key);
    if (effectId) {
      const config = effectConfigs[effectId];
      return config?.enabled && h("div", { key, className: `hc-fx hc-fx-${effectId} ${config.band !== "off" && signalValue(audioSignal, config.band) > .03 ? "is-audio-live" : ""}`, style: { ...effectStyle(config), zIndex } });
    }
    const layer = layersById.get(stageLayerId(key));
    const layerSignal = (layer?.audioBand || "energy") === "off" ? IDLE_AUDIO_SIGNAL : audioSignal;
    return layer && h(Widget, { key: layer.id, layer, stackIndex: index, selected: !detached && layer.id === selectedId, nowPlaying, playback, liveLyrics, motion: project.motion, audioSignal: layerSignal, coverPalette, onSelect, onPointerDown, onPlayerAction, detached });
  };
  const renderCanvas = (detached = false) => h("div", {
    ref: detached ? undefined : canvasRef, className: `${canvasClass} background-${project.backgroundMode || "cover"} ${detached ? "hc-canvas--detached" : ""}`,
    onClick: detached ? undefined : () => onSelect(null), style: canvasStyle
  }, h("div", { className: "hc-canvas-noise" }), backdropStyle && h("div", { className: `hc-cover-backdrop ${adaptiveBackdrop ? "is-cover-adaptive" : ""}`, style: backdropStyle }), stageOrder.map((key, index) => renderStageItem(key, index, detached)));
  const presentation = presentationTarget && ReactDOM?.createPortal ? ReactDOM.createPortal(h("div", { className: "hc-present-root" }, renderCanvas(true)), presentationTarget) : null;
  return presentation ? h(React.Fragment, null, renderCanvas(false), presentation) : renderCanvas(false);
});

function Auraloom() {
  const [project, setProject] = useState(readProject);
  const [selectedId, setSelectedId] = useState(project.layers[project.layers.length - 1]?.id || null);
  const [activePanel, setActivePanel] = useState("canvas");
  const [libraryCategory, setLibraryCategory] = useState("visuals");
  const [librarySearch, setLibrarySearch] = useState("");
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [interaction, setInteraction] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [renameSceneId, setRenameSceneId] = useState(null);
  const [renameSceneDraft, setRenameSceneDraft] = useState("");
  const [deleteSceneId, setDeleteSceneId] = useState(null);
  const [exchangeValue, setExchangeValue] = useState("");
  const [savedProjects, setSavedProjects] = useState(readProjectLibrary);
  const [preview, setPreview] = useState(false);
  // Auraloom is launched from Spotify's Custom Apps rail. Start in the complete
  // editor immediately, so clicking its Spotify icon behaves like opening a
  // dedicated creative app rather than a page embedded inside Spotify.
  // This is deliberately a CSS/portal editor mode, not Chromium's native
  // Fullscreen API. Spotify can dispatch fullscreenchange while it swaps its
  // own route container, which previously made the editor flicker or exit.
  const [fullscreen, setFullscreen] = useState(true);
  const [cinema, setCinema] = useState(false);
  const [presentWindow, setPresentWindow] = useState(null);
  const [isDirty, setIsDirty] = useState(true);
  const [selectedEffectId, setSelectedEffectId] = useState("bloom");
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const backdropInputRef = useRef(null);
  const projectRef = useRef(project);
  const saveTimerRef = useRef(null);
  const presentPopupRef = useRef(null);
  const presentMountRef = useRef(null);
  const keyboardRef = useRef(null);
  const nowPlaying = useNowPlaying();
  const playback = usePlaybackState(nowPlaying);
  const visibleLayers = project.layers.filter((layer) => !layer.hidden);
  const hasLiveLyrics = visibleLayers.some((layer) => layer.type === "liveLyrics");
  const hasReactiveLayer = visibleLayers.some((layer) => (layer.audioBand || "energy") !== "off");
  const hasReactiveEffect = Object.values(normalizeEffects(project.effects)).some((effect) => effect.enabled && effect.band !== "off");
  const hasReactiveBackground = project.backgroundMode !== "black" && project.backgroundReactive !== false;
  const needsTrackAnalysis = project.reactive && (hasReactiveLayer || hasReactiveEffect || hasReactiveBackground);
  const usesCoverColours = (project.backgroundMode !== "black" && project.coverAdaptive !== false) || project.backgroundColourSource?.startsWith("cover") || project.backgroundEffectColourSource?.startsWith("cover") || visibleLayers.some((layer) => layer.colourSource?.startsWith("cover")) || Object.values(normalizeEffects(project.effects)).some((effect) => effect.colourSource?.startsWith("cover"));
  const liveLyrics = useLiveLyrics(nowPlaying, hasLiveLyrics);
  const coverPalette = useCoverPalette(usesCoverColours ? nowPlaying.art : "");
  const trackRhythm = useTrackRhythm(nowPlaying.uri, needsTrackAnalysis);
  // Audio state lives inside LiveScene so the complete editor is not rebuilt
  // for every music frame. Keep this idle shape only for non-canvas editor
  // metadata and backwards-compatible helper calculations below.
  const audioSignal = IDLE_AUDIO_SIGNAL;
  const selected = project.layers.find((layer) => layer.id === selectedId) || null;
  const selectedEffect = project.effects?.[selectedEffectId] || normalizeEffects()[selectedEffectId];

  useEffect(() => {
    projectRef.current = project;
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => persistProject(project), 260);
    return () => window.clearTimeout(saveTimerRef.current);
  }, [project]);
  useEffect(() => {
    const flushProject = () => persistProject(projectRef.current);
    window.addEventListener("pagehide", flushProject);
    return () => window.removeEventListener("pagehide", flushProject);
  }, []);
  useEffect(() => { if (showExport) setExchangeValue(JSON.stringify(project, null, 2)); }, [showExport, project]);
  useEffect(() => {
    document.body.classList.toggle("hc-cinema-active", cinema);
    return () => document.body.classList.remove("hc-cinema-active");
  }, [cinema]);
  useEffect(() => () => {
    const popup = presentPopupRef.current;
    const mount = presentMountRef.current;
    try { mount?.unmount?.(); } catch (_) { /* The secondary document may already be gone. */ }
    presentMountRef.current = null;
    if (popup && !popup.closed) {
      popup.close();
    }
  }, []);
  useEffect(() => {
    // The signal updates at most 20fps. Keeping this listener stable prevents
    // an add/remove cycle on every audio repaint while retaining fresh actions
    // through keyboardRef.
    const keydown = (event) => {
      const controls = keyboardRef.current;
      if (!controls) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") { event.preventDefault(); controls.undo(); }
      const editingText = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if (event.key === "Escape" && controls.showExport) { event.preventDefault(); controls.closeExport(); return; }
      if (event.key === "Escape" && controls.showProjects) { event.preventDefault(); controls.closeProjects(); return; }
      if (!editingText && (event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "f") { event.preventDefault(); controls.toggleFullscreen(); return; }
      if (!editingText && (event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "p") { event.preventDefault(); controls.openPresentWindow(); return; }
      if ((event.key === "Backspace" || event.key === "Delete") && controls.selectedId && !editingText) { event.preventDefault(); controls.removeLayer(controls.selectedId); }
      if (event.key === "Escape" && controls.cinema) { controls.exitCinema(); return; }
      if (event.key === "Escape" && controls.fullscreen) controls.exitFullscreen();
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  const mutate = useCallback((recipe) => {
    setIsDirty(true);
    setProject((current) => {
      setPast((stack) => [...stack.slice(-24), current]);
      setFuture([]);
      return recipe(current);
    });
  }, []);
  const patchProject = useCallback((patch) => mutate((current) => ({ ...current, ...patch })), [mutate]);
  const patchLayer = useCallback((id, patch) => mutate((current) => ({ ...current, layers: current.layers.map((layer) => layer.id === id ? { ...layer, ...patch } : layer) })), [mutate]);
  const patchEffect = (id, patch) => mutate((current) => {
    const effects = normalizeEffects(current.effects);
    return { ...current, effects: { ...effects, [id]: { ...effects[id], ...patch } } };
  });
  const toggleEffect = (id) => mutate((current) => { const effects = normalizeEffects(current.effects); return { ...current, effects: { ...effects, [id]: { ...effects[id], enabled: !effects[id].enabled } } }; });
  const undo = useCallback(() => {
    setIsDirty(true);
    setPast((stack) => {
      const previous = stack[stack.length - 1];
      if (!previous) return stack;
      setFuture((next) => [projectRef.current, ...next].slice(0, 25));
      setProject(previous);
      return stack.slice(0, -1);
    });
  }, []);
  const redo = useCallback(() => {
    setIsDirty(true);
    setFuture((stack) => {
      const next = stack[0];
      if (!next) return stack;
      setPast((previous) => [...previous, projectRef.current].slice(-25));
      setProject(next);
      return stack.slice(1);
    });
  }, []);
  const addLayer = (type) => {
    if (projectRef.current.layers.length >= MAX_LAYERS) {
      Spicetify.showNotification(`Layer limit is ${MAX_LAYERS} for smooth playback`, true);
      return;
    }
    const layer = createLayer(type, { x: 50 + Math.round((Math.random() - 0.5) * 18), y: 48 + Math.round((Math.random() - 0.5) * 14) });
    mutate((current) => ({ ...current, layers: [...current.layers, layer], stageOrder: [...normalizeStageOrder(current), stageLayerKey(layer.id)] }));
    setSelectedId(layer.id);
    setActivePanel("element");
  };
  const removeLayer = (id) => {
    const layer = projectRef.current.layers.find((item) => item.id === id);
    if (!layer) return;
    mutate((current) => ({ ...current, layers: current.layers.filter((item) => item.id !== id), stageOrder: normalizeStageOrder(current).filter((key) => key !== stageLayerKey(id)) }));
    setSelectedId(projectRef.current.layers.filter((item) => item.id !== id).slice(-1)[0]?.id || null);
  };
  const moveStageItem = (key, direction) => mutate((current) => ({ ...current, stageOrder: moveVisibleStageItem(current, key, direction) }));
  const moveLayer = (id, direction) => moveStageItem(stageLayerKey(id), direction);
  const applyPreset = (name) => {
    const preset = PRESETS[name];
    mutate((current) => ({ ...current, ...preset, backgroundEffect: preset.backgroundEffect || legacySceneEffect(preset.scene), stageOrder: [], layers: preset.layers.map((layer) => ({ ...layer, id: makeId() })) }));
    setSelectedId(null);
  };
  const duplicateLayer = (layer) => {
    const copy = { ...layer, id: makeId(), label: `${layer.label} copy`, x: clamp(layer.x + 5, 4, 96), y: clamp(layer.y + 5, 5, 95), locked: false };
    mutate((current) => ({ ...current, layers: [...current.layers, copy], stageOrder: [...normalizeStageOrder(current), stageLayerKey(copy.id)] }));
    setSelectedId(copy.id);
  };
  const centerLayer = (layer) => patchLayer(layer.id, { x: 50, y: 50 });
  const mirrorLayer = (layer) => patchLayer(layer.id, { x: clamp(100 - layer.x, 4, 96), rotation: -(layer.rotation || 0) });
  const fitLayer = (layer) => patchLayer(layer.id, { x: 50, y: 50, w: layer.type === "glow" || layer.type === "notes" ? 92 : 68 });
  const resetLayerStyle = (layer) => patchLayer(layer.id, { ...LAYER_DEFAULTS[layer.type], ...instrumentDefaults(layer.type), ...layerStyleDefaults(layer.type), detailStyle: null, label: layer.label, content: layer.content, z: 0, radius: 16, blur: 0, blend: "normal", beat: 70, speed: 60, rotation: 0, locked: false, hidden: false });
  const remixScene = () => mutate((current) => {
    const palettes = ["clay", "lagoon", "graphite", "violet", "citrus", "rose"];
    const backgrounds = BACKGROUND_EFFECTS.map(([value]) => value);
    const nextPalette = palettes[Math.floor(Math.random() * palettes.length)];
    return {
      ...current,
      palette: nextPalette,
      backgroundEffect: backgrounds[Math.floor(Math.random() * backgrounds.length)],
      texture: ["paper", "grain", "none"][Math.floor(Math.random() * 3)],
      ambient: 38 + Math.floor(Math.random() * 57),
      motion: 25 + Math.floor(Math.random() * 76),
      layers: current.layers.map((layer, index) => ({ ...layer, x: clamp(layer.x + ((index * 19) % 17) - 8, 4, 96), y: clamp(layer.y + ((index * 11) % 13) - 6, 5, 95), hue: clamp((layer.hue || 0) + ((index * 37) % 90) - 45, -180, 180) }))
    };
  });
  const toggleFullscreen = () => {
    setFullscreen((current) => !current);
  };
  const toggleCinema = () => {
    if (cinema) {
      setCinema(false);
      setPreview(false);
      return;
    }
    setPreview(true);
    setCinema(true);
    setFullscreen(true);
  };
  const onPlayerAction = useCallback((action, value) => {
    try {
      const player = Spicetify.Player;
      if (!player) throw new Error("Player unavailable");
      if (action === "play") player.togglePlay?.();
      if (action === "previous") player.back?.();
      if (action === "next") player.next?.();
      if (action === "shuffle") player.toggleShuffle?.();
      if (action === "repeat") player.toggleRepeat?.();
      if (action === "seek" && Number.isFinite(value)) player.seek?.(value);
      if (action === "volume" && Number.isFinite(value)) player.setVolume?.(clamp(value, 0, 1));
    } catch (_) { Spicetify.showNotification("Spotify playback control is not available yet", true); }
  }, []);
  const openPresentWindow = async () => {
    // The child is rendered through a React portal from the already-working
    // Spotify root.  Do not create a second React root in the new document:
    // newer Spotify builds can reject that cross-document root and silently
    // fall back to Stage fullscreen.
    if (!ReactDOM?.createPortal) {
      Spicetify.showNotification("This Spotify build cannot open a separate renderer. Opening Stage fullscreen instead.", false);
      toggleCinema();
      return;
    }
    if (presentPopupRef.current && !presentPopupRef.current.closed) { presentPopupRef.current.focus(); return; }
    const screenWidth = Number(window.screen?.availWidth || 1440);
    const screenHeight = Number(window.screen?.availHeight || 900);
    const width = Math.max(720, Math.min(1240, screenWidth - 72));
    const height = Math.max(480, Math.min(780, screenHeight - 96));
    const besideSpotify = Math.round((window.screenX || 0) + (window.outerWidth || 0) + 18);
    const left = besideSpotify + width <= screenWidth ? besideSpotify : Math.max(24, screenWidth - width - 24);
    const top = Math.max(24, Math.round(window.screenY || 54));
    // Deliberately request a normal named child window without the "popup" or
    // PiP flags. That gives macOS its real title bar and traffic-light controls:
    // drag, resize, minimize, maximize/fullscreen and close all stay native.
    // Document Picture-in-Picture is intentionally not used here: it is a compact
    // overlay, not a normal application window.
    let popup = null;
    try { popup = window.open("about:blank", "hudbacastum-present"); } catch (_) { /* Spotify may block child windows in an older shell. */ }
    if (!popup) {
      Spicetify.showNotification("This Spotify build cannot create a normal Presentation Window. Stage fullscreen has been opened instead.", true);
      toggleCinema();
      return;
    }
    // Electron honours these only when its window policy permits them. Failing
    // silently is fine—the user can still use the standard system controls.
    try { popup.resizeTo(width, height); popup.moveTo(left, top); } catch (_) { /* Native window placement is optional. */ }
    try {
      const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')].map((node) => node.outerHTML).join("");
      popup.document.open();
      popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Auraloom — Present</title>${styles}<style>html,body,#hudbacastum-present{width:100%;height:100%;min-width:0;min-height:0;margin:0;padding:0;background:#000;overflow:hidden}.hc-present-root{width:100%;height:100%;min-width:0;min-height:0;overflow:hidden}.hc-canvas{width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:100%!important;max-height:100%!important;box-sizing:border-box;aspect-ratio:auto!important;border:0!important;border-radius:0!important}.hc-canvas--detached .hc-widget{pointer-events:none}.hc-canvas--detached .hc-widget--controls,.hc-canvas--detached .hc-widget--controls *{pointer-events:auto}</style></head><body><div id="hudbacastum-present"></div></body></html>`);
      popup.document.close();
      if (!popup.document.getElementById("hudbacastum-present")) throw new Error("Presentation document did not initialise");
    } catch (_) {
      try { popup.close(); } catch (_) { /* The child may have been closed by the shell. */ }
      Spicetify.showNotification("Present window could not initialise. Stage fullscreen has been opened instead.", true);
      toggleCinema();
      return;
    }
    presentMountRef.current = null;
    presentPopupRef.current = popup;
    setPresentWindow(popup);
    popup.focus();
    Spicetify.showNotification("Presentation Window is a normal macOS window: use its traffic lights to minimize, fullscreen or close it.", false);
    popup.addEventListener("beforeunload", () => {
      const mount = presentMountRef.current;
      try { mount?.unmount?.(); } catch (_) { /* Closing a window can invalidate its DOM first. */ }
      presentMountRef.current = null;
      presentPopupRef.current = null;
      setPresentWindow(null);
    }, { once: true });
  };
  // The stable keyboard listener above reads these current values instead of
  // being recreated for every audio-signal render.
  keyboardRef.current = {
    showExport,
    showProjects,
    selectedId,
    cinema,
    fullscreen,
    undo,
    removeLayer,
    toggleFullscreen,
    openPresentWindow,
    closeExport: () => setShowExport(false),
    closeProjects: () => { setShowProjects(false); setRenameSceneId(null); setDeleteSceneId(null); },
    exitCinema: () => { setCinema(false); setPreview(false); },
    exitFullscreen: () => setFullscreen(false)
  };
  const tidyCanvas = () => mutate((current) => {
    const slots = { glow: [68, 29], notes: [50, 50], orbit: [50, 44], spectrum: [50, 71], cover: [50, 45], lyrics: [22, 76], title: [50, 89], chip: [83, 15] };
    return { ...current, layers: current.layers.map((layer, index) => ({ ...layer, x: slots[layer.type]?.[0] || 50 + ((index % 3) - 1) * 20, y: slots[layer.type]?.[1] || 38 + Math.floor(index / 3) * 20 })) };
  });
  const chooseBackdrop = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) { Spicetify.showNotification("Use an image smaller than 2.5 MB", true); return; }
    const reader = new FileReader();
    reader.onload = () => patchProject({ backgroundImage: reader.result });
    reader.readAsDataURL(file);
  };
  const applyCoverPalette = () => patchProject({ bgPrimary: coverPalette.primary, bgSecondary: coverPalette.secondary, bgTertiary: "#151515", autoPalette: false, backgroundColourSource: "manual" });
  const newBlankCanvas = () => {
    const blank = createProject();
    mutate(() => ({ ...blank, name: "Blank audio canvas" }));
    setSelectedId(null);
    setActivePanel("canvas");
  };
  const createNewScene = () => {
    const blank = createProject();
    mutate(() => ({ ...blank, name: "Untitled scene" }));
    setSelectedId(null);
    setActivePanel("canvas");
    setShowProjects(false);
  };
  const writeSceneLibrary = (items) => {
    const written = writeProjectLibrary(sortProjectLibrary(items));
    if (!written) return null;
    setSavedProjects(written);
    return written;
  };
  const saveCurrentProject = () => {
    let saved;
    try { saved = upsertProjectLibrary(savedProjects, project); }
    catch (_) { Spicetify.showNotification("This scene could not be copied for saving", true); return; }
    const written = writeSceneLibrary(saved.entries);
    if (!written) return;
    setProject(saved.project);
    setIsDirty(false);
    Spicetify.showNotification(`Saved “${saved.project.name}”`, false);
  };
  const saveAsNewScene = () => {
    const name = uniqueSceneName(`${String(project.name || "Untitled scene").trim() || "Untitled scene"} copy`, savedProjects);
    const copy = { ...project, projectId: makeId(), name };
    let saved;
    try { saved = upsertProjectLibrary(savedProjects, copy); }
    catch (_) { Spicetify.showNotification("This scene could not be duplicated", true); return; }
    const written = writeSceneLibrary(saved.entries);
    if (!written) return;
    setProject(saved.project);
    setIsDirty(false);
    setSelectedId(null);
    Spicetify.showNotification(`Created “${name}”`, false);
  };
  const loadSavedProject = (entry) => {
    const next = hydrateProject(entry.project);
    setPast((stack) => [...stack.slice(-24), projectRef.current]);
    setFuture([]);
    setProject(next);
    setIsDirty(false);
    setSelectedId(null);
    setActivePanel("canvas");
    setShowProjects(false);
    setRenameSceneId(null);
    setDeleteSceneId(null);
    Spicetify.showNotification(`Loaded “${next.name}”`, false);
  };
  const duplicateSavedScene = (entry) => {
    let copy;
    try { copy = copyProjectSnapshot(entry.project); }
    catch (_) { Spicetify.showNotification("This scene could not be duplicated", true); return; }
    copy.projectId = makeId();
    copy.name = uniqueSceneName(`${entry.name || "Untitled scene"} copy`, savedProjects);
    let saved;
    try { saved = upsertProjectLibrary(savedProjects, copy); }
    catch (_) { Spicetify.showNotification("This scene could not be duplicated", true); return; }
    const written = writeSceneLibrary(saved.entries);
    if (!written) return;
    setProject(saved.project);
    setIsDirty(false);
    setSelectedId(null);
    setActivePanel("canvas");
    setShowProjects(false);
    Spicetify.showNotification(`Created “${saved.project.name}”`, false);
  };
  const beginRenameScene = (entry) => { setRenameSceneId(entry.id); setRenameSceneDraft(entry.name || "Untitled scene"); setDeleteSceneId(null); };
  const commitRenameScene = (entry) => {
    const name = String(renameSceneDraft || "").trim() || "Untitled scene";
    const next = savedProjects.map((item) => item.id === entry.id ? { ...item, name, project: { ...item.project, name } } : item);
    const written = writeSceneLibrary(next);
    if (!written) return;
    if (entry.id === project.projectId) { setProject((current) => ({ ...current, name })); setIsDirty(false); }
    setRenameSceneId(null);
    Spicetify.showNotification(`Renamed to “${name}”`, false);
  };
  const setStartupScene = (entry) => {
    const written = writeSceneLibrary(savedProjects.map((item) => ({ ...item, isDefault: item.id === entry.id })));
    if (!written) return;
    Spicetify.showNotification(`“${entry.name}” will open when Auraloom starts`, false);
  };
  const clearStartupScene = () => {
    const written = writeSceneLibrary(savedProjects.map((item) => ({ ...item, isDefault: false })));
    if (!written) return;
    Spicetify.showNotification("Startup scene cleared", false);
  };
  const deleteSavedScene = (entry) => {
    const written = writeSceneLibrary(savedProjects.filter((item) => item.id !== entry.id));
    if (!written) return;
    if (entry.id === project.projectId) {
      setProject((current) => ({ ...current, projectId: makeId() }));
      setIsDirty(true);
    }
    setDeleteSceneId(null);
    setRenameSceneId(null);
    Spicetify.showNotification(`Deleted “${entry.name}” from the scene library`, false);
  };
  const loadProject = () => {
    try {
      if (exchangeValue.length > 3_800_000) throw new Error("project too large");
      const next = JSON.parse(exchangeValue);
      if (!next || !Array.isArray(next.layers)) throw new Error("invalid project");
      if (next.layers.length > MAX_LAYERS) throw new Error("too many layers");
      mutate(() => hydrateProject(next));
      setIsDirty(false);
      setSelectedId(null);
      setShowExport(false);
      Spicetify.showNotification("Auraloom project loaded", false);
    } catch (_) { Spicetify.showNotification("That JSON is not an Auraloom project", true); }
  };
  const onPointerDown = useCallback((event, layer, mode) => {
    if (layer.locked) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSelectedId(layer.id);
    setInteraction({ id: layer.id, mode, rect, startX: event.clientX, startY: event.clientY, layer: { ...layer }, before: projectRef.current });
  }, []);
  useEffect(() => {
    if (!interaction) return undefined;
    let animationFrame = 0;
    let latestPoint = null;
    const applyMove = () => {
      animationFrame = 0;
      if (!latestPoint) return;
      const dx = ((latestPoint.x - interaction.startX) / interaction.rect.width) * 100;
      const dy = ((latestPoint.y - interaction.startY) / interaction.rect.height) * 100;
      const bypassGuides = latestPoint.bypassGuides;
      const snap = projectRef.current.grid ? 1 : 0.1;
      const snapped = (value) => Math.round(value / snap) * snap;
      setProject((current) => {
        const magnetic = (value, axis) => {
          const clean = snapped(value);
          // Hold Option/Alt while dragging to temporarily bypass guides.
          if (current.smartSnap === false || bypassGuides) return clean;
          const canvasAnchors = axis === "x" ? [4, 50, 96] : [5, 50, 95];
          const siblingAnchors = current.layers
            .filter((layer) => layer.id !== interaction.id && !layer.hidden)
            .map((layer) => axis === "x" ? layer.x : layer.y);
          const closest = [...canvasAnchors, ...siblingAnchors].reduce((match, anchor) => {
            const distance = Math.abs(anchor - clean);
            return distance < match.distance ? { value: anchor, distance } : match;
          }, { value: clean, distance: Infinity });
          // A small, predictable magnetic field makes alignment helpful without
          // making a free placement feel like it is fighting the pointer.
          return closest.distance <= 1.25 ? closest.value : clean;
        };
        const next = interaction.mode === "resize"
          ? { ...interaction.layer, w: snapped(clamp(interaction.layer.w + dx, 10, 300)) }
          : { ...interaction.layer, x: magnetic(clamp(interaction.layer.x + dx, 4, 96), "x"), y: magnetic(clamp(interaction.layer.y + dy, 5, 95), "y") };
        const currentLayer = current.layers.find((layer) => layer.id === interaction.id);
        if (!currentLayer || (currentLayer.x === next.x && currentLayer.y === next.y && currentLayer.w === next.w)) return current;
        return { ...current, layers: current.layers.map((layer) => layer.id === interaction.id ? { ...layer, ...next } : layer) };
      });
    };
    // Pointer hardware can report well above the monitor refresh rate. Batch
    // it to one state update per painted frame so dragging stays responsive
    // without starving the live scene renderer.
    const move = (event) => {
      latestPoint = { x: event.clientX, y: event.clientY, bypassGuides: event.altKey };
      if (!animationFrame) animationFrame = window.requestAnimationFrame(applyMove);
    };
    const up = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        applyMove();
      }
      setPast((stack) => [...stack.slice(-24), interaction.before]);
      setFuture([]);
      setIsDirty(true);
      setInteraction(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => { window.cancelAnimationFrame(animationFrame); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [interaction]);
  const copyProject = async () => {
    const payload = JSON.stringify(project, null, 2);
    try { await navigator.clipboard.writeText(payload); Spicetify.showNotification("Auraloom project copied", false); }
    catch (_) { Spicetify.showNotification("Could not copy project", true); }
  };

  const backgroundSource = signalValue(audioSignal, project.backgroundAudioBand || "energy");
  const backgroundAudioLevel = project.backgroundReactive && project.backgroundMode !== "black" ? clamp(backgroundSource * (Number(project.backgroundAudioStrength ?? 58) / 100), 0, 1) : 0;
  const backgroundAudioZoom = clamp(Number(project.backgroundAudioZoom ?? 42) / 100, 0, 1);
  const backgroundAudioLight = clamp(Number(project.backgroundAudioLight ?? 54) / 100, 0, 1);
  const coverAdaptive = project.coverAdaptive !== false && project.backgroundMode !== "black" && Boolean(nowPlaying.art);
  const coverAdaptiveAmount = clamp(Number(project.coverAdaptiveAmount ?? 62) / 100, 0, 1);
  const coverAdaptivePalette = coverAdaptive && project.coverAdaptivePalette !== false;
  const coverAdaptiveEffects = coverAdaptive && project.coverAdaptiveEffectColours !== false;
  // Snapping and visible guide lines are independent. A user can keep the
  // canvas completely clean while retaining gentle magnetic alignment.
  const showCanvasGrid = project.backgroundMode !== "black" && project.showGrid === true;
  const canvasClass = `hc-canvas palette-${project.palette} texture-${project.texture} aspect-${project.aspect || "wide"} background-effect-${project.backgroundEffect || legacySceneEffect(project.scene)} ${showCanvasGrid ? "has-grid" : ""} ${project.backgroundReactive && project.backgroundMode !== "black" ? "is-background-reactive" : ""} ${coverAdaptive ? "is-cover-adaptive" : ""} ${preview ? "is-preview" : ""}`;
  const colourMotion = clamp(audioSignal.energy * .52 + audioSignal.bass * .28 + audioSignal.high * .2, 0, 1);
  // Projects made before the source picker retain their “live album colours”
  // behaviour. New projects store an explicit source, so the user's choice wins.
  const backgroundColourSource = project.backgroundColourSource || (project.autoPalette || coverAdaptivePalette ? "cover" : "manual");
  const backgroundColours = resolveColourSet({ source: backgroundColourSource, count: project.backgroundColourCount ?? 3, manual: [project.bgPrimary, project.bgSecondary, project.bgTertiary], coverPalette, audioLevel: colourMotion });
  const backgroundEffectColourSource = project.backgroundEffectColourSource || (coverAdaptiveEffects ? "cover" : "manual");
  const backgroundEffectColours = resolveColourSet({ source: backgroundEffectColourSource, count: project.backgroundEffectColourCount ?? 2, manual: [project.backgroundEffectColor || "#ff956d", project.backgroundEffectColor2 || "#82ebe0"], coverPalette, audioLevel: colourMotion });
  const [activePrimary, activeSecondary, activeTertiary] = backgroundColours;
  const [effectPrimary, effectSecondary, effectTertiary] = backgroundEffectColours;
  const adaptiveBackdrop = coverAdaptive && !["cover", "upload"].includes(project.backgroundMode) && ["ambient", "artwork"].includes(project.coverAdaptiveStyle || "ambient");
  const backdropSource = project.backgroundMode === "cover" ? nowPlaying.art : project.backgroundMode === "upload" ? project.backgroundImage : adaptiveBackdrop ? nowPlaying.art : "";
  const backdropOpacity = ["cover", "upload"].includes(project.backgroundMode) ? (project.backdropOpacity ?? 44) / 100 : project.coverAdaptiveStyle === "artwork" ? .18 + coverAdaptiveAmount * .58 : .08 + coverAdaptiveAmount * .32;
  const backdropStyle = backdropSource ? {
    backgroundImage: `url(${backdropSource})`,
    backgroundPosition: `${project.backdropX ?? 50}% ${project.backdropY ?? 50}%`,
    opacity: backdropOpacity,
    transform: `scale(${((project.backdropScale ?? 108) / 100) * (1 + backgroundAudioLevel * backgroundAudioZoom * .18)})`,
    filter: `blur(${adaptiveBackdrop ? Math.max(18, project.backdropBlur ?? 34) : project.backdropBlur ?? 34}px) saturate(${(adaptiveBackdrop ? 100 + coverAdaptiveAmount * 74 : project.backdropSaturation ?? 118)}%) brightness(${(adaptiveBackdrop ? 48 + coverAdaptiveAmount * 36 : project.backdropBrightness ?? 58) + backgroundAudioLevel * backgroundAudioLight * 42}%)`,
    mixBlendMode: adaptiveBackdrop ? project.coverAdaptiveStyle === "artwork" ? "normal" : "soft-light" : undefined,
    maskImage: adaptiveBackdrop && project.coverAdaptiveStyle === "artwork" ? "none" : undefined
  } : null;
  const focalCover = project.layers.find((layer) => layer.type === "cover" && !layer.hidden) || { x: 50, y: 45 };
  const coverAuraStyle = project.coverAuraEnabled && nowPlaying.art ? {
    backgroundImage: `url(${nowPlaying.art})`,
    backgroundPosition: `${focalCover.x ?? 50}% ${focalCover.y ?? 45}%`,
    backgroundSize: `${project.coverAuraScale ?? 72}% auto`,
    opacity: clamp((project.coverAuraOpacity ?? 58) / 100 + backgroundAudioLevel * .14, 0, 1),
    transform: `scale(${1.08 + backgroundAudioLevel * backgroundAudioZoom * .11})`,
    filter: `blur(${project.coverAuraBlur ?? 34}px) saturate(${project.coverAuraSaturation ?? 140}%) brightness(${(project.coverAuraBrightness ?? 106) + backgroundAudioLevel * backgroundAudioLight * 48}%)`,
    mixBlendMode: project.coverAuraBlend || "screen",
    "--hc-cover-aura-tint": project.coverAuraTint || "#ffffff",
    "--hc-cover-aura-x": `${focalCover.x ?? 50}%`,
    "--hc-cover-aura-y": `${focalCover.y ?? 45}%`
  } : null;
  const canvasStyle = {
    "--hc-density": project.density / 100, "--hc-motion-scale": project.motion / 100, "--hc-ambient": `${project.ambient ?? 62}px`, "--hc-vignette": (project.vignette ?? 42) / 100,
    "--hc-grid-size": project.gridSize || 9, "--hc-grid-step": `${100 / (project.gridSize || 9)}%`, "--hc-bg-primary": activePrimary, "--hc-bg-secondary": activeSecondary, "--hc-bg-tertiary": activeTertiary, "--hc-bg-effect-1": effectPrimary, "--hc-bg-effect-2": effectSecondary, "--hc-bg-effect-3": effectTertiary, "--hc-backdrop-scale": (project.backdropScale ?? 108) / 100,
    "--hc-bg-audio-level": backgroundAudioLevel.toFixed(3), "--hc-bg-audio-scale": (1 + backgroundAudioLevel * backgroundAudioZoom * .18).toFixed(3), "--hc-bg-audio-brightness": (1 + backgroundAudioLevel * backgroundAudioLight * .42).toFixed(3), "--hc-bg-audio-blur": `${Math.round(backgroundAudioLevel * backgroundAudioZoom * 7)}px`, "--hc-bg-effect-opacity": (project.backgroundReactive ? .52 + backgroundAudioLevel * .48 : 1).toFixed(3), "--hc-bg-pulse-opacity": (backgroundAudioLevel * (.06 + backgroundAudioLight * .24)).toFixed(3),
    "--hc-bg-react-turn": `${Math.round((audioSignal.impact || 0) * 38 + (audioSignal.high || 0) * 18)}deg`, "--hc-bg-react-shift-x": `${Math.round(((audioSignal.high || 0) - (audioSignal.bass || 0)) * 18)}px`, "--hc-bg-react-shift-y": `${Math.round(-backgroundAudioLevel * 24)}px`, "--hc-bg-react-position": `${Math.round(backgroundAudioLevel * 76)}px`
  };
  if (project.sceneAccent) canvasStyle["--hc-accent"] = project.sceneAccent;
  if (project.sceneSignal) canvasStyle["--hc-accent-2"] = project.sceneSignal;
  const effectStyle = (config) => {
    const source = signalValue(audioSignal, config.band || "off");
    const live = config.band === "off" ? 0 : clamp(source * (.55 + (config.sensitivity ?? 60) / 100 * 1.45), 0, 1);
    const amount = clamp(Number(config.intensity ?? 58) / 100, 0, 1);
    const colours = resolveColourSet({ source: config.colourSource || (coverAdaptiveEffects ? "cover" : "manual"), count: config.colourCount ?? 2, manual: [config.color || "#ffffff", config.color2 || "#ffffff"], coverPalette, audioLevel: live });
    return { "--hc-fx-1": colours[0], "--hc-fx-2": colours[1], "--hc-fx-3": colours[2], "--hc-fx-opacity": (.02 + amount * .4 + live * .16).toFixed(3), "--hc-fx-opacity-soft": (.015 + amount * .27 + live * .1).toFixed(3), "--hc-fx-scale-live": (1 + live * (.03 + amount * .08)).toFixed(3), "--hc-fx-brightness": (1 + live * (.16 + amount * .44)).toFixed(3), "--hc-fx-turn": `${Math.round(live * (22 + amount * 34))}deg`, "--hc-fx-shift-x": `${Math.round(live * 19)}px`, "--hc-fx-shift-y": `${Math.round(-live * 13)}px`, mixBlendMode: config.blend || "screen" };
  };
  const stageOrder = normalizeStageOrder(project);
  const stageZ = (index) => 100 + index * 100;
  const stageItemVisible = (key) => stageKeyIsVisible(project, key);
  const stageItemMeta = (key) => {
    const layerId = stageLayerId(key);
    if (layerId) {
      const layer = project.layers.find((item) => item.id === layerId);
      const block = BLOCKS.find((item) => item.type === layer?.type);
      return layer ? { kind: "layer", label: layer.label, icon: block?.icon || "◇", layer } : null;
    }
    if (key === STAGE_BACKGROUND_EFFECT) return { kind: "scene", label: "Background effects", icon: "◒" };
    if (key === STAGE_COVER_AURA) return { kind: "scene", label: "Cover aura", icon: "◌" };
    if (key === STAGE_VIGNETTE) return { kind: "scene", label: "Vignette", icon: "◍" };
    const effectId = stageEffectId(key);
    const definition = EFFECT_DECK.find(([id]) => id === effectId);
    return definition ? { kind: "effect", label: definition[2], icon: definition[1], effectId } : null;
  };
  const renderStageItem = (key, index, detached = false) => {
    const zIndex = stageZ(index);
    if (key === STAGE_BACKGROUND_EFFECT) return h("div", { key, className: "hc-scene-stage-item hc-scene-stage-item--background", style: { zIndex } },
      project.backgroundReactive && project.backgroundMode !== "black" && h("div", { className: "hc-background-pulse" }),
      project.backgroundEffect && project.backgroundEffect !== "none" && h("div", { className: `hc-background-effect hc-background-effect--${project.backgroundEffect}`, style: { opacity: canvasStyle["--hc-bg-effect-opacity"] } })
    );
    if (key === STAGE_COVER_AURA) return coverAuraStyle && h("div", { key, className: "hc-cover-aura", style: { ...coverAuraStyle, zIndex } });
    if (key === STAGE_VIGNETTE) return Number(project.vignette || 0) > 0 && h("div", { key, className: "hc-canvas-vignette", style: { zIndex } });
    const effectId = stageEffectId(key);
    if (effectId) {
      const config = project.effects?.[effectId] || normalizeEffects()[effectId];
      return config?.enabled && h("div", { key, className: `hc-fx hc-fx-${effectId} ${config.band !== "off" && signalValue(audioSignal, config.band) > .03 ? "is-audio-live" : ""}`, style: { ...effectStyle(config), zIndex } });
    }
    const layerId = stageLayerId(key);
    const layer = project.layers.find((item) => item.id === layerId);
    return layer && h(Widget, { key: layer.id, layer, stackIndex: index, selected: !detached && layer.id === selectedId, nowPlaying, playback, liveLyrics, motion: project.motion, audioSignal, coverPalette, onSelect: setSelectedId, onPointerDown, onPlayerAction, detached });
  };
  const visibleStageItems = [...stageOrder].reverse().filter(stageItemVisible).map((key) => ({ key, meta: stageItemMeta(key) })).filter((item) => item.meta);
  const visibleBlocks = BLOCKS.filter((block) => (libraryCategory === "all" || block.category === libraryCategory) && `${block.title} ${block.copy}`.toLowerCase().includes(librarySearch.toLowerCase()));
  const palettePanel = h("aside", { className: "hc-palette" },
    h("div", { className: "hc-panel-head" }, h("span", { className: "hc-eyebrow" }, "Block library"), h("b", null, "Build your scene")),
    h("p", { className: "hc-panel-copy" }, "Choose a family, then add a living block to the canvas."),
    h("div", { className: "hc-library-tabs" }, [["all", "All"], ["visuals", "Visual"], ["text", "Text"], ["shapes", "Shape"], ["effects", "FX"]].map(([value, label]) => h("button", { key: value, className: libraryCategory === value ? "is-active" : "", onClick: () => setLibraryCategory(value), type: "button" }, label))),
    h("label", { className: "hc-library-search" }, h("span", null, "⌕"), h("input", { value: librarySearch, placeholder: "Find a block", onChange: (event) => setLibrarySearch(event.target.value) })),
    h("div", { className: "hc-library-status" }, h("span", null, `${visibleBlocks.length} blocks`), h("i", null, "animated previews")),
    h("div", { className: "hc-block-list" }, visibleBlocks.map((block) => h("button", { key: block.type, className: `hc-block block-${block.type}`, onClick: () => addLayer(block.type), type: "button" },
      h("span", { className: `hc-block-icon hc-thumb-${block.type}` }, h("i"), block.icon), h("span", null, h("b", null, block.title), h("small", null, block.copy)), h("em", null, "+")))),
    !visibleBlocks.length && h("div", { className: "hc-library-empty" }, "No blocks here yet."));
  const renderCanvas = (detached = false) => h("div", {
    ref: detached ? undefined : canvasRef,
    className: `${canvasClass} background-${project.backgroundMode || "cover"} ${detached ? "hc-canvas--detached" : ""}`,
    onClick: detached ? undefined : () => setSelectedId(null),
    style: canvasStyle
  },
    h("div", { className: "hc-canvas-noise" }),
    backdropStyle && h("div", { className: `hc-cover-backdrop ${adaptiveBackdrop ? "is-cover-adaptive" : ""}`, style: backdropStyle }),
    stageOrder.map((key, index) => renderStageItem(key, index, detached))
  );
  // A portal shares Auraloom's live state with the child document, while the
  // popup keeps its native macOS title bar, resize handle and traffic lights.
  // It also avoids the blank/cropped window caused by a second React root.
  let presentationTarget = null;
  try {
    if (presentWindow && !presentWindow.closed) presentationTarget = presentWindow.document.getElementById("hudbacastum-present");
  } catch (_) { presentationTarget = null; }
  const chooseBackgroundMode = (mode) => {
    if (mode !== "black") { patchProject({ backgroundMode: mode }); return; }
    const effects = Object.fromEntries(Object.entries(normalizeEffects(projectRef.current.effects)).map(([id, config]) => [id, { ...config, enabled: false }]));
    patchProject({ backgroundMode: "black", backgroundEffect: "none", texture: "none", grid: false, showGrid: false, ambient: 0, vignette: 0, coverAuraEnabled: false, backgroundReactive: false, effects });
  };
  const canvasSettings = h("div", { className: "hc-settings-stack" },
    h("div", { className: "hc-mini-section" }, h("span", { className: "hc-section-label" }, "Canvas style"),
      h("div", { className: "hc-choice-grid" }, [
        ["clay", "Clay", "#e17c5a"], ["lagoon", "Lagoon", "#5ccdc1"], ["graphite", "Graphite", "#d7d0c0"],
        ["violet", "Violet", "#a987ff"], ["citrus", "Citrus", "#d7dc64"], ["rose", "Rose", "#f38bb0"]
      ].map(([value, label, swatch]) => h("button", { key: value, className: `hc-swatch ${project.palette === value ? "is-active" : ""}`, onClick: () => patchProject({ palette: value }), type: "button" }, h("i", { style: { background: swatch } }), label))),
      h("div", { className: "hc-segmented" }, ["paper", "grain", "none"].map((texture) => h("button", { key: texture, className: project.texture === texture ? "is-active" : "", onClick: () => patchProject({ texture }), type: "button" }, texture))),
      h("span", { className: "hc-section-label hc-subhead" }, "Background effect"),
      h("div", { className: "hc-segmented hc-scene-segmented" }, BACKGROUND_EFFECTS.map(([value, label]) => h("button", { key: value, className: project.backgroundEffect === value ? "is-active" : "", onClick: () => patchProject({ backgroundEffect: value }), type: "button" }, label))),
      h("span", { className: "hc-section-label hc-subhead" }, "Canvas format"),
      h("div", { className: "hc-segmented" }, [["wide", "Wide"], ["square", "Square"], ["portrait", "Story"]].map(([value, label]) => h("button", { key: value, className: project.aspect === value ? "is-active" : "", onClick: () => patchProject({ aspect: value }), type: "button" }, label))),
      h("span", { className: "hc-section-label hc-subhead" }, "Background effect colours"),
      h(ColourSourceControls, { source: project.backgroundEffectColourSource || (coverAdaptiveEffects ? "cover" : "manual"), count: project.backgroundEffectColourCount ?? 2, label: "Effect colour source", onSourceChange: (backgroundEffectColourSource) => patchProject({ backgroundEffectColourSource }), onCountChange: (backgroundEffectColourCount) => patchProject({ backgroundEffectColourCount }) }),
      h("div", { className: "hc-colour-pair" },
        h(ColourField, { label: "Effect 1", value: project.backgroundEffectColor || "#ff956d", onChange: (backgroundEffectColor) => patchProject({ backgroundEffectColor, backgroundEffectColourSource: "manual" }) }),
        h(ColourField, { label: "Effect 2", value: project.backgroundEffectColor2 || "#82ebe0", onChange: (backgroundEffectColor2) => patchProject({ backgroundEffectColor2, backgroundEffectColourSource: "manual" }) })
      ),
      h("button", { className: "hc-use-scene-colours", onClick: () => patchProject({ backgroundEffectColor: PALETTE_COLOURS[project.palette]?.[0] || "#f1a17c", backgroundEffectColor2: PALETTE_COLOURS[project.palette]?.[1] || "#dd5e55", backgroundEffectColourSource: "manual" }), type: "button" }, "Use palette colours")
    ),
    h("div", { className: "hc-mini-section hc-background-section" },
      h("span", { className: "hc-section-label" }, "Background Studio"),
      h("p", { className: "hc-background-copy" }, "Choose a clean base first. Artwork, colours and motion stay independent from your layers."),
      h("div", { className: "hc-background-mode-grid" }, BACKGROUND_MODES.map(([value, label]) => h("button", { key: value, className: project.backgroundMode === value ? "is-active" : "", title: value === "black" ? "Reset this scene to a genuinely pure black background with no texture, atmosphere or canvas effects." : label, onClick: () => chooseBackgroundMode(value), type: "button" }, label))),
      project.backgroundMode === "black" && h("div", { className: "hc-pure-black-note" }, h("b", null, "Pure black"), h("span", null, "No artwork, texture, atmosphere or canvas effects. Your visible layers remain unchanged.")),
      h("label", { className: "hc-switch-row", title: project.backgroundMode === "black" ? "Pure black always hides guide lines." : "Show or remove the square guide lines behind your scene." }, h("span", null, "Show background guide grid"), h("input", { type: "checkbox", checked: showCanvasGrid, disabled: project.backgroundMode === "black", onChange: (event) => patchProject({ showGrid: event.target.checked }) }), h("i")),
      project.backgroundMode !== "black" && h("div", { className: "hc-adaptive-cover-section" },
        h("span", { className: "hc-section-label hc-subhead" }, "Album adaptive background"),
        h("label", { className: "hc-switch-row" }, h("span", null, "Use cover artwork atmosphere"), h("input", { type: "checkbox", checked: project.coverAdaptive !== false, onChange: (event) => patchProject({ coverAdaptive: event.target.checked }) }), h("i")),
        h("p", { className: "hc-background-source" }, nowPlaying.art ? "The colour source above updates on every new song. This switch controls only optional cover artwork in the background." : "Start a track to derive colours and atmosphere from its album cover."),
        project.coverAdaptive !== false && h(React.Fragment, null,
          h("label", { className: "hc-select-field" }, h("span", null, "Adaptive look"), h("select", { value: project.coverAdaptiveStyle || "ambient", onChange: (event) => patchProject({ coverAdaptiveStyle: event.target.value }) }, h("option", { value: "palette" }, "Palette only"), h("option", { value: "ambient" }, "Blurred artwork atmosphere"), h("option", { value: "artwork" }, "Visible album artwork"))),
          h(Field, { label: "Cover influence", value: project.coverAdaptiveAmount ?? 62, min: 0, max: 100, unit: "%", onChange: (coverAdaptiveAmount) => patchProject({ coverAdaptiveAmount }) }),
          h("label", { className: "hc-switch-row" }, h("span", null, "Use cover colours for effects"), h("input", { type: "checkbox", checked: project.coverAdaptiveEffectColours !== false, onChange: (event) => patchProject({ coverAdaptiveEffectColours: event.target.checked }) }), h("i"))
        )
      ),
      ["solid", "gradient"].includes(project.backgroundMode) && h("div", { className: "hc-background-colours" },
        h(ColourSourceControls, { source: backgroundColourSource, count: project.backgroundColourCount ?? 3, label: "Background colour source", onSourceChange: (backgroundColourSource) => patchProject({ backgroundColourSource, autoPalette: backgroundColourSource === "cover" }), onCountChange: (backgroundColourCount) => patchProject({ backgroundColourCount }) }),
        h("div", { className: "hc-colour-pair" }, h(ColourField, { label: "Primary", value: project.bgPrimary, onChange: (bgPrimary) => patchProject({ bgPrimary, autoPalette: false, backgroundColourSource: "manual" }) }), h(ColourField, { label: "Secondary", value: project.bgSecondary, onChange: (bgSecondary) => patchProject({ bgSecondary, autoPalette: false, backgroundColourSource: "manual" }) })),
        project.backgroundMode === "gradient" && h("div", { className: "hc-colour-pair" }, h(ColourField, { label: "Third colour", value: project.bgTertiary || "#101010", onChange: (bgTertiary) => patchProject({ bgTertiary, autoPalette: false, backgroundColourSource: "manual" }) })),
        h("button", { className: "hc-cover-colour-btn", onClick: applyCoverPalette, type: "button" }, "✦ Capture current album colours")
      ),
      project.backgroundMode === "cover" && h("p", { className: "hc-background-source" }, nowPlaying.art ? "Current album art is the background. Adjust it below without affecting the cover layer." : "Play a track to use its album art as the background."),
      project.backgroundMode === "upload" && h("div", { className: "hc-backdrop-tools" },
        h("input", { ref: backdropInputRef, type: "file", accept: "image/*", onChange: chooseBackdrop }),
        h("button", { onClick: () => backdropInputRef.current?.click(), type: "button" }, project.backgroundImage ? "Replace upload" : "Upload background"),
        project.backgroundImage && h("button", { onClick: () => patchProject({ backgroundImage: "" }), type: "button" }, "Remove")
      ),
      ["cover", "upload"].includes(project.backgroundMode) && h(React.Fragment, null,
        h(Field, { label: "Artwork blur", value: project.backdropBlur, min: 0, max: 70, unit: "px", onChange: (backdropBlur) => patchProject({ backdropBlur }) }),
        h(Field, { label: "Artwork opacity", value: project.backdropOpacity, min: 0, max: 100, unit: "%", onChange: (backdropOpacity) => patchProject({ backdropOpacity }) }),
        h(Field, { label: "Artwork saturation", value: project.backdropSaturation, min: 0, max: 180, unit: "%", onChange: (backdropSaturation) => patchProject({ backdropSaturation }) }),
        h(Field, { label: "Artwork brightness", value: project.backdropBrightness, min: 20, max: 160, unit: "%", onChange: (backdropBrightness) => patchProject({ backdropBrightness }) }),
        h("div", { className: "hc-two-fields" }, h(Field, { label: "Image X", value: project.backdropX ?? 50, min: 0, max: 100, unit: "%", onChange: (backdropX) => patchProject({ backdropX }) }), h(Field, { label: "Image Y", value: project.backdropY ?? 50, min: 0, max: 100, unit: "%", onChange: (backdropY) => patchProject({ backdropY }) })),
        h(Field, { label: "Image scale", value: project.backdropScale ?? 108, min: 100, max: 180, unit: "%", onChange: (backdropScale) => patchProject({ backdropScale }) })
      ),
      project.backgroundMode !== "black" && h("div", { className: "hc-background-reactivity" },
        h("span", { className: "hc-section-label hc-subhead" }, "Background audio reaction"),
        h("label", { className: "hc-switch-row" }, h("span", null, "React background to music"), h("input", { type: "checkbox", checked: project.backgroundReactive !== false, onChange: (event) => patchProject({ backgroundReactive: event.target.checked }) }), h("i")),
        h("label", { className: "hc-select-field" }, h("span", null, "Audio source"), h("select", { value: project.backgroundAudioBand || "energy", onChange: (event) => patchProject({ backgroundAudioBand: event.target.value }) }, AUDIO_INPUTS.map(([value, label]) => h("option", { key: value, value }, label)))),
        h(Field, { label: "Reaction strength", value: project.backgroundAudioStrength ?? 58, min: 0, max: 160, unit: "%", onChange: (backgroundAudioStrength) => patchProject({ backgroundAudioStrength }) }),
        h(Field, { label: "Artwork zoom on beat", value: project.backgroundAudioZoom ?? 42, min: 0, max: 100, unit: "%", onChange: (backgroundAudioZoom) => patchProject({ backgroundAudioZoom }) }),
        h(Field, { label: "Light lift on beat", value: project.backgroundAudioLight ?? 54, min: 0, max: 100, unit: "%", onChange: (backgroundAudioLight) => patchProject({ backgroundAudioLight }) })
      ),
      h("span", { className: "hc-section-label hc-subhead" }, "Cover atmosphere"),
      h("label", { className: "hc-switch-row" }, h("span", null, "Blurred light around cover"), h("input", { type: "checkbox", checked: !!project.coverAuraEnabled, onChange: (event) => patchProject({ coverAuraEnabled: event.target.checked }) }), h("i")),
      h(Field, { label: "Aura blur", value: project.coverAuraBlur ?? 34, min: 0, max: 100, unit: "px", onChange: (coverAuraBlur) => patchProject({ coverAuraBlur }) }),
      h(Field, { label: "Aura strength", value: project.coverAuraOpacity ?? 58, min: 0, max: 100, unit: "%", onChange: (coverAuraOpacity) => patchProject({ coverAuraOpacity }) }),
      h("div", { className: "hc-two-fields" }, h(Field, { label: "Aura scale", value: project.coverAuraScale ?? 72, min: 30, max: 150, unit: "%", onChange: (coverAuraScale) => patchProject({ coverAuraScale }) }), h(Field, { label: "Aura saturation", value: project.coverAuraSaturation ?? 140, min: 0, max: 220, unit: "%", onChange: (coverAuraSaturation) => patchProject({ coverAuraSaturation }) })),
      h(Field, { label: "Aura brightness", value: project.coverAuraBrightness ?? 106, min: 20, max: 180, unit: "%", onChange: (coverAuraBrightness) => patchProject({ coverAuraBrightness }) }),
      h(ColourField, { label: "Aura tint", value: project.coverAuraTint || "#ffffff", onChange: (coverAuraTint) => patchProject({ coverAuraTint }) }),
      h("label", { className: "hc-select-field" }, h("span", null, "Aura blend"), h("select", { value: project.coverAuraBlend || "screen", onChange: (event) => patchProject({ coverAuraBlend: event.target.value }) }, ["screen", "soft-light", "overlay", "color-dodge", "normal"].map((value) => h("option", { key: value, value }, value))))
    ),
    h("div", { className: "hc-mini-section hc-reactive-section" },
      h("span", { className: "hc-section-label" }, "Track analysis"),
      h("label", { className: "hc-switch-row" }, h("span", null, "React to this track"), h("input", { type: "checkbox", checked: project.reactive, onChange: (event) => patchProject({ reactive: event.target.checked }) }), h("i")),
      h("label", { className: "hc-select-field" }, h("span", null, "Performance"), h("select", { value: project.renderQuality || "balanced", onChange: (event) => patchProject({ renderQuality: event.target.value }) }, h("option", { value: "eco" }, "Eco — lower CPU"), h("option", { value: "balanced" }, "Balanced — recommended"), h("option", { value: "high" }, "High — fastest response"))),
      h(Field, { label: "Analysis gain", value: project.audioGain ?? 100, min: 20, max: 160, unit: "%", onChange: (audioGain) => patchProject({ audioGain }) }),
      h(Field, { label: "Signal smoothing", value: project.audioSmoothing ?? 8, min: 0, max: 100, onChange: (audioSmoothing) => patchProject({ audioSmoothing }) }),
      h(Field, { label: "Timing offset", value: project.audioLeadMs ?? 0, min: -150, max: 250, unit: "ms", onChange: (audioLeadMs) => patchProject({ audioLeadMs }) }),
      h("div", { className: "hc-signal-readout" }, [["Bass", audioSignal.bass], ["Mid", audioSignal.mid], ["High", audioSignal.high], ["Drop", audioSignal.drop]].map(([label, value]) => h("span", { key: label }, h("i", { style: { width: `${Math.round(value * 100)}%` } }), h("b", null, label)))),
      h("p", { className: "hc-reactive-note" }, project.reactive ? trackRhythm.ready ? `${trackRhythm.cached ? "Offline-ready cached analysis" : "Live track analysis"}: bass, mids, highs and impact are time-aligned to ${trackRhythm.frames.length} audio segments. ${project.renderQuality === "eco" ? "Eco samples at 12fps for longer sessions." : project.renderQuality === "high" ? "High samples at up to 60fps for the quickest response." : "Balanced samples at 30fps for smooth, efficient playback."}` : "Analysis starts only when the scene contains an active reactive layer or effect. Once cached, downloaded playback keeps using this local analysis." : "Audio reactions are paused.")
    ),
    h("div", { className: "hc-mini-section hc-effects-section" },
      h("span", { className: "hc-section-label" }, "Finishing effects"),
      h("p", { className: "hc-effects-copy" }, "Every canvas effect has its own colours, audio source and amount."),
      h("div", { className: "hc-effect-deck" }, EFFECT_DECK.map(([id, icon, label, copy]) => { const config = project.effects?.[id] || normalizeEffects()[id]; return h("button", { key: id, className: `${config.enabled ? "is-active" : ""} ${selectedEffectId === id ? "is-selected" : ""}`, title: copy, onClick: () => setSelectedEffectId(id), type: "button" }, h("i", { style: { color: config.color } }, icon), h("b", null, label), h("em", { onClick: (event) => { event.stopPropagation(); toggleEffect(id); } }, config.enabled ? "●" : "○")); })),
      selectedEffect && h("div", { className: "hc-effect-inspector" },
        h("label", { className: "hc-switch-row" }, h("span", null, `Enable ${EFFECT_DECK.find(([id]) => id === selectedEffectId)?.[2] || "effect"}`), h("input", { type: "checkbox", checked: selectedEffect.enabled, onChange: (event) => patchEffect(selectedEffectId, { enabled: event.target.checked }) }), h("i")),
        h(ColourSourceControls, { source: selectedEffect.colourSource || (coverAdaptiveEffects ? "cover" : "manual"), count: selectedEffect.colourCount ?? 2, label: "Effect colour source", onSourceChange: (colourSource) => patchEffect(selectedEffectId, { colourSource }), onCountChange: (colourCount) => patchEffect(selectedEffectId, { colourCount }) }),
        h("div", { className: "hc-colour-pair" }, h(ColourField, { label: "Effect colour", value: selectedEffect.color, onChange: (color) => patchEffect(selectedEffectId, { color, colourSource: "manual" }) }), h(ColourField, { label: "Highlight", value: selectedEffect.color2, onChange: (color2) => patchEffect(selectedEffectId, { color2, colourSource: "manual" }) })),
        h("label", { className: "hc-select-field" }, h("span", null, "Audio source"), h("select", { value: selectedEffect.band, onChange: (event) => patchEffect(selectedEffectId, { band: event.target.value }) }, AUDIO_INPUTS.map(([value, label]) => h("option", { key: value, value }, label)))),
        h(Field, { label: "Effect amount", value: selectedEffect.intensity, min: 0, max: 100, onChange: (intensity) => patchEffect(selectedEffectId, { intensity }) }),
        h(Field, { label: "Sensitivity", value: selectedEffect.sensitivity, min: 0, max: 100, onChange: (sensitivity) => patchEffect(selectedEffectId, { sensitivity }) }),
        h("label", { className: "hc-select-field" }, h("span", null, "Blend"), h("select", { value: selectedEffect.blend || "screen", onChange: (event) => patchEffect(selectedEffectId, { blend: event.target.value }) }, ["screen", "soft-light", "overlay", "color-dodge", "normal"].map((value) => h("option", { key: value, value }, value))))
      )
    ),
    h("div", { className: "hc-mini-section hc-chrome-section" },
      h("span", { className: "hc-section-label" }, "Studio chrome"),
      h("div", { className: "hc-segmented" }, [["obsidian", "Obsidian"], ["carbon", "Carbon"], ["night", "Night"], ["glass", "Glass"]].map(([value, label]) => h("button", { key: value, className: project.uiTone === value ? "is-active" : "", onClick: () => patchProject({ uiTone: value }), type: "button" }, label))),
      h("div", { className: "hc-colour-pair" },
        h(ColourField, { label: "Accent", value: project.uiAccent, onChange: (uiAccent) => patchProject({ uiAccent }) }),
        h(ColourField, { label: "Signal", value: project.uiAccent2, onChange: (uiAccent2) => patchProject({ uiAccent2 }) })
      )
    ),
    h(Field, { label: "Ambient glow", value: project.ambient, min: 0, max: 100, onChange: (ambient) => patchProject({ ambient }) }),
    h(Field, { label: "Vignette", value: project.vignette, min: 0, max: 100, onChange: (vignette) => patchProject({ vignette }) }),
    h(Field, { label: "Spark density", value: project.density, min: 0, max: 100, onChange: (density) => patchProject({ density }) }),
    h(Field, { label: "Motion", value: project.motion, min: 0, max: 100, onChange: (motion) => patchProject({ motion }) }),
    h("div", { className: "hc-mini-section hc-alignment-section" },
      h("span", { className: "hc-section-label" }, "Alignment"),
      h("p", { className: "hc-reactive-note" }, "Soft guides help elements line up. Hold Option/Alt while dragging for free placement."),
      h(Field, { label: "Guide density", value: project.gridSize, min: 4, max: 16, onChange: (gridSize) => patchProject({ gridSize }) }),
      h("label", { className: "hc-switch-row" }, h("span", null, "Snap to grid"), h("input", { type: "checkbox", checked: project.grid, onChange: (event) => patchProject({ grid: event.target.checked }) }), h("i")),
      h("label", { className: "hc-switch-row" }, h("span", null, "Magnetic alignment"), h("input", { type: "checkbox", checked: project.smartSnap !== false, onChange: (event) => patchProject({ smartSnap: event.target.checked }) }), h("i"))
    ),
    h("div", { className: "hc-canvas-tools" },
      h("button", { className: "hc-tidy-btn", onClick: tidyCanvas, type: "button" }, "✦ Smart layout"),
      h("button", { className: "hc-remix-btn", onClick: remixScene, type: "button" }, "⟳ Colour shuffle"),
      h("button", { className: "hc-new-canvas-btn", onClick: newBlankCanvas, type: "button" }, "＋ Blank canvas")
    )
  );
  const playbackOptions = [["showCover", "Album cover"], ["showTrack", "Track name"], ["showProgress", "Seek bar"], ["showTime", "Time"], ["showRemaining", "Remaining time"], ["showShuffle", "Shuffle"], ["showPrevious", "Previous"], ["showPlay", "Play / pause"], ["showNext", "Next"], ["showRepeat", "Repeat"], ["showVolume", "Volume"]];
  const patchPlaybackConfig = (patch) => patchLayer(selected.id, { controls: { ...LAYER_DEFAULTS.controls.controls, ...(selected.controls || {}), ...patch } });
  const patchPlaybackOption = (key, checked) => patchPlaybackConfig({ [key]: checked });
  const liveLyricToggleOptions = [["pureText", "Pure text — no panel"], ["wordHighlight", "Word-by-word highlight"], ["showTrack", "Track label"], ["showPrevious", "Previous line"], ["showNext", "Next line"], ["showProgress", "Line progress"]];
  const patchLiveLyrics = (patch) => patchLayer(selected.id, { lyrics: { ...LAYER_DEFAULTS.liveLyrics.lyrics, ...(selected.lyrics || {}), ...patch } });
  // Keep inspector rows as an explicit array before mounting them. Apart from
  // being easier to audit, this prevents Spotify's embedded React renderer
  // from dropping sibling controls after the layer-name input.
  const selectedElementControls = selected ? [
    h("div", { className: "hc-selected-name" }, h("span", { className: `hc-layer-type type-${selected.type}` }, BLOCKS.find((block) => block.type === selected.type)?.icon), h("div", null, h("b", null, selected.label), h("small", null, "Selected layer"))),
    h("label", { className: "hc-text-field" }, h("span", null, "Layer name"), h("input", { value: selected.label, onChange: (event) => patchLayer(selected.id, { label: event.target.value }) })),
    selected.type === "cover" && h(CoverTuning, { layer: selected, onPatch: (patch) => patchLayer(selected.id, patch) }),
    h(Field, { label: "Size", value: Math.round(selected.w), min: 10, max: 300, unit: "%", onChange: (w) => patchLayer(selected.id, { w }) }),
    h(Field, { label: "Opacity", value: Math.round(selected.opacity), min: 0, max: 100, unit: "%", onChange: (opacity) => patchLayer(selected.id, { opacity }) }),
    h("div", { className: "hc-layer-colour-lab" },
      h("span", { className: "hc-section-label" }, "Colour lab"),
      h("p", null, "Every selected block carries its own palette. Choose a source first, then fine-tune only when you need manual colour."),
      h(ColourSourceControls, { source: selected.colourSource || "manual", count: selected.colourCount ?? 2, label: "Layer colour source", onSourceChange: (colourSource) => patchLayer(selected.id, { colourSource }), onCountChange: (colourCount) => patchLayer(selected.id, { colourCount }) }),
      h("div", { className: "hc-layer-colours" },
        h(ColourField, { label: "Key", value: layerColour(selected, project, "colorPrimary", 0), onChange: (colorPrimary) => patchLayer(selected.id, { colorPrimary, colourSource: "manual" }) }),
        h(ColourField, { label: "Accent", value: layerColour(selected, project, "colorSecondary", 1), onChange: (colorSecondary) => patchLayer(selected.id, { colorSecondary, colourSource: "manual" }) }),
        h(ColourField, { label: "Ink", value: selected.colorInk || "#fff8ef", onChange: (colorInk) => patchLayer(selected.id, { colorInk, colourSource: "manual" }) }),
        h(ColourField, { label: "Edge", value: selected.colorBorder || "#ffffff", onChange: (colorBorder) => patchLayer(selected.id, { colorBorder, colourSource: "manual" }) }),
        h(ColourField, { label: "Surface", value: selected.colorSurface || "#191618", onChange: (colorSurface) => patchLayer(selected.id, { colorSurface, colourSource: "manual" }) })
      ),
      h("button", { className: "hc-use-scene-colours", onClick: () => patchLayer(selected.id, { colorPrimary: null, colorSecondary: null, colorInk: null, colorBorder: null, colorSurface: null, colourSource: "manual" }), type: "button" }, "Use scene colours")
    ),
    selected.type === "controls" && h("div", { className: "hc-layer-audio-lab hc-controls-editor" },
      h("span", { className: "hc-section-label" }, "Playback bar contents"),
      h("p", null, "Choose exactly what this independent player bar contains."),
      h("label", { className: "hc-select-field" }, h("span", null, "Progress design"), h("select", { value: ({ ...LAYER_DEFAULTS.controls.controls, ...(selected.controls || {}) }).progressStyle || "line", onChange: (event) => patchPlaybackConfig({ progressStyle: event.target.value }) }, [["line", "Line — clear position"], ["segments", "Segments — chapter style"], ["waveform", "Waveform — music level"]].map(([value, label]) => h("option", { key: value, value }, label)))),
      h("div", { className: "hc-control-toggle-grid" }, playbackOptions.map(([key, label]) => h("label", { key, className: "hc-switch-row" }, h("span", null, label), h("input", { type: "checkbox", checked: { ...LAYER_DEFAULTS.controls.controls, ...(selected.controls || {}) }[key], onChange: (event) => patchPlaybackOption(key, event.target.checked) }), h("i"))))
    ),
    selected.type === "lyrics" && h("div", { className: "hc-layer-audio-lab hc-lyric-card-editor" },
      h("span", { className: "hc-section-label" }, "Lyric card appearance"),
      h("p", null, "Set the text and its protective panel separately, so lyrics remain readable over any artwork."),
      h(ColourField, { label: "Text colour", value: selected.colorInk || "#fff8ef", onChange: (colorInk) => patchLayer(selected.id, { colorInk, colourSource: "manual" }) }),
      h(Field, { label: "Text opacity", value: Math.round(selected.textOpacity ?? LAYER_DEFAULTS.lyrics.textOpacity ?? 100), min: 0, max: 100, unit: "%", onChange: (textOpacity) => patchLayer(selected.id, { textOpacity }) }),
      h(Field, { label: "Background opacity", value: Math.round(selected.textPanelOpacity ?? LAYER_DEFAULTS.lyrics.textPanelOpacity ?? 68), min: 0, max: 100, unit: "%", onChange: (textPanelOpacity) => patchLayer(selected.id, { textPanelOpacity }) }),
      h(ColourField, { label: "Background colour", value: selected.textPanelColor || selected.colorSurface || LAYER_DEFAULTS.lyrics.textPanelColor || "#191618", onChange: (textPanelColor) => patchLayer(selected.id, { textPanelColor }) })
    ),
    selected.type === "liveLyrics" && h("div", { className: "hc-layer-audio-lab hc-live-lyrics-editor" },
      h("span", { className: "hc-section-label" }, "Adaptive lyrics studio"),
      h("p", null, liveLyrics.status === "ready" ? `${liveLyrics.lines.length} ${liveLyrics.wordTimed ? "word-timed" : liveLyrics.timed === false ? "static" : "line-timed"} lines are ready from ${liveLyrics.provider || "the lyric provider"}. Auto chooses the richest format available.` : liveLyrics.status === "loading" ? "Trying Spotify, NetEase word sync, then LRCLIB…" : "No provider returned lyrics for this track. Your optional fallback line will be shown instead."),
      h("p", null, "Beat emphasis uses this layer's Audio mapping below — choose impact, bass, mids, highs or drop."),
      h("span", { className: "hc-section-label hc-subhead" }, "View"),
      h("div", { className: "hc-segmented hc-live-lyrics-segmented" }, [["auto", "Auto"], ["stack", "Stack"], ["focus", "Focus"], ["karaoke", "Karaoke"], ["cinema", "Cinema"]].map(([value, label]) => h("button", { key: value, className: ({ ...LAYER_DEFAULTS.liveLyrics.lyrics, ...(selected.lyrics || {}) }).layout === value ? "is-active" : "", title: value === "auto" ? "Automatically chooses word karaoke, synced focus or a readable text stack." : label, onClick: () => patchLiveLyrics({ layout: value }), type: "button" }, label))),
      h("span", { className: "hc-section-label hc-subhead" }, "Alignment"),
      h("div", { className: "hc-segmented" }, [["left", "Left"], ["center", "Centre"], ["right", "Right"]].map(([value, label]) => h("button", { key: value, className: ({ ...LAYER_DEFAULTS.liveLyrics.lyrics, ...(selected.lyrics || {}) }).align === value ? "is-active" : "", onClick: () => patchLiveLyrics({ align: value }), type: "button" }, label))),
      h("div", { className: "hc-control-toggle-grid" }, liveLyricToggleOptions.map(([key, label]) => h("label", { key, className: "hc-switch-row" }, h("span", null, label), h("input", { type: "checkbox", checked: ({ ...LAYER_DEFAULTS.liveLyrics.lyrics, ...(selected.lyrics || {}) })[key], onChange: (event) => patchLiveLyrics({ [key]: event.target.checked }) }), h("i")))),
      h(Field, { label: "Active text", value: Math.round(selected.lyrics?.textSize ?? LAYER_DEFAULTS.liveLyrics.lyrics.textSize), min: 18, max: 96, unit: "px", onChange: (textSize) => patchLiveLyrics({ textSize }) }),
      h(Field, { label: "Context text", value: Math.round(selected.lyrics?.contextSize ?? LAYER_DEFAULTS.liveLyrics.lyrics.contextSize), min: 9, max: 54, unit: "px", onChange: (contextSize) => patchLiveLyrics({ contextSize }) }),
      h(ColourField, { label: "Text colour", value: selected.colorInk || "#fff8ef", onChange: (colorInk) => patchLayer(selected.id, { colorInk, colourSource: "manual" }) }),
      h(Field, { label: "Active text opacity", value: Math.round(selected.lyrics?.activeOpacity ?? LAYER_DEFAULTS.liveLyrics.lyrics.activeOpacity ?? 100), min: 0, max: 100, unit: "%", onChange: (activeOpacity) => patchLiveLyrics({ activeOpacity }) }),
      h(Field, { label: "Inactive opacity", value: Math.round(selected.lyrics?.inactiveOpacity ?? LAYER_DEFAULTS.liveLyrics.lyrics.inactiveOpacity), min: 8, max: 90, unit: "%", onChange: (inactiveOpacity) => patchLiveLyrics({ inactiveOpacity }) }),
      h(Field, { label: "Beat emphasis", value: Math.round(selected.lyrics?.activeScale ?? LAYER_DEFAULTS.liveLyrics.lyrics.activeScale), min: 0, max: 40, unit: "%", onChange: (activeScale) => patchLiveLyrics({ activeScale }) }),
      h(Field, { label: "Word trail", value: Math.round(selected.lyrics?.wordTrail ?? LAYER_DEFAULTS.liveLyrics.lyrics.wordTrail), min: 12, max: 95, unit: "%", onChange: (wordTrail) => patchLiveLyrics({ wordTrail }) }),
      h(Field, { label: "Panel strength", value: Math.round(selected.lyrics?.panelOpacity ?? LAYER_DEFAULTS.liveLyrics.lyrics.panelOpacity), min: 18, max: 100, unit: "%", onChange: (panelOpacity) => patchLiveLyrics({ panelOpacity }) }),
      h(ColourField, { label: "Panel colour", value: selected.lyrics?.panelColor || selected.colorSurface || LAYER_DEFAULTS.liveLyrics.lyrics.panelColor || "#07080b", onChange: (panelColor) => patchLiveLyrics({ panelColor }) }),
      h(Field, { label: "Line spacing", value: Math.round(selected.lyrics?.lineGap ?? LAYER_DEFAULTS.liveLyrics.lyrics.lineGap), min: 0, max: 42, unit: "px", onChange: (lineGap) => patchLiveLyrics({ lineGap }) })
    ),
    h(InstrumentTuning, { layer: selected, onPatch: (patch) => patchLayer(selected.id, patch) }),
    h(Field, { label: "Colour shift", value: Math.round(selected.hue || 0), min: -180, max: 180, unit: "°", onChange: (hue) => patchLayer(selected.id, { hue }) }),
    h(Field, { label: "Rotation", value: Math.round(selected.rotation || 0), min: -180, max: 180, unit: "°", onChange: (rotation) => patchLayer(selected.id, { rotation }) }),
    h("div", { className: "hc-two-fields" },
      h(Field, { label: "X", value: Math.round(selected.x), min: 4, max: 96, unit: "%", onChange: (x) => patchLayer(selected.id, { x }) }),
      h(Field, { label: "Y", value: Math.round(selected.y), min: 5, max: 95, unit: "%", onChange: (y) => patchLayer(selected.id, { y }) })
    ),
    h("div", { className: "hc-quick-align" },
      h("span", { className: "hc-section-label" }, "Quick align"),
      h("div", { className: "hc-quick-align-grid" },
        [["Left", () => patchLayer(selected.id, { x: 4 })], ["Centre", () => patchLayer(selected.id, { x: 50 })], ["Right", () => patchLayer(selected.id, { x: 96 })], ["Top", () => patchLayer(selected.id, { y: 5 })], ["Middle", () => patchLayer(selected.id, { y: 50 })], ["Bottom", () => patchLayer(selected.id, { y: 95 })]].map(([label, onClick]) => h("button", { key: label, onClick, type: "button" }, label))
      )
    ),
    h(Field, { label: "Fine depth", value: Math.round(selected.z || 0), min: -45, max: 45, onChange: (z) => patchLayer(selected.id, { z }) }),
    h(Field, { label: "Corner radius", value: Math.round(selected.radius ?? 16), min: 0, max: 50, unit: "px", onChange: (radius) => patchLayer(selected.id, { radius }) }),
    h(Field, { label: "Element blur", value: Math.round(selected.blur || 0), min: 0, max: 14, unit: "px", onChange: (blur) => patchLayer(selected.id, { blur }) }),
    h(Field, { label: "Backdrop blur", value: Math.round(selected.backdropBlur || 0), min: 0, max: 42, unit: "px", onChange: (backdropBlur) => patchLayer(selected.id, { backdropBlur }) }),
    h(Field, { label: "Ambient blend", value: Math.round(selected.backdropBleed || 0), min: 0, max: 64, unit: "px", onChange: (backdropBleed) => patchLayer(selected.id, { backdropBleed }) }),
    h("div", { className: "hc-layer-audio-lab hc-element-aura-editor" },
      h("span", { className: "hc-section-label" }, "Element aura"),
      h("p", null, "A soft colour falloff around this complete block. It is separate from backdrop blur and can follow live audio movement."),
      h("label", { className: "hc-switch-row" }, h("span", null, "Enable surrounding glow"), h("input", { type: "checkbox", checked: !!selected.auraEnabled, onChange: (event) => patchLayer(selected.id, { auraEnabled: event.target.checked }) }), h("i")),
      selected.auraEnabled && h("div", { className: "hc-element-aura-controls" },
        h("span", { className: "hc-section-label hc-subhead" }, "Aura colour source"),
        h("div", { className: "hc-segmented" }, [["layer", "Follow layer colour"], ["manual", "Custom colour"]].map(([value, label]) => h("button", { key: value, className: (selected.auraColourSource || "layer") === value ? "is-active" : "", title: value === "layer" ? "Uses this element's Key colour, including artwork and RGB colour modes." : "Uses a fixed colour only for this aura.", onClick: () => patchLayer(selected.id, { auraColourSource: value }), type: "button" }, label))),
        (selected.auraColourSource || "layer") === "layer" ? h("p", { className: "hc-reactive-note" }, "Following this block's Key colour. It will update whenever the block follows album artwork or a music-reactive palette.") : h(ColourField, { label: "Aura colour", value: selected.auraColor || layerColour(selected, project, "colorPrimary", 0), onChange: (auraColor) => patchLayer(selected.id, { auraColor, auraColourSource: "manual" }) }),
        h(Field, { label: "Glow reach", value: Math.round(selected.auraSize ?? 42), min: 0, max: 260, unit: "px", onChange: (auraSize) => patchLayer(selected.id, { auraSize }) }),
        h(Field, { label: "Glow strength", value: Math.round(selected.auraStrength ?? 46), min: 0, max: 100, unit: "%", onChange: (auraStrength) => patchLayer(selected.id, { auraStrength }) }),
        h(Field, { label: "Fade softness", value: Math.round(selected.auraBlur ?? 24), min: 0, max: 160, unit: "px", onChange: (auraBlur) => patchLayer(selected.id, { auraBlur }) }),
        h("label", { className: "hc-switch-row" }, h("span", null, "Follow audio movement"), h("input", { type: "checkbox", checked: selected.auraFollowMotion !== false, onChange: (event) => patchLayer(selected.id, { auraFollowMotion: event.target.checked }) }), h("i")),
        h("label", { className: "hc-select-field" }, h("span", null, "Aura blend"), h("select", { value: selected.auraBlend || "screen", onChange: (event) => patchLayer(selected.id, { auraBlend: event.target.value }) }, [["screen", "Screen — luminous"], ["soft-light", "Soft light — subtle"], ["overlay", "Overlay — vivid"], ["color-dodge", "Color dodge — intense"], ["normal", "Normal"]].map(([value, label]) => h("option", { key: value, value }, label))))
      )
    ),
    h("div", { className: "hc-layer-audio-lab" },
      h("span", { className: "hc-section-label" }, "Audio mapping"),
      h("p", null, "This layer listens to a real feature of the playing track, not a generic BPM clock."),
      h("label", { className: "hc-select-field" }, h("span", null, "Audio source"), h("select", { value: selected.audioBand || "energy", onChange: (event) => patchLayer(selected.id, { audioBand: event.target.value }) }, AUDIO_INPUTS.map(([value, label]) => h("option", { key: value, value }, label)))),
      h(Field, { label: "Audio strength", value: Math.round(selected.audioStrength ?? 70), min: 0, max: 100, onChange: (audioStrength) => patchLayer(selected.id, { audioStrength }) }),
      h(Field, { label: "Sensitivity", value: Math.round(selected.audioSensitivity ?? 48), min: 0, max: 100, onChange: (audioSensitivity) => patchLayer(selected.id, { audioSensitivity }) }),
      h(Field, { label: "Audio gate", value: Math.round(selected.audioGate ?? 8), min: 0, max: 80, onChange: (audioGate) => patchLayer(selected.id, { audioGate }) }),
      h(Field, { label: "Response smoothing", value: Math.round(selected.audioSmoothing ?? 0), min: 0, max: 250, unit: "ms", onChange: (audioSmoothing) => patchLayer(selected.id, { audioSmoothing }) })
    ),
    h(Field, { label: "Motion speed", value: Math.round(selected.speed ?? 60), min: 0, max: 100, onChange: (speed) => patchLayer(selected.id, { speed }) }),
    h("label", { className: "hc-select-field" }, h("span", null, "Blend mode"), h("select", { value: selected.blend || "normal", onChange: (event) => patchLayer(selected.id, { blend: event.target.value }) },
      [["normal", "Normal"], ["screen", "Screen"], ["overlay", "Overlay"], ["soft-light", "Soft light"], ["multiply", "Multiply"]].map(([value, label]) => h("option", { key: value, value }, label))
    )),
    ["lyrics", "liveLyrics", "poster", "title", "chip"].includes(selected.type) && h("label", { className: "hc-text-field hc-content-field" }, h("span", null, selected.type === "liveLyrics" ? "Fallback line (only if timed lyrics are unavailable)" : "Your content"), h("textarea", { value: selected.content || "", placeholder: selected.type === "liveLyrics" ? "Optional line to show when Spotify has no timed lyrics…" : "Write anything you want…", onChange: (event) => patchLayer(selected.id, { content: event.target.value }) })),
    h("div", { className: "hc-transform-row" },
      h("button", { onClick: () => centerLayer(selected), type: "button" }, "Center"),
      h("button", { onClick: () => mirrorLayer(selected), type: "button" }, "Mirror"),
      h("button", { onClick: () => fitLayer(selected), type: "button" }, "Fit canvas"),
      h("button", { onClick: () => resetLayerStyle(selected), type: "button" }, "Reset style")
    ),
    h("div", { className: "hc-element-actions" },
      h("button", { onClick: () => patchLayer(selected.id, { locked: !selected.locked }), type: "button" }, selected.locked ? "Unlock" : "Lock"),
      h("button", { onClick: () => patchLayer(selected.id, { hidden: !selected.hidden }), type: "button" }, selected.hidden ? "Show" : "Hide"),
      h("button", { onClick: () => duplicateLayer(selected), type: "button" }, "Duplicate"),
      h("button", { className: "is-danger", onClick: () => removeLayer(selected.id), type: "button" }, "Delete")
    )
  ] : [];
  const elementSettings = selected ? h("div", { className: "hc-settings-stack" }, ...selectedElementControls) : h("div", { className: "hc-empty-inspector" }, h("span", null, "⌁"), h("b", null, "Pick a layer"), h("p", null, "Click a block on the canvas to change every detail."));
  const inspector = h("aside", { className: `hc-inspector ${selected ? "has-selection" : ""}` },
    h("div", { className: "hc-inspector-tabs" },
      h("button", { className: activePanel === "canvas" ? "is-active" : "", onClick: () => setActivePanel("canvas"), type: "button" }, "Canvas"),
      h("button", { className: activePanel === "element" ? "is-active" : "", onClick: () => setActivePanel("element"), type: "button" }, "Element")
    ), activePanel === "canvas" ? canvasSettings : elementSettings,
    h("div", { className: "hc-layer-stack" }, h("span", { className: "hc-section-label" }, "Scene stack"),
      h("p", { className: "hc-scene-stack-note" }, "Arrows move the complete item — block, aura or canvas effect — as one composited layer."),
      visibleStageItems.map(({ key, meta }) => {
        const isLayer = meta.kind === "layer";
        const label = meta.kind === "effect" ? `FX · ${meta.label}` : meta.kind === "scene" ? `Scene · ${meta.label}` : meta.label;
        return h("div", { key, className: `hc-layer-row ${meta.kind === "scene" ? "hc-scene-layer" : ""} ${isLayer && meta.layer.id === selectedId ? "is-active" : ""}`, title: isLayer ? "Editable block" : "Canvas-wide effect — click to edit it in Canvas", onClick: () => {
          if (isLayer) { setSelectedId(meta.layer.id); setActivePanel("element"); }
          else { setSelectedId(null); if (meta.effectId) setSelectedEffectId(meta.effectId); setActivePanel("canvas"); }
        } },
          h("span", { className: `hc-layer-type ${isLayer ? `type-${meta.layer.type}` : "type-scene"}` }, meta.icon), h("b", null, label),
          h("button", { title: "Send complete item backward", onClick: (event) => { event.stopPropagation(); moveStageItem(key, -1); }, type: "button" }, "↓"),
          h("button", { title: "Bring complete item forward", onClick: (event) => { event.stopPropagation(); moveStageItem(key, 1); }, type: "button" }, "↑")
        );
      })
    )
  );

  const sceneLibraryMenu = showProjects && h("section", { className: "hc-project-library-menu", role: "dialog", "aria-label": "Scene library" },
    h("header", { className: "hc-project-library-head" },
      h("div", null, h("span", { className: "hc-section-label" }, "Scene library"), h("b", null, `${savedProjects.length} saved ${savedProjects.length === 1 ? "scene" : "scenes"}`)),
      h("button", { className: "hc-project-menu-close", title: "Close scene library", onClick: () => { setShowProjects(false); setRenameSceneId(null); setDeleteSceneId(null); }, type: "button" }, "×")
    ),
    h("p", { className: "hc-project-library-copy" }, "Your active draft is autosaved locally. Save adds it to this library so you can return, duplicate or export it safely."),
    h("div", { className: "hc-project-library-actions" },
      h("button", { className: "hc-save-project", onClick: saveCurrentProject, type: "button" }, isDirty ? "Save current scene" : "Update saved scene"),
      h("button", { className: "hc-project-menu-secondary", onClick: saveAsNewScene, type: "button" }, "Save as new"),
      h("button", { className: "hc-project-menu-secondary", onClick: createNewScene, type: "button" }, "+ New blank"),
      savedProjects.some((entry) => entry.isDefault) && h("button", { className: "hc-project-menu-quiet", onClick: clearStartupScene, type: "button" }, "Clear startup")
    ),
    h("div", { className: "hc-project-library-list" }, savedProjects.length ? savedProjects.map((entry) => {
      const isActive = entry.id === project.projectId;
      const isRenaming = renameSceneId === entry.id;
      const isDeleting = deleteSceneId === entry.id;
      const layerCount = Array.isArray(entry.project?.layers) ? entry.project.layers.length : 0;
      const savedLabel = entry.savedAt ? new Date(entry.savedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Saved scene";
      const sceneCardContent = [
        h("span", { key: "icon", className: "hc-scene-card-icon" }, "◇"),
        h("span", { key: "copy", className: "hc-scene-card-copy" },
          isRenaming ? h("input", { value: renameSceneDraft, autoFocus: true, "aria-label": "Scene name", onChange: (event) => setRenameSceneDraft(event.target.value), onKeyDown: (event) => { if (event.key === "Enter") { event.preventDefault(); commitRenameScene(entry); } if (event.key === "Escape") { event.preventDefault(); setRenameSceneId(null); } } }) : h("b", null, entry.name),
          h("small", null, `${layerCount} ${layerCount === 1 ? "layer" : "layers"} · ${savedLabel}`)
        ),
        h("span", { key: "tags", className: "hc-scene-card-tags" }, isActive && h("em", null, "OPEN"), entry.isDefault && h("em", { className: "is-startup" }, "STARTUP"))
      ];
      const sceneCardMain = isRenaming ? h("div", { className: "hc-scene-card-main is-renaming" }, ...sceneCardContent) : h("button", { className: "hc-scene-card-main", title: `Open ${entry.name}`, onClick: () => loadSavedProject(entry), type: "button" }, ...sceneCardContent);
      return h("article", { key: entry.id, className: `hc-scene-card ${isActive ? "is-active" : ""}` },
        sceneCardMain,
        h("div", { className: "hc-scene-card-actions" },
          isRenaming ? h("button", { className: "is-affirm", title: "Save new name", onClick: () => commitRenameScene(entry), type: "button" }, "Save") : h("button", { title: "Rename scene", onClick: () => beginRenameScene(entry), type: "button" }, "Rename"),
          h("button", { title: "Duplicate scene", onClick: () => duplicateSavedScene(entry), type: "button" }, "Duplicate"),
          h("button", { className: entry.isDefault ? "is-startup" : "", title: entry.isDefault ? "This scene opens when Auraloom starts" : "Open this scene when Auraloom starts", onClick: () => setStartupScene(entry), type: "button" }, entry.isDefault ? "Startup" : "Set startup"),
          isDeleting ? h("span", { className: "hc-scene-delete-confirm" }, h("button", { className: "is-danger", onClick: () => deleteSavedScene(entry), type: "button" }, "Delete forever"), h("button", { onClick: () => setDeleteSceneId(null), type: "button" }, "Cancel")) : h("button", { className: "is-danger", title: "Delete from scene library", onClick: () => { setDeleteSceneId(entry.id); setRenameSceneId(null); }, type: "button" }, "Delete")
        )
      );
    }) : h("div", { className: "hc-project-library-empty" }, h("b", null, "No saved scenes yet"), h("p", null, "Build anything, then choose Save current scene. Your working draft still saves automatically on this device.")))
  );

  const editor = h("main", { ref: appRef, className: `hc-app tone-${project.uiTone || "obsidian"} ${preview ? "hc-app--preview" : ""} ${fullscreen ? "hc-app--fullscreen" : ""} ${cinema ? "hc-app--cinema" : ""}`, style: { "--hc-accent": project.uiAccent || "#f2f4f7", "--hc-accent-2": project.uiAccent2 || "#8993a0" } },
      h("header", { className: "hc-topbar" },
        h("div", { className: "hc-leading-rail" },
          h("button", { className: `hc-fullscreen-btn hc-fullscreen-btn--leading ${fullscreen ? "is-active" : ""}`, title: "Fullscreen editor (Ctrl/Cmd + Shift + F)", onClick: toggleFullscreen, type: "button" }, fullscreen ? "Exit editor" : "Fullscreen editor"),
          h("div", { className: "hc-brand" }, h("div", { className: "hc-logo" }, h(AuraloomMark)), h("div", null, h("b", null, "Auraloom"), h("small", null, "Visual scene studio")))
        ),
        h("div", { className: "hc-project-rail", "aria-label": "Scene library" },
          h("label", { className: "hc-project-name" }, h("span", null, "Scene"), h("input", { value: project.name, onChange: (event) => patchProject({ name: event.target.value }) })),
          h("button", { className: "hc-save-project", title: "Save current scene to your library", onClick: saveCurrentProject, type: "button" }, isDirty ? "Save" : "Saved"),
          h("span", { className: `hc-save-state ${isDirty ? "is-dirty" : "is-saved"}`, title: isDirty ? "This draft is saved locally but not yet updated in the scene library" : "This version is saved in the scene library" }, isDirty ? "Draft autosaved" : "Library saved"),
          h("div", { className: "hc-project-menu-wrap" },
            h("button", { className: `hc-project-menu-trigger ${showProjects ? "is-open" : ""}`, title: "Open scene library", onClick: () => { setShowProjects((open) => !open); setRenameSceneId(null); setDeleteSceneId(null); }, type: "button" }, `Scenes · ${savedProjects.length}`, h("span", null, "⌄")),
            sceneLibraryMenu
          ),
          h("button", { className: "hc-new-project", title: "Start a new empty scene", onClick: createNewScene, type: "button" }, "+ New")
        ),
        h("div", { className: "hc-top-actions" },
          h(Icon, { title: "Undo", disabled: !past.length, onClick: undo }, "↶"), h(Icon, { title: "Redo", disabled: !future.length, onClick: redo }, "↷"),
          h("div", { className: "hc-zoom" }, h("button", { onClick: () => patchProject({ zoom: clamp(project.zoom - 10, 70, 120) }), type: "button" }, "−"), h("b", null, `${project.zoom}%`), h("button", { onClick: () => patchProject({ zoom: clamp(project.zoom + 10, 70, 120) }), type: "button" }, "+")),
          h("button", { className: "hc-project-io", title: "Copy a project backup or import one", onClick: () => setShowExport(true), type: "button" }, "Project I/O"),
          h("button", { className: "hc-present-window", title: "Open a movable, resizable scene window (Ctrl/Cmd + Shift + P)", onClick: openPresentWindow, type: "button" }, "Present window"),
          h("button", { className: `hc-cinema-btn ${cinema ? "is-active" : ""}`, title: "Only your scene in fullscreen", onClick: toggleCinema, type: "button" }, cinema ? "Exit stage" : "Stage fullscreen")
        )
      ),
      h("section", { className: "hc-workspace" }, palettePanel,
        h("section", { className: "hc-stage-wrap" },
          h("div", { className: "hc-stage-meta" }, h("span", null, "LIVE CANVAS"), h("b", null, nowPlaying.playing ? `● ${trackRhythm.ready ? trackRhythm.cached ? "CACHED TRACK ANALYSIS" : "LIVE TRACK ANALYSIS" : "ANALYZING TRACK"} · ${project.renderQuality === "high" ? "UP TO 60 FPS" : project.renderQuality === "eco" ? "12 FPS ECO" : "30 FPS BALANCED"}` : "○ Waiting for music")),
          h("div", { className: `hc-canvas-shell aspect-${project.aspect || "wide"}`, style: { "--hc-zoom": project.zoom / 100 } }, h(LiveScene, { project, nowPlaying, playback, liveLyrics, coverPalette, selectedId, onSelect: setSelectedId, onPointerDown, onPlayerAction, canvasRef, preview, needsTrackAnalysis, trackRhythm, presentationTarget })),
          h("div", { className: "hc-stage-tip" }, h("span", null, "↖"), "Drag any block. Pull the corner dot to resize. Press ⌘Z to undo.")
        ), inspector
      ),
      showExport && h("div", { className: "hc-modal-backdrop", onPointerDown: () => setShowExport(false) },
        h("section", { className: "hc-export-modal", role: "dialog", "aria-modal": "true", "aria-label": "Project import and export", onPointerDown: (event) => event.stopPropagation() },
          h("button", { className: "hc-modal-close", title: "Close", onClick: () => setShowExport(false), type: "button" }, "×"),
          h("span", { className: "hc-section-label" }, "Project backup"),
          h("h2", null, "Move a scene safely"),
          h("p", null, "Copy this JSON as a backup, or paste a previously exported Auraloom project here and import it. Import replaces only the scene currently open in the editor."),
          h("textarea", { value: exchangeValue, spellCheck: false, onChange: (event) => setExchangeValue(event.target.value), "aria-label": "Project JSON" }),
          h("div", { className: "hc-modal-actions" },
            h("button", { className: "hc-project-io", onClick: copyProject, type: "button" }, "Copy JSON"),
            h("button", { className: "hc-save-project", onClick: loadProject, type: "button" }, "Import project")
          )
        )
      )
    );

  // Spotify renders Custom Apps inside a transformed content panel. A fixed
  // child of that panel cannot cover Spotify's library and queue, so the
  // fullscreen editor is portalled to document.body. This makes the icon open
  // a clean full-window editor even when Chromium refuses native fullscreen.
  const editorRoot = fullscreen && ReactDOM?.createPortal ? ReactDOM.createPortal(editor, document.body) : editor;
  return editorRoot;
}

const render = () => h(Auraloom);
