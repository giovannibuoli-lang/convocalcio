import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAXMMoCsUWmP5TNgerv2-9vAs9iBQf0fG0",
  authDomain: "convo-calcio.firebaseapp.com",
  projectId: "convo-calcio",
  storageBucket: "convo-calcio.appspot.com",
  messagingSenderId: "384370960727",
  appId: "1:384370960727:web:b2b8cf80f3cd5de2933612"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
