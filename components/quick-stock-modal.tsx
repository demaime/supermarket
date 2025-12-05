"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FiX, FiPlus, FiMinus, FiPackage } from "react-icons/fi"
import { useAlertDialog } from "@/hooks/use-alert-dialog"

interface QuickStockModalProps {
  product: Product
  onClose: () => void
  onSave: (product: Product, quantityChange: number) => void
}

export function QuickStockModal({ product, onClose, onSave }: QuickStockModalProps) {
  const [quantityToAdd, setQuantityToAdd] = useState<number>(0)
  const { alert, Dialog: AlertDialog } = useAlertDialog()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantityToAdd !== 0) {
      const newQuantity = product.quantity + quantityToAdd
      if (newQuantity < 0) {
        await alert({
          title: "Stock Negativo",
          description: "No podés tener stock negativo. Por favor, ajustá la cantidad.",
          type: "warning",
          buttonText: "Entendido",
        })
        return
      }
      onSave({ ...product, quantity: newQuantity }, quantityToAdd)
    }
  }

  const quickAdd = (amount: number) => {
    setQuantityToAdd((prev) => prev + amount)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Ajustar Stock</h2>
            <p className="text-sm text-muted-foreground">{product.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <FiX className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Stock */}
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Stock actual</p>
            <div className="flex items-center justify-center gap-2">
              <FiPackage className="h-5 w-5 text-primary" />
              <p className="text-3xl font-bold">{product.quantity}</p>
              <span className="text-muted-foreground">unidades</span>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div>
            <Label className="mb-2 block">Acciones rápidas</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button type="button" variant="outline" onClick={() => quickAdd(-10)} className="bg-transparent">
                -10
              </Button>
              <Button type="button" variant="outline" onClick={() => quickAdd(-1)} className="bg-transparent">
                -1
              </Button>
              <Button type="button" variant="outline" onClick={() => quickAdd(1)} className="bg-transparent">
                +1
              </Button>
              <Button type="button" variant="outline" onClick={() => quickAdd(10)} className="bg-transparent">
                +10
              </Button>
              <Button type="button" variant="outline" onClick={() => quickAdd(-50)} className="bg-transparent">
                -50
              </Button>
              <Button type="button" variant="outline" onClick={() => quickAdd(-5)} className="bg-transparent">
                -5
              </Button>
              <Button type="button" variant="outline" onClick={() => quickAdd(5)} className="bg-transparent">
                +5
              </Button>
              <Button type="button" variant="outline" onClick={() => quickAdd(50)} className="bg-transparent">
                +50
              </Button>
            </div>
          </div>

          {/* Manual Input */}
          <div>
            <Label htmlFor="quantity">Cantidad a agregar/quitar</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantityToAdd((prev) => prev - 1)}
                className="bg-transparent"
              >
                <FiMinus className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(Number.parseInt(e.target.value) || 0)}
                className="text-center text-lg font-bold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantityToAdd((prev) => prev + 1)}
                className="bg-transparent"
              >
                <FiPlus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {quantityToAdd > 0 ? "+" : ""}
              {quantityToAdd} unidades
            </p>
          </div>

          {/* New Stock Preview */}
          <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Nuevo stock</p>
            <p className="text-4xl font-bold text-primary">{product.quantity + quantityToAdd}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {quantityToAdd > 0 ? `Agregando ${quantityToAdd}` : quantityToAdd < 0 ? `Quitando ${Math.abs(quantityToAdd)}` : "Sin cambios"}
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={quantityToAdd === 0}>
              <FiPackage className="h-4 w-4" />
              Guardar cambios
            </Button>
          </div>
        </form>
      </motion.div>
      <AlertDialog />
    </motion.div>
  )
}
