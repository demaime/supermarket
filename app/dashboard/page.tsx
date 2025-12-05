"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { store } from "@/lib/store"
import type { User, Shift } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FiShoppingCart, FiPackage, FiClock, FiLogOut, FiSun, FiMoon, FiFileText, FiShield } from "react-icons/fi"
import { useTheme } from "next-themes"
import Image from "next/image"

const menuItems = [
  { id: "ventas", name: "Ventas", icon: FiShoppingCart, href: "/ventas", color: "bg-primary" },
  { id: "stock", name: "Stock", icon: FiPackage, href: "/stock", color: "bg-chart-2" },
  { id: "turnos", name: "Turnos", icon: FiClock, href: "/turnos", color: "bg-chart-4" },
  { id: "registros", name: "Registros", icon: FiFileText, href: "/registros", color: "bg-chart-3" },
  { id: "auditoria", name: "Auditoría", icon: FiShield, href: "/stock-logs", color: "bg-chart-5" },
]

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [shift, setShift] = useState<Shift | null>(null)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const currentUser = store.getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    setUser(currentUser)
    setShift(store.getActiveShift())
  }, [router])

  const handleLogout = () => {
    store.setCurrentUser(null)
    router.push("/")
  }

  if (!mounted || !user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <Image
                src="/icon-512.png"
                alt="Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-semibold text-lg block">Almacén</span>
              {shift && (
                <span className="text-xs text-muted-foreground">
                  Turno activo desde{" "}
                  {new Date(shift.startTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary">
                <Image
                  src={user.avatar || "/placeholder.svg"}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-medium hidden sm:block">{user.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <FiLogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">¡Hola, {user.name}!</h1>
          <p className="text-muted-foreground">¿Qué querés hacer hoy?</p>
        </motion.div>

        {/* Quick Stats */}
        {shift && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-lg shadow-primary/5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
              <div className="relative grid grid-cols-3 divide-x divide-primary/10">
                <div className="p-6 backdrop-blur-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                    Ventas del turno
                  </p>
                  <p className="text-3xl font-bold text-foreground tracking-tight">${shift.totalSales.toLocaleString("es-AR")}</p>
                </div>
                <div className="p-6 backdrop-blur-sm bg-primary/5 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                  <div className="relative">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                      Ganancia
                    </p>
                    <p className="text-3xl font-bold text-primary tracking-tight drop-shadow-sm">${shift.totalProfit.toLocaleString("es-AR")}</p>
                  </div>
                </div>
                <div className="p-6 backdrop-blur-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                    Transacciones
                  </p>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{shift.sales.length}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 overflow-hidden group"
                onClick={() => router.push(item.href)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/80 via-primary to-primary/90 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-primary/30">
                    {/* Shine effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-2xl"></div>
                    <item.icon className="h-8 w-8 text-white relative z-10 drop-shadow-md" />
                  </div>
                  <h3 className="text-xl font-semibold">{item.name}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
