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
   KANJI

   Fungerar annorlunda än hiragana/katakana:
   - Inga ljud-rader (a-i-u-e-o), utan grupper efter TEMA
   - Varje tecken har en BETYDELSE, inte bara ett uttal
   - Vi visar bara det vanligaste uttalet per tecken till att börja med.
     (De flesta kanji har flera uttal beroende på sammanhang - det sparar
     vi till en senare lektion så det inte blir överväldigande.)

   Urvalet är ett smakprov ur "kyōiku kanji" årskurs 1 (de 80 första som
   japanska skolbarn lär sig), plus en extra grupp med tecken som är
   praktiska att känna igen som turist.
   ================================ */

const KANJI_GROUPS = [
  {
    name: "Siffror 1–5",
    chars: [
      { char: "一", romaji: "ichi", meaning: "ett" },
      { char: "二", romaji: "ni", meaning: "två" },
      { char: "三", romaji: "san", meaning: "tre" },
      { char: "四", romaji: "yon / shi", meaning: "fyra" },
      { char: "五", romaji: "go", meaning: "fem" },
    ],
  },
  {
    name: "Siffror 6–10",
    chars: [
      { char: "六", romaji: "roku", meaning: "sex" },
      { char: "七", romaji: "nana / shichi", meaning: "sju" },
      { char: "八", romaji: "hachi", meaning: "åtta" },
      { char: "九", romaji: "kyū / ku", meaning: "nio" },
      { char: "十", romaji: "jū", meaning: "tio" },
    ],
  },
  {
    name: "Naturen",
    chars: [
      { char: "山", romaji: "yama", meaning: "berg" },
      { char: "川", romaji: "kawa", meaning: "flod" },
      { char: "木", romaji: "ki", meaning: "träd" },
      { char: "林", romaji: "hayashi", meaning: "skogsdunge" },
      { char: "森", romaji: "mori", meaning: "skog" },
    ],
  },
  {
    name: "Elementen",
    chars: [
      { char: "火", romaji: "hi", meaning: "eld" },
      { char: "水", romaji: "mizu", meaning: "vatten" },
      { char: "土", romaji: "tsuchi", meaning: "jord, mark" },
      { char: "空", romaji: "sora", meaning: "himmel, tomrum" },
      { char: "雨", romaji: "ame", meaning: "regn" },
    ],
  },
  {
    name: "Tid",
    chars: [
      { char: "日", romaji: "hi / nichi", meaning: "dag, sol" },
      { char: "月", romaji: "tsuki", meaning: "måne, månad" },
      { char: "年", romaji: "toshi / nen", meaning: "år" },
      { char: "天", romaji: "ten", meaning: "himmel" },
      { char: "夕", romaji: "yū", meaning: "kväll" },
    ],
  },
  {
    name: "Människor",
    chars: [
      { char: "人", romaji: "hito", meaning: "människa" },
      { char: "男", romaji: "otoko", meaning: "man" },
      { char: "女", romaji: "onna", meaning: "kvinna" },
      { char: "子", romaji: "ko", meaning: "barn" },
      { char: "名", romaji: "na", meaning: "namn" },
    ],
  },
  {
    name: "Kroppen",
    chars: [
      { char: "目", romaji: "me", meaning: "öga" },
      { char: "耳", romaji: "mimi", meaning: "öra" },
      { char: "口", romaji: "kuchi", meaning: "mun, öppning" },
      { char: "手", romaji: "te", meaning: "hand" },
      { char: "足", romaji: "ashi", meaning: "fot, ben" },
    ],
  },
  {
    name: "Storlek & läge",
    chars: [
      { char: "大", romaji: "ō / dai", meaning: "stor" },
      { char: "小", romaji: "chī / shō", meaning: "liten" },
      { char: "上", romaji: "ue", meaning: "upp, ovanför" },
      { char: "下", romaji: "shita", meaning: "ner, under" },
      { char: "中", romaji: "naka", meaning: "mitten, inuti" },
    ],
  },
  {
    name: "Skola",
    chars: [
      { char: "学", romaji: "gaku", meaning: "studier, lärande" },
      { char: "校", romaji: "kō", meaning: "skola" },
      { char: "先", romaji: "saki / sen", meaning: "före, framför" },
      { char: "生", romaji: "sei", meaning: "liv, födas" },
      { char: "本", romaji: "hon", meaning: "bok, ursprung" },
    ],
  },
  {
    name: "Färger & växter",
    chars: [
      { char: "白", romaji: "shiro", meaning: "vit" },
      { char: "赤", romaji: "aka", meaning: "röd" },
      { char: "青", romaji: "ao", meaning: "blå" },
      { char: "花", romaji: "hana", meaning: "blomma" },
      { char: "草", romaji: "kusa", meaning: "gräs" },
    ],
  },
  {
    name: "Bra att kunna som turist",
    chars: [
      { char: "出", romaji: "de / shutsu", meaning: "ut — 出口 = utgång" },
      { char: "入", romaji: "iri / nyū", meaning: "in — 入口 = ingång" },
      { char: "駅", romaji: "eki", meaning: "järnvägsstation" },
      { char: "円", romaji: "en", meaning: "yen (valutan), cirkel" },
      { char: "止", romaji: "tomaru / shi", meaning: "stanna, stopp" },
    ],
  },
];

const ALL_KANJI = KANJI_GROUPS.flatMap((group) => group.chars);


/* ================================
   ORDFÖRRÅD (Läsa-delen)

   Riktiga ord byggda av rena hiragana/katakana-grundtecken - inga
   ljudmarkeringar (dakuten) eller förlängningstecken än, så allt går att
   läsa med det du redan lärt dig i Tecken-delen.
   ================================ */

const VOCAB_GROUPS = [
  {
    name: "Djur",
    chars: [
      { char: "いぬ", romaji: "inu", meaning: "hund" },
      { char: "ねこ", romaji: "neko", meaning: "katt" },
      { char: "とり", romaji: "tori", meaning: "fågel" },
      { char: "からす", romaji: "karasu", meaning: "kråka" },
      { char: "くも", romaji: "kumo", meaning: "spindel (eller moln!)" },
    ],
  },
  {
    name: "Himlen & väder",
    chars: [
      { char: "そら", romaji: "sora", meaning: "himmel" },
      { char: "つき", romaji: "tsuki", meaning: "måne" },
      { char: "ほし", romaji: "hoshi", meaning: "stjärna" },
      { char: "あさ", romaji: "asa", meaning: "morgon" },
      { char: "うみ", romaji: "umi", meaning: "hav" },
    ],
  },
  {
    name: "Vardag",
    chars: [
      { char: "くつ", romaji: "kutsu", meaning: "skor" },
      { char: "とけい", romaji: "tokei", meaning: "klocka" },
      { char: "はし", romaji: "hashi", meaning: "bro (eller ätpinnar!)" },
      { char: "マスク", romaji: "masuku", meaning: "munskydd" },
      { char: "テスト", romaji: "tesuto", meaning: "prov, test" },
    ],
  },
  {
    name: "Familj",
    chars: [
      { char: "あに", romaji: "ani", meaning: "storebror" },
      { char: "あね", romaji: "ane", meaning: "storasyster" },
      { char: "うち", romaji: "uchi", meaning: "hem" },
      { char: "おかあさん", romaji: "okāsan", meaning: "mamma" },
      { char: "おとうさん", romaji: "otōsan", meaning: "pappa" },
    ],
  },
  {
    name: "Natur & platser",
    chars: [
      { char: "やま", romaji: "yama", meaning: "berg" },
      { char: "はな", romaji: "hana", meaning: "blomma (eller näsa!)" },
      { char: "さくら", romaji: "sakura", meaning: "körsbärsblom" },
      { char: "そと", romaji: "soto", meaning: "utomhus" },
      { char: "ふね", romaji: "fune", meaning: "båt" },
    ],
  },
];

const ALL_VOCAB = VOCAB_GROUPS.flatMap((group) => group.chars);

/* ================================
   GEMENSAMT UPPSLAG (så samma kod kan hantera alla delar)
   ================================ */

const ALPHABETS = {
  hiragana: {
    label: "Hiragana",
    strokeStyle: "kana",
    strokeNamePrefix: "Hiragana",
    quizKey: "romaji",
    revealLabel: "Visa uttal",
    groups: HIRAGANA_GROUPS,
    all: ALL_HIRAGANA,
    gojuonTable: GOJUON_TABLE,
    exampleWord: EXAMPLE_WORD,
  },
  katakana: {
    label: "Katakana",
    strokeStyle: "kana",
    strokeNamePrefix: "Katakana",
    quizKey: "romaji",
    revealLabel: "Visa uttal",
    groups: KATAKANA_GROUPS,
    all: ALL_KATAKANA,
    gojuonTable: KATAKANA_GOJUON_TABLE,
    exampleWord: KATAKANA_EXAMPLE_WORD,
  },
  kanji: {
    label: "Kanji",
    strokeStyle: "kanji",
    // Kanji frågar efter BETYDELSE i quizet, inte uttal
    quizKey: "meaning",
    revealLabel: "Visa betydelse",
    groups: KANJI_GROUPS,
    all: ALL_KANJI,
    gojuonTable: null,
    exampleWord: null,
  },
  vocabulary: {
    label: "Läsa",
    // "none" - orden är redan kända tecken, ingen streckordning/skrivläge behövs här
    strokeStyle: "none",
    quizKey: "meaning",
    revealLabel: "Visa betydelse",
    groups: VOCAB_GROUPS,
    all: ALL_VOCAB,
    gojuonTable: null,
    exampleWord: null,
  },
};
