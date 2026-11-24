import React, { createContext, useReducer, useEffect, useCallback } from 'react'
import * as authService from '../services/authService'

export const AuthContext = createContext(null)

const initialState = {
  user: null,
  loading: true,
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: Boolean(action.payload),
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        loading: false,
        error: null,
      }
    default:
      return state
  }
}

/**
 * Authentication Context Provider
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Restore session on mount
  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const currentUser = await authService.getCurrentUser()
        if (isMounted) {
          dispatch({ type: 'SET_USER', payload: currentUser || null })
        }
      } catch (err) {
        if (isMounted) {
          dispatch({ type: 'SET_USER', payload: null })
        }
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (email, pw) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const user = await authService.login(email, pw)
      dispatch({ type: 'SET_USER', payload: user })
      return user
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Login failed' })
      throw err
    }
  }, [])

  const register = useCallback(async (name, email, pw) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const user = await authService.register(name, email, pw)
      dispatch({ type: 'SET_USER', payload: user })
      return user
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Registration failed' })
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      authService.logout()
      dispatch({ type: 'LOGOUT' })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Logout failed' })
      throw err
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const currentUserId = state.user?.id
      if (!currentUserId) {
        throw new Error('No user is currently logged in')
      }
      const updatedUser = await authService.updateProfile(currentUserId, updates)
      dispatch({ type: 'SET_USER', payload: updatedUser })
      return updatedUser
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to update profile' })
      throw err
    }
  }, [state.user?.id])

  const changePassword = useCallback(async (oldPw, newPw) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const currentUserId = state.user?.id
      if (!currentUserId) {
        throw new Error('No user is currently logged in')
      }
      const updatedUser = await authService.changePassword(currentUserId, oldPw, newPw)
      dispatch({ type: 'SET_USER', payload: updatedUser })
      return updatedUser
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to change password' })
      throw err
    }
  }, [state.user?.id])

  const updateUser = useCallback((updatedUser) => {
    dispatch({ type: 'SET_USER', payload: updatedUser })
  }, [])

  const value = {
    user: state.user,
    currentUser: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    updateUser,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
