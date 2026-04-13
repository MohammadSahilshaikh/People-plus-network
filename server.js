require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));

const { MongoStore } = require('connect-mongo');
const MONGO_URI = process.env.MONGO_URI;

app.use(session({
    secret: process.env.SESSION_SECRET || 'people-plus-secret-2024',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
}));

// ─── Email Transporter (Gmail SMTP) ──────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS   // Gmail App Password (16-digit)
    }
});

// ─── OTP Helper ───────────────────────────────────────────────
const otpStore = new Map(); // email => { otp, expiresAt }

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp, name) {
    const mailOptions = {
        from: `"People Plus Network" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Login OTP - People Plus Network',
        html: `
        <div style="font-family: Poppins, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border-radius: 15px; border: 1px solid #e0e0e0;">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
                <h2 style="color: white; margin: 0;">People Plus Network</h2>
                <p style="color: rgba(255,255,255,0.85); margin: 5px 0 0;">Login Verification</p>
            </div>
            <p style="color: #333; font-size: 16px;">Hello <strong>${name || 'User'}</strong>,</p>
            <p style="color: #555;">Your One-Time Password (OTP) for login is:</p>
            <div style="background: #f5f7fa; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #667eea; letter-spacing: 10px; font-size: 2.5rem; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #888; font-size: 14px;">⏰ This OTP is valid for <strong>10 minutes</strong> only.</p>
            <p style="color: #888; font-size: 14px;">🔒 Do not share this OTP with anyone.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #aaa; font-size: 12px; text-align: center;">© 2024 People Plus Network. All rights reserved.</p>
        </div>`
    };
    await transporter.sendMail(mailOptions);
}

// ─── Mongoose Schemas ─────────────────────────────────────────
const userSchema = new mongoose.Schema({
    name:           { type: String, required: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:          { type: String },
    password:       { type: String, required: true },   // bcrypt hashed
    role:           { type: String, default: 'user' },
    transactionId:  { type: String },
    paymentStatus:  { type: String, default: 'verified' },
    avatar:         { type: String },
    referralCode:   { type: String },
    isActive:       { type: Boolean, default: true },
    createdAt:      { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    name: String, description: String,
    price: Number, mrp: Number, image: String,
    category: String, stock: { type: Number, default: 100 },
    createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items:        [{ name: String, price: Number, quantity: Number, image: String }],
    total_amount: Number,
    address:      String,
    status:       { type: String, default: 'pending' },
    createdAt:    { type: Date, default: Date.now }
});

const User    = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order   = mongoose.model('Order', orderSchema);

// ─── MongoDB Connection ───────────────────────────────────────
mongoose.connect(MONGO_URI)
.then(() => {
    console.log('✅ MongoDB connected!');
})
.catch(err => {
    console.error('❌ MongoDB error:', err.message);
});

// ─── Routes ──────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── REGISTER (save user data) ─────────────────────────────────
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password, transactionId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required.' });
        }

        const emailLower = email.toLowerCase().trim();

        // Block admin email from registering as user
        const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
        if (emailLower === adminEmail) {
            return res.status(400).json({ error: 'This email cannot be used for registration.' });
        }

        const exists = await User.findOne({ email: emailLower });
        if (exists) {
            return res.status(400).json({ error: 'Email already registered. Please login.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate referral code
        const referralCode = 'PPN' + Math.random().toString(36).substring(2, 7).toUpperCase();

        const newUser = await User.create({
            name: name.trim(),
            email: emailLower,
            phone: phone || '',
            password: hashedPassword,
            role: 'user',
            transactionId: transactionId || '',
            paymentStatus: 'verified',
            referralCode
        });

        res.json({ success: true, message: 'Registration successful! Please login.', id: newUser._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ── LOGIN (step 1 — send OTP for users, direct for admin) ─────
app.post('/api/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email ? email.toLowerCase().trim() : '';
        password = password ? password.trim() : '';

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database connecting. Please try again.' });
        }

        // ── Admin Login (no OTP, from .env) ─────────────────────
        const adminEmail    = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
        const adminPassword = process.env.ADMIN_PASSWORD || '';

        if (email === adminEmail) {
            if (password !== adminPassword) {
                return res.status(401).json({ error: 'Invalid admin credentials.' });
            }
            // Create admin session directly
            req.session.user = {
                id: 'admin',
                name: 'Super Admin',
                email: adminEmail,
                role: 'admin'
            };
            return req.session.save(err => {
                if (err) return res.status(500).json({ error: 'Session error.' });
                res.json({ success: true, redirect: '/admin.html', user: req.session.user });
            });
        }

        // ── User Login (email + bcrypt check → OTP) ──────────────
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'No account found with this email. Please register first.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }

        // Generate & store OTP
        const otp = generateOTP();
        otpStore.set(email, {
            otp,
            userId: user._id.toString(),
            expiresAt: Date.now() + 10 * 60 * 1000  // 10 minutes
        });

        // Send OTP Email
        try {
            await sendOTPEmail(email, otp, user.name);
        } catch (mailErr) {
            console.error('Mail error:', mailErr.message);
            return res.status(500).json({ error: 'Could not send OTP email. Check email config.' });
        }

        res.json({ success: true, otpSent: true, email, message: 'OTP sent to your email. Check your inbox.' });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// ── VERIFY OTP (step 2) ───────────────────────────────────────
app.post('/api/verify-otp', async (req, res) => {
    try {
        let { email, otp } = req.body;
        email = email ? email.toLowerCase().trim() : '';
        otp   = otp ? otp.trim() : '';

        const record = otpStore.get(email);

        if (!record) {
            return res.status(400).json({ error: 'OTP expired or not found. Please login again.' });
        }
        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'OTP has expired. Please login again.' });
        }
        if (record.otp !== otp) {
            return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
        }

        // OTP correct — create session
        otpStore.delete(email);
        const user = await User.findById(record.userId);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        req.session.user = {
            id:     user._id,
            name:   user.name,
            email:  user.email,
            role:   user.role,
            avatar: user.avatar || ''
        };

        req.session.save(err => {
            if (err) return res.status(500).json({ error: 'Session error.' });
            res.json({ success: true, redirect: '/user-dashboard.html', user: req.session.user });
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── RESEND OTP ────────────────────────────────────────────────
app.post('/api/resend-otp', async (req, res) => {
    try {
        let { email } = req.body;
        email = email ? email.toLowerCase().trim() : '';

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const otp = generateOTP();
        otpStore.set(email, {
            otp,
            userId: user._id.toString(),
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        await sendOTPEmail(email, otp, user.name);
        res.json({ success: true, message: 'OTP resent successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── SESSION ───────────────────────────────────────────────────
app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// ── LOGOUT ────────────────────────────────────────────────────
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
});

// ── PRODUCTS ──────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' });
        }
        const product = await Product.create(req.body);
        res.json({ success: true, product });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' });
        }
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ── ADMIN: Users ──────────────────────────────────────────────
app.get('/api/admin/users', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' });
        }
        const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ADMIN: Orders ─────────────────────────────────────────────
app.get('/api/admin/orders', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' });
        }
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Start Server ──────────────────────────────────────────────
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}
module.exports = app;
