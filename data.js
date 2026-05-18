// Kana data + game definitions, exposed on window for cross-script access

// ============================================================
// Base kana (gojūon)
// ============================================================

const HIRAGANA = [
  ["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],
  ["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],
  ["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"],
  ["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"],
  ["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],
  ["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"],
  ["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],
  ["や","ya"],["ゆ","yu"],["よ","yo"],
  ["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"],
  ["わ","wa"],["を","wo"],["ん","n"]
];

const KATAKANA = [
  ["ア","a"],["イ","i"],["ウ","u"],["エ","e"],["オ","o"],
  ["カ","ka"],["キ","ki"],["ク","ku"],["ケ","ke"],["コ","ko"],
  ["サ","sa"],["シ","shi"],["ス","su"],["セ","se"],["ソ","so"],
  ["タ","ta"],["チ","chi"],["ツ","tsu"],["テ","te"],["ト","to"],
  ["ナ","na"],["ニ","ni"],["ヌ","nu"],["ネ","ne"],["ノ","no"],
  ["ハ","ha"],["ヒ","hi"],["フ","fu"],["ヘ","he"],["ホ","ho"],
  ["マ","ma"],["ミ","mi"],["ム","mu"],["メ","me"],["モ","mo"],
  ["ヤ","ya"],["ユ","yu"],["ヨ","yo"],
  ["ラ","ra"],["リ","ri"],["ル","ru"],["レ","re"],["ロ","ro"],
  ["ワ","wa"],["ヲ","wo"],["ン","n"]
];

// ============================================================
// Dakuten (゛) — voiced versions
// ============================================================

const HIRAGANA_DAKUTEN = [
  // G-row (K + ゛)
  ["が","ga"],["ぎ","gi"],["ぐ","gu"],["げ","ge"],["ご","go"],
  // Z-row (S + ゛) — note: し → じ (ji), not "zi"
  ["ざ","za"],["じ","ji"],["ず","zu"],["ぜ","ze"],["ぞ","zo"],
  // D-row (T + ゛) — ぢ → ji, づ → zu (share readings with じ/ず)
  ["だ","da"],["ぢ","ji"],["づ","zu"],["で","de"],["ど","do"],
  // B-row (H + ゛)
  ["ば","ba"],["び","bi"],["ぶ","bu"],["べ","be"],["ぼ","bo"]
];

const KATAKANA_DAKUTEN = [
  ["ガ","ga"],["ギ","gi"],["グ","gu"],["ゲ","ge"],["ゴ","go"],
  ["ザ","za"],["ジ","ji"],["ズ","zu"],["ゼ","ze"],["ゾ","zo"],
  ["ダ","da"],["ヂ","ji"],["ヅ","zu"],["デ","de"],["ド","do"],
  ["バ","ba"],["ビ","bi"],["ブ","bu"],["ベ","be"],["ボ","bo"]
];

// ============================================================
// Handakuten (゜) — semi-voiced (P-row only)
// ============================================================

const HIRAGANA_HANDAKUTEN = [
  ["ぱ","pa"],["ぴ","pi"],["ぷ","pu"],["ぺ","pe"],["ぽ","po"]
];

const KATAKANA_HANDAKUTEN = [
  ["パ","pa"],["ピ","pi"],["プ","pu"],["ペ","pe"],["ポ","po"]
];

// ============================================================
// Digraphs (yōon) — consonant + small や/ゆ/よ
// ============================================================

const HIRAGANA_DIGRAPHS = [
  ["きゃ","kya"],["きゅ","kyu"],["きょ","kyo"],
  ["しゃ","sha"],["しゅ","shu"],["しょ","sho"],
  ["ちゃ","cha"],["ちゅ","chu"],["ちょ","cho"],
  ["にゃ","nya"],["にゅ","nyu"],["にょ","nyo"],
  ["ひゃ","hya"],["ひゅ","hyu"],["ひょ","hyo"],
  ["みゃ","mya"],["みゅ","myu"],["みょ","myo"],
  ["りゃ","rya"],["りゅ","ryu"],["りょ","ryo"]
];

const HIRAGANA_DIGRAPHS_DAKUTEN = [
  ["ぎゃ","gya"],["ぎゅ","gyu"],["ぎょ","gyo"],
  ["じゃ","ja"], ["じゅ","ju"], ["じょ","jo"],
  ["びゃ","bya"],["びゅ","byu"],["びょ","byo"],
  ["ぴゃ","pya"],["ぴゅ","pyu"],["ぴょ","pyo"] // handakuten digraphs
];

const KATAKANA_DIGRAPHS = [
  ["キャ","kya"],["キュ","kyu"],["キョ","kyo"],
  ["シャ","sha"],["シュ","shu"],["ショ","sho"],
  ["チャ","cha"],["チュ","chu"],["チョ","cho"],
  ["ニャ","nya"],["ニュ","nyu"],["ニョ","nyo"],
  ["ヒャ","hya"],["ヒュ","hyu"],["ヒョ","hyo"],
  ["ミャ","mya"],["ミュ","myu"],["ミョ","myo"],
  ["リャ","rya"],["リュ","ryu"],["リョ","ryo"]
];

const KATAKANA_DIGRAPHS_DAKUTEN = [
  ["ギャ","gya"],["ギュ","gyu"],["ギョ","gyo"],
  ["ジャ","ja"], ["ジュ","ju"], ["ジョ","jo"],
  ["ビャ","bya"],["ビュ","byu"],["ビョ","byo"],
  ["ピャ","pya"],["ピュ","pyu"],["ピョ","pyo"]
];

// ============================================================
// KANA_MAP — char → { romaji: [canonical, ...alternates], script, kind }
//
// Canonical is Hepburn (shi, chi, tsu, fu, ja, etc — what most learners
// type). Alternates are Nihon-shiki / Kunrei-shiki spellings (si, ti, tu,
// hu, zya, etc) which appear on Japanese keyboards and in older textbooks.
// Both are accepted as correct; the canonical is what we display.
//
// Alternates are derived from the canonical romaji, so we only specify
// the rule once instead of annotating every kana entry.
// ============================================================

// Map canonical Hepburn → list of accepted alternates (NOT including
// the canonical itself; the canonical is always accepted).
const ROMAJI_ALTERNATES = {
  // base kana with differing systems
  "shi": ["si"],
  "chi": ["ti"],
  "tsu": ["tu"],
  "fu":  ["hu"],
  "ji":  ["zi", "di"],   // covers じ AND ぢ
  "zu":  ["du"],          // covers ず AND づ (du is the Nihon-shiki for づ)
  "wo":  ["o"],           // を is often typed "wo" but pronounced "o"

  // sh- digraphs
  "sha": ["sya"],
  "shu": ["syu"],
  "sho": ["syo"],
  // ch- digraphs
  "cha": ["tya", "cya"],
  "chu": ["tyu", "cyu"],
  "cho": ["tyo", "cyo"],
  // j- digraphs
  "ja":  ["zya", "jya"],
  "ju":  ["zyu", "jyu"],
  "jo":  ["zyo", "jyo"]
};

function alternatesFor(canonical) {
  return ROMAJI_ALTERNATES[canonical] || [];
}

// All accepted spellings, canonical first
function spellingsFor(canonical) {
  return [canonical, ...alternatesFor(canonical)];
}

const KANA_MAP = {};
function registerKana(list, script, kind) {
  list.forEach(([k, canonical]) => {
    KANA_MAP[k] = {
      romaji: spellingsFor(canonical),  // always an array, canonical at [0]
      script,
      kind
    };
  });
}

registerKana(HIRAGANA, "hiragana", "basic");
registerKana(KATAKANA, "katakana", "basic");
registerKana(HIRAGANA_DAKUTEN, "hiragana", "dakuten");
registerKana(KATAKANA_DAKUTEN, "katakana", "dakuten");
registerKana(HIRAGANA_HANDAKUTEN, "hiragana", "handakuten");
registerKana(KATAKANA_HANDAKUTEN, "katakana", "handakuten");
registerKana(HIRAGANA_DIGRAPHS, "hiragana", "digraph");
registerKana(HIRAGANA_DIGRAPHS_DAKUTEN, "hiragana", "digraph");
registerKana(KATAKANA_DIGRAPHS, "katakana", "digraph");
registerKana(KATAKANA_DIGRAPHS_DAKUTEN, "katakana", "digraph");

// Helpers exposed for the UI / answer-check
function isCorrectRomaji(char, guess) {
  const meta = KANA_MAP[char];
  if (!meta) return false;
  return meta.romaji.includes(guess);
}

// Canonical (display) spelling
function canonicalRomaji(char) {
  return KANA_MAP[char]?.romaji[0] || "";
}

// Pretty form for display, e.g. "shi / si" or just "ka". For kanji with
// many readings we cap at 3 to keep the reveal label readable.
function displayRomaji(char) {
  const arr = KANA_MAP[char]?.romaji || [];
  if (arr.length <= 1) return arr[0] || "";
  const shown = arr.slice(0, 3);
  const suffix = arr.length > 3 ? " / …" : "";
  return shown[0] + " / " + shown.slice(1).join(" / ") + suffix;
}

// ============================================================
// Power-ups & modifiers (unchanged)
// ============================================================

const POWERUPS = [
  { id: "shield",  name: "Shield",        glyph: "盾", color: "#FFD23F", desc: "Block the next card sent at you." },
  { id: "bolt",    name: "Double Strike", glyph: "雷", color: "#FF6B35", desc: "Your next correct answer sends 2 cards." },
  { id: "freeze",  name: "Freeze",        glyph: "氷", color: "#7DD3FC", desc: "Opponent's input is frozen for 3 seconds." },
  { id: "peek",    name: "Peek",          glyph: "目", color: "#A78BFA", desc: "Briefly reveal your next 3 answers." },
  { id: "reflect", name: "Reflect",       glyph: "鏡", color: "#34D399", desc: "Next card sent at you bounces back to opponent." },
  { id: "purge",   name: "Purge",         glyph: "破", color: "#F472B6", desc: "Discard the top card from your deck." }
];

const POWERUP_MAP = {};
POWERUPS.forEach(p => POWERUP_MAP[p.id] = p);

const MODIFIERS = [
  { id: "double_send",  name: "Double Send",   glyph: "二", desc: "Every correct answer sends 2 cards.", tone: "aggressive" },
  { id: "glass_cannon", name: "Glass Cannon",  glyph: "硝", desc: "Damage dealt is doubled this round.", tone: "aggressive" },
  { id: "vampire",      name: "Vampire",       glyph: "血", desc: "Every 5 correct restores 1 HP.", tone: "dark" },
  { id: "lucky",        name: "Lucky Strike",  glyph: "運", desc: "Power-up drop rate doubled.", tone: "calm" },
  { id: "starter_hp",   name: "Second Wind",   glyph: "息", desc: "Both players gain +3 HP.", tone: "calm" },
  { id: "small_deck",   name: "Light Deck",    glyph: "軽", desc: "Both decks start with 7 cards instead of 10.", tone: "calm" },
  { id: "big_deck",     name: "Heavy Deck",    glyph: "重", desc: "Both decks start with 14 cards.", tone: "wild" },
  { id: "no_dunno",     name: "No Mercy",      glyph: "厳", desc: "'I don't know' adds 5 cards instead of 3.", tone: "sharp" },
  { id: "tax",          name: "Tax",           glyph: "税", desc: "Every wrong answer sends 1 card to YOURSELF.", tone: "dark" }
];

const MOD_MAP = {};
MODIFIERS.forEach(m => MOD_MAP[m.id] = m);

// ============================================================
// Utilities
// ============================================================

function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function makeDeck(size, scriptFilter) {
  let pool;
  if (scriptFilter === "hiragana") pool = HIRAGANA;
  else if (scriptFilter === "katakana") pool = KATAKANA;
  else pool = [...HIRAGANA, ...KATAKANA];
  const deck = [];
  for (let i = 0; i < size; i++) {
    deck.push(pool[Math.floor(Math.random() * pool.length)][0]);
  }
  return deck;
}

function makeDeckFromChars(size, chars) {
  if (!chars || !chars.length) return makeDeck(size);
  const deck = [];
  for (let i = 0; i < size; i++) {
    deck.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return deck;
}

// ============================================================
// Rulesets — chosen before match begins, gated by ELO tier
// ============================================================

const HCHARS  = HIRAGANA.map(x => x[0]);
const KCHARS  = KATAKANA.map(x => x[0]);
const HDAK    = HIRAGANA_DAKUTEN.map(x => x[0]);
const KDAK    = KATAKANA_DAKUTEN.map(x => x[0]);
const HHAN    = HIRAGANA_HANDAKUTEN.map(x => x[0]);
const KHAN    = KATAKANA_HANDAKUTEN.map(x => x[0]);
const HDIG    = HIRAGANA_DIGRAPHS.map(x => x[0]);
const HDIGDAK = HIRAGANA_DIGRAPHS_DAKUTEN.map(x => x[0]);
const KDIG    = KATAKANA_DIGRAPHS.map(x => x[0]);
const KDIGDAK = KATAKANA_DIGRAPHS_DAKUTEN.map(x => x[0]);

const RULESETS = [
  // ----- tier 0 (novice) — single rows -----
  { id: "vowels",  name: "Vowels",  glyph: "あ", chars: ["あ","い","う","え","お"], tier: 0, family: "row" },
  { id: "k_row",   name: "K-Row",   glyph: "か", chars: ["か","き","く","け","こ"], tier: 0, family: "row" },
  { id: "s_row",   name: "S-Row",   glyph: "さ", chars: ["さ","し","す","せ","そ"], tier: 0, family: "row" },
  { id: "t_row",   name: "T-Row",   glyph: "た", chars: ["た","ち","つ","て","と"], tier: 0, family: "row" },
  { id: "n_row",   name: "N-Row",   glyph: "な", chars: ["な","に","ぬ","ね","の"], tier: 0, family: "row" },
  { id: "h_row",   name: "H-Row",   glyph: "は", chars: ["は","ひ","ふ","へ","ほ"], tier: 0, family: "row" },
  { id: "m_row",   name: "M-Row",   glyph: "ま", chars: ["ま","み","む","め","も"], tier: 0, family: "row" },
  { id: "r_row",   name: "R-Row",   glyph: "ら", chars: ["ら","り","る","れ","ろ"], tier: 0, family: "row" },
  { id: "yw_row",  name: "Y·W-Row + ん", glyph: "や", chars: ["や","ゆ","よ","わ","を","ん"], tier: 0, family: "row" },

  // ----- tier 0 (adept entry) — katakana single rows -----
  { id: "ka_vowels", name: "Kata Vowels", glyph: "ア", chars: ["ア","イ","ウ","エ","オ"],                                           tier: 1200, family: "kata-row" },
  { id: "ka_k_row",  name: "Kata K-Row",  glyph: "カ", chars: ["カ","キ","ク","ケ","コ"],                                           tier: 1200, family: "kata-row" },
  { id: "ka_s_row",  name: "Kata S-Row",  glyph: "サ", chars: ["サ","シ","ス","セ","ソ"],                                           tier: 1200, family: "kata-row" },
  { id: "ka_t_row",  name: "Kata T-Row",  glyph: "タ", chars: ["タ","チ","ツ","テ","ト"],                                           tier: 1200, family: "kata-row" },
  { id: "ka_n_row",  name: "Kata N-Row",  glyph: "ナ", chars: ["ナ","ニ","ヌ","ネ","ノ"],                                           tier: 1200, family: "kata-row" },
  { id: "ka_h_row",  name: "Kata H-Row",  glyph: "ハ", chars: ["ハ","ヒ","フ","ヘ","ホ"],                                           tier: 1200, family: "kata-row" },
  { id: "ka_m_row",  name: "Kata M-Row",  glyph: "マ", chars: ["マ","ミ","ム","メ","モ"],                                           tier: 1200, family: "kata-row" },
  { id: "ka_yw_row", name: "Kata Y·R·W+N",glyph: "ヤ", chars: ["ヤ","ユ","ヨ","ラ","リ","ル","レ","ロ","ワ","ヲ","ン"],             tier: 1200, family: "kata-row" },

  // ----- tier 1 (apprentice) — bundles -----
  { id: "vk",      name: "Vowels + K",     glyph: "あ", chars: HCHARS.slice(0,10), tier: 1000, family: "bundle" },
  { id: "vks",     name: "Early Hiragana", glyph: "さ", chars: HCHARS.slice(0,15), tier: 1000, family: "bundle" },
  { id: "first25", name: "Half Hiragana",  glyph: "は", chars: HCHARS.slice(0,25), tier: 1100, family: "bundle" },

  // ----- tier 2 (adept) — full base sets -----
  { id: "full_hira",   name: "Full Hiragana", glyph: "ひ", chars: HCHARS,            tier: 1200, family: "full" },
  { id: "early_kata",  name: "Early Katakana",glyph: "ア", chars: KCHARS.slice(0,15), tier: 1250, family: "bundle" },
  { id: "mixed_basic", name: "Mixed Basic",   glyph: "混", chars: [...HCHARS.slice(0,20), ...KCHARS.slice(0,20)], tier: 1300, family: "mixed" },
  { id: "full_kata",   name: "Full Katakana", glyph: "ヒ", chars: KCHARS,            tier: 1350, family: "full" },

  // ----- dakuten / handakuten -----
  { id: "h_dakuten",     name: "Hiragana Dakuten",    glyph: "゛", chars: HDAK,                tier: 1200, family: "dakuten" },
  { id: "h_handakuten",  name: "Hiragana Handakuten", glyph: "゜", chars: HHAN,                tier: 1200, family: "handakuten" },
  { id: "h_dak_han",     name: "Hiragana ゛ + ゜",     glyph: "が", chars: [...HDAK, ...HHAN],  tier: 1250, family: "dakuten" },
  { id: "k_dakuten",     name: "Katakana Dakuten",    glyph: "ガ", chars: KDAK,                tier: 1300, family: "dakuten" },
  { id: "k_handakuten",  name: "Katakana Handakuten", glyph: "パ", chars: KHAN,                tier: 1300, family: "handakuten" },
  { id: "k_dak_han",     name: "Katakana ゛ + ゜",     glyph: "ガ", chars: [...KDAK, ...KHAN],  tier: 1350, family: "dakuten" },
  { id: "hira_extended", name: "Hiragana Extended",   glyph: "が", chars: [...HCHARS, ...HDAK, ...HHAN], tier: 1300, family: "extended" },
  { id: "kata_extended", name: "Katakana Extended",   glyph: "ガ", chars: [...KCHARS, ...KDAK, ...KHAN], tier: 1400, family: "extended" },

  // ----- digraphs (yōon) -----
  { id: "h_digraphs",        name: "Hiragana Digraphs",        glyph: "き", chars: HDIG,                tier: 1300, family: "digraph" },
  { id: "h_digraphs_voiced", name: "Hiragana Voiced Digraphs", glyph: "じ", chars: HDIGDAK,             tier: 1350, family: "digraph" },
  { id: "h_digraphs_all",    name: "All Hiragana Digraphs",    glyph: "ょ", chars: [...HDIG, ...HDIGDAK], tier: 1400, family: "digraph" },
  { id: "k_digraphs",        name: "Katakana Digraphs",        glyph: "キ", chars: KDIG,                tier: 1400, family: "digraph" },
  { id: "k_digraphs_voiced", name: "Katakana Voiced Digraphs", glyph: "ジ", chars: KDIGDAK,             tier: 1450, family: "digraph" },
  { id: "k_digraphs_all",    name: "All Katakana Digraphs",    glyph: "ョ", chars: [...KDIG, ...KDIGDAK], tier: 1450, family: "digraph" },

  // ----- master-tier endgames -----
  { id: "full_mixed",    name: "All Kana",          glyph: "戦", chars: [...HCHARS, ...KCHARS], tier: 1400, family: "full" },
  { id: "hira_complete", name: "Hiragana Complete", glyph: "完", chars: [...HCHARS, ...HDAK, ...HHAN, ...HDIG, ...HDIGDAK], tier: 1450, family: "complete" },
  { id: "kata_complete", name: "Katakana Complete", glyph: "全", chars: [...KCHARS, ...KDAK, ...KHAN, ...KDIG, ...KDIGDAK], tier: 1500, family: "complete" },
  { id: "everything",    name: "Everything",        glyph: "極", chars: [
    ...HCHARS, ...KCHARS, ...HDAK, ...KDAK, ...HHAN, ...KHAN,
    ...HDIG, ...HDIGDAK, ...KDIG, ...KDIGDAK
  ], tier: 1500, family: "complete" }
];

const RULESET_MAP = {};
RULESETS.forEach(r => RULESET_MAP[r.id] = r);

function tierFor(rank) {
  if (rank < 1000) return "novice";
  if (rank < 1100) return "apprentice";
  if (rank < 1200) return "adept-low";
  if (rank < 1300) return "adept";
  if (rank < 1400) return "adept-high";
  if (rank < 1500) return "master";
  return "grandmaster";
}

function availableRulesets(rank) {
  const t = tierFor(rank);
  let pool;
  if (t === "novice") {
    pool = RULESETS.filter(r => r.family === "row");
  } else if (t === "apprentice") {
    pool = RULESETS.filter(r => r.family === "row" || ["vk","vks"].includes(r.id));
  } else if (t === "adept-low") {
    pool = RULESETS.filter(r => ["vks","first25","full_hira"].includes(r.id) || r.family === "row");
  } else if (t === "adept") {
    // base sets start mixing with dakuten/handakuten; katakana rows unlock
    pool = RULESETS.filter(r => [
      "first25","full_hira","early_kata","mixed_basic",
      "h_dakuten","h_handakuten","h_dak_han"
    ].includes(r.id) || r.family === "kata-row");
  } else if (t === "adept-high") {
    // katakana voiced + first digraphs unlock; kata rows still available
    pool = RULESETS.filter(r => [
      "full_hira","full_kata","early_kata","mixed_basic",
      "h_dakuten","h_dak_han","k_dakuten","k_dak_han",
      "hira_extended","h_digraphs","h_digraphs_voiced"
    ].includes(r.id) || r.family === "kata-row");
  } else if (t === "master") {
    pool = RULESETS.filter(r => [
      "full_hira","full_kata","mixed_basic","full_mixed",
      "hira_extended","kata_extended",
      "h_digraphs","h_digraphs_voiced","h_digraphs_all",
      "k_digraphs","k_digraphs_voiced"
    ].includes(r.id));
  } else {
    // grandmaster
    pool = RULESETS.filter(r => [
      "full_mixed","hira_extended","kata_extended",
      "h_digraphs_all","k_digraphs_all",
      "hira_complete","kata_complete","everything"
    ].includes(r.id));
  }
  return pickN(pool, Math.min(4, pool.length));
}

// Standard ELO with K=32
function eloDelta(rA, rB, scoreA) {
  const expected = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  return Math.round(32 * (scoreA - expected));
}

// ============================================================
// EXPOSE
// ============================================================

Object.assign(window, {
  // Kana data
  HIRAGANA, KATAKANA, KANA_MAP,
  HIRAGANA_DAKUTEN, KATAKANA_DAKUTEN,
  HIRAGANA_HANDAKUTEN, KATAKANA_HANDAKUTEN,
  HIRAGANA_DIGRAPHS, HIRAGANA_DIGRAPHS_DAKUTEN,
  KATAKANA_DIGRAPHS, KATAKANA_DIGRAPHS_DAKUTEN,
  // Game data
  POWERUPS, POWERUP_MAP,
  MODIFIERS, MOD_MAP,
  RULESETS, RULESET_MAP, availableRulesets, tierFor,
  pickN, makeDeck, makeDeckFromChars, eloDelta,
  isCorrectRomaji, canonicalRomaji, displayRomaji, alternatesFor, spellingsFor
});
