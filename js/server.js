// ============ PEOPLE PLUS NETWORK - PURE FIREBASE BACKEND ============
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============ FIREBASE ADMIN INITIALIZATION ============
// Download service account key from Firebase Console:
// Project Settings -> Service Accounts -> Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "people-plus-network"
});

const db = admin.firestore();
const auth = admin.auth();

// Collections
const usersCollection = db.collection('users');
const productsCollection = db.collection('products');
const ordersCollection = db.collection('orders');
const withdrawalsCollection = db.collection('withdrawals');
const commissionsCollection = db.collection('commissions');
const otpCollection = db.collection('otp');

// ============ EMAIL TRANSPORTER (OTP) ============
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOTPEmail(email, name, otp) {
    try {
        await transporter.sendMail({
            from: `"People Plus Network" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Your OTP - People Plus Network',
            html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border-radius:10px;border:1px solid #eee;">
                <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:20px;border-radius:8px;text-align:center;">
                    <h2 style="color:white;margin:0;">People Plus Network</h2>
                    <p style="color:rgba(255,255,255,0.85);margin:5px 0;">Email Verification</p>
                </div>
                <div style="padding:25px 0;">
                    <p style="font-size:16px;">Hi <strong>${name}</strong>,</p>
                    <p>Your OTP for verification is:</p>
                    <div style="text-align:center;margin:25px 0;">
                        <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#667eea;background:#f0f0ff;padding:15px 25px;border-radius:8px;">${otp}</span>
                    </div>
                    <p style="color:#888;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
                </div>
                <div style="border-top:1px solid #eee;padding-top:15px;text-align:center;color:#aaa;font-size:12px;">
                    People Plus Network &copy; 2024
                </div>
            </div>`
        });
        return true;
    } catch (err) {
        console.error('Email send error:', err.message);
        return false;
    }
}

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============ AUTH MIDDLEWARE ============
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        
        // Get user data from Firestore
        const userDoc = await usersCollection.doc(decodedToken.uid).get();
        if (userDoc.exists) {
            req.userData = { uid: decodedToken.uid, ...userDoc.data() };
        }
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.userData?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ============ HELPER FUNCTIONS ============

// Generate unique user ID
function generateUserId() {
    return 'PPN' + Math.floor(Math.random() * 90000 + 10000);
}

// Calculate referral commission
async function calculateReferralCommission(userId, amount, userName) {
    try {
        const userDoc = await usersCollection.doc(userId).get();
        const user = userDoc.data();
        
        if (!user || !user.sponsor) return;
        
        // Level 1 commission (10%)
        const sponsorDoc = await usersCollection.doc(user.sponsor).get();
        if (sponsorDoc.exists) {
            const sponsor = sponsorDoc.data();
            const level1Commission = amount * 0.10;
            
            if (level1Commission > 0) {
                await usersCollection.doc(user.sponsor).update({
                    wallet: admin.firestore.FieldValue.increment(level1Commission)
                });
                
                await commissionsCollection.add({
                    userId: user.sponsor,
                    userName: sponsor.name,
                    amount: level1Commission,
                    level: 1,
                    fromUser: userName,
                    fromUserId: userId,
                    description: `Commission from ${userName}'s purchase`,
                    date: new Date().toISOString(),
                    status: 'Approved'
                });
            }
            
            // Level 2 commission (5%)
            if (sponsor.sponsor && sponsor.sponsor !== 'PPN0001') {
                const sponsor2Doc = await usersCollection.doc(sponsor.sponsor).get();
                if (sponsor2Doc.exists) {
                    const sponsor2 = sponsor2Doc.data();
                    const level2Commission = amount * 0.05;
                    
                    if (level2Commission > 0) {
                        await usersCollection.doc(sponsor.sponsor).update({
                            wallet: admin.firestore.FieldValue.increment(level2Commission)
                        });
                        
                        await commissionsCollection.add({
                            userId: sponsor.sponsor,
                            userName: sponsor2.name,
                            amount: level2Commission,
                            level: 2,
                            fromUser: userName,
                            fromUserId: userId,
                            description: `Commission from ${userName}'s purchase (Level 2)`,
                            date: new Date().toISOString(),
                            status: 'Approved'
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Commission calculation error:', error);
    }
}

// ============ AUTH ROUTES ============

// REGISTER - Step 1
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password, sponsor } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists in Firebase Auth
        try {
            const existingUser = await auth.getUserByEmail(email);
            if (existingUser) {
                // Check if verified
                const userDoc = await usersCollection.doc(existingUser.uid).get();
                if (userDoc.exists && userDoc.data().isVerified) {
                    return res.status(400).json({ error: 'Email already registered' });
                }
            }
        } catch (error) {
            // User doesn't exist, continue
        }

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: name,
            emailVerified: false
        });

        const userId = generateUserId();
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Save user to Firestore
        await usersCollection.doc(userRecord.uid).set({
            uid: userRecord.uid,
            userId: userId,
            name: name,
            email: email,
            phone: phone,
            sponsor: sponsor || 'PPN0001',
            wallet: 0,
            status: 'active',
            role: 'user',
            isVerified: false,
            otp: otp,
            otpExpires: otpExpires,
            joined: new Date().toISOString(),
            profileImage: 'img/default-avatar.png',
            directReferrals: 0,
            totalReferrals: 0,
            level: 'Starter'
        });

        // Save OTP to separate collection
        await otpCollection.doc(email).set({
            otp: otp,
            expires: otpExpires,
            createdAt: new Date().toISOString()
        });

        // Update sponsor's referral count
        if (sponsor && sponsor !== 'PPN0001') {
            const sponsorQuery = await usersCollection.where('userId', '==', sponsor).get();
            if (!sponsorQuery.empty) {
                const sponsorDoc = sponsorQuery.docs[0];
                await usersCollection.doc(sponsorDoc.id).update({
                    directReferrals: admin.firestore.FieldValue.increment(1),
                    totalReferrals: admin.firestore.FieldValue.increment(1),
                    wallet: admin.firestore.FieldValue.increment(100)
                });
                
                // Add joining commission
                await commissionsCollection.add({
                    userId: sponsorDoc.id,
                    userName: sponsorDoc.data().name,
                    amount: 100,
                    level: 1,
                    fromUser: name,
                    fromUserId: userRecord.uid,
                    description: `Joining commission for referring ${name}`,
                    date: new Date().toISOString(),
                    status: 'Approved'
                });
            }
        }

        // Send OTP email
        const emailSent = await sendOTPEmail(email, name, otp);

        res.json({
            success: true,
            message: emailSent ? 'OTP sent to your email' : 'Registration successful. OTP: ' + otp,
            requireOTP: true,
            email: email,
            otpForTesting: !emailSent ? otp : undefined
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// VERIFY OTP - Step 2
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Get OTP from collection
        const otpDoc = await otpCollection.doc(email).get();
        if (!otpDoc.exists) {
            return res.status(400).json({ error: 'OTP not found. Please register again.' });
        }

        const otpData = otpDoc.data();
        
        if (otpData.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        
        if (new Date() > new Date(otpData.expires)) {
            return res.status(400).json({ error: 'OTP expired. Please register again.' });
        }

        // Get user from Auth
        const userRecord = await auth.getUserByEmail(email);
        
        // Update user in Firestore
        await usersCollection.doc(userRecord.uid).update({
            isVerified: true,
            otp: null,
            otpExpires: null
        });

        // Delete OTP from collection
        await otpCollection.doc(email).delete();

        // Mark email as verified in Auth
        await auth.updateUser(userRecord.uid, { emailVerified: true });

        // Get user data
        const userDoc = await usersCollection.doc(userRecord.uid).get();
        const userData = userDoc.data();

        // Generate custom token for frontend
        const customToken = await auth.createCustomToken(userRecord.uid);

        res.json({
            success: true,
            token: customToken,
            user: {
                uid: userRecord.uid,
                userId: userData.userId,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                wallet: userData.wallet,
                phone: userData.phone,
                sponsor: userData.sponsor,
                profileImage: userData.profileImage
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

// RESEND OTP
app.post('/api/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        const userRecord = await auth.getUserByEmail(email);
        const userDoc = await usersCollection.doc(userRecord.uid).get();
        const userData = userDoc.data();
        
        if (userData.isVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        
        await usersCollection.doc(userRecord.uid).update({
            otp: otp,
            otpExpires: otpExpires
        });
        
        await otpCollection.doc(email).set({
            otp: otp,
            expires: otpExpires,
            createdAt: new Date().toISOString()
        });
        
        const emailSent = await sendOTPEmail(email, userData.name, otp);
        
        res.json({
            success: true,
            message: emailSent ? 'OTP resent to email' : 'OTP: ' + otp
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Note: Firebase Admin SDK doesn't support password sign-in directly
        // Frontend should use Firebase Client SDK for sign-in
        // This endpoint is for getting additional user data after client-side sign-in
        
        const userRecord = await auth.getUserByEmail(email);
        const userDoc = await usersCollection.doc(userRecord.uid).get();
        
        if (!userDoc.exists) {
            return res.status(400).json({ error: 'User data not found' });
        }
        
        const userData = userDoc.data();
        
        if (!userData.isVerified && userData.role !== 'admin') {
            return res.status(400).json({ 
                error: 'Email not verified. Please verify OTP first.',
                requireOTP: true,
                email: email
            });
        }
        
        if (userData.status === 'blocked') {
            return res.status(400).json({ error: 'Your account has been blocked. Contact admin.' });
        }
        
        const customToken = await auth.createCustomToken(userRecord.uid);
        
        res.json({
            success: true,
            token: customToken,
            user: {
                uid: userRecord.uid,
                userId: userData.userId,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                wallet: userData.wallet,
                phone: userData.phone,
                sponsor: userData.sponsor,
                profileImage: userData.profileImage,
                directReferrals: userData.directReferrals,
                totalReferrals: userData.totalReferrals,
                level: userData.level
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ PRODUCT ROUTES ============

app.get('/api/products', async (req, res) => {
    try {
        console.log('Fetching active products...');
        const snapshot = await productsCollection.where('status', '==', 'active').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Found ${products.length} active products`);
        res.json(products);
    } catch (error) {
        console.error('Error in GET /api/products:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const snapshot = await productsCollection.get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        console.log('Creating new product:', req.body.name);
        const product = {
            ...req.body,
            createdAt: new Date().toISOString(),
            status: req.body.status || 'active'
        };
        const docRef = await productsCollection.add(product);
        console.log('Product created with ID:', docRef.id);
        res.json({ id: docRef.id, ...product });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await productsCollection.doc(req.params.id).update(req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await productsCollection.doc(req.params.id).delete();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ USER ROUTES ============

app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const snapshot = await usersCollection.orderBy('joined', 'desc').get();
        const users = [];
        snapshot.forEach(doc => {
            const user = doc.data();
            delete user.otp;
            users.push({ id: doc.id, ...user });
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:uid', authMiddleware, async (req, res) => {
    try {
        const userDoc = await usersCollection.doc(req.params.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userDoc.data();
        delete user.otp;
        
        // Get referrals
        const referralsSnapshot = await usersCollection.where('sponsor', '==', user.userId).get();
        const referrals = [];
        referralsSnapshot.forEach(doc => {
            const ref = doc.data();
            referrals.push({
                uid: doc.id,
                name: ref.name,
                email: ref.email,
                userId: ref.userId,
                joined: ref.joined,
                status: ref.status
            });
        });
        
        res.json({ user, referrals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:uid/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await usersCollection.doc(req.params.uid).update({ status: req.body.status });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:uid/wallet', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await usersCollection.doc(req.params.uid).update({
            wallet: admin.firestore.FieldValue.increment(req.body.amount)
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:uid', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await auth.deleteUser(req.params.uid);
        await usersCollection.doc(req.params.uid).delete();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const userDoc = await usersCollection.doc(req.user.uid).get();
        const user = userDoc.data();
        delete user.otp;
        
        // Get referrals
        const referralsSnapshot = await usersCollection.where('sponsor', '==', user.userId).get();
        const referrals = [];
        referralsSnapshot.forEach(doc => {
            referrals.push({ uid: doc.id, ...doc.data() });
        });
        
        // Get commissions
        const commissionsSnapshot = await commissionsCollection.where('userId', '==', req.user.uid).orderBy('date', 'desc').get();
        const commissions = [];
        commissionsSnapshot.forEach(doc => {
            commissions.push({ id: doc.id, ...doc.data() });
        });
        
        res.json({ user, referrals, commissions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone, profileImage } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (profileImage) updateData.profileImage = profileImage;
        
        await usersCollection.doc(req.user.uid).update(updateData);
        
        // Update display name in Auth
        if (name) {
            await auth.updateUser(req.user.uid, { displayName: name });
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ORDER ROUTES ============

app.post('/api/orders', authMiddleware, async (req, res) => {
    try {
        const userDoc = await usersCollection.doc(req.user.uid).get();
        const user = userDoc.data();
        
        const orderId = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
        
        const order = {
            orderId: orderId,
            userId: req.user.uid,
            userName: user.name,
            userEmail: user.email,
            items: req.body.items,
            total: req.body.total,
            status: 'Pending',
            date: new Date().toISOString(),
            tracking: {
                ordered: true,
                confirmed: false,
                shipped: false,
                delivered: false
            },
            trackingNumber: ''
        };
        
        const docRef = await ordersCollection.add(order);
        
        // Calculate and add commission
        await calculateReferralCommission(req.user.uid, order.total, user.name);
        
        res.json({ id: docRef.id, ...order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/orders/my', authMiddleware, async (req, res) => {
    try {
        const snapshot = await ordersCollection.where('userId', '==', req.user.uid).orderBy('date', 'desc').get();
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/orders', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const snapshot = await ordersCollection.orderBy('date', 'desc').get();
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/orders/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, trackingNumber } = req.body;
        await ordersCollection.doc(req.params.id).update({
            status: status,
            trackingNumber: trackingNumber,
            'tracking.confirmed': status === 'Confirmed',
            'tracking.shipped': status === 'Shipped',
            'tracking.delivered': status === 'Delivered',
            updatedAt: new Date().toISOString()
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/orders/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const orderDoc = await ordersCollection.doc(req.params.id).get();
        const order = orderDoc.data();
        
        if (!order) return res.status(404).json({ error: 'Order not found' });
        
        if (order.userId !== req.user.uid && req.userData?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        if (order.status === 'Pending' || order.status === 'Confirmed') {
            await ordersCollection.doc(req.params.id).update({ status: 'Cancelled' });
            await usersCollection.doc(order.userId).update({
                wallet: admin.firestore.FieldValue.increment(order.total)
            });
            res.json({ success: true, refundAmount: order.total });
        } else {
            res.status(400).json({ error: 'Order cannot be cancelled' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ WITHDRAWAL ROUTES ============

app.post('/api/withdrawals', authMiddleware, async (req, res) => {
    try {
        const userDoc = await usersCollection.doc(req.user.uid).get();
        const user = userDoc.data();
        
        if (user.wallet < req.body.amount) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }
        
        const withdrawal = {
            userId: req.user.uid,
            userName: user.name,
            userEmail: user.email,
            amount: req.body.amount,
            bankDetails: req.body.bankDetails,
            fullBankDetails: req.body.fullBankDetails || {},
            status: 'Pending',
            date: new Date().toISOString()
        };
        
        const docRef = await withdrawalsCollection.add(withdrawal);
        
        await usersCollection.doc(req.user.uid).update({
            wallet: admin.firestore.FieldValue.increment(-req.body.amount)
        });
        
        res.json({ id: docRef.id, ...withdrawal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/withdrawals/my', authMiddleware, async (req, res) => {
    try {
        const snapshot = await withdrawalsCollection.where('userId', '==', req.user.uid).orderBy('date', 'desc').get();
        const withdrawals = [];
        snapshot.forEach(doc => {
            withdrawals.push({ id: doc.id, ...doc.data() });
        });
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/withdrawals', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const snapshot = await withdrawalsCollection.orderBy('date', 'desc').get();
        const withdrawals = [];
        snapshot.forEach(doc => {
            withdrawals.push({ id: doc.id, ...doc.data() });
        });
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/withdrawals/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await withdrawalsCollection.doc(req.params.id).update({
            status: 'Approved',
            processedAt: new Date().toISOString(),
            remarks: req.body.remarks || ''
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/withdrawals/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const withdrawalDoc = await withdrawalsCollection.doc(req.params.id).get();
        const withdrawal = withdrawalDoc.data();
        
        await withdrawalsCollection.doc(req.params.id).update({
            status: 'Rejected',
            processedAt: new Date().toISOString(),
            remarks: req.body.remarks || ''
        });
        
        // Refund the amount to user
        await usersCollection.doc(withdrawal.userId).update({
            wallet: admin.firestore.FieldValue.increment(withdrawal.amount)
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ COMMISSION ROUTES ============

app.get('/api/commissions', authMiddleware, async (req, res) => {
    try {
        const snapshot = await commissionsCollection
            .where('userId', '==', req.user.uid)
            .orderBy('date', 'desc')
            .get();
        
        const commissions = [];
        let totalCommission = 0;
        
        snapshot.forEach(doc => {
            const commission = doc.data();
            totalCommission += commission.amount;
            commissions.push({ id: doc.id, ...commission });
        });
        
        res.json({ commissions, totalCommission });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/commissions/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const snapshot = await commissionsCollection.orderBy('date', 'desc').get();
        const commissions = [];
        snapshot.forEach(doc => {
            commissions.push({ id: doc.id, ...doc.data() });
        });
        res.json(commissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ TEAM/GENEALOGY ROUTES ============

app.get('/api/team', authMiddleware, async (req, res) => {
    try {
        const userDoc = await usersCollection.doc(req.user.uid).get();
        const user = userDoc.data();
        
        // Direct referrals
        const directSnapshot = await usersCollection.where('sponsor', '==', user.userId).get();
        const directReferrals = [];
        directSnapshot.forEach(doc => {
            directReferrals.push({ uid: doc.id, ...doc.data() });
        });
        
        // Level 2 referrals
        let level2Referrals = [];
        for (const ref of directReferrals) {
            const level2Snapshot = await usersCollection.where('sponsor', '==', ref.userId).get();
            level2Snapshot.forEach(doc => {
                level2Referrals.push({ uid: doc.id, ...doc.data() });
            });
        }
        
        res.json({
            directReferrals: directReferrals,
            level2Referrals: level2Referrals,
            directCount: directReferrals.length,
            level2Count: level2Referrals.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ DASHBOARD STATS ============

app.get('/api/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Get all users
        const usersSnapshot = await usersCollection.get();
        const totalUsers = usersSnapshot.size;
        const activeUsers = usersSnapshot.docs.filter(doc => doc.data().status === 'active').length;
        
        // Get products
        const productsSnapshot = await productsCollection.where('status', '==', 'active').get();
        const totalProducts = productsSnapshot.size;
        
        // Get orders
        const ordersSnapshot = await ordersCollection.get();
        const totalOrders = ordersSnapshot.size;
        const pendingOrders = ordersSnapshot.docs.filter(doc => doc.data().status === 'Pending').length;
        
        // Calculate total sales
        let totalSales = 0;
        ordersSnapshot.forEach(doc => {
            totalSales += doc.data().total || 0;
        });
        
        // Get withdrawals
        const withdrawalsSnapshot = await withdrawalsCollection.get();
        const pendingWithdrawals = withdrawalsSnapshot.docs.filter(doc => doc.data().status === 'Pending').length;
        
        // Calculate total wallet balance
        let totalWallet = 0;
        usersSnapshot.forEach(doc => {
            totalWallet += doc.data().wallet || 0;
        });
        
        // Get commissions
        const commissionsSnapshot = await commissionsCollection.get();
        let totalCommissions = 0;
        commissionsSnapshot.forEach(doc => {
            totalCommissions += doc.data().amount || 0;
        });
        
        // Recent orders
        const recentOrdersSnapshot = await ordersCollection.orderBy('date', 'desc').limit(5).get();
        const recentOrders = [];
        recentOrdersSnapshot.forEach(doc => {
            recentOrders.push({ id: doc.id, ...doc.data() });
        });
        
        // Recent users
        const recentUsersSnapshot = await usersCollection.orderBy('joined', 'desc').limit(5).get();
        const recentUsers = [];
        recentUsersSnapshot.forEach(doc => {
            const user = doc.data();
            delete user.otp;
            recentUsers.push({ id: doc.id, ...user });
        });
        
        // Recent withdrawals
        const recentWithdrawalsSnapshot = await withdrawalsCollection.orderBy('date', 'desc').limit(5).get();
        const recentWithdrawals = [];
        recentWithdrawalsSnapshot.forEach(doc => {
            recentWithdrawals.push({ id: doc.id, ...doc.data() });
        });
        
        res.json({
            totalUsers,
            activeUsers,
            totalProducts,
            totalOrders,
            pendingOrders,
            pendingWithdrawals,
            totalSales,
            totalWallet,
            totalCommissions,
            recentOrders,
            recentUsers,
            recentWithdrawals
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ CREATE DEFAULT ADMIN ============
async function createDefaultAdmin() {
    try {
        // Check if admin exists
        const adminQuery = await usersCollection.where('email', '==', 'admin@peopleplus.com').get();
        
        if (adminQuery.empty) {
            // Create admin in Firebase Auth
            const userRecord = await auth.createUser({
                email: 'admin@peopleplus.com',
                password: 'admin123',
                displayName: 'Super Admin',
                emailVerified: true
            });
            
            // Create admin in Firestore
            await usersCollection.doc(userRecord.uid).set({
                uid: userRecord.uid,
                userId: 'ADMIN001',
                name: 'Super Admin',
                email: 'admin@peopleplus.com',
                phone: '9999999999',
                sponsor: 'PPN0001',
                wallet: 0,
                status: 'active',
                role: 'admin',
                isVerified: true,
                joined: new Date().toISOString(),
                profileImage: 'img/default-avatar.png',
                directReferrals: 0,
                totalReferrals: 0,
                level: 'Admin'
            });
            
            console.log('✅ Admin created: admin@peopleplus.com / admin123');
        } else {
            console.log('ℹ️ Admin already exists');
        }
    } catch (error) {
        if (error.code !== 'auth/email-already-exists') {
            console.error('Admin creation error:', error.message);
        }
    }
}

// ============ CREATE DEFAULT PRODUCTS ============
async function createDefaultProducts() {
    try {
        const productsSnapshot = await productsCollection.get();
        
        if (productsSnapshot.empty) {
            const defaultProducts = [
                { name: 'Ayurvedic Protein Powder', price: 999, mrp: 1499, stock: 250, image: 'https://placehold.co/300x250/667eea/white?text=Protein', desc: 'Pure Ayurvedic protein powder', status: 'active' },
                { name: 'Herbal Immunity Tea', price: 599, mrp: 999, stock: 500, image: 'https://placehold.co/300x250/764ba2/white?text=Tea', desc: 'Boost your immunity naturally', status: 'active' },
                { name: 'Organic Skin Cream', price: 799, mrp: 1299, stock: 300, image: 'https://placehold.co/300x250/667eea/white?text=Cream', desc: 'Natural herbal skin care', status: 'active' },
                { name: 'Nutrition Supplement', price: 1499, mrp: 2499, stock: 200, image: 'https://placehold.co/300x250/764ba2/white?text=Supplement', desc: 'Complete daily nutrition', status: 'active' }
            ];
            
            for (const product of defaultProducts) {
                await productsCollection.add({
                    ...product,
                    createdAt: new Date().toISOString()
                });
            }
            
            console.log('✅ Default products created');
        } else {
            console.log('ℹ️ Products already exist');
        }
    } catch (error) {
        console.error('Products creation error:', error);
    }
}

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    await createDefaultAdmin();
    await createDefaultProducts();
    console.log('✅ Firebase backend ready!');
});