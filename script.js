let keyDownTimes = {};
let lastKeyReleaseTime = null;

let individualKeys = [];
let digraphs = [];

let duration = 30;
let timerInterval;
let testCompleted = false;

const area = document.getElementById("typingArea");
const startBtn = document.getElementById("startBtn");
const submitBtn = document.getElementById("submitBtn");
const timerDisplay = document.getElementById("timer");
const usernameInput = document.getElementById("username");
const referenceTextEl = document.getElementById("referenceText");

/* ================== SECURITY ================== */
document.addEventListener("contextmenu", e => e.preventDefault());
["copy", "paste", "cut", "drop"].forEach(evt =>
  document.addEventListener(evt, e => e.preventDefault())
);
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && ["c", "v", "x"].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

/* ================== EMAIL VALIDATION ================== */
const emailRegex = /^[a-zA-Z0-9._]+@(diu\.)?iiitvadodara\.ac\.in$/;

/* ================== WORD GENERATION ================== */
const DICTIONARY = [
  "time","people","year","day","way","thing","world","life","hand","part",
  "child","eye","place","work","week","case","point","company","number",
  "group","problem","fact","work","try","leave","call","good","new",
  "first","last","long","great","little","other","old","right","big",
  "small","large","next","early","young","important","few","public",
  "money","story","issue","side","kind","head","house","service",
  "friend","father","mother","hour","game","line","end","member",
  "law","car","city","community","name","team","minute","idea",
  "body","information","back","parent","face","level","office",
  "health","person","art","history","result","change","morning",
  "reason","research","education","process","music","market","nation",
  "plan","college","interest","experience","effect","class","control",
  "care","field","development","role","effort","rate","heart","drug",
  "show","leader","light","voice","mind","price","report","decision",
  "view","relationship","road","difference","value","building",
  "action","model","season","society","record","paper","space",
  "form","event","matter","center","project","activity","need",
  "situation","cost","industry","figure","street","image","phone",
  "data","picture","practice","product","doctor","patient","worker",
  "news","test","movie","love","support","technology","computer",
  "keyboard","server","database","program","code","logic","algorithm",
  "function","object","class","framework","frontend","backend",
  "api","request","response","security","performance","memory",
  "storage","cloud","design","development","testing","debugging",
  "deployment","feature","interface","experience"
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
  referenceText = generateRandomWords(25);
  referenceTextEl.textContent = referenceText;
}

function extendWordsIfNeeded(typedLength) {
  if (typedLength + 100 > referenceText.length) {
    referenceText += " " + generateRandomWords(20);
    referenceTextEl.textContent = referenceText;
  }
}

/* ================== START TEST ================== */
startBtn.onclick = () => {
  const username = usernameInput.value.trim();

  if (!emailRegex.test(username)) {
    alert("Enter valid institute email");
    return;
  }

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
      alert("⏰ Time Over! Submit your test.");
    }
  }, 1000);
};

/* ================== TYPING EVENTS ================== */
area.addEventListener("input", () => {
  extendWordsIfNeeded(area.value.length);
});

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
    holdTime_HT: holdTime,
    flightTime_FT: flightTime
  });

  if (individualKeys.length >= 2) {
    const k1 = individualKeys[individualKeys.length - 2];
    const k2 = individualKeys[individualKeys.length - 1];

    digraphs.push({
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

/* ================== SUBMIT DATA ================== */
submitBtn.onclick = async () => {
  if (!testCompleted) return;

  submitBtn.disabled = true;

  const payload = {
    username: usernameInput.value.trim(),
    typedText: area.value.trim(),
    charCount: area.value.length,
    timestamp: new Date().toISOString(),
    individualKeys,
    digraphs
  };

  try {
    const response = await fetch(
      "https://keylogger-backend.vercel.app/api/save",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) throw new Error("Server Error");

    const result = await response.json();

    if (result.wonLottery) {
      alert("🎉 Congratulations! You won a chocolate 🍫");
    } else {
      alert("✅ Data submitted successfully!");
    }

  } catch (err) {
    console.error(err);
    alert("❌ Submission failed. Try again.");
    submitBtn.disabled = false;
  }
};
