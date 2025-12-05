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

    // Si llega un turno con endTime, asumimos que es un cierre de turno.
    if (body.endTime) {
      const shift = await Shift.findOneAndUpdate({ id: body.id }, body, { new: true })
      return NextResponse.json(shift)
    }

    // Para inicio de turno, si ya existe un turno con ese id no lo volvemos a crear.
    // Esto ayuda a evitar duplicados cuando el front reintenta en modo offline/online.
    const existingShift = await Shift.findOne({ id: body.id })
    if (existingShift) {
      return NextResponse.json(existingShift)
    }

    const shift = await Shift.create(body)
    return NextResponse.json(shift)
  } catch (error) {
    return NextResponse.json({ error: "Failed to process shift" }, { status: 500 })
  }
}
