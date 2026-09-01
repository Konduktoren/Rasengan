/* ================================
   NAVIGERING MELLAN VYER (SKÄRMAR)
   ================================ */

// Alla "skärmar" i appen - bara en är synlig åt gången (den med klassen "active")
const screens = document.querySelectorAll(".screen");

// Håller koll på vilken skärm vi är på just nu, och vilken skärm
// "Kommer snart"-sidan ska gå tillbaka till (den kan nås från flera olika ställen).
let currentScreenId = "screen-landing";
let placeholderBackTarget = "screen-menu";

function showScreen(id) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === id);
  });
  currentScreenId = id;
}

// Alla knappar som har ett "data-target"-attribut byter skärm när man klickar på dem.
// Det gäller både menyknapparna och alla "Tillbaka"-knappar.
document.querySelectorAll("[data-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;

    // Om vi är på väg till "Kommer snart"-sidan, kom ihåg varifrån vi kom
    // (så "Tillbaka"-knappen där vet vart den ska ta oss), och sätt rubriken.
    if (targetId === "screen-placeholder") {
      placeholderBackTarget = currentScreenId;
      document.getElementById("placeholder-title").textContent =
        button.dataset.placeholderTitle || "Kommer snart";
    }

    showScreen(targetId);
  });
});

// "Tillbaka"-knappen på "Kommer snart"-sidan använder platsen vi kom ifrån.
document.getElementById("placeholder-back").addEventListener("click", () => {
  showScreen(placeholderBackTarget);
});


/* ================================
   HIRAGANA-LEKTIONEN (oförändrad logik från tidigare)
   ================================ */

let currentIndex = 0;

const characterEl = document.getElementById("character");
const romajiEl = document.getElementById("romaji");
const progressEl = document.getElementById("progress");
const revealBtn = document.getElementById("reveal-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const strokeGifEl = document.getElementById("stroke-gif");
const strokeStaticEl = document.getElementById("stroke-static");

function strokeOrderGifUrl(char) {
  const filename = `Hiragana_${char}_stroke_order_animation.gif`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

function strokeOrderStaticUrl(char) {
  const codePoint = char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  const filename = `${char} - U+0${codePoint}- KanjiVG stroke order.svg`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

function renderCharacter() {
  const item = HIRAGANA[currentIndex];

  characterEl.textContent = item.char;
  romajiEl.textContent = "?";
  romajiEl.classList.remove("visible");
  progressEl.textContent = `${currentIndex + 1} / ${HIRAGANA.length}`;
  strokeStaticEl.src = strokeOrderStaticUrl(item.char);
  strokeStaticEl.alt = `Numrerad streckordning för ${item.char}`;
  strokeGifEl.src = strokeOrderGifUrl(item.char);
  strokeGifEl.alt = `Animerad streckordning för ${item.char}`;

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === HIRAGANA.length - 1;
}

revealBtn.addEventListener("click", () => {
  const item = HIRAGANA[currentIndex];
  romajiEl.textContent = item.romaji;
  romajiEl.classList.add("visible");
});

prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderCharacter();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < HIRAGANA.length - 1) {
    currentIndex++;
    renderCharacter();
  }
});

// Rita upp det första tecknet direkt, så lektionsvyn är redo när man klickar sig dit
renderCharacter();
