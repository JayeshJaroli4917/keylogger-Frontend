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

// 🔒 Disable right-click everywhere
document.addEventListener("contextmenu", e => e.preventDefault());

// 🔒 Disable copy, paste, cut, drag
["copy", "paste", "cut", "drop"].forEach(evt => {
  document.addEventListener(evt, e => e.preventDefault());
});

// 🔒 Disable Ctrl + C / V / X
document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey) {
    if (["c", "v", "x"].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  }
});

// 📧 Institute email validation
const emailRegex = /^[0-9]+@diu\.iiitvadodara\.ac\.in$/;

startBtn.onclick = () => {
  const username = usernameInput.value.trim();

  if (!emailRegex.test(username)) {
    alert("Enter valid institute email: <enrollment>@diu.iiitvadodara.ac.in");
    return;
  }

  // Reset
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
      testCompleted = true;
      submitBtn.disabled = false;
      alert("Time Over! You can now submit.");
    }
  }, 1000);
};

// ⌨️ Key Down
area.addEventListener("keydown", e => {
  if (!keyDownTimes[e.code]) {
    keyDownTimes[e.code] = performance.now();
  }
});

// ⌨️ Key Up
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
};

// 📤 Submit (ONLY after time over)
submitBtn.onclick = async () => {
  if (!testCompleted) return;

  const username = usernameInput.value.trim();
  const text = area.value.trim();
  const charCount = text.length;

  if (!emailRegex.test(username)) {
    alert("Invalid institute email!");
    return;
  }

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

    if (!response.ok) throw new Error("Server error");

    if (charCount >= 500) {
      alert("Data submitted successfully  and you won a chocolate ");
    } else {
      alert("Data submitted successfully");
    }

  } catch (err) {
    alert("Submission failed. Try again.");
    submitBtn.disabled = false;
  }
};
