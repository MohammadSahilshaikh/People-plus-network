// Firebase Configuration
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
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbjm0SEvm08Sl6adjeF_v3pSscbPtmTdo",
  authDomain: "people-plus-network.firebaseapp.com",
  projectId: "people-plus-network",
  storageBucket: "people-plus-network.firebasestorage.app",
  messagingSenderId: "981097644678",
  appId: "1:981097644678:web:a19be14e90e580414f0707",
  measurementId: "G-422JG8E9KM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const usersCollection = collection(db, "users");
const productsCollection = collection(db, "products");
const ordersCollection = collection(db, "orders");
const withdrawalsCollection = collection(db, "withdrawals");

// ============ USER FUNCTIONS ============

async function registerUserFirebase(userData) {
  try {
    const q = query(usersCollection, where("email", "==", userData.email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, error: "Email already exists" };
    }
    
    const userId = "PPN" + Math.floor(Math.random() * 90000 + 10000);
    const docRef = await addDoc(usersCollection, {
      userId: userId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      sponsor: userData.sponsor || "PPN0001",
      wallet: 25000,
      status: "active",
      role: "user",
      joined: new Date().toISOString(),
      directReferrals: 0,
      totalReferrals: 0,
      level: "Starter"
    });
    
    return { success: true, user: { id: docRef.id, userId: userId, name: userData.name, email: userData.email, role: "user", wallet: 25000 } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function loginUserFirebase(email, password) {
  try {
    const q = query(usersCollection, where("email", "==", email), where("password", "==", password));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: "Invalid credentials" };
    }
    
    let userData = null;
    querySnapshot.forEach(doc => {
      userData = { id: doc.id, ...doc.data() };
    });
    
    return { success: true, user: userData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllUsers() {
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

async function updateUserStatus(userId, status) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { status: status });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteUser(userId) {
  try {
    await deleteDoc(doc(db, "users", userId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateUserWallet(userId, amount) {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const currentWallet = userDoc.data()?.wallet || 0;
    await updateDoc(userRef, { wallet: currentWallet + amount });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllProducts() {
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

async function addProduct(productData) {
  try {
    const docRef = await addDoc(productsCollection, {
      name: productData.name,
      price: productData.price,
      mrp: productData.mrp,
      stock: productData.stock || 100,
      image: productData.image || "https://via.placeholder.com/300x250/667eea/white?text=Product",
      desc: productData.desc || "",
      status: "active"
    });
    return { success: true, productId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteProduct(productId) {
  try {
    await deleteDoc(doc(db, "products", productId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createOrder(orderData) {
  try {
    const orderId = "ORD" + Date.now();
    const docRef = await addDoc(ordersCollection, {
      orderId: orderId,
      userId: orderData.userId,
      userName: orderData.userName,
      userEmail: orderData.userEmail,
      items: orderData.items,
      total: orderData.total,
      status: "Pending",
      date: new Date().toISOString(),
      tracking: { ordered: true, confirmed: false, shipped: false, delivered: false }
    });
    return { success: true, orderId: orderId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getUserOrders(userEmail) {
  try {
    const q = query(ordersCollection, where("userEmail", "==", userEmail));
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    return orders;
  } catch (error) {
    return [];
  }
}

async function getAllOrders() {
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

async function updateOrderStatus(orderId, status, tracking) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: status, tracking: tracking });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function cancelOrder(orderId, userId, total) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: "Cancelled" });
    await updateUserWallet(userId, total);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function requestWithdrawal(withdrawalData) {
  try {
    const docRef = await addDoc(withdrawalsCollection, {
      userId: withdrawalData.userId,
      userName: withdrawalData.userName,
      userEmail: withdrawalData.userEmail,
      amount: withdrawalData.amount,
      bankDetails: withdrawalData.bankDetails,
      fullBankDetails: withdrawalData.fullBankDetails,
      status: "Pending",
      date: new Date().toISOString()
    });
    await updateUserWallet(withdrawalData.userId, -withdrawalData.amount);
    return { success: true, withdrawalId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getUserWithdrawals(userEmail) {
  try {
    const q = query(withdrawalsCollection, where("userEmail", "==", userEmail));
    const querySnapshot = await getDocs(q);
    const withdrawals = [];
    querySnapshot.forEach(doc => {
      withdrawals.push({ id: doc.id, ...doc.data() });
    });
    return withdrawals;
  } catch (error) {
    return [];
  }
}

async function getAllWithdrawals() {
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

async function updateWithdrawalStatus(withdrawalId, status, userId, amount) {
  try {
    const withdrawalRef = doc(db, "withdrawals", withdrawalId);
    await updateDoc(withdrawalRef, { status: status });
    if (status === "Rejected") {
      await updateUserWallet(userId, amount);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createDefaultAdmin() {
  const q = query(usersCollection, where("email", "==", "admin@peopleplus.com"));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    await addDoc(usersCollection, {
      userId: "ADMIN001",
      name: "Super Admin",
      email: "admin@peopleplus.com",
      phone: "9999999999",
      password: "admin123",
      role: "admin",
      status: "active",
      wallet: 0,
      joined: new Date().toISOString()
    });
    console.log("✅ Default admin created");
  }
}

async function createDefaultProducts() {
  const querySnapshot = await getDocs(productsCollection);
  
  if (querySnapshot.empty) {
    const defaultProducts = [
      { name: "Ayurvedic Protein Powder", price: 999, mrp: 1499, stock: 250, image: "https://via.placeholder.com/300x250/667eea/white?text=Protein", desc: "Pure Ayurvedic protein powder" },
      { name: "Herbal Immunity Tea", price: 599, mrp: 999, stock: 500, image: "https://via.placeholder.com/300x250/764ba2/white?text=Tea", desc: "Boost your immunity" },
      { name: "Organic Skin Cream", price: 799, mrp: 1299, stock: 300, image: "https://via.placeholder.com/300x250/667eea/white?text=Cream", desc: "Natural skin care" },
      { name: "Nutrition Supplement", price: 1499, mrp: 2499, stock: 200, image: "https://via.placeholder.com/300x250/764ba2/white?text=Supplement", desc: "Complete nutrition" }
    ];
    
    for (const product of defaultProducts) {
      await addDoc(productsCollection, product);
    }
    console.log("✅ Default products created");
  }
}

async function initFirebase() {
  await createDefaultAdmin();
  await createDefaultProducts();
}

initFirebase();

window.firebaseAPI = {
  registerUserFirebase,
  loginUserFirebase,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  updateUserWallet,
  getAllProducts,
  addProduct,
  deleteProduct,
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  requestWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus
};