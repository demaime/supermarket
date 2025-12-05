"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { store } from "@/lib/store"
import type { Product, SaleItem, User, Sale } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  FiArrowLeft,
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiShoppingCart,
  FiDollarSign,
  FiX,
  FiCheck,
} from "react-icons/fi"
import { toast } from "sonner"
import { Loader } from "@/components/ui/loader"

export default function VentasPage() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<SaleItem[]>([])
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const currentUser = store.getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    setUser(currentUser)
    
    // Load products from DB if not in localStorage
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        const products = await store.loadProductsFromDb()
        setProducts(products)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProducts()
  }, [router])

  // Search filtering
  useEffect(() => {
    if (search.length > 0) {
      const searchLower = search.toLowerCase()
      const results = products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.brand.toLowerCase().includes(searchLower) ||
            p.barcode?.includes(search),
        )
        .slice(0, 8)
      setSearchResults(results)
      setSelectedIndex(0)
    } else {
      setSearchResults([])
    }
  }, [search, products])

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // F3 - Open search
      if (e.key === "F3") {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      // F4 - Confirm sale (show confirmation modal)
      if (e.key === "F4" && cart.length > 0) {
        e.preventDefault()
        setShowConfirmModal(true)
      }
      // F8 - Cancel sale (show confirmation modal)
      if (e.key === "F8" && cart.length > 0) {
        e.preventDefault()
        setShowCancelModal(true)
      }
      // Escape - Close search or modals
      if (e.key === "Escape") {
        setShowSearch(false)
        setShowConfirmModal(false)
        setShowCancelModal(false)
        setSearch("")
      }
      // Enter - Confirm action in modals
      if (e.key === "Enter") {
        if (showConfirmModal) {
          e.preventDefault()
          handleConfirmSale()
          // setShowConfirmModal ya se llama dentro de handleConfirmSale
        } else if (showCancelModal) {
          e.preventDefault()
          handleCancelSale()
          setShowCancelModal(false)
        }
      }
      // Arrow navigation in search
      if (showSearch && searchResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1))
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
        }
        if (e.key === "Enter" && searchResults[selectedIndex]) {
          e.preventDefault()
          addToCart(searchResults[selectedIndex])
        }
      }
    },
    [showSearch, searchResults, selectedIndex, cart, showConfirmModal, showCancelModal],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error("No hay stock disponible")
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        const newQty = existing.quantity + 1
        if (newQty > product.quantity) {
          toast.error("Stock insuficiente")
          return prev
        }
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice } : item,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      ]
    })

    setShowSearch(false)
    setSearch("")
    toast.success(`${product.name} agregado`)
  }

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta
          if (newQty <= 0) return item
          if (newQty > product.quantity) {
            toast.error("Stock insuficiente")
            return item
          }
          return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice }
        }
        return item
      }),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0)

  const handleConfirmSale = () => {
    if (!user || cart.length === 0) return

    // Prevenir doble ejecución (Enter + Click)
    setShowConfirmModal(false)

    const sale: Sale = {
      id: crypto.randomUUID(),
      origin: navigator.onLine ? "online" : "offline",
      items: cart,
      total,
      userId: user.id,
      userName: user.name,
      createdAt: new Date().toISOString(),
      synced: false,
    }

    store.addSale(sale)
    store.addSaleToShift(sale)
    // El stock visible se actualizará cuando se sincronice con la DB
    // y se vuelvan a cargar los productos.
    // No tocamos el stock local para evitar doble descuento.
    setCart([])
    toast.success(`Venta confirmada: $${total.toLocaleString("es-AR")}`)
  }

  const handleCancelSale = () => {
    setCart([])
    toast.info("Venta cancelada")
  }

  if (!mounted || !user) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-xl">Punto de Venta</h1>
              <p className="text-sm text-muted-foreground">Vendedor: {user.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <span className="text-xs mr-1">F3</span> Buscar
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <span className="text-xs mr-1">F4</span> Confirmar
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <span className="text-xs mr-1">F8</span> Cancelar
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-1 lg:col-span-3">
            <Loader />
          </div>
        ) : (
          <>
            {/* Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14 text-lg bg-transparent"
            onClick={() => {
              setShowSearch(true)
              setTimeout(() => searchInputRef.current?.focus(), 100)
            }}
          >
            <FiSearch className="h-5 w-5" />
            <span>Buscar producto...</span>
            <Badge variant="secondary" className="ml-auto">
              F3
            </Badge>
          </Button>

          {/* Cart Items */}
          <Card className="flex-1">
            <CardContent className="p-0">
              {cart.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <FiShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Carrito vacío</p>
                  <p className="text-sm mt-2">Presioná F3 para buscar productos</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map((item, index) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 flex items-center gap-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{item.productName}</h3>
                        <p className="text-sm text-muted-foreground">${item.unitPrice.toLocaleString("es-AR")} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <FiMinus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <FiPlus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-bold">${item.subtotal.toLocaleString("es-AR")}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/80 via-primary to-primary/90 shadow-2xl shadow-primary/30">
            {/* Shine effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
            <div className="relative p-6 text-primary-foreground">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FiDollarSign className="h-6 w-6" />
                </div>
                <span className="text-lg font-medium opacity-90">Total a cobrar</span>
              </div>
              <p className="text-5xl font-bold tracking-tight drop-shadow-lg">${total.toLocaleString("es-AR")}</p>
              <p className="text-sm opacity-75 mt-2">{cart.length} item(s)</p>
            </div>
          </div>

          <Button className="w-full h-14 text-lg gap-2" disabled={cart.length === 0} onClick={() => setShowConfirmModal(true)}>
            <FiCheck className="h-5 w-5" />
            Confirmar Venta
            <Badge variant="secondary" className="ml-2">
              F4
            </Badge>
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 gap-2 bg-transparent"
            disabled={cart.length === 0}
            onClick={() => setShowCancelModal(true)}
          >
            <FiX className="h-5 w-5" />
            Cancelar
            <Badge variant="secondary" className="ml-2">
              F8
            </Badge>
          </Button>

          {/* Quick Products */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 text-sm text-muted-foreground">Productos frecuentes</h3>
              <div className="grid grid-cols-2 gap-2">
                {products.slice(0, 6).map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 justify-start bg-transparent"
                    onClick={() => addToCart(product)}
                    disabled={product.quantity <= 0}
                  >
                    <div className="text-left truncate">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">${product.price.toLocaleString("es-AR")}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
          </>
        )}
      </main>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 p-4 z-50"
            onClick={() => {
              setShowSearch(false)
              setSearch("")
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar por nombre, marca o código..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 text-lg"
                    autoFocus
                  />
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-80 overflow-y-auto">
                  {searchResults.map((product, index) => (
                    <div
                      key={product.id}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        index === selectedIndex ? "bg-accent" : "hover:bg-muted"
                      } ${product.quantity <= 0 ? "opacity-50" : ""}`}
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{product.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {product.brand}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Stock: {product.quantity} | ${product.price.toLocaleString("es-AR")}
                        </p>
                      </div>
                      <Button size="sm" disabled={product.quantity <= 0}>
                        <FiPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {search && searchResults.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No se encontraron productos</p>
                </div>
              )}

              <div className="p-3 bg-muted/50 text-xs text-muted-foreground flex gap-4">
                <span>↑↓ Navegar</span>
                <span>Enter Agregar</span>
                <span>Esc Cerrar</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Sale Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl w-full max-w-md shadow-2xl overflow-hidden border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FiCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Confirmar Venta</h3>
                    <p className="text-sm text-muted-foreground">
                      Total: ${total.toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  ¿Confirmar la venta de {cart.length} producto(s)?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancelar
                    <Badge variant="secondary" className="ml-2">Esc</Badge>
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmSale}
                  >
                    Confirmar
                    <Badge variant="secondary" className="ml-2">Enter</Badge>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Sale Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl w-full max-w-md shadow-2xl overflow-hidden border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <FiX className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Cancelar Venta</h3>
                    <p className="text-sm text-muted-foreground">
                      {cart.length} producto(s) en el carrito
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  ¿Estás seguro de que deseas cancelar esta venta?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCancelModal(false)}
                  >
                    No
                    <Badge variant="secondary" className="ml-2">Esc</Badge>
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleCancelSale()
                      setShowCancelModal(false)
                    }}
                  >
                    Sí, cancelar
                    <Badge variant="secondary" className="ml-2">Enter</Badge>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
