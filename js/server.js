const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============ MongoDB Connection ============
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Atlas Connected!'))
    .catch(err => { console.error('❌ MongoDB Error:', err); process.exit(1); });

// ============ Email Transporter (OTP) ============
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

// ============ SCHEMAS ============

// User Schema
const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    sponsor: { type: String, default: 'PPN0001' },
    wallet: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
    role: { type: String, default: 'user' },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    joined: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    stock: { type: Number, default: 100 },
    image: { type: String, default: 'https://placehold.co/300x250/667eea/white?text=Product' },
    desc: { type: String },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userEmail: String,
    items: [{ name: String, price: Number, quantity: Number, image: String }],
    total: Number,
    status: { type: String, default: 'Pending' },
    date: { type: Date, default: Date.now },
    tracking: {
        ordered: { type: Boolean, default: true },
        confirmed: { type: Boolean, default: false },
        shipped: { type: Boolean, default: false },
        delivered: { type: Boolean, default: false }
    }
});

// Withdrawal Schema
const withdrawalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userEmail: String,
    amount: Number,
    bankDetails: String,
    fullBankDetails: Object,
    status: { type: String, default: 'Pending' },
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

// ============ AUTH MIDDLEWARE ============
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'peopleplus_secret_key_2024');
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

// ============ AUTH ROUTES ============

// REGISTER - Step 1: Save user, send OTP
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password, sponsor } = req.body;

        if (!name || !email || !phone || !password)
            return res.status(400).json({ error: 'All fields are required' });

        const existing = await User.findOne({ email });
        if (existing && existing.isVerified)
            return res.status(400).json({ error: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = 'PPN' + Math.floor(Math.random() * 90000 + 10000);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        if (existing && !existing.isVerified) {
            // Update existing unverified user
            existing.name = name;
            existing.phone = phone;
            existing.password = hashedPassword;
            existing.otp = otp;
            existing.otpExpires = otpExpires;
            await existing.save();
        } else {
            // Create new user
            const user = new User({ userId, name, email, phone, password: hashedPassword, sponsor: sponsor || 'PPN0001', otp, otpExpires, isVerified: false });
            await user.save();
        }

        // Send OTP email
        const emailSent = await sendOTPEmail(email, name, otp);

        if (emailSent) {
            res.json({ success: true, message: 'OTP sent to your email. Please verify.', requireOTP: true, email });
        } else {
            // If email fails, auto-verify (fallback)
            res.json({ success: true, message: 'Registration done (email service unavailable). OTP: ' + otp, requireOTP: true, email, otp });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// VERIFY OTP - Step 2
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });

        if (user.otp !== otp)
            return res.status(400).json({ error: 'Invalid OTP' });

        if (new Date() > user.otpExpires)
            return res.status(400).json({ error: 'OTP expired. Please register again.' });

        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'peopleplus_secret_key_2024',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, userId: user.userId, wallet: user.wallet }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// RESEND OTP
app.post('/api/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const emailSent = await sendOTPEmail(email, user.name, otp);
        res.json({ success: true, message: emailSent ? 'OTP resent to email' : 'OTP: ' + otp });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        if (!user.isVerified && user.role !== 'admin')
            return res.status(400).json({ error: 'Email not verified. Please verify OTP first.', requireOTP: true, email });

        if (user.status === 'blocked')
            return res.status(400).json({ error: 'Your account has been blocked. Contact admin.' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'peopleplus_secret_key_2024',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, userId: user.userId, wallet: user.wallet }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ PRODUCT ROUTES ============

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({ status: 'active' });
        res.json(products);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/products/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/products', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json(product);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(product);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============ USER ROUTES ============

app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password -otp');
        res.json(users);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/users/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password -otp');
        res.json(user);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone } = req.body;
        await User.findByIdAndUpdate(req.user.userId, { name, phone });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============ ORDER ROUTES ============

app.post('/api/orders', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const order = new Order({
            ...req.body,
            userId: req.user.userId,
            userName: user.name,
            userEmail: user.email,
            orderId: 'ORD' + Date.now()
        });
        await order.save();
        res.json(order);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/orders/my', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId }).sort({ date: -1 });
        res.json(orders);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/orders', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json(orders);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/orders/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Order.findByIdAndUpdate(req.params.id, { status: req.body.status, tracking: req.body.tracking });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/orders/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.userId.toString() !== req.user.userId && req.user.role !== 'admin')
            return res.status(403).json({ error: 'Not authorized' });
        if (order.status === 'Pending' || order.status === 'Processing') {
            order.status = 'Cancelled';
            await order.save();
            await User.findByIdAndUpdate(order.userId, { $inc: { wallet: order.total } });
            res.json({ success: true, refundAmount: order.total });
        } else {
            res.status(400).json({ error: 'Order cannot be cancelled' });
        }
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============ WITHDRAWAL ROUTES ============

app.post('/api/withdrawals', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.wallet < req.body.amount)
            return res.status(400).json({ error: 'Insufficient wallet balance' });

        const withdrawal = new Withdrawal({
            ...req.body,
            userId: req.user.userId,
            userName: user.name,
            userEmail: user.email
        });
        await withdrawal.save();
        user.wallet -= req.body.amount;
        await user.save();
        res.json(withdrawal);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/withdrawals/my', authMiddleware, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ userId: req.user.userId }).sort({ date: -1 });
        res.json(withdrawals);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/withdrawals', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find().sort({ date: -1 });
        res.json(withdrawals);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/withdrawals/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Withdrawal.findByIdAndUpdate(req.params.id, { status: 'Approved' });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/withdrawals/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findById(req.params.id);
        withdrawal.status = 'Rejected';
        await withdrawal.save();
        await User.findByIdAndUpdate(withdrawal.userId, { $inc: { wallet: withdrawal.amount } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============ DASHBOARD STATS (Admin) ============
app.get('/api/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalProducts = await Product.countDocuments({ status: 'active' });
        const totalOrders = await Order.countDocuments();
        const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'Pending' });
        const orders = await Order.find();
        const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const recentOrders = await Order.find().sort({ date: -1 }).limit(5);
        const recentUsers = await User.find({ role: 'user' }).sort({ joined: -1 }).limit(5).select('-password -otp');
        res.json({ totalUsers, totalProducts, totalOrders, pendingWithdrawals, totalSales, recentOrders, recentUsers });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============ CREATE DEFAULT ADMIN & PRODUCTS ============
async function createDefaultAdmin() {
    try {
        const adminExists = await User.findOne({ email: 'admin@peopleplus.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await new User({
                userId: 'ADMIN001',
                name: 'Super Admin',
                email: 'admin@peopleplus.com',
                phone: '9999999999',
                password: hashedPassword,
                role: 'admin',
                status: 'active',
                isVerified: true,
                wallet: 0
            }).save();
            console.log('✅ Admin created: admin@peopleplus.com / admin123');
        }
    } catch (error) { console.error('Admin creation error:', error); }
}

async function createDefaultProducts() {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany([
                { name: 'Ayurvedic Protein Powder', price: 999, mrp: 1499, stock: 250, image: 'https://placehold.co/300x250/667eea/white?text=Protein', desc: 'Pure Ayurvedic protein powder' },
                { name: 'Herbal Immunity Tea', price: 599, mrp: 999, stock: 500, image: 'https://placehold.co/300x250/764ba2/white?text=Tea', desc: 'Boost your immunity naturally' },
                { name: 'Organic Skin Cream', price: 799, mrp: 1299, stock: 300, image: 'https://placehold.co/300x250/667eea/white?text=Cream', desc: 'Natural herbal skin care' },
                { name: 'Nutrition Supplement', price: 1499, mrp: 2499, stock: 200, image: 'https://placehold.co/300x250/764ba2/white?text=Supplement', desc: 'Complete daily nutrition' }
            ]);
            console.log('✅ Default products created');
        }
    } catch (error) { console.error('Products creation error:', error); }
}

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    await createDefaultAdmin();
    await createDefaultProducts();
});