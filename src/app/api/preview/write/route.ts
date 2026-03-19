import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

// Path to the generated-preview project (sibling directory)
const PREVIEW_DIR = path.resolve(process.cwd(), '..', 'generated-preview')

export async function POST(req: NextRequest) {
  try {
    const { files } = (await req.json()) as { files: Array<{ path: string; content: string }> }

    for (const file of files) {
      const filePath = path.join(PREVIEW_DIR, file.path)
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, file.content, 'utf-8')
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
