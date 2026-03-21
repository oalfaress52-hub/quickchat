(function waitForFirebase() {
  function reportLoadStatus(name, error) {
    if (error) {
      console.error(`error "${name}" didnt load ❌`, error);
      return;
    }
    console.info(`"${name}" succesfully loaded ✔`);
  }

  window.reportLoadStatus = reportLoadStatus;

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

  function containsBannedWords(text) {
    if (typeof window.containsBlacklistedWords === "function") {
      return window.containsBlacklistedWords(text).flagged;
    }
    return false;
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return "now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  }

  function avatarLetter(value) {
    const normalized = String(value || "").trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(normalized) ? normalized : "A";
  }

  function avatarColor(letter) {
    const palette = [
      "#4F46E5", "#0F766E", "#B45309", "#BE123C", "#7C3AED", "#0369A1",
      "#15803D", "#A21CAF", "#C2410C", "#1D4ED8", "#4338CA", "#0D9488"
    ];
    const charCode = avatarLetter(letter).charCodeAt(0) - 65;
    return palette[((charCode % palette.length) + palette.length) % palette.length];
  }

  function avatarProfilePictureForName(value) {
    const letter = avatarLetter(value);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${letter} avatar">
        <rect width="96" height="96" rx="24" fill="${avatarColor(letter)}"></rect>
        <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle"
          font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#ffffff">${letter}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function resolveProfilePicture(profilePicture, fallbackValue) {
    const normalized = String(profilePicture || "").trim();
    if (!normalized || /^images\/pfp\/[a-z]\.png$/i.test(normalized)) {
      return avatarProfilePictureForName(fallbackValue);
    }
    return normalized;
  }

  window.firebaseAuth = auth;
  window.db = db;
  window.containsBannedWords = containsBannedWords;
  window.formatTimestamp = formatTimestamp;
  window.avatarLetter = avatarLetter;
  window.avatarProfilePictureForName = avatarProfilePictureForName;
  window.resolveProfilePicture = resolveProfilePicture;
  reportLoadStatus("Firebase bootstrap");
})();
