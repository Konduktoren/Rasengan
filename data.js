// Detta är vår "databas" över tecken, för nu bara en enkel lista i koden.
// Senare (steg 5 i planen) kommer vi eventuellt hämta liknande data från Supabase,
// men just nu räcker det att ha den direkt här.
//
// Varje tecken har:
//   char   -> själva hiragana-tecknet
//   romaji -> hur det uttalas skrivet med vårt alfabet
//   row    -> vilken "rad" tecknet tillhör (för att kunna gruppera senare)

const HIRAGANA = [
  { char: "あ", romaji: "a", row: "a" },
  { char: "い", romaji: "i", row: "a" },
  { char: "う", romaji: "u", row: "a" },
  { char: "え", romaji: "e", row: "a" },
  { char: "お", romaji: "o", row: "a" },
];
