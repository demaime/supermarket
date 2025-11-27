"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { store } from "@/lib/store"
import type { Sale, User } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FiArrowLeft, FiSearch, FiShoppingCart, FiCalendar, FiUser, FiChevronDown, FiChevronUp } from "react-icons/fi"

export default function RegistrosPage() {
  const [user, setUser] = useState<User | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [search, setSearch] = useState("")
  const [expandedSale, setExpandedSale] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
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
    const loadSales = () => {
      const allSales = store.getSales()
      setSales(allSales)
      setFilteredSales(allSales)
    }
    
    loadSales()
    
    // Try to sync if online
    if (navigator.onLine) {
      store.syncWithDb().then(() => loadSales())
    }
  }, [router])

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredSales(sales)
    } else {
      const lowerSearch = search.toLowerCase()
      setFilteredSales(
        sales.filter(
          (sale) =>
            sale.id.toLowerCase().includes(lowerSearch) ||
            sale.userName.toLowerCase().includes(lowerSearch) ||
            sale.total.toString().includes(lowerSearch)
        )
      )
    }
  }, [search, sales])

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

  const toggleExpand = (id: string) => {
    setExpandedSale(expandedSale === id ? null : id)
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
              <h1 className="font-semibold text-xl">Historial de Ventas</h1>
              <p className="text-sm text-muted-foreground">
                {sales.length} ventas registradas
              </p>
            </div>
          </div>
          
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, vendedor o monto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {filteredSales.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FiShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron ventas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSales.map((sale, index) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`overflow-hidden transition-all ${expandedSale === sale.id ? "ring-2 ring-primary" : ""}`}>
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleExpand(sale.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <FiShoppingCart className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">${sale.total.toLocaleString("es-AR")}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="h-3 w-3" />
                            {formatDate(sale.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiUser className="h-3 w-3" />
                            {sale.userName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sale.synced ? "secondary" : "outline"} className={sale.synced ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "text-yellow-600 border-yellow-600"}>
                        {sale.synced ? "Sincronizado" : "Pendiente"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {expandedSale === sale.id ? <FiChevronUp /> : <FiChevronDown />}
                      </Button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedSale === sale.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t bg-muted/30"
                      >
                        <div className="p-4 space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Detalle de items</h4>
                          {sale.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>
                                <span className="font-bold">{item.quantity}x</span> {item.productName}
                              </span>
                              <span>${item.subtotal.toLocaleString("es-AR")}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                            <span>Total</span>
                            <span>${sale.total.toLocaleString("es-AR")}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-4 pt-2 border-t">
                            ID: {sale.id}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
