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
    fanfare() {
      // Fyra stigande toner (ett litet ackord som byggs upp) - spelas vid 5/5 rätt
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        tone(freq, i * 0.09, 0.5, "triangle", 0.1);
      });
      // Ett avslutande ackord som klingar ut lite längre, för en "segerkänsla"
      tone(1046.5, 0.36, 0.9, "triangle", 0.09);
      tone(783.99, 0.36, 0.9, "triangle", 0.07);
    },
    gong() {
      // Syntetisk gonggong: en låg grundton + flera "skeva" (icke-heltaliga)
      // overtoner som klingar ut olika snabbt - det är den kombinationen som
      // ger den där metalliska, resonanta gong-känslan. Plus ett kort brus
      // i början som låter som själva slaget mot metallen.
      const ctx = getContext();
      const now = ctx.currentTime;
      const fundamental = 90;
      const partials = [1, 1.8, 2.4, 3.2, 4.1, 5.3];
      const duration = 3.2;

      partials.forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(fundamental * ratio, now);
        const partialVolume = 0.2 / (i + 1);
        gain.gain.setValueAtTime(partialVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration - i * 0.15);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      });

      // Kort metalliskt "slag"-brus i attacken
      const noiseLength = Math.floor(ctx.sampleRate * 0.05);
      const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLength; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = 2500;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.14, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      noiseSource.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
      noiseSource.start(now);
    },
  };
})();

// Subtilt klickljud på i princip alla knappar i appen. Quiz-svarsknapparna och
// Hai-knappen undantas här eftersom de istället har sina egna, tydligare ljud.
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button && !button.classList.contains("quiz-option") && !button.classList.contains("hai-btn")) {
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

// Ljudklipp du själv laddat upp och äger rättigheterna att använda personligt
const haiSound = new Audio("hai.mp3");
haiSound.preload = "auto";

const haiExpandEl = document.getElementById("hai-expand");

// Låter en kopia av Hai-knappen expandera från sin exakta position och storlek
// till att täcka hela skärmen, i ungefär samma takt som ljudklippet varar.
// Skärmen byts först när ljudet är klart (eller efter en säkerhets-timeout
// om ljudfilen av någon anledning inte kan spelas).
function playHaiTransition(hiButton, targetScreenId) {
  const rect = hiButton.getBoundingClientRect();
  hiButton.style.opacity = "0";

  haiExpandEl.style.transition = "none";
  haiExpandEl.style.top = `${rect.top}px`;
  haiExpandEl.style.left = `${rect.left}px`;
  haiExpandEl.style.width = `${rect.width}px`;
  haiExpandEl.style.height = `${rect.height}px`;
  haiExpandEl.style.borderRadius = "50%";
  haiExpandEl.style.opacity = "1";

  // Tvingar webbläsaren att rita ut startläget innan vi ändrar till slutläget,
  // annars hinner den aldrig visa startpositionen och hoppar direkt till slutet.
  void haiExpandEl.offsetWidth;

  const hasKnownDuration = haiSound.duration && isFinite(haiSound.duration) && haiSound.duration > 0;
  const duration = hasKnownDuration
    ? Math.min(Math.max(haiSound.duration, 0.6), 2.5)
    : 1.1;

  haiExpandEl.style.transition =
    `top ${duration}s cubic-bezier(.65,0,.35,1), ` +
    `left ${duration}s cubic-bezier(.65,0,.35,1), ` +
    `width ${duration}s cubic-bezier(.65,0,.35,1), ` +
    `height ${duration}s cubic-bezier(.65,0,.35,1), ` +
    `border-radius ${duration}s ease`;

  haiExpandEl.style.top = "0px";
  haiExpandEl.style.left = "0px";
  haiExpandEl.style.width = "100vw";
  haiExpandEl.style.height = "100vh";
  haiExpandEl.style.borderRadius = "0px";

  haiSound.currentTime = 0;
  haiSound.play();

  let hasFinished = false;
  function finishTransition() {
    if (hasFinished) return;
    hasFinished = true;

    showScreen(targetScreenId);

    // Tona bort expansionsytan igen, redo för nästa gång
    haiExpandEl.style.transition = "opacity 0.3s ease";
    haiExpandEl.style.opacity = "0";
    hiButton.style.opacity = "";
  }

  haiSound.addEventListener("ended", finishTransition, { once: true });
  // Säkerhetsnät ifall ljudet inte kan spelas (t.ex. saknad fil) - byt vy ändå
  setTimeout(finishTransition, duration * 1000 + 300);
}

document.querySelectorAll("[data-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;

    if (button.classList.contains("hai-btn")) {
      playHaiTransition(button, targetId);
      return;
    }

    // Om knappen pekar på ett specifikt alfabet (Hiragana/Katakana-rutorna),
    // byt aktivt alfabet och börja om från första raden och första tecknet.
    if (button.dataset.alphabet) {
      currentAlphabet = button.dataset.alphabet;
      groupIndex = 0;
      charIndexInGroup = 0;
      renderCharacter();
    }

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

// Vilket alfabet (hiragana/katakana) samt vilken rad och vilket tecken inom
// raden vi tittar på just nu.
let currentAlphabet = "hiragana";
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
  const prefix = ALPHABETS[currentAlphabet].strokeNamePrefix;
  const filename = `${prefix}_${char}_stroke_order_animation.gif`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

function strokeOrderStaticUrl(char) {
  const codePoint = char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  const filename = `${char} - U+0${codePoint}- KanjiVG stroke order.svg`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

function renderCharacter() {
  const alphabet = ALPHABETS[currentAlphabet];
  const group = alphabet.groups[groupIndex];
  const item = group.chars[charIndexInGroup];

  rowLabelEl.textContent = `${alphabet.label} · Rad ${groupIndex + 1} / ${alphabet.groups.length} · ${group.name}`;
  characterEl.textContent = item.char;

  // Kör en liten "pop"-animation varje gång tecknet byts - vi tar bort och
  // sätter tillbaka klassen så animationen triggas igen även om den redan kördes.
  characterEl.classList.remove("char-pop");
  void characterEl.offsetWidth;
  characterEl.classList.add("char-pop");

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
  const group = ALPHABETS[currentAlphabet].groups[groupIndex];
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
    charIndexInGroup = ALPHABETS[currentAlphabet].groups[groupIndex].chars.length - 1;
    renderCharacter();
  }
});

nextBtn.addEventListener("click", () => {
  const group = ALPHABETS[currentAlphabet].groups[groupIndex];
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
  const distractorPool = ALPHABETS[currentAlphabet].all.filter((h) => h.romaji !== correctItem.romaji);
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

  const isLastGroup = groupIndex === ALPHABETS[currentAlphabet].groups.length - 1;
  quizContinueBtn.textContent = isLastGroup ? "Klar! Tillbaka till menyn" : "Nästa rad →";

  // Fira med konfetti och fanfar om man fick allt rätt!
  if (quizScore === quizQuestions.length) {
    launchConfetti();
    SoundManager.fanfare();
  }
}

quizContinueBtn.addEventListener("click", () => {
  const isLastGroup = groupIndex === ALPHABETS[currentAlphabet].groups.length - 1;

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
  startQuiz(ALPHABETS[currentAlphabet].groups[groupIndex]);
});


/* ================================
   INFO-RUTA (enkla förklaringar av varje alfabet)
   ================================ */

// Texterna är skrivna enkelt, för någon som aldrig sett japanska förut.
const INFO_CONTENT = {
  kanji: {
    title: "Om Kanji",
    body:
      "Kanji är tecken som ursprungligen kommer från kinesiska. Det finns tusentals stycken, " +
      "och varje tecken har en egen betydelse - inte bara ett ljud, som i hiragana och katakana. " +
      "Det är den svåraste delen av japansk skrift, så vi tar den sist.",
  },
};

// Hittar vilken rad (t.ex. "sa") ett visst tecken tillhör, för exempelordet.
function findRowName(char, groups) {
  const group = groups.find((g) => g.chars.some((c) => c.char === char));
  return group ? group.name : "";
}

// Hittar uttalet för ett enskilt tecken, för exempelordet.
function findRomaji(char, allChars) {
  const item = allChars.find((h) => h.char === char);
  return item ? item.romaji : "";
}

// Bygger den visuella gojūon-tabellen (rader × vokaler) som HTML.
function renderGojuonTable(table, allChars) {
  const vowels = ["a", "i", "u", "e", "o"];

  let html = '<div class="gojuon-table">';

  // Rubrikrad med vokalerna
  html += '<div class="gojuon-cell gojuon-header"></div>';
  vowels.forEach((v) => {
    html += `<div class="gojuon-cell gojuon-header">${v}</div>`;
  });

  // En rad per konsonantgrupp
  table.forEach((row) => {
    html += `<div class="gojuon-cell gojuon-row-label">${row.label}</div>`;
    row.cells.forEach((char) => {
      if (char === null) {
        html += '<div class="gojuon-cell gojuon-empty">–</div>';
      } else {
        html += `<div class="gojuon-cell"><span class="gojuon-char">${char}</span><span class="gojuon-romaji">${findRomaji(char, allChars)}</span></div>`;
      }
    });
  });

  html += "</div>";
  return html;
}

// Bygger illustrationen av exempelordet (tecken från olika rader satta ihop).
function renderExampleWord(exampleWord, groups, allChars) {
  const blocks = exampleWord.chars
    .map((char) => {
      return `
        <div class="example-block">
          <span class="example-char">${char}</span>
          <span class="example-romaji">${findRomaji(char, allChars)}</span>
          <span class="example-row">${findRowName(char, groups)}-raden</span>
        </div>`;
    })
    .join('<span class="example-plus">+</span>');

  return `
    <div class="example-word">${blocks}</div>
    <p class="example-result">= "${exampleWord.romaji}" · ${exampleWord.meaning}</p>
  `;
}

function buildAlphabetInfoHtml(key) {
  const alphabet = ALPHABETS[key];
  return `
    <p class="modal-body-text">
      ${alphabet.label} har 46 tecken, byggda som ett rutnät: varje rad delar samma inledande ljud
      (t.ex. "k"), och går sen igenom de fem vokalljuden a - i - u - e - o.
      Tomma rutor (–) betyder att den kombinationen inte finns i japanskan.
    </p>
    ${renderGojuonTable(alphabet.gojuonTable, alphabet.all)}
    <p class="modal-note">
      Det finns även ett extra tecken (n-ljudet), som är ett eget ljud utan vokal efter -
      det får ingen egen ruta i tabellen.
    </p>
    <h4 class="modal-subheading">Så blir tecken till riktiga ord</h4>
    <p class="modal-body-text">
      Att skriva hela meningar kräver grammatik vi inte gått igenom än, men här ser du
      hur tre tecken från olika rader sätts ihop till ett riktigt japanskt ord:
    </p>
    ${renderExampleWord(alphabet.exampleWord, alphabet.groups, alphabet.all)}
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

    if (ALPHABETS[key]) {
      modalCardEl.classList.add("modal-card-wide");
      modalTitleEl.textContent = `Om ${ALPHABETS[key].label}`;
      modalBodyEl.innerHTML = buildAlphabetInfoHtml(key);
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
  const group = ALPHABETS[currentAlphabet].groups[groupIndex];

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


/* ================================
   SKRIVLÄGE (rita tecknet med mus eller finger)
   ================================ */

const writeCanvas = document.getElementById("write-canvas");
const writeCtx = writeCanvas.getContext("2d");
const writeRomajiEl = document.getElementById("write-romaji");
const writeGhostEl = document.getElementById("write-ghost");
const writeProgressEl = document.getElementById("write-progress");
const writeClearBtn = document.getElementById("write-clear-btn");
const writeGhostToggleBtn = document.getElementById("write-ghost-toggle");
const writePrevBtn = document.getElementById("write-prev-btn");
const writeNextBtn = document.getElementById("write-next-btn");

writeCtx.lineWidth = 8;
writeCtx.lineCap = "round";
writeCtx.lineJoin = "round";
writeCtx.strokeStyle = "#141210";

let isDrawing = false;

// Räknar om ett mus-/pekskärmsklick till rätt koordinat på själva ritytan,
// även om den visas i en annan storlek på skärmen än sin interna upplösning.
function getCanvasPos(event) {
  const rect = writeCanvas.getBoundingClientRect();
  const scaleX = writeCanvas.width / rect.width;
  const scaleY = writeCanvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function startDrawing(event) {
  isDrawing = true;
  writeCanvas.setPointerCapture(event.pointerId);
  const pos = getCanvasPos(event);
  writeCtx.beginPath();
  writeCtx.moveTo(pos.x, pos.y);
}

function drawMove(event) {
  if (!isDrawing) return;
  const pos = getCanvasPos(event);
  writeCtx.lineTo(pos.x, pos.y);
  writeCtx.stroke();
}

function stopDrawing() {
  isDrawing = false;
}

// "Pointer events" fungerar likadant för både mus och finger - vi behöver
// inte skriva separat kod för touch och mus.
writeCanvas.addEventListener("pointerdown", startDrawing);
writeCanvas.addEventListener("pointermove", drawMove);
writeCanvas.addEventListener("pointerup", stopDrawing);
writeCanvas.addEventListener("pointerleave", stopDrawing);

function clearCanvas() {
  writeCtx.clearRect(0, 0, writeCanvas.width, writeCanvas.height);
}

writeClearBtn.addEventListener("click", clearCanvas);

writeGhostToggleBtn.addEventListener("click", () => {
  const isVisible = writeGhostEl.classList.toggle("visible");
  writeGhostToggleBtn.textContent = isVisible ? "Dölj spökbild" : "Visa spökbild";
});

function renderWriteScreen() {
  const alphabet = ALPHABETS[currentAlphabet];
  const group = alphabet.groups[groupIndex];
  const item = group.chars[charIndexInGroup];

  writeRomajiEl.textContent = item.romaji;
  writeGhostEl.textContent = item.char;
  writeProgressEl.textContent = `${charIndexInGroup + 1} / ${group.chars.length}`;

  // Ny sida - rensa ritytan och göm spökbilden igen, så man tränar minnet varje gång
  clearCanvas();
  writeGhostEl.classList.remove("visible");
  writeGhostToggleBtn.textContent = "Visa spökbild";

  writePrevBtn.disabled = groupIndex === 0 && charIndexInGroup === 0;
  writeNextBtn.disabled =
    groupIndex === alphabet.groups.length - 1 &&
    charIndexInGroup === group.chars.length - 1;
}

writePrevBtn.addEventListener("click", () => {
  if (charIndexInGroup > 0) {
    charIndexInGroup--;
    renderWriteScreen();
  } else if (groupIndex > 0) {
    groupIndex--;
    charIndexInGroup = ALPHABETS[currentAlphabet].groups[groupIndex].chars.length - 1;
    renderWriteScreen();
  }
});

writeNextBtn.addEventListener("click", () => {
  const alphabet = ALPHABETS[currentAlphabet];
  const group = alphabet.groups[groupIndex];
  if (charIndexInGroup < group.chars.length - 1) {
    charIndexInGroup++;
    renderWriteScreen();
  } else if (groupIndex < alphabet.groups.length - 1) {
    groupIndex++;
    charIndexInGroup = 0;
    renderWriteScreen();
  }
});

document.getElementById("write-mode-btn").addEventListener("click", () => {
  renderWriteScreen();
  showScreen("screen-write");
});


/* ================================
   KONFETTI (firas när man får 5/5 rätt på ett quiz)
   ================================ */

const confettiCanvas = document.getElementById("confetti-canvas");
const confettiCtx = confettiCanvas.getContext("2d");

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfettiCanvas);
resizeConfettiCanvas();

let confettiParticles = [];
let confettiIsAnimating = false;

// Skjuter ut ett gäng små rektanglar från mitten av skärmen, i olika
// riktningar och hastigheter, som sen faller ner med gravitation.
function launchConfetti() {
  const colors = ["#F2660D", "#FF9142", "#FFD166", "#D6D9DC", "#FFFFFF"];
  const originX = confettiCanvas.width / 2;
  const originY = confettiCanvas.height / 2;
  const particleCount = 120;

  confettiParticles = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    confettiParticles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      life: 1,
    });
  }

  if (!confettiIsAnimating) {
    confettiIsAnimating = true;
    requestAnimationFrame(updateConfetti);
  }
}

function updateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  let anyAlive = false;

  confettiParticles.forEach((p) => {
    p.vy += 0.09; // gravitation drar partiklarna nedåt över tid (lägre värde = långsammare fall)
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;
    p.life -= 0.006; // lägre värde = konfettin klingar ut långsammare

    if (p.life > 0) {
      anyAlive = true;
      confettiCtx.save();
      confettiCtx.globalAlpha = Math.max(p.life, 0);
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rotation);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      confettiCtx.restore();
    }
  });

  if (anyAlive) {
    requestAnimationFrame(updateConfetti);
  } else {
    confettiIsAnimating = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}
