import type { Product, Sale, StockLog, Shift, User } from "./types"

const USERS: User[] = [
  { id: "1", name: "Lucas", avatar: "/bearded-man-avatar.png", password: "1234" },
  { id: "2", name: "Yanel", avatar: "/woman-with-long-hair-avatar.jpg", password: "1234" },
  { id: "3", name: "Juan", avatar: "/young-man-avatar.png", password: "1234" },
]

// Initial sample products
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Arroz",
    description: "Arroz blanco 1kg",
    brand: "Gallo",
    cost: 800,
    price: 1200,
    quantity: 50,
    beneficiary: "juan",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Fideos",
    description: "Fideos spaghetti 500g",
    brand: "Matarazzo",
    cost: 500,
    price: 750,
    quantity: 30,
    beneficiary: "lucas",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Aceite",
    description: "Aceite de girasol 1.5L",
    brand: "Cocinero",
    cost: 1500,
    price: 2200,
    quantity: 20,
    beneficiary: "juan",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Jabón",
    description: "Jabón de tocador",
    brand: "Lux",
    cost: 200,
    price: 350,
    quantity: 40,
    beneficiary: "lucas",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Alfajor",
    description: "Alfajor triple",
    brand: "Havanna",
    cost: 300,
    price: 500,
    quantity: 60,
    beneficiary: "shared",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Leche",
    description: "Leche entera 1L",
    brand: "La Serenísima",
    cost: 600,
    price: 900,
    quantity: 25,
    beneficiary: "juan",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Pan",
    description: "Pan lactal",
    brand: "Bimbo",
    cost: 400,
    price: 650,
    quantity: 15,
    beneficiary: "lucas",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Galletitas",
    description: "Galletitas dulces",
    brand: "Terrabusi",
    cost: 350,
    price: 550,
    quantity: 35,
    beneficiary: "shared",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

class Store {
  private getItem<T>(key: string, defaultValue: T): T {
    if (!isBrowser()) return defaultValue
    try {
      const item = localStorage.getItem(key)
      if (!item) return defaultValue
      return JSON.parse(item) as T
    } catch {
      return defaultValue
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!isBrowser()) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.error("Failed to save to localStorage")
    }
  }

  // Sync
  async syncWithDb() {
    if (!isBrowser() || !navigator.onLine) return

    try {
      // Primero intentamos sincronizar ventas pendientes hacia la DB
      await this.syncUnsyncedSales()

      // Products
      const productsRes = await fetch("/api/products")
      if (productsRes.ok) {
        const products = await productsRes.json()
        this.setItem("products", products)
      }

      // Sales
      const salesRes = await fetch("/api/ventas?limit=100")
      if (salesRes.ok) {
        const sales = await salesRes.json()
        this.setItem("sales", sales)
      }

      // Shifts
      const shiftsRes = await fetch("/api/turnos")
      if (shiftsRes.ok) {
        const shifts = await shiftsRes.json()
        this.setItem("shifts", shifts)
      }

      // Logs
      const logsRes = await fetch("/api/logs-stock")
      if (logsRes.ok) {
        const logs = await logsRes.json()
        this.setItem("stockLogs", logs)
      }
    } catch (error) {
      console.error("Sync failed:", error)
    }
  }

  private async _syncItem(endpoint: string, data: any, method = "POST") {
    if (!isBrowser() || !navigator.onLine) return false
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Users
  getUsers(): User[] {
    return USERS
  }

  validateUser(userId: string, password: string): User | null {
    const user = USERS.find((u) => u.id === userId && u.password === password)
    return user || null
  }

  // Session
  getCurrentUser(): User | null {
    const userId = this.getItem<string | null>("currentUserId", null)
    if (!userId) return null
    return USERS.find((u) => u.id === userId) || null
  }

  setCurrentUser(userId: string | null): void {
    this.setItem("currentUserId", userId)
  }

  // Products
  getProducts(): Product[] {
    return this.getItem<Product[]>("products", [])
  }

  async loadProductsFromDb(): Promise<Product[]> {
    if (!isBrowser() || !navigator.onLine) {
      return this.getProducts()
    }

    try {
      const res = await fetch("/api/products")
      if (res.ok) {
        const products = await res.json()
        // SIEMPRE actualizar localStorage, incluso si está vacío
        this.setItem("products", products)
        return products
      }
    } catch (error) {
      console.error("Failed to load products from DB:", error)
      // Si falla el fetch, usar cache como fallback
      return this.getProducts()
    }

    // Si response no es ok, usar cache
    return this.getProducts()
  }

  getProduct(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id)
  }

  async loadSalesFromDb(): Promise<Sale[]> {
    if (!isBrowser() || !navigator.onLine) {
      return this.getSales()
    }

    try {
      const res = await fetch("/api/ventas")
      if (res.ok) {
        const sales = await res.json()
        this.setItem("sales", sales)
        return sales
      }
    } catch (error) {
      console.error("Failed to load sales from DB:", error)
    }

    return this.getSales()
  }

  async loadStockLogsFromDb(): Promise<StockLog[]> {
    if (!isBrowser() || !navigator.onLine) {
      return this.getStockLogs()
    }

    try {
      const res = await fetch("/api/logs-stock")
      if (res.ok) {
        const logs = await res.json()
        this.setItem("stockLogs", logs)
        return logs
      }
    } catch (error) {
      console.error("Failed to load stock logs from DB:", error)
    }

    return this.getStockLogs()
  }

  async saveProduct(product: Product, userId: string, userName: string): Promise<boolean> {
    console.log('🟡 Store.saveProduct recibió:', product.name, 'lowStockThreshold:', product.lowStockThreshold)
    
    const products = this.getProducts()
    const existingIndex = products.findIndex((p) => p.id === product.id)

    if (existingIndex >= 0) {
      products[existingIndex] = { ...product, updatedAt: new Date().toISOString() }
    } else {
      product.id = crypto.randomUUID()
      product.createdAt = new Date().toISOString()
      product.updatedAt = new Date().toISOString()
      products.push(product)
    }

    this.setItem("products", products)
    
    // Enviar al backend con userId y userName para que el backend cree los logs
    const productWithUser = { ...product, userId, userName }
    console.log('🟢 Store enviando al backend:', productWithUser.name, 'lowStockThreshold:', productWithUser.lowStockThreshold)
    return await this._syncItem("/api/products", productWithUser)
  }

  deleteProduct(id: string): void {
    const products = this.getProducts()
    const filtered = products.filter((p) => p.id !== id)
    this.setItem("products", filtered)

    // Sincronizar eliminación con backend
    if (isBrowser() && navigator.onLine) {
      fetch(`/api/products?id=${id}`, { method: "DELETE" }).catch((err) =>
        console.error("Failed to delete product from DB:", err),
      )
    }
  }

  // Stock Logs
  getStockLogs(): StockLog[] {
    return this.getItem<StockLog[]>("stockLogs", [])
  }

  // NOTA: addStockLog fue eliminado.
  // Los logs de auditoría SOLO deben ser creados por el backend (/api/products)
  // para evitar duplicaciones.

  // Sales
  getSales(): Sale[] {
    return this.getItem<Sale[]>("sales", [])
  }

  /**
   * Sincroniza todas las ventas que estén marcadas como no sincronizadas
   * (`synced === false`) hacia la API. La deduplicación final la hace
   * el backend usando el `id` de la venta.
   */
  async syncUnsyncedSales(): Promise<void> {
    if (!isBrowser() || !navigator.onLine) return

    const unsynced = this.getUnsyncedSales()
    if (unsynced.length === 0) return

    const successfullySynced: string[] = []

    for (const sale of unsynced) {
      try {
        const ok = await this._syncItem("/api/ventas", sale)
        if (ok) {
          successfullySynced.push(sale.id)
        }
      } catch (error) {
        console.error("Error syncing sale", sale.id, error)
      }
    }

    if (successfullySynced.length > 0) {
      this.markSalesAsSynced(successfullySynced)
    }
  }

  addSale(sale: Sale): void {
    const sales = this.getSales()
    sales.unshift(sale)
    this.setItem("sales", sales)
    
    // En línea, intentamos sincronizar inmediatamente contra la API,
    // pero el stock real solo se descuenta en el backend (MongoDB).
    this._syncItem("/api/ventas", sale).then((synced) => {
      if (synced) {
        this.markSalesAsSynced([sale.id])
      }
    })
  }

  getUnsyncedSales(): Sale[] {
    return this.getSales().filter((s) => !s.synced)
  }

  markSalesAsSynced(saleIds: string[]): void {
    const sales = this.getSales()
    saleIds.forEach((id) => {
      const sale = sales.find((s) => s.id === id)
      if (sale) sale.synced = true
    })
    this.setItem("sales", sales)
  }

  // Shifts
  getShifts(): Shift[] {
    return this.getItem<Shift[]>("shifts", [])
  }

  getActiveShift(): Shift | null {
    return this.getShifts().find((s) => s.status === "active") || null
  }

  startShift(userId: string, userName: string): Shift {
    // Close any active shift first
    const activeShift = this.getActiveShift()
    if (activeShift) {
      this.closeShift(activeShift.id)
    }

    const shift: Shift = {
      id: crypto.randomUUID(),
      userId,
      userName,
      startTime: new Date().toISOString(),
      sales: [],
      totalSales: 0,
      totalProfit: 0,
      profitByBeneficiary: { juan: 0, lucas: 0, shared: 0 },
      status: "active",
    }

    const shifts = this.getShifts()
    shifts.unshift(shift)
    this.setItem("shifts", shifts)
    
    this._syncItem("/api/turnos", shift)
    
    return shift
  }

  addSaleToShift(sale: Sale): void {
    const shifts = this.getShifts()
    const activeShiftIndex = shifts.findIndex((s) => s.status === "active")

    if (activeShiftIndex >= 0) {
      const shift = shifts[activeShiftIndex]
      shift.sales.push(sale)
      shift.totalSales += sale.total

      // Calculate profit by beneficiary
      const products = this.getProducts()
      sale.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId)
        if (product) {
          const profit = (product.price - product.cost) * item.quantity
          shift.profitByBeneficiary[product.beneficiary] += profit
          shift.totalProfit += profit
        }
      })

      this.setItem("shifts", shifts)
      // We don't sync every sale addition to shift to avoid too many requests, 
      // we rely on closeShift or periodic sync, but for now let's sync to be safe
      this._syncItem("/api/turnos", shift)
    }
  }

  closeShift(shiftId: string): Shift | null {
    const shifts = this.getShifts()
    const shiftIndex = shifts.findIndex((s) => s.id === shiftId)

    if (shiftIndex >= 0) {
      shifts[shiftIndex].status = "closed"
      shifts[shiftIndex].endTime = new Date().toISOString()
      this.setItem("shifts", shifts)
      
      this._syncItem("/api/turnos", shifts[shiftIndex])
      
      return shifts[shiftIndex]
    }
    return null
  }
}

export const store = new Store()
