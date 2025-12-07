import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  listAll
} from "firebase/storage";

// Firebase configuration for WinnStorm (winnstorm-43a69)
const firebaseConfig = {
  apiKey: "AIzaSyDGNJhBSCJSBqLbCUk4U1FwXxyj9xC2LwQ",
  authDomain: "winnstorm-43a69.firebaseapp.com",
  projectId: "winnstorm-43a69",
  storageBucket: "winnstorm-43a69.firebasestorage.app",
  messagingSenderId: "14405529678",
  appId: "1:14405529678:web:2482fbf802c053211d931f",
  measurementId: "G-34LYPC1JP4"
};

// Debug: Log Firebase config (without sensitive values)
console.log("Firebase config loaded:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  try {
    const storageRef = ref(storage, path);
    const result = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(result.ref);
    return { ref: result.ref, downloadURL };
  } catch (error) {
    throw error;
  }
};

export const getFileURL = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    throw error;
  }
};

export const listFiles = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    return result.items;
  } catch (error) {
    throw error;
  }
};

export { auth, storage };
