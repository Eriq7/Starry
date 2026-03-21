/**
 * lib/nodes.ts
 *
 * Client-side utility for saving a node to the database after the user
 * authenticates. Sends the draft data and generated card PNG to the
 * /api/nodes route handler, which performs the actual DB insert and
 * Supabase Storage upload server-side.
 *
 * The service role key and all DB operations stay server-side.
 * This module is safe to import in client components.
 *
 * Flow:
 *  1. Canvas → canvasToBlob() → Blob
 *  2. saveNode(draft, blob) → POST /api/nodes with FormData
 *  3. Server inserts node row, uploads card PNG to cards/{node_id}.png
 *  4. Returns { nodeId, cardUrl }
 */

import type { Draft } from './draft'

export interface SavedNode {
  nodeId: string
  cardUrl: string | null
}

/**
 * Save a node after auth. Sends draft + card blob to the server.
 * Throws if the request fails.
 */
export async function saveNode(draft: Draft, cardBlob: Blob): Promise<SavedNode> {
  const form = new FormData()
  form.append('draft', JSON.stringify(draft))
  form.append('card', new File([cardBlob], `starry-${draft.date}.png`, { type: 'image/png' }))

  const res = await fetch('/api/nodes', {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? `Save failed (${res.status})`)
  }

  return res.json() as Promise<SavedNode>
}
