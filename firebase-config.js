// Firebase yapılandırma
const firebaseConfig = {
    apiKey: "AIzaSyAl-xoWEOMb8W9OKLglduXPwsx4oadeatM",
    authDomain: "annemhikayem-38c31.firebaseapp.com",
    projectId: "annemhikayem-38c31",
    storageBucket: "annemhikayem-38c31.firebasestorage.app",
    messagingSenderId: "127263303212",
    appId: "1:127263303212:web:1023d3c4c24e58f1ab5389",
    measurementId: "G-B82MFS26HN"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firestore, Auth ve Storage referansları
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

