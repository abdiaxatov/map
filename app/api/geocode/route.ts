import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 })
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`

  try {
    const upstream = await fetch(url, {
      headers: {
        // Provide identifiable UA per Nominatim policy
        "User-Agent": "mapus-project/1.0 (contact: support@mapus.local)",
        Accept: "application/json",
      },
      // Do not cache geocoding results at the edge by default
      next: { revalidate: 0 },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error ${upstream.status}` },
        { status: upstream.status },
      )
    }

    const data = await upstream.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 })
  }
}

