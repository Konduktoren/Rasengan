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
