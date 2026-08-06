
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import PlayerForm from './PlayerForm'
import type { PlayerCharacterTemplateV1 } from './characterTemplate'
import AppHeader from './components/AppHeader'
import HomeView from './components/HomeView'
import ReferenceModalDialog from './components/ReferenceModalDialog'
import CustomMonsterDialog from './components/CustomMonsterDialog'
import CustomWeaponDialog from './components/CustomWeaponDialog'
import CombatParticipantRow from './components/CombatParticipantRow'
import CombatParticipantCard, {
  type CombatCardPress,
  type CombatCardResize
} from './components/CombatParticipantCard'
import CombatParticipantDetailDialog from './components/CombatParticipantDetailDialog'
import CombatTurnControls from './components/CombatTurnControls'
import { useTtgOptions } from './hooks/useTtgOptions'
import './styles.css'
import { ViewKey, ReferenceSection, EntityKey, MonsterRow, SpellRow, ItemRow, WeaponRow, ArtifactRow, ListRow, ListResponse, DetailResponse, TtgArchetype, TtgClass, TtgSubrace, ReferenceRelated, TtgRace, TtgRule, TtgEntry, ReferenceModal, MonsterEntry, MonsterLegendary, MonsterLair, Campaign, Character, SaveMods, CombatCondition, CombatLogTone, ThemeMode, CombatLogEntry, CombatWeaponOption, CombatParticipant, CustomMonsterRow, CustomWeaponRow, CustomMonsterDraft, CustomMonsterActionDraft, InventoryEntry, CharacterData, defaultResponse, emptyCustomMonsterDraft, customMonsterSizeOptions, createEmptyCustomMonsterAction, entityLabels, rarityLabel, getDisplayName, getSubtitle, getListMeta, getDetailTitle, normalizeEntries, toText, getLocaleValue, getLocaleHtml, getDescriptionHtml, formatMonsterSaves, boolLabel, buildSpellSummary, buildItemSummary, buildWeaponSummary, buildArtifactSummary, getWeaponKey, parseWeaponAttackBonus, parseWeaponDamageExpr, parseDice, scoreToMod, formatMod, abilityKeys, abilityLabels, saveLabelToKey, emptySaves, getProfBonus, getStatMod, buildSaveModsFromCharacter, parseMonsterSaves, parseMonsterHp, parseMonsterAc, extractActionText, normalizeActionText, parseActionAttackBonus, parseActionDamageExpr, htmlToPlainText, stripHtml, renderInlineTokens, renderInlineMarkdown, SpellcastingTable, normalizeDashToken, parseSpellcastingTable, renderSpellcastingTable, renderFormattedText, renderSectionContent, getRuleSectionBucket, injectParagraphBreaks, buildReferenceSections, parseMonsterActions, parseSignedBonus, buildCharacterActions, parseOptionalInt, scoreToSaveMod, parseNamedMonsterEntries, toSignedBonus, attackKindLabel, parseAttackKindFromText, parseDamageTypeFromText, parseRangeFromText, parseTargetFromText, parseSaveFromText, normalizeDamageExpr, buildStructuredMonsterActions, customMonsterActionsFromData, buildCustomMonsterData, customMonsterDataToDraft, rollD20, rollDiceExpr, rollCriticalDamageExpr, getD20Tone, formatModifierDetail, dicePresets, ensureCharacterData, createDefaultCharacterData, useList, useDetail } from './appSupport'

export default function App(): JSX.Element {
  const isCombatBoardMode =
    new URLSearchParams(window.location.search).get('mode') === 'combat-board'
  const isReferenceWindowMode =
    new URLSearchParams(window.location.search).get('mode') === 'reference-window'
  const isCombatPanelMode =
    new URLSearchParams(window.location.search).get('mode') === 'combat-panel'
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem('beholder-theme')
    return stored === 'light' ? 'light' : 'dark'
  })
  const [combatBoardZoom, setCombatBoardZoom] = useState(() => {
    const stored = Number(window.localStorage.getItem('beholder-combat-board-zoom'))
    return Number.isFinite(stored) && stored >= 0.6 && stored <= 1.5 ? stored : 1
  })
  const [view, setView] = useState<ViewKey>(isCombatBoardMode ? 'combat' : isCombatPanelMode ? 'combat' : isReferenceWindowMode ? 'reference' : 'home')
  const activeView: ViewKey = isCombatBoardMode ? 'combat' : isCombatPanelMode ? 'combat' : isReferenceWindowMode ? 'reference' : view

  useEffect(() => {
    if (isCombatBoardMode && view !== 'combat') {
      setView('combat')
    }
    if (isCombatPanelMode && view !== 'combat') {
      setView('combat')
    }
    if (isReferenceWindowMode && view !== 'reference') {
      setView('reference')
    }
  }, [isCombatBoardMode, isCombatPanelMode, isReferenceWindowMode, view])

  useEffect(() => {
    if (!isCombatBoardMode) return
    const applyZoom = (next: number): void => {
      const factor = Math.min(1.5, Math.max(0.6, Math.round(next * 10) / 10))
      setCombatBoardZoom(factor)
      window.localStorage.setItem('beholder-combat-board-zoom', String(factor))
      void window.beholder.zoom.set(factor)
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!event.ctrlKey && !event.metaKey) return
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        applyZoom(combatBoardZoom + 0.1)
      } else if (event.key === '-') {
        event.preventDefault()
        applyZoom(combatBoardZoom - 0.1)
      } else if (event.key === '0') {
        event.preventDefault()
        applyZoom(1)
      }
    }
    const handleWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      applyZoom(combatBoardZoom + (event.deltaY < 0 ? 0.1 : -0.1))
    }
    void window.beholder.zoom.set(combatBoardZoom)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [combatBoardZoom, isCombatBoardMode])
  const [referenceSection, setReferenceSection] = useState<ReferenceSection>('ttg_classes')
  const [ttgKind, setTtgKind] = useState<'classes' | 'races' | 'rules'>('classes')
  const [ttgQuery, setTtgQuery] = useState('')
  const [ttgRuleTypeFilter, setTtgRuleTypeFilter] = useState<string>('all')
  const [ttgRuleSourceFilter, setTtgRuleSourceFilter] = useState<string>('all')
  const [ttgPinnedRuleSlugs, setTtgPinnedRuleSlugs] = useState<string[]>(() => {
    const stored = window.localStorage.getItem('ttg-pinned-rules')
    if (!stored) return []
    try {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed.filter((slug) => typeof slug === 'string') : []
    } catch {
      return []
    }
  })
  const [ttgSelectedSlug, setTtgSelectedSlug] = useState<string | null>(null)
  const {
    classes: ttgClasses,
    races: ttgRaces,
    rules: ttgRules,
    classOptions: ttgClassOptions,
    raceOptions: ttgRaceOptions,
    loading: ttgLoading,
    error: ttgError
  } = useTtgOptions(activeView === 'reference' || activeView === 'campaign')
  const [referenceModal, setReferenceModal] = useState<ReferenceModal | null>(null)
  const [entity, setEntity] = useState<EntityKey>('monsters')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [campaignImportStatus, setCampaignImportStatus] = useState<string | null>(null)
  const [fullCharacterFormOpen, setFullCharacterFormOpen] = useState(false)
  const [characterCreateName, setCharacterCreateName] = useState('')
  const [characterCreateRace, setCharacterCreateRace] = useState('')
  const [characterCreateClass, setCharacterCreateClass] = useState('')
  const [characterCreateLevel, setCharacterCreateLevel] = useState('1')
  const [characterCreateHpMax, setCharacterCreateHpMax] = useState('')
  const [characterCreateHpCurrent, setCharacterCreateHpCurrent] = useState('')
  const [characterCreateAc, setCharacterCreateAc] = useState('')
  const [characterCreateInit, setCharacterCreateInit] = useState('')
  const [characters, setCharacters] = useState<Character[]>([])
  const [charactersLoading, setCharactersLoading] = useState(false)
  const [charactersError, setCharactersError] = useState<string | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [characterSections, setCharacterSections] = useState({
    currency: false,
    inventory: false
  })
  const [editCharacter, setEditCharacter] = useState({
    name: '',
    race: '',
    class: '',
    level: ''
  })
  const [editCombat, setEditCombat] = useState({
    hpMax: '',
    hpCurrent: '',
    ac: '',
    speed: '',
    initiativeOverride: ''
  })
  const [editStats, setEditStats] = useState({
    str: { score: '', modOverride: '' },
    dex: { score: '', modOverride: '' },
    con: { score: '', modOverride: '' },
    int: { score: '', modOverride: '' },
    wis: { score: '', modOverride: '' },
    cha: { score: '', modOverride: '' }
  })
  const [editSaves, setEditSaves] = useState({
    str: { prof: false, override: '' },
    dex: { prof: false, override: '' },
    con: { prof: false, override: '' },
    int: { prof: false, override: '' },
    wis: { prof: false, override: '' },
    cha: { prof: false, override: '' }
  })
  const [editSkills, setEditSkills] = useState({
    acrobatics: { prof: false, override: '' },
    animalHandling: { prof: false, override: '' },
    arcana: { prof: false, override: '' },
    athletics: { prof: false, override: '' },
    deception: { prof: false, override: '' },
    history: { prof: false, override: '' },
    insight: { prof: false, override: '' },
    intimidation: { prof: false, override: '' },
    investigation: { prof: false, override: '' },
    medicine: { prof: false, override: '' },
    nature: { prof: false, override: '' },
    perception: { prof: false, override: '' },
    performance: { prof: false, override: '' },
    persuasion: { prof: false, override: '' },
    religion: { prof: false, override: '' },
    sleightOfHand: { prof: false, override: '' },
    stealth: { prof: false, override: '' },
    survival: { prof: false, override: '' }
  })
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    race: '',
    class: '',
    level: '1'
  })
  const [inventoryFilter, setInventoryFilter] = useState<
    'all' | 'consumables' | 'weapons' | 'armor' | 'artifacts'
  >('all')
  const [inventorySort, setInventorySort] = useState<'name' | 'qty'>('name')
  const [inventorySortDirection, setInventorySortDirection] = useState<'asc' | 'desc'>('asc')
  const [newInventoryItem, setNewInventoryItem] = useState({ name: '', qty: '1' })
  const [spellQuery, setSpellQuery] = useState('')
  const [spellResults, setSpellResults] = useState<Array<{ id: number; name: string; name_ru: string | null }>>([])
  const [itemQuery, setItemQuery] = useState('')
  const [itemResults, setItemResults] = useState<Array<{ id: number; name: string; name_ru: string | null }>>([])
  const [weaponQuery, setWeaponQuery] = useState('')
  const [weaponResults, setWeaponResults] = useState<Array<{
    id: number
    name: string
    name_ru: string | null
    catalog: 'items' | 'weapons'
  }>>([])
  const [artifactQuery, setArtifactQuery] = useState('')
  const [artifactResults, setArtifactResults] = useState<Array<{ id: number; name: string; name_ru: string | null }>>([])
  const [newAmmo, setNewAmmo] = useState({ name: '', qty: '1' })
  const [combatParticipants, setCombatParticipants] = useState<CombatParticipant[]>([])
  const [targetingSourceId, setTargetingSourceId] = useState<string | null>(null)
  const [targetingCursor, setTargetingCursor] = useState<{ x: number; y: number } | null>(null)
  const [linkDragSourceId, setLinkDragSourceId] = useState<string | null>(null)
  const [linkDragStart, setLinkDragStart] = useState<{ x: number; y: number } | null>(null)
  const [linkDragActive, setLinkDragActive] = useState(false)
  const [resizingCard, setResizingCard] = useState<CombatCardResize | null>(null)
  const [combatLinks, setCombatLinks] = useState<Array<{ id: string; d: string }>>([])
  const combatBoardRef = useRef<HTMLDivElement | null>(null)
  const combatCardRefs = useRef(new Map<string, HTMLDivElement>())
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const cardPressRef = useRef<CombatCardPress | null>(null)
  const [combatQuery, setCombatQuery] = useState('')
  const [combatResults, setCombatResults] = useState<Array<{ id: number; name: string; name_ru: string | null }>>([])
  const [combatError, setCombatError] = useState<string | null>(null)
  const [combatStatus, setCombatStatus] = useState<string | null>(null)
  const [customMonsterDraft, setCustomMonsterDraft] = useState<CustomMonsterDraft>(emptyCustomMonsterDraft)
  const [customMonsterActions, setCustomMonsterActions] = useState<CustomMonsterActionDraft[]>([
    createEmptyCustomMonsterAction()
  ])
  const [customMonsterRows, setCustomMonsterRows] = useState<CustomMonsterRow[]>([])
  const [customMonsterQuery, setCustomMonsterQuery] = useState('')
  const [customMonsterError, setCustomMonsterError] = useState<string | null>(null)
  const [editingCustomMonsterId, setEditingCustomMonsterId] = useState<number | null>(null)
  const [savingCustomMonster, setSavingCustomMonster] = useState(false)
  const [customMonsterModalOpen, setCustomMonsterModalOpen] = useState(false)
  const [customWeaponRows, setCustomWeaponRows] = useState<CustomWeaponRow[]>([])
  const [customWeaponQuery, setCustomWeaponQuery] = useState('')
  const [customWeaponError, setCustomWeaponError] = useState<string | null>(null)
  const [customWeaponModalOpen, setCustomWeaponModalOpen] = useState(false)
  const [savingCustomWeapon, setSavingCustomWeapon] = useState(false)
  const [editingCustomWeaponId, setEditingCustomWeaponId] = useState<number | null>(null)
  const [customWeaponDraft, setCustomWeaponDraft] = useState({
    name: '',
    kind: '',
    attackBonus: '',
    damage: '',
    damageType: '',
    rangeText: '',
    notes: ''
  })
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([])
  const [combatLogExpanded, setCombatLogExpanded] = useState(false)
  const [combatName, setCombatName] = useState('Сессия боя')
  const [combatSessions, setCombatSessions] = useState<Array<{ id: number; name: string }>>([])
  const [combatSessionsLoading, setCombatSessionsLoading] = useState(false)
  const [combatSessionsError, setCombatSessionsError] = useState<string | null>(null)
  const [selectedCombatId, setSelectedCombatId] = useState<number | null>(null)
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null)
  const [roundNumber, setRoundNumber] = useState(1)
  const [roundAnchorId, setRoundAnchorId] = useState<string | null>(null)
  const [combatDetailId, setCombatDetailId] = useState<string | null>(null)
  const [modal, setModal] = useState<{
    type: 'spells' | 'items' | 'weapons' | 'artifacts'
    id: number
  } | null>(null)
  const [modalDetail, setModalDetail] = useState<DetailResponse>(null)
  const [diceExpr, setDiceExpr] = useState('1d20+0')
  const [diceResult, setDiceResult] = useState<{ total: number; rolls: number[] } | null>(null)
  const [diceRolling, setDiceRolling] = useState(false)
  const [quickMod, setQuickMod] = useState('')
  const [rollOverlay, setRollOverlay] = useState<{
    label: string
    total: number
    detail: string
    tone: CombatLogTone
  } | null>(null)
  const rollOverlayTimerRef = useRef<number | null>(null)
  const [combatFilter, setCombatFilter] = useState<'all' | 'alive' | 'down' | 'concentration' | 'status'>('all')
  const [combatSearch, setCombatSearch] = useState('')
  const [impactFlash, setImpactFlash] = useState<{
    id: string
    tone: 'hit' | 'miss'
    value?: number | null
  } | null>(null)
  const referenceSectionForTabs = referenceSection as ReferenceSection

  const trimmedQuery = useMemo(() => query.trim(), [query])
  const { data, isLoading, error } = useList(entity, trimmedQuery)
  const { detail, isLoading: isDetailLoading } = useDetail(entity, selectedId)
  const isReferenceEntitySection =
    referenceSection === 'monsters' ||
    referenceSection === 'spells' ||
    referenceSection === 'items' ||
    referenceSection === 'weapons' ||
    referenceSection === 'artifacts'
  const isEntityLibraryView = activeView === 'reference' && isReferenceEntitySection
  const ttgSearch = ttgQuery.trim().toLowerCase()

  const ttgItems = useMemo(() => {
    const source =
      ttgKind === 'classes' ? ttgClasses : ttgKind === 'races' ? ttgRaces : ttgRules
    const filteredByRuleMeta =
      ttgKind !== 'rules'
        ? source
        : source.filter((entry) => {
            const matchType =
              ttgRuleTypeFilter === 'all' ||
              (entry.type ?? '').toLowerCase() === ttgRuleTypeFilter.toLowerCase()
            const sourceValue = (entry.source_name ?? entry.source_short ?? '').toLowerCase()
            const matchSource =
              ttgRuleSourceFilter === 'all' || sourceValue === ttgRuleSourceFilter.toLowerCase()
            return matchType && matchSource
          })
    if (!ttgSearch) return filteredByRuleMeta
    return filteredByRuleMeta.filter((entry) => {
      const haystack = [
        entry.slug,
        entry.name_ru,
        entry.name_en,
        'type' in entry ? entry.type : '',
        entry.source_short,
        entry.source_name
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(ttgSearch)
    })
  }, [
    ttgKind,
    ttgClasses,
    ttgRaces,
    ttgRules,
    ttgSearch,
    ttgRuleTypeFilter,
    ttgRuleSourceFilter
  ])

  const ttgRuleTypeOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        ttgRules
          .map((rule) => (rule.type ?? '').trim())
          .filter((value) => value.length > 0)
      )
    )
    return unique.sort((a, b) => a.localeCompare(b, 'ru'))
  }, [ttgRules])

  const ttgRuleSourceOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        ttgRules
          .map((rule) => (rule.source_name ?? rule.source_short ?? '').trim())
          .filter((value) => value.length > 0)
      )
    )
    return unique.sort((a, b) => a.localeCompare(b, 'ru'))
  }, [ttgRules])

  const pinnedRules = useMemo(() => {
    if (ttgPinnedRuleSlugs.length === 0) return []
    const lookup = new Map(
      ttgRules.map((rule) => [rule.slug ?? `${rule.name_ru ?? rule.name_en ?? ''}`, rule])
    )
    return ttgPinnedRuleSlugs
      .map((slug) => lookup.get(slug))
      .filter((rule): rule is TtgRule => Boolean(rule))
  }, [ttgRules, ttgPinnedRuleSlugs])

  const toggleRulePin = (slug: string) => {
    setTtgPinnedRuleSlugs((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [slug, ...prev].slice(0, 20)
    )
  }

  const ttgSelected = useMemo(() => {
    if (ttgItems.length === 0) return null
    if (!ttgSelectedSlug) return ttgItems[0]
    return ttgItems.find((entry) => entry.slug === ttgSelectedSlug) ?? ttgItems[0]
  }, [ttgItems, ttgSelectedSlug])

  const openReferenceTtgModal = (entry: TtgEntry) => {
    const isClass = referenceSection === 'ttg_classes'
    const isRule = referenceSection === 'ttg_rules'
    const sectionsFromData =
      'sections' in entry && Array.isArray(entry.sections)
        ? entry.sections
            .map((section) => ({
              title: section?.title ? String(section.title) : '',
              content: section?.content ? String(section.content) : ''
            }))
            .filter((section) => section.title && section.content)
        : []
    const sections =
      sectionsFromData.length > 0
        ? sectionsFromData
        : buildReferenceSections(entry.description_text ?? null, isClass)
    const related: ReferenceRelated[] =
      isClass && 'archetypes' in entry
        ? (entry.archetypes ?? []).map((arc) => ({
            title: arc.name_ru ?? arc.name_en ?? arc.slug ?? 'Архетип',
            subtitle: arc.source_name ?? arc.source_short ?? null,
            text: arc.description_text ?? null
          }))
        : !isClass && 'subraces' in entry
          ? (entry.subraces ?? []).map((sub) => ({
              title: sub.name_ru ?? sub.name_en ?? 'Подраса',
              subtitle: sub.source_name ?? sub.source_short ?? null,
              text: sub.description_text ?? null
            }))
          : []
    const columns: Array<{ label: string; value: string }> = [
      { label: 'Slug', value: entry.slug ?? '—' },
      { label: 'Источник', value: entry.source_name ?? entry.source_short ?? '—' }
    ]
    if (isRule && 'type' in entry) {
      columns.push({ label: 'Категория', value: entry.type ?? '—' })
    }
    if (isClass && 'hit_die' in entry) {
      columns.push({ label: 'Кость хитов', value: entry.hit_die ?? '—' })
    }
    if (!isClass && 'size' in entry) {
      columns.push({ label: 'Размер', value: entry.size ?? '—' })
      columns.push({ label: 'Скорость', value: entry.speed ?? '—' })
      columns.push({ label: 'Тёмное зрение', value: entry.darkvision ?? '—' })
    }
    setReferenceModal({
      kind: isClass ? 'ttg_class' : isRule ? 'ttg_rule' : 'ttg_race',
      slug: entry.slug ?? null,
      title: entry.name_ru ?? entry.name_en ?? entry.slug ?? 'Запись',
      subtitle: entry.name_ru && entry.name_en ? entry.name_en : null,
      columns,
      sections,
      related,
      text: sections.length === 0 ? entry.description_text ?? null : null
    })
  }

  const openReferenceEntityModal = async (row: ListRow) => {
    const targetEntity = referenceSection as EntityKey
    const detail = (await window.beholder[targetEntity].get(row.id as number)) as DetailResponse
    if (!detail) return
    const columns: Array<{ label: string; value: string }> = []
    if (targetEntity === 'monsters') {
      const data = detail.data as any
      columns.push(
        { label: 'Тип', value: [data?.size, data?.type, data?.alignment].filter(Boolean).join(' · ') || '—' },
        { label: 'КС', value: toText(data?.cr) },
        { label: 'Хиты', value: toText(data?.hp) },
        { label: 'КД', value: toText(data?.ac) }
      )
    }
    if (targetEntity === 'spells') {
      const data = detail.data as any
      columns.push(
        { label: 'Уровень', value: getLocaleValue(data, 'level') ?? '—' },
        { label: 'Школа', value: getLocaleValue(data, 'school') ?? '—' },
        { label: 'Время', value: getLocaleValue(data, 'castingTime') ?? '—' }
      )
    }
    if (targetEntity === 'items') {
      const data = detail.data as any
      columns.push(
        { label: 'Тип', value: getLocaleValue(data, 'type') ?? '—' },
        { label: 'Редкость', value: rarityLabel(data?.en?.rarity ?? data?.ru?.rarity) },
        { label: 'КД', value: toText(data?.en?.ac ?? data?.ru?.ac) }
      )
    }
    if (targetEntity === 'weapons') {
      const data = detail.data as any
      columns.push(
        { label: 'Тип', value: getLocaleValue(data, 'type') ?? getLocaleValue(data, 'weaponType') ?? '—' },
        { label: 'Урон', value: toText(data?.en?.damageVal ?? data?.ru?.damageVal ?? data?.damage) },
        { label: 'Тип урона', value: toText(data?.en?.damageType ?? data?.ru?.damageType ?? data?.damageType) }
      )
    }
    if (targetEntity === 'artifacts') {
      const data = detail.data as any
      columns.push(
        { label: 'Тип', value: getLocaleValue(data, 'type') ?? '—' },
        { label: 'Редкость', value: rarityLabel(data?.en?.rarity ?? data?.ru?.rarity) },
        { label: 'Настройка', value: toText(data?.en?.attunement ?? data?.ru?.attunement) }
      )
    }
    setReferenceModal({
      kind: 'entity',
      title: detail.name_ru ?? detail.name,
      subtitle: detail.name_ru && detail.name ? detail.name : null,
      columns,
      text: stripHtml(getDescriptionHtml(detail.data) || '')
    })
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
    window.localStorage.setItem('beholder-theme', themeMode)
  }, [themeMode])

  useEffect(() => {
    window.localStorage.setItem('ttg-pinned-rules', JSON.stringify(ttgPinnedRuleSlugs))
  }, [ttgPinnedRuleSlugs])

  useEffect(() => {
    if (referenceSection === 'ttg_classes') {
      setTtgKind('classes')
      return
    }
    if (referenceSection === 'ttg_races') {
      setTtgKind('races')
      return
    }
    if (referenceSection === 'ttg_rules') {
      setTtgKind('rules')
      return
    }
    setEntity(referenceSection)
  }, [referenceSection])

  useEffect(() => {
    setSelectedId(null)
  }, [entity])

  useEffect(() => {
    if (data.items.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !data.items.some((item) => item.id === selectedId)) {
      setSelectedId(data.items[0].id)
    }
  }, [data.items, selectedId])

  useEffect(() => {
    if (ttgItems.length === 0) {
      setTtgSelectedSlug(null)
      return
    }
    if (!ttgSelectedSlug || !ttgItems.some((entry) => entry.slug === ttgSelectedSlug)) {
      setTtgSelectedSlug(ttgItems[0]?.slug ?? null)
    }
  }, [ttgItems, ttgSelectedSlug])

  const monster = entity === 'monsters' ? detail?.data : null
  const legendary = monster?.legendary as MonsterLegendary | undefined
  const lair = monster?.lair as MonsterLair | undefined
  const traits = normalizeEntries(monster?.trait)
  const actions = normalizeEntries(monster?.action)
  const reactions = normalizeEntries(monster?.reaction)
  const legendaryList = normalizeEntries(legendary?.list ?? legendary)
  const lairList = normalizeEntries(lair?.list ?? lair)
  const monsterDescription = monster ? htmlToPlainText(getDescriptionHtml(monster)) : ''

  const spellData = entity === 'spells' ? detail?.data : null
  const itemData = entity === 'items' ? detail?.data : null
  const weaponData = entity === 'weapons' ? detail?.data : null
  const artifactData = entity === 'artifacts' ? detail?.data : null
  const selectedCharacterData = selectedCharacter ? ensureCharacterData(selectedCharacter.data) : null
  const detectInventoryGroup = (entry: InventoryEntry): 'consumables' | 'weapons' | 'armor' | 'artifacts' | 'other' => {
    if (entry.category === 'artifact') return 'artifacts'
    if (entry.category === 'weapon' || entry.category === 'custom_weapon') return 'weapons'
    const text = `${entry.name} ${entry.notes ?? ''}`.toLowerCase()
    if (/(зель|эликсир|potion|scroll|свиток|ration|припас|патрон|болт|стрел)/.test(text)) return 'consumables'
    if (/(меч|sword|лук|bow|арбалет|crossbow|кинжал|dagger|топор|axe|копь|spear|молот|hammer|булав|рапир|алебард|пика|дротик|пращ|whip|weapon)/.test(text)) return 'weapons'
    if (/(брон|armor|armour|щит|shield|кольчуг|латы|доспех|шлем)/.test(text)) return 'armor'
    return 'other'
  }
  const visibleInventory = useMemo(() => {
    if (!selectedCharacterData) return []
    const withIndex = selectedCharacterData.inventory.map((entry, index) => ({ entry, index }))
    const filtered = withIndex.filter(({ entry }) => {
      if (inventoryFilter === 'all') return true
      return detectInventoryGroup(entry) === inventoryFilter
    })
    return [...filtered].sort((a, b) => {
      const entryA = a.entry
      const entryB = b.entry
      const direction = inventorySortDirection === 'asc' ? 1 : -1
      if (inventorySort === 'qty') {
        const byQty = (entryA.qty - entryB.qty) * direction
        if (byQty !== 0) return byQty
        return entryA.name.localeCompare(entryB.name, 'ru') * direction
      }
      return entryA.name.localeCompare(entryB.name, 'ru') * direction
    })
  }, [selectedCharacterData, inventoryFilter, inventorySort, inventorySortDirection])

  const characterWeapons = useMemo(() => {
    if (!selectedCharacterData) return []
    return selectedCharacterData.weapons.map((weapon) => {
      const attackBonus =
        typeof weapon.attackBonus === 'number' && Number.isFinite(weapon.attackBonus)
          ? weapon.attackBonus
          : parseWeaponAttackBonus(weapon.summary)
      const damageExpr = weapon.damageExpr ?? parseWeaponDamageExpr(weapon.summary)
      return {
        ...weapon,
        key: getWeaponKey(weapon),
        attackBonus,
        damageExpr
      }
    })
  }, [selectedCharacterData])

  const loadCharacters = async () => {
    if (!campaign) return
    setCharactersLoading(true)
    setCharactersError(null)
    try {
      const rows = await window.beholder.characters.list(campaign.id)
      setCharacters(rows as Character[])
    } catch (error: any) {
      setCharactersError(error?.message ?? 'Не удалось загрузить персонажей')
      setCharacters([])
    } finally {
      setCharactersLoading(false)
    }
  }

  const loadCombatSessions = async () => {
    if (!campaign) return
    setCombatSessionsLoading(true)
    setCombatSessionsError(null)
    try {
      const rows = await window.beholder.combats.list(campaign.id)
      setCombatSessions(rows.map((row) => ({ id: row.id, name: row.name })))
    } catch (error: any) {
      setCombatSessionsError(error?.message ?? 'Не удалось загрузить список боёв')
      setCombatSessions([])
    } finally {
      setCombatSessionsLoading(false)
    }
  }

  useEffect(() => {
    window.beholder.campaign.get().then((existing) => {
      if (existing) {
        setCampaign(existing)
        setCampaignName(existing.name)
      }
    })
  }, [])

  useEffect(() => {
    if (!campaign) return
    void loadCharacters()
  }, [campaign])

  useEffect(() => {
    setCampaignImportStatus(null)
    setCombatStatus(null)
    setCharactersError(null)
    setCombatSessionsError(null)
  }, [campaign?.id])

  useEffect(() => {
    if (!campaign) return
    void loadCombatSessions()
  }, [campaign])

  useEffect(() => {
    if (!modal) {
      setModalDetail(null)
      return
    }
    window.beholder[modal.type].get(modal.id).then((detail) => {
      setModalDetail(detail as DetailResponse)
    })
  }, [modal])

  useEffect(() => {
    if (!spellQuery.trim()) {
      setSpellResults([])
      return
    }
    const handle = setTimeout(() => {
      window.beholder.spells.list({ query: spellQuery.trim(), limit: 6, offset: 0 }).then((res) => {
        setSpellResults(res.items as any)
      })
    }, 200)
    return () => clearTimeout(handle)
  }, [spellQuery])

  useEffect(() => {
    if (!itemQuery.trim()) {
      setItemResults([])
      return
    }
    const handle = setTimeout(() => {
      window.beholder.items.list({ query: itemQuery.trim(), limit: 6, offset: 0 }).then((res) => {
        setItemResults(res.items as any)
      })
    }, 200)
    return () => clearTimeout(handle)
  }, [itemQuery])

  useEffect(() => {
    if (!artifactQuery.trim()) {
      setArtifactResults([])
      return
    }
    const handle = setTimeout(() => {
      window.beholder.artifacts
        .list({ query: artifactQuery.trim(), limit: 6, offset: 0 })
        .then((res) => {
          setArtifactResults(res.items as any)
        })
    }, 200)
    return () => clearTimeout(handle)
  }, [artifactQuery])

  useEffect(() => {
    if (!weaponQuery.trim()) {
      setWeaponResults([])
      return
    }
    const handle = setTimeout(() => {
      const query = weaponQuery.trim()
      Promise.all([
        window.beholder.weapons.list({ query, limit: 8, offset: 0 }),
        window.beholder.items.list({ query, limit: 20, offset: 0 })
      ]).then(([weapons, items]) => {
        const itemWeapons = (items.items as any[]).filter((item) => {
          const searchable = `${item.type ?? ''} ${item.data_json ?? ''}`.toLocaleLowerCase('ru')
          return searchable.includes('оруж') || searchable.includes('weapon')
        })
        const merged = [
          ...(weapons.items as any[]).map((item) => ({ ...item, catalog: 'weapons' as const })),
          ...itemWeapons.map((item) => ({ ...item, catalog: 'items' as const }))
        ]
        const unique = new Map<string, (typeof merged)[number]>()
        for (const item of merged) {
          const key = (item.name_ru ?? item.name ?? '').trim().toLocaleLowerCase('ru')
          if (key && !unique.has(key)) unique.set(key, item)
        }
        setWeaponResults([...unique.values()].slice(0, 10))
      })
    }, 200)
    return () => clearTimeout(handle)
  }, [weaponQuery])

  useEffect(() => {
    if (!combatQuery.trim()) {
      setCombatResults([])
      setCombatError(null)
      return
    }
    const handle = setTimeout(() => {
      window.beholder.monsters
        .list({ query: combatQuery.trim(), limit: 6, offset: 0 })
        .then((res) => {
          setCombatResults(res.items as any)
          setCombatError(null)
        })
        .catch((err) => {
          setCombatResults([])
          setCombatError(err?.message ?? 'Ошибка поиска монстров')
        })
    }, 200)
    return () => clearTimeout(handle)
  }, [combatQuery])

  useEffect(() => {
    if (!campaign) {
      setCustomMonsterRows([])
      setCustomMonsterError(null)
      return
    }
    const handle = setTimeout(() => {
      window.beholder.customMonsters
        .list({
          campaignId: campaign.id,
          query: customMonsterQuery.trim() || undefined,
          limit: 20,
          offset: 0
        })
        .then((res) => {
          setCustomMonsterRows(res.items as CustomMonsterRow[])
          setCustomMonsterError(null)
        })
        .catch((err) => {
          setCustomMonsterRows([])
          setCustomMonsterError(err?.message ?? 'Ошибка списка кастомных монстров')
        })
    }, 200)
    return () => clearTimeout(handle)
  }, [campaign, customMonsterQuery])

  useEffect(() => {
    if (!campaign) {
      setCustomWeaponRows([])
      setCustomWeaponError(null)
      return
    }
    const handle = setTimeout(() => {
      window.beholder.customWeapons
        .list({
          campaignId: campaign.id,
          query: customWeaponQuery.trim() || undefined,
          limit: 20,
          offset: 0
        })
        .then((res) => {
          setCustomWeaponRows(res.items as CustomWeaponRow[])
          setCustomWeaponError(null)
        })
        .catch((err) => {
          setCustomWeaponRows([])
          setCustomWeaponError(err?.message ?? 'Ошибка списка кастомного оружия')
        })
    }, 200)
    return () => clearTimeout(handle)
  }, [campaign, customWeaponQuery])

  useEffect(() => {
    if (characters.length === 0) {
      setSelectedCharacterId(null)
      return
    }
    if (!selectedCharacterId || !characters.some((c) => c.id === selectedCharacterId)) {
      setSelectedCharacterId(characters[0].id)
    }
  }, [characters, selectedCharacterId])

  useEffect(() => {
    if (!selectedCharacterId) {
      setSelectedCharacter(null)
      return
    }
    window.beholder.characters.get(selectedCharacterId).then((row) => {
      setSelectedCharacter(row as Character | null)
    })
  }, [selectedCharacterId])

  useEffect(() => {
    if (!selectedCharacter) {
      setEditCharacter({ name: '', race: '', class: '', level: '' })
      return
    }
    setEditCharacter({
      name: selectedCharacter.name ?? '',
      race: selectedCharacter.race ?? '',
      class: selectedCharacter.class ?? '',
      level: selectedCharacter.level !== null && selectedCharacter.level !== undefined
        ? String(selectedCharacter.level)
        : ''
    })
    const data = ensureCharacterData(selectedCharacter.data)
    setEditCombat({
      hpMax: data.combat.hpMax !== null ? String(data.combat.hpMax) : '',
      hpCurrent: data.combat.hpCurrent !== null ? String(data.combat.hpCurrent) : '',
      ac: data.combat.ac !== null ? String(data.combat.ac) : '',
      speed: data.combat.speed !== null ? String(data.combat.speed) : '',
      initiativeOverride:
        data.combat.initiativeOverride !== null ? String(data.combat.initiativeOverride) : ''
    })
    setEditStats({
      str: {
        score: data.stats.str.score !== null ? String(data.stats.str.score) : '',
        modOverride:
          data.stats.str.modOverride !== null ? String(data.stats.str.modOverride) : ''
      },
      dex: {
        score: data.stats.dex.score !== null ? String(data.stats.dex.score) : '',
        modOverride:
          data.stats.dex.modOverride !== null ? String(data.stats.dex.modOverride) : ''
      },
      con: {
        score: data.stats.con.score !== null ? String(data.stats.con.score) : '',
        modOverride:
          data.stats.con.modOverride !== null ? String(data.stats.con.modOverride) : ''
      },
      int: {
        score: data.stats.int.score !== null ? String(data.stats.int.score) : '',
        modOverride:
          data.stats.int.modOverride !== null ? String(data.stats.int.modOverride) : ''
      },
      wis: {
        score: data.stats.wis.score !== null ? String(data.stats.wis.score) : '',
        modOverride:
          data.stats.wis.modOverride !== null ? String(data.stats.wis.modOverride) : ''
      },
      cha: {
        score: data.stats.cha.score !== null ? String(data.stats.cha.score) : '',
        modOverride:
          data.stats.cha.modOverride !== null ? String(data.stats.cha.modOverride) : ''
      }
    })
    setEditSaves({
      str: {
        prof: data.saves.str.prof,
        override: data.saves.str.override !== null ? String(data.saves.str.override) : ''
      },
      dex: {
        prof: data.saves.dex.prof,
        override: data.saves.dex.override !== null ? String(data.saves.dex.override) : ''
      },
      con: {
        prof: data.saves.con.prof,
        override: data.saves.con.override !== null ? String(data.saves.con.override) : ''
      },
      int: {
        prof: data.saves.int.prof,
        override: data.saves.int.override !== null ? String(data.saves.int.override) : ''
      },
      wis: {
        prof: data.saves.wis.prof,
        override: data.saves.wis.override !== null ? String(data.saves.wis.override) : ''
      },
      cha: {
        prof: data.saves.cha.prof,
        override: data.saves.cha.override !== null ? String(data.saves.cha.override) : ''
      }
    })
    setEditSkills({
      acrobatics: {
        prof: data.skills.acrobatics.prof,
        override:
          data.skills.acrobatics.override !== null
            ? String(data.skills.acrobatics.override)
            : ''
      },
      animalHandling: {
        prof: data.skills.animalHandling.prof,
        override:
          data.skills.animalHandling.override !== null
            ? String(data.skills.animalHandling.override)
            : ''
      },
      arcana: {
        prof: data.skills.arcana.prof,
        override: data.skills.arcana.override !== null ? String(data.skills.arcana.override) : ''
      },
      athletics: {
        prof: data.skills.athletics.prof,
        override:
          data.skills.athletics.override !== null
            ? String(data.skills.athletics.override)
            : ''
      },
      deception: {
        prof: data.skills.deception.prof,
        override:
          data.skills.deception.override !== null
            ? String(data.skills.deception.override)
            : ''
      },
      history: {
        prof: data.skills.history.prof,
        override:
          data.skills.history.override !== null ? String(data.skills.history.override) : ''
      },
      insight: {
        prof: data.skills.insight.prof,
        override:
          data.skills.insight.override !== null ? String(data.skills.insight.override) : ''
      },
      intimidation: {
        prof: data.skills.intimidation.prof,
        override:
          data.skills.intimidation.override !== null
            ? String(data.skills.intimidation.override)
            : ''
      },
      investigation: {
        prof: data.skills.investigation.prof,
        override:
          data.skills.investigation.override !== null
            ? String(data.skills.investigation.override)
            : ''
      },
      medicine: {
        prof: data.skills.medicine.prof,
        override:
          data.skills.medicine.override !== null ? String(data.skills.medicine.override) : ''
      },
      nature: {
        prof: data.skills.nature.prof,
        override:
          data.skills.nature.override !== null ? String(data.skills.nature.override) : ''
      },
      perception: {
        prof: data.skills.perception.prof,
        override:
          data.skills.perception.override !== null
            ? String(data.skills.perception.override)
            : ''
      },
      performance: {
        prof: data.skills.performance.prof,
        override:
          data.skills.performance.override !== null
            ? String(data.skills.performance.override)
            : ''
      },
      persuasion: {
        prof: data.skills.persuasion.prof,
        override:
          data.skills.persuasion.override !== null
            ? String(data.skills.persuasion.override)
            : ''
      },
      religion: {
        prof: data.skills.religion.prof,
        override:
          data.skills.religion.override !== null ? String(data.skills.religion.override) : ''
      },
      sleightOfHand: {
        prof: data.skills.sleightOfHand.prof,
        override:
          data.skills.sleightOfHand.override !== null
            ? String(data.skills.sleightOfHand.override)
            : ''
      },
      stealth: {
        prof: data.skills.stealth.prof,
        override:
          data.skills.stealth.override !== null ? String(data.skills.stealth.override) : ''
      },
      survival: {
        prof: data.skills.survival.prof,
        override:
          data.skills.survival.override !== null ? String(data.skills.survival.override) : ''
      }
    })
  }, [selectedCharacter])

  const handleCreateCampaign = async () => {
    const name = campaignName.trim()
    if (!name) return
    const result = await window.beholder.campaign.create(name)
    setCampaign({ id: result.id, name })
  }

  const handleRenameCampaign = async () => {
    if (!campaign) return
    const name = campaignName.trim()
    if (!name) return
    await window.beholder.campaign.update({ id: campaign.id, name })
    setCampaign({ ...campaign, name })
    setCampaignImportStatus(`Название кампании обновлено: ${name}`)
  }

  const handleDeleteCampaign = async () => {
    if (!campaign) return
    const confirmed = window.confirm(
      `Удалить кампанию "${campaign.name}"? Это удалит всех персонажей, бои и кастомных монстров.`
    )
    if (!confirmed) return
    await window.beholder.campaign.delete(campaign.id)
    setCampaign(null)
    setCampaignName('')
    setCampaignImportStatus('Кампания удалена.')
    setCharacters([])
    setSelectedCharacterId(null)
    setSelectedCharacter(null)
    setCombatSessions([])
    resetCombat()
  }

  const handleCreateCharacter = async () => {
    if (!campaign) return
    const name = newCharacter.name.trim()
    if (!name) return
    await window.beholder.characters.create({
      campaignId: campaign.id,
      name,
      race: newCharacter.race.trim() || undefined,
      class: newCharacter.class.trim() || undefined,
      level: newCharacter.level ? Number(newCharacter.level) : undefined
    })
    await loadCharacters()
    setNewCharacter({ name: '', race: '', class: '', level: '1' })
  }

  const handleImportCharacterFromFile = async () => {
    if (!campaign) return
    const result = await window.beholder.characters.import(campaign.id)
    if (result.canceled) return
    if (result.error) {
      setCampaignImportStatus(`Ошибка импорта: ${result.error}`)
      return
    }
    await loadCharacters()
    setCampaignImportStatus(
      result.name ? `Импортирован персонаж: ${result.name}` : 'Персонаж импортирован'
    )
  }

  const openPlayerFormForOneClickImport = () => {
    window.open(
      `${window.location.origin}${window.location.pathname}?mode=player-form`,
      '_blank'
    )
    setCampaignImportStatus('Открой форму, заполни персонажа и нажми «Отправить в приложение (1 клик)».')
  }

  const handleCreateQuickCharacter = async () => {
    if (!campaign) return
    const name = characterCreateName.trim()
    if (!name) {
      setCampaignImportStatus('Укажи имя персонажа.')
      return
    }
    const level = characterCreateLevel.trim() ? Number(characterCreateLevel) : 1
    if (Number.isNaN(level) || level < 1) {
      setCampaignImportStatus('Уровень должен быть числом >= 1.')
      return
    }
    const hpMax = characterCreateHpMax.trim() ? Number(characterCreateHpMax) : null
    const hpCurrent = characterCreateHpCurrent.trim()
      ? Number(characterCreateHpCurrent)
      : hpMax
    const ac = characterCreateAc.trim() ? Number(characterCreateAc) : null
    const initiativeOverride = characterCreateInit.trim()
      ? Number(characterCreateInit)
      : null
    if ([hpMax, hpCurrent, ac, initiativeOverride].some((value) => value !== null && Number.isNaN(value))) {
      setCampaignImportStatus('Числовые поля должны быть корректными числами.')
      return
    }
    const data = createDefaultCharacterData()
    data.combat.hpMax = hpMax
    data.combat.hpCurrent = hpCurrent
    data.combat.ac = ac
    data.combat.initiativeOverride = initiativeOverride
    try {
      const result = await window.beholder.characters.create({
        campaignId: campaign.id,
        name,
        race: characterCreateRace.trim() || undefined,
        class: characterCreateClass.trim() || undefined,
        level
      })
      await window.beholder.characters.updateData({ id: result.id, data })
      setCampaignImportStatus(`Создан персонаж: ${name}`)
      setCharacterCreateName('')
      setCharacterCreateRace('')
      setCharacterCreateClass('')
      setCharacterCreateLevel('1')
      setCharacterCreateHpMax('')
      setCharacterCreateHpCurrent('')
      setCharacterCreateAc('')
      setCharacterCreateInit('')
      await loadCharacters()
    } catch (err: any) {
      setCampaignImportStatus(err?.message ?? 'Не удалось создать персонажа.')
    }
  }

  const handleCreateCharacterFromFullForm = async (payload: PlayerCharacterTemplateV1) => {
    if (!campaign) return
    const name = payload.identity.name.trim()
    if (!name) {
      setCampaignImportStatus('Укажи имя персонажа в форме.')
      return
    }

    const parseSpeed = (value: string): number | null => {
      const match = value.match(/\d+/)
      if (!match) return null
      const parsed = Number(match[0])
      return Number.isFinite(parsed) ? parsed : null
    }

    const data = createDefaultCharacterData()
    data.currency = {
      cp: Number.isFinite(payload.equipment.currency.cp) ? payload.equipment.currency.cp : 0,
      sp: Number.isFinite(payload.equipment.currency.sp) ? payload.equipment.currency.sp : 0,
      ep: Number.isFinite(payload.equipment.currency.ep) ? payload.equipment.currency.ep : 0,
      gp: Number.isFinite(payload.equipment.currency.gp) ? payload.equipment.currency.gp : 0,
      pp: Number.isFinite(payload.equipment.currency.pp) ? payload.equipment.currency.pp : 0
    }
    data.inventory = payload.equipment.inventory
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        qty: Number.isFinite(item.qty) ? item.qty : 1,
        notes: item.notes ?? '',
        category: 'manual'
      }))
    data.items = data.inventory.map((item) => ({ name: item.name, notes: item.notes }))
    data.spells = payload.spellcasting.spellsKnown
      .filter((spell) => spell.name.trim())
      .map((spell) => ({
        name: spell.name.trim(),
        level: spell.level,
        prepared: spell.prepared,
        notes: spell.notes ?? ''
      }))
    data.notes = [
      payload.traits.featuresAndTraits,
      payload.traits.backstory,
      payload.traits.personalityTraits,
      payload.traits.ideals,
      payload.traits.bonds,
      payload.traits.flaws
    ]
      .map((entry) => entry.trim())
      .filter(Boolean)
      .join('\n\n')
    data.combat.hpMax = payload.core.hitPointsMax
    data.combat.hpCurrent = payload.core.hitPointsCurrent
    data.combat.ac = payload.core.armorClass
    data.combat.speed = parseSpeed(payload.core.speed)
    data.combat.initiativeOverride = payload.core.initiative
    data.stats.str.score = payload.abilities.str.score
    data.stats.dex.score = payload.abilities.dex.score
    data.stats.con.score = payload.abilities.con.score
    data.stats.int.score = payload.abilities.int.score
    data.stats.wis.score = payload.abilities.wis.score
    data.stats.cha.score = payload.abilities.cha.score
    data.saves.str.prof = payload.saves.str.proficient
    data.saves.dex.prof = payload.saves.dex.proficient
    data.saves.con.prof = payload.saves.con.proficient
    data.saves.int.prof = payload.saves.int.proficient
    data.saves.wis.prof = payload.saves.wis.proficient
    data.saves.cha.prof = payload.saves.cha.proficient
    data.saves.str.override = payload.saves.str.bonusOverride
    data.saves.dex.override = payload.saves.dex.bonusOverride
    data.saves.con.override = payload.saves.con.bonusOverride
    data.saves.int.override = payload.saves.int.bonusOverride
    data.saves.wis.override = payload.saves.wis.bonusOverride
    data.saves.cha.override = payload.saves.cha.bonusOverride

    payload.skills.forEach((skill) => {
      if (!(skill.key in data.skills)) return
      const key = skill.key as keyof CharacterData['skills']
      data.skills[key].prof = skill.proficient || skill.expertise
      data.skills[key].override = skill.bonusOverride
    })

    try {
      const result = await window.beholder.characters.create({
        campaignId: campaign.id,
        name,
        race: payload.identity.race.trim() || undefined,
        class: payload.identity.className.trim() || undefined,
        level: payload.identity.level || undefined
      })
      await window.beholder.characters.updateData({ id: result.id, data })
      await loadCharacters()
      setFullCharacterFormOpen(false)
      setCampaignImportStatus(`Создан персонаж: ${name}`)
    } catch (err: any) {
      setCampaignImportStatus(err?.message ?? 'Не удалось создать персонажа из полной формы.')
    }
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: unknown } | null
      if (!data || data.type !== 'beholder:character-import') return
      if (!campaign) {
        setCampaignImportStatus('Сначала создай или выбери кампанию, затем повтори отправку.')
        return
      }
      const payload = data.payload as PlayerCharacterTemplateV1 | undefined
      if (!payload || payload.version !== 'beholder.character.v1') {
        setCampaignImportStatus('Получены некорректные данные персонажа.')
        return
      }
      void handleCreateCharacterFromFullForm(payload)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [campaign, handleCreateCharacterFromFullForm])

  const refreshSelectedCharacter = async () => {
    if (!selectedCharacterId) return
    const row = await window.beholder.characters.get(selectedCharacterId)
    setSelectedCharacter(row as Character | null)
  }

  const updateCharacterData = async (data: CharacterData) => {
    if (!selectedCharacterId) return
    await window.beholder.characters.updateData({ id: selectedCharacterId, data })
    await refreshSelectedCharacter()
    if (campaign) {
      await loadCharacters()
    }
  }

  const handleUpdateCharacterBase = async () => {
    if (!selectedCharacterId) return
    const name = editCharacter.name.trim()
    if (!name) return
    await window.beholder.characters.updateBase({
      id: selectedCharacterId,
      name,
      race: editCharacter.race.trim() || undefined,
      class: editCharacter.class.trim() || undefined,
      level: editCharacter.level ? Number(editCharacter.level) : undefined
    })
    await refreshSelectedCharacter()
    if (campaign) {
      await loadCharacters()
    }
  }

  const handleDeleteCharacter = async () => {
    if (!selectedCharacterId || !selectedCharacter) return
    const confirmed = window.confirm(`Удалить персонажа "${selectedCharacter.name}"?`)
    if (!confirmed) return
    await window.beholder.characters.delete(selectedCharacterId)
    await loadCharacters()
    setSelectedCharacter(null)
    setCampaignImportStatus(`Персонаж "${selectedCharacter.name}" удалён.`)
  }

  const handleExportCharacter = async () => {
    if (!selectedCharacterId || !selectedCharacter) return
    const result = await window.beholder.characters.export(selectedCharacterId)
    if (result?.canceled) return
    setCampaignImportStatus(`Экспортирован персонаж: ${selectedCharacter.name}`)
  }

  const handleSaveCombatAndStats = async () => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.combat = {
      hpMax: editCombat.hpMax ? Number(editCombat.hpMax) : null,
      hpCurrent: editCombat.hpCurrent ? Number(editCombat.hpCurrent) : null,
      ac: editCombat.ac ? Number(editCombat.ac) : null,
      speed: editCombat.speed ? Number(editCombat.speed) : null,
      initiativeOverride: editCombat.initiativeOverride
        ? Number(editCombat.initiativeOverride)
        : null
    }
    const makeStat = (stat: { score: string; modOverride: string }) => ({
      score: stat.score ? Number(stat.score) : null,
      modOverride: stat.modOverride ? Number(stat.modOverride) : null
    })
    data.stats = {
      str: makeStat(editStats.str),
      dex: makeStat(editStats.dex),
      con: makeStat(editStats.con),
      int: makeStat(editStats.int),
      wis: makeStat(editStats.wis),
      cha: makeStat(editStats.cha)
    }
    data.saves = {
      str: {
        prof: editSaves.str.prof,
        override: editSaves.str.override ? Number(editSaves.str.override) : null
      },
      dex: {
        prof: editSaves.dex.prof,
        override: editSaves.dex.override ? Number(editSaves.dex.override) : null
      },
      con: {
        prof: editSaves.con.prof,
        override: editSaves.con.override ? Number(editSaves.con.override) : null
      },
      int: {
        prof: editSaves.int.prof,
        override: editSaves.int.override ? Number(editSaves.int.override) : null
      },
      wis: {
        prof: editSaves.wis.prof,
        override: editSaves.wis.override ? Number(editSaves.wis.override) : null
      },
      cha: {
        prof: editSaves.cha.prof,
        override: editSaves.cha.override ? Number(editSaves.cha.override) : null
      }
    }
    data.skills = {
      acrobatics: {
        prof: editSkills.acrobatics.prof,
        override: editSkills.acrobatics.override ? Number(editSkills.acrobatics.override) : null
      },
      animalHandling: {
        prof: editSkills.animalHandling.prof,
        override: editSkills.animalHandling.override
          ? Number(editSkills.animalHandling.override)
          : null
      },
      arcana: {
        prof: editSkills.arcana.prof,
        override: editSkills.arcana.override ? Number(editSkills.arcana.override) : null
      },
      athletics: {
        prof: editSkills.athletics.prof,
        override: editSkills.athletics.override ? Number(editSkills.athletics.override) : null
      },
      deception: {
        prof: editSkills.deception.prof,
        override: editSkills.deception.override ? Number(editSkills.deception.override) : null
      },
      history: {
        prof: editSkills.history.prof,
        override: editSkills.history.override ? Number(editSkills.history.override) : null
      },
      insight: {
        prof: editSkills.insight.prof,
        override: editSkills.insight.override ? Number(editSkills.insight.override) : null
      },
      intimidation: {
        prof: editSkills.intimidation.prof,
        override: editSkills.intimidation.override
          ? Number(editSkills.intimidation.override)
          : null
      },
      investigation: {
        prof: editSkills.investigation.prof,
        override: editSkills.investigation.override
          ? Number(editSkills.investigation.override)
          : null
      },
      medicine: {
        prof: editSkills.medicine.prof,
        override: editSkills.medicine.override ? Number(editSkills.medicine.override) : null
      },
      nature: {
        prof: editSkills.nature.prof,
        override: editSkills.nature.override ? Number(editSkills.nature.override) : null
      },
      perception: {
        prof: editSkills.perception.prof,
        override: editSkills.perception.override ? Number(editSkills.perception.override) : null
      },
      performance: {
        prof: editSkills.performance.prof,
        override: editSkills.performance.override ? Number(editSkills.performance.override) : null
      },
      persuasion: {
        prof: editSkills.persuasion.prof,
        override: editSkills.persuasion.override ? Number(editSkills.persuasion.override) : null
      },
      religion: {
        prof: editSkills.religion.prof,
        override: editSkills.religion.override ? Number(editSkills.religion.override) : null
      },
      sleightOfHand: {
        prof: editSkills.sleightOfHand.prof,
        override: editSkills.sleightOfHand.override
          ? Number(editSkills.sleightOfHand.override)
          : null
      },
      stealth: {
        prof: editSkills.stealth.prof,
        override: editSkills.stealth.override ? Number(editSkills.stealth.override) : null
      },
      survival: {
        prof: editSkills.survival.prof,
        override: editSkills.survival.override ? Number(editSkills.survival.override) : null
      }
    }
    await updateCharacterData(data)
  }

  const profBonus = (() => {
    const level = selectedCharacter?.level ?? 1
    return 2 + Math.floor((Math.max(level, 1) - 1) / 4)
  })()

  const getStatMod = (key: keyof CharacterData['stats']) => {
    const current = editStats[key]
    const score = current.score ? Number(current.score) : null
    const auto = scoreToMod(score)
    if (current.modOverride !== '') {
      const value = Number(current.modOverride)
      return Number.isNaN(value) ? auto : value
    }
    return auto
  }

  const handleAddInventory = async () => {
    if (!selectedCharacter) return
    const name = newInventoryItem.name.trim()
    const qty = Number(newInventoryItem.qty || 1)
    if (!name) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.inventory = [
      ...data.inventory,
      { name, qty: Number.isFinite(qty) ? qty : 1, notes: '', category: 'manual' }
    ]
    await updateCharacterData(data)
    setNewInventoryItem({ name: '', qty: '1' })
  }

  const handleRemoveInventory = async (index: number) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.inventory = data.inventory.filter((_, i) => i !== index)
    await updateCharacterData(data)
  }

  const handleUpdateInventoryItem = async (
    index: number,
    patch: Partial<{ name: string; qty: number; notes: string }>
  ) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    if (!data.inventory[index]) return
    const current = data.inventory[index]
    const nextName =
      patch.name === undefined ? current.name : patch.name.trim() || current.name
    const nextQtyRaw = patch.qty === undefined ? current.qty : Math.floor(patch.qty)
    const nextQty = Number.isFinite(nextQtyRaw) ? Math.max(1, nextQtyRaw) : current.qty
    const nextNotes = patch.notes === undefined ? current.notes ?? '' : patch.notes
    data.inventory[index] = { ...current, name: nextName, qty: nextQty, notes: nextNotes }
    await updateCharacterData(data)
  }

  const addInventoryEntry = (
    inventory: CharacterData['inventory'],
    entry: { name: string; qty: number; notes?: string; category?: InventoryEntry['category'] }
  ): CharacterData['inventory'] => {
    const normalizedName = entry.name.trim().toLowerCase()
    if (!normalizedName) return inventory
    const existingIndex = inventory.findIndex(
      (item) => item.name.trim().toLowerCase() === normalizedName
    )
    if (existingIndex < 0) {
      return [
        ...inventory,
        {
          name: entry.name.trim(),
          qty: Math.max(1, entry.qty),
          notes: entry.notes ?? '',
          category: entry.category ?? 'manual'
        }
      ]
    }
    return inventory.map((item, index) =>
      index === existingIndex
        ? {
            ...item,
            qty: Math.max(1, item.qty + Math.max(1, entry.qty)),
            notes: item.notes || entry.notes ? [item.notes ?? '', entry.notes ?? ''].filter(Boolean).join(' · ') : ''
          }
        : item
    )
  }

  const handleAddInventoryFromLibrary = async (kind: 'items' | 'weapons' | 'artifacts', id: number) => {
    if (!selectedCharacter) return
    const detail = (await window.beholder[kind].get(id)) as any
    if (!detail) return
    const name = (detail.name_ru ?? detail.name ?? '').trim()
    if (!name) return
    const data = ensureCharacterData(selectedCharacter.data)
    const detailText = `${detail?.type ?? ''} ${JSON.stringify(detail?.data ?? {})}`.toLocaleLowerCase('ru')
    const itemIsWeapon =
      kind === 'items' && (detailText.includes('оруж') || detailText.includes('weapon'))
    const effectiveKind = itemIsWeapon ? 'weapons' : kind
    const notes =
      effectiveKind === 'items'
        ? buildItemSummary(detail.data)
        : effectiveKind === 'weapons'
          ? buildWeaponSummary(detail.data)
          : buildArtifactSummary(detail.data)
    data.inventory = addInventoryEntry(data.inventory, {
      name,
      qty: 1,
      notes,
      category: effectiveKind === 'items' ? 'item' : effectiveKind === 'weapons' ? 'weapon' : 'artifact'
    })
    if (effectiveKind === 'items') {
      data.items = [...data.items, { id, name, summary: buildItemSummary(detail.data) }]
      setItemQuery('')
      setItemResults([])
    } else if (effectiveKind === 'weapons') {
      const rawDamage = detail?.data?.en?.damageVal ?? detail?.data?.ru?.damageVal ?? detail?.data?.damage
      data.weapons = [
        ...data.weapons,
        {
          id,
          name,
          summary: buildWeaponSummary(detail.data),
          attackBonus:
            typeof detail?.data?.attackBonus === 'number' && Number.isFinite(detail.data.attackBonus)
              ? detail.data.attackBonus
              : null,
          damageExpr: typeof rawDamage === 'string' ? normalizeDamageExpr(rawDamage) : null
        }
      ]
      setWeaponQuery('')
      setWeaponResults([])
      if (kind === 'items') {
        setItemQuery('')
        setItemResults([])
      }
    } else {
      data.artifacts = [...data.artifacts, { id, name, summary: buildArtifactSummary(detail.data) }]
      setArtifactQuery('')
      setArtifactResults([])
    }
    await updateCharacterData(data)
  }

  const handleSetCurrency = async (key: keyof CharacterData['currency'], value: number) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.currency[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
    await updateCharacterData(data)
  }

  const handleAdjustCurrency = async (key: keyof CharacterData['currency'], delta: number) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.currency[key] = Math.max(
      0,
      Math.floor((Number.isFinite(data.currency[key]) ? data.currency[key] : 0) + delta)
    )
    await updateCharacterData(data)
  }

  const handleAddSpell = async () => {
    if (!selectedCharacter) return
    const name = spellQuery.trim()
    if (!name) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.spells = [...data.spells, { name, summary: '' }]
    await updateCharacterData(data)
    setSpellQuery('')
  }

  const handleRemoveSpell = async (index: number) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.spells = data.spells.filter((_, i) => i !== index)
    await updateCharacterData(data)
  }

  const handleAddSpellFromLibrary = async (id: number) => {
    if (!selectedCharacter) return
    const detail = (await window.beholder.spells.get(id)) as any
    if (!detail) return
    const data = ensureCharacterData(selectedCharacter.data)
    const name = detail.name_ru ?? detail.name
    data.spells = [...data.spells, { id, name, summary: buildSpellSummary(detail.data) }]
    await updateCharacterData(data)
    setSpellQuery('')
    setSpellResults([])
  }

  const handleAddItemFromLibrary = async (id: number) => {
    if (!selectedCharacter) return
    const detail = (await window.beholder.items.get(id)) as any
    if (!detail) return
    const data = ensureCharacterData(selectedCharacter.data)
    const name = detail.name_ru ?? detail.name
    data.items = [...data.items, { id, name, summary: buildItemSummary(detail.data) }]
    await updateCharacterData(data)
    setItemQuery('')
    setItemResults([])
  }

  const handleRemoveItem = async (index: number) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.items = data.items.filter((_, i) => i !== index)
    await updateCharacterData(data)
  }

  const handleAddArtifactFromLibrary = async (id: number) => {
    if (!selectedCharacter) return
    const detail = (await window.beholder.artifacts.get(id)) as any
    if (!detail) return
    const data = ensureCharacterData(selectedCharacter.data)
    const name = detail.name_ru ?? detail.name
    data.artifacts = [...data.artifacts, { id, name, summary: buildArtifactSummary(detail.data) }]
    await updateCharacterData(data)
    setArtifactQuery('')
    setArtifactResults([])
  }

  const handleRemoveArtifact = async (index: number) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.artifacts = data.artifacts.filter((_, i) => i !== index)
    await updateCharacterData(data)
  }

  const openModal = (type: 'spells' | 'items' | 'weapons' | 'artifacts', id?: number) => {
    if (!id) return
    setModal({ type, id })
  }

  const closeModal = () => setModal(null)
  const closeCombatDetail = () => setCombatDetailId(null)

  const handleSetEquippedWeapon = async (
    slot: 'primaryWeaponKey' | 'secondaryWeaponKey',
    weaponKey: string
  ) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.equipment = {
      ...data.equipment,
      [slot]: weaponKey || null
    }
    await updateCharacterData(data)
  }

  const handleRemoveWeapon = async (weaponKey: string) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.weapons = data.weapons.filter((weapon) => getWeaponKey(weapon) !== weaponKey)
    if (data.equipment.primaryWeaponKey === weaponKey) data.equipment.primaryWeaponKey = null
    if (data.equipment.secondaryWeaponKey === weaponKey) data.equipment.secondaryWeaponKey = null
    await updateCharacterData(data)
  }

  const addCharacterToCombat = (weaponKey?: string) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    const saves = buildSaveModsFromCharacter(data, selectedCharacter.level ?? null)
    const actions = buildCharacterActions(data)
    const baseAttack = deriveBaseAttack(actions)
    const resolvedWeapons = data.weapons.map((weapon) => {
      const attackBonus =
        typeof weapon.attackBonus === 'number' && Number.isFinite(weapon.attackBonus)
          ? weapon.attackBonus
          : parseWeaponAttackBonus(weapon.summary)
      const damageExpr = weapon.damageExpr ?? parseWeaponDamageExpr(weapon.summary)
      return {
        ...weapon,
        key: getWeaponKey(weapon),
        attackBonus,
        damageExpr
      }
    })
    const selectedWeaponKey = weaponKey || data.equipment.primaryWeaponKey
    const selectedWeapon =
      resolvedWeapons.find((weapon) => weapon.key === selectedWeaponKey) ?? null
    const attackBonus = selectedWeapon?.attackBonus ?? baseAttack.attackBonus
    const damageExpr = selectedWeapon?.damageExpr ?? baseAttack.damageExpr ?? '1d6'
    const participant: CombatParticipant = {
      id: `c-${selectedCharacter.id}-${Date.now()}`,
      kind: 'character',
      sourceId: selectedCharacter.id,
      name: selectedCharacter.name,
      targetId: null,
      size: null,
      hpMax: data.combat.hpMax,
      hpCurrent: data.combat.hpCurrent ?? data.combat.hpMax,
      ac: data.combat.ac,
      initiative: data.combat.initiativeOverride,
      attackBonus,
      damageExpr,
      effects: [],
      conditions: [],
      concentration: null,
      saves,
      weaponOptions:
        resolvedWeapons.length > 0
          ? resolvedWeapons.map((weapon) => ({
              key: weapon.key,
              name: weapon.name,
              attackBonus: weapon.attackBonus,
              damageExpr: weapon.damageExpr
            }))
          : undefined,
      selectedWeaponKey: selectedWeapon?.key ?? null,
      actions,
      notes: selectedWeapon ? `Оружие: ${selectedWeapon.name}` : ''
    }
    setCombatParticipants((prev) => [...prev, participant])
  }

  const addMonsterToCombat = async (monster: { id: number; name: string; name_ru: string | null }) => {
    let detail: any = null
    try {
      detail = (await window.beholder.monsters.get(monster.id)) as any
    } catch {
      detail = null
    }
    const hp = parseMonsterHp(detail?.data?.hp)
    const ac = parseMonsterAc(detail?.data?.ac)
    const saves = parseMonsterSaves(detail?.data)
    const actions = parseMonsterActions(detail?.data)
    const baseAttack = deriveBaseAttack(actions)
    const participant: CombatParticipant = {
      id: `m-${monster.id}-${Date.now()}`,
      kind: 'monster',
      sourceId: monster.id,
      name: detail?.name_ru ?? detail?.name ?? monster.name_ru ?? monster.name,
      targetId: null,
      size: null,
      hpMax: hp,
      hpCurrent: hp,
      ac,
      initiative: null,
      attackBonus: baseAttack.attackBonus,
      damageExpr: baseAttack.damageExpr ?? '1d6',
      effects: [],
      conditions: [],
      concentration: null,
      saves,
      actions: actions.length > 0 ? actions : undefined,
      notes: ''
    }
    setCombatParticipants((prev) => [...prev, participant])
    setCombatQuery('')
    setCombatResults([])
    setCombatError(null)
  }

  const resetCustomMonsterForm = () => {
    setCustomMonsterDraft(emptyCustomMonsterDraft)
    setCustomMonsterActions([createEmptyCustomMonsterAction()])
    setEditingCustomMonsterId(null)
  }

  const openCreateCustomMonsterModal = () => {
    resetCustomMonsterForm()
    setCustomMonsterModalOpen(true)
    setCustomMonsterError(null)
  }

  const saveCustomMonster = async () => {
    if (!campaign) return
    const name = customMonsterDraft.name.trim()
    if (!name) {
      setCustomMonsterError('Укажите имя кастомного монстра')
      return
    }
    const data = buildCustomMonsterData(customMonsterDraft, customMonsterActions)
    setSavingCustomMonster(true)
    try {
      if (editingCustomMonsterId) {
        await window.beholder.customMonsters.update({
          id: editingCustomMonsterId,
          name,
          cr: customMonsterDraft.cr.trim() || null,
          data
        })
      } else {
        await window.beholder.customMonsters.create({
          campaignId: campaign.id,
          name,
          cr: customMonsterDraft.cr.trim() || null,
          data
        })
      }
      const refreshed = await window.beholder.customMonsters.list({
        campaignId: campaign.id,
        query: customMonsterQuery.trim() || undefined,
        limit: 20,
        offset: 0
      })
      setCustomMonsterRows(refreshed.items as CustomMonsterRow[])
      setCustomMonsterError(null)
      resetCustomMonsterForm()
      setCustomMonsterModalOpen(false)
    } catch (err: any) {
      setCustomMonsterError(err?.message ?? 'Не удалось сохранить кастомного монстра')
    } finally {
      setSavingCustomMonster(false)
    }
  }

  const editCustomMonster = async (id: number) => {
    try {
      const row = (await window.beholder.customMonsters.get(id)) as any
      if (!row) return
      setCustomMonsterDraft(customMonsterDataToDraft(row))
      setCustomMonsterActions(customMonsterActionsFromData(row.data))
      setEditingCustomMonsterId(id)
      setCustomMonsterModalOpen(true)
      setCustomMonsterError(null)
    } catch (err: any) {
      setCustomMonsterError(err?.message ?? 'Не удалось загрузить монстра для редактирования')
    }
  }

  const deleteCustomMonster = async (id: number) => {
    if (!campaign) return
    try {
      await window.beholder.customMonsters.delete(id)
      const refreshed = await window.beholder.customMonsters.list({
        campaignId: campaign.id,
        query: customMonsterQuery.trim() || undefined,
        limit: 20,
        offset: 0
      })
      setCustomMonsterRows(refreshed.items as CustomMonsterRow[])
      if (editingCustomMonsterId === id) {
        resetCustomMonsterForm()
      }
      setCustomMonsterError(null)
    } catch (err: any) {
      setCustomMonsterError(err?.message ?? 'Не удалось удалить кастомного монстра')
    }
  }

  const addCustomMonsterToCombat = async (id: number) => {
    try {
      const row = (await window.beholder.customMonsters.get(id)) as any
      if (!row) return
      const hp = parseMonsterHp(row?.data?.hp)
      const ac = parseMonsterAc(row?.data?.ac)
      const saves = parseMonsterSaves(row?.data)
      const actions = parseMonsterActions(row?.data)
      const baseAttack = deriveBaseAttack(actions)
    const participant: CombatParticipant = {
      id: `cm-${id}-${Date.now()}`,
      kind: 'monster',
      sourceId: id,
      name: row?.name ?? 'Кастомный монстр',
      targetId: null,
      size: null,
      hpMax: hp,
      hpCurrent: hp,
      ac,
      initiative: null,
        attackBonus: baseAttack.attackBonus,
        damageExpr: baseAttack.damageExpr ?? '1d6',
        effects: [],
        conditions: [],
        concentration: null,
        saves,
        actions: actions.length > 0 ? actions : undefined,
        notes: ''
      }
      setCombatParticipants((prev) => [...prev, participant])
      setCustomMonsterError(null)
    } catch (err: any) {
      setCustomMonsterError(err?.message ?? 'Не удалось добавить кастомного монстра в бой')
    }
  }

  const resetCustomWeaponForm = () => {
    setCustomWeaponDraft({
      name: '',
      kind: '',
      attackBonus: '',
      damage: '',
      damageType: '',
      rangeText: '',
      notes: ''
    })
    setEditingCustomWeaponId(null)
  }

  const openCreateCustomWeaponModal = () => {
    resetCustomWeaponForm()
    setCustomWeaponError(null)
    setCustomWeaponModalOpen(true)
  }

  const buildCustomWeaponPayload = () => {
    const attackBonus = customWeaponDraft.attackBonus.trim()
    return {
      kind: customWeaponDraft.kind.trim() || null,
      attackBonus: attackBonus ? Number(attackBonus) : null,
      damage: customWeaponDraft.damage.trim() || null,
      damageType: customWeaponDraft.damageType.trim() || null,
      rangeText: customWeaponDraft.rangeText.trim() || null,
      notes: customWeaponDraft.notes.trim() || null,
      data: {
        attackBonus: attackBonus ? Number(attackBonus) : null,
        damage: customWeaponDraft.damage.trim() || null,
        damageType: customWeaponDraft.damageType.trim() || null,
        rangeText: customWeaponDraft.rangeText.trim() || null,
        kind: customWeaponDraft.kind.trim() || null,
        notes: customWeaponDraft.notes.trim() || null
      }
    }
  }

  const saveCustomWeapon = async () => {
    if (!campaign) return
    const name = customWeaponDraft.name.trim()
    if (!name) {
      setCustomWeaponError('Укажите название оружия')
      return
    }
    const payload = buildCustomWeaponPayload()
    if (
      payload.attackBonus !== null &&
      (Number.isNaN(payload.attackBonus) || !Number.isFinite(payload.attackBonus))
    ) {
      setCustomWeaponError('Бонус атаки должен быть числом')
      return
    }
    setSavingCustomWeapon(true)
    try {
      if (editingCustomWeaponId) {
        await window.beholder.customWeapons.update({
          id: editingCustomWeaponId,
          name,
          ...payload
        })
      } else {
        await window.beholder.customWeapons.create({
          campaignId: campaign.id,
          name,
          ...payload
        })
      }
      const refreshed = await window.beholder.customWeapons.list({
        campaignId: campaign.id,
        query: customWeaponQuery.trim() || undefined,
        limit: 20,
        offset: 0
      })
      setCustomWeaponRows(refreshed.items as CustomWeaponRow[])
      setCustomWeaponError(null)
      resetCustomWeaponForm()
      setCustomWeaponModalOpen(false)
    } catch (err: any) {
      setCustomWeaponError(err?.message ?? 'Не удалось сохранить кастомное оружие')
    } finally {
      setSavingCustomWeapon(false)
    }
  }

  const editCustomWeapon = async (id: number) => {
    try {
      const row = (await window.beholder.customWeapons.get(id)) as any
      if (!row) return
      setCustomWeaponDraft({
        name: row.name ?? '',
        kind: row.kind ?? '',
        attackBonus:
          typeof row.attackBonus === 'number' && Number.isFinite(row.attackBonus)
            ? String(row.attackBonus)
            : '',
        damage: row.damage ?? '',
        damageType: row.damageType ?? '',
        rangeText: row.rangeText ?? '',
        notes: row.notes ?? ''
      })
      setEditingCustomWeaponId(id)
      setCustomWeaponError(null)
      setCustomWeaponModalOpen(true)
    } catch (err: any) {
      setCustomWeaponError(err?.message ?? 'Не удалось загрузить кастомное оружие')
    }
  }

  const deleteCustomWeapon = async (id: number) => {
    if (!campaign) return
    try {
      await window.beholder.customWeapons.delete(id)
      const refreshed = await window.beholder.customWeapons.list({
        campaignId: campaign.id,
        query: customWeaponQuery.trim() || undefined,
        limit: 20,
        offset: 0
      })
      setCustomWeaponRows(refreshed.items as CustomWeaponRow[])
      if (editingCustomWeaponId === id) {
        resetCustomWeaponForm()
      }
      setCustomWeaponError(null)
    } catch (err: any) {
      setCustomWeaponError(err?.message ?? 'Не удалось удалить кастомное оружие')
    }
  }

  const addCustomWeaponToInventory = async (id: number) => {
    if (!selectedCharacter) return
    try {
      const row = (await window.beholder.customWeapons.get(id)) as any
      if (!row) return
      const data = ensureCharacterData(selectedCharacter.data)
      const summary = buildWeaponSummary({
        attackBonus: row.attackBonus,
        damage: row.damage,
        damageType: row.damageType,
        rangeText: row.rangeText,
        kind: row.kind,
        notes: row.notes
      })
      data.inventory = addInventoryEntry(data.inventory, {
        name: row.name,
        qty: 1,
        notes: summary,
        category: 'custom_weapon'
      })
      data.weapons = [
        ...data.weapons,
        {
          customId: row.id,
          name: row.name,
          summary,
          attackBonus:
            typeof row.attackBonus === 'number' && Number.isFinite(row.attackBonus)
              ? row.attackBonus
              : null,
          damageExpr:
            typeof row.damage === 'string' ? normalizeDamageExpr(row.damage) : null
        }
      ]
      await updateCharacterData(data)
      setCustomWeaponQuery('')
    } catch (err: any) {
      setCustomWeaponError(err?.message ?? 'Не удалось добавить кастомное оружие в инвентарь')
    }
  }

  const addCustomActionRow = () => {
    setCustomMonsterActions((prev) => [...prev, createEmptyCustomMonsterAction()])
  }

  const updateCustomActionRow = (
    id: string,
    key: keyof Omit<CustomMonsterActionDraft, 'id'>,
    value: string
  ) => {
    setCustomMonsterActions((prev) =>
      prev.map((action) => (action.id === id ? { ...action, [key]: value } : action))
    )
  }

  const removeCustomActionRow = (id: string) => {
    setCustomMonsterActions((prev) => {
      const next = prev.filter((action) => action.id !== id)
      return next.length > 0 ? next : [createEmptyCustomMonsterAction()]
    })
  }

  const updateParticipant = (id: string, patch: Partial<CombatParticipant>) => {
    setCombatParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    )
  }

  const updateParticipantWeaponSelection = (participant: CombatParticipant, weaponKey: string) => {
    const nextKey = weaponKey || null
    const option =
      participant.weaponOptions?.find((entry) => entry.key === nextKey) ?? null
    updateParticipant(participant.id, {
      selectedWeaponKey: nextKey,
      attackBonus: option?.attackBonus ?? participant.attackBonus,
      damageExpr: option?.damageExpr ?? participant.damageExpr,
      notes: option ? `Оружие: ${option.name}` : participant.notes
    })
  }

  const getParticipantById = (id: string | null | undefined) =>
    id ? combatParticipants.find((p) => p.id === id) : undefined

  const updateCombatLinks = () => {
    const board = combatBoardRef.current
    if (!board) {
      setCombatLinks([])
      return
    }
    const boardRect = board.getBoundingClientRect()
    const nextLinks: Array<{ id: string; d: string }> = []
    for (const participant of combatParticipants) {
      if (!participant.targetId) continue
      const sourceEl = combatCardRefs.current.get(participant.id)
      const targetEl = combatCardRefs.current.get(participant.targetId)
      if (!sourceEl || !targetEl) continue
      const fromRect = sourceEl.getBoundingClientRect()
      const toRect = targetEl.getBoundingClientRect()
      const fromX = fromRect.left - boardRect.left + fromRect.width / 2
      const fromY = fromRect.top - boardRect.top + fromRect.height / 2
      const toX = toRect.left - boardRect.left + toRect.width / 2
      const toY = toRect.top - boardRect.top + toRect.height / 2
      const dx = toX - fromX
      const dy = toY - fromY
      const curve = Math.min(140, Math.max(40, Math.abs(dx) * 0.25 + Math.abs(dy) * 0.15))
      const c1x = fromX + dx * 0.25
      const c1y = fromY + (dy >= 0 ? curve : -curve)
      const c2x = fromX + dx * 0.75
      const c2y = toY - (dy >= 0 ? curve : -curve)
      const d = `M ${fromX} ${fromY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toX} ${toY}`
      nextLinks.push({ id: `${participant.id}__${participant.targetId}`, d })
    }
    setCombatLinks(nextLinks)
  }

  const removeParticipant = (id: string) => {
    setCombatParticipants((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p) => (p.targetId === id ? { ...p, targetId: null } : p))
    )
  }

  const defaultCardSize = { width: 300, height: 230 }

  const deriveBaseAttack = (
    actions?: Array<{ name: string; text: string; attackBonus: number | null; damageExpr: string | null }>
  ) => {
    if (!actions || actions.length === 0) return { attackBonus: null, damageExpr: '1d6' }
    let bestBonus: number | null = null
    let bestDamage: string | null = null
    actions.forEach((action) => {
      const bonus = action.attackBonus ?? parseActionAttackBonus(action.text)
      const damage = action.damageExpr ?? parseActionDamageExpr(action.text)
      if (bonus !== null && (bestBonus === null || bonus > bestBonus)) {
        bestBonus = bonus
        bestDamage = damage ?? bestDamage
      }
      if (!bestDamage && damage) bestDamage = damage
    })
    return {
      attackBonus: bestBonus,
      damageExpr: bestDamage ?? '1d6'
    }
  }

  const orderedParticipants = [...combatParticipants].sort((a, b) => {
    const aInit = a.initiative ?? -999
    const bInit = b.initiative ?? -999
    return bInit - aInit
  })

  // The active turn is tracked by participant id (currentTurnId), not by array
  // index, since orderedParticipants is re-sorted on every render and its order
  // can change mid-combat (initiative edits, adds/removes).
  const activeParticipant = currentTurnId
    ? orderedParticipants.find((p) => p.id === currentTurnId) ?? null
    : null
  const activeTurnPosition = activeParticipant
    ? orderedParticipants.findIndex((p) => p.id === activeParticipant.id) + 1
    : 0

  const visibleParticipants = orderedParticipants.filter((participant) => {
    if (combatSearch.trim()) {
      const needle = combatSearch.trim().toLowerCase()
      if (!participant.name.toLowerCase().includes(needle)) return false
    }
    if (combatFilter === 'alive') return (participant.hpCurrent ?? 1) > 0
    if (combatFilter === 'down') return (participant.hpCurrent ?? 0) <= 0
    if (combatFilter === 'concentration') return Boolean(participant.concentration)
    if (combatFilter === 'status') {
      return participant.conditions.length > 0 || participant.effects.length > 0
    }
    return true
  })

  useLayoutEffect(() => {
    updateCombatLinks()
  }, [combatParticipants, combatFilter, combatSearch, currentTurnId])

  useEffect(() => {
    const handleResize = () => updateCombatLinks()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!draggingCardId) return
    const handleMove = (event: PointerEvent) => {
      const board = combatBoardRef.current
      const card = combatCardRefs.current.get(draggingCardId)
      if (!board || !card) return
      const boardRect = board.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const offset = dragOffsetRef.current
      let nextX = event.clientX - boardRect.left - offset.x
      let nextY = event.clientY - boardRect.top - offset.y
      const maxX = Math.max(0, boardRect.width - cardRect.width)
      const maxY = Math.max(0, boardRect.height - cardRect.height)
      nextX = Math.max(0, Math.min(nextX, maxX))
      nextY = Math.max(0, Math.min(nextY, maxY))
      updateParticipant(draggingCardId, { position: { x: nextX, y: nextY } })
    }
    const handleUp = () => setDraggingCardId(null)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [draggingCardId])

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const press = cardPressRef.current
      if (!press || press.linkActive) return
      const dx = event.clientX - press.startX
      const dy = event.clientY - press.startY
      if (Math.hypot(dx, dy) <= 6) return
      if (press.timerId) {
        window.clearTimeout(press.timerId)
      }
      const card = combatCardRefs.current.get(press.id)
      if (!card) return
      const cardRect = card.getBoundingClientRect()
      setDraggingCardId(press.id)
      dragOffsetRef.current = {
        x: event.clientX - cardRect.left,
        y: event.clientY - cardRect.top
      }
      card.setPointerCapture(press.pointerId)
      cardPressRef.current = null
    }
    const handleUp = () => {
      const press = cardPressRef.current
      if (press?.timerId) {
        window.clearTimeout(press.timerId)
      }
      cardPressRef.current = null
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [])

  useEffect(() => {
    if (!resizingCard) return
    const handleMove = (event: PointerEvent) => {
      const dx = event.clientX - resizingCard.startX
      const dy = event.clientY - resizingCard.startY
      const minW = 220
      const minH = 180
      let nextWidth = resizingCard.startWidth
      let nextHeight = resizingCard.startHeight
      if (resizingCard.dir === 'e' || resizingCard.dir === 'se') {
        nextWidth = Math.max(minW, resizingCard.startWidth + dx)
      }
      if (resizingCard.dir === 's' || resizingCard.dir === 'se') {
        nextHeight = Math.max(minH, resizingCard.startHeight + dy)
      }
      updateParticipant(resizingCard.id, {
        size: { width: Math.round(nextWidth), height: Math.round(nextHeight) }
      })
    }
    const handleUp = () => setResizingCard(null)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [resizingCard])

  useEffect(() => {
    // Keep currentTurnId/roundAnchorId valid: clear them when combat is empty,
    // and (re)pick the top of the initiative order if either is unset or points
    // at a participant that no longer exists (e.g. removed mid-combat).
    // Reordering by itself does NOT reset either — id-based tracking survives
    // initiative edits and participants being added/removed elsewhere in the list.
    if (orderedParticipants.length === 0) {
      if (currentTurnId !== null) setCurrentTurnId(null)
      if (roundAnchorId !== null) setRoundAnchorId(null)
      return
    }
    const stillExists = currentTurnId !== null && orderedParticipants.some((p) => p.id === currentTurnId)
    if (!stillExists) {
      setCurrentTurnId(orderedParticipants[0].id)
    }
    const anchorStillExists = roundAnchorId !== null && orderedParticipants.some((p) => p.id === roundAnchorId)
    if (!anchorStillExists) {
      setRoundAnchorId(orderedParticipants[0].id)
    }
  }, [combatParticipants, currentTurnId, roundAnchorId])

  const nextTurn = () => {
    if (orderedParticipants.length === 0) return
    const currentIndex = currentTurnId
      ? orderedParticipants.findIndex((p) => p.id === currentTurnId)
      : -1
    // Every participant gets their turn in initiative order, including anyone
    // at 0 HP — per 5e rules an unconscious/dying character still takes a
    // turn to roll death saves, they're just not skipped over.
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % orderedParticipants.length
    const nextParticipant = orderedParticipants[nextIndex]

    // A new round begins when the turn comes back around to whoever opened
    // the current round (roundAnchorId) — tracked by id, not by "did we reach
    // the last array index", so adding/removing participants mid-round can't
    // throw the count off (same principle as currentTurnId for bug 1). If the
    // anchor itself left combat, the safest read is "the round already turned
    // over without us noticing" — treat it as a boundary now rather than
    // never firing the tick again.
    const anchorStillPresent =
      roundAnchorId !== null && orderedParticipants.some((p) => p.id === roundAnchorId)
    const startsNewRound =
      currentIndex !== -1 && (!anchorStillPresent || nextParticipant.id === roundAnchorId)

    if (startsNewRound) {
      setRoundNumber((prev) => prev + 1)
      setCombatParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          effects: p.effects
            .map((effect) => ({
              ...effect,
              rounds: effect.rounds !== null ? effect.rounds - 1 : null
            }))
            .filter((effect) => effect.rounds === null || effect.rounds > 0),
          conditions: p.conditions
            .map((condition) => ({
              ...condition,
              rounds: condition.rounds !== null ? condition.rounds - 1 : null
            }))
            .filter((condition) => condition.rounds === null || condition.rounds > 0),
          concentration:
            p.concentration && p.concentration.rounds !== null
              ? {
                  ...p.concentration,
                  rounds: p.concentration.rounds - 1
                }
              : p.concentration
        }))
      )
    }

    // Re-anchor on combat start (currentIndex === -1) and on every round
    // boundary, so the anchor always reflects "whoever opens the round".
    if (currentIndex === -1 || startsNewRound) {
      setRoundAnchorId(nextParticipant.id)
    }

    setCurrentTurnId(nextParticipant.id)
  }

  const pushCombatLog = (
    label: string,
    total: number | null,
    detail: string,
    tone: CombatLogTone = 'normal'
  ) => {
    setCombatLog((prev) => [{ label, total, detail, tone }, ...prev].slice(0, 20))
    if (total === null) return
    setRollOverlay({ label, total, detail, tone })
    if (rollOverlayTimerRef.current !== null) {
      window.clearTimeout(rollOverlayTimerRef.current)
    }
    rollOverlayTimerRef.current = window.setTimeout(() => {
      setRollOverlay(null)
      rollOverlayTimerRef.current = null
    }, 2600)
  }

  useEffect(() => {
    return () => {
      if (rollOverlayTimerRef.current !== null) {
        window.clearTimeout(rollOverlayTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!impactFlash) return
    const timer = window.setTimeout(() => setImpactFlash(null), 900)
    return () => window.clearTimeout(timer)
  }, [impactFlash])

  const handleConcentrationCheck = (participant: CombatParticipant, damage: number) => {
    if (!participant.concentration) return
    const dc = Math.max(10, Math.floor(damage / 2))
    const bonus = participant.saves.con ?? 0
    const roll = rollD20(bonus)
    const success = roll.total >= dc
    pushCombatLog(
      `Концентрация: ${participant.name}`,
      roll.total,
      `d20(${roll.roll}) + ${roll.bonus} против КС ${dc} → ${success ? 'успех' : 'провал'}`
    )
    if (!success) {
      updateParticipant(participant.id, { concentration: null })
    }
  }

  const rollInitiative = (participant: CombatParticipant) => {
    const roll = rollD20(participant.initiative ?? 0)
    updateParticipant(participant.id, { initiative: roll.total })
    pushCombatLog(`Инициатива: ${participant.name}`, roll.total, `d20(${roll.roll}) + ${roll.bonus}`)
  }

  const rollAttack = (participant: CombatParticipant) => {
    const roll = rollD20(participant.attackBonus ?? 0)
    const tone = getD20Tone(roll.roll)
    pushCombatLog(`Атака: ${participant.name}`, roll.total, `d20(${roll.roll}) + ${roll.bonus}`, tone)
    if (tone === 'fail') {
      pushCombatLog(`Промах: ${participant.name}`, null, 'Критический провал: добавь осложнение по ситуации.', 'fail')
    }
  }

  const rollDamage = (participant: CombatParticipant) => {
    const result = rollDiceExpr(participant.damageExpr || '1d6')
    if (!result) return
    pushCombatLog(
      `Урон: ${participant.name}`,
      result.total,
      `${participant.damageExpr} = ${result.rolls.join(' + ')}${result.modifier ? ` + ${result.modifier}` : ''}`
    )
  }

  const rollActionAttack = (participant: CombatParticipant, action: { name: string; attackBonus: number | null }) => {
    const roll = rollD20(action.attackBonus ?? 0)
    const tone = getD20Tone(roll.roll)
    pushCombatLog(
      `Атака: ${participant.name} · ${action.name}`,
      roll.total,
      `d20(${roll.roll}) + ${roll.bonus}`,
      tone
    )
    return roll
  }

  const rollActionDamage = (
    participant: CombatParticipant,
    action: { name: string; damageExpr: string | null },
    isCritical = false,
    targetName?: string
  ) => {
    if (!action.damageExpr) return
    const result = isCritical
      ? rollCriticalDamageExpr(action.damageExpr)
      : rollDiceExpr(action.damageExpr)
    if (!result) return
    const damageExprLabel = 'expr' in result ? result.expr : action.damageExpr
    const detail = isCritical
      ? `КРИТ: ${damageExprLabel}${formatModifierDetail(result.modifier)} = ${result.rolls.join(' + ')}${formatModifierDetail(result.modifier)}`
      : `${action.damageExpr} = ${result.rolls.join(' + ')}${formatModifierDetail(result.modifier)}`
    const targetLabel = targetName ? ` → ${targetName}` : ''
    pushCombatLog(
      `Урон: ${participant.name} · ${action.name}${targetLabel}`,
      result.total,
      detail,
      isCritical ? 'crit' : 'normal'
    )
    return result.total
  }

  const rollActionSaveForTarget = (
    participant: CombatParticipant,
    action: {
      name: string
      text: string
      saveDc: number | null
      saveAbility: '' | 'СИЛ' | 'ЛВК' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР'
    }
  ) => {
    const parsed = parseSaveFromText(action.text || '')
    const ability = action.saveAbility || parsed.saveAbility
    const dc = action.saveDc ?? (parsed.saveDc ? Number(parsed.saveDc) : null)
    if (!ability || !dc) {
      pushCombatLog(
        `Спасбросок цели: ${participant.name} · ${action.name}`,
        null,
        'В действии не найдена СЛ/характеристика спасброска.'
      )
      return
    }
    const raw = window.prompt(`Модификатор спасброска цели (${ability})`, '0')
    if (raw === null) return
    const bonus = Number(raw.trim() || '0')
    if (Number.isNaN(bonus)) {
      pushCombatLog(
        `Спасбросок цели: ${participant.name} · ${action.name}`,
        null,
        'Некорректный модификатор спасброска.'
      )
      return
    }
    const roll = rollD20(bonus)
    const success = roll.total >= dc
    const tone = getD20Tone(roll.roll)
    pushCombatLog(
      `Спасбросок цели ${ability}: ${participant.name} · ${action.name}`,
      roll.total,
      `d20(${roll.roll}) + ${roll.bonus} против СЛ ${dc} → ${success ? 'успех' : 'провал'}`,
      tone
    )
  }

  const ensureTargetForAttack = (participant: CombatParticipant) => {
    const target = getParticipantById(participant.targetId)
    if (!target) {
      setTargetingSourceId(participant.id)
      pushCombatLog(`Цель: ${participant.name}`, null, 'Выбери цель для атаки.')
      return null
    }
    return target
  }

  const performAttackAgainstTarget = (
    participant: CombatParticipant,
    action: {
      name: string
      text: string
      attackBonus: number | null
      damageExpr: string | null
      saveDc?: number | null
      saveAbility?: '' | 'СИЛ' | 'ЛВК' | 'ТЕЛ' | 'ИНТ' | 'МДР' | 'ХАР'
    }
  ) => {
    const target = ensureTargetForAttack(participant)
    if (!target) return
    const attackBonus = action.attackBonus ?? parseActionAttackBonus(action.text)
    const damageExpr = action.damageExpr ?? parseActionDamageExpr(action.text)
    const parsedSave = parseSaveFromText(action.text)
    const saveAbility = action.saveAbility || parsedSave.saveAbility
    const saveDc = action.saveDc ?? (parsedSave.saveDc ? Number(parsedSave.saveDc) : null)

    if (attackBonus === null && saveAbility && saveDc) {
      const key = saveLabelToKey[saveAbility]
      const bonus = target.saves[key] ?? 0
      const roll = rollD20(bonus)
      const success = roll.total >= saveDc
      const tone = getD20Tone(roll.roll)
      pushCombatLog(
        `Спасбросок: ${participant.name} → ${target.name}`,
        roll.total,
        `d20(${roll.roll}) + ${roll.bonus} против СЛ ${saveDc} (${saveAbility}) → ${
          success ? 'успех' : 'провал'
        }`,
        tone
      )
      if (!success && damageExpr) {
        const total = rollActionDamage(participant, { name: action.name, damageExpr }, false, target.name)
        if (typeof total === 'number') {
          applyDamage(target, total)
          setImpactFlash({ id: target.id, tone: 'hit', value: total })
        }
      }
      return
    }

    const roll = rollD20(attackBonus ?? 0)
    const tone = getD20Tone(roll.roll)
    const ac = target.ac

    if (ac === null || ac === undefined) {
      pushCombatLog(
        `Атака: ${participant.name} → ${target.name}`,
        roll.total,
        `d20(${roll.roll}) + ${roll.bonus}. КД цели неизвестен — урон вручную.`,
        tone
      )
      setImpactFlash({ id: target.id, tone: 'hit' })
      return
    }

    let hit = roll.total >= ac
    if (roll.roll === 1) hit = false
    if (roll.roll === 20) hit = true

    pushCombatLog(
      `Атака: ${participant.name} → ${target.name}`,
      roll.total,
      `d20(${roll.roll}) + ${roll.bonus} против КД ${ac} → ${hit ? 'попадание' : 'промах'}`,
      tone
    )

    if (!hit) {
      setImpactFlash({ id: target.id, tone: 'miss' })
      return
    }
    if (!damageExpr) {
      setImpactFlash({ id: target.id, tone: 'hit' })
      return
    }
    const total = rollActionDamage(
      participant,
      { name: action.name, damageExpr },
      roll.roll === 20,
      target.name
    )
    if (typeof total === 'number') {
      applyDamage(target, total)
      setImpactFlash({ id: target.id, tone: 'hit', value: total })
    }
  }

  const performAction = (participant: CombatParticipant, action: { name: string; text: string; attackBonus: number | null; damageExpr: string | null }) => {
    const attackBonus = action.attackBonus ?? parseActionAttackBonus(action.text)
    const damageExpr = action.damageExpr ?? parseActionDamageExpr(action.text)

    if (attackBonus !== null) {
      const attackRoll = rollActionAttack(participant, { name: action.name, attackBonus })
      if (attackRoll.roll === 1) {
        pushCombatLog(
          `Промах: ${participant.name} · ${action.name}`,
          null,
          'Критический провал: атака не попала. Добавь осложнение по ситуации.',
          'fail'
        )
        return
      }
      if (damageExpr) {
        rollActionDamage(participant, { name: action.name, damageExpr }, attackRoll.roll === 20)
      }
      return
    }
    if (damageExpr) {
      rollActionDamage(participant, { name: action.name, damageExpr }, false)
      return
    }
    pushCombatLog(`Действие: ${participant.name} · ${action.name}`, null, normalizeActionText(action.text) || '—')
  }

  const rollSave = (participant: CombatParticipant, key: (typeof abilityKeys)[number]) => {
    const bonus = participant.saves[key] ?? 0
    const roll = rollD20(bonus)
    pushCombatLog(
      `Спасбросок ${abilityLabels[key]}: ${participant.name}`,
      roll.total,
      `d20(${roll.roll}) + ${roll.bonus}`
    )
  }

  const saveCombatSession = async () => {
    if (!campaign) return
    try {
      const payload = {
        campaignId: campaign.id,
        name: combatName.trim() || 'Сессия боя',
        data: {
          participants: combatParticipants,
          currentTurnId,
          roundNumber,
          roundAnchorId,
          log: combatLog
        },
        combatId: selectedCombatId ?? undefined
      }
      const result = await window.beholder.combats.save(payload)
      setSelectedCombatId(result.id)
      await loadCombatSessions()
      setCombatStatus(`Сохранено: ${payload.name}`)
    } catch (error: any) {
      setCombatStatus(error?.message ?? 'Не удалось сохранить бой')
    }
  }

  const normalizeSaves = (value: any): SaveMods => {
    if (!value || typeof value !== 'object') return { ...emptySaves }
    return {
      str: typeof value.str === 'number' ? value.str : emptySaves.str,
      dex: typeof value.dex === 'number' ? value.dex : emptySaves.dex,
      con: typeof value.con === 'number' ? value.con : emptySaves.con,
      int: typeof value.int === 'number' ? value.int : emptySaves.int,
      wis: typeof value.wis === 'number' ? value.wis : emptySaves.wis,
      cha: typeof value.cha === 'number' ? value.cha : emptySaves.cha
    }
  }

  const normalizeParticipant = (participant: any): CombatParticipant => ({
    ...participant,
    targetId: participant?.targetId ?? null,
    position:
      participant?.position &&
      typeof participant.position.x === 'number' &&
      typeof participant.position.y === 'number'
        ? participant.position
        : null,
    size:
      participant?.size &&
      typeof participant.size.width === 'number' &&
      typeof participant.size.height === 'number'
        ? participant.size
        : null,
    damageExpr: participant?.damageExpr ?? '1d6',
    effects: Array.isArray(participant?.effects) ? participant.effects : [],
    conditions: Array.isArray(participant?.conditions) ? participant.conditions : [],
    concentration:
      participant?.concentration && typeof participant.concentration === 'object'
        ? participant.concentration
        : null,
    saves: normalizeSaves(participant?.saves),
    actions: Array.isArray(participant?.actions) ? participant.actions : undefined
  })

  const loadCombatSession = async (id: number) => {
    try {
      const result = await window.beholder.combats.get(id)
      if (!result || !result.data) return
      const data = result.data as any
      const participants = Array.isArray(data.participants)
        ? data.participants.map(normalizeParticipant)
        : []
      setCombatParticipants(participants)

      const orderedLoaded = [...participants].sort((a, b) => {
        const aInit = a.initiative ?? -999
        const bInit = b.initiative ?? -999
        return bInit - aInit
      })
      let resolvedTurnId: string | null
      if (typeof data.currentTurnId === 'string') {
        // Current save format: an explicit participant id.
        const stillExists = orderedLoaded.some((p) => p.id === data.currentTurnId)
        resolvedTurnId = stillExists ? data.currentTurnId : orderedLoaded[0]?.id ?? null
      } else if (typeof data.currentTurn === 'number') {
        // Legacy save format: currentTurn was a numeric index into the
        // initiative-sorted order. Migrate it to the equivalent participant id.
        resolvedTurnId = orderedLoaded[data.currentTurn]?.id ?? orderedLoaded[0]?.id ?? null
      } else {
        resolvedTurnId = orderedLoaded[0]?.id ?? null
      }
      setCurrentTurnId(resolvedTurnId)
      setRoundNumber(typeof data.roundNumber === 'number' && data.roundNumber > 0 ? data.roundNumber : 1)
      // roundAnchorId is a newer field; older saves won't have it. Falling back
      // to the resolved turn id is an approximation (it assumes the round just
      // opened on whoever's turn it currently is), which is the best guess
      // available without having recorded the real anchor.
      const anchorStillExists =
        typeof data.roundAnchorId === 'string' && orderedLoaded.some((p) => p.id === data.roundAnchorId)
      setRoundAnchorId(anchorStillExists ? data.roundAnchorId : resolvedTurnId)
      const log = Array.isArray(data.log)
        ? data.log
            .map((entry: any) => ({
              label: typeof entry?.label === 'string' ? entry.label : 'Событие',
              total: typeof entry?.total === 'number' ? entry.total : null,
              detail: typeof entry?.detail === 'string' ? entry.detail : '—',
              tone: entry?.tone === 'crit' || entry?.tone === 'fail' ? entry.tone : 'normal'
            }))
            .slice(0, 20)
        : []
      setCombatLog(log)
      setCombatName(result.name)
      setSelectedCombatId(result.id)
      setCombatStatus(`Загружено: ${result.name}`)
    } catch (error: any) {
      setCombatStatus(error?.message ?? 'Не удалось загрузить бой')
    }
  }

  const resetCombat = () => {
    setCombatParticipants([])
    setCombatLog([])
    setCurrentTurnId(null)
    setRoundNumber(1)
    setRoundAnchorId(null)
    setCombatName('Сессия боя')
    setSelectedCombatId(null)
  }

  const exportCombatSession = async () => {
    if (!selectedCombatId) return
    const result = await window.beholder.combats.export(selectedCombatId)
    if (result?.canceled) return
    if (!result?.ok) {
      setCombatStatus(result?.error ?? 'Не удалось экспортировать бой')
      return
    }
    setCombatStatus('Бой экспортирован')
  }

  const importCombatSession = async () => {
    if (!campaign) return
    const result = await window.beholder.combats.import(campaign.id)
    if (!result || result.canceled) return
    if (!result.ok) {
      setCombatStatus(result.error ?? 'Не удалось импортировать бой')
      return
    }
    await loadCombatSessions()
    if (result.id) {
      await loadCombatSession(result.id)
    } else {
      setCombatStatus('Бой импортирован')
    }
  }

  const deleteCombatSession = async (id: number, name: string) => {
    const confirmed = window.confirm(`Удалить бой "${name}"?`)
    if (!confirmed) return
    await window.beholder.combats.delete(id)
    if (!campaign) return
    await loadCombatSessions()
    if (selectedCombatId === id) {
      resetCombat()
    }
    setCombatStatus(`Удалён бой: ${name}`)
  }

  const applyDamage = (participant: CombatParticipant, amount: number) => {
    const current = participant.hpCurrent ?? 0
    updateParticipant(participant.id, { hpCurrent: Math.max(current - amount, 0) })
    pushCombatLog(`Урон: ${participant.name}`, null, `${amount} урона`)
    handleConcentrationCheck(participant, amount)
  }

  const applyHeal = (participant: CombatParticipant, amount: number) => {
    const current = participant.hpCurrent ?? 0
    const max = participant.hpMax ?? current + amount
    updateParticipant(participant.id, { hpCurrent: Math.min(current + amount, max) })
    pushCombatLog(`Лечение: ${participant.name}`, null, `${amount} лечения`)
  }

  const applyDamageAll = (amount: number) => {
    setCombatParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        hpCurrent: Math.max((p.hpCurrent ?? 0) - amount, 0)
      }))
    )
    combatParticipants.forEach((participant) => {
      if (participant.concentration) handleConcentrationCheck(participant, amount)
    })
    pushCombatLog('Массовый урон', null, `${amount} всем участникам`)
  }

  const applyHealAll = (amount: number) => {
    setCombatParticipants((prev) =>
      prev.map((p) => {
        const current = p.hpCurrent ?? 0
        const max = p.hpMax ?? current + amount
        return { ...p, hpCurrent: Math.min(current + amount, max) }
      })
    )
    pushCombatLog('Массовое лечение', null, `${amount} всем участникам`)
  }

  // Generic, participant-scoped helpers. These are the source of truth: conditions,
  // effects and concentration can be applied to ANY participant, not just whoever's
  // turn it currently is. The "...ToCurrent" wrappers below keep the old quick-actions
  // panel (which always targets the active turn) working exactly as before.
  const addConditionTo = (participantId: string, name: string, rounds: number | null) => {
    const participant = combatParticipants.find((p) => p.id === participantId)
    if (!participant) return
    updateParticipant(participantId, {
      conditions: [...participant.conditions, { name, rounds }]
    })
    pushCombatLog(`Состояние: ${participant.name}`, null, `+ ${name}`)
  }

  const addEffectTo = (participantId: string, name: string, rounds: number | null) => {
    const participant = combatParticipants.find((p) => p.id === participantId)
    if (!participant) return
    updateParticipant(participantId, {
      effects: [...participant.effects, { name, rounds }]
    })
    pushCombatLog(`Эффект: ${participant.name}`, null, `+ ${name}`)
  }

  const setConcentrationTo = (participantId: string, name: string, rounds: number | null) => {
    const participant = combatParticipants.find((p) => p.id === participantId)
    if (!participant) return
    updateParticipant(participantId, { concentration: { name, rounds } })
    pushCombatLog(`Концентрация: ${participant.name}`, null, `+ ${name}`)
  }

  const removeEffect = (participantId: string, index: number) => {
    const participant = combatParticipants.find((p) => p.id === participantId)
    if (!participant) return
    updateParticipant(participantId, {
      effects: participant.effects.filter((_, i) => i !== index)
    })
    pushCombatLog(`Эффект: ${participant.name}`, null, '— снят')
  }

  const removeCondition = (participantId: string, index: number) => {
    const participant = combatParticipants.find((p) => p.id === participantId)
    if (!participant) return
    updateParticipant(participantId, {
      conditions: participant.conditions.filter((_, i) => i !== index)
    })
    pushCombatLog(`Состояние: ${participant.name}`, null, '— снято')
  }

  const clearConcentration = (participantId: string) => {
    const participant = combatParticipants.find((p) => p.id === participantId)
    updateParticipant(participantId, { concentration: null })
    if (participant) {
      pushCombatLog(`Концентрация: ${participant.name}`, null, '— снята')
    }
  }

  const clearCombatLog = () => {
    setCombatLog([])
    setRollOverlay(null)
    if (rollOverlayTimerRef.current !== null) {
      window.clearTimeout(rollOverlayTimerRef.current)
      rollOverlayTimerRef.current = null
    }
  }

  const handleAddAmmo = async () => {
    if (!selectedCharacter) return
    const name = newAmmo.name.trim()
    const qty = Number(newAmmo.qty || 1)
    if (!name) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.ammo = [...data.ammo, { name, qty: Number.isFinite(qty) ? qty : 1 }]
    await updateCharacterData(data)
    setNewAmmo({ name: '', qty: '1' })
  }

  const handleRemoveAmmo = async (index: number) => {
    if (!selectedCharacter) return
    const data = ensureCharacterData(selectedCharacter.data)
    data.ammo = data.ammo.filter((_, i) => i !== index)
    await updateCharacterData(data)
  }

  const executeDiceRoll = (expr: string) => {
    const parsed = parseDice(expr)
    if (!parsed) return
    const rolls = Array.from({ length: parsed.count }, () =>
      Math.floor(Math.random() * parsed.sides) + 1
    )
    const total = rolls.reduce((sum, value) => sum + value, 0) + parsed.modifier
    setDiceRolling(true)
    setDiceResult(null)
    setTimeout(() => {
      setDiceResult({ total, rolls })
      setDiceRolling(false)
    }, 650)
  }

  const handleRollDice = () => executeDiceRoll(diceExpr)

  const rollPreset = (expr: string) => {
    setDiceExpr(expr)
    executeDiceRoll(expr)
  }

  const rollQuickDice = (sides: number, count = 1, mode: 'normal' | 'adv' | 'dis' = 'normal') => {
    const modValue = quickMod.trim() ? Number(quickMod) : 0
    const rolls = Array.from({ length: count }, () =>
      Math.floor(Math.random() * sides) + 1
    )
    let total = rolls.reduce((sum, value) => sum + value, 0) + (Number.isNaN(modValue) ? 0 : modValue)

    if (mode !== 'normal' && sides === 20 && count === 1) {
      const second = Math.floor(Math.random() * 20) + 1
      const chosen = mode === 'adv' ? Math.max(rolls[0], second) : Math.min(rolls[0], second)
      total = chosen + (Number.isNaN(modValue) ? 0 : modValue)
      rolls.push(second)
    }

    const label =
      mode === 'adv'
        ? `d20 (преимущество)`
        : mode === 'dis'
          ? `d20 (помеха)`
          : `${count}d${sides}`

    setDiceExpr(`${count}d${sides}${modValue ? (modValue > 0 ? `+${modValue}` : `${modValue}`) : ''}`)
    setDiceRolling(true)
    setDiceResult(null)
    setTimeout(() => {
      setDiceResult({ total, rolls })
      setDiceRolling(false)
      let tone: CombatLogTone = 'normal'
      if (sides === 20 && count === 1) {
        const chosenRoll =
          mode === 'adv' ? Math.max(rolls[0], rolls[1] ?? rolls[0]) :
          mode === 'dis' ? Math.min(rolls[0], rolls[1] ?? rolls[0]) :
          rolls[0]
        tone = getD20Tone(chosenRoll)
      }
      pushCombatLog(
        `Бросок: ${label}`,
        total,
        `${rolls.join(' + ')}${modValue ? ` ${modValue > 0 ? '+' : ''}${modValue}` : ''}`,
        tone
      )
    }, 500)
  }

  const renderMonsterEntries = (entries: MonsterEntry[]) => (
    <div className="detail__entries">
      {entries.map((entry, index) => (
        <div key={`${entry.name ?? 'entry'}-${index}`} className="detail__entry">
          {entry.name && <div className="detail__entry-title">{entry.name}</div>}
          {entry.text && <div className="detail__text">{renderFormattedText(entry.text)}</div>}
        </div>
      ))}
    </div>
  )

  return (
    <div className={`app theme-${themeMode}${isCombatBoardMode ? ' app--combat-board' : ''}${isReferenceWindowMode ? ' app--reference-window' : ''}${isCombatPanelMode ? ' app--combat-panel' : ''}`}>
      <AppHeader
        activeView={activeView}
        themeMode={themeMode}
        combatBoardMode={isCombatBoardMode}
        combatPanelMode={isCombatPanelMode}
        referenceWindowMode={isReferenceWindowMode}
        onChangeView={setView}
        onToggleTheme={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      {isCombatBoardMode && (
        <div className="combat-zoom-controls" aria-label="Масштаб боевого стола">
          <button className="chip" onClick={() => setCombatBoardZoom((value) => Math.max(0.6, Math.round((value - 0.1) * 10) / 10))}>−</button>
          <button className="combat-zoom-controls__value" onClick={() => setCombatBoardZoom(1)} title="Сбросить масштаб (Ctrl+0)">{Math.round(combatBoardZoom * 100)}%</button>
          <button className="chip" onClick={() => setCombatBoardZoom((value) => Math.min(1.5, Math.round((value + 0.1) * 10) / 10))}>+</button>
        </div>
      )}


      <main className={`app__main app__main--${activeView}`}>
        {activeView === 'home' && <HomeView campaign={campaign} onChangeView={setView} />}
        {activeView !== 'home' && activeView !== 'combat' && (
          <section className={`panel panel--hero${activeView === 'campaign' ? ' campaign-view' : ''}`}>
            {isEntityLibraryView ? (
              <>
                <div className="tabs">
                  <button
                    className={referenceSectionForTabs === 'ttg_classes' ? 'tab tab--active' : 'tab'}
                    onClick={() => setReferenceSection('ttg_classes')}
                  >
                    TTG Классы
                  </button>
                  <button
                    className={referenceSectionForTabs === 'ttg_races' ? 'tab tab--active' : 'tab'}
                    onClick={() => setReferenceSection('ttg_races')}
                  >
                    TTG Расы
                  </button>
                  <button
                    className={referenceSectionForTabs === 'ttg_rules' ? 'tab tab--active' : 'tab'}
                    onClick={() => setReferenceSection('ttg_rules')}
                  >
                    TTG Правила
                  </button>
                  {(Object.keys(entityLabels) as EntityKey[]).map((key) => (
                    <button
                      key={key}
                      className={referenceSection === key ? 'tab tab--active' : 'tab'}
                      onClick={() => setReferenceSection(key)}
                    >
                      {entityLabels[key]}
                    </button>
                  ))}
                </div>
                <div>
                  <h2>{`Справочник: ${entityLabels[entity]}`}</h2>
                  <p>Единая точка материалов мастера: TTG + локальная база монстров/заклинаний/предметов.</p>
                </div>
                <div className="search">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Поиск по имени или названию..."
                  />
                  <span>{isLoading ? 'Загрузка…' : `${data.total} результатов`}</span>
                </div>
              </>
            ) : activeView === 'reference' ? (
              <>
                <div className="tabs">
                  <button
                    className={referenceSectionForTabs === 'ttg_classes' ? 'tab tab--active' : 'tab'}
                    onClick={() => setReferenceSection('ttg_classes')}
                  >
                    TTG Классы
                  </button>
                  <button
                    className={referenceSectionForTabs === 'ttg_races' ? 'tab tab--active' : 'tab'}
                    onClick={() => setReferenceSection('ttg_races')}
                  >
                    TTG Расы
                  </button>
                  <button
                    className={referenceSectionForTabs === 'ttg_rules' ? 'tab tab--active' : 'tab'}
                    onClick={() => setReferenceSection('ttg_rules')}
                  >
                    TTG Правила
                  </button>
                  {(Object.keys(entityLabels) as EntityKey[]).map((key) => (
                    <button
                      key={key}
                      className={referenceSection === key ? 'tab tab--active' : 'tab'}
                      onClick={() => setReferenceSection(key)}
                    >
                      {entityLabels[key]}
                    </button>
                  ))}
                </div>
                <div>
                  <h2>Справочник материалов</h2>
                  <p>Компактные данные TTG Club для быстрых подсказок мастеру.</p>
                </div>
                <div className="search">
                  <input
                    value={ttgQuery}
                    onChange={(event) => setTtgQuery(event.target.value)}
                    placeholder="Поиск по названию, источнику или slug..."
                  />
                  <span>{ttgLoading ? 'Загрузка…' : `${ttgItems.length} результатов`}</span>
                </div>
                {ttgKind === 'rules' && (
                  <>
                    {pinnedRules.length > 0 && (
                      <div className="detail__section">
                        <div className="detail__label">Избранные правила</div>
                        <div className="chips">
                          {pinnedRules.map((rule) => {
                            const slug = rule.slug ?? `${rule.name_ru ?? rule.name_en ?? 'rule'}`
                            const title = rule.name_ru ?? rule.name_en ?? slug
                            return (
                              <div key={slug} className="chip chip--accent chip--dismissible">
                                <button
                                  type="button"
                                  className="chip__label"
                                  onClick={() => {
                                    setTtgSelectedSlug(rule.slug ?? null)
                                    openReferenceTtgModal(rule)
                                  }}
                                >
                                  {title}
                                </button>
                                <button
                                  type="button"
                                  className="chip__close"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    toggleRulePin(slug)
                                  }}
                                  title="Убрать из избранного"
                                >
                                  ×
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {ttgKind === 'rules' && (
                  <div className="form form--grid ttg-rules-filters">
                    <select
                      value={ttgRuleTypeFilter}
                      onChange={(event) => setTtgRuleTypeFilter(event.target.value)}
                    >
                      <option value="all">Все категории</option>
                      {ttgRuleTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <select
                      value={ttgRuleSourceFilter}
                      onChange={(event) => setTtgRuleSourceFilter(event.target.value)}
                    >
                      <option value="all">Все источники</option>
                      {ttgRuleSourceOptions.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => {
                        setTtgRuleTypeFilter('all')
                        setTtgRuleSourceFilter('all')
                      }}
                    >
                      Сбросить
                    </button>
                  </div>
                )}
                {ttgError && <div className="error">{ttgError}</div>}
              </>
            ) : (
              <>
                <div>
                  <h2>Кампания</h2>
                  <p>Создай кампанию, добавь персонажей и управляй подготовкой.</p>
                </div>
                {!campaign && (
                  <div className="form">
                    <input
                      className="campaign-name-input"
                      value={campaignName}
                      onChange={(event) => setCampaignName(event.target.value)}
                      autoFocus
                      autoComplete="off"
                      placeholder="Название кампании"
                    />
                    <button className="button" onClick={handleCreateCampaign}>
                      Создать кампанию
                    </button>
                  </div>
                )}
                {campaign && (
                  <>
                    <div className="campaign-card">
                      <div className="campaign-card__title">{campaign.name}</div>
                      <div className="campaign-card__meta">ID: {campaign.id}</div>
                    </div>
                    <div className="form">
                      <input
                        className="campaign-name-input"
                        value={campaignName}
                        onChange={(event) => setCampaignName(event.target.value)}
                        autoComplete="off"
                        placeholder="Новое название кампании"
                      />
                      <button className="button button--ghost" onClick={() => void handleRenameCampaign()}>
                        Переименовать
                      </button>
                    </div>
                    <div className="form">
                      <button className="button button--ghost" onClick={handleImportCharacterFromFile}>
                        Импорт персонажа (JSON)
                      </button>
                      <button
                        className="button button--ghost"
                        onClick={openPlayerFormForOneClickImport}
                      >
                        Форма игрока → 1 клик импорт
                      </button>
                      <button
                        className="button button--ghost"
                        onClick={() => setFullCharacterFormOpen(true)}
                      >
                        Полная форма персонажа
                      </button>
                      <button className="button button--ghost" onClick={() => void handleDeleteCampaign()}>
                        Удалить кампанию
                      </button>
                    </div>
                  <details className="library-list">
                    <summary className="library-list__summary">Создать персонажа (быстро)</summary>
                    <div className="form form--grid">
                      <label className="player-field"><span>Имя персонажа</span><input value={characterCreateName} onChange={(event) => setCharacterCreateName(event.target.value)} /></label>
                      <label className="player-field"><span>Раса</span><select value={characterCreateRace} onChange={(event) => setCharacterCreateRace(event.target.value)}><option value="">Не выбрана</option>{ttgRaceOptions.map((option) => <option key={option.key} value={option.label}>{option.label}</option>)}</select></label>
                      <label className="player-field"><span>Класс</span><select value={characterCreateClass} onChange={(event) => setCharacterCreateClass(event.target.value)}><option value="">Не выбран</option>{ttgClassOptions.map((option) => <option key={option.key} value={option.label}>{option.label}</option>)}</select></label>
                      <label className="player-field"><span>Уровень</span><input type="number" min={1} value={characterCreateLevel} onChange={(event) => setCharacterCreateLevel(event.target.value)} /></label>
                      <label className="player-field"><span>Максимальные ХП</span><input type="number" value={characterCreateHpMax} onChange={(event) => { const value = event.target.value; setCharacterCreateHpMax(value); if (!characterCreateHpCurrent || characterCreateHpCurrent === characterCreateHpMax) setCharacterCreateHpCurrent(value) }} /></label>
                      <label className="player-field"><span>Текущие ХП</span><input type="number" value={characterCreateHpCurrent} onChange={(event) => setCharacterCreateHpCurrent(event.target.value)} placeholder="Равны максимальным" /></label>
                      <label className="player-field"><span>Класс доспеха</span><input type="number" value={characterCreateAc} onChange={(event) => setCharacterCreateAc(event.target.value)} /></label>
                      <label className="player-field"><span>Инициатива</span><input type="number" value={characterCreateInit} onChange={(event) => setCharacterCreateInit(event.target.value)} /></label>
                      <button className="button" onClick={handleCreateQuickCharacter}>
                        Создать
                      </button>
                    </div>
                  </details>
                  {campaignImportStatus && <div className="detail__text">{campaignImportStatus}</div>}
                  <section className="detail__section campaign-character-manager">
                    <h3>Учёт персонажа</h3>
                    {charactersLoading && <div className="empty">Загрузка персонажей…</div>}
                    {charactersError && <div className="error">{charactersError}</div>}
                    {!charactersLoading && !charactersError && characters.length === 0 && (
                      <div className="empty">Сначала добавь персонажа в кампанию</div>
                    )}
                    {!charactersLoading && !charactersError && characters.length > 0 && (
                      <>
                        <div className="form">
                          <select
                            value={selectedCharacterId ?? ''}
                            onChange={(event) =>
                              setSelectedCharacterId(event.target.value ? Number(event.target.value) : null)
                            }
                          >
                            {characters.map((char) => (
                              <option key={char.id} value={char.id}>
                                {char.name}
                              </option>
                            ))}
                          </select>
                          <button className="button button--ghost" onClick={() => void refreshSelectedCharacter()}>
                            Обновить
                          </button>
                        </div>
                        {selectedCharacter && selectedCharacterData && (
                          <div className="campaign-character-grid">
                            <details className="library-list campaign-character-card" open>
                              <summary className="library-list__summary">База персонажа</summary>
                              <div className="form form--grid">
                                <label className="player-field"><span>Имя</span><input value={editCharacter.name} onChange={(event) => setEditCharacter((prev) => ({ ...prev, name: event.target.value }))} /></label>
                                <label className="player-field"><span>Раса</span><input value={editCharacter.race} onChange={(event) => setEditCharacter((prev) => ({ ...prev, race: event.target.value }))} /></label>
                                <label className="player-field"><span>Класс</span><input value={editCharacter.class} onChange={(event) => setEditCharacter((prev) => ({ ...prev, class: event.target.value }))} /></label>
                                <label className="player-field"><span>Уровень</span><input type="number" min={1} value={editCharacter.level} onChange={(event) => setEditCharacter((prev) => ({ ...prev, level: event.target.value }))} /></label>
                                <button className="button" onClick={() => void handleUpdateCharacterBase()}>
                                  Сохранить базу
                                </button>
                                <button className="button button--ghost" onClick={() => void handleExportCharacter()}>
                                  Экспорт JSON
                                </button>
                                <button className="button button--ghost" onClick={() => void handleDeleteCharacter()}>
                                  Удалить персонажа
                                </button>
                              </div>
                            </details>
                            <details
                              className="library-list campaign-character-card"
                              open={characterSections.currency}
                              onToggle={(event) => setCharacterSections((current) => ({ ...current, currency: event.currentTarget.open }))}
                            >
                              <summary className="library-list__summary">Валюта</summary>
                              <div className="campaign-currency-grid">
                                {(
                                  [
                                    ['cp', 'Медь'],
                                    ['sp', 'Серебро'],
                                    ['ep', 'Электрум'],
                                    ['gp', 'Золото'],
                                    ['pp', 'Платина']
                                  ] as Array<[keyof CharacterData['currency'], string]>
                                ).map(([key, label]) => (
                                  <div key={key} className="campaign-currency-row">
                                    <span>{label}</span>
                                    <div className="campaign-currency-controls">
                                      <button
                                        className="chip"
                                        onClick={() => void handleAdjustCurrency(key, -1)}
                                      >
                                        -1
                                      </button>
                                      <input
                                        type="number"
                                        min={0}
                                        defaultValue={selectedCharacterData.currency[key]}
                                        key={`currency-${selectedCharacter.id}-${key}-${selectedCharacterData.currency[key]}`}
                                        onBlur={(event) =>
                                          void handleSetCurrency(key, Number(event.target.value))
                                        }
                                      />
                                      <button
                                        className="chip"
                                        onClick={() => void handleAdjustCurrency(key, 1)}
                                      >
                                        +1
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                            <details
                              className="library-list campaign-character-card"
                              open={characterSections.inventory}
                              onToggle={(event) => setCharacterSections((current) => ({ ...current, inventory: event.currentTarget.open }))}
                            >
                              <summary className="library-list__summary">Инвентарь, оружие и заклинания</summary>
                              <div className="form">
                                <input
                                  value={newInventoryItem.name}
                                  onChange={(event) =>
                                    setNewInventoryItem((prev) => ({ ...prev, name: event.target.value }))
                                  }
                                  placeholder="Название предмета"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  value={newInventoryItem.qty}
                                  onChange={(event) =>
                                    setNewInventoryItem((prev) => ({ ...prev, qty: event.target.value }))
                                  }
                                  placeholder="Кол-во"
                                />
                                <button className="button" onClick={() => void handleAddInventory()}>
                                  Добавить
                                </button>
                              </div>
                              <div className="campaign-library-adders">
                                <div className="search">
                                  <input
                                    value={itemQuery}
                                    onChange={(event) => setItemQuery(event.target.value)}
                                    placeholder="Поиск предмета из справочника"
                                  />
                                  <span>
                                    {itemQuery.trim()
                                      ? `${itemResults.length} найдено`
                                      : 'Введи название предмета'}
                                  </span>
                                </div>
                                {itemResults.length > 0 && (
                                  <div className="search-results">
                                    {itemResults.map((item) => (
                                      <button
                                        key={`inv-item-${item.id}`}
                                        className="search-result"
                                        onClick={() => void handleAddInventoryFromLibrary('items', item.id)}
                                      >
                                        {item.name_ru ?? item.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="search">
                                  <input
                                    value={weaponQuery}
                                    onChange={(event) => setWeaponQuery(event.target.value)}
                                    placeholder="Поиск оружия из справочника"
                                  />
                                  <span>
                                    {weaponQuery.trim()
                                      ? `${weaponResults.length} найдено`
                                      : 'Введи название оружия'}
                                  </span>
                                </div>
                                {weaponResults.length > 0 && (
                                  <div className="search-results">
                                    {weaponResults.map((weapon) => (
                                      <button
                                        key={`inv-weapon-${weapon.id}`}
                                        className="search-result"
                                        onClick={() => void handleAddInventoryFromLibrary(weapon.catalog, weapon.id)}
                                      >
                                        {weapon.name_ru ?? weapon.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="search">
                                  <input
                                    value={artifactQuery}
                                    onChange={(event) => setArtifactQuery(event.target.value)}
                                    placeholder="Поиск артефакта из справочника"
                                  />
                                  <span>
                                    {artifactQuery.trim()
                                      ? `${artifactResults.length} найдено`
                                      : 'Введи название артефакта'}
                                  </span>
                                </div>
                                {artifactResults.length > 0 && (
                                  <div className="search-results">
                                    {artifactResults.map((artifact) => (
                                      <button
                                        key={`inv-art-${artifact.id}`}
                                        className="search-result"
                                        onClick={() => void handleAddInventoryFromLibrary('artifacts', artifact.id)}
                                      >
                                        {artifact.name_ru ?? artifact.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="form">
                                  <button className="button button--ghost" onClick={openCreateCustomWeaponModal} disabled={!campaign}>
                                    Создать кастомное оружие
                                  </button>
                                </div>
                                <div className="search">
                                  <input
                                    value={customWeaponQuery}
                                    onChange={(event) => setCustomWeaponQuery(event.target.value)}
                                    placeholder="Поиск кастомного оружия"
                                  />
                                  <span>{customWeaponRows.length} в списке</span>
                                </div>
                                {customWeaponError && <div className="error">{customWeaponError}</div>}
                                {customWeaponRows.length > 0 && (
                                  <div className="search-results">
                                    {customWeaponRows.map((weapon) => (
                                      <div key={weapon.id} className="search-result search-result--split">
                                        <div>
                                          <strong>{weapon.name}</strong>
                                          <div className="list__subtitle">
                                            {[weapon.kind, weapon.damage].filter(Boolean).join(' · ') || 'Оружие'}
                                          </div>
                                        </div>
                                        <div className="search-result__actions">
                                          <button className="chip" onClick={() => void addCustomWeaponToInventory(weapon.id)}>
                                            В инвентарь
                                          </button>
                                          <button className="chip" onClick={() => void editCustomWeapon(weapon.id)}>
                                            Править
                                          </button>
                                          <button className="chip chip--warn" onClick={() => void deleteCustomWeapon(weapon.id)}>
                                            Удалить
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <details className="library-list">
                                <summary className="library-list__summary">Оружие персонажа</summary>
                                {characterWeapons.length === 0 && (
                                  <div className="empty">Оружие ещё не добавлено</div>
                                )}
                                {characterWeapons.length > 0 && (
                                  <>
                                    <div className="form">
                                      <select
                                        value={selectedCharacterData.equipment.primaryWeaponKey ?? ''}
                                        onChange={(event) =>
                                          void handleSetEquippedWeapon('primaryWeaponKey', event.target.value)
                                        }
                                      >
                                        <option value="">Основное оружие: не выбрано</option>
                                        {characterWeapons.map((weapon) => (
                                          <option key={`primary-${weapon.key}`} value={weapon.key}>
                                            {weapon.name}
                                          </option>
                                        ))}
                                      </select>
                                      <select
                                        value={selectedCharacterData.equipment.secondaryWeaponKey ?? ''}
                                        onChange={(event) =>
                                          void handleSetEquippedWeapon('secondaryWeaponKey', event.target.value)
                                        }
                                      >
                                        <option value="">Вторичное оружие: не выбрано</option>
                                        {characterWeapons.map((weapon) => (
                                          <option key={`secondary-${weapon.key}`} value={weapon.key}>
                                            {weapon.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="search-results">
                                      {characterWeapons.map((weapon) => (
                                        <div key={`weapon-row-${weapon.key}`} className="search-result search-result--split">
                                          <div>
                                            <strong>{weapon.name}</strong>
                                            <div className="list__subtitle">
                                              {[
                                                weapon.attackBonus !== null && weapon.attackBonus !== undefined
                                                  ? `Атака ${formatMod(weapon.attackBonus)}`
                                                  : null,
                                                weapon.damageExpr ?? null
                                              ]
                                                .filter(Boolean)
                                                .join(' · ') || weapon.summary || 'Параметры не указаны'}
                                            </div>
                                          </div>
                                          <div className="search-result__actions">
                                            <button className="chip chip--accent" onClick={() => addCharacterToCombat(weapon.key)}>
                                              В бой
                                            </button>
                                            <button className="chip chip--warn" onClick={() => void handleRemoveWeapon(weapon.key)}>
                                              Удалить
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </details>
                              {selectedCharacterData.inventory.length === 0 && (
                                <div className="empty">Инвентарь пуст</div>
                              )}
                              {selectedCharacterData.inventory.length > 0 && (
                                <div className="campaign-inventory-list">
                                  <div className="campaign-inventory-toolbar">
                                    <div className="campaign-inventory-filters">
                                      {[
                                        ['all', 'Все'],
                                        ['consumables', 'Расходники'],
                                        ['weapons', 'Оружие'],
                                        ['armor', 'Броня'],
                                        ['artifacts', 'Артефакты']
                                      ].map(([key, label]) => (
                                        <button
                                          key={key}
                                          className={inventoryFilter === key ? 'chip chip--accent' : 'chip'}
                                          onClick={() =>
                                            setInventoryFilter(
                                              key as 'all' | 'consumables' | 'weapons' | 'armor' | 'artifacts'
                                            )
                                          }
                                        >
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                    <div className="campaign-inventory-sort-row">
                                      <select
                                        value={inventorySort}
                                        onChange={(event) =>
                                          setInventorySort(event.target.value as 'name' | 'qty')
                                        }
                                      >
                                        <option value="name">Сортировка: по имени</option>
                                        <option value="qty">Сортировка: по количеству</option>
                                      </select>
                                      <button
                                        className="chip"
                                        onClick={() =>
                                          setInventorySortDirection((prev) =>
                                            prev === 'asc' ? 'desc' : 'asc'
                                          )
                                        }
                                      >
                                        {inventorySortDirection === 'asc' ? '↑ По возрастанию' : '↓ По убыванию'}
                                      </button>
                                    </div>
                                  </div>
                                  {visibleInventory.length === 0 && (
                                    <div className="empty">Нет предметов по выбранному фильтру</div>
                                  )}
                                  {visibleInventory.map(({ entry, index }) => (
                                    <div
                                      key={`inv-${selectedCharacter.id}-${index}-${entry.name}-${entry.qty}`}
                                      className="campaign-inventory-row"
                                    >
                                      <input
                                        defaultValue={entry.name}
                                        onBlur={(event) =>
                                          void handleUpdateInventoryItem(index, { name: event.target.value })
                                        }
                                      />
                                      <div className="campaign-inventory-qty">
                                        <button
                                          className="chip"
                                          onClick={() => void handleUpdateInventoryItem(index, { qty: entry.qty - 1 })}
                                        >
                                          -1
                                        </button>
                                        <input
                                          type="number"
                                          min={1}
                                          defaultValue={entry.qty}
                                          onBlur={(event) =>
                                            void handleUpdateInventoryItem(index, { qty: Number(event.target.value) })
                                          }
                                        />
                                        <button
                                          className="chip"
                                          onClick={() => void handleUpdateInventoryItem(index, { qty: entry.qty + 1 })}
                                        >
                                          +1
                                        </button>
                                      </div>
                                      <input
                                        defaultValue={entry.notes ?? ''}
                                        placeholder="Заметка"
                                        onBlur={(event) =>
                                          void handleUpdateInventoryItem(index, { notes: event.target.value })
                                        }
                                      />
                                      <button
                                        className="chip chip--warn"
                                        onClick={() => void handleRemoveInventory(index)}
                                      >
                                        Удалить
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </details>
                          </div>
                        )}
                      </>
                    )}
                  </section>
                </>
              )}
            </>
            )}
          </section>
        )}
        {isEntityLibraryView && (
          <>
            <section className="panel panel--list">
              <details className="library-list">
                <summary className="library-list__summary">
                  Список: {entityLabels[entity]}
                </summary>
                {error && <div className="error">{error}</div>}
                {!error && isLoading && <div className="empty">Загрузка…</div>}
                {!error && !isLoading && data.items.length === 0 && (
                  <div className="empty">Ничего не найдено</div>
                )}
                {!error && !isLoading && data.items.length > 0 && (
                  <div className="list">
                    {data.items.map((item) => (
                        <article
                          key={item.id}
                          className={
                            item.id === selectedId ? 'list__item list__item--active' : 'list__item'
                          }
                          onClick={() => {
                            if (activeView === 'reference' && isReferenceEntitySection) {
                              void openReferenceEntityModal(item)
                              return
                            }
                            setSelectedId(item.id)
                          }}
                        >
                        <div>
                          <div className="list__title">{getDisplayName(item)}</div>
                          {getSubtitle(item) && (
                            <div className="list__subtitle">{getSubtitle(item)}</div>
                          )}
                        </div>
                        <div className="list__meta">
                          {getListMeta(entity, item).map((meta) => (
                            <span key={meta}>{meta}</span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </details>
            </section>

            <section className="panel panel--detail">
              <div className="detail__header">
                <h2>{getDetailTitle(detail)}</h2>
                {detail?.source && <span className="detail__tag">{detail.source}</span>}
              </div>
              {activeView === 'reference' ? (
                <div className="detail__section">
                  <div className="detail__text">
                    В режиме справочника карточка открывается в модальном окне по клику на элемент списка.
                  </div>
                </div>
              ) : (
                <>
              {isDetailLoading && <div className="empty">Загрузка…</div>}
              {!isDetailLoading && !detail && <div className="empty">Выберите запись</div>}
              {!isDetailLoading && detail && (
                <div className="detail__content">
                  {entity === 'monsters' && monster && (
                    <>
                      <div className="statblock">
                        <div className="statblock__row">
                          <div className="detail__label">Тип</div>
                          <div>
                            {[monster.size, monster.type, monster.alignment]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </div>
                        </div>
                        <div className="statblock__row">
                          <div className="detail__label">Класс доспеха</div>
                          <div>{toText(monster.ac)}</div>
                        </div>
                        <div className="statblock__row">
                          <div className="detail__label">Хиты</div>
                          <div>{toText(monster.hp)}</div>
                        </div>
                        <div className="statblock__row">
                          <div className="detail__label">Скорость</div>
                          <div>{toText(monster.speed)}</div>
                        </div>
                        <div className="statblock__row">
                          <div className="detail__label">Спасброски</div>
                          <div>{formatMonsterSaves(monster) ?? '—'}</div>
                        </div>
                        <div className="statblock__row">
                          <div className="detail__label">Сенсоры</div>
                          <div>{toText(monster.senses)}</div>
                        </div>
                        <div className="statblock__row">
                          <div className="detail__label">Языки</div>
                          <div>{toText(monster.languages)}</div>
                        </div>
                        <div className="statblock__row">
                          <div className="detail__label">КС</div>
                          <div>{toText(monster.cr)}</div>
                        </div>
                      </div>
                      <div className="detail__grid detail__grid--stats">
                        {abilityKeys.map((key) => {
                          const score = typeof monster?.[key] === 'number' ? monster[key] : null
                          return (
                            <div key={key} className="stat-card">
                              <div className="detail__label">{abilityLabels[key]}</div>
                              <div className="stat-card__row">
                                <strong>{toText(score)}</strong>
                                <span className="stat-card__auto">
                                  {formatMod(scoreToMod(score))}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {monsterDescription && (
                        <section className="detail__section">
                          <h3>Описание</h3>
                          <div className="detail__text">{renderFormattedText(monsterDescription)}</div>
                        </section>
                      )}
                      {traits.length > 0 && (
                        <details className="statblock-section">
                          <summary>Черты</summary>
                          {renderMonsterEntries(traits)}
                        </details>
                      )}
                      {actions.length > 0 && (
                        <details className="statblock-section" open>
                          <summary>Действия</summary>
                          {renderMonsterEntries(actions)}
                        </details>
                      )}
                      {reactions.length > 0 && (
                        <details className="statblock-section">
                          <summary>Реакции</summary>
                          {renderMonsterEntries(reactions)}
                        </details>
                      )}
                      {legendaryList.length > 0 && (
                        <details className="statblock-section">
                          <summary>
                            Легендарные действия <span className="statblock-badge">ЛЕГЕНДАРНЫЕ</span>
                          </summary>
                          {renderMonsterEntries(legendaryList)}
                        </details>
                      )}
                      {lairList.length > 0 && (
                        <details className="statblock-section">
                          <summary>
                            Действия логова <span className="statblock-badge statblock-badge--lair">ЛОГОВО</span>
                          </summary>
                          {renderMonsterEntries(lairList)}
                        </details>
                      )}
                    </>
                  )}
                  {entity === 'spells' && spellData && (
                    <div className="detail__grid">
                      <div>
                        <div className="detail__label">Уровень</div>
                        <div>{getLocaleValue(spellData, 'level') ?? '—'}</div>
                      </div>
                      <div>
                        <div className="detail__label">Школа</div>
                        <div>{getLocaleValue(spellData, 'school') ?? '—'}</div>
                      </div>
                      <div>
                        <div className="detail__label">Время</div>
                        <div>{getLocaleValue(spellData, 'castingTime') ?? '—'}</div>
                      </div>
                      <div>
                        <div className="detail__label">Дистанция</div>
                        <div>{getLocaleValue(spellData, 'range') ?? '—'}</div>
                      </div>
                    </div>
                  )}
                  {entity === 'items' && itemData && (
                    <div className="detail__grid">
                      <div>
                        <div className="detail__label">Тип</div>
                        <div>{getLocaleValue(itemData, 'type') ?? '—'}</div>
                      </div>
                      <div>
                        <div className="detail__label">Редкость</div>
                        <div>{rarityLabel(itemData?.en?.rarity ?? itemData?.ru?.rarity)}</div>
                      </div>
                      <div>
                        <div className="detail__label">КД</div>
                        <div>{itemData?.en?.ac ?? itemData?.ru?.ac ?? '—'}</div>
                      </div>
                    </div>
                  )}
                  {entity === 'weapons' && weaponData && (
                    <div className="detail__grid">
                      <div>
                        <div className="detail__label">Тип</div>
                        <div>{getLocaleValue(weaponData, 'type') ?? getLocaleValue(weaponData, 'weaponType') ?? '—'}</div>
                      </div>
                      <div>
                        <div className="detail__label">Урон</div>
                        <div>{weaponData?.en?.damageVal ?? weaponData?.ru?.damageVal ?? weaponData?.damage ?? '—'}</div>
                      </div>
                      <div>
                        <div className="detail__label">Тип урона</div>
                        <div>{weaponData?.en?.damageType ?? weaponData?.ru?.damageType ?? weaponData?.damageType ?? '—'}</div>
                      </div>
                      <div>
                        <div className="detail__label">Дистанция</div>
                        <div>{getLocaleValue(weaponData, 'range') ?? weaponData?.rangeText ?? '—'}</div>
                      </div>
                    </div>
                  )}
                  {entity === 'artifacts' && artifactData && (
                    <div className="detail__grid">
                      <div>
                        <div className="detail__label">Тип</div>
                        <div>{getLocaleValue(artifactData, 'type') ?? '—'}</div>
                      </div>
                      <div>
                        <div className="detail__label">Редкость</div>
                        <div>{rarityLabel(artifactData?.en?.rarity ?? artifactData?.ru?.rarity)}</div>
                      </div>
                      <div>
                        <div className="detail__label">Настройка</div>
                        <div>{artifactData?.en?.attunement ?? artifactData?.ru?.attunement ?? '—'}</div>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="detail__label">Описание</div>
                    <div
                      className="detail__text"
                      dangerouslySetInnerHTML={{
                        __html: getDescriptionHtml(detail.data) || 'Описание отсутствует'
                      }}
                    />
                  </div>
                </div>
              )}
                </>
              )}
            </section>
          </>
        )}
        {activeView === 'reference' && !isReferenceEntitySection && (
          <>
            <section className="panel panel--list">
              <details className="library-list" open>
                <summary className="library-list__summary">
                  Список:{' '}
                  {ttgKind === 'classes' ? 'Классы' : ttgKind === 'races' ? 'Расы' : 'Правила'}
                </summary>
                {ttgError && <div className="error">{ttgError}</div>}
                {!ttgError && ttgLoading && <div className="empty">Загрузка…</div>}
                {!ttgError && !ttgLoading && ttgItems.length === 0 && (
                  <div className="empty">Ничего не найдено</div>
                )}
                {!ttgError && !ttgLoading && ttgItems.length > 0 && (
                  <div className="list">
                    {ttgItems.map((entry) => {
                      const slug = entry.slug ?? `${entry.name_ru ?? entry.name_en ?? 'entry'}`
                      const title = entry.name_ru ?? entry.name_en ?? slug
                      const subtitle = entry.name_ru && entry.name_en ? entry.name_en : null
                      const ruleType = 'type' in entry ? entry.type : null
                      const meta = [ruleType, entry.source_short, entry.source_name]
                        .filter(Boolean)
                        .join(' · ')
                      return (
                        <article
                          key={slug}
                          className={
                            slug === (ttgSelected?.slug ?? null)
                              ? 'list__item list__item--active'
                              : 'list__item'
                          }
                          onClick={() => {
                            setTtgSelectedSlug(entry.slug ?? null)
                            openReferenceTtgModal(entry)
                          }}
                        >
                          <div>
                            <div className="list__title">{title}</div>
                            {subtitle && <div className="list__subtitle">{subtitle}</div>}
                          </div>
                          <div className="list__meta">
                            <span>{meta || '—'}</span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </details>
            </section>

            <section className="panel panel--detail">
              <div className="detail__header">
                <h2>Просмотр карточки</h2>
              </div>
              <div className="detail__section">
                <div className="detail__text">
                  Кликни на карточку в списке слева — полная информация откроется в модальном окне.
                </div>
              </div>
            </section>
          </>
        )}
        {activeView === 'combat' && (
          <>
            <section className="panel panel--list">
              <div className="detail__header">
                <h2>Сессия боя</h2>
                <span className="detail__tag">
                  {campaign ? `Кампания: ${campaign.name}` : 'Нет кампании'}
                </span>
              </div>
              <div className="detail__stack">
                <div className="form">
                  <input
                    value={combatName}
                    onChange={(event) => setCombatName(event.target.value)}
                    placeholder="Название сессии"
                  />
                  <button className="button" onClick={saveCombatSession}>
                    Сохранить
                  </button>
                  <button className="button button--ghost" onClick={resetCombat}>
                    Новая
                  </button>
                </div>
                <div className="combat-toolbar">
                  <button className="button button--ghost" onClick={importCombatSession}>
                    Импорт
                  </button>
                  <button
                    className="button button--ghost"
                    onClick={exportCombatSession}
                    disabled={!selectedCombatId}
                  >
                    Экспорт
                  </button>
                  <button className="button" onClick={() => window.beholder.combatBoard.open()}>
                    Открыть боевой стол
                  </button>
                </div>
              </div>
              {combatStatus && <div className="detail__text">{combatStatus}</div>}
              {combatSessionsLoading && <div className="empty">Загрузка сессий…</div>}
              {combatSessionsError && <div className="error">{combatSessionsError}</div>}
              {!combatSessionsLoading && !combatSessionsError && combatSessions.length === 0 && (
                <div className="empty">Сессий боя пока нет</div>
              )}
              {!combatSessionsLoading && !combatSessionsError && combatSessions.length > 0 && (
                <div className="detail__section">
                  <div className="detail__label">Сохранённые сессии</div>
                  <div className="search-results">
                    {combatSessions.map((session) => (
                      <div key={session.id} className="search-result search-result--split">
                        <button
                          className={
                            session.id === selectedCombatId
                              ? 'chip chip--accent'
                              : 'chip'
                          }
                          onClick={() => loadCombatSession(session.id)}
                        >
                          {session.name}
                        </button>
                        <button
                          className="chip chip--warn"
                          onClick={() => void deleteCombatSession(session.id, session.name)}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="detail__section combat-participants-section">
                <div className="detail__label">Участники</div>
                <div className="combat-filters">
                  <div className="combat-filters__chips">
                    {[
                      { key: 'all', label: 'Все' },
                      { key: 'alive', label: 'Живые' },
                      { key: 'down', label: 'Без ХП' },
                      { key: 'concentration', label: 'Концентрация' },
                      { key: 'status', label: 'Статусы' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        className={
                          combatFilter === item.key
                            ? 'dice-chip dice-chip--active'
                            : 'dice-chip'
                        }
                        onClick={() => setCombatFilter(item.key as any)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <input
                    className="combat-filters__search"
                    value={combatSearch}
                    onChange={(event) => setCombatSearch(event.target.value)}
                    placeholder="Поиск по участникам"
                  />
                </div>
                {orderedParticipants.length === 0 && (
                  <div className="empty">Добавь участников</div>
                )}
                {orderedParticipants.length > 0 && visibleParticipants.length === 0 && (
                  <div className="empty">Нет участников по фильтру</div>
                )}
                {visibleParticipants.length > 0 &&
                  (isCombatBoardMode ? (
                    <div className="combat-board-wrap">
                      {targetingSourceId && (
                        <div className="combat-target-hint">
                          Выбери цель: кликни по карточке цели. Повторный клик отменит выбор.
                        </div>
                      )}
                      <div
                        className="combat-board"
                        ref={combatBoardRef}
                        onScroll={() => updateCombatLinks()}
                        onPointerMove={(event) => {
                          if (!targetingSourceId) return
                          if (linkDragStart && !linkDragActive) {
                            const dx = event.clientX - linkDragStart.x
                            const dy = event.clientY - linkDragStart.y
                            if (Math.hypot(dx, dy) > 6) {
                              setLinkDragActive(true)
                            }
                          }
                          if (!linkDragActive) return
                          const board = combatBoardRef.current
                          if (!board) return
                          const rect = board.getBoundingClientRect()
                          setTargetingCursor({
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top
                          })
                        }}
                        onPointerLeave={() => {
                          if (targetingSourceId) setTargetingCursor(null)
                        }}
                        onPointerUp={(event) => {
                          if (!linkDragSourceId) return
                          const sourceId = linkDragSourceId
                          if (linkDragActive) {
                            const targetEl = (event.target as HTMLElement | null)?.closest('.combat-card') as
                              | HTMLElement
                              | null
                            const targetId = targetEl?.dataset?.id ?? null
                            if (targetId && targetId !== sourceId) {
                              updateParticipant(sourceId, { targetId })
                            }
                            setTargetingSourceId(null)
                            setTargetingCursor(null)
                          }
                          setLinkDragSourceId(null)
                          setLinkDragStart(null)
                          setLinkDragActive(false)
                        }}
                      >
                        <svg className="combat-links" aria-hidden="true">
                          <defs>
                            <marker
                              id="combat-arrow"
                              markerWidth="10"
                              markerHeight="10"
                              refX="8"
                              refY="3"
                              orient="auto"
                            >
                              <path d="M0,0 L8,3 L0,6 Z" />
                            </marker>
                          </defs>
                          {combatLinks.map((link) => (
                            <path
                              key={link.id}
                              className="combat-link"
                              d={link.d}
                              markerEnd="url(#combat-arrow)"
                            />
                          ))}
                          {targetingSourceId && targetingCursor && (() => {
                            const sourceCard = combatCardRefs.current.get(targetingSourceId)
                            const board = combatBoardRef.current
                            if (!sourceCard || !board) return null
                            const boardRect = board.getBoundingClientRect()
                            const sourceRect = sourceCard.getBoundingClientRect()
                            const startX = sourceRect.left - boardRect.left + sourceRect.width
                            const startY = sourceRect.top - boardRect.top + sourceRect.height / 2
                            const endX = targetingCursor.x
                            const endY = targetingCursor.y
                            const midX = startX + (endX - startX) * 0.5
                            const d = `M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`
                            return (
                              <path
                                className="combat-link combat-link--live"
                                d={d}
                                stroke="rgba(120, 149, 255, 0.9)"
                                strokeWidth={2.5}
                                fill="none"
                                markerEnd="url(#combat-arrow)"
                              />
                            )
                          })()}
                        </svg>
                        <div className="combat-cards">
                          {visibleParticipants.map((participant, index) => (
                            <CombatParticipantCard
                              key={participant.id}
                              participant={participant}
                              target={getParticipantById(participant.targetId)}
                              index={index}
                              active={participant.id === currentTurnId}
                              targetingSourceId={targetingSourceId}
                              impactFlash={impactFlash}
                              defaultSize={defaultCardSize}
                              boardRef={combatBoardRef}
                              cardRefs={combatCardRefs}
                              cardPressRef={cardPressRef}
                              onUpdate={updateParticipant}
                              onOpenDetails={setCombatDetailId}
                              onRollInitiative={rollInitiative}
                              onDamage={applyDamage}
                              onHeal={applyHeal}
                              onRemove={removeParticipant}
                              onWeaponSelect={updateParticipantWeaponSelection}
                              onAttack={performAttackAgainstTarget}
                              onClearConcentration={clearConcentration}
                              onRemoveCondition={removeCondition}
                              onRemoveEffect={removeEffect}
                              setLinkDragSourceId={setLinkDragSourceId}
                              setLinkDragStart={setLinkDragStart}
                              setLinkDragActive={setLinkDragActive}
                              setTargetingSourceId={setTargetingSourceId}
                              setTargetingCursor={setTargetingCursor}
                              setResizingCard={setResizingCard}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="combat-list">
                      {visibleParticipants.map((participant) => (
                        <CombatParticipantRow
                          key={participant.id}
                          participant={participant}
                          active={participant.id === currentTurnId}
                          onUpdate={updateParticipant}
                          onWeaponSelect={updateParticipantWeaponSelection}
                          onRollInitiative={rollInitiative}
                          onRollAttack={rollAttack}
                          onRollDamage={rollDamage}
                          onRollSave={rollSave}
                          onPerformAction={performAction}
                          onRollActionSave={rollActionSaveForTarget}
                          onDamage={applyDamage}
                          onHeal={applyHeal}
                          onRemove={removeParticipant}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            <section className="panel panel--detail">
              <div className="detail__header">
                <h2>Ход боя</h2>
                <span className="detail__tag">
                  {orderedParticipants.length > 0
                    ? `Раунд ${roundNumber} · Ход ${activeTurnPosition}/${orderedParticipants.length}`
                    : 'Нет участников'}
                </span>
              </div>
              {isCombatBoardMode && (
                <div className="detail__content">
                  <div className="detail__section">
                    <div className="detail__label">Сессия боя</div>
                    <div className="detail__stack">
                      <div className="form">
                        <input
                          value={combatName}
                          onChange={(event) => setCombatName(event.target.value)}
                          placeholder="Название сессии"
                        />
                        <button className="button" onClick={saveCombatSession}>
                          Сохранить
                        </button>
                        <button className="button button--ghost" onClick={resetCombat}>
                          Новая
                        </button>
                      </div>
                      <div className="combat-toolbar">
                        <button className="button button--ghost" onClick={importCombatSession}>
                          Импорт
                        </button>
                        <button
                          className="button button--ghost"
                          onClick={exportCombatSession}
                          disabled={!selectedCombatId}
                        >
                          Экспорт
                        </button>
                      </div>
                    </div>
                    {combatStatus && <div className="detail__text">{combatStatus}</div>}
                    {combatSessionsLoading && <div className="empty">Загрузка сессий…</div>}
                    {combatSessionsError && <div className="error">{combatSessionsError}</div>}
                    {!combatSessionsLoading && !combatSessionsError && combatSessions.length === 0 && (
                      <div className="empty">Сессий боя пока нет</div>
                    )}
                    {!combatSessionsLoading && !combatSessionsError && combatSessions.length > 0 && (
                      <div className="detail__section">
                        <div className="detail__label">Сохранённые сессии</div>
                        <div className="search-results">
                          {combatSessions.map((session) => (
                            <div key={session.id} className="search-result search-result--split">
                              <button
                                className={
                                  session.id === selectedCombatId
                                    ? 'chip chip--accent'
                                    : 'chip'
                                }
                                onClick={() => loadCombatSession(session.id)}
                              >
                                {session.name}
                              </button>
                              <button
                                className="chip chip--warn"
                                onClick={() => void deleteCombatSession(session.id, session.name)}
                              >
                                Удалить
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <details className="library-list">
                    <summary className="library-list__summary">Добавить персонажа</summary>
                    {charactersLoading && <div className="empty">Загрузка персонажей…</div>}
                    {charactersError && <div className="error">{charactersError}</div>}
                    {!charactersLoading && !charactersError && characters.length === 0 && (
                      <div className="empty">Персонажей пока нет</div>
                    )}
                    {!charactersLoading && !charactersError && characters.length > 0 && (
                      <div className="form">
                        <select
                          value={selectedCharacterId ?? ''}
                          onChange={(event) =>
                            setSelectedCharacterId(event.target.value ? Number(event.target.value) : null)
                          }
                        >
                          {characters.map((char) => (
                            <option key={char.id} value={char.id}>
                              {char.name}
                            </option>
                          ))}
                        </select>
                        <button className="button" onClick={() => addCharacterToCombat()}>
                          Добавить
                        </button>
                      </div>
                    )}
                  </details>
                  <details className="library-list">
                    <summary className="library-list__summary">Добавить монстра</summary>
                    <div className="search">
                      <input
                        value={combatQuery}
                        onChange={(event) => setCombatQuery(event.target.value)}
                        onInput={(event) =>
                          setCombatQuery((event.currentTarget as HTMLInputElement).value)
                        }
                        autoComplete="off"
                        placeholder="Поиск монстра..."
                      />
                      <span>
                        {combatError
                          ? 'Ошибка поиска'
                          : combatQuery.trim()
                            ? `${combatResults.length} результатов`
                            : 'Введите имя'}
                      </span>
                    </div>
                    {combatError && <div className="error">{combatError}</div>}
                    {combatResults.length > 0 && (
                      <div className="search-results">
                        {combatResults.map((monster) => (
                          <button
                            key={monster.id}
                            className="search-result"
                            onClick={() => addMonsterToCombat(monster)}
                          >
                            {monster.name_ru ?? monster.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </details>
                  <details className="library-list">
                    <summary className="library-list__summary">Кастомный монстр (D&D 5e)</summary>
                    <div className="form">
                      <button className="button" onClick={openCreateCustomMonsterModal} disabled={!campaign}>
                        Открыть конструктор
                      </button>
                    </div>
                    <div className="search">
                      <input
                        value={customMonsterQuery}
                        onChange={(event) => setCustomMonsterQuery(event.target.value)}
                        placeholder="Поиск кастомного монстра"
                      />
                      <span>{customMonsterRows.length} в списке</span>
                    </div>
                    {customMonsterError && <div className="error">{customMonsterError}</div>}
                    {customMonsterRows.length > 0 && (
                      <div className="search-results">
                        {customMonsterRows.map((monster) => (
                          <div key={monster.id} className="search-result search-result--split">
                            <div>
                              <strong>{monster.name}</strong>
                              <div className="list__subtitle">CR: {monster.cr ?? '—'}</div>
                            </div>
                            <div className="search-result__actions">
                              <button className="chip" onClick={() => addCustomMonsterToCombat(monster.id)}>
                                В бой
                              </button>
                              <button className="chip" onClick={() => editCustomMonster(monster.id)}>
                                Править
                              </button>
                              <button className="chip chip--warn" onClick={() => deleteCustomMonster(monster.id)}>
                                Удалить
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </details>
                </div>
              )}
              {orderedParticipants.length > 0 && (
                <div className="detail__content">
                  <CombatTurnControls
                    participant={activeParticipant}
                    onNextTurn={nextTurn}
                    onDamage={applyDamage}
                    onHeal={applyHeal}
                    onDamageAll={applyDamageAll}
                    onHealAll={applyHealAll}
                    onAddCondition={addConditionTo}
                    onAddEffect={addEffectTo}
                    onSetConcentration={setConcentrationTo}
                    onClearConcentration={clearConcentration}
                    onRemoveCondition={removeCondition}
                    onRemoveEffect={removeEffect}
                    onPerformAction={performAction}
                    onRollSave={rollActionSaveForTarget}
                  />
                  {combatLog.length > 0 && (
                    <div className="combat-log">
                      <div className="combat-log__header">
                        <div className="combat-log__title">
                          <span className="detail__label">Последние броски</span>
                          <span className="combat-log__count">всего: {combatLog.length}</span>
                        </div>
                        <div className="combat-log__actions">
                          <button
                            className="button button--ghost"
                            onClick={() => setCombatLogExpanded((prev) => !prev)}
                          >
                            {combatLogExpanded ? 'Свернуть' : 'Развернуть'}
                          </button>
                          <button className="button button--ghost" onClick={clearCombatLog}>
                            Очистить
                          </button>
                        </div>
                      </div>
                      {(combatLogExpanded ? combatLog : combatLog.slice(0, 6)).map(
                        (entry, index) => (
                          <div
                            key={`${entry.label}-${index}`}
                            className={`combat-log__item combat-log__item--${entry.tone}`}
                          >
                            <span>{entry.label}</span>
                            <strong>{entry.total ?? '—'}</strong>
                            <span className="combat-log__detail">{entry.detail}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                  <section className="detail__section">
                    <h3>Бросок кубиков</h3>
                    <div className="dice-quick">
                      <div className="dice-quick__row">
                        <button className="dice-chip" onClick={() => rollQuickDice(20)}>
                          d20
                        </button>
                        <button className="dice-chip" onClick={() => rollQuickDice(12)}>
                          d12
                        </button>
                        <button className="dice-chip" onClick={() => rollQuickDice(10)}>
                          d10
                        </button>
                        <button className="dice-chip" onClick={() => rollQuickDice(8)}>
                          d8
                        </button>
                        <button className="dice-chip" onClick={() => rollQuickDice(6)}>
                          d6
                        </button>
                        <button className="dice-chip" onClick={() => rollQuickDice(4)}>
                          d4
                        </button>
                        <button className="dice-chip" onClick={() => rollQuickDice(100)}>
                          d100
                        </button>
                      </div>
                      <div className="dice-quick__row">
                        <button className="dice-chip" onClick={() => rollQuickDice(20, 1, 'adv')}>
                          d20 adv
                        </button>
                        <button className="dice-chip" onClick={() => rollQuickDice(20, 1, 'dis')}>
                          d20 dis
                        </button>
                        <input
                          className="dice-quick__mod"
                          value={quickMod}
                          onChange={(event) => setQuickMod(event.target.value)}
                          placeholder="Мод."
                        />
                      </div>
                    </div>
                    <div className="dice">
                      <input
                        value={diceExpr}
                        onChange={(event) => setDiceExpr(event.target.value)}
                        placeholder="например 2d20+3"
                      />
                      <button className="button" onClick={handleRollDice}>
                        Бросить
                      </button>
                    </div>
                    <div className={diceRolling ? 'dice-result dice-result--rolling' : 'dice-result'}>
                      {diceRolling && <div className="dice-result__value">…</div>}
                      {!diceRolling && diceResult && (
                        <>
                          <div className="dice-result__value">{diceResult.total}</div>
                          <div className="dice-result__rolls">{diceResult.rolls.join(' · ')}</div>
                        </>
                      )}
                      {!diceRolling && !diceResult && <div className="empty">Нет бросков</div>}
                    </div>
                  </section>
                </div>
              )}
              {orderedParticipants.length === 0 && <div className="empty">Добавь участников</div>}
            </section>
          </>
        )}
      </main>
      {fullCharacterFormOpen && (
        <div className="modal" onClick={() => setFullCharacterFormOpen(false)}>
          <div className="modal__card modal__card--wide" onClick={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <h3>Полная форма персонажа</h3>
              <button className="modal__close" onClick={() => setFullCharacterFormOpen(false)}>
                X
              </button>
            </div>
            <div className="modal__content">
              <PlayerForm onSaveCharacter={handleCreateCharacterFromFullForm} embedded />
            </div>
          </div>
        </div>
      )}
      {combatDetailId && (() => {
        const participant = getParticipantById(combatDetailId)
        if (!participant) return null
        return (
          <CombatParticipantDetailDialog
            participant={participant}
            targetName={getParticipantById(participant.targetId)?.name}
            onClose={closeCombatDetail}
            onAddCondition={addConditionTo}
            onAddEffect={addEffectTo}
            onSetConcentration={setConcentrationTo}
            onClearConcentration={clearConcentration}
            onRemoveCondition={removeCondition}
            onRemoveEffect={removeEffect}
            onAttack={performAttackAgainstTarget}
            onRollSave={rollActionSaveForTarget}
          />
        )
      })()}
      {modal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal__card" onClick={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <h3>{modalDetail?.name_ru ?? modalDetail?.name ?? 'Детали'}</h3>
              <button className="modal__close" onClick={closeModal}>
                X
              </button>
            </div>
            {modalDetail?.source && <div className="modal__tag">{modalDetail.source}</div>}
            {modal.type === 'spells' && modalDetail && (
              <div className="modal__content">
                <div className="detail__grid">
                  <div>
                    <div className="detail__label">Уровень</div>
                    <div>{getLocaleValue(modalDetail.data, 'level') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Школа</div>
                    <div>{getLocaleValue(modalDetail.data, 'school') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Время</div>
                    <div>{getLocaleValue(modalDetail.data, 'castingTime') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Дистанция</div>
                    <div>{getLocaleValue(modalDetail.data, 'range') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Длительность</div>
                    <div>{getLocaleValue(modalDetail.data, 'duration') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Компоненты</div>
                    <div>{getLocaleValue(modalDetail.data, 'components') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Материалы</div>
                    <div>{getLocaleValue(modalDetail.data, 'materials') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Ритуал</div>
                    <div>{getLocaleValue(modalDetail.data, 'ritual') ?? '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="detail__label">Описание</div>
                  <div
                    className="detail__text"
                    dangerouslySetInnerHTML={{
                      __html: getDescriptionHtml(modalDetail.data) || 'Описание отсутствует'
                    }}
                  />
                </div>
              </div>
            )}
            {modal.type === 'items' && modalDetail && (
              <div className="modal__content">
                <div className="detail__grid">
                  <div>
                    <div className="detail__label">Тип</div>
                    <div>{getLocaleValue(modalDetail.data, 'type') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Дополнения</div>
                    <div>{getLocaleValue(modalDetail.data, 'typeAdditions') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Редкость</div>
                    <div>{rarityLabel(modalDetail.data?.en?.rarity ?? modalDetail.data?.ru?.rarity)}</div>
                  </div>
                  <div>
                    <div className="detail__label">Стоимость</div>
                    <div>{modalDetail.data?.en?.coast ?? modalDetail.data?.ru?.coast ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Вес</div>
                    <div>{modalDetail.data?.en?.weight ?? modalDetail.data?.ru?.weight ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">КД</div>
                    <div>{modalDetail.data?.en?.ac ?? modalDetail.data?.ru?.ac ?? '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="detail__label">Описание</div>
                  <div
                    className="detail__text"
                    dangerouslySetInnerHTML={{
                      __html: getDescriptionHtml(modalDetail.data) || 'Описание отсутствует'
                    }}
                  />
                </div>
              </div>
            )}
            {modal.type === 'weapons' && modalDetail && (
              <div className="modal__content">
                <div className="detail__grid">
                  <div>
                    <div className="detail__label">Тип</div>
                    <div>{getLocaleValue(modalDetail.data, 'type') ?? getLocaleValue(modalDetail.data, 'weaponType') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Дополнения</div>
                    <div>{getLocaleValue(modalDetail.data, 'typeAdditions') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Урон</div>
                    <div>{modalDetail.data?.en?.damageVal ?? modalDetail.data?.ru?.damageVal ?? modalDetail.data?.damage ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Тип урона</div>
                    <div>{modalDetail.data?.en?.damageType ?? modalDetail.data?.ru?.damageType ?? modalDetail.data?.damageType ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Дистанция</div>
                    <div>{getLocaleValue(modalDetail.data, 'range') ?? modalDetail.data?.rangeText ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Стоимость</div>
                    <div>{modalDetail.data?.en?.coast ?? modalDetail.data?.ru?.coast ?? '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="detail__label">Описание</div>
                  <div
                    className="detail__text"
                    dangerouslySetInnerHTML={{
                      __html: getDescriptionHtml(modalDetail.data) || 'Описание отсутствует'
                    }}
                  />
                </div>
              </div>
            )}
            {modal.type === 'artifacts' && modalDetail && (
              <div className="modal__content">
                <div className="detail__grid">
                  <div>
                    <div className="detail__label">Тип</div>
                    <div>{getLocaleValue(modalDetail.data, 'type') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Дополнения</div>
                    <div>{getLocaleValue(modalDetail.data, 'typeAdditions') ?? '—'}</div>
                  </div>
                  <div>
                    <div className="detail__label">Редкость</div>
                    <div>{rarityLabel(modalDetail.data?.en?.rarity ?? modalDetail.data?.ru?.rarity)}</div>
                  </div>
                  <div>
                    <div className="detail__label">Настройка</div>
                    <div>{modalDetail.data?.en?.attunement ?? modalDetail.data?.ru?.attunement ?? '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="detail__label">Описание</div>
                  <div
                    className="detail__text"
                    dangerouslySetInnerHTML={{
                      __html: getDescriptionHtml(modalDetail.data) || 'Описание отсутствует'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {referenceModal && (
        <ReferenceModalDialog
          modal={referenceModal}
          pinnedRuleSlugs={ttgPinnedRuleSlugs}
          onClose={() => setReferenceModal(null)}
          onToggleRulePin={toggleRulePin}
        />
      )}
      {customMonsterModalOpen && (
        <CustomMonsterDialog
          draft={customMonsterDraft}
          actions={customMonsterActions}
          error={customMonsterError}
          editing={editingCustomMonsterId !== null}
          saving={savingCustomMonster}
          campaignAvailable={campaign !== null}
          onClose={() => setCustomMonsterModalOpen(false)}
          onDraftChange={(key, value) => setCustomMonsterDraft((prev) => ({ ...prev, [key]: value }))}
          onActionChange={updateCustomActionRow}
          onAddAction={addCustomActionRow}
          onRemoveAction={removeCustomActionRow}
          onSave={() => void saveCustomMonster()}
          onReset={resetCustomMonsterForm}
        />
      )}
      {customWeaponModalOpen && (
        <CustomWeaponDialog
          draft={customWeaponDraft}
          error={customWeaponError}
          editing={editingCustomWeaponId !== null}
          saving={savingCustomWeapon}
          campaignAvailable={campaign !== null}
          onClose={() => setCustomWeaponModalOpen(false)}
          onChange={(key, value) => setCustomWeaponDraft((prev) => ({ ...prev, [key]: value }))}
          onSave={() => void saveCustomWeapon()}
          onReset={resetCustomWeaponForm}
        />
      )}
      {rollOverlay && (
        <div className={`roll-overlay roll-overlay--${rollOverlay.tone}`} role="status" aria-live="polite">
          <div className="roll-overlay__header">
            <span>{rollOverlay.label}</span>
            <button
              className="roll-overlay__close"
              onClick={() => setRollOverlay(null)}
            >
              X
            </button>
          </div>
          <div className="roll-overlay__value">{rollOverlay.total}</div>
          <div className="roll-overlay__detail">{rollOverlay.detail}</div>
        </div>
      )}
    </div>
  )
}
