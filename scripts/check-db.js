const mongoose = require("mongoose")
require("dotenv").config({ path: ".env.local" })

const MONGO_URL = process.env.MONGO_URL

if (!MONGO_URL) {
  console.error("❌ MONGO_URL no está definida en .env.local")
  process.exit(1)
}

// Schemas
const productSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  brand: String,
  cost: Number,
  price: Number,
  quantity: Number,
  beneficiary: String,
  barcode: String,
  createdAt: String,
  updatedAt: String,
})

const saleSchema = new mongoose.Schema({
  id: String,
  items: Array,
  total: Number,
  userId: String,
  userName: String,
  synced: Boolean,
  createdAt: String,
})

const stockLogSchema = new mongoose.Schema({
  id: String,
  productId: String,
  productName: String,
  action: String,
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  userId: String,
  userName: String,
  createdAt: String,
})

const Product = mongoose.models.Product || mongoose.model("Product", productSchema)
const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema)
const StockLog = mongoose.models.StockLog || mongoose.model("StockLog", stockLogSchema)

async function checkDatabase() {
  try {
    console.log("🔌 Conectando a MongoDB...")
    await mongoose.connect(MONGO_URL, {
      bufferCommands: false,
    })
    console.log("✅ Conectado a MongoDB\n")

    // Check products
    const products = await Product.find({})
    console.log(`📦 Productos en DB: ${products.length}`)
    if (products.length > 0) {
      console.log("   Ejemplos:")
      products.slice(0, 3).forEach(p => {
        console.log(`   - ${p.name}: ${p.quantity} unidades (Precio: $${p.price})`)
      })
    }

    // Check sales
    const sales = await Sale.find({}).sort({ createdAt: -1 }).limit(5)
    console.log(`\n💰 Ventas registradas: ${sales.length}`)
    if (sales.length > 0) {
      console.log("   Últimas ventas:")
      sales.forEach(s => {
        console.log(`   - ${s.userName}: $${s.total} (${s.items.length} items) - ${new Date(s.createdAt).toLocaleString('es-AR')}`)
      })
    }

    // Check stock logs
    const logs = await StockLog.find({}).sort({ createdAt: -1 }).limit(10)
    console.log(`\n📋 Registros de stock: ${logs.length}`)
    if (logs.length > 0) {
      console.log("   Últimos cambios:")
      logs.forEach(log => {
        console.log(`   - ${log.action}: ${log.productName} (${log.previousValue} → ${log.newValue}) por ${log.userName}`)
      })
    }

    console.log("\n✨ Verificación completada!")
    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

checkDatabase()
