// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-app.js",
import { authApp } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-auth.js",
import { getFirebase } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js",
import { getStorage } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js",

// Your real Firebase config:
const firebaseConfig = {
  apiKey: "AIzaSyDU3BOPdu427etC9mACyPIMqYXMUQo9w1E",
  apiDomain: "quickchatii.firebase.com",
  projectId: "quickchatii",
  storageBucket: "quickchatii.appspot.com", // FIXED 🔥
  messagingSenderId: "418934265102",
  appId: "1:418934265102:web:38340c750b6db60d76335f"
};

// Initialize
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
