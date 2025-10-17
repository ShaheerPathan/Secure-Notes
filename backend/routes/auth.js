const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

// Generate a random encryption key
function generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
}

// Encrypt the encryption key with user's password hash
function encryptEncryptionKey(encryptionKey, passwordHash) {
    const iv = crypto.randomBytes(16); // Generate random IV
    const key = crypto.scryptSync(passwordHash, 'salt', 32); // Derive key from password
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(encryptionKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // Prepend IV to encrypted data
}

// Decrypt the encryption key with user's password hash
function decryptEncryptionKey(encryptedKey, passwordHash) {
    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(passwordHash, 'salt', 32); // Derive same key from password
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const encryptionKey = generateEncryptionKey();
        const encryptedEncryptionKey = encryptEncryptionKey(encryptionKey, hashedPassword); // Encrypt the encryption key
        
        const user = new User({
            name,
            email,
            password: hashedPassword,
            encryptionKey: encryptedEncryptionKey // Store encrypted version in DB
        });
        
        await user.save();
        
        res.status(201).json({ 
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Decrypt the user's encryption key using their password hash
        const decryptedEncryptionKey = decryptEncryptionKey(user.encryptionKey, user.password);
        
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;