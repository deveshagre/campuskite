import { useContext, useEffect, useCallback } from 'react'
import { AppContext } from '../context/AppContext'
import { useAuth } from './useAuth'
import { useToast } from '../components/common/Toast'
import * as groupService from '../services/groupService'

/**
 * Custom hook to manage user groups.
 * Integrates with AppContext, useAuth, and useToast.
 */
export function useGroups() {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error('useGroups must be used within an AppProvider')
  }

  const { groups, loading, refreshGroups: refreshContextGroups } = appContext
  const { user } = useAuth()
  const toast = useToast()

  // Auto-fetch groups when user is authenticated
  useEffect(() => {
    if (user?.id) {
      refreshContextGroups(user.id).catch(() => {})
    }
  }, [user?.id, refreshContextGroups])

  const refreshGroups = useCallback(async () => {
    if (user?.id) {
      return await refreshContextGroups(user.id)
    }
    return []
  }, [user?.id, refreshContextGroups])

  const createGroup = useCallback(
    async (name, desc, color) => {
      try {
        const creatorId = user?.id || user?.email
        const newGroup = await groupService.createGroup(name, desc, color, creatorId)
        if (user?.id) {
          await refreshContextGroups(user.id)
        }
        toast.success(`Group "${name}" created successfully!`)
        return newGroup
      } catch (err) {
        toast.error(err.message || 'Failed to create group')
        throw err
      }
    },
    [user?.id, user?.email, refreshContextGroups, toast]
  )

  const updateGroup = useCallback(
    async (id, updates) => {
      try {
        const updated = await groupService.updateGroup(id, updates)
        if (user?.id) {
          await refreshContextGroups(user.id)
        }
        toast.success('Group updated successfully!')
        return updated
      } catch (err) {
        toast.error(err.message || 'Failed to update group')
        throw err
      }
    },
    [user?.id, refreshContextGroups, toast]
  )

  const deleteGroup = useCallback(
    async (id) => {
      try {
        await groupService.deleteGroup(id)
        if (user?.id) {
          await refreshContextGroups(user.id)
        }
        toast.success('Group deleted successfully!')
      } catch (err) {
        toast.error(err.message || 'Failed to delete group')
        throw err
      }
    },
    [user?.id, refreshContextGroups, toast]
  )

  const addMember = useCallback(
    async (groupId, email) => {
      try {
        const member = await groupService.addMember(groupId, email)
        if (user?.id) {
          await refreshContextGroups(user.id)
        }
        toast.success(`Added ${email} to group!`)
        return member
      } catch (err) {
        toast.error(err.message || 'Failed to add member')
        throw err
      }
    },
    [user?.id, refreshContextGroups, toast]
  )

  const removeMember = useCallback(
    async (groupId, userId) => {
      try {
        await groupService.removeMember(groupId, userId)
        if (user?.id) {
          await refreshContextGroups(user.id)
        }
        toast.success('Member removed from group')
      } catch (err) {
        toast.error(err.message || 'Failed to remove member')
        throw err
      }
    },
    [user?.id, refreshContextGroups, toast]
  )

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    refreshGroups,
  }
}

export default useGroups
