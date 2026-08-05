import { useEffect, useState, type ReactNode } from 'react'
import type { PlayerCharacterTemplateV1 } from './characterTemplate'

export type ViewKey = 'home' | 'campaign' | 'combat' | 'reference'
export type ReferenceSection = 'ttg_classes' | 'ttg_races' | 'ttg_rules' | EntityKey

export type EntityKey = 'monsters' | 'spells' | 'items' | 'weapons' | 'artifacts'

export type MonsterRow = {
  id: number
  name: string
  name_ru: string | null
  type: string | null
  cr: string | null
  source: string | null
}

export type SpellRow = {
  id: number
  name: string
  name_ru: string | null
  school: string | null
  level: number | null
  source: string | null
}

export type ItemRow = {
  id: number
  name: string
  name_ru: string | null
  type: string | null
  rarity: number | null
  source: string | null
}

export type WeaponRow = {
  id: number
  name: string
  name_ru: string | null
  type: string | null
  rarity: number | null
  source: string | null
}

export type ArtifactRow = {
  id: number
  name: string
  name_ru: string | null
  rarity: number | null
  source: string | null
}

export type ListRow = MonsterRow | SpellRow | ItemRow | WeaponRow | ArtifactRow

export type ListResponse<T> = {
  total: number
  items: T[]
}

export type DetailResponse = {
  id: number
  name: string
  name_ru: string | null
  source: string | null
  data: any
} | null

export type TtgArchetype = {
  slug?: string | null
  name_ru?: string | null
  name_en?: string | null
  source_short?: string | null
  source_name?: string | null
  description_text?: string | null
}

export type TtgClass = {
  slug?: string | null
  name_ru?: string | null
  name_en?: string | null
  type?: string | null
  source_short?: string | null
  source_name?: string | null
  hit_die?: string | null
  archetype_label?: string | null
  description_text?: string | null
  sections?: Array<{ title?: string | null; content?: string | null }>
  archetypes?: TtgArchetype[]
}

export type TtgSubrace = {
  name_ru?: string | null
  name_en?: string | null
  source_short?: string | null
  source_name?: string | null
  description_text?: string | null
}

export type ReferenceRelated = {
  title: string
  subtitle?: string | null
  text?: string | null
}

export type TtgRace = {
  slug?: string | null
  name_ru?: string | null
  name_en?: string | null
  type?: string | null
  source_short?: string | null
  source_name?: string | null
  size?: string | null
  speed?: string | null
  darkvision?: string | null
  description_text?: string | null
  sections?: Array<{ title?: string | null; content?: string | null }>
  subraces?: TtgSubrace[]
}

export type TtgRule = {
  slug?: string | null
  name_ru?: string | null
  name_en?: string | null
  type?: string | null
  source_short?: string | null
  source_name?: string | null
  description_text?: string | null
  sections?: Array<{ title?: string | null; content?: string | null }>
}

export type TtgEntry = TtgClass | TtgRace | TtgRule

export type ReferenceModal = {
  kind?: 'ttg_class' | 'ttg_race' | 'ttg_rule' | 'entity'
  slug?: string | null
  title: string
  subtitle?: string | null
  columns?: Array<{ label: string; value: string }>
  sections?: Array<{ title: string; content: string }>
  related?: ReferenceRelated[]
  text?: string | null
}

export type MonsterEntry = { name?: string; text?: string }

export type MonsterLegendary = {
  text?: string
  list?: MonsterEntry[]
}

export type MonsterLair = {
  text?: string
  list?: MonsterEntry[]
}

export type Campaign = {
  id: number
  name: string
}

export type Character = {
  id: number
  name: string
  race: string | null
  class: string | null
  level: number | null
  data: any
}

export type SaveMods = {
  str: number | null
  dex: number | null
  con: number | null
  int: number | null
  wis: number | null
  cha: number | null
}

export type CombatCondition = {
  name: string
  rounds: number | null
}

export type CombatLogTone = 'normal' | 'crit' | 'fail'
export type ThemeMode = 'dark' | 'light'

export type CombatLogEntry = {
  label: string
  total: number | null
  detail: string
  tone: CombatLogTone
}

export type CombatWeaponOption = {
  key: string
  name: string
  attackBonus: number | null
  damageExpr: string | null
}

export type CombatParticipant = {
  id: string
  kind: 'character' | 'monster'
  sourceId?: number
  name: string
  targetId?: string | null
  position?: { x: number; y: number } | null
  size?: { width: number; height: number } | null
  hpMax: number | null
  hpCurrent: number | null
  ac: number | null
  initiative: number | null
  attackBonus: number | null
  damageExpr: string
  effects: Array<{ name: string; rounds: number | null }>
  conditions: CombatCondition[]
  concentration: { name: string; rounds: number | null } | null
  saves: SaveMods
  weaponOptions?: CombatWeaponOption[]
  selectedWeaponKey?: string | null
  actions?: Array<{
    name: string
    text: string
    attackBonus: number | null
    damageExpr: string | null
    saveDc: number | null
    saveAbility: '' | 'СИЛ' | 'ЛВК' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР'
  }>
  notes: string
}

export type CustomMonsterRow = {
  id: number
  name: string
  cr: string | null
  updated_at: string
}

export type CustomWeaponRow = {
  id: number
  name: string
  kind: string | null
  damage: string | null
  attack_bonus: number | null
  updated_at: string
}

export type CustomMonsterDraft = {
  name: string
  size: string
  type: string
  alignment: string
  ac: string
  hp: string
  speed: string
  cr: string
  str: string
  dex: string
  con: string
  int: string
  wis: string
  cha: string
  senses: string
  languages: string
  savesText: string
  skillsText: string
  vulnerabilities: string
  resistances: string
  immunities: string
  conditionImmunities: string
  traitsText: string
  actionsText: string
  reactionsText: string
  legendaryText: string
  lairText: string
}

export type CustomMonsterActionDraft = {
  id: string
  name: string
  attackKind: 'melee' | 'ranged' | 'spell' | 'melee_or_ranged'
  attackBonus: string
  rangeText: string
  targetText: string
  damageExpr: string
  damageType: string
  saveDc: string
  saveAbility: '' | 'СИЛ' | 'ЛВК' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР'
  saveFailText: string
  saveSuccessText: string
  extraText: string
}

export type InventoryEntry = {
  name: string
  qty: number
  notes?: string
  category?: 'manual' | 'item' | 'weapon' | 'custom_weapon' | 'artifact'
}

export type CharacterData = {
  inventory: InventoryEntry[]
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number }
  spells: Array<{ id?: number; name: string; summary?: string }>
  items: Array<{ id?: number; name: string; summary?: string }>
  weapons: Array<{
    id?: number
    customId?: number
    name: string
    summary?: string
    attackBonus?: number | null
    damageExpr?: string | null
  }>
  artifacts: Array<{ id?: number; name: string; summary?: string }>
  equipment: {
    primaryWeaponKey: string | null
    secondaryWeaponKey: string | null
  }
  ammo: Array<{ name: string; qty: number }>
  notes: string
  combat: {
    hpMax: number | null
    hpCurrent: number | null
    ac: number | null
    speed: number | null
    initiativeOverride: number | null
  }
  stats: {
    str: { score: number | null; modOverride: number | null }
    dex: { score: number | null; modOverride: number | null }
    con: { score: number | null; modOverride: number | null }
    int: { score: number | null; modOverride: number | null }
    wis: { score: number | null; modOverride: number | null }
    cha: { score: number | null; modOverride: number | null }
  }
  saves: {
    str: { prof: boolean; override: number | null }
    dex: { prof: boolean; override: number | null }
    con: { prof: boolean; override: number | null }
    int: { prof: boolean; override: number | null }
    wis: { prof: boolean; override: number | null }
    cha: { prof: boolean; override: number | null }
  }
  skills: {
    acrobatics: { prof: boolean; override: number | null }
    animalHandling: { prof: boolean; override: number | null }
    arcana: { prof: boolean; override: number | null }
    athletics: { prof: boolean; override: number | null }
    deception: { prof: boolean; override: number | null }
    history: { prof: boolean; override: number | null }
    insight: { prof: boolean; override: number | null }
    intimidation: { prof: boolean; override: number | null }
    investigation: { prof: boolean; override: number | null }
    medicine: { prof: boolean; override: number | null }
    nature: { prof: boolean; override: number | null }
    perception: { prof: boolean; override: number | null }
    performance: { prof: boolean; override: number | null }
    persuasion: { prof: boolean; override: number | null }
    religion: { prof: boolean; override: number | null }
    sleightOfHand: { prof: boolean; override: number | null }
    stealth: { prof: boolean; override: number | null }
    survival: { prof: boolean; override: number | null }
  }
}

export const defaultResponse: ListResponse<ListRow> = { total: 0, items: [] }

export const emptyCustomMonsterDraft: CustomMonsterDraft = {
  name: '',
  size: 'Medium',
  type: '',
  alignment: '',
  ac: '',
  hp: '',
  speed: '',
  cr: '',
  str: '',
  dex: '',
  con: '',
  int: '',
  wis: '',
  cha: '',
  senses: '',
  languages: '',
  savesText: '',
  skillsText: '',
  vulnerabilities: '',
  resistances: '',
  immunities: '',
  conditionImmunities: '',
  traitsText: '',
  actionsText: '',
  reactionsText: '',
  legendaryText: '',
  lairText: ''
}

export const customMonsterSizeOptions = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'] as const

export const createEmptyCustomMonsterAction = (): CustomMonsterActionDraft => ({
  id: `cma-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  attackKind: 'melee',
  attackBonus: '',
  rangeText: '',
  targetText: '',
  damageExpr: '',
  damageType: '',
  saveDc: '',
  saveAbility: '',
  saveFailText: '',
  saveSuccessText: '',
  extraText: ''
})

export const entityLabels: Record<EntityKey, string> = {
  monsters: 'Монстры',
  spells: 'Заклинания',
  items: 'Предметы',
  weapons: 'Оружие',
  artifacts: 'Артефакты'
}

export const rarityLabel = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  if (value === 0) return 'обычный'
  if (value === 1) return 'необычный'
  if (value === 2) return 'редкий'
  if (value === 3) return 'очень редкий'
  if (value === 4) return 'легендарный'
  return 'особый'
}

export const getDisplayName = (row: ListRow): string => row.name_ru ?? row.name

export const getSubtitle = (row: ListRow): string | null =>
  row.name_ru && row.name ? row.name : null

export const getListMeta = (entity: EntityKey, row: ListRow): string[] => {
  if (entity === 'monsters') {
    const monster = row as MonsterRow
    return [monster.type ?? 'Тип не указан', `КС: ${monster.cr ?? '—'}`]
  }
  if (entity === 'spells') {
    const spell = row as SpellRow
    const level = spell.level === 0 ? 'заговор' : `ур. ${spell.level ?? '—'}`
    return [spell.school ?? 'школа неизвестна', level]
  }
  if (entity === 'items') {
    const item = row as ItemRow
    return [item.type ?? 'тип не указан', `редкость: ${rarityLabel(item.rarity)}`]
  }
  if (entity === 'weapons') {
    const weapon = row as WeaponRow
    return [weapon.type ?? 'тип не указан', `редкость: ${rarityLabel(weapon.rarity)}`]
  }
  const art = row as ArtifactRow
  return [`редкость: ${rarityLabel(art.rarity)}`]
}

export const getDetailTitle = (detail: DetailResponse): string => {
  if (!detail) return 'Выберите запись'
  return detail.name_ru ?? detail.name
}

export const normalizeEntries = (value: unknown): MonsterEntry[] => {
  if (!value) return []
  if (Array.isArray(value)) return value as MonsterEntry[]
  if (typeof value === 'string') return [{ text: value }]
  return [value as MonsterEntry]
}

export const toText = (value: unknown): string => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return '—'
}

export const getLocaleValue = (data: any, key: string): string | null => {
  const ruValue = data?.ru?.[key]
  if (ruValue) return String(ruValue)
  const enValue = data?.en?.[key]
  if (enValue) return String(enValue)
  return null
}

export const getLocaleHtml = (data: any, key: string): string => {
  const value = getLocaleValue(data, key)
  return value ?? ''
}

export const getDescriptionHtml = (data: any): string => {
  const text =
    getLocaleValue(data, 'text') ??
    getLocaleValue(data, 'desc') ??
    getLocaleValue(data, 'description') ??
    getLocaleValue(data, 'fiction') ??
    data?.fiction
  if (text) return text
  const entries = data?.entries ?? data?.ru?.entries ?? data?.en?.entries
  if (Array.isArray(entries)) {
    const parts = entries
      .map((entry) => extractActionText(entry))
      .map((entry) => entry.trim())
      .filter(Boolean)
    if (parts.length > 0) {
      return parts.map((part) => `<p>${part}</p>`).join('')
    }
  }
  return ''
}

export const formatMonsterSaves = (data: any): string | null => {
  const source = data?.saves ?? data?.savingThrows ?? data?.saveThrows ?? null
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null
  const parts = abilityKeys
    .map((key) => (typeof source[key] === 'number' ? `${abilityLabels[key]} ${formatMod(source[key])}` : null))
    .filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

export const boolLabel = (value: unknown): string => {
  if (value === true || value === 'true') return 'да'
  if (value === false || value === 'false') return 'нет'
  return '—'
}

export const buildSpellSummary = (data: any): string => {
  const level = getLocaleValue(data, 'level') ?? '—'
  const school = getLocaleValue(data, 'school') ?? '—'
  const casting = getLocaleValue(data, 'castingTime') ?? '—'
  const range = getLocaleValue(data, 'range') ?? '—'
  return `${level} · ${school} · ${casting} · ${range}`
}

export const buildItemSummary = (data: any): string => {
  const type = getLocaleValue(data, 'type') ?? '—'
  const rarity = rarityLabel(data?.en?.rarity ?? data?.ru?.rarity)
  const ac = data?.en?.ac ?? data?.ru?.ac
  const damageVal = data?.en?.damageVal ?? data?.ru?.damageVal
  const damageType = data?.en?.damageType ?? data?.ru?.damageType
  const damage = damageVal ? `${damageVal} ${damageType ?? ''}`.trim() : null
  const extras = [ac ? `КД ${ac}` : null, damage ? `урон ${damage}` : null]
    .filter(Boolean)
    .join(' · ')
  return `${type} · ${rarity}${extras ? ` · ${extras}` : ''}`
}

export const buildWeaponSummary = (data: any): string => {
  const type = getLocaleValue(data, 'type') ?? getLocaleValue(data, 'weaponType') ?? 'Оружие'
  const damageVal = data?.en?.damageVal ?? data?.ru?.damageVal ?? data?.damage ?? null
  const damageType = data?.en?.damageType ?? data?.ru?.damageType ?? data?.damageType ?? null
  const range = getLocaleValue(data, 'range') ?? data?.rangeText ?? null
  const attackBonus =
    typeof data?.attackBonus === 'number' && Number.isFinite(data.attackBonus)
      ? formatMod(data.attackBonus)
      : null
  const parts = [
    type,
    damageVal ? `${damageVal}${damageType ? ` ${damageType}` : ''}` : null,
    range ? `дистанция: ${range}` : null,
    attackBonus ? `атака: ${attackBonus}` : null
  ].filter(Boolean)
  return parts.join(' · ')
}

export const buildArtifactSummary = (data: any): string => {
  const type = getLocaleValue(data, 'type') ?? '—'
  const rarity = rarityLabel(data?.en?.rarity ?? data?.ru?.rarity)
  const attune = data?.en?.attunement ?? data?.ru?.attunement
  return `${type} · ${rarity}${attune ? ` · ${attune}` : ''}`
}

export const getWeaponKey = (weapon: {
  id?: number
  customId?: number
  name: string
}) => {
  if (typeof weapon.customId === 'number') return `custom:${weapon.customId}`
  if (typeof weapon.id === 'number') return `lib:${weapon.id}`
  return `name:${weapon.name.trim().toLowerCase()}`
}

export const parseWeaponAttackBonus = (value?: string | null): number | null => {
  if (!value) return null
  const fromTag = value.match(/атака:\s*([+-]?\d+)/i)
  if (fromTag) {
    const parsed = Number(fromTag[1])
    return Number.isFinite(parsed) ? parsed : null
  }
  const generic = value.match(/(^|[^0-9])([+-]\d{1,2})(?=\D|$)/)
  if (!generic) return null
  const parsed = Number(generic[2])
  return Number.isFinite(parsed) ? parsed : null
}

export const parseWeaponDamageExpr = (value?: string | null): string | null => {
  if (!value) return null
  const match = value.match(/(\d+d\d+(?:[+-]\d+)?)/i)
  return match ? normalizeDamageExpr(match[1]) : null
}

export const parseDice = (expression: string) => {
  const normalized = expression.replace(/\s+/g, '')
  const match = normalized.match(/^(\d*)d(\d+)([+-]\d+)?$/i)
  if (!match) return null
  const count = match[1] ? Number(match[1]) : 1
  const sides = Number(match[2])
  const modifier = match[3] ? Number(match[3]) : 0
  if (!count || !sides) return null
  return { count, sides, modifier }
}

export const scoreToMod = (score: number | null): number | null => {
  if (score === null || Number.isNaN(score)) return null
  return Math.floor((score - 10) / 2)
}

export const formatMod = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) return '—'
  return value >= 0 ? `+${value}` : String(value)
}

export const abilityKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
export const abilityLabels: Record<(typeof abilityKeys)[number], string> = {
  str: 'СИЛ',
  dex: 'ЛВК',
  con: 'ТЕЛ',
  int: 'ИНТ',
  wis: 'МДР',
  cha: 'ХАР'
}
export const saveLabelToKey: Record<string, (typeof abilityKeys)[number]> = {
  СИЛ: 'str',
  ЛВК: 'dex',
  ТЕЛ: 'con',
  ИНТ: 'int',
  МДР: 'wis',
  ХАР: 'cha'
}
export const emptySaves: SaveMods = { str: null, dex: null, con: null, int: null, wis: null, cha: null }

export const getProfBonus = (level: number | null): number | null => {
  if (!level || level < 1) return null
  return 2 + Math.floor((level - 1) / 4)
}

export const getStatMod = (data: CharacterData, key: (typeof abilityKeys)[number]): number | null => {
  const stat = data.stats[key]
  if (stat.modOverride !== null && stat.modOverride !== undefined) return stat.modOverride
  return scoreToMod(stat.score)
}

export const buildSaveModsFromCharacter = (data: CharacterData, level: number | null): SaveMods => {
  const profBonus = getProfBonus(level)
  return abilityKeys.reduce((acc, key) => {
    const save = data.saves[key]
    if (save.override !== null && save.override !== undefined) {
      acc[key] = save.override
      return acc
    }
    const base = getStatMod(data, key)
    if (base === null) {
      acc[key] = null
      return acc
    }
    acc[key] = save.prof && profBonus !== null ? base + profBonus : base
    return acc
  }, {} as SaveMods)
}

export const parseMonsterSaves = (data: any): SaveMods => {
  const source = data?.saves ?? data?.savingThrows ?? data?.saveThrows ?? null
  if (!source) return emptySaves
  if (typeof source === 'object' && !Array.isArray(source)) {
    return {
      str: typeof source.str === 'number' ? source.str : emptySaves.str,
      dex: typeof source.dex === 'number' ? source.dex : emptySaves.dex,
      con: typeof source.con === 'number' ? source.con : emptySaves.con,
      int: typeof source.int === 'number' ? source.int : emptySaves.int,
      wis: typeof source.wis === 'number' ? source.wis : emptySaves.wis,
      cha: typeof source.cha === 'number' ? source.cha : emptySaves.cha
    }
  }
  return emptySaves
}

export const parseMonsterHp = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return null
  const match = value.match(/^\s*(\d+)/)
  if (!match) return null
  return Number(match[1])
}

export const parseMonsterAc = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return null
  const match = value.match(/^\s*(\d+)/)
  if (!match) return null
  return Number(match[1])
}

export const extractActionText = (entry: any): string => {
  if (!entry) return ''
  if (typeof entry === 'string') return entry
  if (typeof entry.text === 'string') return entry.text
  if (Array.isArray(entry.entries)) return entry.entries.map(extractActionText).join(' ')
  return ''
}

export const normalizeActionText = (text: string) =>
  stripHtml(text)
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/[＋﹢]/g, '+')
    .replace(/−/g, '-')
    .replace(/(\d)\s*[кд]\s*(\d)/gi, '$1d$2')
    .replace(/\s+/g, ' ')
    .trim()

export const parseActionAttackBonus = (text: string): number | null => {
  const cleaned = normalizeActionText(text)
  const beforeHit = cleaned.split(/Попадание:|Hit:/i)[0] ?? cleaned
  const match =
    beforeHit.match(/([+-]?\s*\d+)\s*(?:to hit|к\s*попаданию|к\s*попад|к\s*атаке|к\s*атак)/i) ??
    beforeHit.match(/([+-]\s*\d+)/)
  if (!match) return null
  return Number(match[1].replace(/\s+/g, ''))
}

export const parseActionDamageExpr = (text: string): string | null => {
  const cleaned = normalizeActionText(text)
  const afterHit = cleaned.split(/Попадание:|Hit:/i)[1] ?? ''
  const paren = afterHit.match(/\(([^)]+)\)/)
  if (paren) {
    const diceInParen = paren[1].match(/(\d+\s*d\s*\d+(?:\s*[+-]\s*\d+)?)/i)
    if (diceInParen) return diceInParen[1].replace(/\s+/g, '')
  }
  const hitMatch = afterHit.match(/(\d+\s*d\s*\d+(?:\s*[+-]\s*\d+)?)/i)
  if (hitMatch) return hitMatch[1].replace(/\s+/g, '')
  const diceMatch = cleaned.match(/(\d+\s*d\s*\d+(?:\s*[+-]\s*\d+)?)/i)
  if (!diceMatch) return null
  return diceMatch[1].replace(/\s+/g, '')
}

export const htmlToPlainText = (value: string) =>
  value
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

export const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '')

export const renderInlineTokens = (text: string, keyPrefix: string): ReactNode[] => {
  const tokens = text.split(
    /(\b\d+\s*d\s*\d+(?:\s*[+-]\s*\d+)?\b|\b[кk]\s*\d+\b|\bСл\s*\d+\b|(?:\+|-)\s*\d+\s*к\s*атаке)/gi
  )
  return tokens.map((token, index) => {
    if (!token) return null
    if (/^\b\d+\s*d\s*\d+(?:\s*[+-]\s*\d+)?\b$/i.test(token)) {
      return (
        <span key={`${keyPrefix}-dice-${index}`} className="detail__dice">
          {token.replace(/\s+/g, '')}
        </span>
      )
    }
    if (/^\b[кk]\s*\d+\b$/i.test(token)) {
      return (
        <span key={`${keyPrefix}-die-${index}`} className="detail__dice">
          {token.replace(/\s+/g, '')}
        </span>
      )
    }
    if (/^\bСл\s*\d+\b$/i.test(token)) {
      return (
        <span key={`${keyPrefix}-dc-${index}`} className="detail__dice detail__dice--dc">
          {token.replace(/\s+/g, ' ')}
        </span>
      )
    }
    if (/^(?:\+|-)\s*\d+\s*к\s*атаке$/i.test(token)) {
      return (
        <span key={`${keyPrefix}-atk-${index}`} className="detail__dice detail__dice--atk">
          {token.replace(/\s+/g, ' ')}
        </span>
      )
    }
    return <span key={`${keyPrefix}-text-${index}`}>{token}</span>
  })
}

export const renderInlineMarkdown = (text: string): ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
  return parts.map((part, index) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`inline-${index}`}>{renderInlineTokens(part.slice(2, -2), `strong-${index}`)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`inline-${index}`}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`inline-${index}`}>{renderInlineTokens(part.slice(1, -1), `em-${index}`)}</em>
    }
    return <span key={`inline-${index}`}>{renderInlineTokens(part, `plain-${index}`)}</span>
  })
}

export type SpellcastingTable = {
  headers: string[]
  rows: Array<{
    level: string
    prof: string
    features: string
    slots: string[]
  }>
}

export const normalizeDashToken = (value: string) => {
  const token = value.trim()
  if (/^[—–-]+$/.test(token)) return '—'
  return token
}

export const parseSpellcastingTable = (rawText: string): SpellcastingTable | null => {
  const text = htmlToPlainText(rawText)
    .replace(/вЂ./g, '—')
    .replace(/[＋﹢]/g, '+')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return null

  const rowAnchor = /\b(?:1\d|20|[1-9])\s*\+\d\b/g
  const starts: number[] = []
  for (const match of text.matchAll(rowAnchor)) {
    starts.push(match.index ?? -1)
  }
  if (starts.length < 3) return null

  const slices = starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : text.length
    return text.slice(start, end).trim()
  })

  const rows: SpellcastingTable['rows'] = []
  for (const slice of slices) {
    const open = slice.match(/^((?:1\d|20|[1-9]))\s*(\+\d)\s+(.+)$/)
    if (!open) continue
    const level = open[1]
    const prof = open[2]
    const tail = open[3]
    const tokens = tail.split(/\s+/).filter(Boolean)
    const slotTokens: string[] = []
    let idx = tokens.length - 1
    while (idx >= 0 && slotTokens.length < 14) {
      const token = tokens[idx]
      if (!/^(\d+|[—–-]+)$/.test(token)) break
      slotTokens.unshift(normalizeDashToken(token))
      idx -= 1
    }
    if (slotTokens.length < 8) continue
    const features = tokens.slice(0, idx + 1).join(' ').trim()
    rows.push({
      level,
      prof,
      features: features || '—',
      slots: slotTokens
    })
  }

  if (rows.length < 3) return null

  const maxSlotColumns = rows.reduce(
    (max, row) => (row.slots.length > max ? row.slots.length : max),
    0
  )
  if (maxSlotColumns < 8) return null
  const normalizedRows = rows.map((row) => ({
    ...row,
    slots: row.slots.length < maxSlotColumns
      ? [...row.slots, ...Array.from({ length: maxSlotColumns - row.slots.length }, () => '—')]
      : row.slots
  }))

  const columnHeaders =
    maxSlotColumns === 11
      ? ['Заг.', 'Изв.', '1', '2', '3', '4', '5', '6', '7', '8', '9']
      : maxSlotColumns === 10
        ? ['Заг.', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        : maxSlotColumns === 9
          ? ['1', '2', '3', '4', '5', '6', '7', '8', '9']
          : Array.from({ length: maxSlotColumns }, (_, index) => `Кол.${index + 1}`)

  return {
    headers: ['Ур', 'БМ', 'Умения', ...columnHeaders],
    rows: normalizedRows
  }
}

export const renderSpellcastingTable = (table: SpellcastingTable): ReactNode => (
  <div className="detail-table-wrap">
    <table className="detail-table">
      <thead>
        <tr>
          {table.headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, index) => (
          <tr key={`${row.level}-${index}`}>
            <td>{row.level}</td>
            <td>{row.prof}</td>
            <td className="detail-table__features">{row.features}</td>
            {row.slots.map((slot, slotIndex) => (
              <td key={`${row.level}-${slotIndex}`}>{slot}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const renderFormattedText = (rawText: string): ReactNode => {
  const text = htmlToPlainText(rawText)
    .replace(/\s((?:PHB|XGE|TCE|SCAG|DMG|MM|UA[0-9A-Za-z-]*))\s/g, '\n$1 ')
    .replace(/(\d+\s*[-–]?\s*(?:й|ый|ой)\s+уровень[^.]{0,80})/gi, '\n$1')
    .replace(/\s([а-яa-z]\))/gi, '\n$1')
    .replace(/\s(\d+\))/g, '\n$1')
    .replace(/\s-\s/g, '\n- ')
    .replace(/([.!?])\s+(?=[A-ZА-ЯЁ])/g, '$1\n')
    .replace(/([:;])\s+(?=[A-ZА-ЯЁ])/g, '$1\n')
  if (!text) return null

  const longLineSplit = (line: string): string[] => {
    if (line.length <= 230) return [line]
    const sentences = line.split(/(?<=[.!?])\s+/)
    if (sentences.length <= 1) return [line]
    const chunks: string[] = []
    let current = ''
    for (const sentence of sentences) {
      const candidate = current ? `${current} ${sentence}` : sentence
      if (candidate.length > 220 && current) {
        chunks.push(current.trim())
        current = sentence
      } else {
        current = candidate
      }
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks.length > 0 ? chunks : [line]
  }

  const lines = text
    .split('\n')
    .flatMap((line) => longLineSplit(line.trim()))
    .filter(Boolean)
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let listKind: 'ul' | 'ol' = 'ul'

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    blocks.push(
      <p key={`p-${blocks.length}`} className="detail__paragraph">
        {renderInlineMarkdown(paragraph.join(' ').trim())}
      </p>
    )
    paragraph = []
  }

  const flushList = () => {
    if (list.length === 0) return
    if (listKind === 'ol') {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="detail__list detail__list--ordered">
          {list.map((item, index) => (
            <li key={`li-${blocks.length}-${index}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      )
    } else {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="detail__list">
          {list.map((item, index) => (
            <li key={`li-${blocks.length}-${index}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      )
    }
    list = []
    listKind = 'ul'
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push(
        <h4 key={`h-${blocks.length}`} className="detail__subheading">
          {renderInlineMarkdown(heading[2])}
        </h4>
      )
      continue
    }
    const bullet = line.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      flushParagraph()
      listKind = 'ul'
      list.push(bullet[1])
      continue
    }
    const ordered = line.match(/^(?:\d+|[а-яa-z])\)\s+(.+)$/i)
    if (ordered) {
      flushParagraph()
      listKind = 'ol'
      list.push(ordered[1])
      continue
    }
    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  return blocks
}

export const renderSectionContent = (title: string, content: string): ReactNode => {
  const table = parseSpellcastingTable(content)
  if (table && (/использование заклинаний/i.test(title) || table.rows.length >= 8)) {
    return renderSpellcastingTable(table)
  }
  return renderFormattedText(content)
}

export const getRuleSectionBucket = (title: string): 'base' | 'mechanic' | 'exception' => {
  const lower = title.toLowerCase()
  if (/исключ|особ|огранич|примеч|редк|штраф|запрет/.test(lower)) return 'exception'
  if (/провер|брос|ата|урон|эффект|расч|формул|спас|иници|движ|дистан/.test(lower)) return 'mechanic'
  return 'base'
}

export const injectParagraphBreaks = (raw: string): string => {
  const text = htmlToPlainText(raw).replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length <= 2) return text

  const paragraphs: string[] = []
  let current: string[] = []
  let chars = 0

  for (const sentence of sentences) {
    current.push(sentence)
    chars += sentence.length
    if (current.length >= 3 || chars >= 420) {
      paragraphs.push(current.join(' ').trim())
      current = []
      chars = 0
    }
  }

  if (current.length > 0) {
    paragraphs.push(current.join(' ').trim())
  }

  return paragraphs.join('\n\n')
}

export const buildReferenceSections = (
  rawText: string | null | undefined,
  isClass: boolean
): Array<{ title: string; content: string }> => {
  const text = htmlToPlainText(rawText ?? '')
  if (!text) return []

  const classAnchors = [
    { key: 'хиты', title: 'Хиты' },
    { key: 'владение', title: 'Владения' },
    { key: 'снаряжение', title: 'Снаряжение' },
    { key: 'использование заклинаний', title: 'Использование заклинаний' },
    { key: 'базовая характеристика заклинаний', title: 'Базовая характеристика заклинаний' },
    { key: 'архетип', title: 'Архетипы' },
    { key: 'особенности', title: 'Особенности' }
  ]

  const raceAnchors = [
    { key: 'возраст', title: 'Возраст' },
    { key: 'мировоззрение', title: 'Мировоззрение' },
    { key: 'размер', title: 'Размер' },
    { key: 'скорость', title: 'Скорость' },
    { key: 'языки', title: 'Языки' },
    { key: 'особенности', title: 'Особенности' }
  ]

  const anchors = isClass ? classAnchors : raceAnchors
  const lower = text.toLowerCase()
  const found = anchors
    .map((anchor) => ({ ...anchor, index: lower.indexOf(anchor.key) }))
    .filter((anchor) => anchor.index >= 0)
    .sort((a, b) => a.index - b.index)
    .filter((anchor, index, list) => index === 0 || anchor.index !== list[index - 1].index)

  if (found.length === 0) {
    return [{ title: 'Общее описание', content: injectParagraphBreaks(text) }]
  }

  const sections: Array<{ title: string; content: string }> = []
  const firstIndex = found[0].index
  if (firstIndex > 40) {
    const intro = text.slice(0, firstIndex).trim()
    if (intro) sections.push({ title: 'Общее описание', content: intro })
  }

  for (let i = 0; i < found.length; i += 1) {
    const current = found[i]
    const next = found[i + 1]
    const start = current.index
    const end = next ? next.index : text.length
    const content = injectParagraphBreaks(text.slice(start, end).trim())
    if (!content) continue
    sections.push({ title: current.title, content })
  }

  const merged: Array<{ title: string; content: string }> = []
  for (const section of sections) {
    if (section.content.length < 36 && merged.length > 0) {
      const prev = merged[merged.length - 1]
      prev.content = `${prev.content}\n${section.content}`.trim()
      continue
    }
    merged.push(section)
  }

  return merged.slice(0, 16)
}

export const parseMonsterActions = (data: any): Array<{
  name: string
  text: string
  attackBonus: number | null
  damageExpr: string | null
  saveDc: number | null
  saveAbility: '' | 'СИЛ' | 'ЛВК' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР'
}> => {
  const source = data?.action ?? data?.actions ?? []
  if (!Array.isArray(source)) return []
  return source
    .map((action: any) => {
      const name = action?.name ?? 'Действие'
      const text = Array.isArray(action?.entries)
        ? action.entries.map(extractActionText).join(' ')
        : extractActionText(action)
      const attackBonus = parseActionAttackBonus(text)
      const damageExpr = parseActionDamageExpr(text)
      const saveInfo = parseSaveFromText(text)
      return {
        name,
        text,
        attackBonus,
        damageExpr,
        saveDc: saveInfo.saveDc ? Number(saveInfo.saveDc) : null,
        saveAbility: saveInfo.saveAbility
      }
    })
    .filter((action) => action.text || action.name)
}

export const parseSignedBonus = (value: string): number | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(',', '.').replace('+', '')
  const parsed = Number(normalized)
  if (Number.isNaN(parsed)) return null
  return parsed
}

export const buildCharacterActions = (
  data: any
): Array<{
  name: string
  text: string
  attackBonus: number | null
  damageExpr: string | null
  saveDc: number | null
  saveAbility: '' | 'СИЛ' | 'ЛВК' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР'
}> | undefined => {
  const attacks = data?.sheet?.attacks
  if (!Array.isArray(attacks)) return undefined
  const mapped = attacks
    .map((attack: any) => ({
      name: String(attack?.name ?? '').trim() || 'Атака',
      text: String(attack?.notes ?? '').trim(),
      attackBonus: typeof attack?.attackBonus === 'string' ? parseSignedBonus(attack.attackBonus) : null,
      damageExpr: typeof attack?.damage === 'string' ? attack.damage.trim() : null,
      saveDc: null,
      saveAbility: '' as const
    }))
    .filter((entry) => entry.name || entry.text || entry.damageExpr || entry.attackBonus !== null)
  return mapped.length > 0 ? mapped : undefined
}

export const parseOptionalInt = (value: string): number | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (Number.isNaN(parsed)) return null
  return Math.round(parsed)
}

export const scoreToSaveMod = (score: string): number | null => {
  const parsed = parseOptionalInt(score)
  if (parsed === null) return null
  return Math.floor((parsed - 10) / 2)
}

export const parseNamedMonsterEntries = (raw: string) => {
  return raw
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const normalized = stripHtml(line)
        .replace(/^\s*[-*]\s*/, '')
        .replace(/\s+/g, ' ')
        .trim()
      const match = normalized.match(/^([^:.;]{2,80})[:.]\s*(.+)$/)
      if (match) {
        return {
          name: match[1].trim(),
          entries: [match[2].trim()]
        }
      }
      return {
        name: 'Особенность',
        entries: [normalized]
      }
    })
}

export const toSignedBonus = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed.replace(',', '.'))
  if (Number.isNaN(parsed)) return null
  const rounded = Math.round(parsed)
  return rounded >= 0 ? `+${rounded}` : `${rounded}`
}

export const attackKindLabel: Record<CustomMonsterActionDraft['attackKind'], string> = {
  melee: 'Рукопашная атака оружием',
  ranged: 'Дальнобойная атака оружием',
  spell: 'Атака заклинанием',
  melee_or_ranged: 'Рукопашная или дальнобойная атака оружием'
}

export const parseAttackKindFromText = (
  text: string
): CustomMonsterActionDraft['attackKind'] => {
  const cleaned = stripHtml(text).toLowerCase()
  if (cleaned.includes('или дальнобой')) return 'melee_or_ranged'
  if (cleaned.includes('атака заклинанием')) return 'spell'
  if (cleaned.includes('дальнобой')) return 'ranged'
  return 'melee'
}

export const parseDamageTypeFromText = (text: string): string => {
  const cleaned = stripHtml(text).toLowerCase()
  const match = cleaned.match(
    /\)\s*([а-яёa-z][а-яёa-z\s-]{1,24})\s+урона/i
  )
  if (!match) return ''
  return match[1].trim()
}

export const parseRangeFromText = (text: string): string => {
  const cleaned = stripHtml(text).replace(/\s+/g, ' ').trim()
  const match =
    cleaned.match(/(?:досягаемость|дистанция)\s*:?([^.,;]+)/i) ??
    cleaned.match(/reach|range\s*:?([^.,;]+)/i)
  if (!match) return ''
  return match[1].trim()
}

export const parseTargetFromText = (text: string): string => {
  const cleaned = stripHtml(text).replace(/\s+/g, ' ').trim()
  const match = cleaned.match(/(?:одна|до\s+\d+|каждая|любая)\s+цель[^.,;]*/i)
  if (match) return match[0].trim()
  const matchAlt = cleaned.match(/target[^.,;]*/i)
  if (!matchAlt) return ''
  return matchAlt[0].trim()
}

export const parseSaveFromText = (text: string): {
  saveDc: string
  saveAbility: '' | 'СИЛ' | 'ЛВК' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР'
} => {
  const cleaned = stripHtml(text).replace(/\s+/g, ' ').trim()
  const dcMatch = cleaned.match(/(?:сл|dc)\s*(\d{1,2})/i)
  const abilities: Array<{ key: '' | 'СИЛ' | 'ЛВК' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР'; regex: RegExp }> = [
    { key: 'СИЛ', regex: /сил|strength/i },
    { key: 'ЛВК', regex: /ловк|dexterity/i },
    { key: 'ТЕЛ', regex: /тел|constitution/i },
    { key: 'ИНТ', regex: /инт|intelligence/i },
    { key: 'МДР', regex: /мдр|мудр|wisdom/i },
    { key: 'ХАР', regex: /хар|charisma/i }
  ]
  const ability = abilities.find((item) => item.regex.test(cleaned))?.key ?? ''
  return { saveDc: dcMatch?.[1] ?? '', saveAbility: ability }
}

export const normalizeDamageExpr = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed
    .replace(/[xх×]/gi, 'd')
    .replace(/[＋﹢]/g, '+')
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
  return parseDice(normalized) ? normalized : null
}

export const buildStructuredMonsterActions = (actions: CustomMonsterActionDraft[]) => {
  const filtered = actions
    .map((action) => ({
      ...action,
      name: action.name.trim(),
      rangeText: action.rangeText.trim(),
      targetText: action.targetText.trim(),
      damageType: action.damageType.trim(),
      saveDc: action.saveDc.trim(),
      saveAbility: action.saveAbility,
      saveFailText: action.saveFailText.trim(),
      saveSuccessText: action.saveSuccessText.trim(),
      extraText: action.extraText.trim(),
      attackBonus: toSignedBonus(action.attackBonus),
      damageExpr: normalizeDamageExpr(action.damageExpr)
    }))
    .filter((action) => action.name || action.attackBonus || action.damageExpr || action.extraText)

  const entries = filtered.map((action) => {
    const attackText = action.attackBonus
      ? `${attackKindLabel[action.attackKind]}: ${action.attackBonus} к попаданию${
          action.rangeText ? `, досягаемость/дистанция ${action.rangeText}` : ''
        }${action.targetText ? `, ${action.targetText}` : ''}.`
      : ''
    const damageText = action.damageExpr
      ? `Попадание: (${action.damageExpr}) ${action.damageType || ''} урона.`
      : ''
    const saveText =
      action.saveDc && action.saveAbility
        ? `Цель совершает спасбросок ${action.saveAbility} СЛ ${action.saveDc}.${
            action.saveFailText ? ` При провале: ${action.saveFailText}.` : ''
          }${action.saveSuccessText ? ` При успехе: ${action.saveSuccessText}.` : ''}`
        : ''
    const text = [attackText, damageText, action.extraText].filter(Boolean).join(' ').trim()
    const fullText = [text, saveText].filter(Boolean).join(' ').trim()
    return {
      name: action.name || 'Действие',
      entries: [fullText || 'Описание отсутствует']
    }
  })

  return {
    entries,
    raw: filtered.map((action) => ({
      name: action.name || 'Действие',
      attackKind: action.attackKind,
      attackBonus: action.attackBonus,
      rangeText: action.rangeText,
      targetText: action.targetText,
      damageExpr: action.damageExpr,
      damageType: action.damageType,
      saveDc: action.saveDc,
      saveAbility: action.saveAbility,
      saveFailText: action.saveFailText,
      saveSuccessText: action.saveSuccessText,
      extraText: action.extraText
    }))
  }
}

export const customMonsterActionsFromData = (data: any): CustomMonsterActionDraft[] => {
  if (Array.isArray(data?.custom_actions) && data.custom_actions.length > 0) {
    return data.custom_actions.map((action: any) => ({
      id: `cma-load-${Math.random().toString(36).slice(2, 8)}`,
      name: typeof action?.name === 'string' ? action.name : '',
      attackKind:
        action?.attackKind === 'ranged' ||
        action?.attackKind === 'spell' ||
        action?.attackKind === 'melee_or_ranged'
          ? action.attackKind
          : 'melee',
      attackBonus: typeof action?.attackBonus === 'string' ? action.attackBonus : '',
      rangeText: typeof action?.rangeText === 'string' ? action.rangeText : '',
      targetText: typeof action?.targetText === 'string' ? action.targetText : '',
      damageExpr: typeof action?.damageExpr === 'string' ? action.damageExpr : '',
      damageType: typeof action?.damageType === 'string' ? action.damageType : '',
      saveDc: typeof action?.saveDc === 'string' ? action.saveDc : '',
      saveAbility:
        action?.saveAbility === 'СИЛ' ||
        action?.saveAbility === 'ЛВК' ||
        action?.saveAbility === 'ТЕЛ' ||
        action?.saveAbility === 'ИНТ' ||
        action?.saveAbility === 'МДР' ||
        action?.saveAbility === 'ХАР'
          ? action.saveAbility
          : '',
      saveFailText: typeof action?.saveFailText === 'string' ? action.saveFailText : '',
      saveSuccessText: typeof action?.saveSuccessText === 'string' ? action.saveSuccessText : '',
      extraText: typeof action?.extraText === 'string' ? action.extraText : ''
    }))
  }
  const parsed = parseMonsterActions(data)
  if (parsed.length > 0) {
    return parsed.map((action) => ({
      id: `cma-parse-${Math.random().toString(36).slice(2, 8)}`,
      name: action.name || '',
      attackKind: parseAttackKindFromText(action.text || ''),
      attackBonus: action.attackBonus !== null ? String(action.attackBonus) : '',
      rangeText: parseRangeFromText(action.text || ''),
      targetText: parseTargetFromText(action.text || ''),
      damageExpr: action.damageExpr ?? '',
      damageType: parseDamageTypeFromText(action.text || ''),
      saveDc: parseSaveFromText(action.text || '').saveDc,
      saveAbility: parseSaveFromText(action.text || '').saveAbility,
      saveFailText: '',
      saveSuccessText: '',
      extraText: action.text || ''
    }))
  }
  return [createEmptyCustomMonsterAction()]
}

export const buildCustomMonsterData = (draft: CustomMonsterDraft, actionDrafts: CustomMonsterActionDraft[]) => {
  const parseCommaList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(', ')
  const manualActions = parseNamedMonsterEntries(draft.actionsText)
  const structured = buildStructuredMonsterActions(actionDrafts)
  return {
    size: draft.size || 'Medium',
    type: draft.type.trim(),
    alignment: draft.alignment.trim(),
    ac: draft.ac.trim(),
    hp: draft.hp.trim(),
    speed: draft.speed.trim(),
    cr: draft.cr.trim(),
    str: parseOptionalInt(draft.str),
    dex: parseOptionalInt(draft.dex),
    con: parseOptionalInt(draft.con),
    int: parseOptionalInt(draft.int),
    wis: parseOptionalInt(draft.wis),
    cha: parseOptionalInt(draft.cha),
    senses: draft.senses.trim(),
    languages: draft.languages.trim(),
    save: draft.savesText.trim(),
    skill: draft.skillsText.trim(),
    vulnerable: parseCommaList(draft.vulnerabilities),
    resist: parseCommaList(draft.resistances),
    immune: parseCommaList(draft.immunities),
    conditionImmune: parseCommaList(draft.conditionImmunities),
    saves: {
      str: scoreToSaveMod(draft.str),
      dex: scoreToSaveMod(draft.dex),
      con: scoreToSaveMod(draft.con),
      int: scoreToSaveMod(draft.int),
      wis: scoreToSaveMod(draft.wis),
      cha: scoreToSaveMod(draft.cha)
    },
    trait: parseNamedMonsterEntries(draft.traitsText),
    action: [...structured.entries, ...manualActions],
    custom_actions: structured.raw,
    reaction: parseNamedMonsterEntries(draft.reactionsText),
    legendary: {
      list: parseNamedMonsterEntries(draft.legendaryText)
    },
    lair: {
      list: parseNamedMonsterEntries(draft.lairText)
    }
  }
}

export const customMonsterDataToDraft = (row: { name?: string | null; cr?: string | null; data?: any }): CustomMonsterDraft => {
  const data = row?.data ?? {}
  const toStat = (value: unknown) =>
    typeof value === 'number' ? String(value) : typeof value === 'string' ? value : ''
  const entriesToText = (value: any) => {
    const list = Array.isArray(value) ? value : []
    return list
      .map((entry) => {
        const name = typeof entry?.name === 'string' ? entry.name.trim() : ''
        const text = Array.isArray(entry?.entries)
          ? entry.entries.map((item: any) => extractActionText(item)).join(' ')
          : extractActionText(entry)
        if (name && text) return `${name}: ${text}`
        return text || name
      })
      .filter(Boolean)
      .join('\n')
  }
  return {
    ...emptyCustomMonsterDraft,
    name: row?.name ?? '',
    size: typeof data.size === 'string' && data.size ? data.size : 'Medium',
    type: typeof data.type === 'string' ? data.type : '',
    alignment: typeof data.alignment === 'string' ? data.alignment : '',
    ac: toText(data.ac) === '—' ? '' : toText(data.ac),
    hp: toText(data.hp) === '—' ? '' : toText(data.hp),
    speed: typeof data.speed === 'string' ? data.speed : '',
    cr: row?.cr ?? (typeof data.cr === 'string' ? data.cr : ''),
    str: toStat(data.str),
    dex: toStat(data.dex),
    con: toStat(data.con),
    int: toStat(data.int),
    wis: toStat(data.wis),
    cha: toStat(data.cha),
    senses: typeof data.senses === 'string' ? data.senses : '',
    languages: typeof data.languages === 'string' ? data.languages : '',
    savesText: typeof data.save === 'string' ? data.save : '',
    skillsText: typeof data.skill === 'string' ? data.skill : '',
    vulnerabilities: typeof data.vulnerable === 'string' ? data.vulnerable : '',
    resistances: typeof data.resist === 'string' ? data.resist : '',
    immunities: typeof data.immune === 'string' ? data.immune : '',
    conditionImmunities: typeof data.conditionImmune === 'string' ? data.conditionImmune : '',
    traitsText: entriesToText(data.trait),
    actionsText: Array.isArray(data?.custom_actions) && data.custom_actions.length > 0 ? '' : entriesToText(data.action),
    reactionsText: entriesToText(data.reaction),
    legendaryText: entriesToText(data.legendary?.list),
    lairText: entriesToText(data.lair?.list)
  }
}

export const rollD20 = (bonus: number | null) => {
  const roll = Math.floor(Math.random() * 20) + 1
  const total = roll + (bonus ?? 0)
  return { roll, total, bonus: bonus ?? 0 }
}

export const rollDiceExpr = (expr: string) => {
  const parsed = parseDice(expr)
  if (!parsed) return null
  const rolls = Array.from({ length: parsed.count }, () =>
    Math.floor(Math.random() * parsed.sides) + 1
  )
  const total = rolls.reduce((sum, value) => sum + value, 0) + parsed.modifier
  return { total, rolls, modifier: parsed.modifier }
}

export const rollCriticalDamageExpr = (expr: string) => {
  const parsed = parseDice(expr)
  if (!parsed) return null
  const critCount = parsed.count * 2
  const rolls = Array.from({ length: critCount }, () =>
    Math.floor(Math.random() * parsed.sides) + 1
  )
  const total = rolls.reduce((sum, value) => sum + value, 0) + parsed.modifier
  return { total, rolls, modifier: parsed.modifier, expr: `${critCount}d${parsed.sides}` }
}

export const getD20Tone = (roll: number): CombatLogTone => {
  if (roll === 20) return 'crit'
  if (roll === 1) return 'fail'
  return 'normal'
}

export const formatModifierDetail = (modifier: number) => {
  if (!modifier) return ''
  return modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`
}

export const dicePresets = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', '2d20', '2d6'] as const
export const conditionPresets = [
  'Оглушён',
  'Ослеплён',
  'Очарован',
  'Отравлен',
  'Парализован',
  'Испуган',
  'Сбит с ног',
  'Обездвижен',
  'Незаметен',
  'Удерживаем',
  'Мертв'
] as const
export const effectPresets = ['Горение', 'Кровотечение', 'Благословение', 'Проклятие'] as const

export const ensureCharacterData = (data: any): CharacterData => ({
  inventory: Array.isArray(data?.inventory)
    ? data.inventory
        .filter((entry: any) => typeof entry?.name === 'string' && entry.name.trim())
        .map((entry: any) => ({
          name: String(entry.name).trim(),
          qty: typeof entry?.qty === 'number' && Number.isFinite(entry.qty) ? entry.qty : 1,
          notes: typeof entry?.notes === 'string' ? entry.notes : '',
          category:
            entry?.category === 'item' ||
            entry?.category === 'artifact' ||
            entry?.category === 'weapon' ||
            entry?.category === 'custom_weapon' ||
            entry?.category === 'manual'
              ? entry.category
              : 'manual'
        }))
    : [],
  currency: {
    cp: typeof data?.currency?.cp === 'number' && Number.isFinite(data.currency.cp) ? data.currency.cp : 0,
    sp: typeof data?.currency?.sp === 'number' && Number.isFinite(data.currency.sp) ? data.currency.sp : 0,
    ep: typeof data?.currency?.ep === 'number' && Number.isFinite(data.currency.ep) ? data.currency.ep : 0,
    gp: typeof data?.currency?.gp === 'number' && Number.isFinite(data.currency.gp) ? data.currency.gp : 0,
    pp: typeof data?.currency?.pp === 'number' && Number.isFinite(data.currency.pp) ? data.currency.pp : 0
  },
  spells: Array.isArray(data?.spells)
    ? data.spells.map((entry: any) =>
        typeof entry === 'string' ? { name: entry } : entry
      )
    : [],
  items: Array.isArray(data?.items)
    ? data.items.map((entry: any) =>
        typeof entry === 'string' ? { name: entry } : entry
      )
    : [],
  weapons: Array.isArray(data?.weapons)
    ? data.weapons.map((entry: any) =>
        typeof entry === 'string'
          ? { name: entry, attackBonus: null, damageExpr: null }
          : {
              ...entry,
              attackBonus:
                typeof entry?.attackBonus === 'number' && Number.isFinite(entry.attackBonus)
                  ? entry.attackBonus
                  : null,
              damageExpr:
                typeof entry?.damageExpr === 'string'
                  ? normalizeDamageExpr(entry.damageExpr)
                  : null
            }
      )
    : [],
  artifacts: Array.isArray(data?.artifacts)
    ? data.artifacts.map((entry: any) =>
        typeof entry === 'string' ? { name: entry } : entry
      )
    : [],
  equipment: {
    primaryWeaponKey:
      typeof data?.equipment?.primaryWeaponKey === 'string' &&
      data.equipment.primaryWeaponKey.trim()
        ? data.equipment.primaryWeaponKey
        : null,
    secondaryWeaponKey:
      typeof data?.equipment?.secondaryWeaponKey === 'string' &&
      data.equipment.secondaryWeaponKey.trim()
        ? data.equipment.secondaryWeaponKey
        : null
  },
  ammo: Array.isArray(data?.ammo) ? data.ammo : [],
  notes: typeof data?.notes === 'string' ? data.notes : '',
  combat: {
    hpMax: typeof data?.combat?.hpMax === 'number' ? data.combat.hpMax : null,
    hpCurrent: typeof data?.combat?.hpCurrent === 'number' ? data.combat.hpCurrent : null,
    ac: typeof data?.combat?.ac === 'number' ? data.combat.ac : null,
    speed: typeof data?.combat?.speed === 'number' ? data.combat.speed : null,
    initiativeOverride:
      typeof data?.combat?.initiativeOverride === 'number' ? data.combat.initiativeOverride : null
  },
  stats: {
    str: {
      score: typeof data?.stats?.str?.score === 'number' ? data.stats.str.score : null,
      modOverride:
        typeof data?.stats?.str?.modOverride === 'number' ? data.stats.str.modOverride : null
    },
    dex: {
      score: typeof data?.stats?.dex?.score === 'number' ? data.stats.dex.score : null,
      modOverride:
        typeof data?.stats?.dex?.modOverride === 'number' ? data.stats.dex.modOverride : null
    },
    con: {
      score: typeof data?.stats?.con?.score === 'number' ? data.stats.con.score : null,
      modOverride:
        typeof data?.stats?.con?.modOverride === 'number' ? data.stats.con.modOverride : null
    },
    int: {
      score: typeof data?.stats?.int?.score === 'number' ? data.stats.int.score : null,
      modOverride:
        typeof data?.stats?.int?.modOverride === 'number' ? data.stats.int.modOverride : null
    },
    wis: {
      score: typeof data?.stats?.wis?.score === 'number' ? data.stats.wis.score : null,
      modOverride:
        typeof data?.stats?.wis?.modOverride === 'number' ? data.stats.wis.modOverride : null
    },
    cha: {
      score: typeof data?.stats?.cha?.score === 'number' ? data.stats.cha.score : null,
      modOverride:
        typeof data?.stats?.cha?.modOverride === 'number' ? data.stats.cha.modOverride : null
    }
  },
  saves: {
    str: {
      prof: Boolean(data?.saves?.str?.prof),
      override: typeof data?.saves?.str?.override === 'number' ? data.saves.str.override : null
    },
    dex: {
      prof: Boolean(data?.saves?.dex?.prof),
      override: typeof data?.saves?.dex?.override === 'number' ? data.saves.dex.override : null
    },
    con: {
      prof: Boolean(data?.saves?.con?.prof),
      override: typeof data?.saves?.con?.override === 'number' ? data.saves.con.override : null
    },
    int: {
      prof: Boolean(data?.saves?.int?.prof),
      override: typeof data?.saves?.int?.override === 'number' ? data.saves.int.override : null
    },
    wis: {
      prof: Boolean(data?.saves?.wis?.prof),
      override: typeof data?.saves?.wis?.override === 'number' ? data.saves.wis.override : null
    },
    cha: {
      prof: Boolean(data?.saves?.cha?.prof),
      override: typeof data?.saves?.cha?.override === 'number' ? data.saves.cha.override : null
    }
  },
  skills: {
    acrobatics: {
      prof: Boolean(data?.skills?.acrobatics?.prof),
      override:
        typeof data?.skills?.acrobatics?.override === 'number'
          ? data.skills.acrobatics.override
          : null
    },
    animalHandling: {
      prof: Boolean(data?.skills?.animalHandling?.prof),
      override:
        typeof data?.skills?.animalHandling?.override === 'number'
          ? data.skills.animalHandling.override
          : null
    },
    arcana: {
      prof: Boolean(data?.skills?.arcana?.prof),
      override:
        typeof data?.skills?.arcana?.override === 'number'
          ? data.skills.arcana.override
          : null
    },
    athletics: {
      prof: Boolean(data?.skills?.athletics?.prof),
      override:
        typeof data?.skills?.athletics?.override === 'number'
          ? data.skills.athletics.override
          : null
    },
    deception: {
      prof: Boolean(data?.skills?.deception?.prof),
      override:
        typeof data?.skills?.deception?.override === 'number'
          ? data.skills.deception.override
          : null
    },
    history: {
      prof: Boolean(data?.skills?.history?.prof),
      override:
        typeof data?.skills?.history?.override === 'number'
          ? data.skills.history.override
          : null
    },
    insight: {
      prof: Boolean(data?.skills?.insight?.prof),
      override:
        typeof data?.skills?.insight?.override === 'number'
          ? data.skills.insight.override
          : null
    },
    intimidation: {
      prof: Boolean(data?.skills?.intimidation?.prof),
      override:
        typeof data?.skills?.intimidation?.override === 'number'
          ? data.skills.intimidation.override
          : null
    },
    investigation: {
      prof: Boolean(data?.skills?.investigation?.prof),
      override:
        typeof data?.skills?.investigation?.override === 'number'
          ? data.skills.investigation.override
          : null
    },
    medicine: {
      prof: Boolean(data?.skills?.medicine?.prof),
      override:
        typeof data?.skills?.medicine?.override === 'number'
          ? data.skills.medicine.override
          : null
    },
    nature: {
      prof: Boolean(data?.skills?.nature?.prof),
      override:
        typeof data?.skills?.nature?.override === 'number'
          ? data.skills.nature.override
          : null
    },
    perception: {
      prof: Boolean(data?.skills?.perception?.prof),
      override:
        typeof data?.skills?.perception?.override === 'number'
          ? data.skills.perception.override
          : null
    },
    performance: {
      prof: Boolean(data?.skills?.performance?.prof),
      override:
        typeof data?.skills?.performance?.override === 'number'
          ? data.skills.performance.override
          : null
    },
    persuasion: {
      prof: Boolean(data?.skills?.persuasion?.prof),
      override:
        typeof data?.skills?.persuasion?.override === 'number'
          ? data.skills.persuasion.override
          : null
    },
    religion: {
      prof: Boolean(data?.skills?.religion?.prof),
      override:
        typeof data?.skills?.religion?.override === 'number'
          ? data.skills.religion.override
          : null
    },
    sleightOfHand: {
      prof: Boolean(data?.skills?.sleightOfHand?.prof),
      override:
        typeof data?.skills?.sleightOfHand?.override === 'number'
          ? data.skills.sleightOfHand.override
          : null
    },
    stealth: {
      prof: Boolean(data?.skills?.stealth?.prof),
      override:
        typeof data?.skills?.stealth?.override === 'number'
          ? data.skills.stealth.override
          : null
    },
    survival: {
      prof: Boolean(data?.skills?.survival?.prof),
      override:
        typeof data?.skills?.survival?.override === 'number'
          ? data.skills.survival.override
          : null
    }
  }
})

export const createDefaultCharacterData = (): CharacterData => ensureCharacterData(null)
export const useList = (entity: EntityKey, query: string) => {
  const [data, setData] = useState<ListResponse<ListRow>>(defaultResponse)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    setIsLoading(true)
    setError(null)

    const handle = setTimeout(() => {
      const api = window.beholder[entity]
      api
        .list({ query, limit: 80, offset: 0 })
        .then((response) => {
          if (ignore) return
          setData(response as ListResponse<ListRow>)
          setIsLoading(false)
        })
        .catch((err) => {
          if (ignore) return
          setError(err?.message || 'Ошибка загрузки')
          setIsLoading(false)
        })
    }, 200)

    return () => {
      ignore = true
      clearTimeout(handle)
    }
  }, [entity, query])

  return { data, isLoading, error }
}

export const useDetail = (entity: EntityKey, id: number | null) => {
  const [detail, setDetail] = useState<DetailResponse>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let ignore = false
    if (!id) {
      setDetail(null)
      return
    }

    setIsLoading(true)
    window.beholder[entity]
      .get(id)
      .then((response) => {
        if (ignore) return
        setDetail(response as DetailResponse)
        setIsLoading(false)
      })
      .catch(() => {
        if (ignore) return
        setDetail(null)
        setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [entity, id])

  return { detail, isLoading }
}
