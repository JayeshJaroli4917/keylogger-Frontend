let keyDownTimes = {};
let lastKeyReleaseTime = null;

let individualKeys = [];
let digraphs = [];

const area = document.getElementById("typingArea");
const startBtn = document.getElementById("startBtn");
const submitBtn = document.getElementById("submitBtn");
const timerDisplay = document.getElementById("timer");
const usernameInput = document.getElementById("username");

let duration = 30;
let timerInterval;
let testCompleted = false;

startBtn.onclick = () => {
  const username = usernameInput.value.trim();
  if (!username) {
    alert("Please enter your name first");
    return;
  }

  keyDownTimes = {};
  lastKeyReleaseTime = null;
  individualKeys = [];
  digraphs = [];
  area.value = "";
  duration = 30;
  testCompleted = false;

  area.disabled = false;
  area.focus();
  startBtn.disabled = true;
  submitBtn.disabled = true;

  timerDisplay.textContent = "Time Left: 0:30";

  timerInterval = setInterval(() => {
    duration--;

    timerDisplay.textContent =
      `Time Left: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`;

    if (duration <= 0) {
      clearInterval(timerInterval);
      area.disabled = true;
      submitBtn.disabled = false;
      testCompleted = true;
      alert("Time Over! You can now submit the data.");
    }
  }, 1000);
};

area.addEventListener("keydown", (e) => {
  if (!keyDownTimes[e.code]) {
    keyDownTimes[e.code] = performance.now();
  }
});

area.addEventListener("keyup", (e) => {
  const releaseTime = performance.now();
  const pressTime = keyDownTimes[e.code];
  if (!pressTime) return;

  const holdTime = releaseTime - pressTime;
  const flightTime = lastKeyReleaseTime
    ? pressTime - lastKeyReleaseTime
    : 0;

  const keyData = {
    key: e.key,
    code: e.code,
    pressTime,
    releaseTime,
    holdTime_HT: holdTime,
    flightTime_FT: flightTime
  };

  individualKeys.push(keyData);

  if (individualKeys.length >= 2) {
    const k1 = individualKeys[individualKeys.length - 2];
    const k2 = keyData;

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

/* ---------- SUBMIT DATA ---------- */
submitBtn.onclick = async () => {
  const username = usernameInput.value.trim();

  if (!username) {
    alert("Username is required!");
    return;
  }

  if (!testCompleted) {
    alert("Please complete the test first.");
    return;
  }

  submitBtn.disabled = true;

  const payload = {
    username,
    typedText: area.value,
    timestamp: new Date().toISOString(),
    individualKeys,
    digraphs
  };

  try {
    const response = await fetch("keylogger-backend.vercel.app/api/submit", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
})
.then(res => res.json())
.then(result => {
  alert("Data submitted successfully!");
  console.log(result);
})
