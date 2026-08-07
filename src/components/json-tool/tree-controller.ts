import type { PathSegment } from '@/lib/jsonc'
import type { SortMode } from '@/stores/json'

/** JsonNode 所需的最小交互状态，可由不同页面各自提供。 */
export interface JsonTreeController {
  indentSize: '2' | '4'
  sortMode: SortMode
  query: string
  matchedPathKeys: Set<string>
  currentMatchKey: () => string | null
  isExpanded: (segments: PathSegment[], depth: number) => boolean
  setExpanded: (segments: PathSegment[], expanded: boolean) => void
  toggleExpanded: (segments: PathSegment[], depth: number) => void
}
