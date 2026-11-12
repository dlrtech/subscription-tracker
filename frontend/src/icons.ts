import type { Category } from './api'

export interface IconStyle { emoji: string; bg: string }

// Well-known services get their own pastel tile; anything else falls back to its category.
const known: [RegExp, IconStyle][] = [
  [/netflix/i, { emoji: '🎬', bg: 'bg-pink' }],
  [/spotify/i, { emoji: '🎧', bg: 'bg-mint' }],
  [/youtube|yt\s?premium/i, { emoji: '▶️', bg: 'bg-pink' }],
  [/icloud|apple/i, { emoji: '☁️', bg: 'bg-sky' }],
  [/disney/i, { emoji: '🏰', bg: 'bg-sky' }],
  [/amazon|prime/i, { emoji: '📦', bg: 'bg-peach' }],
  [/hbo|max\b/i, { emoji: '🎞️', bg: 'bg-violet' }],
  [/exxen|blu\s?tv|gain|tod\b|puhu/i, { emoji: '📺', bg: 'bg-lemon' }],
  [/github|copilot/i, { emoji: '🐙', bg: 'bg-violet' }],
  [/chatgpt|openai|claude|gemini/i, { emoji: '🤖', bg: 'bg-mint' }],
  [/notion|evernote/i, { emoji: '📝', bg: 'bg-lemon' }],
  [/adobe|canva|figma/i, { emoji: '🎨', bg: 'bg-pink' }],
  [/dropbox|google\s?(one|drive)|onedrive/i, { emoji: '🗂️', bg: 'bg-sky' }],
  [/xbox|playstation|psn|steam|nintendo|game/i, { emoji: '🎮', bg: 'bg-violet' }],
  [/gym|spor|fitness/i, { emoji: '🏋️', bg: 'bg-peach' }],
  [/duolingo|udemy|coursera|dil/i, { emoji: '🦉', bg: 'bg-mint' }],
  [/gazete|news|medium|kitap|book|kindle/i, { emoji: '📰', bg: 'bg-lemon' }],
  [/vpn|nord|express/i, { emoji: '🛡️', bg: 'bg-sky' }],
  [/turkcell|vodafone|t[üu]rk telekom|internet|fiber/i, { emoji: '🌐', bg: 'bg-peach' }],
]

const byCategory: Record<Category, IconStyle> = {
  ENTERTAINMENT: { emoji: '🎬', bg: 'bg-violet' },
  MUSIC: { emoji: '🎧', bg: 'bg-mint' },
  SOFTWARE: { emoji: '💻', bg: 'bg-sky' },
  INTERNET: { emoji: '🌐', bg: 'bg-peach' },
  CLOUD: { emoji: '☁️', bg: 'bg-sky' },
  OTHER: { emoji: '✨', bg: 'bg-lemon' },
}

export function iconFor(name: string, category: Category): IconStyle {
  return known.find(([re]) => re.test(name))?.[1] ?? byCategory[category]
}

/** Icons floating in the page background. Decorative only. */
export const floatingIcons: { emoji: string; bg: string }[] = [
  { emoji: '🎬', bg: 'bg-pink' }, { emoji: '🎧', bg: 'bg-mint' }, { emoji: '▶️', bg: 'bg-pink' },
  { emoji: '☁️', bg: 'bg-sky' }, { emoji: '🎮', bg: 'bg-violet' }, { emoji: '📺', bg: 'bg-lemon' },
  { emoji: '🏋️', bg: 'bg-peach' }, { emoji: '📰', bg: 'bg-lemon' }, { emoji: '🤖', bg: 'bg-mint' },
  { emoji: '💻', bg: 'bg-sky' }, { emoji: '🦉', bg: 'bg-mint' }, { emoji: '🎨', bg: 'bg-pink' },
]
