import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Sale } from "@/lib/models"

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
    // Force synced to true since it's now on the server
    body.synced = true
    const sale = await Sale.create(body)
    return NextResponse.json(sale)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
  }
}
