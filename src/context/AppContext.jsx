import React, { createContext, useReducer, useCallback } from 'react'
import * as groupService from '../services/groupService'
import * as expenseService from '../services/expenseService'
import * as settlementService from '../services/settlementService'

export const AppContext = createContext(null)

const initialState = {
  groups: [],
  expenses: [],
  settlements: [],
  loading: false,
  error: null,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_GROUPS':
      return {
        ...state,
        groups: action.payload || [],
        loading: false,
        error: null,
      }
    case 'SET_EXPENSES':
      return {
        ...state,
        expenses: action.payload || [],
        loading: false,
        error: null,
      }
    case 'SET_SETTLEMENTS':
      return {
        ...state,
        settlements: action.payload || [],
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
    default:
      return state
  }
}

/**
 * Application Data Context Provider
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const refreshGroups = useCallback(async (userId) => {
    if (!userId) {
      dispatch({ type: 'SET_GROUPS', payload: [] })
      return []
    }
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const groups = await groupService.getUserGroups(userId)
      dispatch({ type: 'SET_GROUPS', payload: groups || [] })
      return groups
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to fetch groups' })
      throw err
    }
  }, [])

  const refreshGroupExpenses = useCallback(async (groupId) => {
    if (!groupId) {
      dispatch({ type: 'SET_EXPENSES', payload: [] })
      return []
    }
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const expenses = await expenseService.getGroupExpenses(groupId)
      dispatch({ type: 'SET_EXPENSES', payload: expenses || [] })
      return expenses
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to fetch group expenses' })
      throw err
    }
  }, [])

  const refreshGroupSettlements = useCallback(async (groupId) => {
    if (!groupId) {
      dispatch({ type: 'SET_SETTLEMENTS', payload: [] })
      return []
    }
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const settlements = await settlementService.getGroupSettlements(groupId)
      dispatch({ type: 'SET_SETTLEMENTS', payload: settlements || [] })
      return settlements
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to fetch group settlements' })
      throw err
    }
  }, [])

  const value = {
    groups: state.groups,
    expenses: state.expenses,
    settlements: state.settlements,
    loading: state.loading,
    error: state.error,
    refreshGroups,
    refreshGroupExpenses,
    refreshGroupSettlements,
    dispatch,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default AppContext
