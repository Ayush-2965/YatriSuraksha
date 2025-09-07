import { useState, useEffect } from 'react';
import { account, ID } from '../lib/appwrite';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext.context';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const login = async (email, password) => {
        try {
            await account.createEmailPasswordSession(email, password);
            const userData = await account.get();
            setUser(userData);
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(error.message);
        }
    };

    const register = async (email, password, name) => {
        try {
            await account.create(ID.unique(), email, password, name);
            await login(email, password);
        } catch (error) {
            console.error('Registration error:', error);
            throw new Error(error.message);
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const checkAuth = async () => {
        try {
            const userData = await account.get();
            setUser(userData);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const contextValue = {
        user,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
