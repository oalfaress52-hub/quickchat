import { doc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "./firebase.js";

// ----------------------------
// CLIENT-SIDE BANNED WORDS
// ----------------------------
const BANNED_WORDS = ["slur1", "slur2", "badword1"];

function containsBannedWords(text) {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, "i"); // word boundaries
    return regex.test(lower);
  });
}

// ----------------------------
// SEND MESSAGE
// ----------------------------
export async function sendMessage(text, serverId) {
  if (!currentUser) return alert("Not logged in!");

  const server = await fetchServer(serverId);
  if (!server) return alert("Server not found!");

  // Prevent banned users from sending messages
  if ((server.banned || []).some(b => b.uid === currentUser.uid)) {
    const chat = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.textContent = "You are banned and cannot send messages.";
    div.style.color = "red";
    chat.appendChild(div);
    return;
  }

  // Handle commands if text starts with "/"
  if (text.startsWith("/")) {
    const handled = await handleCommand(server, text);
    if (handled) return;
  }

  // Regular banned words check
  if (containsBannedWords(text)) {
    alert("Your message contains prohibited language.");
    return;
  }

  // Firestore write
  await addDoc(collection(db, "messages"), {
    text,
    serverId,
    uid: currentUser.uid,
    createdAt: serverTimestamp()
  });
}

// ----------------------------
// FETCH AND RENDER SERVER
// ----------------------------
export async function fetchServer(serverId) {
  const serverRef = doc(db, "servers", serverId);
  const serverSnap = await getDoc(serverRef);

  if (serverSnap.exists()) {
    return { id: serverSnap.id, ...serverSnap.data() };
  } else {
    console.error("Server not found!");
    return null;
  }
}

export function renderServer(server) {
  // Server name
  document.getElementById("serverName").textContent = server.name;

  // Owners
  const ownersUl = document.getElementById("ownersList");
  ownersUl.innerHTML = "";
  server.owners.forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid;
    ownersUl.appendChild(li);
  });

  // Moderators
  const modsUl = document.getElementById("moderatorsList");
  modsUl.innerHTML = "";
  (server.moderators || []).forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid;
    modsUl.appendChild(li);
  });

  // Members
  const membersUl = document.getElementById("membersList");
  membersUl.innerHTML = "";
  (server.members || []).forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid + ((server.banned || []).some(b => b.uid === uid) ? " (BANNED)" : "");
    membersUl.appendChild(li);
  });
}

// ----------------------------
// OWNER-ONLY ROLE MANAGEMENT
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
    memberDiv.textContent = memberUid + ((server.banned || []).some(b => b.uid === memberUid) ? " (BANNED)" : "");

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
// FIRESTORE UPDATE FUNCTIONS
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

async function banUser(serverId, targetUid, time, reason) {
  const serverRef = doc(db, "servers", serverId);
  await updateDoc(serverRef, {
    banned: arrayUnion({ uid: targetUid, until: time, reason })
  });

  const chat = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.textContent = `${targetUid} has been banned for ${time} (${reason})`;
  div.style.color = "orange";
  chat.appendChild(div);
}

async function unbanUser(serverId, targetUid) {
  const serverRef = doc(db, "servers", serverId);
  const serverSnap = await getDoc(serverRef);
  if (!serverSnap.exists()) return;
  const server = serverSnap.data();

  const updatedBanned = (server.banned || []).filter(b => b.uid !== targetUid);
  await updateDoc(serverRef, { banned: updatedBanned });

  const chat = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.textContent = `${targetUid} has been unbanned`;
  div.style.color = "green";
  chat.appendChild(div);
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
