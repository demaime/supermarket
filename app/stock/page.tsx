"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { store } from "@/lib/store"
import type { Product, User } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FiArrowLeft, FiPlus, FiSearch, FiEdit2, FiTrash2, FiPackage, FiAlertTriangle, FiFilter } from "react-icons/fi"
import { ProductModal } from "@/components/product-modal"
import { QuickStockModal } from "@/components/quick-stock-modal"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"

import { Loader } from "@/components/ui/loader"

export default function StockPage() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "low" | "juan" | "lucas">("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog()

  useEffect(() => {
    setMounted(true)
    const currentUser = store.getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    setUser(currentUser)
    loadProducts()
  }, [router])

  useEffect(() => {
    let result = products

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.brand.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower),
      )
    }

    // Apply filter
    if (filter === "low") {
      result = result.filter((p) => p.quantity <= (p.lowStockThreshold || 10))
    } else if (filter === "juan") {
      result = result.filter((p) => p.beneficiary === "juan")
    } else if (filter === "lucas") {
      result = result.filter((p) => p.beneficiary === "lucas")
    }

    setFilteredProducts(result)
  }, [products, search, filter])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const products = await store.loadProductsFromDb()
      setProducts(products)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = await confirm({
      title: "Eliminar Producto",
      description: `¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      type: "danger",
    })

    if (confirmed) {
      store.deleteProduct(product.id)
      loadProducts()
      toast.success("Producto eliminado")
    }
  }

  const handleSaveProduct = async (product: Product) => {
    if (user) {
      setIsSaving(true)
      try {
        await store.saveProduct(product, user.id, user.name)
        await loadProducts()
        setIsModalOpen(false)
        toast.success(selectedProduct ? "Producto actualizado" : "Producto agregado")
      } catch (error) {
        toast.error("Error al guardar el producto")
        console.error("Error saving product:", error)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleQuickStock = (product: Product) => {
    setQuickStockProduct(product)
  }

  const handleSaveQuickStock = async (product: Product, quantityChange: number) => {
    if (user) {
      try {
        await store.saveProduct(product, user.id, user.name)
        await loadProducts()
        setQuickStockProduct(null)
        toast.success(`Stock ${quantityChange > 0 ? "agregado" : "reducido"}: ${Math.abs(quantityChange)} unidades`)
      } catch (error) {
        toast.error("Error al actualizar el stock")
        console.error("Error updating stock:", error)
      }
    }
  }

  const lowStockCount = products.filter((p) => p.quantity <= (p.lowStockThreshold || 10)).length

  if (!mounted || !user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-xl">Gestión de Stock</h1>
              <p className="text-sm text-muted-foreground">{products.length} productos</p>
            </div>
          </div>
          <Button onClick={handleAddProduct} className="gap-2">
            <FiPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-md hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <div className="relative p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/80 via-primary to-primary/90 flex items-center justify-center shadow-md shadow-primary/20">
                  <FiPackage className="h-5 w-5 text-white drop-shadow-sm" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                  <p className="text-2xl font-bold text-foreground">{products.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Bajo */}
          <div className={`relative overflow-hidden rounded-xl border shadow-md hover:shadow-lg transition-shadow ${lowStockCount > 0 ? "bg-gradient-to-br from-destructive/10 via-destructive/5 to-background border-destructive/30" : "bg-gradient-to-br from-muted/50 to-background border-border"}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            <div className="relative p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${lowStockCount > 0 ? "bg-gradient-to-br from-destructive/80 to-destructive shadow-destructive/20" : "bg-muted"}`}>
                  <FiAlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? "text-white drop-shadow-sm" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stock bajo</p>
                  <p className="text-2xl font-bold text-foreground">{lowStockCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Juan */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-md hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <div className="relative p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/80 via-primary to-primary/90 flex items-center justify-center shadow-md shadow-primary/20">
                  <span className="text-white font-bold drop-shadow-sm">J</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Juan</p>
                  <p className="text-2xl font-bold text-foreground">{products.filter((p) => p.beneficiary === "juan").length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lucas */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-md hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <div className="relative p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/80 via-primary to-primary/90 flex items-center justify-center shadow-md shadow-primary/20">
                  <span className="text-white font-bold drop-shadow-sm">L</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lucas</p>
                  <p className="text-2xl font-bold text-foreground">{products.filter((p) => p.beneficiary === "lucas").length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <FiFilter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="low">Stock bajo</SelectItem>
              <SelectItem value="juan">Beneficio Juan</SelectItem>
              <SelectItem value="lucas">Beneficio Lucas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {product.brand}
                          </Badge>
                          {product.quantity <= (product.lowStockThreshold || 10) && (
                            <Badge variant="destructive" className="text-xs">
                              Stock bajo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span>
                            <span className="text-muted-foreground">Costo:</span>{" "}
                            <span className="font-medium">${product.cost.toLocaleString("es-AR")}</span>
                          </span>
                          <span>
                            <span className="text-muted-foreground">Precio:</span>{" "}
                            <span className="font-medium text-primary">${product.price.toLocaleString("es-AR")}</span>
                          </span>
                          <span>
                            <span className="text-muted-foreground">Ganancia:</span>{" "}
                            <span className="font-medium text-green-600">
                              ${(product.price - product.cost).toLocaleString("es-AR")}
                            </span>
                          </span>
                          <span>
                            <span className="text-muted-foreground">Beneficio:</span>{" "}
                            <Badge variant="secondary" className="ml-1 capitalize">
                              {product.beneficiary === "shared" ? "Compartido" : product.beneficiary}
                            </Badge>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p
                            className={`text-3xl font-bold ${product.quantity <= (product.lowStockThreshold || 10) ? "text-destructive" : ""}`}
                          >
                            {product.quantity}
                          </p>
                          <p className="text-xs text-muted-foreground">unidades</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-popover dark:bg-secondary hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-foreground text-primary border-primary/30 shadow-sm transition-all"
                            onClick={() => handleQuickStock(product)}
                            title="Agregar/Quitar Stock"
                          >
                            <FiPackage className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-popover dark:bg-secondary hover:bg-foreground dark:hover:bg-foreground hover:text-background dark:hover:text-background border-border shadow-sm transition-all"
                            onClick={() => handleEditProduct(product)}
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-popover dark:bg-secondary text-destructive hover:bg-destructive dark:hover:bg-destructive hover:text-white dark:hover:text-foreground border-destructive/30 shadow-sm transition-all"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FiPackage className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
          </>
        )}
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveProduct}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>

      {/* Quick Stock Modal */}
      <AnimatePresence>
        {quickStockProduct && (
          <QuickStockModal
            product={quickStockProduct}
            onClose={() => setQuickStockProduct(null)}
            onSave={handleSaveQuickStock}
          />
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
