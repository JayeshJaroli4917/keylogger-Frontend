/***********************
 * GLOBAL STATE
 ***********************/
let keyDownTimes = {};
let lastKeyReleaseTime = null;

let individualKeys = [];
let digraphs = [];

let duration = 300;
let timerInterval;
let testCompleted = false;

/***********************
 * DOM ELEMENTS
 ***********************/
const area = document.getElementById("typingArea");
const startBtn = document.getElementById("startBtn");
const submitBtn = document.getElementById("submitBtn");
const timerDisplay = document.getElementById("timer");
const usernameInput = document.getElementById("username");
const referenceTextEl = document.getElementById("referenceText");

/***********************
 * SECURITY LOCKS
 ***********************/
document.addEventListener("contextmenu", e => e.preventDefault());

["copy", "paste", "cut", "drop"].forEach(evt => {
  document.addEventListener(evt, e => e.preventDefault());
});

document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey) {
    if (["c", "v", "x"].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  }
});

/***********************
 * EMAIL VALIDATION
 ***********************/
const emailRegex = /^[0-9]+@diu\.iiitvadodara\.ac\.in$/;

/***********************
 * DICTIONARY (MONKEYTYPE STYLE)
 ***********************/
const DICTIONARY = [
  "time","person","year","way","day","thing","world","life","hand","part",
  "technology","computer","keyboard","typing","internet","software","network",
  "frontend","backend","javascript","python","engineering","student","practice",
  "learning","speed","accuracy","focus","confidence","discipline","research",
  "system","design","development","performance","analysis","security"
];

/***********************
 * RANDOM WORD GENERATOR
 ***********************/
function generateRandomWords(count = 25) {
  let words = [];
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * DICTIONARY.length);
    words.push(DICTIONARY[index]);
  }
  return words.join(" ");
}

/***********************
 * INFINITE REFERENCE TEXT
 ***********************/
let referenceText = "";

function loadInitialWords() {
  referenceText = generateRandomWords(25);
  referenceTextEl.textContent = referenceText;
}

function extendWordsIfNeeded(typedLength) {
  if (typedLength + 50 > referenceText.length) {
    referenceText += " " + generateRandomWords(20);
    referenceTextEl.textContent = referenceText;
  }
}

/***********************
 * START BUTTON
 ***********************/
startBtn.onclick = () => {
  const username = usernameInput.value.trim();

  if (!emailRegex.test(username)) {
    alert("Enter valid institute email: <enrollment>@diu.iiitvadodara.ac.in");
    return;
  }

  // Reset state
  keyDownTimes = {};
  lastKeyReleaseTime = null;
  individualKeys = [];
  digraphs = [];
  testCompleted = false;
  duration = 300;

  area.value = "";
  area.disabled = false;
  area.focus();

  startBtn.disabled = true;
  submitBtn.disabled = true;

  loadInitialWords();

  timerDisplay.textContent = "Time Left: 5:00";

  timerInterval = setInterval(() => {
    duration--;

    timerDisplay.textContent =
      `Time Left: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`;

    if (duration <= 0) {
      clearInterval(timerInterval);
      area.disabled = true;
      testCompleted = true;
      submitBtn.disabled = false;
      alert("Time Over! You can now submit.");
    }
  }, 1000);
};

/***********************
 * EXTEND WORDS WHILE TYPING
 ***********************/
area.addEventListener("input", () => {
  extendWordsIfNeeded(area.value.length);
});

/***********************
 * KEYSTROKE DYNAMICS
 ***********************/
area.addEventListener("keydown", e => {
  if (!keyDownTimes[e.code]) {
    keyDownTimes[e.code] = performance.now();
  }
});

area.addEventListener("keyup", e => {
  const releaseTime = performance.now();
  const pressTime = keyDownTimes[e.code];
  if (!pressTime) return;

  const holdTime = releaseTime - pressTime;
  const flightTime = lastKeyReleaseTime
    ? pressTime - lastKeyReleaseTime
    : 0;

  individualKeys.push({
    key: e.key,
    code: e.code,
    pressTime,
    releaseTime,
    holdTime_HT: holdTime,
    flightTime_FT: flightTime
  });

  if (individualKeys.length >= 2) {
    const k1 = individualKeys[individualKeys.length - 2];
    const k2 = individualKeys[individualKeys.length - 1];

    digraphs.push({
      digraph: k1.key + k2.key,
      PP: k2.pressTime - k1.pressTime,
      RP: k2.pressTime - k1.releaseTime,
      RR: k2.releaseTime - k1.releaseTime,
      PR: k2.releaseTime - k1.pressTime,
      D: k2.releaseTime - k1.pressTime
    });
  }

  lastKeyReleaseTime = releaseTime;
  delete keyDownTimes[e.code];
});

/***********************
 * SUBMIT (ONLY AFTER TIME OVER)
 ***********************/
submitBtn.onclick = async () => {
  if (!testCompleted) return;

  const username = usernameInput.value.trim();
  const text = area.value.trim();
  const charCount = text.length;

  submitBtn.disabled = true;

  const payload = {
    username,
    typedText: text,
    charCount,
    timestamp: new Date().toISOString(),
    individualKeys,
    digraphs
  };

  try {
    const response = await fetch(
      "https://keylogger-backend.vercel.app/api/submit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) throw new Error();

    if (charCount >= 500) {
      alert("Data submitted successfully 🎉 and you won a chocolate 🍫");
    } else {
      alert("Data submitted successfully");
    }

  } catch (err) {
    alert("Submission failed. Try again.");
    submitBtn.disabled = false;
  }
};
