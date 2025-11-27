"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FiX, FiSave } from "react-icons/fi"

interface ProductModalProps {
  product: Product | null
  onClose: () => void
  onSave: (product: Product) => void
}

export function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>(() => {
    if (product) {
      return {
        name: product.name,
        description: product.description,
        brand: product.brand,
        cost: product.cost,
        price: product.price,
        quantity: product.quantity,
        beneficiary: product.beneficiary,
        barcode: product.barcode || "",
      }
    }
    return {
      name: "",
      description: "",
      brand: "",
      cost: 0,
      price: 0,
      quantity: 0,
      beneficiary: "shared",
      barcode: "",
    }
  })

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        brand: product.brand,
        cost: product.cost,
        price: product.price,
        quantity: product.quantity,
        beneficiary: product.beneficiary,
        barcode: product.barcode || "",
      })
    } else {
      setFormData({
        name: "",
        description: "",
        brand: "",
        cost: 0,
        price: 0,
        quantity: 0,
        beneficiary: "shared",
        barcode: "",
      })
    }
  }, [product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: product?.id || "",
      name: formData.name || "",
      description: formData.description || "",
      brand: formData.brand || "",
      cost: Number(formData.cost) || 0,
      price: Number(formData.price) || 0,
      quantity: Number(formData.quantity) || 0,
      beneficiary: formData.beneficiary as "juan" | "lucas" | "shared",
      barcode: formData.barcode,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  const profit = (Number(formData.price) || 0) - (Number(formData.cost) || 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-xl p-6 w-full max-w-lg shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{product ? "Editar Producto" : "Nuevo Producto"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <FiX className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Arroz"
                required
              />
            </div>

            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Gallo"
              />
            </div>

            <div>
              <Label htmlFor="barcode">Código de barras</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="7790001234567"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Arroz blanco 1kg"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="cost">Costo ($)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number.parseFloat(e.target.value) || 0 })}
                placeholder="800"
              />
            </div>

            <div>
              <Label htmlFor="price">Precio de venta ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                placeholder="1200"
              />
            </div>

            <div>
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) || 0 })}
                placeholder="50"
              />
            </div>

            <div>
              <Label htmlFor="beneficiary">Beneficiario</Label>
              <Select
                value={formData.beneficiary}
                onValueChange={(v) => setFormData({ ...formData, beneficiary: v as "juan" | "lucas" | "shared" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="juan">Juan</SelectItem>
                  <SelectItem value="lucas">Lucas</SelectItem>
                  <SelectItem value="shared">Compartido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Profit Preview */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ganancia por unidad:</span>
              <span className={`text-xl font-bold ${profit >= 0 ? "text-primary" : "text-destructive"}`}>
                ${profit.toLocaleString("es-AR")}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <FiSave className="h-4 w-4" />
              {product ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
