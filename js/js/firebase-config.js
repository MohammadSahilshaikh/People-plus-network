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
  getDoc,
  setDoc
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const usersCollection = collection(db, "users");
const productsCollection = collection(db, "products");
const ordersCollection = collection(db, "orders");
const withdrawalsCollection = collection(db, "withdrawals");
const addressesCollection = collection(db, "addresses");
const bankDetailsCollection = collection(db, "bankDetails");

// ============ USER FUNCTIONS ============

async function registerUserFirebase(userData) {
  try {
    // Check if payment is done
    if (userData.paymentStatus !== 'completed') {
      return { success: false, error: "Payment required. Please pay ₹499 to register." };
    }
    
    const q = query(usersCollection, where("email", "==", userData.email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, error: "Email already exists" };
    }
    
    const userId = "PPN" + Math.floor(Math.random() * 90000 + 10000);
    const sponsorId = userData.sponsor || "PPN0001";
    
    // Get sponsor details for referral tracking
    let sponsorData = null;
    if (sponsorId !== "PPN0001") {
      const sponsorQuery = query(usersCollection, where("userId", "==", sponsorId));
      const sponsorSnapshot = await getDocs(sponsorQuery);
      if (!sponsorSnapshot.empty) {
        sponsorSnapshot.forEach(doc => { sponsorData = { id: doc.id, ...doc.data() }; });
      }
    }
    
    const docRef = await addDoc(usersCollection, {
      userId: userId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      sponsor: sponsorId,
      wallet: 0,
      status: "active",
      role: "user",
      joined: new Date().toISOString(),
      profileImage: "img/default-avatar.png",
      directReferrals: 0,
      totalReferrals: 0,
      level: "Starter"
    });
    
    // Update sponsor's referral counts
    if (sponsorData) {
      await updateDoc(doc(db, "users", sponsorData.id), {
        directReferrals: (sponsorData.directReferrals || 0) + 1,
        totalReferrals: (sponsorData.totalReferrals || 0) + 1
      });
      await updateReferralLevels(sponsorData.id);
    }
    
    return { success: true, user: { id: docRef.id, userId: userId, name: userData.name, email: userData.email, role: "user", wallet: 0 } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update referral levels based on direct referrals
async function updateReferralLevels(userId) {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  const directCount = userData.directReferrals || 0;
  
  let level = "Starter";
  if (directCount >= 10) level = "Gold 👑";
  else if (directCount >= 5) level = "Silver 🥈";
  else if (directCount >= 2) level = "Bronze 🥉";
  
  await updateDoc(userRef, { level: level });
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
    
    // Get all referrals (downline users)
    const downlineQuery = query(usersCollection, where("sponsor", "==", userData.userId));
    const downlineSnapshot = await getDocs(downlineQuery);
    const downlineUsers = [];
    downlineSnapshot.forEach(doc => {
      downlineUsers.push({ id: doc.id, ...doc.data() });
    });
    userData.downline = downlineUsers;
    
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

async function updateUser(userId, userData) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, userData);
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

// ============ PRODUCT FUNCTIONS ============

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

// ============ ADDRESS FUNCTIONS ============

async function saveUserAddress(userId, addressData) {
  try {
    const q = query(addressesCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const addressDoc = snapshot.docs[0];
      await updateDoc(doc(db, "addresses", addressDoc.id), addressData);
    } else {
      await addDoc(addressesCollection, { userId: userId, ...addressData });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getUserAddress(userId) {
  try {
    const q = query(addressesCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { success: true, address: snapshot.docs[0].data() };
    }
    return { success: false, address: null };
  } catch (error) {
    return { success: false, address: null };
  }
}

// ============ BANK DETAILS FUNCTIONS ============

async function saveUserBankDetails(userId, bankData) {
  try {
    const q = query(bankDetailsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const bankDoc = snapshot.docs[0];
      await updateDoc(doc(db, "bankDetails", bankDoc.id), bankData);
    } else {
      await addDoc(bankDetailsCollection, { userId: userId, ...bankData });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getUserBankDetails(userId) {
  try {
    const q = query(bankDetailsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { success: true, bankDetails: snapshot.docs[0].data() };
    }
    return { success: false, bankDetails: null };
  } catch (error) {
    return { success: false, bankDetails: null };
  }
}

// ============ ORDER FUNCTIONS ============

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
      address: orderData.address,
      status: "Pending",
      date: new Date().toISOString(),
      tracking: { ordered: true, confirmed: false, shipped: false, delivered: false }
    });
    
    // Add commission to user's wallet (10% on own purchase)
    const commission = orderData.total * 0.1;
    await updateUserWallet(orderData.userId, commission);
    
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

// ============ WITHDRAWAL FUNCTIONS ============

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

// ============ INITIALIZATION ============

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
      joined: new Date().toISOString(),
      profileImage: "img/default-avatar.png"
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
  registerUserFirebase, loginUserFirebase, getAllUsers, updateUserStatus, deleteUser, updateUser,
  updateUserWallet, getAllProducts, addProduct, deleteProduct,
  saveUserAddress, getUserAddress, saveUserBankDetails, getUserBankDetails,
  createOrder, getUserOrders, getAllOrders, updateOrderStatus, cancelOrder,
  requestWithdrawal, getUserWithdrawals, getAllWithdrawals, updateWithdrawalStatus
};