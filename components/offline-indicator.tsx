"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiWifiOff, FiWifi, FiRefreshCw } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { store } from "@/lib/store"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showReconnected, setShowReconnected] = useState(false)
  const [pendingSales, setPendingSales] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsOnline(navigator.onLine)
    updatePendingSales()

    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      setTimeout(() => setShowReconnected(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check for pending sales periodically
    const interval = setInterval(updatePendingSales, 5000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [])

  const updatePendingSales = () => {
    const unsynced = store.getUnsyncedSales()
    setPendingSales(unsynced.length)
  }

  const handleSync = async () => {
    if (!isOnline || pendingSales === 0) return

    setIsSyncing(true)

    // Simulate sync - in production this would call your API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const unsynced = store.getUnsyncedSales()
    store.markSalesAsSynced(unsynced.map((s) => s.id))

    updatePendingSales()
    setIsSyncing(false)
  }

  if (!mounted) return null
  if (isOnline && !showReconnected && pendingSales === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        {!isOnline && (
          <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm">
            <FiWifiOff className="h-4 w-4" />
            <span>Sin conexión - Las ventas se guardarán localmente</span>
          </div>
        )}

        {showReconnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm"
          >
            <FiWifi className="h-4 w-4" />
            <span>Conexión restablecida</span>
          </motion.div>
        )}

        {isOnline && pendingSales > 0 && !showReconnected && (
          <div className="bg-chart-4 text-foreground px-4 py-2 flex items-center justify-center gap-3 text-sm">
            <span>{pendingSales} venta(s) pendiente(s) de sincronizar</span>
            <Button size="sm" variant="secondary" className="h-7 gap-1" onClick={handleSync} disabled={isSyncing}>
              <FiRefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
