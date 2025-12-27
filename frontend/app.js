// =========================
// AUTH REFERENCES
// =========================

const auth = firebase.auth();
const db = firebase.firestore();

// =========================
// SIGNUP
// =========================

const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCred) => {
  const user = userCred.user;

  return Promise.all([
    user.updateProfile({ displayName: username }),
    db.collection("users").doc(user.uid).set({
      username: username,
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
  ]);
})
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => alert(err.message));
  });
}

// =========================
// LOGIN
// =========================

const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => alert(err.message));
  });
}

// =========================
// AUTH GUARD (CHAT PAGE)
// =========================

auth.onAuthStateChanged((user) => {
  const onChatPage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/");

  if (!user && onChatPage) {
    window.location.href = "login.html";
  }
});

// =========================
// PROFILE — LOAD & SAVE
// =========================

const profileForm = document.getElementById("profile-form");

if (profileForm) {
  const usernameInput = document.getElementById("profile-username");
  const emailInput = document.getElementById("profile-email");

  auth.onAuthStateChanged((user) => {
    if (!user) return;

    db.collection("users").doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          usernameInput.value = data.username || "";
          emailInput.value = data.email || user.email;
        }
      });
  });

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const user = auth.currentUser;

    if (!user) return;

    Promise.all([
      user.updateProfile({ displayName: username }),
      user.updateEmail(email),
      db.collection("users").doc(user.uid).update({
        username: username,
        email: email,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
    ])
    .then(() => {
      alert("Profile updated successfully!");
    })
    .catch((err) => alert(err.message));
  });
}

// =========================
// CHAT DOM REFERENCES
// =========================

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messagesDiv = document.getElementById("messages");

// =========================
// PHASE 2C — GLOBAL SLOW MODE
// =========================

const SLOW_MODE_MS = 3000;

function sendMessage(text) {
  const user = auth.currentUser;
  if (!user) return;

  const metaRef = db.collection("message_meta").doc(user.uid);
  const msgRef = db.collection("messages").doc();

  db.runTransaction(async (tx) => {
    const metaDoc = await tx.get(metaRef);
    const now = Date.now();

    if (metaDoc.exists) {
      const last = metaDoc.data().lastMessageAt?.toMillis?.() || 0;
      if (now - last < SLOW_MODE_MS) {
        throw new Error("SLOW_MODE");
      }
    }

    tx.set(metaRef, {
      lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    tx.set(msgRef, {
      text,
      uid: user.uid,
      sender: user.displayName || "Anonymous",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).catch((err) => {
    if (err.message === "SLOW_MODE") {
      alert("Please wait before sending another message.");
    } else {
      alert(err.message);
    }
  });
}

// =========================
// MESSAGE LISTENER
// =========================

if (messagesDiv) {
  db.collection("messages")
    .orderBy("timestamp")
    .limit(50)
    .onSnapshot((snapshot) => {
      messagesDiv.innerHTML = "";

      snapshot.forEach((doc) => {
        const msg = doc.data();
        const div = document.createElement("div");
        div.textContent = `${msg.sender}: ${msg.text}`;
        messagesDiv.appendChild(div);
      });

      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// =========================
// FINAL SUBMIT HANDLER
// =========================

if (messageForm) {
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const text = messageInput.value.trim();
    if (!text) return;

    sendMessage(text);
    messageInput.value = "";
  });
}
