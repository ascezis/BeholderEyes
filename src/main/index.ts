import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron'
import { join, dirname } from 'path'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import Database from 'better-sqlite3'

type MonsterRow = {
  id: number
  name: string
  name_ru: string | null
  type: string | null
  cr: string | null
  source: string | null
}

type CustomMonsterRow = {
  id: number
  name: string
  cr: string | null
  updated_at: string
}

type ListPayload = {
  query?: string
  limit?: number
  offset?: number
}

type ListResult<T> = {
  total: number
  items: T[]
}

let db: Database.Database | null = null
let ttgCache: { summary: unknown; classes: unknown[]; races: unknown[]; rules: unknown[] } | null = null
let combatBoardWindow: BrowserWindow | null = null
let referenceWindow: BrowserWindow | null = null
let combatPanelWindow: BrowserWindow | null = null

type WindowState = {
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
}

const getWindowStatePath = (name: string) =>
  join(app.getPath('userData'), `${name}-window-state.json`)

const readWindowState = (name: string): WindowState | null => {
  try {
    const raw = readFileSync(getWindowStatePath(name), 'utf-8')
    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.x !== 'number' ||
      typeof parsed?.y !== 'number' ||
      typeof parsed?.width !== 'number' ||
      typeof parsed?.height !== 'number'
    ) {
      return null
    }
    return {
      x: parsed.x,
      y: parsed.y,
      width: parsed.width,
      height: parsed.height,
      isMaximized: Boolean(parsed?.isMaximized)
    }
  } catch {
    return null
  }
}

const isWindowStateVisible = (state: WindowState) => {
  return screen.getAllDisplays().some((display) => {
    const area = display.workArea
    return (
      state.x + state.width > area.x + 40 &&
      state.x < area.x + area.width - 40 &&
      state.y + state.height > area.y + 40 &&
      state.y < area.y + area.height - 40
    )
  })
}

const saveWindowState = (name: string, win: BrowserWindow) => {
  try {
    const bounds = win.getBounds()
    const payload: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: win.isMaximized()
    }
    writeFileSync(getWindowStatePath(name), JSON.stringify(payload), 'utf-8')
  } catch {
    // ignore
  }
}

const createDefaultCharacterData = () => ({
  inventory: [],
  currency: {
    cp: 0,
    sp: 0,
    ep: 0,
    gp: 0,
    pp: 0
  },
  spells: [],
  items: [],
  artifacts: [],
  ammo: [],
  notes: '',
  combat: {
    hpMax: null,
    hpCurrent: null,
    ac: null,
    speed: null,
    initiativeOverride: null
  },
  stats: {
    str: { score: null, modOverride: null },
    dex: { score: null, modOverride: null },
    con: { score: null, modOverride: null },
    int: { score: null, modOverride: null },
    wis: { score: null, modOverride: null },
    cha: { score: null, modOverride: null }
  },
  saves: {
    str: { prof: false, override: null },
    dex: { prof: false, override: null },
    con: { prof: false, override: null },
    int: { prof: false, override: null },
    wis: { prof: false, override: null },
    cha: { prof: false, override: null }
  },
  skills: {
    acrobatics: { prof: false, override: null },
    animalHandling: { prof: false, override: null },
    arcana: { prof: false, override: null },
    athletics: { prof: false, override: null },
    deception: { prof: false, override: null },
    history: { prof: false, override: null },
    insight: { prof: false, override: null },
    intimidation: { prof: false, override: null },
    investigation: { prof: false, override: null },
    medicine: { prof: false, override: null },
    nature: { prof: false, override: null },
    perception: { prof: false, override: null },
    performance: { prof: false, override: null },
    persuasion: { prof: false, override: null },
    religion: { prof: false, override: null },
    sleightOfHand: { prof: false, override: null },
    stealth: { prof: false, override: null },
    survival: { prof: false, override: null }
  }
})

const mapImportedCharacterTemplate = (raw: any) => {
  if (!raw || raw.version !== 'beholder.character.v1') {
    throw new Error('Неподдерживаемый формат файла персонажа')
  }
  const base = createDefaultCharacterData() as any
  const abilityKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
  for (const key of abilityKeys) {
    const score = raw?.abilities?.[key]?.score
    base.stats[key].score = typeof score === 'number' ? score : null
  }
  for (const key of abilityKeys) {
    const save = raw?.saves?.[key]
    base.saves[key].prof = Boolean(save?.proficient)
    base.saves[key].override =
      typeof save?.bonusOverride === 'number' ? save.bonusOverride : null
  }
  const skillMap: Record<string, string> = {
    acrobatics: 'acrobatics',
    animalHandling: 'animalHandling',
    arcana: 'arcana',
    athletics: 'athletics',
    deception: 'deception',
    history: 'history',
    insight: 'insight',
    intimidation: 'intimidation',
    investigation: 'investigation',
    medicine: 'medicine',
    nature: 'nature',
    perception: 'perception',
    performance: 'performance',
    persuasion: 'persuasion',
    religion: 'religion',
    sleightOfHand: 'sleightOfHand',
    stealth: 'stealth',
    survival: 'survival'
  }
  if (Array.isArray(raw?.skills)) {
    for (const skill of raw.skills) {
      const key = skillMap[String(skill?.key ?? '')]
      if (!key || !base.skills[key]) continue
      base.skills[key].prof = Boolean(skill?.proficient || skill?.expertise)
      base.skills[key].override =
        typeof skill?.bonusOverride === 'number' ? skill.bonusOverride : null
    }
  }
  base.combat.ac =
    typeof raw?.core?.armorClass === 'number' ? raw.core.armorClass : null
  base.combat.hpMax =
    typeof raw?.core?.hitPointsMax === 'number' ? raw.core.hitPointsMax : null
  base.combat.hpCurrent =
    typeof raw?.core?.hitPointsCurrent === 'number' ? raw.core.hitPointsCurrent : null
  base.combat.speed =
    typeof raw?.core?.speed === 'string'
      ? Number.parseInt(raw.core.speed, 10) || null
      : null
  base.combat.initiativeOverride =
    typeof raw?.core?.initiative === 'number' ? raw.core.initiative : null

  base.inventory = Array.isArray(raw?.equipment?.inventory)
    ? raw.equipment.inventory
        .filter((item: any) => typeof item?.name === 'string' && item.name.trim())
        .map((item: any) => ({
          name: String(item.name).trim(),
          qty: typeof item?.qty === 'number' ? item.qty : 1,
          notes: typeof item?.notes === 'string' ? item.notes : ''
        }))
    : []
  base.currency = {
    cp: typeof raw?.equipment?.currency?.cp === 'number' ? raw.equipment.currency.cp : 0,
    sp: typeof raw?.equipment?.currency?.sp === 'number' ? raw.equipment.currency.sp : 0,
    ep: typeof raw?.equipment?.currency?.ep === 'number' ? raw.equipment.currency.ep : 0,
    gp: typeof raw?.equipment?.currency?.gp === 'number' ? raw.equipment.currency.gp : 0,
    pp: typeof raw?.equipment?.currency?.pp === 'number' ? raw.equipment.currency.pp : 0
  }
  base.spells = Array.isArray(raw?.spellcasting?.spellsKnown)
    ? raw.spellcasting.spellsKnown
        .filter((spell: any) => typeof spell?.name === 'string' && spell.name.trim())
        .map((spell: any) => ({
          name: String(spell.name).trim(),
          summary: [spell?.prepared ? 'подготовлено' : '', spell?.notes ?? '']
            .filter(Boolean)
            .join(' · ')
        }))
    : []

  const notesParts = [
    raw?.traits?.featuresAndTraits,
    raw?.traits?.proficiencies,
    raw?.traits?.languages,
    raw?.traits?.personalityTraits,
    raw?.traits?.ideals,
    raw?.traits?.bonds,
    raw?.traits?.flaws,
    raw?.traits?.backstory
  ].filter((part) => typeof part === 'string' && part.trim())
  base.notes = notesParts.join('\n\n')

  base.sheet = raw

  return {
    name: String(raw?.identity?.name ?? '').trim(),
    race: String(raw?.identity?.race ?? '').trim() || null,
    className: String(raw?.identity?.className ?? '').trim() || null,
    level:
      typeof raw?.identity?.level === 'number' && raw.identity.level > 0
        ? raw.identity.level
        : null,
    data: base
  }
}

const getDbPath = (): string => {
  if (app.isPackaged) {
    return join(app.getPath('userData'), 'beholder.sqlite')
  }
  return join(app.getAppPath(), 'data', 'beholder.sqlite')
}

const ensureDbFile = (): { path: string; shouldCreate: boolean } => {
  const targetPath = getDbPath()
  if (existsSync(targetPath)) {
    return { path: targetPath, shouldCreate: false }
  }

  mkdirSync(dirname(targetPath), { recursive: true })
  const bundledPath = join(app.getAppPath(), 'data', 'beholder.sqlite')
  if (existsSync(bundledPath)) {
    try {
      copyFileSync(bundledPath, targetPath)
      return { path: targetPath, shouldCreate: false }
    } catch {
      // Fall through to create an empty database.
    }
  }

  return { path: targetPath, shouldCreate: true }
}

const getDb = (): Database.Database => {
  if (!db) {
    const { path, shouldCreate } = ensureDbFile()
    db = new Database(path, { fileMustExist: !shouldCreate })
    db.exec(`
      pragma journal_mode = wal;
      pragma foreign_keys = on;

      create table if not exists campaigns (
        id integer primary key,
        name text not null,
        created_at text not null,
        updated_at text not null
      );

      create table if not exists characters (
        id integer primary key,
        campaign_id integer not null,
        name text not null,
        race text,
        class text,
        level integer,
        data json not null,
        created_at text not null,
        updated_at text not null,
        foreign key (campaign_id) references campaigns(id) on delete cascade
      );

      create index if not exists idx_characters_campaign on characters(campaign_id);
      create index if not exists idx_characters_name on characters(name);

      create table if not exists combats (
        id integer primary key,
        campaign_id integer not null,
        name text not null,
        data json not null,
        created_at text not null,
        updated_at text not null,
        foreign key (campaign_id) references campaigns(id) on delete cascade
      );

      create index if not exists idx_combats_campaign on combats(campaign_id);

      create table if not exists custom_monsters (
        id integer primary key,
        campaign_id integer not null,
        name text not null,
        cr text,
        data json not null,
        created_at text not null,
        updated_at text not null,
        foreign key (campaign_id) references campaigns(id) on delete cascade
      );

      create index if not exists idx_custom_monsters_campaign on custom_monsters(campaign_id);
      create index if not exists idx_custom_monsters_name on custom_monsters(name);
    `)
  }
  return db
}

const getTtgCandidates = (filename: string): string[] => {
  const appPath = app.getAppPath()
  return [
    join(appPath, 'data', 'ttg', filename),
    join(process.cwd(), 'data', 'ttg', filename),
    join(app.getPath('userData'), 'ttg', filename)
  ]
}

const readFirstExistingJson = <T>(...filenames: string[]): T => {
  for (const filename of filenames) {
    const candidates = getTtgCandidates(filename)
    for (const filePath of candidates) {
      if (!existsSync(filePath)) continue
      const text = readFileSync(filePath, 'utf-8')
      return JSON.parse(text) as T
    }
  }
  throw new Error(`TTG file not found: ${filenames.join(', ')}`)
}

const getTtgData = (): { summary: unknown; classes: unknown[]; races: unknown[]; rules: unknown[] } => {
  if (ttgCache) return ttgCache
  const summary = readFirstExistingJson<unknown>('ttg-summary.json')
  const classes = readFirstExistingJson<unknown[]>(
    'ttg-classes.normalized.json',
    'ttg-classes.compact.json'
  )
  const races = readFirstExistingJson<unknown[]>(
    'ttg-races.normalized.json',
    'ttg-races.compact.json'
  )
  const rules = readFirstExistingJson<unknown[]>(
    'ttg-rules.normalized.json',
    'ttg-rules.compact.json'
  )
  ttgCache = { summary, classes, races, rules }
  return ttgCache
}

const clampLimit = (value?: number): number => Math.min(value ?? 50, 200)

const buildSearchWhere = (columns: string[], tokens: string[]) => {
  const normalizedColumns = columns.map((col) => `lower(coalesce(${col}, ''))`)
  const clauses = tokens.map(
    () => `(${normalizedColumns.map((col) => `${col} like ?`).join(' or ')})`
  )
  const where = clauses.join(' and ')
  const params = tokens.flatMap((token) =>
    normalizedColumns.map(() => `%${token.toLowerCase()}%`)
  )
  return { where, params }
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, ' ')
    .trim()

const tokenizeText = (value: string) => normalizeText(value).split(/\s+/).filter(Boolean)

const levenshteinLimited = (a: string, b: string, max: number) => {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const v0 = new Array(b.length + 1).fill(0)
  const v1 = new Array(b.length + 1).fill(0)
  for (let i = 0; i <= b.length; i += 1) v0[i] = i
  for (let i = 0; i < a.length; i += 1) {
    v1[0] = i + 1
    let min = v1[0]
    for (let j = 0; j < b.length; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost)
      if (v1[j + 1] < min) min = v1[j + 1]
    }
    if (min > max) return max + 1
    for (let j = 0; j <= b.length; j += 1) v0[j] = v1[j]
  }
  return v0[b.length]
}

const fuzzyScore = (tokens: string[], haystack: string) => {
  const words = tokenizeText(haystack)
  if (words.length === 0) return null
  let score = 0
  for (const token of tokens) {
    if (!token) continue
    let best = Infinity
    for (const word of words) {
      if (word.startsWith(token)) {
        best = 0
        break
      }
      if (word.includes(token)) {
        best = Math.min(best, 1)
        continue
      }
      const dist = levenshteinLimited(token, word, 2)
      if (dist <= 2) best = Math.min(best, dist + 1)
    }
    if (best === Infinity) return null
    score += best
  }
  return score
}

const listWithQuery = <T>(
  dbRef: Database.Database,
  sqlBase: string,
  sqlQuery: string,
  payload?: ListPayload,
  searchColumns: string[] = ['name', 'name_ru'],
  fuzzySearchSql?: string,
  fuzzyColumns: string[] = searchColumns
): ListResult<T> => {
  const query = payload?.query?.trim() ?? ''
  const limit = clampLimit(payload?.limit)
  const offset = payload?.offset ?? 0

  if (!query) {
    const total = dbRef.prepare(`select count(*) as count from ${sqlBase}`).get() as {
      count: number
    }
    const rows = dbRef
      .prepare(`${sqlQuery} order by name limit ? offset ?`)
      .all(limit, offset) as T[]
    return { total: total.count, items: rows }
  }

  const tokens = query.split(/\s+/).filter(Boolean)
  const { where, params } = buildSearchWhere(searchColumns, tokens)
  const total = dbRef
    .prepare(`select count(*) as count from ${sqlBase} where ${where}`)
    .get(...params) as { count: number }
  const rows = dbRef
    .prepare(`${sqlQuery} where ${where} order by name limit ? offset ?`)
    .all(...params, limit, offset) as T[]
  if (total.count > 0 || !fuzzySearchSql) {
    return { total: total.count, items: rows }
  }

  const allRows = dbRef.prepare(fuzzySearchSql).all() as Array<Record<string, unknown>>
  const scored = allRows
    .map((row) => {
      const haystack = fuzzyColumns
        .map((col) => (row[col] ? String(row[col]) : ''))
        .join(' ')
      const score = fuzzyScore(tokens, haystack)
      return score === null ? null : { row, score }
    })
    .filter(Boolean) as Array<{ row: Record<string, unknown>; score: number }>

  scored.sort((a, b) => a.score - b.score)
  const items = scored.slice(0, limit).map(({ row }) => {
    const { data_json, ...rest } = row
    return rest as T
  })
  return { total: scored.length, items }
}

const getById = <T>(dbRef: Database.Database, table: string, id: number): T | null => {
  const row = dbRef
    .prepare(`select *, data as data_json from ${table} where id = ?`)
    .get(id) as (T & { data_json?: string }) | undefined
  if (!row) return null
  if (row.data_json && typeof row.data_json === 'string') {
    try {
      return { ...row, data: JSON.parse(row.data_json) }
    } catch {
      return { ...row, data: row.data_json }
    }
  }
  return row as T
}

const registerIpc = (): void => {
  ipcMain.handle('monsters:list', (_event, payload?: ListPayload) => {
    const dbRef = getDb()
    return listWithQuery<MonsterRow>(
      dbRef,
      'monsters',
      'select id, name, name_ru, type, cr, source from monsters',
      payload,
      ['name', 'name_ru', 'type', 'cr', 'source', 'data'],
      'select id, name, name_ru, type, cr, source, data as data_json from monsters',
      ['name', 'name_ru', 'type', 'cr', 'source', 'data_json']
    )
  })

  ipcMain.handle('spells:list', (_event, payload?: ListPayload) => {
    const dbRef = getDb()
    return listWithQuery(
      dbRef,
      'spells',
      'select id, name, name_ru, school, level, source from spells',
      payload,
      ['name', 'name_ru', 'school', 'level', 'source', 'data'],
      'select id, name, name_ru, school, level, source, data as data_json from spells',
      ['name', 'name_ru', 'school', 'level', 'source', 'data_json']
    )
  })

  ipcMain.handle('items:list', (_event, payload?: ListPayload) => {
    const dbRef = getDb()
    return listWithQuery(
      dbRef,
      'items',
      'select id, name, name_ru, type, rarity, source from items',
      payload,
      ['name', 'name_ru', 'type', 'rarity', 'source', 'data'],
      'select id, name, name_ru, type, rarity, source, data as data_json from items',
      ['name', 'name_ru', 'type', 'rarity', 'source', 'data_json']
    )
  })

  ipcMain.handle('artifacts:list', (_event, payload?: ListPayload) => {
    const dbRef = getDb()
    return listWithQuery(
      dbRef,
      'artifacts',
      'select id, name, name_ru, rarity, source from artifacts',
      payload,
      ['name', 'name_ru', 'rarity', 'source', 'data'],
      'select id, name, name_ru, rarity, source, data as data_json from artifacts',
      ['name', 'name_ru', 'rarity', 'source', 'data_json']
    )
  })

  ipcMain.handle('monsters:get', (_event, id: number) => {
    const dbRef = getDb()
    return getById(dbRef, 'monsters', id)
  })

  ipcMain.handle(
    'customMonsters:list',
    (_event, payload: { campaignId: number; query?: string; limit?: number; offset?: number }) => {
      const dbRef = getDb()
      const query = payload?.query?.trim() ?? ''
      const limit = clampLimit(payload?.limit)
      const offset = payload?.offset ?? 0

      if (!query) {
        const total = dbRef
          .prepare('select count(*) as count from custom_monsters where campaign_id = ?')
          .get(payload.campaignId) as { count: number }
        const items = dbRef
          .prepare(
            'select id, name, cr, updated_at from custom_monsters where campaign_id = ? order by updated_at desc limit ? offset ?'
          )
          .all(payload.campaignId, limit, offset) as CustomMonsterRow[]
        return { total: total.count, items }
      }

      const tokens = query.split(/\s+/).filter(Boolean)
      const { where, params } = buildSearchWhere(['name', 'cr', 'data'], tokens)
      const total = dbRef
        .prepare(
          `select count(*) as count from custom_monsters where campaign_id = ? and ${where}`
        )
        .get(payload.campaignId, ...params) as { count: number }
      const items = dbRef
        .prepare(
          `select id, name, cr, updated_at from custom_monsters where campaign_id = ? and ${where} order by updated_at desc limit ? offset ?`
        )
        .all(payload.campaignId, ...params, limit, offset) as CustomMonsterRow[]
      if (total.count > 0) {
        return { total: total.count, items }
      }
      const rows = dbRef
        .prepare(
          'select id, name, cr, updated_at, data as data_json from custom_monsters where campaign_id = ?'
        )
        .all(payload.campaignId) as Array<Record<string, unknown>>
      const scored = rows
        .map((row) => {
          const haystack = [
            row.name ? String(row.name) : '',
            row.cr ? String(row.cr) : '',
            row.data_json ? String(row.data_json) : ''
          ].join(' ')
          const score = fuzzyScore(tokens, haystack)
          return score === null ? null : { row, score }
        })
        .filter(Boolean) as Array<{ row: Record<string, unknown>; score: number }>
      scored.sort((a, b) => a.score - b.score)
      const fuzzyItems = scored.slice(0, limit).map(({ row }) => {
        const { data_json, ...rest } = row
        return rest as CustomMonsterRow
      })
      return { total: scored.length, items: fuzzyItems }
    }
  )

  ipcMain.handle('customMonsters:get', (_event, id: number) => {
    const dbRef = getDb()
    const row = dbRef
      .prepare('select id, campaign_id, name, cr, data as data_json from custom_monsters where id = ?')
      .get(id) as any
    if (!row) return null
    return {
      id: row.id,
      campaignId: row.campaign_id,
      name: row.name,
      cr: row.cr,
      data: row.data_json ? JSON.parse(row.data_json) : null
    }
  })

  ipcMain.handle(
    'customMonsters:create',
    (
      _event,
      payload: { campaignId: number; name: string; cr?: string | null; data: unknown }
    ) => {
      const dbRef = getDb()
      const now = new Date().toISOString()
      const result = dbRef
        .prepare(
          'insert into custom_monsters (campaign_id, name, cr, data, created_at, updated_at) values (?, ?, ?, ?, ?, ?)'
        )
        .run(
          payload.campaignId,
          payload.name,
          payload.cr ?? null,
          JSON.stringify(payload.data ?? {}),
          now,
          now
        )
      return { id: Number(result.lastInsertRowid) }
    }
  )

  ipcMain.handle(
    'customMonsters:update',
    (
      _event,
      payload: { id: number; name: string; cr?: string | null; data: unknown }
    ) => {
      const dbRef = getDb()
      const now = new Date().toISOString()
      dbRef
        .prepare('update custom_monsters set name = ?, cr = ?, data = ?, updated_at = ? where id = ?')
        .run(payload.name, payload.cr ?? null, JSON.stringify(payload.data ?? {}), now, payload.id)
      return { ok: true }
    }
  )

  ipcMain.handle('customMonsters:delete', (_event, id: number) => {
    const dbRef = getDb()
    dbRef.prepare('delete from custom_monsters where id = ?').run(id)
    return { ok: true }
  })

  ipcMain.handle('spells:get', (_event, id: number) => {
    const dbRef = getDb()
    return getById(dbRef, 'spells', id)
  })

  ipcMain.handle('items:get', (_event, id: number) => {
    const dbRef = getDb()
    return getById(dbRef, 'items', id)
  })

  ipcMain.handle('artifacts:get', (_event, id: number) => {
    const dbRef = getDb()
    return getById(dbRef, 'artifacts', id)
  })

  ipcMain.handle('ttg:getAll', () => {
    return getTtgData()
  })

  ipcMain.handle('campaign:get', () => {
    const dbRef = getDb()
    const row = dbRef.prepare('select * from campaigns limit 1').get()
    return row ?? null
  })

  ipcMain.handle('campaign:create', (_event, name: string) => {
    const dbRef = getDb()
    const now = new Date().toISOString()
    const existing = dbRef.prepare('select id from campaigns limit 1').get() as
      | { id: number }
      | undefined
    if (existing) return existing
    const result = dbRef
      .prepare('insert into campaigns (name, created_at, updated_at) values (?, ?, ?)')
      .run(name, now, now)
    return { id: Number(result.lastInsertRowid) }
  })

  ipcMain.handle('characters:list', (_event, campaignId: number) => {
    const dbRef = getDb()
    return dbRef
      .prepare(
        'select id, name, race, class, level, data as data_json from characters where campaign_id = ? order by name'
      )
      .all(campaignId)
      .map((row: any) => ({
        ...row,
        data: row.data_json ? JSON.parse(row.data_json) : null
      }))
  })

  ipcMain.handle('characters:get', (_event, id: number) => {
    const dbRef = getDb()
    const row = dbRef
      .prepare(
        'select id, name, race, class, level, data as data_json from characters where id = ?'
      )
      .get(id) as any
    if (!row) return null
    return { ...row, data: row.data_json ? JSON.parse(row.data_json) : null }
  })

  ipcMain.handle(
    'characters:create',
    (
      _event,
      payload: {
        campaignId: number
        name: string
        race?: string
        class?: string
        level?: number
      }
    ) => {
      const dbRef = getDb()
      const now = new Date().toISOString()
      const data = createDefaultCharacterData()
      const result = dbRef
        .prepare(
          'insert into characters (campaign_id, name, race, class, level, data, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .run(
          payload.campaignId,
          payload.name,
          payload.race ?? null,
          payload.class ?? null,
          payload.level ?? null,
          JSON.stringify(data),
          now,
          now
        )
      return { id: Number(result.lastInsertRowid) }
    }
  )

  ipcMain.handle('characters:import', async (_event, campaignId: number) => {
    const dialogResult = await dialog.showOpenDialog({
      title: 'Импорт персонажа (JSON)',
      properties: ['openFile'],
      filters: [{ name: 'Beholder Character JSON', extensions: ['json'] }]
    })
    if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
      return { canceled: true as const }
    }
    const filePath = dialogResult.filePaths[0]
    try {
      const rawText = readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(rawText)
      const mapped = mapImportedCharacterTemplate(parsed)
      if (!mapped.name) {
        throw new Error('В файле не указано имя персонажа')
      }
      const dbRef = getDb()
      const now = new Date().toISOString()
      const result = dbRef
        .prepare(
          'insert into characters (campaign_id, name, race, class, level, data, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .run(
          campaignId,
          mapped.name,
          mapped.race,
          mapped.className,
          mapped.level,
          JSON.stringify(mapped.data),
          now,
          now
        )
      return {
        canceled: false as const,
        id: Number(result.lastInsertRowid),
        name: mapped.name
      }
    } catch (error: any) {
      return {
        canceled: false as const,
        error: error?.message ?? 'Не удалось импортировать персонажа'
      }
    }
  })

  ipcMain.handle(
    'characters:updateData',
    (_event, payload: { id: number; data: unknown }) => {
      const dbRef = getDb()
      const now = new Date().toISOString()
      dbRef
        .prepare('update characters set data = ?, updated_at = ? where id = ?')
        .run(JSON.stringify(payload.data ?? {}), now, payload.id)
      return { ok: true }
    }
  )

  ipcMain.handle(
    'characters:updateBase',
    (
      _event,
      payload: { id: number; name: string; race?: string; class?: string; level?: number }
    ) => {
      const dbRef = getDb()
      const now = new Date().toISOString()
      dbRef
        .prepare(
          'update characters set name = ?, race = ?, class = ?, level = ?, updated_at = ? where id = ?'
        )
        .run(
          payload.name,
          payload.race ?? null,
          payload.class ?? null,
          payload.level ?? null,
          now,
          payload.id
        )
      return { ok: true }
    }
  )

  ipcMain.handle('combats:list', (_event, campaignId: number) => {
    const dbRef = getDb()
    return dbRef
      .prepare('select id, name, updated_at from combats where campaign_id = ? order by updated_at desc')
      .all(campaignId)
  })

  ipcMain.handle(
    'combats:save',
    (
      _event,
      payload: { campaignId: number; name: string; data: unknown; combatId?: number }
    ) => {
      const dbRef = getDb()
      const now = new Date().toISOString()
      if (payload.combatId) {
        dbRef
          .prepare('update combats set name = ?, data = ?, updated_at = ? where id = ?')
          .run(payload.name, JSON.stringify(payload.data ?? {}), now, payload.combatId)
        return { id: payload.combatId }
      }
      const result = dbRef
        .prepare(
          'insert into combats (campaign_id, name, data, created_at, updated_at) values (?, ?, ?, ?, ?)'
        )
        .run(payload.campaignId, payload.name, JSON.stringify(payload.data ?? {}), now, now)
      return { id: Number(result.lastInsertRowid) }
    }
  )

  ipcMain.handle('combats:get', (_event, id: number) => {
    const dbRef = getDb()
    const row = dbRef.prepare('select id, name, data as data_json from combats where id = ?').get(id) as any
    if (!row) return null
    return { ...row, data: row.data_json ? JSON.parse(row.data_json) : null }
  })
  ipcMain.handle('combats:export', async (_event, id: number) => {
    const dbRef = getDb()
    const row = dbRef
      .prepare('select id, name, data as data_json from combats where id = ?')
      .get(id) as any
    if (!row) throw new Error('Combat not found')
    const dialogResult = await dialog.showSaveDialog({
      title: 'Export Combat',
                  defaultPath: (row.name || 'combat') + '.json',
     
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (dialogResult.canceled || !dialogResult.filePath) {
      return { ok: false, canceled: true }
    }
    const payload = {
      name: row.name,
      data: row.data_json ? JSON.parse(row.data_json) : null
    }
    writeFileSync(dialogResult.filePath, JSON.stringify(payload, null, 2), 'utf-8')
    return { ok: true }
  })

  ipcMain.handle('combats:import', async (_event, campaignId: number) => {
    const dialogResult = await dialog.showOpenDialog({
      title: 'Import Combat',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }
    const filePath = dialogResult.filePaths[0]
    const text = readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(text)
    const name = typeof parsed?.name === 'string' ? parsed.name : 'Imported Combat'
    const data = parsed?.data ?? parsed
    const dbRef = getDb()
    const now = new Date().toISOString()
    const result = dbRef
      .prepare(
        'insert into combats (campaign_id, name, data, created_at, updated_at) values (?, ?, ?, ?, ?)'
      )
      .run(campaignId, name, JSON.stringify(data ?? {}), now, now)
    return { ok: true, id: Number(result.lastInsertRowid) }
  })

  ipcMain.handle('combatBoard:open', () => {
    createCombatBoardWindow()
    return { ok: true }
  })

  ipcMain.handle('referenceWindow:open', () => {
    createReferenceWindow()
    return { ok: true }
  })

  ipcMain.handle('combatPanel:open', () => {
    createCombatPanelWindow()
    return { ok: true }
  })
}

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "Beholder Eye's",
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const createCombatBoardWindow = (): void => {
  if (combatBoardWindow) {
    combatBoardWindow.focus()
    return
  }
  const savedState = readWindowState('combat-board')
  const useState = savedState && isWindowStateVisible(savedState) ? savedState : null
  combatBoardWindow = new BrowserWindow({
    width: useState?.width ?? 1440,
    height: useState?.height ?? 900,
    x: useState?.x,
    y: useState?.y,
    minWidth: 1024,
    minHeight: 700,
    title: "Beholder Eye's — Combat Board",
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true
    }
  })
  if (useState?.isMaximized) {
    combatBoardWindow.maximize()
  }


  combatBoardWindow.on('close', () => {
    if (combatBoardWindow) {
      saveWindowState('combat-board', combatBoardWindow)
    }
  })

  combatBoardWindow.on('closed', () => {
    combatBoardWindow = null
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    combatBoardWindow.loadURL(
      `${process.env.VITE_DEV_SERVER_URL}?mode=combat-board`
    )
  } else {
    combatBoardWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { mode: 'combat-board' }
    })
  }
}

const createReferenceWindow = (): void => {
  if (referenceWindow) {
    referenceWindow.focus()
    return
  }
  const savedState = readWindowState('reference')
  const useState = savedState && isWindowStateVisible(savedState) ? savedState : null
  referenceWindow = new BrowserWindow({
    width: useState?.width ?? 1200,
    height: useState?.height ?? 800,
    x: useState?.x,
    y: useState?.y,
    minWidth: 960,
    minHeight: 700,
    title: "Beholder Eye's - Reference",
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true
    }
  })

  if (useState?.isMaximized) {
    referenceWindow.maximize()
  }

  referenceWindow.on('close', () => {
    if (referenceWindow) {
      saveWindowState('reference', referenceWindow)
    }
  })

  referenceWindow.on('closed', () => {
    referenceWindow = null
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    referenceWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}?mode=reference-window`)
  } else {
    referenceWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { mode: 'reference-window' }
    })
  }
}


const createCombatPanelWindow = (): void => {
  if (combatPanelWindow) {
    combatPanelWindow.focus()
    return
  }
  const savedState = readWindowState('combat-panel')
  const useState = savedState && isWindowStateVisible(savedState) ? savedState : null
  combatPanelWindow = new BrowserWindow({
    width: useState?.width ?? 520,
    height: useState?.height ?? 900,
    x: useState?.x,
    y: useState?.y,
    minWidth: 420,
    minHeight: 700,
    title: "Beholder Eye's - Combat Panel",
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true
    }
  })

  if (useState?.isMaximized) {
    combatPanelWindow.maximize()
  }

  combatPanelWindow.on('close', () => {
    if (combatPanelWindow) {
      saveWindowState('combat-panel', combatPanelWindow)
    }
  })

  combatPanelWindow.on('closed', () => {
    combatPanelWindow = null
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    combatPanelWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}?mode=combat-panel`)
  } else {
    combatPanelWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { mode: 'combat-panel' }
    })
  }
}

app.whenReady().then(() => {
  createWindow()
  registerIpc()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})






