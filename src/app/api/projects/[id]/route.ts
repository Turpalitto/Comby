import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'projects')

// GET /api/projects/[id] — получить проект
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const filePath = path.join(DATA_DIR, `${params.id}.json`)
    const raw = await fs.readFile(filePath, 'utf-8')
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
}

// DELETE /api/projects/[id] — удалить проект
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const filePath = path.join(DATA_DIR, `${params.id}.json`)
    await fs.unlink(filePath)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
}

// PUT /api/projects/[id] — обновить проект
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const filePath = path.join(DATA_DIR, `${params.id}.json`)
    let existing: Record<string, unknown> = {}
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      existing = JSON.parse(raw)
    } catch { /* new project */ }

    const updates = await req.json()
    const merged = { ...existing, ...updates, id: params.id, updatedAt: Date.now() }

    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(merged, null, 2), 'utf-8')

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
