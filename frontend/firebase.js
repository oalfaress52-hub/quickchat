// Firebase configuration (public, safe to expose)
const firebaseConfig = {
  apiKey: "AIzaSyDynYqIvEb-lWjsWwV6x6gkXkQk_sR8dmo",
  authDomain: "quickchat-ed02b.firebaseapp.com",
  projectId: "quickchat-ed02b",
  storageBucket: "quickchat-ed02b.firebasestorage.app",
  messagingSenderId: "664727825006",
  appId: "1:664727825006:web:3db33664d3525a2f3a147f"
};

// Initialize Firebase (compat)
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
