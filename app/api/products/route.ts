import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Product, StockLog } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()
    const products = await Product.find({}).sort({ name: 1 })
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()
    
    console.log('🔴 Backend recibió producto:', body.name, 'lowStockThreshold:', body.lowStockThreshold)
    
    // Check if product already exists (upsert behavior)
    const existingProduct = await Product.findOne({ id: body.id })
    
    if (existingProduct) {
      // Update existing product
      const oldProduct = { ...existingProduct.toObject() }
      
      // Use findOneAndUpdate to ensure all fields are saved
      const updatedProduct = await Product.findOneAndUpdate(
        { id: body.id },
        {
          name: body.name,
          description: body.description,
          brand: body.brand,
          cost: body.cost,
          price: body.price,
          quantity: body.quantity,
          lowStockThreshold: body.lowStockThreshold ?? 10,
          beneficiary: body.beneficiary,
          barcode: body.barcode,
          updatedAt: new Date().toISOString(),
        },
        { new: true }
      )
      
      console.log('✅ Producto actualizado:', updatedProduct?.name, 'lowStockThreshold:', updatedProduct?.lowStockThreshold)
      
      // Create stock logs for changes
      if (oldProduct.quantity !== body.quantity) {
        await StockLog.create({
          id: crypto.randomUUID(),
          productId: body.id,
          productName: body.name,
          action: body.quantity > oldProduct.quantity ? "add" : "remove",
          previousValue: oldProduct.quantity,
          newValue: body.quantity,
          userId: body.userId || "system",
          userName: body.userName || "System",
          createdAt: new Date().toISOString(),
        })
      }
      
      if (oldProduct.price !== body.price) {
        await StockLog.create({
          id: crypto.randomUUID(),
          productId: body.id,
          productName: body.name,
          action: "update_price",
          previousValue: oldProduct.price,
          newValue: body.price,
          userId: body.userId || "system",
          userName: body.userName || "System",
          createdAt: new Date().toISOString(),
        })
      }
      
      if (oldProduct.cost !== body.cost) {
        await StockLog.create({
          id: crypto.randomUUID(),
          productId: body.id,
          productName: body.name,
          action: "update_cost",
          previousValue: oldProduct.cost,
          newValue: body.cost,
          userId: body.userId || "system",
          userName: body.userName || "System",
          createdAt: new Date().toISOString(),
        })
      }
      
      return NextResponse.json(updatedProduct)
    }
    
    // Create new product
    if (!body.id) {
      body.id = crypto.randomUUID()
    }
    body.createdAt = new Date().toISOString()
    body.updatedAt = new Date().toISOString()
    
    const product = await Product.create(body)
    
    // Log product creation
    await StockLog.create({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      action: "create",
      previousValue: 0,
      newValue: product.quantity,
      userId: body.userId || "system",
      userName: body.userName || "System",
      createdAt: new Date().toISOString(),
    })
    
    return NextResponse.json(product)
  } catch (error) {
    console.error("Product creation/update error:", error)
    return NextResponse.json({ error: "Failed to create/update product" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()
    
    const existingProduct = await Product.findOne({ id: body.id })
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    const oldProduct = { ...existingProduct.toObject() }
    
    // Update fields
    Object.assign(existingProduct, body)
    existingProduct.updatedAt = new Date().toISOString()
    await existingProduct.save()
    
    // Create stock logs for changes
    if (oldProduct.quantity !== body.quantity) {
      await StockLog.create({
        id: crypto.randomUUID(),
        productId: body.id,
        productName: body.name,
        action: body.quantity > oldProduct.quantity ? "add" : "remove",
        previousValue: oldProduct.quantity,
        newValue: body.quantity,
        userId: body.userId || "system",
        userName: body.userName || "System",
        createdAt: new Date().toISOString(),
      })
    }
    
    if (oldProduct.price !== body.price) {
      await StockLog.create({
        id: crypto.randomUUID(),
        productId: body.id,
        productName: body.name,
        action: "update_price",
        previousValue: oldProduct.price,
        newValue: body.price,
        userId: body.userId || "system",
        userName: body.userName || "System",
        createdAt: new Date().toISOString(),
      })
    }
    
    if (oldProduct.cost !== body.cost) {
      await StockLog.create({
        id: crypto.randomUUID(),
        productId: body.id,
        productName: body.name,
        action: "update_cost",
        previousValue: oldProduct.cost,
        newValue: body.cost,
        userId: body.userId || "system",
        userName: body.userName || "System",
        createdAt: new Date().toISOString(),
      })
    }
    
    return NextResponse.json(existingProduct)
  } catch (error) {
    console.error("Product update error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const product = await Product.findOneAndDelete({ id })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, deletedProduct: product })
  } catch (error) {
    console.error("Product deletion error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}