import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogIn, User, Edit, Trash2, Plus, Users, Shield } from 'lucide-react'; // Using lucide-react for icons

const API_BASE_URL = 'http://localhost:3001/api';

// --- RBAC Permission Matrix (Mirrored on Frontend for UI Guarding) ---
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

const ROLE_COLORS = {
    ADMIN: 'text-red-700 bg-red-100 border-red-300',
    EDITOR: 'text-green-700 bg-green-100 border-green-300',
    VIEWER: 'text-blue-700 bg-blue-100 border-blue-300',
};

// --- Custom Hook for Authentication and State ---
const useAuth = () => {
    const [user, setUser] = useState(null); // { token, role, userId, username }
    const [isLoading, setIsLoading] = useState(true);

    // Initial load from local storage
    useEffect(() => {
        const storedUser = localStorage.getItem('rbacUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('rbacUser', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('rbacUser');
    }, []);

    const can = useCallback((resource, action, itemAuthorId = null) => {
        if (!user || !user.role) return false;

        const rolePermissions = PERMISSIONS[user.role];
        if (!rolePermissions) return false;

        // 1. Standard Permission Check
        if (rolePermissions[resource] && rolePermissions[resource].includes(action)) {
            return true;
        }

        // 2. Ownership Check (for Editor's self_posts actions)
        if (itemAuthorId !== null) {
            const selfResource = `self_${resource}`;
            if (rolePermissions[selfResource] && rolePermissions[selfResource].includes(action)) {
                return user.userId === itemAuthorId;
            }
        }

        return false;
    }, [user]);

    return { user, isLoading, login, logout, can };
};

// --- Reusable Components ---

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full min-h-[40vh] text-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-t-4 border-indigo-500"></div>
    </div>
);

const UserCard = ({ user }) => (
    <div className={`p-5 rounded-xl shadow-lg mt-8 mb-8 flex items-center justify-between border ${ROLE_COLORS[user.role]}`}>
        <div className='flex items-center'>
            <User className='w-6 h-6 mr-3' />
            <div>
                <h3 className="font-semibold text-2xl">
                    Welcome, {user.username}
                </h3>
                <p className="text-sm font-medium opacity-80">
                    Role: **{user.role}** | User ID: {user.userId}
                </p>
            </div>
        </div>
        <div className='text-xs font-mono opacity-80'>
            TOKEN: {user.token.substring(0, 10)}...
        </div>
    </div>
);

const IconButton = ({ children, title, onClick, disabled, className = '', icon: IconComponent }) => (
    <span title={title} className="inline-block">
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-center p-2 rounded-lg text-sm font-medium transition duration-150 shadow-md ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {IconComponent && <IconComponent className='w-4 h-4 mr-1' />}
            {children}
        </button>
    </span>
);

// --- Pages/Views ---

const AuthView = ({ login }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isRegister ? 'register' : 'login';

        try {
            const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `Failed to ${endpoint}`);
            }

            login(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-10 mt-10 bg-white shadow-2xl rounded-3xl border border-gray-100 text-gray-800">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
                <LogIn className='w-8 h-8 inline-block mr-2 text-indigo-600' /> {isRegister ? 'New Account Registration' : 'Sign In'}
            </h2>
            <p className="text-sm text-center mb-8 text-gray-600 bg-gray-50 p-3 rounded-xl border border-dashed">
                **Test Credentials:** <span className='font-mono font-bold text-gray-700'>admin/admin123</span>, <span className='font-mono font-bold text-gray-700'>editor1/editor123</span>, <span className='font-mono font-bold text-gray-700'>viewer/viewer123</span>.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 placeholder:text-gray-400 text-gray-800"
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 placeholder:text-gray-400 text-gray-800"
                    />
                </div>

                {error && <p className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-200">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:bg-indigo-400"
                >
                    {loading ? 'Authenticating...' : (isRegister ? 'Register Account' : 'Login')}
                </button>
            </form>

            <div className="mt-8 text-center border-t pt-6 border-gray-100">
                <button
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-md font-medium text-indigo-600 hover:text-indigo-800 transition duration-150"
                >
                    {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register Here'}
                </button>
            </div>
        </div>
    );
};

const PostForm = ({ can, refreshPosts }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const isAllowed = can('posts', 'create');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            const user = JSON.parse(localStorage.getItem('rbacUser'));
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ title, content }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Post creation failed.');

            setMessage(`✅ Post "${data.title}" created successfully!`);
            setTitle('');
            setContent('');
            refreshPosts();

        } catch (err) {
            setMessage(`❌ Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAllowed) return null;

    return (
        <div className="p-8 bg-white rounded-2xl shadow-xl border border-gray-200 mb-10 text-gray-800">
            <h3 className="text-2xl font-bold mb-5 text-indigo-700 flex items-center">
                <Plus className='w-5 h-5 mr-2' /> Publish New Content
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Content Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                />
                <textarea
                    placeholder="Content Body (Row-level ownership will be applied here)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows="4"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                ></textarea>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-xl shadow-md hover:bg-green-700 transition duration-150 disabled:bg-green-400"
                >
                    {isSubmitting ? 'Publishing...' : 'Publish Post'}
                </button>
            </form>
            {message && (
                <p className={`mt-4 text-sm font-medium p-3 rounded-lg ${message.startsWith('❌ Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {message}
                </p>
            )}
        </div>
    );
};

const PostItem = ({ post, user, can, refreshPosts }) => {
    // Check permissions for buttons (Key Feature: Component-level Gates / UI Guarding)
    const canUpdate = can('posts', 'update', post.authorId);
    const canDelete = can('posts', 'delete', post.authorId);
    const isOwner = user && user.userId === post.authorId;

    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(post.title);
    const [content, setContent] = useState(post.content);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isError, setIsError] = useState(false);

    const handleUpdate = async () => {
        setIsSubmitting(true);
        setIsError(false);
        try {
            const storedUser = JSON.parse(localStorage.getItem('rbacUser'));
            const response = await fetch(`${API_BASE_URL}/posts/${post.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${storedUser.token}`
                },
                body: JSON.stringify({ title, content }),
            });

            if (!response.ok) {
                const data = await response.json();
                console.error('Update Failed:', data.error);
                setIsError(true);
                return;
            }

            setIsEditing(false);
            refreshPosts();
        } catch (error) {
            console.error('Update error:', error);
            setIsError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        // Use a simple confirm for demonstration; in a real app, use a custom modal
        if (!window.confirm(`Are you sure you want to delete "${post.title}"? This cannot be undone.`)) return;

        try {
            const storedUser = JSON.parse(localStorage.getItem('rbacUser'));
            const response = await fetch(`${API_BASE_URL}/posts/${post.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${storedUser.token}` },
            });

            if (!response.ok) {
                const data = await response.json();
                // Replace alert with console error/custom message box
                console.error(`Delete Failed (API Enforcement): ${data.error}`); 
                return;
            }

            refreshPosts();
        } catch (error) {
            console.error('Delete error:', error);
            // Replace alert with console error/custom message box
            console.error('An unexpected error occurred during delete.'); 
        }
    };

    const isActionAvailable = canUpdate || canDelete;

    return (
        <div className={`p-6 rounded-2xl shadow-lg transition-shadow border text-gray-800 ${isOwner ? 'bg-indigo-50 border-indigo-200 hover:shadow-xl' : 'bg-white border-gray-200 hover:shadow-lg'}`}>
            <div className='flex justify-between items-start'>
                <div className='flex-1 pr-4'>
                    {isEditing ? (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-2xl font-bold p-2 border border-indigo-400 rounded-lg mb-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            disabled={isSubmitting}
                        />
                    ) : (
                        <h4 className="text-2xl font-extrabold text-gray-900">{post.title}</h4>
                    )}
                </div>
                {isActionAvailable && (
                    <div className="flex space-x-2 shrink-0">
                        {isEditing ? (
                            <>
                                <IconButton
                                    onClick={handleUpdate}
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                    icon={Shield}
                                    title="Save Changes"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </IconButton>
                                <IconButton
                                    onClick={() => setIsEditing(false)}
                                    className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                                >
                                    Cancel
                                </IconButton>
                            </>
                        ) : (
                            <>
                                {/* UPDATE Button */}
                                {canUpdate ? (
                                    <IconButton
                                        onClick={() => setIsEditing(true)}
                                        className="bg-yellow-500 text-white hover:bg-yellow-600"
                                        icon={Edit}
                                        title="Edit Content"
                                    >
                                        Edit
                                    </IconButton>
                                ) : (
                                    <IconButton
                                        disabled
                                        className="bg-yellow-300 text-white"
                                        icon={Edit}
                                        title="Permission Denied: You cannot edit this content."
                                    >
                                        Edit
                                    </IconButton>
                                )}

                                {/* DELETE Button */}
                                {canDelete ? (
                                    <IconButton
                                        onClick={handleDelete}
                                        className="bg-red-600 text-white hover:bg-red-700"
                                        icon={Trash2}
                                        title="Delete Content"
                                    >
                                        Delete
                                    </IconButton>
                                ) : (
                                    <IconButton
                                        disabled
                                        className="bg-red-400 text-white"
                                        icon={Trash2}
                                        title="Permission Denied: You cannot delete this content."
                                    >
                                        Delete
                                    </IconButton>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {isEditing ? (
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows="4"
                    className="w-full p-2 border border-indigo-300 rounded-lg text-gray-700 mt-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                />
            ) : (
                <p className="mt-3 text-gray-700">{post.content}</p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${isOwner ? 'bg-indigo-200 text-indigo-700 border-indigo-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                    {isOwner ? 'YOUR CONTENT' : 'External Content'}
                </span>
                <span>
                    Author: <span className="font-medium text-gray-700">{post.author}</span> (ID: {post.authorId})
                </span>
            </div>
            {isError && <p className="mt-2 text-red-500 text-sm">Update failed. Check your console for the API error.</p>}
        </div>
    );
};

const Dashboard = ({ user, can, refreshPosts, posts }) => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const storedUser = JSON.parse(localStorage.getItem('rbacUser'));
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${storedUser.token}` },
            });

            const data = await response.json();
            if (!response.ok) {
                // This is where API Enforcement denial (403/401) is caught
                throw new Error(data.error || 'Failed to fetch posts.');
            }

            refreshPosts(data);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [refreshPosts]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);


    const readAllowed = can('posts', 'read');

    return (
        <div className="py-8 text-gray-800">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-8 flex items-center">
                <Shield className='w-7 h-7 mr-3 text-indigo-600' /> Content Dashboard
            </h2>

            {readAllowed && <PostForm can={can} refreshPosts={fetchPosts} />}

            {loading ? <LoadingSpinner /> : error ? (
                <div className="text-red-700 p-6 bg-red-100 rounded-xl border border-red-300 shadow-md">
                    <p className='font-bold text-lg'>Access Error (403/401)</p>
                    <p>Error loading posts: **{error}**. Check server status or confirm your role has `posts:read` permission.</p>
                </div>
            ) : (
                <>
                    <h3 className="text-2xl font-bold mb-5 text-gray-800 border-b pb-2 border-gray-200">
                        Available Posts ({posts.length})
                    </h3>
                    <div className="space-y-6">
                        {posts.length > 0 ? posts.map(post => (
                            <PostItem key={post.id} post={post} user={user} can={can} refreshPosts={fetchPosts} />
                        )) : <p className='text-gray-500 p-4 bg-white rounded-lg'>No posts found.</p>}
                    </div>
                </>
            )}

            {!readAllowed && !loading && !error && (
                 <div className="text-red-700 p-6 bg-red-100 rounded-xl border border-red-300 shadow-md">
                    <p className='font-bold text-lg'>READ Permission Denied</p>
                    <p>Your role ({user.role}) is not authorized to retrieve content from the API (`posts:read` is missing).</p>
                </div>
            )}
        </div>
    );
};

const AdminPanel = ({ user, can }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const canManageRoles = can('admin', 'manage_roles');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setMessage('');
        try {
            const storedUser = JSON.parse(localStorage.getItem('rbacUser'));
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${storedUser.token}` },
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch users.');

            setUsers(data);
        } catch (err) {
            setMessage(`❌ Error fetching users: ${err.message}`);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (can('users', 'read')) {
            fetchUsers();
        } else {
            setMessage("❌ Permission Denied: You do not have permission to view the user list ('users:read').");
        }
    }, [can, fetchUsers]);

    const handleRoleChange = async (userId, newRole) => {
        // Use a simple confirm for demonstration; in a real app, use a custom modal
        if (!window.confirm(`Are you sure you want to change user ${users.find(u => u.id === userId)?.username}'s role to ${newRole}?`)) return;

        try {
            const storedUser = JSON.parse(localStorage.getItem('rbacUser'));
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${storedUser.token}`
                },
                body: JSON.stringify({ newRole }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Role update failed.');

            setMessage(`✅ ${data.message}`);
            fetchUsers();

        } catch (err) {
            setMessage(`❌ Error updating role: ${err.message}`);
        }
    };

    // Key Feature: Route Guarding (via conditional rendering)
    if (!can('users', 'read')) { // If they can't even read the user list, deny access gracefully
        return (
            <div className="text-red-700 p-8 mt-8 bg-red-100 rounded-xl shadow-lg border border-red-300">
                <h2 className='text-3xl font-bold flex items-center'>
                    <Shield className='w-6 h-6 mr-3' /> Unauthorized Access
                </h2>
                <p className='mt-3'>Your role ({user.role}) is not authorized to access user information in the Admin Panel.</p>
            </div>
        );
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="py-8 text-gray-800">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-8 flex items-center">
                <Users className='w-7 h-7 mr-3 text-indigo-600' /> User Management
            </h2>

            {message && (
                <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${message.startsWith('❌ Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {message}
                </div>
            )}

            <div className="space-y-4">
                {users.map((u) => (
                    <div key={u.id} className={`p-5 rounded-xl shadow flex justify-between items-center transition-shadow border ${u.id === user.userId ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200 hover:shadow-lg'}`}>
                        <div>
                            <p className="font-bold text-gray-900 text-lg">{u.username}</p>
                            <p className="text-sm text-gray-500">ID: {u.id} | Email: {u.email}</p>
                            <span className={`mt-1 inline-block px-3 py-1 text-xs font-semibold rounded-full border ${ROLE_COLORS[u.role]}`}>
                                Current Role: {u.role}
                            </span>
                        </div>

                        {canManageRoles && u.id !== user.userId ? (
                            <div className='flex items-center space-x-2'>
                                <select
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    className="p-3 border border-gray-300 rounded-xl text-md font-medium bg-gray-50 shadow-sm text-gray-800"
                                >
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="EDITOR">EDITOR</option>
                                    <option value="VIEWER">VIEWER</option>
                                </select>
                                <span className="text-sm text-gray-500 italic">Change Role</span>
                            </div>
                        ) : (
                            <span className={`py-1 px-3 text-xs font-semibold rounded-full border ${u.id === user.userId ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                                {u.id === user.userId ? 'You Are Here' : canManageRoles ? 'Access Denied by Auth Check' : 'No Permission'}
                            </span>
                        )}
                    </div>
                ))}
            </div>
            {!canManageRoles && (
                <div className='mt-6 p-4 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-300'>
                    <p className='font-bold'>Permission Detail:</p>
                    <p className='text-sm'>You can view users, but you are blocked from managing roles (`admin:manage_roles` is missing).</p>
                </div>
            )}
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const { user, isLoading, login, logout, can } = useAuth();
    const [posts, setPosts] = useState([]);
    const [currentView, setCurrentView] = useState('dashboard');

    const refreshPosts = useCallback((newPosts) => {
        setPosts(newPosts);
    }, []);

    // HOOK FIX: useMemo must be called unconditionally at the top level
    const navItems = useMemo(() => [
        { name: 'Dashboard', view: 'dashboard', requiresAuth: true, show: true },
        { name: 'Admin Panel', view: 'admin', requiresAuth: true, show: can('users', 'read') },
    ], [can]);

    if (isLoading) return <LoadingSpinner />;

    const renderView = () => {
        if (!user) {
            return <AuthView login={login} />;
        }

        switch (currentView) {
            case 'admin':
                return <AdminPanel user={user} can={can} />;
            case 'dashboard':
            default:
                return <Dashboard user={user} can={can} refreshPosts={refreshPosts} posts={posts} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-800">
            <header className="bg-white shadow-lg sticky top-0 z-10 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 text-3xl font-extrabold text-indigo-700">
                            Nimbus <span className='text-gray-500'>RBAC Demo</span>
                        </div>
                        <nav className="flex items-center space-x-6">
                            {user && navItems.filter(i => i.show !== false).map((item) => (
                                <button
                                    key={item.view}
                                    onClick={() => setCurrentView(item.view)}
                                    className={`px-4 py-2 text-md font-bold rounded-xl transition duration-150 shadow-md ${
                                        currentView === item.view
                                            ? 'bg-indigo-600 text-white shadow-indigo-300'
                                            : 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50'
                                    }`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </nav>
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <div className={`px-4 py-2 text-sm font-bold rounded-full border shadow-sm ${ROLE_COLORS[user.role]}`}>
                                        Role: {user.role}
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="py-2 px-4 border border-transparent rounded-xl text-md font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-300"
                                    >
                                        <LogIn className='w-4 h-4 inline-block mr-1' /> Logout
                                    </button>
                                </>
                            ) : (
                                <span className="text-md font-medium text-gray-500">Not Logged In</span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {user && <UserCard user={user} />}
                {renderView()}
            </main>
        </div>
    );
};

export default App;