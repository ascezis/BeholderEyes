const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.resolve(__dirname, '..')
const assetsDir = path.join(root, 'assets')
const outputPath = path.join(root, 'data', 'weapons.json')

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

const isWeaponItem = (item) => {
  const en = item?.en || {}
  const ru = item?.ru || {}
  const raw = [en.type, ru.type, en.typeAdditions, ru.typeAdditions, en.name, ru.name]
    .map((value) => (typeof value === 'string' ? value.toLowerCase() : ''))
    .join(' ')
  return raw.includes('weapon') || raw.includes('оруж')
}

const items = loadAsset('items.js', 'allItems')
const weapons = items.filter(isWeaponItem)
fs.writeFileSync(outputPath, JSON.stringify(weapons, null, 2), 'utf8')
console.log(`Extracted ${weapons.length} weapons to ${outputPath}`)
