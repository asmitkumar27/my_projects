const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// This is a secret key for signing the JWT. 
// In a real app, keep this in a .env file!
const JWT_SECRET = 'your-super-secret-key-123';

// Middleware to parse JSON bodies
app.use(express.json());

// --- Hardcoded User Data (for simplicity) ---
const mockUser = {
    id: 1,
    username: 'testuser',
    password: 'password123'
};

// --- 1. Login Route (This was missing) ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === mockUser.username && password === mockUser.password) {
        const payload = {
            id: mockUser.id,
            username: mockUser.username
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token: token });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

// --- 2. Token Verification Middleware (This was missing) ---
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token missing' });
    }

    const token = authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({ message: 'Token missing' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token is not valid' });
        }
        req.user = user;
        next();
    });
}

// --- 3. Protected Route (This was missing) ---
app.get('/protected', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'You have accessed a protected route!',
        user: req.user
    });
});

// --- Your Original Root Route (Good for testing) ---
app.get('/', (req, res) => {
    res.send('Server is running');
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});