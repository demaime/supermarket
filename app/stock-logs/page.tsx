"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { store } from "@/lib/store"
import type { StockLog, User } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  FiArrowLeft, 
  FiSearch, 
  FiPackage, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiEdit, 
  FiPlusCircle,
  FiDollarSign 
} from "react-icons/fi"
import { Loader } from "@/components/ui/loader"

export default function StockLogsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [logs, setLogs] = useState<StockLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<StockLog[]>([])
  const [search, setSearch] = useState("")
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const currentUser = store.getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    setUser(currentUser)
    
    // Initial load
    const loadLogs = async () => {
      setIsLoading(true)
      try {
        const allLogs = await store.loadStockLogsFromDb()
        setLogs(allLogs)
        setFilteredLogs(allLogs)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadLogs()
  }, [router])

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredLogs(logs)
    } else {
      const lowerSearch = search.toLowerCase()
      setFilteredLogs(
        logs.filter(
          (log) =>
            log.productName.toLowerCase().includes(lowerSearch) ||
            log.userName.toLowerCase().includes(lowerSearch) ||
            log.action.toLowerCase().includes(lowerSearch)
        )
      )
    }
  }, [search, logs])

  if (!mounted || !user) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "add":
        return <FiTrendingUp className="h-5 w-5 text-green-500" />
      case "remove":
        return <FiTrendingDown className="h-5 w-5 text-red-500" />
      case "update_price":
        return <FiDollarSign className="h-5 w-5 text-blue-500" />
      case "update_cost":
        return <FiDollarSign className="h-5 w-5 text-orange-500" />
      case "create":
        return <FiPlusCircle className="h-5 w-5 text-purple-500" />
      default:
        return <FiEdit className="h-5 w-5 text-gray-500" />
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case "add":
        return "Stock Agregado"
      case "remove":
        return "Stock Removido"
      case "update_price":
        return "Precio Actualizado"
      case "update_cost":
        return "Costo Actualizado"
      case "create":
        return "Producto Creado"
      default:
        return action
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "add":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "remove":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      case "update_price":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "update_cost":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
      case "create":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-xl">Registro de Cambios de Stock</h1>
              <p className="text-sm text-muted-foreground">
                {logs.length} cambios registrados - Auditoría completa
              </p>
            </div>
          </div>
          
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por producto, usuario o acción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {isLoading ? (
          <Loader />
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FiPackage className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron registros</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{log.productName}</h3>
                          <Badge className={getActionColor(log.action)}>
                            {getActionLabel(log.action)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="font-mono">
                            {typeof log.previousValue === 'number' && typeof log.newValue === 'number' ? (
                              <>
                                {log.action.includes('price') || log.action.includes('cost') ? '$' : ''}
                                {log.previousValue.toLocaleString('es-AR')} → {' '}
                                {log.action.includes('price') || log.action.includes('cost') ? '$' : ''}
                                {log.newValue.toLocaleString('es-AR')}
                              </>
                            ) : (
                              `${log.previousValue} → ${log.newValue}`
                            )}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FiPackage className="h-3 w-3" />
                            {log.userName}
                          </span>
                          <span>
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
