(function waitForFirebase() {
  if (
    typeof firebase === "undefined" ||
    !firebase.apps ||
    !firebase.auth ||
    !firebase.firestore
  ) {
    setTimeout(waitForFirebase, 50);
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

  const auth = firebase.auth();
  const db = firebase.firestore();

  const BANNED_WORDS = ["slur1", "slur2", "badword1"];

  function containsBannedWords(text) {
    const lower = String(text || "").toLowerCase();
    return BANNED_WORDS.some((word) =>
      new RegExp(`\\b${word}\\b`, "i").test(lower)
    );
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return "now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  }

  window.firebaseAuth = auth;
  window.db = db;
  window.containsBannedWords = containsBannedWords;
  window.formatTimestamp = formatTimestamp;
})();
