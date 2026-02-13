const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const getArg = (name, fallback = undefined) => {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return fallback
  const value = process.argv[idx + 1]
  if (!value || value.startsWith('--')) return fallback
  return value
}

const hasFlag = (name) => process.argv.includes(name)

const inputDir = path.resolve(
  getArg('--input', process.env.TTG_OUTPUT_DIR || path.join(process.cwd(), 'output'))
)
const outputDir = path.resolve(
  getArg('--out', path.join(process.cwd(), 'data', 'ttg'))
)
const writeGzip = !hasFlag('--no-gzip')

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const toArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'object') {
    return Object.entries(value).map(([slug, entry]) => {
      if (entry && typeof entry === 'object') return { slug, ...entry }
      return { slug, value: entry }
    })
  }
  return []
}

const cleanText = (value) => {
  if (value === null || value === undefined) return null
  const text = String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&laquo;/gi, '«')
    .replace(/&raquo;/gi, '»')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text || null
}

const cleanHtml = (value) => {
  if (value === null || value === undefined) return null
  const html = String(value).trim()
  return html || null
}

const deepClean = (value, fieldName = null) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    if (fieldName && /_html$/i.test(fieldName)) return cleanHtml(value)
    return cleanText(value)
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => deepClean(entry, fieldName))
      .filter((entry) => entry !== null && entry !== '')
  }
  if (typeof value === 'object') {
    const out = {}
    for (const [key, entry] of Object.entries(value)) {
      const cleaned = deepClean(entry, key)
      if (cleaned !== null && cleaned !== '') out[key] = cleaned
    }
    return out
  }
  return value
}

const pickName = (value) => {
  if (!value) return { ru: null, en: null }
  if (typeof value === 'string') return { ru: null, en: value.trim() || null }
  if (typeof value === 'object') {
    return {
      ru: cleanText(value.rus ?? value.ru ?? null),
      en: cleanText(value.eng ?? value.en ?? value.name ?? null)
    }
  }
  return { ru: null, en: null }
}

const pickSource = (value) => {
  if (!value || typeof value !== 'object') {
    return { short: null, name: null, group: null }
  }
  return {
    short: cleanText(value.shortName),
    name: cleanText(value.name),
    group: cleanText(value.group?.name ?? value.group)
  }
}

const uniqueStrings = (items) => {
  const out = []
  const seen = new Set()
  for (const item of items || []) {
    if (!item || typeof item !== 'string') continue
    const normalized = item.trim()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }
  return out
}

const compactSubclassTab = (entry) => {
  const tabMeta = entry?.tab || {}
  return {
    name: cleanText(tabMeta.name),
    type: cleanText(tabMeta.type),
    order: tabMeta.order ?? null,
    url: cleanText(tabMeta.url),
    raw: Boolean(tabMeta.raw),
    text: cleanText(entry?.text),
    html: cleanHtml(entry?.html),
    abilities: toArray(entry?.abilities)
  }
}

const compactArchetype = (entry) => {
  const api = entry?.api || {}
  const name = pickName(api.name)
  const source = pickSource(api.source)
  const tabs = toArray(entry?.tabs).map(compactSubclassTab)
  const allAbilities = uniqueStrings(tabs.flatMap((tab) => toArray(tab.abilities)))
  const descriptionTab = tabs.find((tab) => tab.type === 'description')

  return {
    slug: cleanText(entry?.slug),
    url: cleanText(api.url ?? entry?.url),
    name_ru: name.ru,
    name_en: name.en,
    source_short: source.short,
    source_name: source.name,
    source_group: source.group,
    description_text: descriptionTab?.text ?? null,
    description_html: descriptionTab?.html ?? null,
    abilities: allAbilities,
    tabs,
    api_full: api
  }
}

const compactClass = (entry) => {
  const api = entry?.api || {}
  const fragment = entry?.fragment || {}
  const name = pickName(api.name)
  const source = pickSource(api.source)

  return {
    slug: cleanText(entry?.slug),
    url: cleanText(api.url ?? entry?.url),
    name_ru: name.ru,
    name_en: name.en,
    source_short: source.short,
    source_name: source.name,
    source_group: source.group,
    hit_die: cleanText(api.dice),
    archetype_label: cleanText(api.archetypeName),
    sidekick: Boolean(api.sidekick),
    description_text: cleanText(fragment.text),
    abilities: fragment.abilities ?? null,
    archetypes: toArray(entry?.archetypes).map(compactArchetype)
  }
}

const compactSubrace = (entry) => {
  const name = pickName(entry?.name)
  const source = pickSource(entry?.source)
  const skills = toArray(entry?.skills).map((skill) => ({
    ...skill,
    description_text: cleanText(skill?.description_text ?? skill?.description),
    description_html: cleanHtml(skill?.description)
  }))

  return {
    name_ru: name.ru,
    name_en: name.en,
    type: cleanText(entry?.type),
    size: cleanText(entry?.size),
    speed: cleanText(entry?.speed),
    speed_raw: entry?.speed ?? null,
    source_short: source.short,
    source_name: source.name,
    source_group: source.group,
    description_text: cleanText(entry?.description_text ?? entry?.description),
    description_html: cleanHtml(entry?.description),
    abilities: entry?.abilities ?? null,
    skills,
    api_full: entry ?? null
  }
}

const compactRace = (entry) => {
  const api = entry?.api || {}
  const name = pickName(api.name)
  const source = pickSource(api.source)
  const skills = toArray(entry?.skills ?? api.skills).map((skill) => ({
    ...skill,
    description_text: cleanText(skill?.description_text ?? skill?.description),
    description_html: cleanHtml(skill?.description)
  }))

  return {
    slug: cleanText(entry?.slug),
    url: cleanText(api.url ?? entry?.url),
    name_ru: name.ru,
    name_en: name.en,
    type: cleanText(api.type),
    size: cleanText(api.size),
    speed: cleanText(api.speed),
    speed_raw: api.speed ?? null,
    darkvision: api.darkvision ?? null,
    source_short: source.short,
    source_name: source.name,
    source_group: source.group,
    description_text: cleanText(entry?.description_text ?? api.description),
    description_html: cleanHtml(api.description),
    abilities: entry?.abilities ?? api.abilities ?? null,
    skills,
    subraces: toArray(entry?.subraces).map(compactSubrace),
    api_full: api
  }
}

const compactRule = (entry) => {
  const api = entry?.api || {}
  const name = pickName(api.name)
  const source = pickSource(api.source)
  return {
    slug: cleanText(entry?.slug),
    url: cleanText(entry?.url),
    name_ru: name.ru,
    name_en: name.en,
    type: cleanText(entry?.type ?? api.type),
    source_short: source.short,
    source_name: source.name,
    source_group: source.group,
    description_text: cleanText(entry?.description_text ?? api.description),
    description_html: cleanHtml(api.description),
    api_full: api
  }
}

const compactScreen = (entry) => {
  const api = entry?.api || {}
  const name = pickName(api.name)
  const children = toArray(entry?.children ?? api.chields)
  return {
    slug: cleanText(entry?.slug),
    url: cleanText(entry?.url ?? api.url),
    name_ru: name.ru,
    name_en: name.en,
    order: api.order ?? null,
    description_text: cleanText(entry?.description_text ?? api.description),
    description_html: cleanHtml(api.description),
    children_count: entry?.children_count ?? children.length,
    children,
    api_full: api
  }
}

const loadInput = () => {
  const fullPath = path.join(inputDir, 'ttg_classes_races.json')
  if (fs.existsSync(fullPath)) {
    const full = readJson(fullPath)
    return {
      generatedAt: full.generated_at ?? null,
      source: full.source ?? null,
      classBooks: toArray(full.class_books || []),
      raceBooks: toArray(full.race_books || []),
      classes: toArray(full.classes),
      races: toArray(full.races),
      rules: toArray(full.rules),
      screens: toArray(full.screens),
      inputFiles: ['ttg_classes_races.json']
    }
  }

  const classesPath = path.join(inputDir, 'classes_partial.json')
  const racesPath = path.join(inputDir, 'races_partial.json')
  if (!fs.existsSync(classesPath) || !fs.existsSync(racesPath)) {
    throw new Error(
      `Input not found. Expected "${fullPath}" or pair "${classesPath}" + "${racesPath}".`
    )
  }

  const classes = readJson(classesPath)
  const races = readJson(racesPath)
  return {
    generatedAt: null,
    source: null,
    classBooks: [],
    raceBooks: [],
    classes: toArray(classes),
    races: toArray(races),
    rules: [],
    screens: [],
    inputFiles: ['classes_partial.json', 'races_partial.json']
  }
}

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

const bytesToMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`

const main = () => {
  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input directory does not exist: ${inputDir}`)
  }
  fs.mkdirSync(outputDir, { recursive: true })

  const loaded = loadInput()
  const compactClasses = loaded.classes.map((entry) => deepClean(compactClass(entry)))
  const compactRaces = loaded.races.map((entry) => deepClean(compactRace(entry)))
  const compactRules = loaded.rules.map((entry) => deepClean(compactRule(entry)))
  const compactScreens = loaded.screens.map((entry) => deepClean(compactScreen(entry)))

  const classesPath = path.join(outputDir, 'ttg-classes.compact.json')
  const racesPath = path.join(outputDir, 'ttg-races.compact.json')
  const rulesPath = path.join(outputDir, 'ttg-rules.compact.json')
  const screensPath = path.join(outputDir, 'ttg-screens.compact.json')
  const summaryPath = path.join(outputDir, 'ttg-summary.json')

  writeJson(classesPath, compactClasses)
  writeJson(racesPath, compactRaces)
  writeJson(rulesPath, compactRules)
  writeJson(screensPath, compactScreens)

  const summary = {
    generated_at: new Date().toISOString(),
    input_dir: inputDir,
    output_dir: outputDir,
    input_files: loaded.inputFiles,
    source: loaded.source,
    source_generated_at: loaded.generatedAt,
    class_books_count: loaded.classBooks.length,
    race_books_count: loaded.raceBooks.length,
    classes_count: compactClasses.length,
    races_count: compactRaces.length,
    rules_count: compactRules.length,
    screens_count: compactScreens.length
  }
  writeJson(summaryPath, summary)

  if (writeGzip) {
    fs.writeFileSync(`${classesPath}.gz`, zlib.gzipSync(fs.readFileSync(classesPath)))
    fs.writeFileSync(`${racesPath}.gz`, zlib.gzipSync(fs.readFileSync(racesPath)))
    fs.writeFileSync(`${rulesPath}.gz`, zlib.gzipSync(fs.readFileSync(rulesPath)))
    fs.writeFileSync(`${screensPath}.gz`, zlib.gzipSync(fs.readFileSync(screensPath)))
  }

  const outFiles = [
    classesPath,
    racesPath,
    rulesPath,
    screensPath,
    summaryPath,
    ...(writeGzip ? [`${classesPath}.gz`, `${racesPath}.gz`, `${rulesPath}.gz`, `${screensPath}.gz`] : [])
  ]
  const outSize = outFiles
    .filter((f) => fs.existsSync(f))
    .reduce((sum, f) => sum + fs.statSync(f).size, 0)
  const inSize = loaded.inputFiles.reduce((sum, file) => {
    const p = path.join(inputDir, file)
    return fs.existsSync(p) ? sum + fs.statSync(p).size : sum
  }, 0)

  console.log('TTG compact done')
  console.log(`Input:  ${bytesToMb(inSize)} (${loaded.inputFiles.join(', ')})`)
  console.log(`Output: ${bytesToMb(outSize)} (${writeGzip ? 'json + gzip' : 'json'})`)
  console.log(`Classes: ${compactClasses.length}, Races: ${compactRaces.length}, Rules: ${compactRules.length}, Screens: ${compactScreens.length}`)
  console.log(`Saved to: ${outputDir}`)
}

try {
  main()
} catch (error) {
  console.error(error.message || error)
  process.exit(1)
}
