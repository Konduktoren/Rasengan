// Alla 46 hiragana-tecken, grupperade i sina naturliga "rader" (gojūon-ordningen).
// De flesta rader har 5 tecken, men や-raden och わ-raden har bara 3.
// Efter varje rad kör vi ett litet quiz i appen innan man går vidare till nästa.

const HIRAGANA_GROUPS = [
  {
    name: "a",
    chars: [
      { char: "あ", romaji: "a" },
      { char: "い", romaji: "i" },
      { char: "う", romaji: "u" },
      { char: "え", romaji: "e" },
      { char: "お", romaji: "o" },
    ],
  },
  {
    name: "ka",
    chars: [
      { char: "か", romaji: "ka" },
      { char: "き", romaji: "ki" },
      { char: "く", romaji: "ku" },
      { char: "け", romaji: "ke" },
      { char: "こ", romaji: "ko" },
    ],
  },
  {
    name: "sa",
    chars: [
      { char: "さ", romaji: "sa" },
      { char: "し", romaji: "shi" },
      { char: "す", romaji: "su" },
      { char: "せ", romaji: "se" },
      { char: "そ", romaji: "so" },
    ],
  },
  {
    name: "ta",
    chars: [
      { char: "た", romaji: "ta" },
      { char: "ち", romaji: "chi" },
      { char: "つ", romaji: "tsu" },
      { char: "て", romaji: "te" },
      { char: "と", romaji: "to" },
    ],
  },
  {
    name: "na",
    chars: [
      { char: "な", romaji: "na" },
      { char: "に", romaji: "ni" },
      { char: "ぬ", romaji: "nu" },
      { char: "ね", romaji: "ne" },
      { char: "の", romaji: "no" },
    ],
  },
  {
    name: "ha",
    chars: [
      { char: "は", romaji: "ha" },
      { char: "ひ", romaji: "hi" },
      { char: "ふ", romaji: "fu" },
      { char: "へ", romaji: "he" },
      { char: "ほ", romaji: "ho" },
    ],
  },
  {
    name: "ma",
    chars: [
      { char: "ま", romaji: "ma" },
      { char: "み", romaji: "mi" },
      { char: "む", romaji: "mu" },
      { char: "め", romaji: "me" },
      { char: "も", romaji: "mo" },
    ],
  },
  {
    name: "ya",
    chars: [
      { char: "や", romaji: "ya" },
      { char: "ゆ", romaji: "yu" },
      { char: "よ", romaji: "yo" },
    ],
  },
  {
    name: "ra",
    chars: [
      { char: "ら", romaji: "ra" },
      { char: "り", romaji: "ri" },
      { char: "る", romaji: "ru" },
      { char: "れ", romaji: "re" },
      { char: "ろ", romaji: "ro" },
    ],
  },
  {
    name: "wa",
    chars: [
      { char: "わ", romaji: "wa" },
      { char: "を", romaji: "wo" },
      { char: "ん", romaji: "n" },
    ],
  },
];

// En platt lista med alla tecken, oavsett rad - använder vi för att plocka
// felaktiga svarsalternativ till quizet.
const ALL_HIRAGANA = HIRAGANA_GROUPS.flatMap((group) => group.chars);

// Samma tecken, men strukturerade som den klassiska "gojūon"-tabellen
// (konsonant-rader × vokal-kolumner a/i/u/e/o) - används för att illustrera
// hur systemet hänger ihop i info-rutan. "null" betyder att den kombinationen
// inte finns i modern japanska.
const GOJUON_TABLE = [
  { label: "–", cells: ["あ", "い", "う", "え", "お"] },
  { label: "k", cells: ["か", "き", "く", "け", "こ"] },
  { label: "s", cells: ["さ", "し", "す", "せ", "そ"] },
  { label: "t", cells: ["た", "ち", "つ", "て", "と"] },
  { label: "n", cells: ["な", "に", "ぬ", "ね", "の"] },
  { label: "h", cells: ["は", "ひ", "ふ", "へ", "ほ"] },
  { label: "m", cells: ["ま", "み", "む", "め", "も"] },
  { label: "y", cells: ["や", null, "ゆ", null, "よ"] },
  { label: "r", cells: ["ら", "り", "る", "れ", "ろ"] },
  { label: "w", cells: ["わ", null, null, null, "を"] },
];

// Ett enkelt, riktigt ord som visar hur tecken från olika rader kombineras.
const EXAMPLE_WORD = {
  chars: ["さ", "く", "ら"],
  romaji: "sakura",
  meaning: "körsbärsblom — en av Japans mest kända symboler",
};


/* ================================
   KATAKANA (samma struktur som hiragana ovan, andra tecken)
   ================================ */

const KATAKANA_GROUPS = [
  { name: "a", chars: [{ char: "ア", romaji: "a" }, { char: "イ", romaji: "i" }, { char: "ウ", romaji: "u" }, { char: "エ", romaji: "e" }, { char: "オ", romaji: "o" }] },
  { name: "ka", chars: [{ char: "カ", romaji: "ka" }, { char: "キ", romaji: "ki" }, { char: "ク", romaji: "ku" }, { char: "ケ", romaji: "ke" }, { char: "コ", romaji: "ko" }] },
  { name: "sa", chars: [{ char: "サ", romaji: "sa" }, { char: "シ", romaji: "shi" }, { char: "ス", romaji: "su" }, { char: "セ", romaji: "se" }, { char: "ソ", romaji: "so" }] },
  { name: "ta", chars: [{ char: "タ", romaji: "ta" }, { char: "チ", romaji: "chi" }, { char: "ツ", romaji: "tsu" }, { char: "テ", romaji: "te" }, { char: "ト", romaji: "to" }] },
  { name: "na", chars: [{ char: "ナ", romaji: "na" }, { char: "ニ", romaji: "ni" }, { char: "ヌ", romaji: "nu" }, { char: "ネ", romaji: "ne" }, { char: "ノ", romaji: "no" }] },
  { name: "ha", chars: [{ char: "ハ", romaji: "ha" }, { char: "ヒ", romaji: "hi" }, { char: "フ", romaji: "fu" }, { char: "ヘ", romaji: "he" }, { char: "ホ", romaji: "ho" }] },
  { name: "ma", chars: [{ char: "マ", romaji: "ma" }, { char: "ミ", romaji: "mi" }, { char: "ム", romaji: "mu" }, { char: "メ", romaji: "me" }, { char: "モ", romaji: "mo" }] },
  { name: "ya", chars: [{ char: "ヤ", romaji: "ya" }, { char: "ユ", romaji: "yu" }, { char: "ヨ", romaji: "yo" }] },
  { name: "ra", chars: [{ char: "ラ", romaji: "ra" }, { char: "リ", romaji: "ri" }, { char: "ル", romaji: "ru" }, { char: "レ", romaji: "re" }, { char: "ロ", romaji: "ro" }] },
  { name: "wa", chars: [{ char: "ワ", romaji: "wa" }, { char: "ヲ", romaji: "wo" }, { char: "ン", romaji: "n" }] },
];

const ALL_KATAKANA = KATAKANA_GROUPS.flatMap((group) => group.chars);

const KATAKANA_GOJUON_TABLE = [
  { label: "–", cells: ["ア", "イ", "ウ", "エ", "オ"] },
  { label: "k", cells: ["カ", "キ", "ク", "ケ", "コ"] },
  { label: "s", cells: ["サ", "シ", "ス", "セ", "ソ"] },
  { label: "t", cells: ["タ", "チ", "ツ", "テ", "ト"] },
  { label: "n", cells: ["ナ", "ニ", "ヌ", "ネ", "ノ"] },
  { label: "h", cells: ["ハ", "ヒ", "フ", "ヘ", "ホ"] },
  { label: "m", cells: ["マ", "ミ", "ム", "メ", "モ"] },
  { label: "y", cells: ["ヤ", null, "ユ", null, "ヨ"] },
  { label: "r", cells: ["ラ", "リ", "ル", "レ", "ロ"] },
  { label: "w", cells: ["ワ", null, null, null, "ヲ"] },
];

// カメラ (kamera) - ett vanligt lånord, byggt av rena grundtecken utan extra ljudmarkeringar.
const KATAKANA_EXAMPLE_WORD = {
  chars: ["カ", "メ", "ラ"],
  romaji: "kamera",
  meaning: "kamera — ett lånord från engelskans \"camera\"",
};


/* ================================
   GEMENSAMT UPPSLAG (så samma kod kan hantera både hiragana och katakana)
   ================================ */

const ALPHABETS = {
  hiragana: {
    label: "Hiragana",
    strokeNamePrefix: "Hiragana",
    groups: HIRAGANA_GROUPS,
    all: ALL_HIRAGANA,
    gojuonTable: GOJUON_TABLE,
    exampleWord: EXAMPLE_WORD,
  },
  katakana: {
    label: "Katakana",
    strokeNamePrefix: "Katakana",
    groups: KATAKANA_GROUPS,
    all: ALL_KATAKANA,
    gojuonTable: KATAKANA_GOJUON_TABLE,
    exampleWord: KATAKANA_EXAMPLE_WORD,
  },
};
