const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection - Fixed (no deprecated options)
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ Fatal Error: MONGODB_URI environment variable is not set.");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ MongoDB Atlas Connected Successfully!'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

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
    joined: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    stock: { type: Number, default: 100 },
    image: { type: String, default: 'https://via.placeholder.com/300x250/667eea/white?text=Product' },
    desc: { type: String },
    status: { type: String, default: 'active' }
});

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userEmail: String,
    items: [{
        name: String,
        price: Number,
        quantity: Number,
        image: String
    }],
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

// Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

// ============ MIDDLEWARE ============
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'peopleplus_secret_key_2024');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const adminMiddleware = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password, sponsor } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = 'PPN' + Math.floor(Math.random() * 90000 + 10000);
        
        const user = new User({
            userId,
            name,
            email,
            phone,
            password: hashedPassword,
            sponsor: sponsor || 'PPN0001'
        });
        
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

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
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

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({ status: 'active' });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add product (admin only)
app.post('/api/products', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product (admin only)
app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update product (admin only)
app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ USER ROUTES ============

// Get all users (admin only)
app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user status (admin only)
app.put('/api/users/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        await User.findByIdAndUpdate(req.params.id, { status });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user (admin only)
app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.userId, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ORDER ROUTES ============

// Create order
app.post('/api/orders', authMiddleware, async (req, res) => {
    try {
        const order = new Order({
            ...req.body,
            userId: req.user.userId,
            orderId: 'ORD' + Date.now()
        });
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user orders
app.get('/api/orders/my', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all orders (admin only)
app.get('/api/orders', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status (admin only)
app.put('/api/orders/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, tracking } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status, tracking });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel order
app.put('/api/orders/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        if (order.status === 'Pending' || order.status === 'Processing') {
            order.status = 'Cancelled';
            await order.save();
            
            // Refund to user wallet
            await User.findByIdAndUpdate(order.userId, { $inc: { wallet: order.total } });
            res.json({ success: true, refundAmount: order.total });
        } else {
            res.status(400).json({ error: 'Order cannot be cancelled' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ WITHDRAWAL ROUTES ============

// Request withdrawal
app.post('/api/withdrawals', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.wallet < req.body.amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        const withdrawal = new Withdrawal({
            ...req.body,
            userId: req.user.userId,
            userName: user.name,
            userEmail: user.email
        });
        
        await withdrawal.save();
        
        // Deduct from wallet
        user.wallet -= req.body.amount;
        await user.save();
        
        res.json(withdrawal);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user withdrawals
app.get('/api/withdrawals/my', authMiddleware, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ userId: req.user.userId });
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all withdrawals (admin only)
app.get('/api/withdrawals', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find();
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve withdrawal (admin only)
app.put('/api/withdrawals/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Withdrawal.findByIdAndUpdate(req.params.id, { status: 'Approved' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject withdrawal (admin only)
app.put('/api/withdrawals/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findById(req.params.id);
        withdrawal.status = 'Rejected';
        await withdrawal.save();
        
        // Refund to wallet
        await User.findByIdAndUpdate(withdrawal.userId, { $inc: { wallet: withdrawal.amount } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ CREATE DEFAULT ADMIN ============
async function createDefaultAdmin() {
    try {
        const adminExists = await User.findOne({ email: 'admin@peopleplus.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new User({
                userId: 'ADMIN001',
                name: 'Super Admin',
                email: 'admin@peopleplus.com',
                phone: '9999999999',
                password: hashedPassword,
                role: 'admin',
                status: 'active',
                wallet: 0
            });
            await admin.save();
            console.log('✅ Default admin created - Email: admin@peopleplus.com, Password: admin123');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

// Create default products
async function createDefaultProducts() {
    try {
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            const defaultProducts = [
                { name: 'Ayurvedic Protein Powder', price: 999, mrp: 1499, stock: 250, image: 'https://via.placeholder.com/300x250/667eea/white?text=Protein', desc: 'Pure Ayurvedic protein powder' },
                { name: 'Herbal Immunity Tea', price: 599, mrp: 999, stock: 500, image: 'https://via.placeholder.com/300x250/764ba2/white?text=Tea', desc: 'Boost your immunity' },
                { name: 'Organic Skin Cream', price: 799, mrp: 1299, stock: 300, image: 'https://via.placeholder.com/300x250/667eea/white?text=Cream', desc: 'Natural skin care' },
                { name: 'Nutrition Supplement', price: 1499, mrp: 2499, stock: 200, image: 'https://via.placeholder.com/300x250/764ba2/white?text=Supplement', desc: 'Complete nutrition' }
            ];
            await Product.insertMany(defaultProducts);
            console.log('✅ Default products created');
        }
    } catch (error) {
        console.error('Error creating products:', error);
    }
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    await createDefaultAdmin();
    await createDefaultProducts();
});