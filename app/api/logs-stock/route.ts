import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { StockLog } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()
    const logs = await StockLog.find({}).sort({ createdAt: -1 }).limit(500)
    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // IMPORTANTE: Este endpoint NO debe ser llamado desde el frontend.
  // Los logs de auditoría se crean automáticamente en /api/products
  // cuando se editan productos manualmente.
  // 
  // Mantener este endpoint solo para sincronización interna si es necesario.
  try {
    await dbConnect()
    const body = await request.json()
    
    // Validar que no sea un intento de duplicar logs desde el frontend
    if (!body.id || !body.productId || !body.action) {
      return NextResponse.json({ error: "Invalid log data" }, { status: 400 })
    }
    
    // Verificar si ya existe un log con este id para evitar duplicados
    const existingLog = await StockLog.findOne({ id: body.id })
    if (existingLog) {
      return NextResponse.json(existingLog)
    }
    
    const log = await StockLog.create(body)
    return NextResponse.json(log)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 })
  }
}
