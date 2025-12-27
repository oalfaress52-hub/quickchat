import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDU3BOPdu427etC9mACyPIMqYXMUQo9w1E",
  authDomain: "quickchatii.firebaseapp.com",
  projectId: "quickchatii",
  storageBucket: "quickchatii.firebasestorage.app",
  messagingSenderId: "418934265102",
  appId: "1:418934265102:web:38340c750b6db60d76335f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
