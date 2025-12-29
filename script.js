
let keyDownTimes = {};
let lastKeyReleaseTime = null;

let individualKeys = [];
let digraphs = [];

let duration = 300;
let timerInterval;
let testCompleted = false;


const area = document.getElementById("typingArea");
const startBtn = document.getElementById("startBtn");
const submitBtn = document.getElementById("submitBtn");
const timerDisplay = document.getElementById("timer");
const usernameInput = document.getElementById("username");
const referenceTextEl = document.getElementById("referenceText");


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

const emailRegex = /^[a-zA-Z0-9._]+@(diu\.)?iiitvadodara\.ac\.in$/;


const DICTIONARY = [
  "time","people","year","day","way","thing","world","life","hand","part",
"child","eye","place","work","week","case","point","government","company","number",
"group","problem","fact","be","have","do","say","get","make","go",
"know","take","see","come","think","look","want","give","use","find",
"tell","ask","work","seem","feel","try","leave","call","good","new",
"first","last","long","great","little","own","other","old","right","big",
"high","different","small","large","next","early","young","important","few","public",
"bad","same","able","power","money","story","issue","side","kind","head",
"house","service","friend","father","mother","hour","game","line","end","member",
"law","car","city","community","name","president","team","minute","idea","kid",
"body","information","back","parent","face","others","level","office","door","health",
"person","art","war","history","party","result","change","morning","reason","research",
"girl","guy","moment","air","teacher","force","education","foot","boy","age",
"policy","process","music","market","sense","nation","plan","college","interest","death",
"experience","effect","use","class","control","care","field","development","role","effort",
"rate","heart","drug","show","leader","light","voice","wife","police","mind",
"price","report","decision","son","view","relationship","town","road","arm","difference",
"value","building","action","model","season","society","tax","director","position","player",
"record","paper","space","ground","form","event","official","matter","center","couple",
"site","project","activity","star","table","need","court","oil","situation","cost",
"industry","figure","street","image","phone","data","picture","practice","piece","land",
"product","doctor","wall","patient","worker","news","test","movie","north","love",
"support","technology","step","baby","computer","type","attention","film","tree","source",
"organization","hair","window","culture","chance","brother","energy","period","course","summer",
"plant","opportunity","term","letter","condition","choice","rule","south","floor","campaign",
"material","population","economy","medical","hospital","church","risk","fire","future","bank",
"software","hardware","network","keyboard","screen","mouse","server","client","database","program",
"code","logic","algorithm","variable","function","object","class","method","framework","library",
"frontend","backend","api","request","response","security","performance","memory","storage","cloud",
"design","development","testing","debugging","deployment","version","update","feature","interface","experience"
];

function generateRandomWords(count = 25) {
  let words = [];
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * DICTIONARY.length);
    words.push(DICTIONARY[index]);
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

startBtn.onclick = () => {
  const username = usernameInput.value.trim();

  if (!emailRegex.test(username)) {
    alert("Enter valid institute email: <enrollment>@diu.iiitvadodara.ac.in");
    return;
  }

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
    
if (result.lottery.isWinner) {
  alert(`🎉 You won ${result.lottery.prize}`);
} else {
  alert("Data submit successfully");
}

  } catch (err) {
    alert("Submission failed. Try again.");
    submitBtn.disabled = false;
  }
};
