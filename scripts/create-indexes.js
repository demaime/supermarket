const mongoose = require("mongoose")
require("dotenv").config({ path: ".env.local" })

const MONGO_URL = process.env.MONGO_URL

if (!MONGO_URL) {
  console.error("❌ MONGO_URL no está definida en .env.local")
  process.exit(1)
}

async function createIndexes() {
  try {
    console.log("🔌 Conectando a MongoDB...")
    await mongoose.connect(MONGO_URL, {
      bufferCommands: false,
    })
    console.log("✅ Conectado a MongoDB\n")

    const db = mongoose.connection.db

    // Crear índice único en Sales.id
    console.log("🔑 Creando índice único en Sales.id...")
    try {
      await db.collection("sales").createIndex({ id: 1 }, { unique: true })
      console.log("  ✅ Índice único creado en Sales.id")
    } catch (error) {
      if (error.code === 11000) {
        console.log("  ℹ️  El índice ya existe")
      } else {
        throw error
      }
    }

    // Crear índice único en StockLog.id
    console.log("\n🔑 Creando índice único en StockLog.id...")
    try {
      await db.collection("stocklogs").createIndex({ id: 1 }, { unique: true })
      console.log("  ✅ Índice único creado en StockLog.id")
    } catch (error) {
      if (error.code === 11000) {
        console.log("  ℹ️  El índice ya existe")
      } else {
        throw error
      }
    }

    // Crear índice único en Shift.id
    console.log("\n🔑 Creando índice único en Shift.id...")
    try {
      await db.collection("shifts").createIndex({ id: 1 }, { unique: true })
      console.log("  ✅ Índice único creado en Shift.id")
    } catch (error) {
      if (error.code === 11000) {
        console.log("  ℹ️  El índice ya existe")
      } else {
        throw error
      }
    }

    console.log("\n✅ Índices creados correctamente")
    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

createIndexes()



