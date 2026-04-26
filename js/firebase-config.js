// ============ COMPLETE FIREBASE CONFIGURATION WITH AUTH ============

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  setDoc
};

// ✅ YEH IMPORT MISSING THA - AB ADD KAR DIYA
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup
};

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbjm0SEvm08Sl6adjeF_v3pSscbPtmTdo",
  authDomain: "people-plus-network.firebaseapp.com",
  projectId: "people-plus-network",
  storageBucket: "people-plus-network.firebasestorage.app",
  messagingSenderId: "981097644678",
  appId: "1:981097644678:web:a19be14e90e580414f0707",
  measurementId: "G-422JG8E9KM"
};

export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000/api' 
  : '/api';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);  // ✅ YEH AB KAAM KAREGA
export const googleProvider = new GoogleAuthProvider();

// Collections
const usersCollection = collection(db, "users");
const productsCollection = collection(db, "products");
const ordersCollection = collection(db, "orders");
const withdrawalsCollection = collection(db, "withdrawals");

// ============ REGISTER USER (WITH FIREBASE AUTH) ============
export async function registerUserFirebase(userData) {
  try {
    // Check if email already exists in Firestore
    const q = query(usersCollection, where("email", "==", userData.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, error: "Email already exists" };
    }
    
    // ✅ Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const firebaseUser = userCredential.user;
    
    // Generate unique user ID
    const userId = "PPN" + Math.floor(Math.random() * 90000 + 10000);
    
    // ✅ Save user to Firestore with UID from Auth
    await setDoc(doc(db, "users", firebaseUser.uid), {
      uid: firebaseUser.uid,
      userId: userId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      sponsor: userData.sponsor || "PPN0001",
      wallet: 0,
      status: "active",
      role: "user",
      joined: new Date().toISOString(),
      profileImage: "img/default-avatar.png",
      directReferrals: 0,
      totalReferrals: 0,
      level: "Starter"
    });
    
    return { success: true, user: { uid: firebaseUser.uid, userId: userId, name: userData.name, email: userData.email, role: "user", wallet: 0 } };
  } catch (error) {
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "Email already registered";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Password should be at least 6 characters";
    }
    return { success: false, error: errorMessage };
  }
}

// ============ LOGIN USER (WITH FIREBASE AUTH) ============
export async function loginUserFirebase(email, password) {
  try {
    // ✅ Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // ✅ Get user data from Firestore using UID
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return { success: false, error: "User data not found" };
    }
    
    const userData = { uid: firebaseUser.uid, ...userDoc.data() };
    return { success: true, user: userData };
  } catch (error) {
    if (error.code === 'auth/invalid-credential') {
      return { success: false, error: "Invalid email or password" };
    } else if (error.code === 'auth/user-not-found') {
      return { success: false, error: "No account found with this email" };
    } else if (error.code === 'auth/wrong-password') {
      return { success: false, error: "Incorrect password" };
    }
    return { success: false, error: error.message };
  }
}

// ============ LOGIN WITH GOOGLE ============
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    
    if (!userDoc.exists()) {
      // Create new user if doesn't exist
      const userId = "PPN" + Math.floor(Math.random() * 90000 + 10000);
      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        userId: userId,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || "",
        sponsor: "PPN0001",
        wallet: 0,
        status: "active",
        role: "user",
        joined: new Date().toISOString(),
        profileImage: firebaseUser.photoURL || "img/default-avatar.png",
        directReferrals: 0,
        totalReferrals: 0,
        level: "Starter"
      });
    }
    
    const userData = { uid: firebaseUser.uid, ...(await getDoc(doc(db, "users", firebaseUser.uid))).data() };
    return { success: true, user: userData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ LOGOUT USER ============
export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem('currentUser');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ GET CURRENT USER ============
export function getCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          resolve({ uid: user.uid, ...userDoc.data() });
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
}

// ============ GET ALL USERS ============
export async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(usersCollection);
    const users = [];
    querySnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    return [];
  }
}

// ============ UPDATE USER STATUS ============
export async function updateUserStatus(userId, status) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { status: status });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ DELETE USER ============
export async function deleteUser(userId) {
  try {
    await deleteDoc(doc(db, "users", userId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ UPDATE USER WALLET ============
export async function updateUserWallet(userId, amount) {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const currentWallet = userDoc.data()?.wallet || 0;
    await updateDoc(userRef, { wallet: currentWallet + amount });
    return { success: true, newWallet: currentWallet + amount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ GET ALL PRODUCTS ============
export async function getAllProducts() {
  try {
    const querySnapshot = await getDocs(productsCollection);
    const products = [];
    querySnapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    return [];
  }
}

// ============ ADD PRODUCT ============
export async function addProduct(productData) {
  try {
    const docRef = await addDoc(productsCollection, {
      name: productData.name,
      price: productData.price,
      mrp: productData.mrp,
      stock: productData.stock || 100,
      image: productData.image || "https://picsum.photos/300/250",
      desc: productData.desc || "",
      status: "active",
      createdAt: new Date().toISOString()
    });
    return { success: true, productId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ DELETE PRODUCT ============
export async function deleteProduct(productId) {
  try {
    await deleteDoc(doc(db, "products", productId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ GET ALL ORDERS ============
export async function getAllOrders() {
  try {
    const querySnapshot = await getDocs(ordersCollection);
    const orders = [];
    querySnapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return orders;
  } catch (error) {
    return [];
  }
}

// ============ UPDATE ORDER STATUS ============
export async function updateOrderStatus(orderId, status, tracking) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: status, tracking: tracking, updatedAt: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ GET ALL WITHDRAWALS ============
export async function getAllWithdrawals() {
  try {
    const querySnapshot = await getDocs(withdrawalsCollection);
    const withdrawals = [];
    querySnapshot.forEach(doc => {
      withdrawals.push({ id: doc.id, ...doc.data() });
    });
    return withdrawals;
  } catch (error) {
    return [];
  }
}

// ============ UPDATE WITHDRAWAL STATUS ============
export async function updateWithdrawalStatus(withdrawalId, status, userId, amount) {
  try {
    const withdrawalRef = doc(db, "withdrawals", withdrawalId);
    await updateDoc(withdrawalRef, { status: status, processedAt: new Date().toISOString() });
    if (status === "Rejected") {
      await updateUserWallet(userId, amount);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ CREATE DEFAULT ADMIN (WITH AUTH) ============
async function createDefaultAdmin() {
  try {
    const q = query(usersCollection, where("email", "==", "admin@peopleplus.com"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // ✅ Create admin in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, "admin@peopleplus.com", "admin123");
      const firebaseUser = userCredential.user;
      
      // ✅ Create admin in Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        userId: "ADMIN001",
        name: "Super Admin",
        email: "admin@peopleplus.com",
        phone: "9999999999",
        role: "admin",
        status: "active",
        wallet: 0,
        joined: new Date().toISOString(),
        profileImage: "img/default-avatar.png"
      });
      console.log("✅ Default admin created");
      console.log("📧 Email: admin@peopleplus.com");
      console.log("🔑 Password: admin123");
    }
  } catch (error) {
    if (error.code !== 'auth/email-already-in-use') {
      console.log("Admin creation error:", error.message);
    }
  }
}

// ============ CREATE DEFAULT PRODUCTS ============
async function createDefaultProducts() {
  const querySnapshot = await getDocs(productsCollection);
  if (querySnapshot.empty) {
    const defaultProducts = [
      { name: "Ayurvedic Protein Powder", price: 999, mrp: 1499, stock: 250, image: "https://picsum.photos/300/250?random=1", desc: "Pure Ayurvedic protein powder" },
      { name: "Herbal Immunity Tea", price: 599, mrp: 999, stock: 500, image: "https://picsum.photos/300/250?random=2", desc: "Boost your immunity" },
      { name: "Organic Skin Cream", price: 799, mrp: 1299, stock: 300, image: "https://picsum.photos/300/250?random=3", desc: "Natural skin care" },
      { name: "Nutrition Supplement", price: 1499, mrp: 2499, stock: 200, image: "https://picsum.photos/300/250?random=4", desc: "Complete nutrition" }
    ];
    for (const product of defaultProducts) {
      await addDoc(productsCollection, product);
    }
    console.log("✅ Default products created");
  }
}

// Initialize Firebase
async function initFirebase() {
  await createDefaultAdmin();
  await createDefaultProducts();
  console.log("✅ Firebase initialized successfully!");
}

// Auto-run initialization
initFirebase();

// ============ EXPORT ALL FUNCTIONS ============
window.firebaseAPI = {
  registerUserFirebase,
  loginUserFirebase,
  loginWithGoogle,
  logoutUser,
  getCurrentUser,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  updateUserWallet,
  getAllProducts,
  addProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllWithdrawals,
  updateWithdrawalStatus
};

// Also export auth for other files
window.auth = auth;
window.db = db;

console.log("✅ Firebase configuration loaded with Authentication!");