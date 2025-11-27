export interface User {
  id: string
  name: string
  avatar: string
  password: string
}

export interface Product {
  id: string
  name: string
  description: string
  brand: string
  cost: number
  price: number
  quantity: number
  beneficiary: "juan" | "lucas" | "shared"
  barcode?: string
  createdAt: string
  updatedAt: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  total: number
  userId: string
  userName: string
  createdAt: string
  synced: boolean
}

export interface StockLog {
  id: string
  productId: string
  productName: string
  action: "add" | "remove" | "update_price" | "update_cost" | "create"
  previousValue: number | string
  newValue: number | string
  userId: string
  userName: string
  createdAt: string
}

export interface Shift {
  id: string
  userId: string
  userName: string
  startTime: string
  endTime?: string
  sales: Sale[]
  totalSales: number
  totalProfit: number
  profitByBeneficiary: {
    juan: number
    lucas: number
    shared: number
  }
  status: "active" | "closed"
}
