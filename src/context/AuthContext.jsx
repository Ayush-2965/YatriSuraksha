import { useState, useEffect, useCallback } from 'react';
import { account, ID, databases, Query } from '../lib/appwrite';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext.context';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const login = async (email, password) => {
        try {
            // Always log out current session before login
            try {
                await account.deleteSession('current');
            } catch {
                // Ignore if no session exists
            }
            
            // Create new session with timeout
            const session = await Promise.race([
                account.createEmailPasswordSession(email, password),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Login timeout - please check your connection')), 10000)
                )
            ]);
            
            const userData = await account.get();
            setUser(userData);
            
            // Store user session in localStorage with 1 week expiration
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7); // 1 week from now
            
            localStorage.setItem('userSession', JSON.stringify({
                userId: userData.$id,
                email: userData.email,
                name: userData.name,
                loginTime: new Date().toISOString(),
                expirationTime: expirationDate.toISOString(),
                ongoingTourId: null,
                tourStatus: null,
                sessionId: session.$id // Store session ID for better tracking
            }));
            
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(error.message || 'Login failed - please check your connection');
        }
    };

    // Update: Register with extra details and store in Appwrite database
    const register = async (email, password, name, gender, age, dob, phone, emergencyContacts) => {
        try {
            const id = ID.unique(); 
            
            // First create the auth account
            await account.create(id, email, password, name);
            
            // Store extra details in Appwrite database with the same ID
            const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
            const collectionId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
            await databases.createDocument(databaseId, collectionId, id, {
                userId: id,
                name,
                email,
                gender,
                age,
                dob,
                phone,
                emergencyContacts
            });
            
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
            
            // Clear user session from localStorage
            localStorage.removeItem('userSession');
            
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
            // Even if logout fails, clear local state
            setUser(null);
            localStorage.removeItem('userSession');
            navigate('/login');
        }
    };

    const refreshSession = async () => {
        try {
            const userData = await account.get();
            setUser(userData);
            
            // Update localStorage with fresh data
            const storedSession = localStorage.getItem('userSession');
            if (storedSession) {
                const sessionData = JSON.parse(storedSession);
                const updatedSession = {
                    ...sessionData,
                    userId: userData.$id,
                    email: userData.email,
                    name: userData.name
                };
                localStorage.setItem('userSession', JSON.stringify(updatedSession));
            }
            
            return true;
        } catch (error) {
            console.error('Session refresh failed:', error);
            return false;
        }
    };

    const checkAuth = useCallback(async () => {
        try {
            // Check localStorage for existing session first
            const storedSession = localStorage.getItem('userSession');
            if (storedSession) {
                const sessionData = JSON.parse(storedSession);
                
                // Check if session has expired (unless user has ongoing tour)
                const sessionExpired = new Date() > new Date(sessionData.expirationTime);
                const hasOngoingTour = sessionData.ongoingTourId && sessionData.tourStatus === 'ongoing';
                
                if (sessionExpired && !hasOngoingTour) {
                    localStorage.removeItem('userSession');
                    setUser(null);
                    setLoading(false);
                    return;
                }
                
                // If user data exists in localStorage, set it immediately for offline mode
                const userFromStorage = {
                    $id: sessionData.userId,
                    email: sessionData.email,
                    name: sessionData.name
                };
                setUser(userFromStorage);
                
                // Check if user has ongoing tour
                const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
                const toursCollectionId = import.meta.env.VITE_APPWRITE_TOURS_COLLECTION_ID;
                
                try {
                    // Try to verify session with Appwrite (online check)
                    const userData = await Promise.race([
                        account.get(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Network timeout')), 5000)
                        )
                    ]);
                    
                    // If online, update user data from server
                    setUser(userData);
                    
                    const ongoingTours = await databases.listDocuments(databaseId, toursCollectionId, [
                        Query.and([
                            Query.equal('userId', sessionData.userId),
                            Query.equal('status', 'ongoing')
                        ])
                    ]);
                    
                    if (ongoingTours.documents.length > 0) {
                        // User has ongoing tour, restore session and update stored session
                        
                        // Update session with ongoing tour info
                        const updatedSession = {
                            ...sessionData,
                            ongoingTourId: ongoingTours.documents[0].$id,
                            tourStatus: 'ongoing'
                        };
                        localStorage.setItem('userSession', JSON.stringify(updatedSession));
                        
                        // Only redirect to dashboard if user is on login/register/landing pages
                        // Allow them to stay on tour-related pages like /tour-view, /map, /dashboard
                        const currentPath = location.pathname;
                        const shouldRedirect = ['/', '/login', '/register'].includes(currentPath);
                        
                        if (shouldRedirect) {
                            navigate('/dashboard');
                        }
                        return;
                    } else {
                        // No ongoing tour, clear tour info from session
                        const updatedSession = {
                            ...sessionData,
                            ongoingTourId: null,
                            tourStatus: null
                        };
                        localStorage.setItem('userSession', JSON.stringify(updatedSession));
                    }
                } catch (tourCheckError) {
                    console.log('Network error or offline - using cached session:', tourCheckError);
                    // If network error/offline, continue with cached user data
                    // User is already set from localStorage above
                    setLoading(false);
                    return;
                }
            } else {
                // No stored session, try to get fresh session from Appwrite
                try {
                    const userData = await Promise.race([
                        account.get(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Network timeout')), 5000)
                        )
                    ]);
                    setUser(userData);
                } catch {
                    // No stored session and can't get fresh session
                    setUser(null);
                    localStorage.removeItem('userSession');
                }
            }
        } catch {
            setUser(null);
            localStorage.removeItem('userSession');
        } finally {
            setLoading(false);
        }
    }, [navigate, location.pathname]);

    useEffect(() => {
        checkAuth();
        
        // Add network status listeners
        const handleOnline = async () => {
            console.log('📶 Back online - rechecking authentication');
            
            // Try to refresh session when coming back online
            const sessionRefreshed = await refreshSession();
            if (!sessionRefreshed) {
                // If session refresh fails, do full auth check
                checkAuth();
            }
        };
        
        const handleOffline = () => {
            console.log('📴 Gone offline - using cached authentication');
        };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [checkAuth]);

    const contextValue = {
        user,
        login,
        register,
        logout,
        loading,
        refreshSession
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
