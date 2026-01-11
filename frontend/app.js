// app.js
import { db, auth } from "./firebase.js";
import {
  doc, getDoc, updateDoc, collection, addDoc, query, where,
  orderBy, onSnapshot, serverTimestamp, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js";

// ----------------------------
// CLIENT-SIDE BANNED WORDS
// ----------------------------
const BANNED_WORDS = ["slur1", "slur2", "badword1"];
function containsBannedWords(text) {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => new RegExp(`\\b${word}\\b`, "i").test(lower));
}

// ----------------------------
// PSEUDO-IP TRACKING
// ----------------------------
function getPseudoIP() {
  const ua = navigator.userAgent;
  let hash = 0;
  for (let i = 0; i < ua.length; i++) {
    hash = (hash << 5) - hash + ua.charCodeAt(i);
    hash |= 0;
  }
  return "IP-" + Math.abs(hash);
}

// ----------------------------
// FORMAT TIMESTAMPS
// ----------------------------
function formatTimestamp(timestamp) {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString(undefined, { timeZoneName: "short" });
}

// ----------------------------
// PARSE BAN DURATION
// ----------------------------
function parseBanTime(timeStr) {
  const num = parseInt(timeStr);
  if (timeStr.endsWith("d")) return num * 24 * 60 * 60 * 1000;
  if (timeStr.endsWith("h")) return num * 60 * 60 * 1000;
  if (timeStr.endsWith("m")) return num * 60 * 1000;
  return num * 1000;
}

// ----------------------------
// SEND MESSAGE
// ----------------------------
export async function sendMessage(text, serverId, currentUser) {
  if (!currentUser) return alert("Not logged in!");
  const server = await fetchServer(serverId);
  if (!server) return alert("Server not found!");

  const pseudoIP = getPseudoIP();

  // Check banned
  const banEntry = (server.banned || []).find(b => b.uid === currentUser.uid || b.pseudoIP === pseudoIP);
  if (banEntry) return showBannedView(banEntry);

  // Check muted
  const mutedEntry = (server.muted || []).find(m => m.uid === currentUser.uid);
  if (mutedEntry) return showPrivateMessage("You do not have permission to speak.");

  // Handle commands
  if (text.startsWith("/")) {
    const handled = await handleCommand(server, text, currentUser);
    if (handled) return;
  }

  // Banned words
  if (containsBannedWords(text)) return alert("Your message contains prohibited language.");

  // Add message
  await addDoc(collection(db, "messages"), {
    text,
    serverId,
    uid: currentUser.uid,
    createdAt: serverTimestamp()
  });
}

// ----------------------------
// FETCH SERVER
// ----------------------------
export async function fetchServer(serverId) {
  const serverRef = doc(db, "servers", serverId);
  const serverSnap = await getDoc(serverRef);
  if (serverSnap.exists()) return { id: serverSnap.id, ...serverSnap.data() };
  console.error("Server not found!");
  return null;
}

// ----------------------------
// SHOW BANNED VIEW
// ----------------------------
function showBannedView(banEntry) {
  const container = document.getElementById("serverContainer");
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

// ----------------------------
// RENDER SERVER
// ----------------------------
export function renderServer(server) {
  document.getElementById("serverName").textContent = server.name;

  const ownersUl = document.getElementById("ownersList");
  ownersUl.innerHTML = "";
  server.owners.forEach(uid => {
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
    const banned = (server.banned || []).some(b => b.uid === uid);
    li.textContent = uid + (banned ? " (BANNED)" : "");
    if (banned) li.className = "banned";
    membersUl.appendChild(li);
  });
}

// ----------------------------
// OWNER ROLE PANEL
// ----------------------------
function showOwnerButton(server, currentUser) {
  const container = document.getElementById("serverContainer");
  if (document.getElementById("ownerButton")) return;
  if (!server.owners.includes(currentUser.uid)) return;

  const ownerButton = document.createElement("button");
  ownerButton.id = "ownerButton";
  ownerButton.textContent = "Manage Roles";
  ownerButton.onclick = () => openRolePanel(server);
  container.appendChild(ownerButton);
}

function openRolePanel(server) {
  let oldPanel = document.getElementById("rolePanel");
  if (oldPanel) oldPanel.remove();

  const panel = document.createElement("div");
  panel.id = "rolePanel";
  panel.style.border = "1px solid #ccc";
  panel.style.padding = "10px";
  panel.style.marginTop = "10px";

  server.members.forEach(memberUid => {
    const memberDiv = document.createElement("div");
    memberDiv.style.marginBottom = "5px";
    const banned = (server.banned || []).some(b => b.uid === memberUid);
    memberDiv.textContent = memberUid + (banned ? " (BANNED)" : "");

    if (!server.owners.includes(memberUid)) {
      const promoteBtn = document.createElement("button");
      promoteBtn.textContent = "Make Moderator";
      promoteBtn.style.marginLeft = "10px";
      promoteBtn.onclick = async () => { await assignModerator(server.id, memberUid); };

      const demoteBtn = document.createElement("button");
      demoteBtn.textContent = "Remove Moderator";
      demoteBtn.style.marginLeft = "5px";
      demoteBtn.onclick = async () => { await removeModerator(server.id, memberUid); };

      memberDiv.appendChild(promoteBtn);
      memberDiv.appendChild(demoteBtn);
    }

    panel.appendChild(memberDiv);
  });

  document.getElementById("serverContainer").appendChild(panel);
}

// ----------------------------
// ASSIGN / REMOVE MODERATOR
// ----------------------------
async function assignModerator(serverId, memberUid) {
  const serverRef = doc(db, "servers", serverId);
  const serverSnap = await getDoc(serverRef);
  if (!serverSnap.exists()) return;

  const server = serverSnap.data();
  const updatedModerators = Array.from(new Set([...(server.moderators || []), memberUid]));
  await updateDoc(serverRef, { moderators: updatedModerators });
}

async function removeModerator(serverId, memberUid) {
  const serverRef = doc(db, "servers", serverId);
  const serverSnap = await getDoc(serverRef);
  if (!serverSnap.exists()) return;

  const server = serverSnap.data();
  const updatedModerators = (server.moderators || []).filter(uid => uid !== memberUid);
  await updateDoc(serverRef, { moderators: updatedModerators });
}

// ----------------------------
// COMMANDS
// ----------------------------
async function handleCommand(server, text, currentUser) {
  const parts = text.trim().split(" ");
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const uid = currentUser.uid;
  const userPrivileges = (server.privileges && server.privileges[uid]) || [];

  if (cmd === "/ban") {
    if (!userPrivileges.includes("ban")) return showCommandError("Missing privileges: ban");
    if (args.length < 3) return showCommandError("Usage: /ban [User UID] [Time] [Reason]");
    await banUser(server.id, args[0], args[1], args.slice(2).join(" "));
    return true;
  }

  if (cmd === "/unban") {
    if (!userPrivileges.includes("ban")) return showCommandError("Missing privileges: ban");
    if (args.length < 1) return showCommandError("Usage: /unban [User UID]");
    await unbanUser(server.id, args[0]);
    return true;
  }

  if (cmd === "/mute") {
    if (!userPrivileges.includes("mute")) return showCommandError("Missing privileges: mute");
    if (args.length < 2) return showCommandError("Usage: /mute [Username] [Reason]");
    const targetUid = Object.keys(server.usernames || {}).find(k => server.usernames[k] === args[0]);
    if (!targetUid) return showCommandError(`User not found: ${args[0]}`);
    await muteUser(server.id, targetUid, args.slice(1).join(" "));
    return true;
  }

  if (cmd === "/unmute") {
    if (!userPrivileges.includes("mute")) return showCommandError("Missing privileges: mute");
    if (args.length < 1) return showCommandError("Usage: /unmute [Username]");
    const targetUid = Object.keys(server.usernames || {}).find(k => server.usernames[k] === args[0]);
    if (!targetUid) return showCommandError(`User not found: ${args[0]}`);
    await unmuteUser(server.id, targetUid);
    return true;
  }

  if (cmd === "/uid") {
    if (!userPrivileges.includes("ban")) return showCommandError("Missing privileges: ban");
    if (args.length < 1) return showCommandError("Usage: /uid <Username>");
    const targetUid = Object.keys(server.usernames || {}).find(k => server.usernames[k] === args[0]);
    if (!targetUid) return showPrivateMessage(`User not found: ${args[0]}`);
    showPrivateMessage(`The user has UID: ${targetUid}`);
    return true;
  }

  return showCommandError(`Unknown command: ${cmd}`);
}

// ----------------------------
// PRIVATE / SYSTEM MESSAGES
// ----------------------------
function showCommandError(message) {
  const chat = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.textContent = message;
  div.style.color = "red";
  chat.appendChild(div);
  return false;
}

function showPrivateMessage(message) {
  const chat = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.textContent = message;
  div.style.color = "blue";
  div.style.fontStyle = "italic";
  chat.appendChild(div);
}

// ----------------------------
// BAN / UNBAN
// ----------------------------
async function banUser(serverId, targetUid, untilTime, reason) {
  const pseudoIP = getPseudoIP();
  const serverRef = doc(db, "servers", serverId);

  await updateDoc(serverRef, {
    banned: arrayUnion({
      uid: targetUid,
      pseudoIP,
      reason: reason || "No reason provided",
      timestamp: new Date(),
      until: new Date(Date.now() + parseBanTime(untilTime))
    })
  });

  showPrivateMessage(`${targetUid} has been banned for ${untilTime} (${reason})`);

  await addDoc(collection(db, "messages"), {
    text: `User "${targetUid}" was banned by "SYSTEM"`,
    serverId,
    uid: "SYSTEM",
    createdAt: serverTimestamp(),
    system: true
  });
}

async function unbanUser(serverId, targetUid) {
  const serverRef = doc(db, "servers", serverId);
  const serverSnap = await getDoc(serverRef);
  if (!serverSnap.exists()) return;

  const server = serverSnap.data();
  const updatedBanned = (server.banned || []).filter(b => b.uid !== targetUid);
  await updateDoc(serverRef, { banned: updatedBanned });

  showPrivateMessage(`${targetUid} has been unbanned`);
}

// ----------------------------
// MUTE / UNMUTE
// ----------------------------
async function muteUser(serverId, targetUid, reason) {
  const serverRef = doc(db, "servers", serverId);
  await updateDoc(serverRef, {
    muted: arrayUnion({ uid: targetUid, reason })
  });

  await addDoc(collection(db, "messages"), {
    text: `Player "${targetUid}" cannot speak anymore by "SYSTEM"`,
    serverId,
    uid: "SYSTEM",
    createdAt: serverTimestamp(),
    system: true
  });

  showPrivateMessage(`${targetUid} has been muted. Reason: ${reason}`);
}

async function unmuteUser(serverId, targetUid) {
  const serverRef = doc(db, "servers", serverId);
  const serverSnap = await getDoc(serverRef);
  if (!serverSnap.exists()) return;

  const server = serverSnap.data();
  const updatedMuted = (server.muted || []).filter(m => m.uid !== targetUid);
  await updateDoc(serverRef, { muted: updatedMuted });

  showPrivateMessage(`${targetUid} has been unmuted`);
}

// ----------------------------
// REAL-TIME SUBSCRIPTIONS
// ----------------------------
export function subscribeToServer(serverId, callback) {
  const serverRef = doc(db, "servers", serverId);
  return onSnapshot(serverRef, snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export function subscribeToMessages(serverId, callback) {
  const messagesRef = collection(db, "messages");
  const q = query(messagesRef, where("serverId", "==", serverId), orderBy("createdAt", "asc"));
  return onSnapshot(q, snap => {
    const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
}

// ----------------------------
// INITIALIZE SERVER PAGE
// ----------------------------
export async function initServerPage(serverId, currentUser) {
  subscribeToServer(serverId, (server) => {
    const banEntry = (server.banned || []).find(b => b.uid === currentUser.uid);
    if (banEntry) return showBannedView(banEntry);

    renderServer(server);
    showOwnerButton(server, currentUser);
    openRolePanel(server);
  });

  subscribeToMessages(serverId, (messages) => {
    const chat = document.getElementById("chatMessages");
    if (!chat) return;
    chat.innerHTML = "";
    messages.forEach(msg => {
      const div = document.createElement("div");
      if (msg.system) {
        div.textContent = msg.text;
        div.style.color = "red";
        div.style.fontStyle = "italic";
      } else {
        div.textContent = `${msg.uid}: ${msg.text}`;
      }
      chat.appendChild(div);
    });
  });
}

// ----------------------------
// FOSSIL CLICKER
// ----------------------------
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

if (openFossilGame) openFossilGame.addEventListener("click", () => {
  if (fossilClickerContainer) fossilClickerContainer.style.display = "block";
  updateFossilDisplay();
});

if (closeFossilGame) closeFossilGame.addEventListener("click", () => {
  if (fossilClickerContainer) fossilClickerContainer.style.display = "none";
});

if (digButton) digButton.addEventListener("click", () => {
  fossils += clickPower;
  updateFossilDisplay();
});

if (upgradeClickPower) upgradeClickPower.addEventListener("click", () => {
  if (fossils >= 10) {
    fossils -= 10;
    clickPower += 1;
    updateFossilDisplay();
  } else {
    alert("Not enough fossils!");
  }
});
