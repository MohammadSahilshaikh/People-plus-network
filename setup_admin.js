require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    transactionId: { type: String },
    paymentStatus: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@peopleplus.com';
        const adminPass = 'admin123';

        const exists = await User.findOne({ email: adminEmail });
        if (exists) {
            console.log('Admin already exists. Updating password...');
            exists.password = adminPass;
            exists.role = 'admin';
            await exists.save();
        } else {
            console.log('Creating new Admin user...');
            await User.create({
                name: 'Admin User',
                email: adminEmail,
                password: adminPass,
                role: 'admin',
                paymentStatus: 'verified'
            });
        }
        console.log('Admin setup complete!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createAdmin();
