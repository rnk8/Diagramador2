// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBNNgBtKoEWotHALUmnWCAIon-aqow3HNs",
  authDomain: "diagramador-6785a.firebaseapp.com",
  projectId: "diagramador-6785a",
  storageBucket: "diagramador-6785a.appspot.com",
  messagingSenderId: "355447019612",
  appId: "1:355447019612:web:e4897ddcc454f49282ee99",
  measurementId: "G-XVP864DSF9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Exportar auth
export const db = getFirestore(app); // Exportar Firestore

// Solo necesitas exportar `app` adicionalmente
export { app };
