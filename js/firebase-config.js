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

// Your Firebase Config
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

// Collection References
const usersCollection = collection(db, "users");
const productsCollection = collection(db, "products");
const ordersCollection = collection(db, "orders");
const withdrawalsCollection = collection(db, "withdrawals");
const addressesCollection = collection(db, "addresses");
const bankDetailsCollection = collection(db, "bankDetails");

// ============ USER FUNCTIONS ============

// Register User
async function registerUserFirebase(userData) {
  try {
    const q = query(usersCollection, where("email", "==", userData.email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, error: "Email already exists" };
    }
    
    const userId = "PPN" + Math.floor(Math.random() * 90000 + 10000);
    
    // Get sponsor details for referral tracking
    let sponsorData = null;
    if (userData.sponsor && userData.sponsor !== "PPN0001") {
      const sponsorQuery = query(usersCollection, where("userId", "==", userData.sponsor));
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
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const directCount = userData.directReferrals || 0;
    
    let level = "Starter";
    if (directCount >= 50) level = "Platinum 👑";
    else if (directCount >= 25) level = "Gold 🏆";
    else if (directCount >= 10) level = "Silver 🥈";
    else if (directCount >= 5) level = "Bronze 🥉";
    
    await updateDoc(userRef, { level: level });
  } catch (error) {
    console.error("Error updating referral levels:", error);
  }
}

// Login User
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
    
    // Get downline users (for team display)
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

// Get All Users (Admin)
async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(usersCollection);
    const users = [];
    querySnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}

// Get Single User
async function getUser(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return { success: true, user: { id: userDoc.id, ...userDoc.data() } };
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update User (Admin/Profile)
async function updateUser(userId, userData) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, userData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update User Status (Admin)
async function updateUserStatus(userId, status) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { status: status });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delete User (Admin)
async function deleteUser(userId) {
  try {
    await deleteDoc(doc(db, "users", userId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update User Wallet
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

// Get User's Downline (Team)
async function getUserDownline(sponsorId) {
  try {
    const q = query(usersCollection, where("sponsor", "==", sponsorId));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("Error getting downline:", error);
    return [];
  }
}

// ============ PRODUCT FUNCTIONS ============

// Get All Products
async function getAllProducts() {
  try {
    const querySnapshot = await getDocs(productsCollection);
    const products = [];
    querySnapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error("Error getting products:", error);
    return [];
  }
}

// Add Product (Admin)
async function addProduct(productData) {
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

// Delete Product (Admin)
async function deleteProduct(productId) {
  try {
    await deleteDoc(doc(db, "products", productId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update Product (Admin)
async function updateProduct(productId, productData) {
  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, productData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============ ADDRESS FUNCTIONS ============

// Save User Address
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

// Get User Address
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

// Save User Bank Details
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

// Get User Bank Details
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

// Create Order
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
      tracking: {
        ordered: true,
        confirmed: false,
        shipped: false,
        delivered: false
      }
    });
    
    // Add commission to user's wallet (10% on own purchase)
    const commission = orderData.total * 0.1;
    await updateUserWallet(orderData.userId, commission);
    
    return { success: true, orderId: orderId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get User Orders
async function getUserOrders(userEmail) {
  try {
    const q = query(ordersCollection, where("userEmail", "==", userEmail));
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    // Sort by date descending
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    return orders;
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
}

// Get All Orders (Admin)
async function getAllOrders() {
  try {
    const querySnapshot = await getDocs(ordersCollection);
    const orders = [];
    querySnapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    // Sort by date descending
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    return orders;
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
}

// Update Order Status (Admin)
async function updateOrderStatus(orderId, status, tracking) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: status, tracking: tracking });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Cancel Order
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

// Request Withdrawal
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
    
    // Deduct from wallet
    await updateUserWallet(withdrawalData.userId, -withdrawalData.amount);
    return { success: true, withdrawalId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get User Withdrawals
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
    console.error("Error getting withdrawals:", error);
    return [];
  }
}

// Get All Withdrawals (Admin)
async function getAllWithdrawals() {
  try {
    const querySnapshot = await getDocs(withdrawalsCollection);
    const withdrawals = [];
    querySnapshot.forEach(doc => {
      withdrawals.push({ id: doc.id, ...doc.data() });
    });
    return withdrawals;
  } catch (error) {
    console.error("Error getting withdrawals:", error);
    return [];
  }
}

// Update Withdrawal Status (Admin)
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

// ============ CREATE DEFAULT ADMIN & PRODUCTS ============

// Create Default Admin
async function createDefaultAdmin() {
  try {
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
        profileImage: "img/default-avatar.png",
        directReferrals: 0,
        totalReferrals: 0,
        level: "Platinum 👑"
      });
      console.log("✅ Default admin created");
    }
  } catch (error) {
    console.error("Error creating admin:", error);
  }
}

// Create Default Products
async function createDefaultProducts() {
  try {
    const querySnapshot = await getDocs(productsCollection);
    
    if (querySnapshot.empty) {
      const defaultProducts = [
        { name: "Ayurvedic Protein Powder", price: 999, mrp: 1499, stock: 250, image: "https://picsum.photos/300/250?random=1", desc: "Pure Ayurvedic protein powder for daily health" },
        { name: "Herbal Immunity Tea", price: 599, mrp: 999, stock: 500, image: "https://picsum.photos/300/250?random=2", desc: "Boost your immunity naturally" },
        { name: "Organic Skin Cream", price: 799, mrp: 1299, stock: 300, image: "https://picsum.photos/300/250?random=3", desc: "Natural skin care cream" },
        { name: "Nutrition Supplement", price: 1499, mrp: 2499, stock: 200, image: "https://picsum.photos/300/250?random=4", desc: "Complete daily nutrition" }
      ];
      
      for (const product of defaultProducts) {
        await addDoc(productsCollection, product);
      }
      console.log("✅ Default products created");
    }
  } catch (error) {
    console.error("Error creating products:", error);
  }
}

// Initialize Firebase Data
async function initFirebase() {
  await createDefaultAdmin();
  await createDefaultProducts();
}

initFirebase();

// ============ EXPORT FUNCTIONS ============
window.firebaseAPI = {
  // User functions
  registerUserFirebase,
  loginUserFirebase,
  getAllUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  updateUserWallet,
  getUserDownline,
  
  // Product functions
  getAllProducts,
  addProduct,
  deleteProduct,
  updateProduct,
  
  // Address functions
  saveUserAddress,
  getUserAddress,
  
  // Bank details functions
  saveUserBankDetails,
  getUserBankDetails,
  
  // Order functions
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  
  // Withdrawal functions
  requestWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus
};