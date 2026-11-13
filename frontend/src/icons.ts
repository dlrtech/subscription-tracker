import type { Category } from './api'
import type { IconName } from './components/Icon'

export interface IconStyle { icon: IconName; bg: string }

// Well-known services get their own pastel tile; anything else falls back to its category.
const known: [RegExp, IconStyle][] = [
  [/netflix/i, { icon: 'film', bg: 'bg-pink' }],
  [/spotify/i, { icon: 'headphones', bg: 'bg-mint' }],
  [/youtube|yt\s?premium/i, { icon: 'play', bg: 'bg-pink' }],
  [/icloud|apple/i, { icon: 'cloud', bg: 'bg-sky' }],
  [/disney/i, { icon: 'sparkles', bg: 'bg-sky' }],
  [/amazon|prime/i, { icon: 'package', bg: 'bg-peach' }],
  [/hbo|max\b/i, { icon: 'film', bg: 'bg-violet' }],
  [/exxen|blu\s?tv|gain|tod\b|puhu/i, { icon: 'tv', bg: 'bg-lemon' }],
  [/github|copilot/i, { icon: 'code', bg: 'bg-violet' }],
  [/chatgpt|openai|claude|gemini/i, { icon: 'bot', bg: 'bg-mint' }],
  [/notion|evernote/i, { icon: 'note', bg: 'bg-lemon' }],
  [/adobe|canva|figma/i, { icon: 'palette', bg: 'bg-pink' }],
  [/dropbox|google\s?(one|drive)|onedrive/i, { icon: 'folder', bg: 'bg-sky' }],
  [/xbox|playstation|psn|steam|nintendo|game/i, { icon: 'gamepad', bg: 'bg-violet' }],
  [/gym|spor|fitness/i, { icon: 'dumbbell', bg: 'bg-peach' }],
  [/duolingo|udemy|coursera|dil/i, { icon: 'book', bg: 'bg-mint' }],
  [/gazete|news|medium|kitap|book|kindle/i, { icon: 'newspaper', bg: 'bg-lemon' }],
  [/vpn|nord|express/i, { icon: 'shield', bg: 'bg-sky' }],
  [/turkcell|vodafone|t[üu]rk telekom|internet|fiber/i, { icon: 'globe', bg: 'bg-peach' }],
]

const byCategory: Record<Category, IconStyle> = {
  ENTERTAINMENT: { icon: 'film', bg: 'bg-violet' },
  MUSIC: { icon: 'headphones', bg: 'bg-mint' },
  SOFTWARE: { icon: 'laptop', bg: 'bg-sky' },
  INTERNET: { icon: 'globe', bg: 'bg-peach' },
  CLOUD: { icon: 'cloud', bg: 'bg-sky' },
  OTHER: { icon: 'sparkles', bg: 'bg-lemon' },
}

export function iconFor(name: string, category: Category): IconStyle {
  return known.find(([re]) => re.test(name))?.[1] ?? byCategory[category]
}
