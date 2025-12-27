import { doc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
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
  if (containsBannedWords(text)) {
    alert("Your message contains prohibited language.");
    return;
  }

  if (!currentUser) return alert("Not logged in!");

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
  // Render server name
  document.getElementById("serverName").textContent = server.name;

  // Render Owners
  const ownersUl = document.getElementById("ownersList");
  ownersUl.innerHTML = "";
  server.owners.forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid;
    ownersUl.appendChild(li);
  });

  // Render Moderators
  const modsUl = document.getElementById("moderatorsList");
  modsUl.innerHTML = "";
  (server.moderators || []).forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid;
    modsUl.appendChild(li);
  });

  // Render Members
  const membersUl = document.getElementById("membersList");
  membersUl.innerHTML = "";
  (server.members || []).forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid;
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
    memberDiv.textContent = memberUid;

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
  // Subscribe to server updates
  subscribeToServer(serverId, (server) => {
    renderServer(server);
    if (server.owners.includes(currentUser.uid)) showOwnerButton(server);
    openRolePanel(server); // optional: keep role panel in sync
  });

  // Subscribe to messages
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
