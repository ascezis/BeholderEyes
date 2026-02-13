const fs = require('fs')
const path = require('path')
const vm = require('vm')
const Database = require('better-sqlite3')

const root = path.resolve(__dirname, '..')
const assetsDir = path.join(root, 'assets')
const dbPath = path.join(root, 'data', 'beholder.sqlite')

const loadAsset = (filename, globalName) => {
  const filePath = path.join(assetsDir, filename)
  let text = fs.readFileSync(filePath, 'utf8')
  text = text.replace(/^\uFEFF/, '')
  const context = { window: {} }
  vm.createContext(context)
  vm.runInContext(text, context, { timeout: 5000 })
  const data = context.window[globalName]
  if (!Array.isArray(data)) {
    throw new Error(`Expected ${globalName} array in ${filename}`)
  }
  return data
}

const ensureDb = (db) => {
  db.exec(`
    pragma journal_mode = wal;
    pragma foreign_keys = on;

    create table if not exists assets_meta (
      key text primary key,
      value text not null
    );

    create table if not exists monsters (
      id integer primary key,
      name text not null,
      name_ru text,
      source text,
      type text,
      cr text,
      data json not null
    );

    create table if not exists items (
      id integer primary key,
      name text not null,
      name_ru text,
      source text,
      type text,
      rarity integer,
      data json not null
    );

    create table if not exists spells (
      id integer primary key,
      name text not null,
      name_ru text,
      source text,
      level integer,
      school text,
      data json not null
    );

    create table if not exists artifacts (
      id integer primary key,
      name text not null,
      name_ru text,
      source text,
      rarity integer,
      data json not null
    );

    create index if not exists idx_monsters_name on monsters(name);
    create index if not exists idx_monsters_name_ru on monsters(name_ru);
    create index if not exists idx_items_name on items(name);
    create index if not exists idx_items_name_ru on items(name_ru);
    create index if not exists idx_spells_name on spells(name);
    create index if not exists idx_spells_name_ru on spells(name_ru);
    create index if not exists idx_artifacts_name on artifacts(name);
    create index if not exists idx_artifacts_name_ru on artifacts(name_ru);
  `)
}

const sanitize = (value) => {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') return value.trim() || null
  return value
}

const importMonsters = (db) => {
  const monsters = loadAsset('monsters.js', 'allMonsters')
  db.exec('delete from monsters')
  const stmt = db.prepare(`
    insert into monsters (name, name_ru, source, type, cr, data)
    values (@name, @name_ru, @source, @type, @cr, @data)
  `)
  const insertMany = db.transaction((rows) => {
    for (const m of rows) {
      stmt.run({
        name: sanitize(m.name) ?? 'Без имени',
        name_ru: sanitize(m.name_ru) ?? sanitize(m.name),
        source: sanitize(m.source),
        type: sanitize(m.type),
        cr: sanitize(m.cr),
        data: JSON.stringify(m)
      })
    }
  })
  insertMany(monsters)
  return monsters.length
}

const importItems = (db) => {
  const items = loadAsset('items.js', 'allItems')
  db.exec('delete from items')
  const stmt = db.prepare(`
    insert into items (name, name_ru, source, type, rarity, data)
    values (@name, @name_ru, @source, @type, @rarity, @data)
  `)
  const insertMany = db.transaction((rows) => {
    for (const item of rows) {
      const en = item.en || {}
      const ru = item.ru || {}
      stmt.run({
        name: sanitize(en.name) ?? 'Без имени',
        name_ru: sanitize(ru.name),
        source: sanitize(en.source || ru.source),
        type: sanitize(en.type),
        rarity: en.rarity ?? null,
        data: JSON.stringify(item)
      })
    }
  })
  insertMany(items)
  return items.length
}

const importSpells = (db) => {
  const spells = loadAsset('spells.js', 'allSpells')
  db.exec('delete from spells')
  const stmt = db.prepare(`
    insert into spells (name, name_ru, source, level, school, data)
    values (@name, @name_ru, @source, @level, @school, @data)
  `)
  const insertMany = db.transaction((rows) => {
    for (const spell of rows) {
      const en = spell.en || {}
      const ru = spell.ru || {}
      const level = en.level ?? ru.level
      stmt.run({
        name: sanitize(en.name) ?? 'Без имени',
        name_ru: sanitize(ru.name),
        source: sanitize(en.source || ru.source),
        level: level === undefined ? null : Number(level),
        school: sanitize(en.school || ru.school),
        data: JSON.stringify(spell)
      })
    }
  })
  insertMany(spells)
  return spells.length
}

const importArtifacts = (db) => {
  const arts = loadAsset('artifacts.js', 'allArt')
  db.exec('delete from artifacts')
  const stmt = db.prepare(`
    insert into artifacts (name, name_ru, source, rarity, data)
    values (@name, @name_ru, @source, @rarity, @data)
  `)
  const insertMany = db.transaction((rows) => {
    for (const art of rows) {
      const en = art.en || {}
      const ru = art.ru || {}
      stmt.run({
        name: sanitize(en.name) ?? 'Без имени',
        name_ru: sanitize(ru.name),
        source: sanitize(en.source || ru.source),
        rarity: en.rarity ?? null,
        data: JSON.stringify(art)
      })
    }
  })
  insertMany(arts)
  return arts.length
}

const db = new Database(dbPath)
ensureDb(db)

const counts = {
  monsters: importMonsters(db),
  items: importItems(db),
  spells: importSpells(db),
  artifacts: importArtifacts(db)
}

db.prepare('insert or replace into assets_meta (key, value) values (?, ?)').run(
  'assets_imported_at',
  new Date().toISOString()
)

db.close()

console.log('Import complete:', counts)
