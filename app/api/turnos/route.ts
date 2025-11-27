import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { Shift } from "@/lib/models"

export async function GET() {
  try {
    await dbConnect()
    const shifts = await Shift.find({}).sort({ startTime: -1 })
    return NextResponse.json(shifts)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect()
    const body = await request.json()
    
    // If closing a shift (body has endTime), update it
    if (body.endTime) {
      const shift = await Shift.findOneAndUpdate(
        { id: body.id },
        body,
        { new: true }
      )
      return NextResponse.json(shift)
    }
    
    // Otherwise create new shift
    const shift = await Shift.create(body)
    return NextResponse.json(shift)
  } catch (error) {
    return NextResponse.json({ error: "Failed to process shift" }, { status: 500 })
  }
}
