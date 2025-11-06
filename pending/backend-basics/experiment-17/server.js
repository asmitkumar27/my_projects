const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// Secret key for JWT signing
const SECRET_KEY = 'supersecretkey';

// Middleware to parse JSON
app.use(bodyParser.json());

// Hardcoded user credentials and balance
const USER = {
    username: 'user1',
    password: 'password123',
    balance: 5000
};

/**
 * JWT Authentication Middleware
 */
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = user; // store decoded token payload
        next();
    });
};

/**
 * Login Route
 * Generates JWT for valid credentials
 */
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === USER.username && password === USER.password) {
        const token = jwt.sign({ username: USER.username }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token });
    } else {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
});

/**
 * Protected Route: View Balance
 */
app.get('/balance', authenticateJWT, (req, res) => {
    res.json({ balance: USER.balance });
});

/**
 * Protected Route: Deposit Money
 */
app.post('/deposit', authenticateJWT, (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    USER.balance += amount;
    res.json({ message: `Deposited $${amount}`, newBalance: USER.balance });
});

/**
 * Protected Route: Withdraw Money
 */
app.post('/withdraw', authenticateJWT, (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    if (amount > USER.balance) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }

    USER.balance -= amount;
    res.json({ message: `Withdrew $${amount}`, newBalance: USER.balance });
});

// Start server
app.listen(PORT, () => {
    console.log(`Banking API running at http://localhost:${PORT}`);
});