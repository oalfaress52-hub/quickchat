// ==================================================
// FIREBASE INIT (GLOBAL SAFE)
// ==================================================
(function () {
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK not loaded BEFORE app.js");
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyDU3BOPdu427etC9mACyPIMqYXMUQo9w1E",
    authDomain: "quickchatii.firebaseapp.com",
    projectId: "quickchatii",
    storageBucket: "quickchatii.firebasestorage.app",
    messagingSenderId: "418934265102",
    appId: "1:418934265102:web:38340c750b6db60d76335f"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  window.auth = firebase.auth();
  window.db = firebase.firestore();
})();

// ==================================================
// CLIENT-SIDE BANNED WORDS
// ==================================================
const BANNED_WORDS = ["slur1", "slur2", "badword1"];
function containsBannedWords(text) {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => new RegExp(`\\b${word}\\b`, "i").test(lower));
}

// ==================================================
// PSEUDO-IP TRACKING
// ==================================================
function getPseudoIP() {
  const ua = navigator.userAgent;
  let hash = 0;
  for (let i = 0; i < ua.length; i++) {
    hash = (hash << 5) - hash + ua.charCodeAt(i);
    hash |= 0;
  }
  return "IP-" + Math.abs(hash);
}

// ==================================================
// FORMAT TIMESTAMPS
// ==================================================
function formatTimestamp(timestamp) {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString(undefined, { timeZoneName: "short" });
}

// ==================================================
// PARSE BAN DURATION
// ==================================================
function parseBanTime(timeStr) {
  const num = parseInt(timeStr);
  if (timeStr.endsWith("d")) return num * 24 * 60 * 60 * 1000;
  if (timeStr.endsWith("h")) return num * 60 * 60 * 1000;
  if (timeStr.endsWith("m")) return num * 60 * 1000;
  return num * 1000;
}

// ==================================================
// SEND MESSAGE
// ==================================================
async function sendMessage(text, serverId, currentUser) {
  if (!currentUser) return alert("Not logged in!");
  const server = await fetchServer(serverId);
  if (!server) return alert("Server not found!");

  const pseudoIP = getPseudoIP();

  const banEntry = (server.banned || []).find(
    b => b.uid === currentUser.uid || b.pseudoIP === pseudoIP
  );
  if (banEntry) return showBannedView(banEntry);

  const mutedEntry = (server.muted || []).find(m => m.uid === currentUser.uid);
  if (mutedEntry) return alert("You do not have permission to speak.");

  if (text.startsWith("/")) return;

  if (containsBannedWords(text)) return alert("Your message contains prohibited language.");

  await db.collection("messages").add({
    text,
    serverId,
    uid: currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ==================================================
// FETCH SERVER
// ==================================================
async function fetchServer(serverId) {
  const serverRef = db.collection("servers").doc(serverId);
  const serverSnap = await serverRef.get();
  if (serverSnap.exists) return { id: serverSnap.id, ...serverSnap.data() };
  console.error("Server not found!");
  return null;
}

// ==================================================
// SHOW BANNED VIEW
// ==================================================
function showBannedView(banEntry) {
  const container = document.getElementById("serverContainer");
  if (!container) return;

  container.innerHTML = "";
  const div = document.createElement("div");
  div.style.border = "2px solid red";
  div.style.padding = "20px";
  div.style.backgroundColor = "#ffe6e6";

  const title = document.createElement("h2");
  title.textContent = "Access Denied. Reason: Banned.";
  title.style.color = "red";
  div.appendChild(title);

  const uidP = document.createElement("p");
  uidP.textContent = `Banned UID: ${banEntry.uid}`;
  div.appendChild(uidP);

  const reasonP = document.createElement("p");
  reasonP.textContent = `Reason: ${banEntry.reason || "No reason provided"}`;
  div.appendChild(reasonP);

  const startP = document.createElement("p");
  startP.textContent = `Start: ${formatTimestamp(banEntry.timestamp || Date.now())}`;
  div.appendChild(startP);

  const endP = document.createElement("p");
  endP.textContent = `End: ${formatTimestamp(banEntry.until || Date.now())}`;
  div.appendChild(endP);

  container.appendChild(div);

  const chatInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  if (chatInput) chatInput.style.display = "none";
  if (sendButton) sendButton.style.display = "none";
}

// ==================================================
// 🦴 FOSSIL CLICKER (UNCHANGED)
// ==================================================
let fossils = 0;
let clickPower = 1;

const fossilClickerContainer = document.getElementById("fossilClickerContainer");
const fossilCounter = document.getElementById("fossilCounter");
const digButton = document.getElementById("digButton");
const upgradeClickPower = document.getElementById("upgradeClickPower");
const openFossilGame = document.getElementById("openFossilGame");
const closeFossilGame = document.getElementById("closeFossilGame");

function updateFossilDisplay() {
  if (fossilCounter) fossilCounter.textContent = `Fossils: ${fossils}`;
}

if (openFossilGame) openFossilGame.onclick = () => {
  fossilClickerContainer.style.display = "block";
  updateFossilDisplay();
};

if (closeFossilGame) closeFossilGame.onclick = () => {
  fossilClickerContainer.style.display = "none";
};

if (digButton) digButton.onclick = () => {
  fossils += clickPower;
  updateFossilDisplay();
};

if (upgradeClickPower) upgradeClickPower.onclick = () => {
  if (fossils >= 10) {
    fossils -= 10;
    clickPower++;
    updateFossilDisplay();
  } else {
    alert("Not enough fossils!");
  }
};

// ==================================================
// EXPOSE GLOBALS
// ==================================================
window.sendMessage = sendMessage;
window.fetchServer = fetchServer;
window.containsBannedWords = containsBannedWords;
window.getPseudoIP = getPseudoIP;
window.formatTimestamp = formatTimestamp;
window.parseBanTime = parseBanTime;
window.showBannedView = showBannedView;
