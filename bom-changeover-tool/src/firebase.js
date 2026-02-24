import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
