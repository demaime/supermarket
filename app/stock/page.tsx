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
  const router = useRouter()

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
      result = result.filter((p) => p.quantity < 10)
    } else if (filter === "juan") {
      result = result.filter((p) => p.beneficiary === "juan")
    } else if (filter === "lucas") {
      result = result.filter((p) => p.beneficiary === "lucas")
    }

    setFilteredProducts(result)
  }, [products, search, filter])

  const loadProducts = async () => {
    const products = await store.loadProductsFromDb()
    setProducts(products)
  }

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      store.deleteProduct(product.id)
      loadProducts()
      toast.success("Producto eliminado")
    }
  }

  const handleSaveProduct = (product: Product) => {
    if (user) {
      store.saveProduct(product, user.id, user.name)
      loadProducts()
      setIsModalOpen(false)
      toast.success(selectedProduct ? "Producto actualizado" : "Producto agregado")
    }
  }

  const handleQuickStock = (product: Product) => {
    setQuickStockProduct(product)
  }

  const handleSaveQuickStock = (product: Product, quantityChange: number) => {
    if (user) {
      store.saveProduct(product, user.id, user.name)
      loadProducts()
      setQuickStockProduct(null)
      toast.success(`Stock ${quantityChange > 0 ? "agregado" : "reducido"}: ${Math.abs(quantityChange)} unidades`)
    }
  }

  const lowStockCount = products.filter((p) => p.quantity < 10).length

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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FiPackage className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={lowStockCount > 0 ? "border-destructive/50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? "bg-destructive/10" : "bg-muted"}`}
                >
                  <FiAlertTriangle
                    className={`h-5 w-5 ${lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"}`}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock bajo</p>
                  <p className="text-xl font-bold">{lowStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-2/20 flex items-center justify-center">
                  <span className="text-chart-2 font-bold">J</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Juan</p>
                  <p className="text-xl font-bold">{products.filter((p) => p.beneficiary === "juan").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-4/20 flex items-center justify-center">
                  <span className="text-chart-4 font-bold">L</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucas</p>
                  <p className="text-xl font-bold">{products.filter((p) => p.beneficiary === "lucas").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                          {product.quantity < 10 && (
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
                          <p className={`text-3xl font-bold ${product.quantity < 10 ? "text-destructive" : ""}`}>
                            {product.quantity}
                          </p>
                          <p className="text-xs text-muted-foreground">unidades</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary"
                            onClick={() => handleQuickStock(product)}
                            title="Agregar/Quitar Stock"
                          >
                            <FiPackage className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)}>
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
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
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ProductModal product={selectedProduct} onClose={() => setIsModalOpen(false)} onSave={handleSaveProduct} />
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
    </div>
  )
}
