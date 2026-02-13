const fs = require('fs')
const path = require('path')

const inputDir = path.resolve(process.cwd(), 'data', 'ttg')

const classesInput = path.join(inputDir, 'ttg-classes.compact.json')
const racesInput = path.join(inputDir, 'ttg-races.compact.json')
const classesOutput = path.join(inputDir, 'ttg-classes.normalized.json')
const racesOutput = path.join(inputDir, 'ttg-races.normalized.json')

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8')
}

const looksLikeMojibake = (value) =>
  typeof value === 'string' && /[ÐÑ][\u0080-\u00BF]/.test(value)

const fixMojibake = (value) => {
  if (!looksLikeMojibake(value)) return value
  try {
    return Buffer.from(value, 'latin1').toString('utf8')
  } catch {
    return value
  }
}

const cleanText = (value) => {
  if (value === null || value === undefined) return ''
  const fixed = fixMojibake(String(value))
  return fixed
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

const normalizeStringFields = (value) => {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return cleanText(value)
  if (Array.isArray(value)) return value.map(normalizeStringFields)
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = normalizeStringFields(v)
    return out
  }
  return value
}

const parseSpellcastingTable = (rawText) => {
  const text = cleanText(rawText).replace(/\s+/g, ' ').trim()
  if (!text) return null

  const rowAnchor = /\b(?:1\d|20|[1-9])\s*\+\d\b/g
  const starts = []
  for (const match of text.matchAll(rowAnchor)) starts.push(match.index ?? -1)
  if (starts.length < 3) return null

  const slices = starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : text.length
    return text.slice(start, end).trim()
  })

  const rows = []
  for (const slice of slices) {
    const open = slice.match(/^((?:1\d|20|[1-9]))\s*(\+\d)\s+(.+)$/)
    if (!open) continue
    const level = open[1]
    const prof = open[2]
    const tail = open[3]
    const slotTail = tail.match(/((?:\s(?:\d+|[—–-]+)){11})\s*$/)
    if (!slotTail) continue
    const slots = slotTail[1]
      .trim()
      .split(/\s+/)
      .map((token) => (/^[—–-]+$/.test(token) ? '—' : token))
    if (slots.length !== 11) continue
    const features = tail.slice(0, tail.length - slotTail[1].length).trim()
    rows.push({ level, prof, features: features || '—', slots })
  }

  if (rows.length < 3) return null
  return {
    headers: ['Ур', 'БМ', 'Умения', 'Заг.', 'Изв.', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    rows
  }
}

const buildSections = (rawText, kind) => {
  const text = cleanText(rawText)
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
  const anchors = kind === 'class' ? classAnchors : raceAnchors
  const lower = text.toLowerCase()
  const found = anchors
    .map((anchor) => ({ ...anchor, index: lower.indexOf(anchor.key) }))
    .filter((anchor) => anchor.index >= 0)
    .sort((a, b) => a.index - b.index)
    .filter((anchor, i, arr) => i === 0 || anchor.index !== arr[i - 1].index)

  if (found.length === 0) return [{ title: 'Общее описание', content: text }]

  const sections = []
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
    const content = text.slice(start, end).trim()
    if (content) sections.push({ title: current.title, content })
  }

  return sections
}

const normalizeClasses = (classes) =>
  classes.map((entry) => {
    const normalized = normalizeStringFields(entry)
    const sections = buildSections(normalized.description_text, 'class')
    const spellcastingSection = sections.find((section) =>
      section.title.toLowerCase().includes('использование заклинаний')
    )
    const spellcastingTable = spellcastingSection
      ? parseSpellcastingTable(spellcastingSection.content)
      : null

    const archetypes = Array.isArray(normalized.archetypes)
      ? normalized.archetypes.map((archetype) => ({
          ...archetype,
          sections: buildSections(archetype.description_text, 'class')
        }))
      : []

    return {
      ...normalized,
      sections,
      spellcasting_table: spellcastingTable,
      archetypes
    }
  })

const normalizeRaces = (races) =>
  races.map((entry) => {
    const normalized = normalizeStringFields(entry)
    const sections = buildSections(normalized.description_text, 'race')
    const subraces = Array.isArray(normalized.subraces)
      ? normalized.subraces.map((subrace) => ({
          ...subrace,
          sections: buildSections(subrace.description_text, 'race')
        }))
      : []

    return {
      ...normalized,
      sections,
      subraces
    }
  })

const main = () => {
  if (!fs.existsSync(classesInput) || !fs.existsSync(racesInput)) {
    throw new Error('Missing compact TTG files in data/ttg')
  }

  const classes = readJson(classesInput)
  const races = readJson(racesInput)
  const normalizedClasses = normalizeClasses(classes)
  const normalizedRaces = normalizeRaces(races)

  writeJson(classesOutput, normalizedClasses)
  writeJson(racesOutput, normalizedRaces)

  const classesWithArchetypes = normalizedClasses.filter(
    (entry) => Array.isArray(entry.archetypes) && entry.archetypes.length > 0
  ).length
  const racesWithSubraces = normalizedRaces.filter(
    (entry) => Array.isArray(entry.subraces) && entry.subraces.length > 0
  ).length
  const archetypesWithText = normalizedClasses.reduce((sum, entry) => {
    if (!Array.isArray(entry.archetypes)) return sum
    return (
      sum +
      entry.archetypes.filter(
        (archetype) => typeof archetype.description_text === 'string' && archetype.description_text.length > 0
      ).length
    )
  }, 0)

  console.log(`classes: ${normalizedClasses.length}`)
  console.log(`classes_with_archetypes: ${classesWithArchetypes}`)
  console.log(`races: ${normalizedRaces.length}`)
  console.log(`races_with_subraces: ${racesWithSubraces}`)
  console.log(`archetypes_with_text: ${archetypesWithText}`)
  console.log(`written: ${classesOutput}`)
  console.log(`written: ${racesOutput}`)
}

main()
