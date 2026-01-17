// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDU3BOPdu427etC9mACyPIMqYXMUQo9w1E",
  authDomain: "quickchatii.firebaseapp.com",
  projectId: "quickchatii",
  storageBucket: "quickchatii.firebasestorage.app",
  messagingSenderId: "418934265102",
  appId: "1:418934265102:web:38340c750b6db60d76335f"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
