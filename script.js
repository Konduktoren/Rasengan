/* ================================
   LJUD (skapas direkt i webbläsaren, ingen ljudfil behövs)
   ================================ */

const SoundManager = (() => {
  let audioCtx = null;

  // AudioContext får bara skapas efter att användaren interagerat med sidan
  // (webbläsarregel), så vi skapar den först när ett ljud faktiskt ska spelas.
  function getContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Spelar en enkel ton: frekvens i Hz, när den ska starta (sekunder från nu),
  // hur länge den varar, vågform, och volym (0-1).
  function tone(freq, startDelay, duration, type, volume) {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);

    gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay);
    // Tonen tonas ut mjukt istället för att klippas av tvärt
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + startDelay);
    osc.stop(ctx.currentTime + startDelay + duration);
  }

  return {
    click() {
      tone(600, 0, 0.05, "sine", 0.05);
    },
    correct() {
      // Två toner som stiger - låter glatt
      tone(880, 0, 0.12, "sine", 0.12);
      tone(1318.5, 0.09, 0.18, "sine", 0.12);
    },
    incorrect() {
      // Två toner som sjunker och låter lite "buzzy" - tydligt men inte elakt
      tone(220, 0, 0.16, "sawtooth", 0.07);
      tone(160, 0.1, 0.22, "sawtooth", 0.07);
    },
  };
})();

// Subtilt klickljud på i princip alla knappar i appen. Quiz-svarsknapparna
// undantas här eftersom de istället får sitt eget rätt/fel-ljud (se längre ner).
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button && !button.classList.contains("quiz-option")) {
    SoundManager.click();
  }
});


/* ================================
   NAVIGERING MELLAN VYER (SKÄRMAR)
   ================================ */

const screens = document.querySelectorAll(".screen");

let currentScreenId = "screen-landing";
let placeholderBackTarget = "screen-menu";

function showScreen(id) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === id);
  });
  currentScreenId = id;
}

document.querySelectorAll("[data-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;

    if (targetId === "screen-placeholder") {
      placeholderBackTarget = currentScreenId;
      document.getElementById("placeholder-title").textContent =
        button.dataset.placeholderTitle || "Kommer snart";
    }

    showScreen(targetId);
  });
});

document.getElementById("placeholder-back").addEventListener("click", () => {
  showScreen(placeholderBackTarget);
});


/* ================================
   HIRAGANA-LEKTIONEN (nu uppdelad i rader)
   ================================ */

// Vilken rad (grupp) och vilket tecken inom raden vi tittar på just nu.
let groupIndex = 0;
let charIndexInGroup = 0;

const rowLabelEl = document.getElementById("row-label");
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
  const group = HIRAGANA_GROUPS[groupIndex];
  const item = group.chars[charIndexInGroup];

  rowLabelEl.textContent = `Rad ${groupIndex + 1} / ${HIRAGANA_GROUPS.length} · ${group.name}`;
  characterEl.textContent = item.char;
  romajiEl.textContent = "?";
  romajiEl.classList.remove("visible");
  progressEl.textContent = `${charIndexInGroup + 1} / ${group.chars.length}`;
  strokeStaticEl.src = strokeOrderStaticUrl(item.char);
  strokeStaticEl.alt = `Numrerad streckordning för ${item.char}`;
  strokeGifEl.src = strokeOrderGifUrl(item.char);
  strokeGifEl.alt = `Animerad streckordning för ${item.char}`;

  prevBtn.disabled = groupIndex === 0 && charIndexInGroup === 0;

  // På det sista tecknet i raden byter "Nästa"-knappen text och startar quizet istället.
  const isLastInGroup = charIndexInGroup === group.chars.length - 1;
  nextBtn.textContent = isLastInGroup ? "Starta quiz →" : "Nästa →";
}

revealBtn.addEventListener("click", () => {
  const group = HIRAGANA_GROUPS[groupIndex];
  const item = group.chars[charIndexInGroup];
  romajiEl.textContent = item.romaji;
  romajiEl.classList.add("visible");
});

prevBtn.addEventListener("click", () => {
  if (charIndexInGroup > 0) {
    charIndexInGroup--;
    renderCharacter();
  } else if (groupIndex > 0) {
    // Vi är på första tecknet i raden - gå till föregående rads sista tecken istället
    // så man kan bläddra tillbaka och repetera det man redan gått igenom.
    groupIndex--;
    charIndexInGroup = HIRAGANA_GROUPS[groupIndex].chars.length - 1;
    renderCharacter();
  }
});

nextBtn.addEventListener("click", () => {
  const group = HIRAGANA_GROUPS[groupIndex];
  if (charIndexInGroup < group.chars.length - 1) {
    charIndexInGroup++;
    renderCharacter();
  } else {
    startQuiz(group);
  }
});

renderCharacter();


/* ================================
   QUIZ (körs efter varje rad)
   ================================ */

const quizQuestionView = document.getElementById("quiz-question-view");
const quizResultView = document.getElementById("quiz-result-view");
const quizProgressEl = document.getElementById("quiz-progress");
const quizCharacterEl = document.getElementById("quiz-character");
const quizOptionsEl = document.getElementById("quiz-options");
const quizResultTextEl = document.getElementById("quiz-result-text");
const quizContinueBtn = document.getElementById("quiz-continue-btn");
const quizRetryBtn = document.getElementById("quiz-retry-btn");

let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

// Blandar en lista i slumpmässig ordning (Fisher-Yates), utan att ändra originallistan.
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Bygger fyra svarsalternativ för ett tecken: det rätta uttalet plus tre felaktiga,
// hämtade slumpmässigt från alla hiragana-tecken (så det inte alltid är samma "fel-svar").
function buildOptions(correctItem) {
  const distractorPool = ALL_HIRAGANA.filter((h) => h.romaji !== correctItem.romaji);
  const distractors = shuffle(distractorPool).slice(0, 3);
  return shuffle([correctItem, ...distractors]);
}

function startQuiz(group) {
  quizQuestions = shuffle(group.chars);
  quizIndex = 0;
  quizScore = 0;

  quizQuestionView.style.display = "flex";
  quizResultView.style.display = "none";

  showScreen("screen-quiz");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const item = quizQuestions[quizIndex];

  quizProgressEl.textContent = `Fråga ${quizIndex + 1} / ${quizQuestions.length}`;
  quizCharacterEl.textContent = item.char;

  const options = buildOptions(item);
  quizOptionsEl.innerHTML = "";

  options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = option.romaji;
    btn.addEventListener("click", () => selectAnswer(btn, option.romaji, item.romaji));
    quizOptionsEl.appendChild(btn);
  });
}

function selectAnswer(clickedBtn, chosenRomaji, correctRomaji) {
  // Stäng av alla knappar så man inte kan klicka igen på samma fråga
  const allButtons = quizOptionsEl.querySelectorAll(".quiz-option");
  allButtons.forEach((btn) => (btn.disabled = true));

  const isCorrect = chosenRomaji === correctRomaji;
  if (isCorrect) {
    quizScore++;
    clickedBtn.classList.add("correct");
    SoundManager.correct();
  } else {
    clickedBtn.classList.add("incorrect");
    SoundManager.incorrect();
    // Visa också vilket som var rätt svar
    allButtons.forEach((btn) => {
      if (btn.textContent === correctRomaji) {
        btn.classList.add("correct");
      }
    });
  }

  // Kort paus så man hinner se om man hade rätt, sen nästa fråga
  setTimeout(() => {
    quizIndex++;
    if (quizIndex < quizQuestions.length) {
      renderQuizQuestion();
    } else {
      showQuizResult();
    }
  }, 900);
}

function showQuizResult() {
  quizQuestionView.style.display = "none";
  quizResultView.style.display = "flex";
  quizResultTextEl.textContent = `Du fick ${quizScore} av ${quizQuestions.length} rätt!`;

  const isLastGroup = groupIndex === HIRAGANA_GROUPS.length - 1;
  quizContinueBtn.textContent = isLastGroup ? "Klar! Tillbaka till menyn" : "Nästa rad →";
}

quizContinueBtn.addEventListener("click", () => {
  const isLastGroup = groupIndex === HIRAGANA_GROUPS.length - 1;

  if (isLastGroup) {
    groupIndex = 0;
    charIndexInGroup = 0;
    renderCharacter();
    showScreen("screen-tecken-menu");
  } else {
    groupIndex++;
    charIndexInGroup = 0;
    renderCharacter();
    showScreen("screen-lesson");
  }
});

// Kör samma rads quiz igen, med nyblandad frågeordning
quizRetryBtn.addEventListener("click", () => {
  startQuiz(HIRAGANA_GROUPS[groupIndex]);
});


/* ================================
   INFO-RUTA (enkla förklaringar av varje alfabet)
   ================================ */

// Texterna är skrivna enkelt, för någon som aldrig sett japanska förut.
const INFO_CONTENT = {
  katakana: {
    title: "Om Katakana",
    body:
      "Katakana har samma 46 ljud som hiragana, fast med helt andra tecken. " +
      "Det används mest för ord som kommit in i japanskan från andra språk, " +
      "till exempel コーヒー (uttalas ungefär \"kōhī\" och betyder kaffe).",
  },
  kanji: {
    title: "Om Kanji",
    body:
      "Kanji är tecken som ursprungligen kommer från kinesiska. Det finns tusentals stycken, " +
      "och varje tecken har en egen betydelse - inte bara ett ljud, som i hiragana och katakana. " +
      "Det är den svåraste delen av japansk skrift, så vi tar den sist.",
  },
};

// Hittar vilken rad (t.ex. "sa") ett visst tecken tillhör, för exempelordet.
function findRowName(char) {
  const group = HIRAGANA_GROUPS.find((g) => g.chars.some((c) => c.char === char));
  return group ? group.name : "";
}

// Hittar uttalet för ett enskilt tecken, för exempelordet.
function findRomaji(char) {
  const item = ALL_HIRAGANA.find((h) => h.char === char);
  return item ? item.romaji : "";
}

// Bygger den visuella gojūon-tabellen (rader × vokaler) som HTML.
function renderGojuonTable() {
  const vowels = ["a", "i", "u", "e", "o"];

  let html = '<div class="gojuon-table">';

  // Rubrikrad med vokalerna
  html += '<div class="gojuon-cell gojuon-header"></div>';
  vowels.forEach((v) => {
    html += `<div class="gojuon-cell gojuon-header">${v}</div>`;
  });

  // En rad per konsonantgrupp
  GOJUON_TABLE.forEach((row) => {
    html += `<div class="gojuon-cell gojuon-row-label">${row.label}</div>`;
    row.cells.forEach((char) => {
      if (char === null) {
        html += '<div class="gojuon-cell gojuon-empty">–</div>';
      } else {
        html += `<div class="gojuon-cell"><span class="gojuon-char">${char}</span><span class="gojuon-romaji">${findRomaji(char)}</span></div>`;
      }
    });
  });

  html += "</div>";
  return html;
}

// Bygger illustrationen av exempelordet (tecken från olika rader satta ihop).
function renderExampleWord() {
  const blocks = EXAMPLE_WORD.chars
    .map((char) => {
      return `
        <div class="example-block">
          <span class="example-char">${char}</span>
          <span class="example-romaji">${findRomaji(char)}</span>
          <span class="example-row">${findRowName(char)}-raden</span>
        </div>`;
    })
    .join('<span class="example-plus">+</span>');

  return `
    <div class="example-word">${blocks}</div>
    <p class="example-result">= "${EXAMPLE_WORD.romaji}" · ${EXAMPLE_WORD.meaning}</p>
  `;
}

function buildHiraganaInfoHtml() {
  return `
    <p class="modal-body-text">
      Hiragana har 46 tecken, byggda som ett rutnät: varje rad delar samma inledande ljud
      (t.ex. "k"), och går sen igenom de fem vokalljuden a - i - u - e - o.
      Tomma rutor (–) betyder att den kombinationen inte finns i japanskan.
    </p>
    ${renderGojuonTable()}
    <p class="modal-note">
      Det finns även ett extra tecken, ん (n), som är ett eget ljud utan vokal efter -
      det får ingen egen ruta i tabellen.
    </p>
    <h4 class="modal-subheading">Så blir tecken till riktiga ord</h4>
    <p class="modal-body-text">
      Att skriva hela meningar kräver grammatik vi inte gått igenom än, men här ser du
      hur tre tecken från olika rader sätts ihop till ett riktigt japanskt ord:
    </p>
    ${renderExampleWord()}
  `;
}

const infoModal = document.getElementById("info-modal");
const modalCardEl = document.querySelector(".modal-card");
const modalTitleEl = document.getElementById("modal-title");
const modalBodyEl = document.getElementById("modal-body");
const modalCloseBtn = document.getElementById("modal-close");

document.querySelectorAll("[data-info]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.info;

    if (key === "hiragana") {
      modalCardEl.classList.add("modal-card-wide");
      modalTitleEl.textContent = "Om Hiragana";
      modalBodyEl.innerHTML = buildHiraganaInfoHtml();
    } else {
      modalCardEl.classList.remove("modal-card-wide");
      const content = INFO_CONTENT[key];
      modalTitleEl.textContent = content.title;
      modalBodyEl.innerHTML = `<p class="modal-body-text">${content.body}</p>`;
    }

    infoModal.classList.add("active");
  });
});

modalCloseBtn.addEventListener("click", () => {
  infoModal.classList.remove("active");
});

// Stäng även om man klickar på den mörka bakgrunden utanför själva rutan
infoModal.addEventListener("click", (event) => {
  if (event.target === infoModal) {
    infoModal.classList.remove("active");
  }
});

// "Fuska? Visa hela raden!" - en snabb fusklapp med alla tecken i den rad
// man håller på med just nu (både i lektionsvyn och under quizet).
function showCheatSheet() {
  const group = HIRAGANA_GROUPS[groupIndex];

  const rows = group.chars
    .map(
      (item) => `
        <div class="cheat-row">
          <span class="cheat-char">${item.char}</span>
          <span class="cheat-romaji">${item.romaji}</span>
        </div>`
    )
    .join("");

  modalCardEl.classList.remove("modal-card-wide");
  modalTitleEl.textContent = `${group.name}-raden`;
  modalBodyEl.innerHTML = `<div class="cheat-list">${rows}</div>`;
  infoModal.classList.add("active");
}

document.getElementById("cheat-btn").addEventListener("click", showCheatSheet);
document.getElementById("cheat-btn-quiz").addEventListener("click", showCheatSheet);
