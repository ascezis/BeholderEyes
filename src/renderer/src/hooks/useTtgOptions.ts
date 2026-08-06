import { useEffect, useMemo, useState } from 'react'
import type { TtgClass, TtgRace, TtgRule } from '../appSupport'

export type TtgSelectOption = { key: string; label: string }

const buildOptions = (items: Array<TtgClass | TtgRace>): TtgSelectOption[] => {
  const unique = new Map<string, TtgSelectOption>()
  const labels = new Set<string>()
  for (const item of items) {
    const key = item.slug?.trim()
    const label = (item.name_ru ?? item.name_en ?? '').trim()
    const normalizedLabel = label.toLocaleLowerCase('ru')
    if (key && label && !unique.has(key) && !labels.has(normalizedLabel)) {
      unique.set(key, { key, label })
      labels.add(normalizedLabel)
    }
  }
  return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label, 'ru'))
}

export function useTtgOptions(enabled: boolean) {
  const [classes, setClasses] = useState<TtgClass[]>([])
  const [races, setRaces] = useState<TtgRace[]>([])
  const [rules, setRules] = useState<TtgRule[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || loaded || loading) return
    setLoading(true)
    setError(null)
    window.beholder.ttg.getAll()
      .then((payload) => {
        setClasses(Array.isArray(payload.classes) ? payload.classes as TtgClass[] : [])
        setRaces(Array.isArray(payload.races) ? payload.races as TtgRace[] : [])
        setRules(Array.isArray(payload.rules) ? payload.rules as TtgRule[] : [])
        setLoaded(true)
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Ошибка загрузки справочника')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [enabled, loaded, loading])

  const classOptions = useMemo(() => buildOptions(classes), [classes])
  const raceOptions = useMemo(() => buildOptions(races), [races])

  return { classes, races, rules, classOptions, raceOptions, loading, loaded, error }
}
