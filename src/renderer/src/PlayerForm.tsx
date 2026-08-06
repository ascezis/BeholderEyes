import { useEffect, useMemo, useState } from 'react'
import {
  type AbilityKey,
  type PlayerCharacterTemplateV1,
  createEmptyCharacterTemplate,
  skillCatalog
} from './characterTemplate'

type PlayerFormProps = {
  onSaveCharacter?: (payload: PlayerCharacterTemplateV1) => Promise<void> | void
  embedded?: boolean
}

type ClassBehavior = {
  speed: string
  saveProficiencies: AbilityKey[]
  usesMagic: boolean
  spellAbility: AbilityKey | ''
  spellSuggestions: string[]
}

type ClassCatalogItem = {
  key: string
  label: string
  hitDice: string
  subclasses: string[]
}

type SpellOption = {
  nameRu: string
  nameEn: string
  level: number
  school: string
  source: string
}

type RaceCatalogItem = {
  key: string
  label: string
  labelEn: string
  size: string
  speedFt: number | null
  abilityBonuses: Partial<Record<AbilityKey, number>>
  subraces: Array<{
    key: string
    label: string
    labelEn: string
    size: string
    speedFt: number | null
    abilityBonuses: Partial<Record<AbilityKey, number>>
  }>
}

type ClassSpellIndex = Record<string, string[]>

type StructuredFeature = {
  level: number
  name_ru: string
  description: string
}

type StructuredClass = {
  slug: string
  name_ru: string
  hit_die: string
  spellcasting_ability: string | null
  saving_throws: string[]
  features_by_level: StructuredFeature[]
  spell_slots_by_level: Record<string, Record<string, number>>
  known_cantrips_by_level: Record<string, number> | null
  spells_known_by_level: Record<string, number> | null
  prepared_formula: string | null
}

type StructuredClassSpell = {
  spell_level: number
  spell_name_ru: string
  spell_name_en: string
}

type StructuredClassesPayload = {
  classes: StructuredClass[]
  class_spells: Record<string, StructuredClassSpell[]>
}

const CLASS_BEHAVIORS: Record<string, ClassBehavior> = {
  barbarian: {
      speed: '30 ft.',
      saveProficiencies: ['str', 'con'],
      usesMagic: false,
      spellAbility: '',
      spellSuggestions: []
  },
  bard: {
      speed: '30 ft.',
      saveProficiencies: ['dex', 'cha'],
      usesMagic: true,
      spellAbility: 'cha',
      spellSuggestions: ['Лечащее слово', 'Диссонирующий шепот', 'Очарование личности']
  },
  cleric: {
      speed: '30 ft.',
      saveProficiencies: ['wis', 'cha'],
      usesMagic: true,
      spellAbility: 'wis',
      spellSuggestions: ['Лечение ран', 'Благословение', 'Священное пламя']
  },
  druid: {
      speed: '30 ft.',
      saveProficiencies: ['int', 'wis'],
      usesMagic: true,
      spellAbility: 'wis',
      spellSuggestions: ['Опутывание', 'Лечение ран', 'Говорить с животными']
  },
  fighter: {
      speed: '30 ft.',
      saveProficiencies: ['str', 'con'],
      usesMagic: false,
      spellAbility: '',
      spellSuggestions: []
  },
  monk: {
      speed: '30 ft.',
      saveProficiencies: ['str', 'dex'],
      usesMagic: false,
      spellAbility: '',
      spellSuggestions: []
  },
  paladin: {
      speed: '30 ft.',
      saveProficiencies: ['wis', 'cha'],
      usesMagic: true,
      spellAbility: 'cha',
      spellSuggestions: ['Божественное оружие', 'Щит веры', 'Героизм']
  },
  ranger: {
      speed: '30 ft.',
      saveProficiencies: ['str', 'dex'],
      usesMagic: true,
      spellAbility: 'wis',
      spellSuggestions: ['Метка охотника', 'Опутывание', 'Прыжок']
  },
  rogue: {
      speed: '30 ft.',
      saveProficiencies: ['dex', 'int'],
      usesMagic: false,
      spellAbility: '',
      spellSuggestions: ['Маскировка', 'Безмолвный образ', 'Волшебная рука']
  },
  sorcerer: {
      speed: '30 ft.',
      saveProficiencies: ['con', 'cha'],
      usesMagic: true,
      spellAbility: 'cha',
      spellSuggestions: ['Огненный снаряд', 'Щит', 'Доспех мага']
  },
  warlock: {
      speed: '30 ft.',
      saveProficiencies: ['wis', 'cha'],
      usesMagic: true,
      spellAbility: 'cha',
      spellSuggestions: ['Порча', 'Колдовской заряд', 'Адские узы']
  },
  wizard: {
      speed: '30 ft.',
      saveProficiencies: ['int', 'wis'],
      usesMagic: true,
      spellAbility: 'int',
      spellSuggestions: ['Магическая стрела', 'Щит', 'Обнаружение магии']
  }
}

const DEFAULT_CLASS_CATALOG: ClassCatalogItem[] = [
  {
    key: 'barbarian',
    label: 'Варвар',
    hitDice: '1d12',
    subclasses: ['Путь Берсерка', 'Путь Тотемного Воина', 'Путь Дикой Магии']
  },
  {
    key: 'bard',
    label: 'Бард',
    hitDice: '1d8',
    subclasses: ['Коллегия Знаний', 'Коллегия Доблести', 'Коллегия Красноречия']
  },
  {
    key: 'cleric',
    label: 'Жрец',
    hitDice: '1d8',
    subclasses: ['Домен Жизни', 'Домен Бури', 'Домен Света']
  },
  {
    key: 'druid',
    label: 'Друид',
    hitDice: '1d8',
    subclasses: ['Круг Луны', 'Круг Земли', 'Круг Звезд']
  },
  {
    key: 'fighter',
    label: 'Воин',
    hitDice: '1d10',
    subclasses: ['Мастер Боевых Искусств', 'Рыцарь Эльдритч', 'Чемпион']
  },
  {
    key: 'monk',
    label: 'Монах',
    hitDice: '1d8',
    subclasses: ['Путь Открытой Ладони', 'Путь Тени', 'Путь Кинсэй']
  },
  {
    key: 'paladin',
    label: 'Паладин',
    hitDice: '1d10',
    subclasses: ['Клятва Преданности', 'Клятва Древних', 'Клятва Мести']
  },
  {
    key: 'ranger',
    label: 'Следопыт',
    hitDice: '1d10',
    subclasses: ['Охотник', 'Повелитель Зверей', 'Сумрачный Странник']
  },
  {
    key: 'rogue',
    label: 'Плут',
    hitDice: '1d8',
    subclasses: ['Вор', 'Убийца', 'Мистический Ловкач']
  },
  {
    key: 'sorcerer',
    label: 'Чародей',
    hitDice: '1d6',
    subclasses: ['Драконья Кровь', 'Дикая Магия', 'Теневая Магия']
  },
  {
    key: 'warlock',
    label: 'Колдун',
    hitDice: '1d8',
    subclasses: ['Исчадие', 'Великий Древний', 'Архифея']
  },
  {
    key: 'wizard',
    label: 'Волшебник',
    hitDice: '1d6',
    subclasses: ['Школа Воплощения', 'Школа Иллюзий', 'Школа Ограждения']
  }
]

const DEFAULT_CLASS_BEHAVIOR: ClassBehavior = {
  speed: '30 ft.',
  saveProficiencies: ['str', 'con'],
  usesMagic: false,
  spellAbility: '',
  spellSuggestions: []
}

const DEFAULT_RACE_CATALOG: RaceCatalogItem[] = []

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'СИЛ',
  dex: 'ЛВК',
  con: 'ТЕЛ',
  int: 'ИНТ',
  wis: 'МДР',
  cha: 'ХАР'
}

const SAVE_LABELS: Record<AbilityKey, string> = {
  str: 'Сила',
  dex: 'Ловкость',
  con: 'Телосложение',
  int: 'Интеллект',
  wis: 'Мудрость',
  cha: 'Харизма'
}

const ABILITY_WORD_TO_KEY: Record<string, AbilityKey> = {
  сила: 'str',
  ловкость: 'dex',
  телосложение: 'con',
  интеллект: 'int',
  мудрость: 'wis',
  харизма: 'cha'
}

const SKILL_LABEL_OVERRIDE: Record<string, string> = {
  acrobatics: 'Акробатика',
  animalHandling: 'Уход за животными',
  arcana: 'Магия',
  athletics: 'Атлетика',
  deception: 'Обман',
  history: 'История',
  insight: 'Проницательность',
  intimidation: 'Запугивание',
  investigation: 'Анализ',
  medicine: 'Медицина',
  nature: 'Природа',
  perception: 'Внимательность',
  performance: 'Выступление',
  persuasion: 'Убеждение',
  religion: 'Религия',
  sleightOfHand: 'Ловкость рук',
  stealth: 'Скрытность',
  survival: 'Выживание'
}

const getAbilityMod = (score: number): number => Math.floor((score - 10) / 2)
const formatSigned = (value: number): string => (value >= 0 ? `+${value}` : `${value}`)
const clampNumber = (value: number, min = 0): number => (Number.isNaN(value) ? min : Math.max(min, value))
const getProficiencyBonus = (level: number): number => 2 + Math.floor((Math.max(level, 1) - 1) / 4)
const normalizeAbilityWord = (value?: string | null): AbilityKey | null => {
  if (!value) return null
  const lower = value.toLowerCase().trim()
  return ABILITY_WORD_TO_KEY[lower] ?? null
}
const getProgressionValueAtLevel = (table: Record<string, number> | null, level: number): number | null => {
  if (!table) return null
  let best = 0
  let found = false
  for (const [lvlText, value] of Object.entries(table)) {
    const lvl = Number(lvlText)
    if (!Number.isFinite(lvl)) continue
    if (lvl <= level && lvl >= best) {
      best = lvl
      found = true
    }
  }
  return found ? table[String(best)] ?? null : null
}

const deepCloneTemplate = (template: PlayerCharacterTemplateV1): PlayerCharacterTemplateV1 =>
  JSON.parse(JSON.stringify(template)) as PlayerCharacterTemplateV1

const downloadTextFile = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

const buildCharacterPayload = (
  template: PlayerCharacterTemplateV1
): PlayerCharacterTemplateV1 => ({
  ...template,
  version: 'beholder.character.v1',
  meta: {
    ...template.meta,
    createdAt: new Date().toISOString(),
    locale: 'ru'
  }
})

const PlayerForm = ({ onSaveCharacter, embedded = false }: PlayerFormProps = {}): JSX.Element => {
  const [template, setTemplate] = useState<PlayerCharacterTemplateV1>(() => createEmptyCharacterTemplate())
  const [selectedClassKey, setSelectedClassKey] = useState<string>('')
  const [selectedRaceKey, setSelectedRaceKey] = useState<string>('')
  const [selectedSubraceKey, setSelectedSubraceKey] = useState<string>('')
  const [usesMagic, setUsesMagic] = useState<boolean>(false)
  const [spellDraft, setSpellDraft] = useState<string>('')
  const [classCatalog, setClassCatalog] = useState<ClassCatalogItem[]>(DEFAULT_CLASS_CATALOG)
  const [raceCatalog, setRaceCatalog] = useState<RaceCatalogItem[]>(DEFAULT_RACE_CATALOG)
  const [spellCatalog, setSpellCatalog] = useState<SpellOption[]>([])
  const [classSpellIndex, setClassSpellIndex] = useState<ClassSpellIndex>({})
  const [restrictToClassSpells, setRestrictToClassSpells] = useState<boolean>(true)
  const [structuredClasses, setStructuredClasses] = useState<StructuredClass[]>([])
  const [structuredClassSpells, setStructuredClassSpells] = useState<
    Record<string, StructuredClassSpell[]>
  >({})
  const [hintsPinned, setHintsPinned] = useState<boolean>(() => {
    const stored = window.localStorage.getItem('player-hints-pinned')
    return stored === 'true'
  })
  const [hintsVisible, setHintsVisible] = useState<boolean>(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  useEffect(() => {
    window.localStorage.setItem('player-hints-pinned', hintsPinned ? 'true' : 'false')
    if (hintsPinned) setHintsVisible(true)
  }, [hintsPinned])

  useEffect(() => {
    let cancelled = false
    const loadClassCatalog = async (): Promise<void> => {
      try {
        const response = await fetch('./ttg-class-options.json')
        if (!response.ok) return
        const payload = (await response.json()) as Array<{
          key?: string
          label?: string
          hitDice?: string
          subclasses?: string[]
        }>
        const normalized = payload
          .map((item) => ({
            key: item.key ?? '',
            label: item.label ?? item.key ?? '',
            hitDice: item.hitDice ? item.hitDice.replace('к', 'd') : '1d8',
            subclasses: Array.isArray(item.subclasses) ? item.subclasses.filter(Boolean) : []
          }))
          .filter((item) => item.key && item.label)
        if (!cancelled && normalized.length > 0) {
          setClassCatalog(normalized)
        }
      } catch {
        // fallback to default catalog
      }
    }
    void loadClassCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadStructuredClasses = async (): Promise<void> => {
      try {
        const response = await fetch('./ttg-classes-structured.json')
        if (!response.ok) return
        const payload = (await response.json()) as StructuredClassesPayload
        if (!cancelled) {
          setStructuredClasses(Array.isArray(payload.classes) ? payload.classes : [])
          setStructuredClassSpells(payload.class_spells ?? {})
        }
      } catch {
        // no-op
      }
    }
    void loadStructuredClasses()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadClassSpellIndex = async (): Promise<void> => {
      try {
        const response = await fetch('./ttg-class-spell-index.json')
        if (!response.ok) return
        const payload = (await response.json()) as ClassSpellIndex
        if (!cancelled && payload && typeof payload === 'object') {
          setClassSpellIndex(payload)
        }
      } catch {
        // if index unavailable we fallback to global spell search
      }
    }
    void loadClassSpellIndex()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadRaceCatalog = async (): Promise<void> => {
      try {
        const response = await fetch('./ttg-race-options.json')
        if (!response.ok) return
        const payload = (await response.json()) as RaceCatalogItem[]
        if (!cancelled && Array.isArray(payload) && payload.length > 0) {
          const labels = new Set<string>()
          setRaceCatalog(payload.filter((race) => {
            const label = race.label.trim().toLocaleLowerCase('ru')
            if (!label || labels.has(label)) return false
            labels.add(label)
            return true
          }))
        }
      } catch {
        // fallback to manual race input
      }
    }
    void loadRaceCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadSpellCatalog = async (): Promise<void> => {
      try {
        const response = await fetch('./ttg-spell-options.json')
        if (!response.ok) return
        const payload = (await response.json()) as SpellOption[]
        if (!cancelled && Array.isArray(payload) && payload.length > 0) {
          setSpellCatalog(payload)
        }
      } catch {
        // no-op: manual spell add still works
      }
    }
    void loadSpellCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedPreset = useMemo(
    () => classCatalog.find((preset) => preset.key === selectedClassKey) ?? null,
    [selectedClassKey, classCatalog]
  )

  const selectedStructuredClass = useMemo(
    () => structuredClasses.find((item) => item.slug === selectedClassKey) ?? null,
    [structuredClasses, selectedClassKey]
  )

  const selectedBehavior = useMemo(
    () => {
      if (selectedStructuredClass) {
        const saves = selectedStructuredClass.saving_throws
          .map((word) => normalizeAbilityWord(word))
          .filter((value): value is AbilityKey => value !== null)
        const spellAbility = normalizeAbilityWord(selectedStructuredClass.spellcasting_ability)
        return {
          speed: '30 ft.',
          saveProficiencies: saves.length > 0 ? saves : DEFAULT_CLASS_BEHAVIOR.saveProficiencies,
          usesMagic: Boolean(spellAbility),
          spellAbility: spellAbility ?? '',
          spellSuggestions: []
        } satisfies ClassBehavior
      }
      return (selectedClassKey ? CLASS_BEHAVIORS[selectedClassKey] : undefined) ?? DEFAULT_CLASS_BEHAVIOR
    },
    [selectedClassKey, selectedStructuredClass]
  )

  const selectedRace = useMemo(
    () => raceCatalog.find((race) => race.key === selectedRaceKey) ?? null,
    [raceCatalog, selectedRaceKey]
  )

  const selectedSubrace = useMemo(
    () => selectedRace?.subraces.find((subrace) => subrace.key === selectedSubraceKey) ?? null,
    [selectedRace, selectedSubraceKey]
  )

  useEffect(() => {
    const level = template.identity.level
    const prof = getProficiencyBonus(level)
    if (template.core.proficiencyBonus !== prof) {
      setTemplate((prev) => ({
        ...prev,
        core: {
          ...prev.core,
          proficiencyBonus: prof
        }
      }))
    }
  }, [template.identity.level, template.core.proficiencyBonus])

  const applyClassPreset = (key: string): void => {
    const preset = classCatalog.find((entry) => entry.key === key)
    const structured = structuredClasses.find((entry) => entry.slug === key) ?? null
    const behavior = CLASS_BEHAVIORS[key] ?? DEFAULT_CLASS_BEHAVIOR
    setSelectedClassKey(key)
    if (!preset) return

    const spellAbility = normalizeAbilityWord(structured?.spellcasting_ability) ?? behavior.spellAbility
    const saveProficiencies =
      structured?.saving_throws
        .map((word) => normalizeAbilityWord(word))
        .filter((value): value is AbilityKey => value !== null) ?? []
    const effectiveSaves = saveProficiencies.length ? saveProficiencies : behavior.saveProficiencies
    const classHitDie = structured?.hit_die
      ? structured.hit_die.replace('к', 'd').replace(/[^d0-9]/g, '')
      : preset.hitDice
    const usesMagicByClass = Boolean(spellAbility)

    setUsesMagic(usesMagicByClass || behavior.usesMagic)
    setTemplate((prev) => {
      const next = deepCloneTemplate(prev)
      next.identity.className = preset.label
      if (!next.identity.subclass || !preset.subclasses.includes(next.identity.subclass)) {
        next.identity.subclass = preset.subclasses[0] ?? ''
      }
      next.core.hitDice = `${Math.max(next.identity.level, 1)}${classHitDie.replace(/^1/, '')}`
      next.core.speed = behavior.speed

      ;(Object.keys(next.saves) as AbilityKey[]).forEach((ability) => {
        next.saves[ability].proficient = effectiveSaves.includes(ability)
      })

      const effectiveSpellAbility = (spellAbility || 'wis') as AbilityKey
      next.spellcasting.ability = usesMagicByClass ? spellAbility ?? '' : ''
      next.spellcasting.spellSaveDc = usesMagicByClass
        ? 8 + next.core.proficiencyBonus + getAbilityMod(next.abilities[effectiveSpellAbility].score)
        : 0
      next.spellcasting.spellAttackBonus = usesMagicByClass
        ? next.core.proficiencyBonus + getAbilityMod(next.abilities[effectiveSpellAbility].score)
        : 0

      if (!usesMagicByClass) {
        next.spellcasting.spellsKnown = [{ name: '', level: 0, prepared: false, notes: '' }]
        Object.keys(next.spellcasting.slots).forEach((slotLevel) => {
          next.spellcasting.slots[slotLevel] = { max: 0, used: 0 }
        })
      }

      return next
    })
  }

  const applyRaceSelection = (raceKey: string, subraceKey?: string): void => {
    const race = raceCatalog.find((item) => item.key === raceKey)
    setSelectedRaceKey(raceKey)
    const nextSubraceKey = subraceKey ?? ''
    setSelectedSubraceKey(nextSubraceKey)

    if (!race) return
    const subrace = race.subraces.find((item) => item.key === nextSubraceKey) ?? null
    const raceName = subrace ? `${race.label} (${subrace.label})` : race.label
    const combinedBonuses: Partial<Record<AbilityKey, number>> = {
      ...race.abilityBonuses
    }

    if (subrace?.abilityBonuses) {
      ;(Object.keys(subrace.abilityBonuses) as AbilityKey[]).forEach((ability) => {
        const value = subrace.abilityBonuses[ability] ?? 0
        combinedBonuses[ability] = (combinedBonuses[ability] ?? 0) + value
      })
    }

    const speedFt = subrace?.speedFt ?? race.speedFt ?? null

    setTemplate((prev) => {
      const next = deepCloneTemplate(prev)
      next.identity.race = raceName
      if (speedFt) {
        next.core.speed = `${speedFt} ft.`
      }
      const allDefault = (Object.keys(next.abilities) as AbilityKey[]).every(
        (ability) => next.abilities[ability].score === 10
      )
      if (allDefault) {
        ;(Object.keys(combinedBonuses) as AbilityKey[]).forEach((ability) => {
          const bonus = combinedBonuses[ability] ?? 0
          if (bonus > 0) {
            next.abilities[ability].score += bonus
          }
        })
      }
      return next
    })
  }

  const updateIdentity = <K extends keyof PlayerCharacterTemplateV1['identity']>(
    key: K,
    value: PlayerCharacterTemplateV1['identity'][K]
  ): void => {
    setTemplate((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        [key]: value
      }
    }))
  }

  const updateCore = <K extends keyof PlayerCharacterTemplateV1['core']>(
    key: K,
    value: PlayerCharacterTemplateV1['core'][K]
  ): void => {
    setTemplate((prev) => ({
      ...prev,
      core: {
        ...prev.core,
        [key]: value
      }
    }))
  }

  const updateAbility = (ability: AbilityKey, score: number): void => {
    setTemplate((prev) => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [ability]: { score: clampNumber(score, 1) }
      }
    }))
  }

  const updateSave = (ability: AbilityKey, nextValue: Partial<PlayerCharacterTemplateV1['saves'][AbilityKey]>): void => {
    setTemplate((prev) => ({
      ...prev,
      saves: {
        ...prev.saves,
        [ability]: {
          ...prev.saves[ability],
          ...nextValue
        }
      }
    }))
  }

  const updateSkill = (
    key: string,
    nextValue: Partial<PlayerCharacterTemplateV1['skills'][number]>
  ): void => {
    setTemplate((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) =>
        skill.key === key
          ? {
              ...skill,
              ...nextValue
            }
          : skill
      )
    }))
  }

  const addSpellEntry = (name: string, level = 1, prepared = false): void => {
    const clean = name.trim()
    if (!clean) return
    setTemplate((prev) => {
      const exists = prev.spellcasting.spellsKnown.some(
        (spell) => spell.name.trim().toLowerCase() === clean.toLowerCase()
      )
      if (exists) return prev
      const spells = prev.spellcasting.spellsKnown.filter((spell) => spell.name.trim())
      spells.push({ name: clean, level: clampNumber(level, 0), prepared, notes: '' })
      return {
        ...prev,
        spellcasting: {
          ...prev.spellcasting,
          spellsKnown: spells
        }
      }
    })
  }

  const addSpellByName = (name: string): void => {
    addSpellEntry(name, 1, false)
  }

  const exportCharacter = (): void => {
    if (!template.identity.name.trim()) {
      window.alert('Укажи имя персонажа перед экспортом.')
      return
    }

    const payload = buildCharacterPayload(template)

    const filenameBase = template.identity.name.trim().toLowerCase().replace(/\s+/g, '-')
    downloadTextFile(`${filenameBase || 'character'}.json`, JSON.stringify(payload, null, 2))
  }

  const saveCharacterToApp = async (): Promise<void> => {
    if (!onSaveCharacter) return
    if (!template.identity.name.trim()) {
      window.alert('Укажи имя персонажа перед сохранением.')
      return
    }
    const payload = buildCharacterPayload(template)
    await onSaveCharacter(payload)
  }

  const sendCharacterToApp = (): void => {
    if (!template.identity.name.trim()) {
      window.alert('Укажи имя персонажа перед отправкой.')
      return
    }
    if (!window.opener) {
      window.alert('Окно приложения не найдено. Открой форму из Beholder Eye\'s.')
      return
    }
    const payload = buildCharacterPayload(template)
    window.opener.postMessage(
      {
        type: 'beholder:character-import',
        payload
      },
      '*'
    )
  }

  const skillsForRender = useMemo(() => {
    return skillCatalog.map((entry) => ({
      ...entry,
      label: SKILL_LABEL_OVERRIDE[entry.key] ?? entry.label
    }))
  }, [])

  const classSlotsForLevel = useMemo(() => {
    if (!selectedStructuredClass) return null
    return selectedStructuredClass.spell_slots_by_level?.[String(template.identity.level)] ?? null
  }, [selectedStructuredClass, template.identity.level])

  const maxSpellLevelForClass = useMemo(() => {
    if (!classSlotsForLevel) return 0
    return Object.entries(classSlotsForLevel).reduce((max, [lvlText, slots]) => {
      const lvl = Number(lvlText)
      return Number.isFinite(lvl) && slots > 0 ? Math.max(max, lvl) : max
    }, 0)
  }, [classSlotsForLevel])

  const classFeaturesByCurrentLevel = useMemo(() => {
    if (!selectedStructuredClass) return []
    return selectedStructuredClass.features_by_level
      .filter((feature) => feature.level <= template.identity.level)
      .sort((a, b) => a.level - b.level)
  }, [selectedStructuredClass, template.identity.level])

  const classAvailableSpellsByLevel = useMemo(() => {
    const pool = structuredClassSpells[selectedClassKey] ?? []
    if (!pool.length) return []
    return pool
      .filter((spell) => spell.spell_level === 0 || spell.spell_level <= maxSpellLevelForClass)
      .sort((a, b) => {
        if (a.spell_level !== b.spell_level) return a.spell_level - b.spell_level
        return (a.spell_name_ru || a.spell_name_en).localeCompare(
          b.spell_name_ru || b.spell_name_en,
          'ru'
        )
      })
  }, [structuredClassSpells, selectedClassKey, maxSpellLevelForClass])

  const knownCantripsAtLevel = useMemo(
    () =>
      selectedStructuredClass
        ? getProgressionValueAtLevel(selectedStructuredClass.known_cantrips_by_level, template.identity.level)
        : null,
    [selectedStructuredClass, template.identity.level]
  )

  const knownSpellsAtLevel = useMemo(
    () =>
      selectedStructuredClass
        ? getProgressionValueAtLevel(selectedStructuredClass.spells_known_by_level, template.identity.level)
        : null,
    [selectedStructuredClass, template.identity.level]
  )

  const classSpellsGroupedByLevel = useMemo(() => {
    const grouped = new Map<number, StructuredClassSpell[]>()
    for (const spell of classAvailableSpellsByLevel) {
      const level = Number(spell.spell_level)
      const bucket = grouped.get(level) ?? []
      bucket.push(spell)
      grouped.set(level, bucket)
    }
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0])
  }, [classAvailableSpellsByLevel])

  const isPreparedCaster = Boolean(selectedStructuredClass?.prepared_formula)
  const spellAbilityForClass =
    template.spellcasting.ability ||
    normalizeAbilityWord(selectedStructuredClass?.spellcasting_ability) ||
    ''
  const spellAbilityModForClass = spellAbilityForClass
    ? getAbilityMod(template.abilities[spellAbilityForClass].score)
    : 0

  const recommendedCantripCount = Math.max(0, knownCantripsAtLevel ?? 0)
  const recommendedLeveledCount = Math.max(
    0,
    isPreparedCaster
      ? Math.max(1, template.identity.level + spellAbilityModForClass)
      : knownSpellsAtLevel ?? 0
  )

  const addRecommendedClassSpells = (): void => {
    if (!selectedClassKey || classAvailableSpellsByLevel.length === 0) return

    setTemplate((prev) => {
      const existing = prev.spellcasting.spellsKnown.filter((spell) => spell.name.trim())
      const existingSet = new Set(existing.map((spell) => spell.name.trim().toLowerCase()))
      const toAdd: Array<{ name: string; level: number; prepared: boolean; notes: string }> = []

      const cantrips = classAvailableSpellsByLevel
        .filter((spell) => spell.spell_level === 0)
        .slice(0, recommendedCantripCount)
      const leveled = classAvailableSpellsByLevel
        .filter((spell) => spell.spell_level > 0)
        .slice(0, recommendedLeveledCount > 0 ? recommendedLeveledCount : 4)

      for (const spell of [...cantrips, ...leveled]) {
        const spellName = (spell.spell_name_ru || spell.spell_name_en).trim()
        if (!spellName) continue
        const key = spellName.toLowerCase()
        if (existingSet.has(key)) continue
        existingSet.add(key)
        toAdd.push({
          name: spellName,
          level: spell.spell_level,
          prepared: spell.spell_level === 0 || isPreparedCaster,
          notes: ''
        })
      }

      if (toAdd.length === 0) return prev

      return {
        ...prev,
        spellcasting: {
          ...prev.spellcasting,
          spellsKnown: [...existing, ...toAdd]
        }
      }
    })
  }

  const spellSuggestions = useMemo(() => {
    const query = spellDraft.trim().toLowerCase()
    if (!query || !usesMagic) return []
    const classSpellSetFromStructured =
      selectedClassKey && structuredClassSpells[selectedClassKey]
        ? new Set(
            structuredClassSpells[selectedClassKey]
              .map((spell) => spell.spell_name_en.toLowerCase())
              .filter(Boolean)
          )
        : null
    const classSpellSetFromLegacy =
      selectedClassKey && classSpellIndex[selectedClassKey]
        ? new Set(classSpellIndex[selectedClassKey].map((name) => name.toLowerCase()))
        : null

    const filtered = spellCatalog.filter((spell) => {
      if (spell.level > 0 && maxSpellLevelForClass > 0 && spell.level > maxSpellLevelForClass) {
        return false
      }
      const effectiveClassSet =
        classSpellSetFromStructured && classSpellSetFromStructured.size > 0
          ? classSpellSetFromStructured
          : classSpellSetFromLegacy
      if (restrictToClassSpells && effectiveClassSet && effectiveClassSet.size > 0) {
        const enName = spell.nameEn.toLowerCase()
        if (!effectiveClassSet.has(enName)) return false
      }
      const ru = spell.nameRu.toLowerCase()
      const en = spell.nameEn.toLowerCase()
      return ru.includes(query) || en.includes(query)
    })

    return filtered.slice(0, 8)
  }, [
    spellCatalog,
    spellDraft,
    usesMagic,
    selectedClassKey,
    classSpellIndex,
    restrictToClassSpells,
    structuredClassSpells,
    maxSpellLevelForClass
  ])

  useEffect(() => {
    if (!usesMagic || !selectedStructuredClass) return

    const classAbility = normalizeAbilityWord(selectedStructuredClass.spellcasting_ability)
    if (!classAbility) return

    setTemplate((prev) => {
      const prof = getProficiencyBonus(prev.identity.level)
      const effectiveAbility = prev.spellcasting.ability || classAbility
      const mod = getAbilityMod(prev.abilities[effectiveAbility].score)
      const nextSlots = { ...prev.spellcasting.slots }

      for (let level = 1; level <= 9; level += 1) {
        const key = String(level)
        const max = classSlotsForLevel ? Number(classSlotsForLevel[key] ?? 0) : 0
        const prevSlot = nextSlots[key] ?? { max: 0, used: 0 }
        nextSlots[key] = {
          max,
          used: Math.min(prevSlot.used, max)
        }
      }

      const nextSpellcasting = {
        ...prev.spellcasting,
        ability: effectiveAbility,
        spellSaveDc: 8 + prof + mod,
        spellAttackBonus: prof + mod,
        slots: nextSlots
      }

      const prevSerialized = JSON.stringify(prev.spellcasting)
      const nextSerialized = JSON.stringify(nextSpellcasting)
      if (prevSerialized === nextSerialized) return prev

      return {
        ...prev,
        spellcasting: nextSpellcasting
      }
    })
  }, [usesMagic, selectedStructuredClass, classSlotsForLevel])

  useEffect(() => {
    if (!usesMagic || !selectedClassKey || classAvailableSpellsByLevel.length === 0) return

    setTemplate((prev) => {
      const existing = prev.spellcasting.spellsKnown.filter((spell) => spell.name.trim().length > 0)
      if (existing.length > 0) return prev

      const cantripLimit = Math.max(0, knownCantripsAtLevel ?? 0)
      const knownLimit = Math.max(0, knownSpellsAtLevel ?? 0)

      const cantrips = classAvailableSpellsByLevel
        .filter((spell) => spell.spell_level === 0)
        .slice(0, cantripLimit)
      const leveled = classAvailableSpellsByLevel
        .filter((spell) => spell.spell_level > 0)
        .slice(0, knownLimit > 0 ? knownLimit : 4)

      const autoSpells = [...cantrips, ...leveled].map((spell) => ({
        name: spell.spell_name_ru || spell.spell_name_en,
        level: spell.spell_level,
        prepared: spell.spell_level === 0,
        notes: ''
      }))

      if (autoSpells.length === 0) return prev

      return {
        ...prev,
        spellcasting: {
          ...prev.spellcasting,
          spellsKnown: autoSpells
        }
      }
    })
  }, [
    usesMagic,
    selectedClassKey,
    classAvailableSpellsByLevel,
    knownCantripsAtLevel,
    knownSpellsAtLevel
  ])

  const classHint = selectedPreset
    ? `Автозаполнение: кость хитов ${selectedStructuredClass?.hit_die?.replace('к', 'd') ?? selectedPreset.hitDice}, спасброски ${selectedBehavior.saveProficiencies
        .map((value) => SAVE_LABELS[value])
        .join(', ')}${selectedBehavior.usesMagic ? ', есть магия' : ', без магии'}${selectedBehavior.usesMagic ? `, доступный круг: ${maxSpellLevelForClass || 0}` : ''}`
    : 'Выбери класс, чтобы форма автоматически подставила базовые параметры.'

  const raceHint = selectedRace
    ? `Раса: ${selectedRace.label}${selectedSubrace ? ` / ${selectedSubrace.label}` : ''}${selectedSubrace?.speedFt || selectedRace.speedFt ? `, скорость ${selectedSubrace?.speedFt ?? selectedRace.speedFt} ft.` : ''}`
    : 'Выбери расу и подрасу, чтобы автозаполнить скорость и имя расы.'

  const hintsEnabled = hintsPinned || hintsVisible

  return (
    <div className={`app app--player-form${embedded ? ' app--player-form-embedded' : ''}`}>
      {!embedded && (
        <header className="app__header">
          <div className="brand">
            <div className="brand__mark">BE</div>
            <div>
              <div className="brand__title">Player Builder</div>
              <div className="brand__subtitle">Лист персонажа D&D 5e</div>
            </div>
          </div>
        </header>
      )}

      <main className="app__main layout--player">
        <div className="player-hints-toolbar">
          <button
            type="button"
            className="chip"
            onClick={() => setHintsVisible((prev) => !prev)}
            disabled={hintsPinned}
          >
            {hintsEnabled ? 'Скрыть подсказки' : 'Показать подсказки'}
          </button>
          <button
            type="button"
            className={`chip ${hintsPinned ? 'chip--accent' : ''}`}
            onClick={() => setHintsPinned((prev) => !prev)}
            title={hintsPinned ? 'Открепить подсказки' : 'Закрепить подсказки'}
          >
            {hintsPinned ? '★ Подсказки закреплены' : '☆ Закрепить подсказки'}
          </button>
        </div>

        <section className="panel player-panel">
          <div className="detail__header">
            <h2>1. Идентичность персонажа</h2>
          </div>

          <div className="form form--grid player-grid player-grid--identity">
            <input
              value={template.identity.name}
              onChange={(event) => updateIdentity('name', event.target.value)}
              placeholder="Имя персонажа"
            />
            <input
              value={template.identity.playerName}
              onChange={(event) => updateIdentity('playerName', event.target.value)}
              placeholder="Имя игрока"
            />
            <input
              value={template.identity.race}
              onChange={(event) => updateIdentity('race', event.target.value)}
              placeholder="Раса (можно вручную)"
            />
            <select
              value={selectedRaceKey}
              onChange={(event) => {
                const raceKey = event.target.value
                applyRaceSelection(raceKey, '')
              }}
            >
              <option value="">Раса (из справочника)</option>
              {raceCatalog.map((race) => (
                <option key={race.key} value={race.key}>
                  {race.label}
                </option>
              ))}
            </select>
            <select
              value={selectedSubraceKey}
              onChange={(event) => applyRaceSelection(selectedRaceKey, event.target.value)}
              disabled={!selectedRace || selectedRace.subraces.length === 0}
            >
              <option value="">Подраса</option>
              {(selectedRace?.subraces ?? []).map((subrace) => (
                <option key={subrace.key} value={subrace.key}>
                  {subrace.label}
                </option>
              ))}
            </select>
            <select
              value={selectedClassKey}
              onChange={(event) => applyClassPreset(event.target.value)}
            >
              <option value="">Класс (автосборка)</option>
              {classCatalog.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <select
              value={template.identity.subclass}
              onChange={(event) => updateIdentity('subclass', event.target.value)}
            >
              <option value="">Подкласс</option>
              {(selectedPreset?.subclasses ?? []).map((subclass) => (
                <option key={subclass} value={subclass}>
                  {subclass}
                </option>
              ))}
            </select>
            <input
              value={template.identity.background}
              onChange={(event) => updateIdentity('background', event.target.value)}
              placeholder="Предыстория"
            />
            <input
              value={template.identity.alignment}
              onChange={(event) => updateIdentity('alignment', event.target.value)}
              placeholder="Мировоззрение"
            />
            <input
              type="number"
              value={template.identity.level}
              onChange={(event) => updateIdentity('level', clampNumber(Number(event.target.value), 1))}
              placeholder="Уровень"
            />
            <input
              type="number"
              value={template.identity.xp}
              onChange={(event) => updateIdentity('xp', clampNumber(Number(event.target.value), 0))}
              placeholder="Опыт"
            />
          </div>

          {hintsEnabled && (
            <>
              <p className="player-hint">{classHint}</p>
              <p className="player-hint">{raceHint}</p>
            </>
          )}

          {selectedStructuredClass ? (
            <div className="detail__entries">
              <div className="combat-action-card">
                <div className="detail__label">Прогресс класса на {template.identity.level} уровне</div>
                <div className="combat-row__stats">
                  <span>Кость хитов: {selectedStructuredClass.hit_die.replace('к', 'd')}</span>
                  <span>Круг заклинаний: {maxSpellLevelForClass || 0}</span>
                  {knownCantripsAtLevel !== null ? <span>Заговоров: {knownCantripsAtLevel}</span> : null}
                  {knownSpellsAtLevel !== null ? <span>Известных заклинаний: {knownSpellsAtLevel}</span> : null}
                </div>
                {classSlotsForLevel ? (
                  <div className="chips">
                    {Object.entries(classSlotsForLevel).map(([spellLevel, slots]) => (
                      <span className="chip" key={spellLevel}>
                        {spellLevel} круг: {slots}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="combat-action-card">
                <div className="detail__label">Умения класса (до текущего уровня)</div>
                <div className="detail__entries">
                  {classFeaturesByCurrentLevel.slice(0, 8).map((feature, index) => (
                    <div key={`${feature.level}-${feature.name_ru}-${index}`} className="detail__entry">
                      <div className="detail__entry-title">
                        {feature.level} ур. · {feature.name_ru}
                      </div>
                      <div className="combat-action-card__text">{feature.description || 'Описание отсутствует'}</div>
                    </div>
                  ))}
                  {classFeaturesByCurrentLevel.length === 0 ? (
                    <div className="empty">Для текущего уровня нет данных по умениям.</div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel player-panel">
          <div className="detail__header">
            <h2>2. Характеристики и спасброски</h2>
          </div>

          <div className="player-abilities">
            {(Object.keys(template.abilities) as AbilityKey[]).map((ability) => {
              const score = template.abilities[ability].score
              const mod = getAbilityMod(score)
              return (
                <div className="stat-card player-stat" key={ability}>
                  <div className="detail__label">{ABILITY_LABELS[ability]}</div>
                  <input
                    type="number"
                    value={score}
                    onChange={(event) => updateAbility(ability, Number(event.target.value))}
                  />
                  <div className="stat-card__total">мод: {formatSigned(mod)}</div>
                </div>
              )
            })}
          </div>

          <div className="player-saves">
            {(Object.keys(template.saves) as AbilityKey[]).map((ability) => {
              const scoreMod = getAbilityMod(template.abilities[ability].score)
              const save = template.saves[ability]
              const auto = scoreMod + (save.proficient ? template.core.proficiencyBonus : 0)
              const total = save.bonusOverride ?? auto
              return (
                <div className="combat-save" key={ability}>
                  <span>{SAVE_LABELS[ability]}</span>
                  <input
                    type="number"
                    value={save.bonusOverride ?? ''}
                    placeholder={`авто ${formatSigned(auto)}`}
                    onChange={(event) => {
                      const value = event.target.value.trim()
                      updateSave(ability, { bonusOverride: value === '' ? null : Number(value) })
                    }}
                  />
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => updateSave(ability, { proficient: !save.proficient })}
                  >
                    {save.proficient ? 'Проф' : 'Нет'}
                  </button>
                  <div className="player-save-total">Итог: {formatSigned(total)}</div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel player-panel">
          <div className="detail__header">
            <h2>3. Боевой блок</h2>
          </div>
          {hintsEnabled && (
            <p className="player-hint">
              Этот блок нужен мастеру для боя: AC для попаданий, инициатива для очереди ходов,
              скорость для перемещения.
            </p>
          )}

          <div className="form form--grid player-grid player-grid--combat">
            <label className="player-field">
              <span>Класс брони (AC)</span>
              <input
                type="number"
                value={template.core.armorClass}
                onChange={(event) => updateCore('armorClass', clampNumber(Number(event.target.value), 0))}
              />
              <small>Сколько нужно бросить атакой, чтобы попасть.</small>
            </label>

            <label className="player-field">
              <span>Инициатива</span>
              <input
                type="number"
                value={template.core.initiative}
                onChange={(event) => updateCore('initiative', Number(event.target.value) || 0)}
              />
              <small>Порядок хода. Обычно = мод ЛВК ({formatSigned(getAbilityMod(template.abilities.dex.score))}).</small>
            </label>

            <label className="player-field">
              <span>Скорость</span>
              <input
                value={template.core.speed}
                onChange={(event) => updateCore('speed', event.target.value)}
              />
              <small>Скорость перемещения за ход, например 30 ft.</small>
            </label>

            <label className="player-field">
              <span>Макс. HP</span>
              <input
                type="number"
                value={template.core.hitPointsMax}
                onChange={(event) =>
                  updateCore('hitPointsMax', clampNumber(Number(event.target.value), 0))
                }
              />
              <small>Полный запас хитов.</small>
            </label>

            <label className="player-field">
              <span>Текущие HP</span>
              <input
                type="number"
                value={template.core.hitPointsCurrent}
                onChange={(event) =>
                  updateCore('hitPointsCurrent', clampNumber(Number(event.target.value), 0))
                }
              />
              <small>Текущее здоровье персонажа на старте боя.</small>
            </label>

            <label className="player-field">
              <span>Временные HP</span>
              <input
                type="number"
                value={template.core.hitPointsTemp}
                onChange={(event) =>
                  updateCore('hitPointsTemp', clampNumber(Number(event.target.value), 0))
                }
              />
              <small>Дополнительные временные хиты поверх обычных.</small>
            </label>

            <label className="player-field">
              <span>Кость хитов</span>
              <input
                value={template.core.hitDice}
                onChange={(event) => updateCore('hitDice', event.target.value)}
              />
              <small>Например: 4d8. Используется в коротком отдыхе.</small>
            </label>

            <label className="player-field">
              <span>Бонус мастерства</span>
              <input
                type="number"
                value={template.core.proficiencyBonus}
                onChange={(event) =>
                  updateCore('proficiencyBonus', clampNumber(Number(event.target.value), 0))
                }
              />
              <small>Авто по уровню: +{getProficiencyBonus(template.identity.level)}.</small>
            </label>

            <label className="player-field">
              <span>Пассивная внимательность</span>
              <input
                type="number"
                value={template.core.passivePerception}
                onChange={(event) =>
                  updateCore('passivePerception', clampNumber(Number(event.target.value), 0))
                }
              />
              <small>Часто = 10 + бонус навыка Внимательность.</small>
            </label>
          </div>
        </section>

        <section className="panel player-panel">
          <div className="detail__header">
            <h2>4. Навыки</h2>
          </div>
          <div className="player-skills">
            {skillsForRender.map((skill) => {
              const characterSkill = template.skills.find((entry) => entry.key === skill.key)
              if (!characterSkill) return null

              const abilityMod = getAbilityMod(template.abilities[skill.ability].score)
              const profPart = characterSkill.proficient
                ? template.core.proficiencyBonus * (characterSkill.expertise ? 2 : 1)
                : 0
              const auto = abilityMod + profPart
              const total = characterSkill.bonusOverride ?? auto

              return (
                <div className="combat-save" key={skill.key}>
                  <span>{skill.label}</span>
                  <input
                    type="number"
                    value={characterSkill.bonusOverride ?? ''}
                    placeholder={`авто ${formatSigned(auto)}`}
                    onChange={(event) => {
                      const value = event.target.value.trim()
                      updateSkill(skill.key, {
                        bonusOverride: value === '' ? null : Number(value)
                      })
                    }}
                  />
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() =>
                      updateSkill(skill.key, {
                        proficient: !characterSkill.proficient
                      })
                    }
                  >
                    {characterSkill.proficient ? 'Проф' : 'Нет'}
                  </button>
                  <div className="player-save-total">Итог: {formatSigned(total)}</div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel player-panel">
          <div className="detail__header">
            <h2>5. Магия</h2>
          </div>

          <label className="checkbox player-checkbox">
            <input
              type="checkbox"
              checked={usesMagic}
              disabled={!selectedBehavior.usesMagic && Boolean(selectedClassKey)}
              onChange={(event) => {
                const checked = event.target.checked
                setUsesMagic(checked)
                if (!checked) {
                  setTemplate((prev) => ({
                    ...prev,
                    spellcasting: {
                      ...prev.spellcasting,
                      ability: '',
                      spellAttackBonus: 0,
                      spellSaveDc: 0,
                      spellsKnown: [{ name: '', level: 0, prepared: false, notes: '' }]
                    }
                  }))
                }
              }}
            />
            Магия используется этим персонажем
          </label>

          {!usesMagic ? (
            hintsEnabled ? (
              <p className="player-hint">
                {selectedBehavior.usesMagic
                  ? 'Можно отключить, если персонаж не использует магию в этой сборке.'
                  : 'Для немагических классов блок автоматически отключен.'}
              </p>
            ) : null
          ) : (
            <>
              <div className="form form--grid player-grid player-grid--magic">
                <select
                  value={template.spellcasting.ability}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      spellcasting: {
                        ...prev.spellcasting,
                        ability: event.target.value as AbilityKey | ''
                      }
                    }))
                  }
                >
                  <option value="">Базовая характеристика магии</option>
                  {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((ability) => (
                    <option key={ability} value={ability}>
                      {SAVE_LABELS[ability]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={template.spellcasting.spellSaveDc}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      spellcasting: {
                        ...prev.spellcasting,
                        spellSaveDc: clampNumber(Number(event.target.value), 0)
                      }
                    }))
                  }
                  placeholder="СЛ спасброска"
                />
                <input
                  type="number"
                  value={template.spellcasting.spellAttackBonus}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      spellcasting: {
                        ...prev.spellcasting,
                        spellAttackBonus: Number(event.target.value) || 0
                      }
                    }))
                  }
                  placeholder="Бонус атаки заклинанием"
                />
              </div>

              {selectedBehavior.spellSuggestions.length ? (
                <div className="chips">
                  {selectedBehavior.spellSuggestions.map((spell) => (
                    <button
                      key={spell}
                      type="button"
                      className="chip"
                      onClick={() => addSpellByName(spell)}
                    >
                      + {spell}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="dice">
                <input
                  value={spellDraft}
                  onChange={(event) => setSpellDraft(event.target.value)}
                  placeholder="Добавить заклинание вручную"
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    if (spellSuggestions.length > 0) {
                      const first = spellSuggestions[0]
                      addSpellEntry(
                        first.nameRu || first.nameEn,
                        first.level,
                        first.level === 0 || isPreparedCaster
                      )
                      setSpellDraft('')
                      return
                    }
                    addSpellByName(spellDraft)
                    setSpellDraft('')
                  }}
                />
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    addSpellByName(spellDraft)
                    setSpellDraft('')
                  }}
                >
                  Добавить
                </button>
              </div>

              {selectedClassKey &&
              ((classSpellIndex[selectedClassKey]?.length ?? 0) > 0 ||
                (structuredClassSpells[selectedClassKey]?.length ?? 0) > 0) ? (
                <label className="checkbox player-checkbox">
                  <input
                    type="checkbox"
                    checked={restrictToClassSpells}
                    onChange={(event) => setRestrictToClassSpells(event.target.checked)}
                  />
                  Показывать только заклинания класса ({selectedPreset?.label ?? selectedClassKey})
                </label>
              ) : null}

              {selectedClassKey && classAvailableSpellsByLevel.length > 0 ? (
                <div className="combat-action-card">
                  <div className="detail__label">
                    Доступные заклинания класса по уровню ({classAvailableSpellsByLevel.length})
                  </div>
                  <div className="home__actions">
                    <button type="button" className="button button--ghost" onClick={addRecommendedClassSpells}>
                      Добавить базовый набор
                    </button>
                    {hintsEnabled && (
                      <span className="player-hint">
                        Рекомендация: заговоров {recommendedCantripCount}, заклинаний{' '}
                        {recommendedLeveledCount > 0 ? recommendedLeveledCount : 0}
                      </span>
                    )}
                  </div>
                  <div className="spell-level-list">
                    {classSpellsGroupedByLevel.map(([level, spells]) => (
                      <div className="spell-level-group" key={`spell-level-${level}`}>
                        <div className="detail__label">
                          {level === 0 ? 'Заговоры' : `${level} круг`}
                        </div>
                        <div className="chips">
                          {spells.slice(0, 24).map((spell) => (
                            <button
                              key={`${spell.spell_name_en}-${spell.spell_level}`}
                              type="button"
                              className="chip"
                              onClick={() =>
                                addSpellEntry(
                                  spell.spell_name_ru || spell.spell_name_en,
                                  spell.spell_level,
                                  spell.spell_level === 0 || isPreparedCaster
                                )
                              }
                            >
                              {spell.spell_name_ru || spell.spell_name_en}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {spellSuggestions.length > 0 ? (
                <div className="search-results">
                  {spellSuggestions.map((spell) => (
                    <button
                      key={`${spell.nameRu}-${spell.nameEn}`}
                      type="button"
                      className="search-result"
                      onClick={() => {
                        addSpellEntry(spell.nameRu || spell.nameEn, spell.level, spell.level === 0 || isPreparedCaster)
                        setSpellDraft('')
                      }}
                    >
                      {(spell.nameRu || spell.nameEn)} · {spell.level} ур. · {spell.school}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="detail__entries">
                {template.spellcasting.spellsKnown.map((spell, index) => (
                  <div key={`${spell.name}-${index}`} className="combat-action-card">
                    <div className="form form--grid player-grid player-grid--spell-row">
                      <input
                        value={spell.name}
                        placeholder="Название"
                        onChange={(event) => {
                          const value = event.target.value
                          setTemplate((prev) => ({
                            ...prev,
                            spellcasting: {
                              ...prev.spellcasting,
                              spellsKnown: prev.spellcasting.spellsKnown.map((entry, i) =>
                                i === index ? { ...entry, name: value } : entry
                              )
                            }
                          }))
                        }}
                      />
                      <input
                        type="number"
                        value={spell.level}
                        placeholder="Уровень"
                        onChange={(event) => {
                          const value = clampNumber(Number(event.target.value), 0)
                          setTemplate((prev) => ({
                            ...prev,
                            spellcasting: {
                              ...prev.spellcasting,
                              spellsKnown: prev.spellcasting.spellsKnown.map((entry, i) =>
                                i === index ? { ...entry, level: value } : entry
                              )
                            }
                          }))
                        }}
                      />
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={spell.prepared}
                          onChange={(event) => {
                            const value = event.target.checked
                            setTemplate((prev) => ({
                              ...prev,
                              spellcasting: {
                                ...prev.spellcasting,
                                spellsKnown: prev.spellcasting.spellsKnown.map((entry, i) =>
                                  i === index ? { ...entry, prepared: value } : entry
                                )
                              }
                            }))
                          }}
                        />
                        Подготовлено
                      </label>
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => {
                          setTemplate((prev) => ({
                            ...prev,
                            spellcasting: {
                              ...prev.spellcasting,
                              spellsKnown: prev.spellcasting.spellsKnown.filter((_, i) => i !== index)
                            }
                          }))
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="panel player-panel">
          <div className="detail__header">
            <h2>6. Экспорт</h2>
          </div>
          {hintsEnabled && (
            <p className="player-hint">
              Экспортируй JSON и импортируй его в Beholder Eye&apos;s через кнопку «Импорт персонажа (JSON)».
            </p>
          )}
          <div className="home__actions">
            {!embedded && (
              <button type="button" className="button" onClick={sendCharacterToApp}>
                Отправить в приложение (1 клик)
              </button>
            )}
            {onSaveCharacter && (
              <button type="button" className="button" onClick={() => void saveCharacterToApp()}>
                Сохранить в кампанию
              </button>
            )}
            <button type="button" className="button" onClick={exportCharacter}>
              Скачать JSON персонажа
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                const reset = createEmptyCharacterTemplate()
                setTemplate(reset)
                setSelectedClassKey('')
                setSelectedRaceKey('')
                setSelectedSubraceKey('')
                setUsesMagic(false)
                setSpellDraft('')
              }}
            >
              Очистить форму
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PlayerForm
