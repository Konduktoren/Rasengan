// Vilket tecken (index i listan) vi tittar på just nu. Vi börjar på det första, index 0.
let currentIndex = 0;

// Vi "hämtar tag i" HTML-elementen vi behöver ändra, och sparar dem i variabler
// så vi slipper leta upp dem varje gång.
const characterEl = document.getElementById("character");
const romajiEl = document.getElementById("romaji");
const progressEl = document.getElementById("progress");
const revealBtn = document.getElementById("reveal-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const strokeGifEl = document.getElementById("stroke-gif");
const strokeStaticEl = document.getElementById("stroke-static");

// Bygger webbadressen till den animerade streckordnings-GIF:en för ett visst tecken.
function strokeOrderGifUrl(char) {
  const filename = `Hiragana_${char}_stroke_order_animation.gif`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

// Bygger webbadressen till en statisk bild som visar numrerad streckordning
// (från KanjiVG-projektet, som visar siffror för varje streck och var det börjar).
function strokeOrderStaticUrl(char) {
  // Varje tecken har en unik Unicode-kodpunkt, t.ex. あ = 3042.
  // KanjiVG-filerna på Wikimedia är namngivna efter denna kodpunkt.
  const codePoint = char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  const filename = `${char} - U+0${codePoint}- KanjiVG stroke order.svg`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

// Denna funktion uppdaterar det som visas på skärmen utifrån currentIndex.
function render() {
  const item = HIRAGANA[currentIndex];

  characterEl.textContent = item.char;

  // Uttalet göms igen varje gång vi byter tecken
  romajiEl.textContent = "?";
  romajiEl.classList.remove("visible");

  progressEl.textContent = `${currentIndex + 1} / ${HIRAGANA.length}`;
  strokeStaticEl.src = strokeOrderStaticUrl(item.char);
  strokeStaticEl.alt = `Numrerad streckordning för ${item.char}`;
  strokeGifEl.src = strokeOrderGifUrl(item.char);
  strokeGifEl.alt = `Animerad streckordning för ${item.char}`;

  // Inaktivera "Föregående" om vi är på första tecknet,
  // och "Nästa" om vi är på sista - annars skulle man kunna bläddra utanför listan.
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === HIRAGANA.length - 1;
}

// Visa uttalet när man klickar på knappen
revealBtn.addEventListener("click", () => {
  const item = HIRAGANA[currentIndex];
  romajiEl.textContent = item.romaji;
  romajiEl.classList.add("visible");
});

// Gå till föregående tecken
prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    render();
  }
});

// Gå till nästa tecken
nextBtn.addEventListener("click", () => {
  if (currentIndex < HIRAGANA.length - 1) {
    currentIndex++;
    render();
  }
});

// Rita upp sidan en första gång när den laddas
render();
