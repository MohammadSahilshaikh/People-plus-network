require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));
const MongoStore = require('connect-mongo');

const MONGO_URI = process.env.MONGO_URI;

app.use(session({
    secret: 'people-plus-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 1 week
}));

// MongoDB Connection

mongoose.connect(MONGO_URI)
.then(async () => {
    console.log('Successfully connected to Online MongoDB database!');
    
    // Seed Admin User with Secure Environment Variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (adminEmail && adminPassword) {
        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                paymentStatus: 'verified'
            });
            console.log('Secure Default Admin created via .env');
        }
    }
})
.catch((err) => {
    console.error('Online Database connection error: ', err.message);
    console.log('--------------------------------------------------');
    console.log('ERROR: Pura MongoDB connection URL .env file mein lagaiye!');
    console.log('--------------------------------------------------');
});

// Mongoose Schemas & Models
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    transactionId: { type: String },
    paymentStatus: { type: String, default: 'verified' }, // Setting default to verified temporarily or based on role
    createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    mrp: Number,
    image: String,
    createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    total_amount: Number,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);


// Serve frontend main pages implicitly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Authentication API
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password, transactionId, amount } = req.body;
        
        if (amount !== "499" && amount !== 499) {
            return res.status(400).json({ error: 'Payment amount must be exactly Rs 499' });
        }
        
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        if (!transactionId) {
            return res.status(400).json({ error: 'Payment Transaction ID is required' });
        }
        
        const newUser = await User.create({ 
            name, 
            email, 
            phone, 
            password, 
            role: 'user',
            transactionId, 
            paymentStatus: 'verified' 
        });
        res.json({ success: true, message: 'Registration submit success', id: newUser._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        req.session.user = user;
        
        if (user.role === 'admin') {
            res.json({ success: true, redirect: '/admin.html', user });
        } else {
            res.json({ success: true, redirect: '/user-dashboard.html', user });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
