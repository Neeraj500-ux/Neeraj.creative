import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCUPVBb36YZayxp85qkpdZCRVXvMQJMf8g",
  authDomain: "nick-9dbb0.firebaseapp.com",
  projectId: "nick-9dbb0",
  storageBucket: "nick-9dbb0.firebasestorage.app",
  messagingSenderId: "444204613118",
  appId: "1:444204613118:web:d8fba6f021446bf16154af",
  measurementId: "G-0YV6TCYDM2",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });