import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';


const firebaseConfig = {
  apiKey: "AIzaSyAOm5UDcqH5q8ZiAcVyErjxhobjbsBXQuI",
  authDomain: "chat-app-18495.firebaseapp.com",
  projectId: "chat-app-18495",
  storageBucket: "chat-app-18495.firebasestorage.app",
  messagingSenderId: "755885710793",
  appId: "1:755885710793:web:5664a858a274e175e21c18"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const database = getDatabase(app)