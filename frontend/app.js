import { doc, getDoc, updateDoc } from "firebase/firestore";
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

function sendMessage(text, serverId) {
  if (containsBannedWords(text)) {
    alert("Your message contains prohibited language.");
    return;
  }

  // proceed to write the message to Firestore
  // Example: addDoc(collection(db, "messages"), { text, serverId, uid: currentUser.uid });
}

// ----------------------------
// FETCH AND RENDER SERVER
// ----------------------------
async function fetchServer(serverId) {
  const serverRef = doc(db, "servers", serverId);
  const serverSnap = await getDoc(serverRef);

  if (serverSnap.exists()) {
    return serverSnap.data();
  } else {
    console.error("Server not found!");
    return null;
  }
}

function renderServer(server) {
  // Render server name
  document.getElementById("serverName").textContent = server.name;

  // Render Owners
  const ownersUl = document.getElementById("ownersList");
  ownersUl.innerHTML = "";
  server.owners.forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid; // replace with username if needed
    ownersUl.appendChild(li);
  });

  // Render Moderators
  const modsUl = document.getElementById("moderatorsList");
  modsUl.innerHTML = "";
  server.moderators.forEach(uid => {
    const li = document.createElement("li");
    li.textContent = uid;
    modsUl.appendChild(li);
  });

  // Render Members
  const membersUl = document.getElementById("membersList");
  membersUl.innerHTML = "";
  server.members.forEach(uid => {
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

  const ownerButton = document.createElement("button");
  ownerButton.textContent = "Manage Roles";
  ownerButton.onclick = () => openRolePanel(server);
  container.appendChild(ownerButton);
}

function openRolePanel(server) {
  // Remove old panel if exists
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

    // Promote button
    const promoteBtn = document.createElement("button");
    promoteBtn.textContent = "Make Moderator";
    promoteBtn.style.marginLeft = "10px";
    promoteBtn.onclick = () => assignModerator(server.id, memberUid);

    // Demote button
    const demoteBtn = document.createElement("button");
    demoteBtn.textContent = "Remove Moderator";
    demoteBtn.style.marginLeft = "5px";
    demoteBtn.onclick = () => removeModerator(server.id, memberUid);

    memberDiv.appendChild(promoteBtn);
    memberDiv.appendChild(demoteBtn);
    panel.appendChild(memberDiv);
  });

  document.getElementById("serverContainer").appendChild(panel);
}

// ----------------------------
// FIRESTORE UPDATE FUNCTIONS
// ----------------------------
async function assignModerator(serverId, memberUid) {
  const serverRef = doc(db, "servers", serverId);

  // Fetch current moderators to prevent overwriting
  const serverSnap = await getDoc(serverRef);
  if (!serverSnap.exists()) return;
  const server = serverSnap.data();

  await updateDoc(serverRef, {
    moderators: Array.from(new Set([...server.moderators, memberUid]))
  });

  alert(memberUid + " is now a moderator!");
  renderServer(server); // refresh UI
}

async function removeModerator(serverId, memberUid) {
  const serverRef = doc(db, "servers", serverId);

  const serverSnap = await getDoc(serverRef);
  if (!serverSnap.exists()) return;
  const server = serverSnap.data();

  await updateDoc(serverRef, {
    moderators: server.moderators.filter(uid => uid !== memberUid)
  });

  alert(memberUid + " is no longer a moderator!");
  renderServer(server); // refresh UI
}

// ----------------------------
// INITIALIZE PAGE
// ----------------------------
async function initServerPage(serverId) {
  const server = await fetchServer(serverId);
  if (!server) return;

  renderServer(server);

  if (server.owners.includes(currentUser.uid)) {
    showOwnerButton(server);
  }
}

// Call initialization
initServerPage("server123"); // replace with your server ID
