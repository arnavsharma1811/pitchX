// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBNfCPsfEX7wwARD9zUrZDnDyBsPKFSVxI",
  authDomain: "pitchx-af148.firebaseapp.com",
  projectId: "pitchx-af148",
  storageBucket: "pitchx-af148.firebasestorage.app",
  messagingSenderId: "302376605146",
  appId: "1:302376605146:web:0550ac3950f2af01d71ce3",
  measurementId: "G-7375BWQ4DE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);