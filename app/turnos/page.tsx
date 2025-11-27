"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { store } from "@/lib/store"
import type { Shift, User } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FiArrowLeft,
  FiPlay,
  FiStopCircle,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiDownload,
  FiUser,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi"
import { toast } from "sonner"

export default function TurnosPage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [expandedShift, setExpandedShift] = useState<string | null>(null)
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
    loadShifts()
  }, [router])

  const loadShifts = () => {
    setActiveShift(store.getActiveShift())
    setShifts(store.getShifts())
  }

  const handleStartShift = () => {
    if (user) {
      store.startShift(user.id, user.name)
      loadShifts()
      toast.success("Turno iniciado")
    }
  }

  const handleCloseShift = () => {
    if (activeShift) {
      const closedShift = store.closeShift(activeShift.id)
      if (closedShift) {
        loadShifts()
        toast.success("Turno cerrado")
      }
    }
  }

  const exportShiftReport = (shift: Shift) => {
    const report = generateReport(shift)
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `turno-${shift.userName}-${new Date(shift.startTime).toLocaleDateString("es-AR").replace(/\//g, "-")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Reporte exportado")
  }

  const generateReport = (shift: Shift): string => {
    const startDate = new Date(shift.startTime)
    const endDate = shift.endTime ? new Date(shift.endTime) : new Date()

    let report = `
╔══════════════════════════════════════════════════════════╗
║                    REPORTE DE TURNO                       ║
╚══════════════════════════════════════════════════════════╝

📋 INFORMACIÓN GENERAL
─────────────────────────────────────────────────────────────
Empleado:     ${shift.userName}
Inicio:       ${startDate.toLocaleDateString("es-AR")} ${startDate.toLocaleTimeString("es-AR")}
Fin:          ${endDate.toLocaleDateString("es-AR")} ${endDate.toLocaleTimeString("es-AR")}
Estado:       ${shift.status === "active" ? "ACTIVO" : "CERRADO"}

💰 RESUMEN FINANCIERO
─────────────────────────────────────────────────────────────
Total Ventas:      $${shift.totalSales.toLocaleString("es-AR")}
Total Ganancias:   $${shift.totalProfit.toLocaleString("es-AR")}
Transacciones:     ${shift.sales.length}

📊 GANANCIAS POR BENEFICIARIO
─────────────────────────────────────────────────────────────
Juan:              $${shift.profitByBeneficiary.juan.toLocaleString("es-AR")}
Lucas:             $${shift.profitByBeneficiary.lucas.toLocaleString("es-AR")}
Compartido:        $${shift.profitByBeneficiary.shared.toLocaleString("es-AR")}

📦 DETALLE DE VENTAS
─────────────────────────────────────────────────────────────
`

    shift.sales.forEach((sale, index) => {
      report += `
Venta #${index + 1} - ${new Date(sale.createdAt).toLocaleTimeString("es-AR")}
`
      sale.items.forEach((item) => {
        report += `  • ${item.quantity}x ${item.productName} @ $${item.unitPrice.toLocaleString("es-AR")} = $${item.subtotal.toLocaleString("es-AR")}
`
      })
      report += `  TOTAL: $${sale.total.toLocaleString("es-AR")}
`
    })

    report += `
─────────────────────────────────────────────────────────────
                    Generado por Almacén v1.0
                    ${new Date().toLocaleString("es-AR")}
`

    return report
  }

  const formatDuration = (start: string, end?: string) => {
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : new Date()
    const diff = endDate.getTime() - startDate.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  if (!mounted || !user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-xl">Gestión de Turnos</h1>
              <p className="text-sm text-muted-foreground">{activeShift ? "Turno activo" : "Sin turno activo"}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Active Shift Card */}
        {activeShift ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary border-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary">TURNO ACTIVO</Badge>
                    <span className="text-muted-foreground text-sm">{formatDuration(activeShift.startTime)}</span>
                  </div>
                  <Button variant="destructive" className="gap-2" onClick={handleCloseShift}>
                    <FiStopCircle className="h-4 w-4" />
                    Cerrar Turno
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FiUser className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{activeShift.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      Desde{" "}
                      {new Date(activeShift.startTime).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <FiDollarSign className="h-4 w-4" />
                      <span className="text-xs">Ventas</span>
                    </div>
                    <p className="text-2xl font-bold">${activeShift.totalSales.toLocaleString("es-AR")}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <FiTrendingUp className="h-4 w-4" />
                      <span className="text-xs">Ganancia</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ${activeShift.totalProfit.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <span className="text-xs font-bold">J</span>
                      <span className="text-xs">Juan</span>
                    </div>
                    <p className="text-2xl font-bold">
                      ${activeShift.profitByBeneficiary.juan.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <span className="text-xs font-bold">L</span>
                      <span className="text-xs">Lucas</span>
                    </div>
                    <p className="text-2xl font-bold">
                      ${activeShift.profitByBeneficiary.lucas.toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>

                <p className="text-center text-muted-foreground text-sm mt-4">
                  {activeShift.sales.length} transacciones realizadas
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <FiClock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Sin turno activo</h2>
                <p className="text-muted-foreground mb-6">Iniciá un turno para registrar ventas</p>
                <Button size="lg" className="gap-2" onClick={handleStartShift}>
                  <FiPlay className="h-5 w-5" />
                  Iniciar Turno
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Shift History */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiCalendar className="h-5 w-5" />
            Historial de Turnos
          </h2>

          <div className="space-y-3">
            <AnimatePresence>
              {shifts
                .filter((s) => s.status === "closed")
                .map((shift, index) => (
                  <motion.div
                    key={shift.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedShift(expandedShift === shift.id ? null : shift.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <FiUser className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{shift.userName}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(shift.startTime).toLocaleDateString("es-AR")} •{" "}
                                {formatDuration(shift.startTime, shift.endTime)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold">${shift.totalSales.toLocaleString("es-AR")}</p>
                              <p className="text-sm text-primary">
                                ${shift.totalProfit.toLocaleString("es-AR")} ganancia
                              </p>
                            </div>
                            {expandedShift === shift.id ? (
                              <FiChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <FiChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedShift === shift.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 mt-4 border-t">
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <div className="text-center p-3 bg-muted rounded-lg">
                                    <p className="text-xs text-muted-foreground">Juan</p>
                                    <p className="font-bold">
                                      ${shift.profitByBeneficiary.juan.toLocaleString("es-AR")}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-muted rounded-lg">
                                    <p className="text-xs text-muted-foreground">Lucas</p>
                                    <p className="font-bold">
                                      ${shift.profitByBeneficiary.lucas.toLocaleString("es-AR")}
                                    </p>
                                  </div>
                                  <div className="text-center p-3 bg-muted rounded-lg">
                                    <p className="text-xs text-muted-foreground">Compartido</p>
                                    <p className="font-bold">
                                      ${shift.profitByBeneficiary.shared.toLocaleString("es-AR")}
                                    </p>
                                  </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-3">{shift.sales.length} transacciones</p>

                                <Button
                                  variant="outline"
                                  className="w-full gap-2 bg-transparent"
                                  onClick={() => exportShiftReport(shift)}
                                >
                                  <FiDownload className="h-4 w-4" />
                                  Exportar Reporte
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </AnimatePresence>

            {shifts.filter((s) => s.status === "closed").length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay turnos anteriores</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
