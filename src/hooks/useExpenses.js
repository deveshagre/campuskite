import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useToast } from '../components/common/Toast'
import * as expenseService from '../services/expenseService'

/**
 * Custom hook for group-specific expenses.
 *
 * @param {string} groupId - Group identifier
 */
export function useExpenses(groupId) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const toast = useToast()

  const fetchExpenses = useCallback(async () => {
    if (!groupId) {
      setExpenses([])
      return []
    }
    setLoading(true)
    try {
      const list = await expenseService.getGroupExpenses(groupId)
      setExpenses(list || [])
      return list || []
    } catch (err) {
      toast.error(err.message || 'Failed to load expenses')
      throw err
    } finally {
      setLoading(false)
    }
  }, [groupId, toast])

  useEffect(() => {
    if (groupId) {
      fetchExpenses().catch(() => {})
    } else {
      setExpenses([])
    }
  }, [groupId, fetchExpenses])

  const createExpense = useCallback(
    async (data) => {
      try {
        const payload = {
          groupId,
          paidBy: user?.id,
          ...data,
        }
        const created = await expenseService.createExpense(payload)
        await fetchExpenses()
        toast.success('Expense added successfully!')
        return created
      } catch (err) {
        toast.error(err.message || 'Failed to create expense')
        throw err
      }
    },
    [groupId, user?.id, fetchExpenses, toast]
  )

  const updateExpense = useCallback(
    async (id, data) => {
      try {
        const updated = await expenseService.updateExpense(id, data)
        await fetchExpenses()
        toast.success('Expense updated successfully!')
        return updated
      } catch (err) {
        toast.error(err.message || 'Failed to update expense')
        throw err
      }
    },
    [fetchExpenses, toast]
  )

  const deleteExpense = useCallback(
    async (id) => {
      try {
        await expenseService.deleteExpense(id, user?.id)
        await fetchExpenses()
        toast.success('Expense deleted successfully!')
      } catch (err) {
        toast.error(err.message || 'Failed to delete expense')
        throw err
      }
    },
    [user?.id, fetchExpenses, toast]
  )

  return {
    expenses,
    loading,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchExpenses,
  }
}

export default useExpenses
