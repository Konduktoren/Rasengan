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

// Låter Go!-knappen snurra runt sin egen axel som ett mynt på ett bord,
// lika länge som ljudklippet varar (bromsar in mot slutet), och hoppar
// sedan in i nästa vy.
function playHaiTransition(hiButton, targetScreenId) {
  const hasKnownDuration = haiSound.duration && isFinite(haiSound.duration) && haiSound.duration > 0;
  const duration = hasKnownDuration
    ? Math.min(Math.max(haiSound.duration, 0.5), 3)
    : 0.9;

  hiButton.style.animationDuration = `${duration}s`;
  hiButton.classList.add("hai-spin");

  haiSound.currentTime = 0;
  haiSound.play();

  let hasFinished = false;
  function finishTransition() {
    if (hasFinished) return;
    hasFinished = true;

    showScreen(targetScreenId);
    hiButton.classList.remove("hai-spin");
    hiButton.style.animationDuration = "";
  }

  haiSound.addEventListener("ended", finishTransition, { once: true });
  // Säkerhetsnät ifall ljudet inte kan spelas (t.ex. saknad fil) - byt vy ändå
  setTimeout(finishTransition, duration * 1000 + 200);
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
const rowLabelEyebrowEl = document.getElementById("row-label-eyebrow");
const rowLabelSubEl = document.getElementById("row-label-sub");
const characterEl = document.getElementById("character");
const romajiEl = document.getElementById("romaji");
const progressDotsEl = document.getElementById("progress-dots");
const progressTextEl = document.getElementById("progress-text");
const revealBtn = document.getElementById("reveal-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const strokeGifEl = document.getElementById("stroke-gif");
const strokeStaticEl = document.getElementById("stroke-static");

// Stavnings-läget (Läsa)
const charModeContentEl = document.getElementById("char-mode-content");
const spellModeContentEl = document.getElementById("spell-mode-content");
const spellReferenceCardEl = document.getElementById("spell-reference-card");
const spellMeaningEl = document.getElementById("spell-meaning");
const spellAnswerEl = document.getElementById("spell-answer");
const spellUndoBtn = document.getElementById("spell-undo-btn");
const spellClearBtn = document.getElementById("spell-clear-btn");
const spellCheckBtn = document.getElementById("spell-check-btn");
const spellFeedbackEl = document.getElementById("spell-feedback");
const spellHiraganaGridEl = document.getElementById("spell-hiragana-grid");
const spellKatakanaGridEl = document.getElementById("spell-katakana-grid");
const fullRefBtnEl = document.getElementById("full-ref-btn");

let spellAnswer = [];

// Bygger de klickbara rutnäten en gång - samma tecken oavsett vilket ord
// man tittar på, så vi behöver bara göra det här en gång vid sidladdning.
function buildSpellGrid(gridEl, allChars) {
  gridEl.innerHTML = allChars
    .map(
      (item) => `
        <button type="button" class="full-ref-cell spell-grid-btn" data-char="${item.char}">
          <span class="gojuon-char">${item.char}</span>
          <span class="gojuon-romaji">${item.romaji}</span>
        </button>`
    )
    .join("");

  gridEl.querySelectorAll(".spell-grid-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      spellAnswer.push(btn.dataset.char);
      renderSpellAnswer();
    });
  });
}

buildSpellGrid(spellHiraganaGridEl, ALL_HIRAGANA);
buildSpellGrid(spellKatakanaGridEl, ALL_KATAKANA);

// Ritar upp svarsrutan utifrån vilka tecken man klickat ihop hittills.
function renderSpellAnswer() {
  spellFeedbackEl.textContent = "";
  spellFeedbackEl.className = "spell-feedback";

  if (spellAnswer.length === 0) {
    spellAnswerEl.innerHTML = '<span class="spell-placeholder">Klicka tecken nedan för att bygga ordet</span>';
    return;
  }

  spellAnswerEl.innerHTML = spellAnswer
    .map((char) => `<span class="spell-answer-char">${char}</span>`)
    .join("");
}

spellUndoBtn.addEventListener("click", () => {
  spellAnswer.pop();
  renderSpellAnswer();
});

spellClearBtn.addEventListener("click", () => {
  spellAnswer = [];
  renderSpellAnswer();
});

spellCheckBtn.addEventListener("click", () => {
  const group = ALPHABETS.vocabulary.groups[groupIndex];
  const item = group.chars[charIndexInGroup];
  const givenAnswer = spellAnswer.join("");

  if (givenAnswer === item.char) {
    spellFeedbackEl.textContent = "Rätt! 🎉";
    spellFeedbackEl.className = "spell-feedback spell-correct";
    SoundManager.correct();
  } else {
    spellFeedbackEl.textContent = `Inte riktigt - rätt svar är ${item.char}`;
    spellFeedbackEl.className = "spell-feedback spell-incorrect";
    SoundManager.incorrect();
  }
});

function strokeOrderGifUrl(char) {
  const alphabet = ALPHABETS[currentAlphabet];

  // Wikimedia namnger filerna olika för kana och kanji:
  //   kana  -> "Hiragana_あ_stroke_order_animation.gif"
  //   kanji -> "山-order.gif"
  const filename =
    alphabet.strokeStyle === "kanji"
      ? `${char}-order.gif`
      : `${alphabet.strokeNamePrefix}_${char}_stroke_order_animation.gif`;

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

function strokeOrderStaticUrl(char) {
  const codePoint = char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  const filename = `${char} - U+0${codePoint}- KanjiVG stroke order.svg`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

// Texten som visas när man klickar "Visa uttal"/"Visa betydelse".
// För kana räcker uttalet; för kanji vill vi se både betydelse och uttal.
function answerTextFor(item) {
  if (ALPHABETS[currentAlphabet].quizKey === "meaning") {
    return `${item.meaning}  ·  ${item.romaji}`;
  }
  return item.romaji;
}

function renderCharacter() {
  const alphabet = ALPHABETS[currentAlphabet];
  const group = alphabet.groups[groupIndex];
  const item = group.chars[charIndexInGroup];
  const isSpellMode = currentAlphabet === "vocabulary";

  // Kanji grupperas efter tema, inte efter ljud-rader - så vi kallar det "Grupp".
  const groupWord = alphabet.strokeStyle === "kanji" ? "Grupp" : "Rad";
  rowLabelEyebrowEl.textContent = alphabet.label;
  rowLabelSubEl.textContent = `${groupWord} ${groupIndex + 1} / ${alphabet.groups.length} · ${group.name}`;

  // Läsa-delen visar ett helt annat kortinnehåll: betydelsen + en rityta att
  // stava ordet med, istället för det stora tecknet.
  charModeContentEl.style.display = isSpellMode ? "none" : "";
  spellModeContentEl.style.display = isSpellMode ? "flex" : "none";
  spellReferenceCardEl.style.display = isSpellMode ? "flex" : "none";
  fullRefBtnEl.style.display = isSpellMode ? "none" : "";
  document.getElementById("cheat-btn").style.display = isSpellMode ? "none" : "";

  if (isSpellMode) {
    spellMeaningEl.textContent = item.meaning;
    spellAnswer = [];
    renderSpellAnswer();
  } else {
    characterEl.textContent = item.char;

    // Ord i Läsa-delen kan vara flera tecken långa - krymp texten efter behov
    // så längre ord alltid får plats snyggt i kortet.
    const charCount = item.char.length;
    if (charCount <= 1) {
      characterEl.style.fontSize = "6.5rem";
    } else if (charCount === 2) {
      characterEl.style.fontSize = "5rem";
    } else if (charCount === 3) {
      characterEl.style.fontSize = "4rem";
    } else {
      characterEl.style.fontSize = "3.1rem";
    }

    // Kör en liten "pop"-animation varje gång tecknet byts - vi tar bort och
    // sätter tillbaka klassen så animationen triggas igen även om den redan kördes.
    characterEl.classList.remove("char-pop");
    void characterEl.offsetWidth;
    characterEl.classList.add("char-pop");

    romajiEl.textContent = "?";
    romajiEl.classList.remove("visible");
    romajiEl.classList.toggle("meaning-mode", alphabet.quizKey === "meaning");
    revealBtn.textContent = alphabet.revealLabel;
  }

  // Rita ut en liten prick per tecken i raden, med den aktuella markerad
  progressTextEl.textContent = `${charIndexInGroup + 1} / ${group.chars.length}`;
  progressDotsEl.innerHTML = group.chars
    .map((_, idx) => `<span class="dot${idx === charIndexInGroup ? " dot-current" : ""}"></span>`)
    .join("");

  // Streckordning och skrivläge behövs bara för enskilda tecken (kana/kanji),
  // inte för hela ord i Läsa-delen - göm de delarna helt då.
  const strokeCardEl = document.querySelector(".stroke-card");
  const writeModeBtnEl = document.getElementById("write-mode-btn");
  const hasStrokeInfo = alphabet.strokeStyle !== "none";

  strokeCardEl.style.display = hasStrokeInfo ? "" : "none";
  writeModeBtnEl.style.display = hasStrokeInfo ? "" : "none";

  if (hasStrokeInfo) {
    showStrokeImage(strokeStaticEl, strokeOrderStaticUrl(item.char), `Numrerad streckordning för ${item.char}`);
    showStrokeImage(strokeGifEl, strokeOrderGifUrl(item.char), `Animerad streckordning för ${item.char}`);
  }

  // Bakåt-knappen ska gå till Tecken-menyn normalt, men till huvudmenyn om
  // man kom hit via "Läsa" (som inte har något mellansteg för alfabetval).
  const lessonBackBtn = document.querySelector("#screen-lesson .back-btn");
  lessonBackBtn.dataset.target =
    currentAlphabet === "vocabulary" ? "screen-menu" : "screen-tecken-menu";

  prevBtn.disabled = groupIndex === 0 && charIndexInGroup === 0;

  // På det sista tecknet i raden byter "Nästa"-knappen text och startar quizet istället.
  const isLastInGroup = charIndexInGroup === group.chars.length - 1;
  nextBtn.textContent = isLastInGroup ? "Quiz →" : "Nästa →";
}

// Alla tecken har inte en färdig streckordningsbild på Wikimedia. Istället för
// att visa en trasig bild-ikon gömmer vi rutan helt om bilden inte kan laddas.
function showStrokeImage(imgEl, url, altText) {
  const block = imgEl.closest(".stroke-block");
  block.style.display = "";
  imgEl.alt = altText;
  imgEl.onerror = () => {
    block.style.display = "none";
  };
  imgEl.src = url;
}

revealBtn.addEventListener("click", () => {
  const group = ALPHABETS[currentAlphabet].groups[groupIndex];
  const item = group.chars[charIndexInGroup];
  romajiEl.textContent = answerTextFor(item);
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

// Klick på radetiketten öppnar en lista över alla rader/grupper i det aktuella
// alfabetet, så man kan hoppa direkt dit istället för att alltid börja om.
rowLabelEl.addEventListener("click", () => {
  const alphabet = ALPHABETS[currentAlphabet];
  const groupWord = alphabet.strokeStyle === "kanji" ? "Grupp" : "Rad";

  const rows = alphabet.groups
    .map((group, idx) => {
      const preview = group.chars.map((c) => c.char).join(" ");
      const isCurrent = idx === groupIndex;
      const isDone = completedRows.has(`${currentAlphabet}:${group.name}`);
      const checkmark = isDone ? '<span class="row-picker-check">✓</span>' : "";
      return `
        <button class="row-picker-item${isCurrent ? " current" : ""}" data-jump-group="${idx}">
          <span class="row-picker-name">${groupWord} ${idx + 1} · ${group.name} ${checkmark}</span>
          <span class="row-picker-chars">${preview}</span>
        </button>`;
    })
    .join("");

  modalCardEl.classList.remove("modal-card-wide");
  modalTitleEl.textContent = `Välj ${groupWord.toLowerCase()}`;
  modalBodyEl.innerHTML = `<div class="row-picker-list">${rows}</div>`;
  infoModal.classList.add("active");

  modalBodyEl.querySelectorAll("[data-jump-group]").forEach((btn) => {
    btn.addEventListener("click", () => {
      groupIndex = parseInt(btn.dataset.jumpGroup, 10);
      charIndexInGroup = 0;
      renderCharacter();
      infoModal.classList.remove("active");
    });
  });
});


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

// Vad quizet frågar efter: uttalet för kana, betydelsen för kanji.
function quizAnswerOf(item) {
  return item[ALPHABETS[currentAlphabet].quizKey];
}

// Bygger fyra svarsalternativ för ett tecken: det rätta svaret plus tre felaktiga,
// hämtade slumpmässigt från hela alfabetet (så det inte alltid är samma "fel-svar").
function buildOptions(correctItem) {
  const correctAnswer = quizAnswerOf(correctItem);
  const distractorPool = ALPHABETS[currentAlphabet].all.filter(
    (h) => quizAnswerOf(h) !== correctAnswer
  );
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
  const quizCharCount = item.char.length;
  if (quizCharCount <= 1) {
    quizCharacterEl.style.fontSize = "6.5rem";
  } else if (quizCharCount === 2) {
    quizCharacterEl.style.fontSize = "5rem";
  } else if (quizCharCount === 3) {
    quizCharacterEl.style.fontSize = "4rem";
  } else {
    quizCharacterEl.style.fontSize = "3.1rem";
  }

  const options = buildOptions(item);
  quizOptionsEl.innerHTML = "";

  // Kanji-betydelser är längre text än "ka"/"shi", så knapparna får mer plats
  quizOptionsEl.classList.toggle(
    "quiz-options-wide",
    ALPHABETS[currentAlphabet].quizKey === "meaning"
  );

  options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = quizAnswerOf(option);
    btn.addEventListener("click", () =>
      selectAnswer(btn, quizAnswerOf(option), quizAnswerOf(item))
    );
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

  // Spara att raden är avklarad, om man är inloggad
  saveRowProgress();

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
    showScreen(currentAlphabet === "vocabulary" ? "screen-menu" : "screen-tecken-menu");
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

// Kanji har ingen gojūon-tabell att visa, så den får en egen förklaring
// med en översikt över temagrupperna istället.
function buildKanjiInfoHtml() {
  const alphabet = ALPHABETS.kanji;

  const groupList = alphabet.groups
    .map((group) => {
      const preview = group.chars.map((c) => c.char).join(" ");
      return `
        <div class="kanji-group-row">
          <span class="kanji-group-name">${group.name}</span>
          <span class="kanji-group-chars">${preview}</span>
        </div>`;
    })
    .join("");

  return `
    <p class="modal-body-text">
      Kanji fungerar helt annorlunda än hiragana och katakana. Där stod varje tecken
      för ett <em>ljud</em> - här står varje tecken för en <em>betydelse</em>.
      Tecknet 山 betyder "berg", oavsett hur det uttalas.
    </p>
    <p class="modal-body-text">
      Det finns tusentals kanji, så det går inte att lära sig alla på en gång.
      Vi börjar med ett urval av de första japanska skolbarn lär sig, grupperade efter tema:
    </p>
    <div class="kanji-group-list">${groupList}</div>
    <h4 class="modal-subheading">Tecken blir ord</h4>
    <p class="modal-body-text">
      Kanji sätts ofta ihop två och två till nya ord. Det här är extra praktiskt
      att känna igen när du väl står på en japansk station:
    </p>
    <div class="example-word">
      <div class="example-block">
        <span class="example-char">出</span>
        <span class="example-romaji">ut</span>
      </div>
      <span class="example-plus">+</span>
      <div class="example-block">
        <span class="example-char">口</span>
        <span class="example-romaji">öppning</span>
      </div>
    </div>
    <p class="example-result">= 出口 "deguchi" · utgång</p>
    <p class="modal-note">
      De flesta kanji har dessutom flera olika uttal beroende på sammanhang.
      Vi visar bara det vanligaste här, så det inte blir för mycket på en gång.
    </p>
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

    if (!ALPHABETS[key]) return;

    modalCardEl.classList.add("modal-card-wide");
    modalTitleEl.textContent = `Om ${ALPHABETS[key].label}`;
    modalBodyEl.innerHTML =
      key === "kanji" ? buildKanjiInfoHtml() : buildAlphabetInfoHtml(key);

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
          <span class="cheat-romaji">${answerTextFor(item)}</span>
        </div>`
    )
    .join("");

  const alphabet = ALPHABETS[currentAlphabet];
  const isMeaningMode = alphabet.quizKey === "meaning";

  modalCardEl.classList.remove("modal-card-wide");
  modalTitleEl.textContent = isMeaningMode ? group.name : `${group.name}-raden`;
  modalBodyEl.innerHTML =
    `<div class="cheat-list${isMeaningMode ? " meaning-mode" : ""}">${rows}</div>`;
  infoModal.classList.add("active");
}

document.getElementById("cheat-btn").addEventListener("click", showCheatSheet);
document.getElementById("cheat-btn-quiz").addEventListener("click", showCheatSheet);

// Visar ALLA tecken i hela den aktuella modulen (inte bara aktuell rad) -
// extra användbart i Läsa-delen där ord kan blanda tecken från olika rader.
function showFullReference() {
  const alphabet = ALPHABETS[currentAlphabet];

  modalCardEl.classList.add("modal-card-wide");

  if (currentAlphabet === "vocabulary") {
    // Orden i Läsa-delen är byggda av hiragana/katakana - visa de underliggande
    // alfabeten (inte ordlistan) så man kan slå upp enskilda ljud och pussla
    // ihop ordet själv.
    modalTitleEl.textContent = "Alla tecken · Hiragana & Katakana";
    modalBodyEl.innerHTML = `
      <h4 class="modal-subheading">Hiragana</h4>
      ${renderGojuonTable(GOJUON_TABLE, ALL_HIRAGANA)}
      <h4 class="modal-subheading">Katakana</h4>
      ${renderGojuonTable(KATAKANA_GOJUON_TABLE, ALL_KATAKANA)}
    `;
  } else if (alphabet.gojuonTable) {
    // Hiragana/Katakana har en naturlig rad×vokal-struktur - återanvänd
    // samma tabell som i infomodalen.
    modalTitleEl.textContent = `Alla tecken · ${alphabet.label}`;
    modalBodyEl.innerHTML = renderGojuonTable(alphabet.gojuonTable, alphabet.all);
  } else {
    // Kanji är redan enskilda tecken - visa ett fritt rutnät med alla.
    modalTitleEl.textContent = `Alla tecken · ${alphabet.label}`;
    const cells = alphabet.all
      .map(
        (item) => `
          <div class="full-ref-cell">
            <span class="gojuon-char">${item.char}</span>
            <span class="gojuon-romaji">${answerTextFor(item)}</span>
          </div>`
      )
      .join("");
    modalBodyEl.innerHTML = `<div class="full-ref-grid">${cells}</div>`;
  }

  infoModal.classList.add("active");
}

document.getElementById("full-ref-btn").addEventListener("click", showFullReference);


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

  writeRomajiEl.textContent = answerTextFor(item);
  document
    .querySelector(".write-prompt")
    .classList.toggle("meaning-mode", alphabet.quizKey === "meaning");
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


/* ================================
   SUPABASE (inloggning, användarnamn, sparade framsteg)
   ================================ */

const SUPABASE_URL = "https://mzzoovaprkinihyvlnae.supabase.co";
const SUPABASE_KEY = "sb_publishable_fb3Z80HTkiZHxAWDGsIP1Q_xtT6pSLX";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const accountBarText = document.getElementById("account-bar-text");
const accountLoginView = document.getElementById("account-login-view");
const accountUsernameView = document.getElementById("account-username-view");
const accountProfileView = document.getElementById("account-profile-view");
const accountEmailInput = document.getElementById("account-email-input");
const accountLoginStatus = document.getElementById("account-login-status");
const accountUsernameInput = document.getElementById("account-username-input");
const accountUsernameDisplay = document.getElementById("account-username-display");

let currentUser = null;
let currentUsername = null;
// Vilka rader/grupper den inloggade användaren klarat, som "alfabet:radnamn"
let completedRows = new Set();

function showAccountView(view) {
  accountLoginView.style.display = view === "login" ? "flex" : "none";
  accountUsernameView.style.display = view === "username" ? "flex" : "none";
  accountProfileView.style.display = view === "profile" ? "flex" : "none";
}

// Kollar om någon är inloggad och uppdaterar hela gränssnittet därefter -
// körs vid sidladdning, efter inloggning/utloggning, och efter att man
// klickat sig tillbaka från den magiska länken i mejlet.
async function refreshAccountUI() {
  const {
    data: { session },
  } = await sb.auth.getSession();

  if (!session) {
    currentUser = null;
    currentUsername = null;
    completedRows = new Set();
    accountBarText.textContent = "Logga in för att spara framsteg";
    showAccountView("login");
    return;
  }

  currentUser = session.user;

  const { data: profile } = await sb
    .from("profiles")
    .select("username")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (!profile) {
    accountBarText.textContent = "Inloggad – välj ett namn";
    showAccountView("username");
    return;
  }

  currentUsername = profile.username;
  accountBarText.textContent = `Inloggad som ${currentUsername}`;
  accountUsernameDisplay.textContent = currentUsername;
  showAccountView("profile");

  await loadCompletedRows();
}

// Hämtar alla avklarade rader för den inloggade användaren, en gång, och
// sparar dem lokalt så vi snabbt kan visa bockar i radväljaren.
async function loadCompletedRows() {
  if (!currentUser) return;

  const { data } = await sb
    .from("progress")
    .select("alphabet, row_name")
    .eq("user_id", currentUser.id);

  completedRows = new Set((data || []).map((row) => `${row.alphabet}:${row.row_name}`));
}

// Sparar att en rad är avklarad, kopplat till den aktuella användaren.
// Körs varje gång man slutför ett quiz (oavsett poäng).
async function saveRowProgress() {
  if (!currentUser) return;

  const group = ALPHABETS[currentAlphabet].groups[groupIndex];

  await sb.from("progress").upsert(
    { user_id: currentUser.id, alphabet: currentAlphabet, row_name: group.name },
    { onConflict: "user_id,alphabet,row_name" }
  );

  completedRows.add(`${currentAlphabet}:${group.name}`);
}

document.getElementById("account-send-link-btn").addEventListener("click", async () => {
  const email = accountEmailInput.value.trim();
  if (!email) {
    accountLoginStatus.textContent = "Skriv in din mejladress först.";
    return;
  }

  accountLoginStatus.textContent = "Skickar länk...";

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });

  accountLoginStatus.textContent = error
    ? "Något gick fel, försök igen."
    : "Kolla din mejl! Klicka på länken där för att logga in.";
});

document.getElementById("account-save-username-btn").addEventListener("click", async () => {
  const username = accountUsernameInput.value.trim();
  if (!username || !currentUser) return;

  await sb.from("profiles").insert({ id: currentUser.id, username });
  await refreshAccountUI();
});

document.getElementById("account-signout-btn").addEventListener("click", async () => {
  await sb.auth.signOut();
  await refreshAccountUI();
  showScreen("screen-menu");
});

document.getElementById("account-reset-btn").addEventListener("click", async () => {
  const sure = confirm("Är du säker? Alla dina sparade framsteg tas bort permanent.");
  if (!sure || !currentUser) return;

  await sb.from("progress").delete().eq("user_id", currentUser.id);
  await loadCompletedRows();
  alert("Dina framsteg är återställda.");
});

// Körs både vid sidladdning och varje gång inloggningsstatusen ändras
// (t.ex. när man klickar sig tillbaka hit från mejl-länken).
sb.auth.onAuthStateChange(() => {
  refreshAccountUI();
});

refreshAccountUI();
