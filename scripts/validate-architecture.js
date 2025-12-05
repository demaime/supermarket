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
  quantity: Number,
})

const saleSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  total: Number,
  userId: String,
  userName: String,
  createdAt: String,
})

const stockLogSchema = new mongoose.Schema({
  id: { type: String, unique: true },
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

async function validateArchitecture() {
  try {
    console.log("🔌 Conectando a MongoDB...")
    await mongoose.connect(MONGO_URL, {
      bufferCommands: false,
    })
    console.log("✅ Conectado a MongoDB\n")

    let errorsFound = 0

    // 1. Verificar que no hay logs de ventas en auditoría
    console.log("📋 Verificando logs de auditoría...")
    const invalidLogs = await StockLog.find({ action: "remove" })
    if (invalidLogs.length > 0) {
      console.error(`  ❌ Encontrados ${invalidLogs.length} logs de ventas en auditoría`)
      console.error(`     Los logs con action: "remove" NO deben estar en auditoría`)
      errorsFound++
    } else {
      console.log("  ✅ No hay logs de ventas en auditoría")
    }

    // 2. Verificar que no hay ventas duplicadas
    console.log("\n💰 Verificando duplicación de ventas...")
    const duplicateSales = await Sale.aggregate([
      {
        $group: {
          _id: "$id",
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ])
    if (duplicateSales.length > 0) {
      console.error(`  ❌ Encontradas ${duplicateSales.length} ventas duplicadas por id`)
      errorsFound++
    } else {
      console.log("  ✅ No hay ventas duplicadas")
    }

    // 3. Verificar que no hay logs duplicados
    console.log("\n📝 Verificando duplicación de logs...")
    const duplicateLogs = await StockLog.aggregate([
      {
        $group: {
          _id: {
            productId: "$productId",
            action: "$action",
            previousValue: "$previousValue",
            newValue: "$newValue",
            createdAt: "$createdAt",
          },
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ])
    if (duplicateLogs.length > 0) {
      console.error(`  ❌ Encontrados ${duplicateLogs.length} logs duplicados`)
      console.error(`     Ejecutar: npm run clean-duplicates`)
      errorsFound++
    } else {
      console.log("  ✅ No hay logs duplicados")
    }

    // 4. Verificar que solo hay acciones válidas en auditoría
    console.log("\n🔍 Verificando acciones en auditoría...")
    const validActions = ["add", "update_price", "update_cost", "create"]
    const invalidActions = await StockLog.find({
      action: { $nin: validActions },
    })
    if (invalidActions.length > 0) {
      console.error(`  ❌ Encontradas ${invalidActions.length} acciones inválidas:`)
      const actionTypes = [...new Set(invalidActions.map((l) => l.action))]
      console.error(`     Acciones inválidas: ${actionTypes.join(", ")}`)
      console.error(`     Acciones válidas: ${validActions.join(", ")}`)
      errorsFound++
    } else {
      console.log("  ✅ Todas las acciones en auditoría son válidas")
    }

    // 5. Verificar índices únicos
    console.log("\n🔑 Verificando índices únicos...")
    const saleIndexes = await Sale.collection.indexes()
    const hasUniqueId = saleIndexes.some(
      (index) => index.key.id === 1 && index.unique === true
    )
    if (!hasUniqueId) {
      console.warn("  ⚠️  La colección Sales no tiene índice único en 'id'")
      console.warn("     Ejecutar: npm run create-indexes")
      errorsFound++
    } else {
      console.log("  ✅ Índice único en Sales.id configurado")
    }

    // Resumen
    console.log("\n" + "=".repeat(50))
    if (errorsFound === 0) {
      console.log("✅ Arquitectura validada correctamente")
      console.log("   No se encontraron problemas de duplicación")
    } else {
      console.error(`❌ Se encontraron ${errorsFound} problema(s)`)
      console.error("   Ejecutar: npm run clean-duplicates")
    }
    console.log("=".repeat(50) + "\n")

    await mongoose.connection.close()
    process.exit(errorsFound > 0 ? 1 : 0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

validateArchitecture()

