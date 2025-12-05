const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Conectar a MongoDB
const MONGO_URL = process.env.MONGO_URL

if (!MONGO_URL) {
  console.error('❌ MONGO_URL no está definida en .env.local')
  process.exit(1)
}

async function cleanDuplicates() {
  try {
    await mongoose.connect(MONGO_URL, { bufferCommands: false })
    console.log('✅ Conectado a MongoDB')

    const db = mongoose.connection.db

    // 1. Eliminar ventas duplicadas (mantener solo la más antigua de cada ID)
    console.log('\n🔍 Buscando ventas duplicadas...')
    const salesCollection = db.collection('sales')
    
    const duplicates = await salesCollection.aggregate([
      {
        $group: {
          _id: '$id',
          count: { $sum: 1 },
          docs: { $push: { _id: '$_id', createdAt: '$createdAt' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray()

    console.log(`📊 Encontradas ${duplicates.length} ventas duplicadas`)

    for (const dup of duplicates) {
      // Ordenar por fecha y mantener la más antigua
      dup.docs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      const toKeep = dup.docs[0]._id
      const toDelete = dup.docs.slice(1).map(d => d._id)
      
      const result = await salesCollection.deleteMany({ _id: { $in: toDelete } })
      console.log(`  ✅ Eliminadas ${result.deletedCount} copias de venta ${dup._id}`)
    }

    // 2. Eliminar TODOS los logs de stock con action "remove"
    // Estos logs son de ventas y NO deben estar en auditoría
    // La auditoría es SOLO para ediciones manuales (add, update_price, update_cost, create)
    console.log('\n🔍 Limpiando logs de ventas en auditoría...')
    const stockLogsCollection = db.collection('stocklogs')
    
    const removeResult = await stockLogsCollection.deleteMany({
      action: 'remove'
    })

    console.log(`  ✅ Eliminados ${removeResult.deletedCount} logs de ventas de la auditoría`)

    // 3. Eliminar logs duplicados (mismo producto, misma acción, mismo timestamp)
    console.log('\n🔍 Buscando logs duplicados...')
    
    const duplicateLogs = await stockLogsCollection.aggregate([
      {
        $group: {
          _id: {
            productId: '$productId',
            action: '$action',
            previousValue: '$previousValue',
            newValue: '$newValue',
            createdAt: '$createdAt'
          },
          count: { $sum: 1 },
          docs: { $push: { _id: '$_id' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray()

    let deletedDuplicates = 0
    for (const dup of duplicateLogs) {
      // Mantener el primero, eliminar los demás
      const toDelete = dup.docs.slice(1).map(d => d._id)
      const result = await stockLogsCollection.deleteMany({ _id: { $in: toDelete } })
      deletedDuplicates += result.deletedCount
    }

    console.log(`  ✅ Eliminados ${deletedDuplicates} logs duplicados`)
    console.log(`  💡 Auditoría ahora solo muestra: add, update_price, update_cost, create`)

    console.log('\n✅ Limpieza completada')
    console.log('\n📋 Resumen:')
    console.log(`  - Ventas duplicadas eliminadas: ${duplicates.reduce((sum, d) => sum + (d.count - 1), 0)}`)
    console.log(`  - Logs de ventas eliminados: ${removeResult.deletedCount}`)
    console.log(`  - Logs duplicados eliminados: ${deletedDuplicates}`)
    console.log('\n💡 La auditoría ahora solo muestra ediciones manuales de stock')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.connection.close()
    console.log('\n👋 Desconectado de MongoDB')
  }
}

cleanDuplicates()

