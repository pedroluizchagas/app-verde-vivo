import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import { supabase } from "../supabase"

export interface SyncItem {
  id: string
  table: string
  action: "create" | "update" | "delete"
  data: any
  timestamp: number
  synced: boolean
}

export class OfflineSyncService {
  private static readonly SYNC_QUEUE_KEY = "sync_queue"
  private static readonly CACHE_PREFIX = "cache_"
  private static readonly LAST_SYNC_KEY = "last_sync_"
  private static networkListenerStarted = false
  private static networkUnsubscribe: (() => void) | null = null
  private static lastNetworkSync = 0

  static async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch()
    return Boolean(state.isConnected) && state.isInternetReachable === true
  }

  static async addToSyncQueue(item: Omit<SyncItem, "id" | "timestamp" | "synced">): Promise<void> {
    try {
      const queue = await this.getSyncQueue()
      const newItem: SyncItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
        synced: false,
      }
      queue.push(newItem)
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error("Error adding to sync queue:", error)
    }
  }

  static async getSyncQueue(): Promise<SyncItem[]> {
    try {
      const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY)
      return queueData ? JSON.parse(queueData) : []
    } catch (error) {
      console.error("Error getting sync queue:", error)
      return []
    }
  }

  static async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SYNC_QUEUE_KEY)
    } catch (error) {
      console.error("Error clearing sync queue:", error)
    }
  }

  static async syncPendingItems(): Promise<void> {
    const isOnline = await this.isOnline()
    if (!isOnline) return

    try {
      const queue = await this.getSyncQueue()
      const unsyncedItems = queue.filter(item => !item.synced)

      for (const item of unsyncedItems) {
        try {
          await this.syncItem(item)
          item.synced = true
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error)
        }
      }

      // Update queue with synced items
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue))
      
      // Remove synced items from queue
      const remainingItems = queue.filter(item => !item.synced)
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(remainingItems))
    } catch (error) {
      console.error("Error syncing pending items:", error)
    }
  }

  private static async syncItem(item: SyncItem): Promise<void> {
    const { table, action, data } = item

    switch (action) {
      case "create":
        await supabase.from(table).insert(data)
        break
      case "update":
        await supabase.from(table).update(data).eq("id", data.id)
        break
      case "delete":
        await supabase.from(table).delete().eq("id", data.id)
        break
    }
  }

  static async cacheData(key: string, data: any): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + key
      const cacheData = {
        data,
        timestamp: Date.now(),
      }
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error caching data:", error)
    }
  }

  static async getCachedData(key: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<any> {
    try {
      const cacheKey = this.CACHE_PREFIX + key
      const cachedData = await AsyncStorage.getItem(cacheKey)
      
      if (!cachedData) return null
      
      const { data, timestamp } = JSON.parse(cachedData)
      const age = Date.now() - timestamp
      
      if (age > maxAge) {
        await AsyncStorage.removeItem(cacheKey)
        return null
      }
      
      return data
    } catch (error) {
      console.error("Error getting cached data:", error)
      return null
    }
  }

  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX))
      await AsyncStorage.multiRemove(cacheKeys)
    } catch (error) {
      console.error("Error clearing cache:", error)
    }
  }

  static async getLastSyncTime(table: string): Promise<number | null> {
    try {
      const lastSync = await AsyncStorage.getItem(this.LAST_SYNC_KEY + table)
      return lastSync ? parseInt(lastSync) : null
    } catch (error) {
      console.error("Error getting last sync time:", error)
      return null
    }
  }

  static async setLastSyncTime(table: string, timestamp: number = Date.now()): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LAST_SYNC_KEY + table, timestamp.toString())
    } catch (error) {
      console.error("Error setting last sync time:", error)
    }
  }

  static async shouldSync(table: string, syncInterval: number = 5 * 60 * 1000): Promise<boolean> {
    const isOnline = await this.isOnline()
    if (!isOnline) return false

    const lastSync = await this.getLastSyncTime(table)
    if (!lastSync) return true

    const timeSinceLastSync = Date.now() - lastSync
    return timeSinceLastSync > syncInterval
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear()
    } catch (error) {
      console.error("Error clearing all data:", error)
    }
  }

  static startAutoSync(interval: number = 30000): () => void {
    const intervalId = setInterval(async () => {
      await this.syncPendingItems()
    }, interval)

    return () => clearInterval(intervalId)
  }

  static setupNetworkListener(): () => void {
    if (this.networkListenerStarted && this.networkUnsubscribe) {
      return () => {}
    }
    this.networkListenerStarted = true
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        const now = Date.now()
        if (now - this.lastNetworkSync < 5000) {
          return
        }
        this.lastNetworkSync = now
        await this.syncPendingItems()
      }
    })
    this.networkUnsubscribe = unsubscribe
    return () => {}
  }
}