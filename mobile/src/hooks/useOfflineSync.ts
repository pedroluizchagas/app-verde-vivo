import { useState, useEffect, useCallback } from "react"
import { OfflineSyncService } from "../services/offlineSyncService"

export function useOfflineSync<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: {
    syncInterval?: number
    cacheAge?: number
    onSyncComplete?: (data: T) => void
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const { syncInterval = 5 * 60 * 1000, cacheAge = 24 * 60 * 60 * 1000, onSyncComplete } = options

  const checkConnection = useCallback(async () => {
    const online = await OfflineSyncService.isOnline()
    setIsOnline(online)
    return online
  }, [])

  const syncData = useCallback(async () => {
    setIsSyncing(true)
    try {
      // First try to sync any pending items
      await OfflineSyncService.syncPendingItems()

      // Check if we should fetch fresh data
      const shouldSync = await OfflineSyncService.shouldSync(key, syncInterval)
      
      if (shouldSync) {
        const freshData = await fetchFunction()
        await OfflineSyncService.cacheData(key, freshData)
        await OfflineSyncService.setLastSyncTime(key)
        setData(freshData)
        onSyncComplete?.(freshData)
      }
    } catch (err) {
      console.error(`Error syncing ${key}:`, err)
      setError(err instanceof Error ? err.message : "Erro ao sincronizar")
    } finally {
      setIsSyncing(false)
    }
  }, [key, fetchFunction, syncInterval, onSyncComplete])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const online = await checkConnection()

      if (online) {
        // Online mode: sync and fetch fresh data
        await syncData()
      } else {
        // Offline mode: try to load from cache
        const cachedData = await OfflineSyncService.getCachedData(key, cacheAge)
        if (cachedData) {
          setData(cachedData)
        } else {
          setError("Sem conexão e sem dados em cache")
        }
      }
    } catch (err) {
      console.error(`Error loading ${key}:`, err)
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
      
      // Try to load from cache on error
      const cachedData = await OfflineSyncService.getCachedData(key, cacheAge)
      if (cachedData) {
        setData(cachedData)
      }
    } finally {
      setLoading(false)
    }
  }, [key, checkConnection, syncData, cacheAge])

  const createOffline = useCallback(async (table: string, newItem: any) => {
    try {
      // Add to sync queue for later sync
      await OfflineSyncService.addToSyncQueue({
        table,
        action: "create",
        data: newItem,
      })
      
      // Optimistically update local data
      setData((prev) => {
        return Array.isArray(prev)
          ? ([...(prev as any[]), newItem] as any)
          : (newItem as any)
      })
      
      // Try to sync immediately if online
      if (isOnline) {
        await syncData()
      }
    } catch (err) {
      console.error("Error creating offline:", err)
      throw err
    }
  }, [isOnline, syncData])

  const updateOffline = useCallback(async (table: string, id: string, patch: any) => {
    try {
      // Add to sync queue for later sync
      await OfflineSyncService.addToSyncQueue({
        table,
        action: "update",
        data: { ...patch, id },
      })
      
      // Optimistically update local data
      setData((prev) => {
        if (Array.isArray(prev)) {
          const updated = (prev as any[]).map((item) =>
            item.id === id ? { ...item, ...patch } : item
          )
          return updated as any
        }
        return prev as any
      })
      
      // Try to sync immediately if online
      if (isOnline) {
        await syncData()
      }
    } catch (err) {
      console.error("Error updating offline:", err)
      throw err
    }
  }, [isOnline, syncData])

  const deleteOffline = useCallback(async (table: string, id: string) => {
    try {
      // Add to sync queue for later sync
      await OfflineSyncService.addToSyncQueue({
        table,
        action: "delete",
        data: { id },
      })
      
      // Optimistically update local data
      setData((prev) => {
        if (Array.isArray(prev)) {
          const filtered = (prev as any[]).filter((item) => item.id !== id)
          return filtered as any
        }
        return prev as any
      })
      
      // Try to sync immediately if online
      if (isOnline) {
        await syncData()
      }
    } catch (err) {
      console.error("Error deleting offline:", err)
      throw err
    }
  }, [isOnline, syncData])

  useEffect(() => {
    loadData()

    // Setup network listener
    const unsubscribe = OfflineSyncService.setupNetworkListener()

    // Setup auto sync
    const stopAutoSync = OfflineSyncService.startAutoSync(syncInterval)

    return () => {
      if (unsubscribe) unsubscribe()
      stopAutoSync()
    }
  }, [loadData, syncInterval])

  // Refresh data when coming back online
  useEffect(() => {
    if (isOnline) {
      syncData()
    }
  }, [isOnline, syncData])

  return {
    data,
    loading,
    error,
    isOnline,
    isSyncing,
    refresh: loadData,
    sync: syncData,
    createOffline,
    updateOffline,
    deleteOffline,
  }
}
