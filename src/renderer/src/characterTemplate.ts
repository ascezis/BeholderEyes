export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type PlayerCharacterTemplateV1 = {
  version: 'beholder.character.v1'
  meta: {
    createdAt: string
    locale: 'ru'
  }
  identity: {
    name: string
    race: string
    className: string
    subclass: string
    background: string
    alignment: string
    level: number
    xp: number
    playerName: string
  }
  core: {
    proficiencyBonus: number
    inspiration: number
    passivePerception: number
    armorClass: number
    initiative: number
    speed: string
    hitPointsMax: number
    hitPointsCurrent: number
    hitPointsTemp: number
    hitDice: string
  }
  abilities: Record<AbilityKey, { score: number }>
  saves: Record<AbilityKey, { proficient: boolean; bonusOverride: number | null }>
  skills: Array<{
    key: string
    label: string
    ability: AbilityKey
    proficient: boolean
    expertise: boolean
    bonusOverride: number | null
  }>
  attacks: Array<{
    name: string
    attackBonus: string
    damage: string
    notes: string
  }>
  equipment: {
    currency: { cp: number; sp: number; ep: number; gp: number; pp: number }
    inventory: Array<{ name: string; qty: number; notes: string }>
  }
  traits: {
    proficiencies: string
    languages: string
    featuresAndTraits: string
    personalityTraits: string
    ideals: string
    bonds: string
    flaws: string
    backstory: string
    alliesOrganizations: string
    treasures: string
  }
  spellcasting: {
    ability: AbilityKey | ''
    spellSaveDc: number
    spellAttackBonus: number
    slots: Record<string, { max: number; used: number }>
    spellsKnown: Array<{ name: string; level: number; prepared: boolean; notes: string }>
  }
}

export const skillCatalog: Array<{ key: string; label: string; ability: AbilityKey }> = [
  { key: 'acrobatics', label: 'Акробатика', ability: 'dex' },
  { key: 'animalHandling', label: 'Уход за животными', ability: 'wis' },
  { key: 'arcana', label: 'Магия', ability: 'int' },
  { key: 'athletics', label: 'Атлетика', ability: 'str' },
  { key: 'deception', label: 'Обман', ability: 'cha' },
  { key: 'history', label: 'История', ability: 'int' },
  { key: 'insight', label: 'Проницательность', ability: 'wis' },
  { key: 'intimidation', label: 'Запугивание', ability: 'cha' },
  { key: 'investigation', label: 'Расследование', ability: 'int' },
  { key: 'medicine', label: 'Медицина', ability: 'wis' },
  { key: 'nature', label: 'Природа', ability: 'int' },
  { key: 'perception', label: 'Внимательность', ability: 'wis' },
  { key: 'performance', label: 'Выступление', ability: 'cha' },
  { key: 'persuasion', label: 'Убеждение', ability: 'cha' },
  { key: 'religion', label: 'Религия', ability: 'int' },
  { key: 'sleightOfHand', label: 'Ловкость рук', ability: 'dex' },
  { key: 'stealth', label: 'Скрытность', ability: 'dex' },
  { key: 'survival', label: 'Выживание', ability: 'wis' }
]

export const createEmptyCharacterTemplate = (): PlayerCharacterTemplateV1 => ({
  version: 'beholder.character.v1',
  meta: {
    createdAt: new Date().toISOString(),
    locale: 'ru'
  },
  identity: {
    name: '',
    race: '',
    className: '',
    subclass: '',
    background: '',
    alignment: '',
    level: 1,
    xp: 0,
    playerName: ''
  },
  core: {
    proficiencyBonus: 2,
    inspiration: 0,
    passivePerception: 10,
    armorClass: 10,
    initiative: 0,
    speed: '30 ft.',
    hitPointsMax: 0,
    hitPointsCurrent: 0,
    hitPointsTemp: 0,
    hitDice: '1d8'
  },
  abilities: {
    str: { score: 10 },
    dex: { score: 10 },
    con: { score: 10 },
    int: { score: 10 },
    wis: { score: 10 },
    cha: { score: 10 }
  },
  saves: {
    str: { proficient: false, bonusOverride: null },
    dex: { proficient: false, bonusOverride: null },
    con: { proficient: false, bonusOverride: null },
    int: { proficient: false, bonusOverride: null },
    wis: { proficient: false, bonusOverride: null },
    cha: { proficient: false, bonusOverride: null }
  },
  skills: skillCatalog.map((skill) => ({
    ...skill,
    proficient: false,
    expertise: false,
    bonusOverride: null
  })),
  attacks: [
    { name: '', attackBonus: '', damage: '', notes: '' },
    { name: '', attackBonus: '', damage: '', notes: '' }
  ],
  equipment: {
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    inventory: [{ name: '', qty: 1, notes: '' }]
  },
  traits: {
    proficiencies: '',
    languages: '',
    featuresAndTraits: '',
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    alliesOrganizations: '',
    treasures: ''
  },
  spellcasting: {
    ability: '',
    spellSaveDc: 10,
    spellAttackBonus: 0,
    slots: {
      '1': { max: 0, used: 0 },
      '2': { max: 0, used: 0 },
      '3': { max: 0, used: 0 },
      '4': { max: 0, used: 0 },
      '5': { max: 0, used: 0 },
      '6': { max: 0, used: 0 },
      '7': { max: 0, used: 0 },
      '8': { max: 0, used: 0 },
      '9': { max: 0, used: 0 }
    },
    spellsKnown: [{ name: '', level: 0, prepared: false, notes: '' }]
  }
})

