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

  // TODO: Add Firestore write logic here
  // Example:
  // addDoc(collection(db, "messages"), { text, serverId, uid: currentUser.uid });
}

// ----------------------------
// FETCH AND RENDER SERVER
// ----------------------------
async function fetchServer(serverId) {
  const serverRef = doc(db, "servers", serverId);
  const serverSnap = await getDoc(serverRef);

  if (serverSnap.exists()) {
    return { id: serverSnap.id, ...serverSnap.data() }; // Include ID
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
    li.textContent = uid;
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

  // Prevent duplicate button
  if (document.getElementById("ownerButton")) return;

  const ownerButton = document.createElement("button");
  ownerButton.id = "ownerButton";
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

    // Prevent owner from being demoted
    if (!server.owners.includes(memberUid)) {
      // Promote button
      const promoteBtn = document.createElement("button");
      promoteBtn.textContent = "Make Moderator";
      promoteBtn.style.marginLeft = "10px";
      promoteBtn.onclick = async () => {
        await assignModerator(server.id, memberUid);
        const updatedServer = await fetchServer(server.id);
        renderServer(updatedServer);
        openRolePanel(updatedServer); // Refresh panel
      };

      // Demote button
      const demoteBtn = document.createElement("button");
      demoteBtn.textContent = "Remove Moderator";
      demoteBtn.style.marginLeft = "5px";
      demoteBtn.onclick = async () => {
        await removeModerator(server.id, memberUid);
        const updatedServer = await fetchServer(server.id);
        renderServer(updatedServer);
        openRolePanel(updatedServer); // Refresh panel
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
  alert(memberUid + " is now a moderator!");
}

async function removeModerator(serverId, memberUid) {
  const serverRef = doc(db, "servers", serverId);
  const serverSnap = await getDoc(serverRef);
  if (!serverSnap.exists()) return;

  const server = serverSnap.data();
  const updatedModerators = (server.moderators || []).filter(uid => uid !== memberUid);

  await updateDoc(serverRef, { moderators: updatedModerators });
  alert(memberUid + " is no longer a moderator!");
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

// Call initialization (replace with actual server ID dynamically)
initServerPage("server123");
