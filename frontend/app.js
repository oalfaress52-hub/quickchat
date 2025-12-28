import { doc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "./firebase.js";

// ----------------------------
// CLIENT-SIDE BANNED WORDS
// ----------------------------
const BANNED_WORDS = ["slur1", "slur2", "badword1"];

function containsBannedWords(text) {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });
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
  return num * 1000; // default seconds
}

// ----------------------------
// SEND MESSAGE
// ----------------------------
export async function sendMessage(text, serverId) {
  if (!currentUser) return alert("Not logged in!");
  const server = await fetchServer(serverId);
  if (!server) return alert("Server not found!");

  const pseudoIP = getPseudoIP();

  // Check if user is banned
  const banEntry = (server.banned || []).find(b => b.uid === currentUser.uid || b.pseudoIP === pseudoIP);
  if (banEntry) {
    showBannedView(banEntry);
    return;
  }

  // Handle commands
  if (text.startsWith("/")) {
    const handled = await handleCommand(server, text);
    if (handled) return;
  }

  // Banned words
  if (containsBannedWords(text)) {
    alert("Your message contains prohibited language.");
    return;
  }

  // Add message to Firestore
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
  reasonP.textContent = `Why were you banned? ${banEntry.reason || "No reason provided"}`;
  div.appendChild(reasonP);

  const startP = document.createElement("p");
  startP.textContent = `Start ban: ${formatTimestamp(banEntry.timestamp || Date.now())}`;
  div.appendChild(startP);

  const endP = document.createElement("p");
  endP.textContent = `End ban: ${formatTimestamp(banEntry.until || Date.now())}`;
  div.appendChild(endP);

  container.appendChild(div);

  // Hide chat input
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
// OWNER BUTTON & ROLE PANEL
// ----------------------------
function showOwnerButton(server) {
  const container = document.getElementById("serverContainer");
  if (document.getElementById("ownerButton")) return;

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
      promoteBtn.onclick = async () => {
        await assignModerator(server.id, memberUid);
      };

      const demoteBtn = document.createElement("button");
      demoteBtn.textContent = "Remove Moderator";
      demoteBtn.style.marginLeft = "5px";
      demoteBtn.onclick = async () => {
        await removeModerator(server.id, memberUid);
      };

      memberDiv.appendChild(promoteBtn);
      memberDiv.appendChild(demoteBtn);
    }

    panel.appendChild(memberDiv);
  });

  document.getElementById("serverContainer").appendChild(panel);
}

// ----------------------------
// FIRESTORE UPDATES
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
async function handleCommand(server, text) {
  const parts = text.trim().split(" ");
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const uid = currentUser.uid;
  const userPrivileges = (server.privileges && server.privileges[uid]) || [];

  if (cmd === "/ban") {
    if (!userPrivileges.includes("ban")) return showCommandError("You do not have enough privileges to use this command (missing privileges: ban)");
    if (args.length < 3) return showCommandError("Usage: /ban [User's UID] [Time] [Reason]");

    const targetUid = args[0];
    const time = args[1];
    const reason = args.slice(2).join(" ");
    await banUser(server.id, targetUid, time, reason);
    return true;
  }

  if (cmd === "/unban") {
    if (!userPrivileges.includes("ban")) return showCommandError("You do not have enough privileges to use this command (missing privileges: ban)");
    if (args.length < 1) return showCommandError("Usage: /unban [User's UID]");

    const targetUid = args[0];
    await unbanUser(server.id, targetUid);
    return true;
  }

  if (cmd === "/uid") {
    if (!userPrivileges.includes("ban")) return showCommandError("You do not have enough privileges to use this command (missing privileges: ban)");
    if (args.length < 1) return showCommandError("Usage: /uid <Username>");

    const username = args[0];
    // If you maintain server.usernames map: server.usernames[uid] = username
    const targetUid = Object.keys(server.usernames || {}).find(k => server.usernames[k] === username);
    if (!targetUid) return showCommandError(`User not found: ${username}`);

    showPrivateMessage(`The user has the following UID: ${targetUid}`);
    return true;
  }

  return showCommandError(`Unknown command: ${cmd}`);
}

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
// BAN/UNBAN LOGIC
// ----------------------------
async function banUser(serverId, targetUid, untilTime, reason) {
  const pseudoIP = getPseudoIP();
  const serverRef = doc(db, "servers", serverId);
  const timestamp = new Date();

  await updateDoc(serverRef, {
    banned: arrayUnion({
      uid: targetUid,
      pseudoIP,
      reason: reason || "No reason provided",
      timestamp,       
      until: new Date(Date.now() + parseBanTime(untilTime))
    })
  });

  showPrivateMessage(`${targetUid} has been banned for ${untilTime} (${reason})`);
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
// INITIALIZE PAGE
// ----------------------------
export async function initServerPage(serverId) {
  subscribeToServer(serverId, (server) => {
    const banEntry = (server.banned || []).find(b => b.uid === currentUser.uid);
    if (banEntry) {
      showBannedView(banEntry);
      return;
    }

    renderServer(server);
    if (server.owners.includes(currentUser.uid)) showOwnerButton(server);
    openRolePanel(server);
  });

  subscribeToMessages(serverId, (messages) => {
    const chat = document.getElementById("chatMessages");
    if (!chat) return;
    chat.innerHTML = "";
    messages.forEach(msg => {
      const div = document.createElement("div");
      div.textContent = `${msg.uid}: ${msg.text}`;
      chat.appendChild(div);
    });
  });
}
