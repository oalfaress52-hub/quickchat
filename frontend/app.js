// frontend/app.js
// Fully compatible with Firebase compat SDK on GitHub Pages

// ----------------------------
// CONFIGURE FIREBASE
// ----------------------------
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

const auth = firebase.auth();
const db = firebase.firestore();

// ----------------------------
// UTILITY FUNCTIONS
// ----------------------------
const BANNED_WORDS = ["slur1", "slur2", "badword1"];
function containsBannedWords(text) {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => new RegExp(`\\b${word}\\b`, "i").test(lower));
}

function getPseudoIP() {
  const ua = navigator.userAgent;
  let hash = 0;
  for (let i = 0; i < ua.length; i++) {
    hash = (hash << 5) - hash + ua.charCodeAt(i);
    hash |= 0;
  }
  return "IP-" + Math.abs(hash);
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString(undefined, { timeZoneName: "short" });
}

// ----------------------------
// LOGIN / SIGNUP / PROFILE HELPERS
// ----------------------------
function redirectIfNotLoggedIn() {
  auth.onAuthStateChanged(user => {
    if (!user) window.location.href = "login.html";
  });
}

function getCurrentUser() {
  return auth.currentUser;
}

// ----------------------------
// SERVER FUNCTIONS
// ----------------------------
async function sendMessage(text, serverId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return alert("Not logged in!");
  const pseudoIP = getPseudoIP();

  const serverSnap = await db.collection("servers").doc(serverId).get();
  if (!serverSnap.exists) return alert("Server not found");
  const server = serverSnap.data();

  const banEntry = (server.banned || []).find(b => b.uid === currentUser.uid || b.pseudoIP === pseudoIP);
  if (banEntry) return alert("You are banned!");

  if (containsBannedWords(text)) return alert("Message contains prohibited words");

  await db.collection("messages").add({
    text,
    serverId,
    uid: currentUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// ----------------------------
// RENDER SERVER
// ----------------------------
function renderServer(server) {
  document.getElementById("serverName").textContent = server.name;

  const ownersUl = document.getElementById("ownersList");
  ownersUl.innerHTML = "";
  (server.owners || []).forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid;
    li.className = "owner";
    ownersUl.appendChild(li);
  });

  const modsUl = document.getElementById("moderatorsList");
  modsUl.innerHTML = "";
  (server.moderators || []).forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid;
    li.className = "moderator";
    modsUl.appendChild(li);
  });

  const membersUl = document.getElementById("membersList");
  membersUl.innerHTML = "";
  (server.members || []).forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid;
    membersUl.appendChild(li);
  });
}

// ----------------------------
// SUBSCRIBE TO SERVER + MESSAGES
// ----------------------------
function subscribeToServer(serverId, callback) {
  return db.collection("servers").doc(serverId)
    .onSnapshot(docSnap => {
      if (docSnap.exists) callback(docSnap.data());
    });
}

function subscribeToMessages(serverId, callback) {
  return db.collection("messages")
    .where("serverId", "==", serverId)
    .orderBy("createdAt")
    .onSnapshot(snapshot => {
      const messages = snapshot.docs.map(d => d.data());
      callback(messages);
    });
}

// ----------------------------
// INITIALIZE SERVER PAGE
// ----------------------------
function initServerPage(serverId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return window.location.href = "login.html";

  subscribeToServer(serverId, server => renderServer(server));
  subscribeToMessages(serverId, messages => {
    const chat = document.getElementById("chatMessages");
    chat.innerHTML = "";
    messages.forEach(msg => {
      const div = document.createElement("div");
      div.textContent = `${msg.uid}: ${msg.text}`;
      chat.appendChild(div);
    });
  });

  const sendBtn = document.getElementById("sendButton");
  const input = document.getElementById("messageInput");
  if (sendBtn && input) {
    sendBtn.onclick = () => sendMessage(input.value, serverId) && (input.value = "");
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage(input.value, serverId);
        input.value = "";
      }
    });
  }
}

// ----------------------------
// FOSSIL CLICKER
// ----------------------------
let fossils = 0;
let clickPower = 1;

function setupFossilClicker() {
  const container = document.getElementById("fossilClickerContainer");
  const counter = document.getElementById("fossilCounter");
  const digBtn = document.getElementById("digButton");
  const upgradeBtn = document.getElementById("upgradeClickPower");
  const openBtn = document.getElementById("openFossilGame");
  const closeBtn = document.getElementById("closeFossilGame");

  function updateDisplay() {
    if (counter) counter.textContent = `Fossils: ${fossils}`;
  }

  if (openBtn) openBtn.addEventListener("click", () => {
    if (container) container.style.display = "block";
    updateDisplay();
  });

  if (closeBtn) closeBtn.addEventListener("click", () => {
    if (container) container.style.display = "none";
  });

  if (digBtn) digBtn.addEventListener("click", () => {
    fossils += clickPower;
    updateDisplay();
  });

  if (upgradeBtn) upgradeBtn.addEventListener("click", () => {
    if (fossils >= 10) {
      fossils -= 10;
      clickPower += 1;
      updateDisplay();
    } else {
      alert("Not enough fossils!");
    }
  });
}

// Automatically setup fossil clicker if elements exist
document.addEventListener("DOMContentLoaded", setupFossilClicker);

// ----------------------------
// Expose functions globally
// ----------------------------
window.auth = auth;
window.db = db;
window.sendMessage = sendMessage;
window.renderServer = renderServer;
window.subscribeToServer = subscribeToServer;
window.subscribeToMessages = subscribeToMessages;
window.initServerPage = initServerPage;
window.redirectIfNotLoggedIn = redirectIfNotLoggedIn;
window.getCurrentUser = getCurrentUser;
