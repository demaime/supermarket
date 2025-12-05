import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Sale, Product } from "@/lib/models"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit")
    
    let query = Sale.find({}).sort({ createdAt: -1 })
    
    if (limit) {
      query = query.limit(parseInt(limit))
    }
    
    const sales = await query.exec()
    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()

    // Normalizamos origen: si no viene, asumimos "online"
    if (!body.origin) {
      body.origin = "online"
    }

    // DEDUPLICACIÓN CRÍTICA:
    // Usamos el id de la venta (UUID del front) como clave lógica.
    // Si ya existe una venta con ese id, devolvemos esa venta sin
    // volver a descontar stock ni crear logs.
    const existingSale = await Sale.findOne({ id: body.id })
    if (existingSale) {
      console.log(`[VENTAS] Venta duplicada detectada: ${body.id} - devolviendo existente`)
      return NextResponse.json(existingSale)
    }

    console.log(`[VENTAS] Procesando nueva venta: ${body.id}`)
    
    // Validate stock availability before processing sale
    for (const item of body.items) {
      const product = await Product.findOne({ id: item.productId })
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productName} not found` },
          { status: 404 }
        )
      }
      if (product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.productName}. Available: ${product.quantity}` },
          { status: 400 }
        )
      }
    }
    
    // Process sale: SOLO actualizar stock (NO crear StockLog)
    // Las ventas se registran en la colección Sales
    // StockLog es SOLO para ediciones manuales de stock (para auditoría anti-robo)
    for (const item of body.items) {
      const product = await Product.findOne({ id: item.productId })
      if (product) {
        const previousQuantity = product.quantity
        const newQuantity = previousQuantity - item.quantity
        
        // Update product stock
        product.quantity = newQuantity
        product.updatedAt = new Date().toISOString()
        await product.save()
      }
    }
    
    // Create sale record
    body.synced = true
    const sale = await Sale.create(body)
    
    console.log(`[VENTAS] Venta creada exitosamente: ${sale.id}`)
    return NextResponse.json(sale)
  } catch (error) {
    console.error("[VENTAS] Error al crear venta:", error)
    // Si es error de duplicado (código 11000 de Mongo), intentar devolver la existente
    if ((error as any).code === 11000) {
      console.log(`[VENTAS] Error de duplicado detectado para: ${body.id}`)
      const existingSale = await Sale.findOne({ id: body.id })
      if (existingSale) {
        return NextResponse.json(existingSale)
      }
    }
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
  }
}
