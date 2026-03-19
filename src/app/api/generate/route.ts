import { NextResponse } from 'next/server'

// Этот endpoint заменён на /api/agent/run
// Перенаправляем документацию
export async function POST() {
  return NextResponse.json(
    { error: 'Используйте /api/agent/run для генерации проектов' },
    { status: 308 }
  )
}
