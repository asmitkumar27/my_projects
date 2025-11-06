const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// --- Configuration ---
const JWT_SECRET = 'supersecurejwtsecret'; // In a real app, use environment variables!
const JWT_EXPIRATION = '1h';
const PORT = 3001;

// --- Mock Database (Simulating Mongoose/MongoDB) ---
let users = [];
let posts = [];
let nextUserId = 1;
let nextPostId = 1;

// --- RBAC Permission Matrix (Core Feature) ---
const PERMISSIONS = {
    ADMIN: {
        'users': ['create', 'read', 'update', 'delete'],
        'posts': ['create', 'read', 'update', 'delete'],
        'admin': ['manage_roles']
    },
    EDITOR: {
        'posts': ['create', 'read'],
        'self_posts': ['update', 'delete'], // Can update/delete only their own posts
        'users': ['read']
    },
    VIEWER: {
        'posts': ['read']
    }
};

// --- Security Helpers ---
const hashPassword = (password) => bcrypt.hashSync(password, 10);

// --- Seeding Data (Key Feature: Seed & Dev Setup) ---
const seedDatabase = () => {
    // 1. Create Users
    users = [
        { id: nextUserId++, username: 'admin', password: hashPassword('admin123'), role: 'ADMIN', email: 'admin@example.com' },
        { id: nextUserId++, username: 'editor1', password: hashPassword('editor123'), role: 'EDITOR', email: 'editor1@example.com' },
        { id: nextUserId++, username: 'editor2', password: hashPassword('editor123'), role: 'EDITOR', email: 'editor2@example.com' },
        { id: nextUserId++, username: 'viewer', password: hashPassword('viewer123'), role: 'VIEWER', email: 'viewer@example.com' },
    ];

    // 2. Create Posts
    const editor1Id = users.find(u => u.username === 'editor1').id;
    const editor2Id = users.find(u => u.username === 'editor2').id;

    posts = [
        { id: nextPostId++, title: 'Admin Global News', content: 'This is global content.', authorId: users.find(u => u.username === 'admin').id, author: 'admin', createdAt: new Date() },
        { id: nextPostId++, title: 'Editor 1 Private Draft', content: 'Content only Editor 1 can modify.', authorId: editor1Id, author: 'editor1', createdAt: new Date() },
        { id: nextPostId++, title: 'Editor 2 Public Article', content: 'A public facing article by Editor 2.', authorId: editor2Id, author: 'editor2', createdAt: new Date() },
        { id: nextPostId++, title: 'General Info for Viewers', content: 'Everyone can read this.', authorId: editor1Id, author: 'editor1', createdAt: new Date() },
    ];
    console.log(`Database seeded with ${users.length} users and ${posts.length} posts.`);
};
seedDatabase();

// --- Express App Setup ---
const app = express();
app.use(express.json());
// CORS setup for frontend (Key Feature: Security)
app.use(cors({
    origin: 'http://localhost:5173', // Replace with your React app URL if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- Middleware: Authentication (Auth Tokens) ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Authorization check failed: Missing or invalid header.');
        return res.status(401).send({ error: 'Access Denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach user info (including role and userId) to the request
        req.user = {
            id: decoded.userId,
            role: decoded.role,
            username: decoded.username // Used for logging
        };
        next();
    } catch (ex) {
        console.log('JWT verification failed:', ex.message);
        return res.status(400).send({ error: 'Invalid token.' });
    }
};

// --- Middleware: Authorization (API Enforcement) ---
/**
 * Express middleware to check if the authenticated user has the required permission.
 * @param {string} resource - e.g., 'posts', 'users', 'admin'
 * @param {string} action - e.g., 'create', 'read', 'update', 'delete', 'manage_roles'
 * @param {boolean} [isOwnerCheck=false] - If true, checks for 'self_' permission or relies on logic below.
 */
const authorize = (resource, action, isOwnerCheck = false) => {
    return (req, res, next) => {
        const role = req.user.role;
        const rolePermissions = PERMISSIONS[role];

        if (!rolePermissions) {
            console.warn(`Attempted access by user ${req.user.id} with invalid role: ${role}`);
            return res.status(403).send({ error: 'Forbidden. Invalid Role Configuration.' });
        }

        let hasPermission = false;

        // 1. Standard Check (e.g., ADMIN can 'posts:delete')
        if (rolePermissions[resource] && rolePermissions[resource].includes(action)) {
            hasPermission = true;
        }

        // 2. Ownership Check (Key Feature: Row-level Security)
        if (isOwnerCheck) {
            // Check for explicit 'self' permission (e.g., EDITOR's 'self_posts:update')
            const selfResource = `self_${resource}`;
            if (rolePermissions[selfResource] && rolePermissions[selfResource].includes(action)) {
                // Permission granted, now the route handler must check the authorId
                hasPermission = true;
                req.isOwnerCheckRequired = true; // Flag for route handler
            }
        }

        if (hasPermission) {
            next();
        } else {
            console.log(`Authorization Denial (403): User ${req.user.username} (Role: ${role}) failed check for ${resource}:${action}`);
            // Structured Log for Observability
            console.error(JSON.stringify({
                level: 'error',
                message: 'AuthorizationDenied',
                userId: req.user.id,
                username: req.user.username,
                role: role,
                requiredPermission: `${resource}:${action}`,
                timestamp: new Date().toISOString(),
                correlationId: req.headers['x-request-id'] || 'N/A'
            }));
            res.status(403).send({ error: `Forbidden. Role '${role}' cannot perform '${action}' on '${resource}'.` });
        }
    };
};

// --- Route: Authentication ---
app.post('/api/auth/register', async (req, res) => {
    const { username, password, email, role } = req.body;
    // Input validation/sanitization (minimal check)
    if (!username || !password) return res.status(400).send('Username and password are required.');
    if (users.some(u => u.username === username)) return res.status(400).send('User already exists.');

    const newUser = {
        id: nextUserId++,
        username,
        password: hashPassword(password),
        email: email || `${username}@example.com`,
        // Default role is VIEWER unless Admin is registering them (Admin path is below)
        role: ['ADMIN', 'EDITOR', 'VIEWER'].includes(role) ? role : 'VIEWER',
    };
    users.push(newUser);

    const token = jwt.sign(
        { userId: newUser.id, role: newUser.role, username: newUser.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );

    res.send({ token, role: newUser.role, userId: newUser.id, username: newUser.username });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(400).send('Invalid username or password.');
    }

    // Key Feature: Auth Tokens (JWT with role, userId)
    const token = jwt.sign(
        { userId: user.id, role: user.role, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );

    res.send({
        token,
        role: user.role,
        userId: user.id,
        username: user.username,
        message: `Welcome, ${user.username} (${user.role})!`
    });
});

// --- Route: Posts API (Data Scoping / CRUD) ---

// CREATE Post
app.post('/api/posts', authMiddleware, authorize('posts', 'create'), (req, res) => {
    const { title, content } = req.body;
    const newPost = {
        id: nextPostId++,
        title,
        content,
        authorId: req.user.id,
        author: req.user.username,
        createdAt: new Date()
    };
    posts.push(newPost);
    res.status(201).send(newPost);
});

// READ Posts (Key Feature: Data Scoping)
app.get('/api/posts', authMiddleware, authorize('posts', 'read'), (req, res) => {
    const userRole = req.user.role;
    let filteredPosts = [...posts];

    // This is the core Data Scoping / Query-level Filter logic
    if (userRole === 'VIEWER' || userRole === 'EDITOR') {
        // In a real MongoDB query: Post.find({ isPublic: true }) or similar.
        // Mock: Assume all posts are visible for demonstration of the READ permission.
        // If we wanted to restrict access, we would filter here.
        // For simplicity, READ is global access for all authenticated users who pass authorize.
    }

    res.send(filteredPosts.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        author: p.author,
        authorId: p.authorId,
        createdAt: p.createdAt
    })));
});

// UPDATE Post (Key Feature: Ownership Predicates)
app.put('/api/posts/:id', authMiddleware, authorize('posts', 'update', true), (req, res) => {
    const postId = parseInt(req.params.id);
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) return res.status(404).send('Post not found.');

    const post = posts[postIndex];

    // Check 1: Did the authorize middleware flag an ownership requirement? (i.e., user is an Editor)
    if (req.isOwnerCheckRequired) {
        // Check 2: Actual row-level security check (authorId === userId)
        if (post.authorId !== req.user.id) {
            console.log(`Authorization Denial (403): User ${req.user.username} attempted to update post ${postId} belonging to ${post.authorId}`);
            return res.status(403).send({ error: 'Forbidden. You can only update your own posts.' });
        }
    }
    // Admin, who doesn't trigger req.isOwnerCheckRequired for 'posts:update', bypasses this check.

    // Update the post
    posts[postIndex] = {
        ...post,
        title: req.body.title || post.title,
        content: req.body.content || post.content,
        updatedAt: new Date()
    };

    res.send(posts[postIndex]);
});

// DELETE Post (Ownership Predicates)
app.delete('/api/posts/:id', authMiddleware, authorize('posts', 'delete', true), (req, res) => {
    const postId = parseInt(req.params.id);
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) return res.status(404).send('Post not found.');

    const post = posts[postIndex];

    // Ownership Check
    if (req.isOwnerCheckRequired && post.authorId !== req.user.id) {
        console.log(`Authorization Denial (403): User ${req.user.username} attempted to delete post ${postId} belonging to ${post.authorId}`);
        return res.status(403).send({ error: 'Forbidden. You can only delete your own posts.' });
    }

    posts.splice(postIndex, 1);
    res.send({ message: 'Post deleted successfully.' });
});

// --- Route: Admin Panel (Key Feature: Administration) ---
app.get('/api/admin/users', authMiddleware, authorize('users', 'read'), (req, res) => {
    // Only Admin or Editor can read the user list
    res.send(users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        email: u.email
    })));
});

app.put('/api/admin/users/:id/role', authMiddleware, authorize('admin', 'manage_roles'), (req, res) => {
    const userId = parseInt(req.params.id);
    const { newRole } = req.body;

    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(newRole)) {
        return res.status(400).send('Invalid role provided.');
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).send('User not found.');

    const oldRole = users[userIndex].role;
    users[userIndex].role = newRole;

    // Audit Log example (Key Feature: Administration/Observability)
    console.log(`[AUDIT] Role changed for User ID ${userId} (${users[userIndex].username}) by Admin ID ${req.user.id}. Old Role: ${oldRole}, New Role: ${newRole}`);

    res.send({ message: `Role updated to ${newRole} for user ${users[userIndex].username}.` });
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`⚡️ [Server] Running on http://localhost:${PORT}`);
    console.log('--- Test Users ---');
    console.log('Admin: admin / admin123');
    console.log('Editor: editor1 / editor123');
    console.log('Viewer: viewer / viewer123');
});