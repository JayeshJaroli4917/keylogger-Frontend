/* ===============================
   GLOBAL STATE
   =============================== */
let keyDownTimes = {};
let lastKeyReleaseTime = null;
let individualKeys = [];
let digraphs = [];

let duration = 30;
let timerInterval;
let testCompleted = false;

/* ===============================
   DOM ELEMENTS
   =============================== */
const area = document.getElementById("typingArea");
const startBtn = document.getElementById("startBtn");
const submitBtn = document.getElementById("submitBtn");
const timerDisplay = document.getElementById("timer");
const usernameInput = document.getElementById("username");
const referenceTextEl = document.getElementById("referenceText");

/* ===============================
   SECURITY RESTRICTIONS
   =============================== */
document.addEventListener("contextmenu", e => e.preventDefault());

["copy", "paste", "cut", "drop"].forEach(evt =>
  document.addEventListener(evt, e => e.preventDefault())
);

document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && ["c", "v", "x"].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

/* ===============================
   EMAIL VALIDATION
   =============================== */
const emailRegex = /^[a-zA-Z0-9._]+@(diu\.)?iiitvadodara\.ac\.in$/;

/* ===============================
   WORD GENERATOR
   =============================== */
const DICTIONARY = [
  "time","people","year","day","world","life","computer","keyboard","software",
  "network","frontend","backend","security","performance","cloud","data",
  "algorithm","logic","system","analysis","design","development","testing"
];

function generateRandomWords(count = 25) {
  let words = [];
  for (let i = 0; i < count; i++) {
    words.push(DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)]);
  }
  return words.join(" ");
}

let referenceText = "";

function loadInitialWords() {
  referenceText = generateRandomWords();
  referenceTextEl.textContent = referenceText;
}

function extendWordsIfNeeded(typedLength) {
  if (typedLength + 100 > referenceText.length) {
    referenceText += " " + generateRandomWords(15);
    referenceTextEl.textContent = referenceText;
  }
}

/* ===============================
   API CHECK (IMPORTANT)
   =============================== */
async function checkUserAlreadySubmitted(username) {
  try {
    const res = await fetch(
      `https://keylogger-backend.vercel.app/api/check-user?username=${encodeURIComponent(username)}`
    );

    if (!res.ok) throw new Error("Check failed");

    const data = await res.json();
    return data.exists === true;

  } catch (err) {
    alert("Unable to verify test status. Try again.");
    throw err;
  }
}

/* ===============================
   START BUTTON
   =============================== */
startBtn.onclick = async () => {
  const username = usernameInput.value.trim().toLowerCase();

  if (!emailRegex.test(username)) {
    alert("Enter valid institute email");
    return;
  }

  // 🔐 BACKEND CHECK BEFORE START
  const alreadySubmitted = await checkUserAlreadySubmitted(username);

  if (alreadySubmitted) {
    alert("❌ You already gave the test.");
    return;
  }

  // RESET STATE
  keyDownTimes = {};
  lastKeyReleaseTime = null;
  individualKeys = [];
  digraphs = [];
  testCompleted = false;
  duration = 30;

  area.value = "";
  area.disabled = false;
  area.focus();

  startBtn.disabled = true;
  submitBtn.disabled = true;

  loadInitialWords();

  timerDisplay.textContent = "Time Left: 0:30";

  timerInterval = setInterval(() => {
    duration--;

    timerDisplay.textContent =
      `Time Left: 0:${String(duration).padStart(2, "0")}`;

    if (duration <= 0) {
      clearInterval(timerInterval);
      area.disabled = true;
      testCompleted = true;
      submitBtn.disabled = false;
      alert("Time Over! Submit now.");
    }
  }, 1000);
};

/* ===============================
   TYPING EVENTS
   =============================== */
area.addEventListener("input", () => {
  extendWordsIfNeeded(area.value.length);
});

area.addEventListener("keydown", e => {
  if (!keyDownTimes[e.code]) {
    keyDownTimes[e.code] = performance.now();
  }
});

area.addEventListener("keyup", e => {
  const release = performance.now();
  const press = keyDownTimes[e.code];
  if (!press) return;

  individualKeys.push({
    key: e.key,
    holdTime: release - press
  });

  if (individualKeys.length >= 2) {
    const k1 = individualKeys[individualKeys.length - 2];
    const k2 = individualKeys[individualKeys.length - 1];
    digraphs.push({ digraph: k1.key + k2.key });
  }

  lastKeyReleaseTime = release;
  delete keyDownTimes[e.code];
});

submitBtn.onclick = async () => {
  if (!testCompleted) return;

  submitBtn.disabled = true;

  const payload = {
    username: usernameInput.value.trim().toLowerCase(),
    typedText: area.value.trim(),
    charCount: area.value.length,
    timestamp: new Date().toISOString(),
    individualKeys,
    digraphs
  };

  try {
    const res = await fetch(
      "https://keylogger-backend.vercel.app/api/submit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (res.status === 409) {
      alert("❌ You already gave the test.");
      return;
    }

    if (!res.ok) throw new Error();

    alert("✅ Test submitted successfully");

  } catch (err) {
    alert("Submission failed. Try again.");
    submitBtn.disabled = false;
  }
};
