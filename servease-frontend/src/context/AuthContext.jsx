import React, { createContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

const setAuthToken = token => {
    if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
    } else {
        delete axios.defaults.headers.common['x-auth-token'];
    }
};

const initialState = {
    isAuthenticated: false,
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: true,
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            return {
                ...state, isAuthenticated: true, token: action.payload.token, user: action.payload.user, loading: false,
            };
        case 'LOGOUT':
        case 'AUTH_FAIL':
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return {
                ...state, isAuthenticated: false, token: null, user: null, loading: false,
            };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'AUTH_SUCCESS':
            return { ...state, isAuthenticated: true, loading: false };
        default:
            return state;
    }
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        setAuthToken(state.token);
    }, [state.token]);

    const loadUser = async () => {
        if (state.token) {
            try {
                const res = await axios.get('/users/me'); 
                dispatch({ type: 'AUTH_SUCCESS', payload: res.data });
            } catch (err) {
                dispatch({ type: 'AUTH_FAIL' });
            }
        } else {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
    
    useEffect(() => {
        loadUser();
    }, []);

    const login = async (formData) => {
        try {
            const res = await axios.post('/auth/login', formData);
            const payload = { token: res.data.token, user: { id: res.data.id, role: res.data.role } };
            dispatch({ type: 'LOGIN_SUCCESS', payload });
            return true;
        } catch (err) {
            console.error(err.response?.data?.errors);
            alert('Login Failed: ' + (err.response?.data?.errors?.[0]?.msg || 'Invalid Credentials'));
            dispatch({ type: 'AUTH_FAIL' });
            return false;
        }
    };

    const register = async (formData) => {
         try {
            const res = await axios.post('/auth/register', formData);
            const payload = { token: res.data.token, user: { id: res.data.id, role: res.data.role } };
            dispatch({ type: 'LOGIN_SUCCESS', payload });
            return true;
        } catch (err) {
            console.error(err.response?.data?.errors);
            alert('Registration Failed: ' + (err.response?.data?.errors?.[0]?.msg || 'Error occurred'));
            return false;
        }
    };

    const logout = () => {
        dispatch({ type: 'LOGOUT' });
    };

    return (
        <AuthContext.Provider
            value={{ ...state, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};