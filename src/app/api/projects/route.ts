import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'projects')

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

// GET /api/projects — список проектов
export async function GET() {
  try {
    await ensureDir()
    const files = await fs.readdir(DATA_DIR)
    const projects = []

    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8')
        const data = JSON.parse(raw)
        // Возвращаем мета-информацию без содержимого файлов (для списка)
        projects.push({
          id:         data.id,
          name:       data.name,
          updatedAt:  data.updatedAt,
          createdAt:  data.createdAt,
          fileCount:  data.files?.length ?? 0,
          msgCount:   data.messages?.length ?? 0,
        })
      } catch { /* skip broken files */ }
    }

    // Сортировка по дате обновления (новые первые)
    projects.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))

    return NextResponse.json(projects)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/projects — сохранить проект
export async function POST(req: NextRequest) {
  try {
    await ensureDir()
    const body = await req.json()
    const { id, name, messages, files, activeFile } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
    }

    const project = {
      id,
      name: name || 'Без названия',
      messages: messages ?? [],
      files: files ?? [],
      activeFile: activeFile ?? null,
      updatedAt: Date.now(),
      createdAt: body.createdAt ?? Date.now(),
    }

    const filePath = path.join(DATA_DIR, `${id}.json`)
    await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8')

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
