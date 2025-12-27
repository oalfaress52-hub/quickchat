<!-- Firebase SDKs (classic / compat) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>

<!-- Your Firebase init -->
<script src="frontend/firebase.js"></script>

<!-- App logic -->
<script src="frontend/app.js"></script>

// ===== Signup Form =====
const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCred) => {
        return userCred.user.updateProfile({
          displayName: username
        });
      })
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => {
        alert(err.message);
      });
  });
}

auth.onAuthStateChanged((user) => {
  const onChatPage = window.location.pathname.endsWith("index.html") ||
                     window.location.pathname === "/" ||
                     window.location.pathname.endsWith("/");

  if (!user && onChatPage) {
    window.location.href = "login.html";
  }
});

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
      .catch((err) => {
        alert(err.message);
      });
  });
}

// ===== Profile Form =====
const profileForm = document.getElementById('profile-form');
if (profileForm) {
  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('profile-username').value.trim();
    const email = document.getElementById('profile-email').value.trim();

    alert(`Profile updated!\nUsername: ${username}\nEmail: ${email}`);
    // TODO: Connect to backend (Firebase)
  });
}

// ===== Chat Form =====
const chatForm = document.getElementById('chat-form');
const messagesDiv = document.getElementById('messages');
if (chatForm) {
  const input = document.getElementById('message-input');
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (msg === '') return;

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.textContent = msg;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    input.value = '';
  });
}

// =========================
// Phase 2B — CHAT MESSAGES
// =========================

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messagesDiv = document.getElementById("messages");

// Send message
if (messageForm) {
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const text = messageInput.value.trim();
    if (!text) return;

    db.collection("messages").add({
      text: text,
      uid: auth.currentUser.uid,
      sender: auth.currentUser.displayName || "Anonymous",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    messageInput.value = "";
  });
}

// Listen for new messages
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
