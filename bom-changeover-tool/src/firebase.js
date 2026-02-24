import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBpmBmqalGNMVgy4bBPcGZoCSpko7vAKJY",
  authDomain: "bom-validation.firebaseapp.com",
  projectId: "bom-validation",
  storageBucket: "bom-validation.firebasestorage.app",
  messagingSenderId: "262071155130",
  appId: "1:262071155130:web:5731dec01ac93f90288583",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
// Pre-select the standardbots.com domain in the Google sign-in popup
googleProvider.setCustomParameters({ hd: 'standardbots.com' });
