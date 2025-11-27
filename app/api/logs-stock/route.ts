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
  try {
    await dbConnect()
    const body = await request.json()
    const log = await StockLog.create(body)
    return NextResponse.json(log)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 })
  }
}
