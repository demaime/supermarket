import mongoose, { Schema, model, models } from "mongoose"

// Product Schema
const ProductSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    brand: { type: String, required: true },
    cost: { type: Number, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    lowStockThreshold: { type: Number, default: 10 }, // Umbral personalizado para alerta de stock bajo
    beneficiary: { type: String, enum: ["juan", "lucas", "shared"], required: true },
    barcode: { type: String },
  },
  { timestamps: true },
)

// Sale Schema
const SaleItemSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
})

const SaleSchema = new Schema(
  {
    // Este id viene del frontend (UUID) y lo usamos como clave única
    // para poder deduplicar ventas (especialmente en modo offline).
    id: { type: String, required: true, unique: true },
    origin: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
    items: [SaleItemSchema],
    total: { type: Number, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    synced: { type: Boolean, default: true },
  },
  { timestamps: true },
)

// Shift Schema
const ShiftSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    sales: [SaleSchema], // Embedded sales for shift history
    totalSales: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    profitByBeneficiary: {
      juan: { type: Number, default: 0 },
      lucas: { type: Number, default: 0 },
      shared: { type: Number, default: 0 },
    },
    status: { type: String, enum: ["active", "closed"], default: "active" },
  },
  { timestamps: true },
)

// Stock Log Schema
const StockLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    action: {
      type: String,
      enum: ["add", "remove", "update_price", "update_cost", "create"],
      required: true,
    },
    previousValue: { type: Schema.Types.Mixed, required: true },
    newValue: { type: Schema.Types.Mixed, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
  },
  { timestamps: true },
)

export const Product = models.Product || model("Product", ProductSchema)
export const Sale = models.Sale || model("Sale", SaleSchema)
export const Shift = models.Shift || model("Shift", ShiftSchema)
export const StockLog = models.StockLog || model("StockLog", StockLogSchema)
