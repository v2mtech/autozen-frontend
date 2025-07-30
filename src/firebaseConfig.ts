import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCQK05oPBFMxH7rVBczRVzucmvf1eYErPI",
  authDomain: "vertice-auto.firebaseapp.com",
  projectId: "vertice-auto",
  storageBucket: "vertice-auto.firebasestorage.app",
  messagingSenderId: "569645721469",
  appId: "1:569645721469:web:2d212375c49f4714674e14",
  measurementId: "G-Z90K55F95M"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);