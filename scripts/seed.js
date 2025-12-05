const mongoose = require("mongoose")
require("dotenv").config({ path: ".env.local" })

const MONGO_URL = process.env.MONGO_URL

if (!MONGO_URL) {
  console.error("❌ MONGO_URL no está definida en .env.local")
  process.exit(1)
}

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

const Product = mongoose.models.Product || mongoose.model("Product", productSchema)

const INITIAL_PRODUCTS = [
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

async function seedDatabase() {
  try {
    console.log("🔌 Conectando a MongoDB...")
    await mongoose.connect(MONGO_URL, {
      bufferCommands: false,
    })
    console.log("✅ Conectado a MongoDB")

    // Limpiar productos existentes
    console.log("🗑️  Limpiando productos existentes...")
    await Product.deleteMany({})
    console.log("✅ Productos eliminados")

    // Insertar productos iniciales
    console.log("📦 Insertando productos iniciales...")
    await Product.insertMany(INITIAL_PRODUCTS)
    console.log(`✅ ${INITIAL_PRODUCTS.length} productos insertados`)

    console.log("\n✨ Migración completada exitosamente!")
    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error en la migración:", error)
    process.exit(1)
  }
}

seedDatabase()
