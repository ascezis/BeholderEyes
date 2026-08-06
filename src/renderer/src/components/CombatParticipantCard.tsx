import type { MutableRefObject, PointerEvent, RefObject } from 'react'
import type { CombatParticipant } from '../appSupport'
import { stripHtml } from '../appSupport'

export type CombatCardResize = {
  id: string
  dir: 'e' | 's' | 'se'
  startX: number
  startY: number
  startWidth: number
  startHeight: number
}

export type CombatCardPress = {
  id: string
  pointerId: number
  startX: number
  startY: number
  timerId: number | null
  linkActive: boolean
}

type CombatAction = NonNullable<CombatParticipant['actions']>[number]

type Props = {
  participant: CombatParticipant
  target: CombatParticipant | undefined
  index: number
  active: boolean
  targetingSourceId: string | null
  impactFlash: { id: string; tone: 'hit' | 'miss'; value?: number | null } | null
  defaultSize: { width: number; height: number }
  boardRef: RefObject<HTMLDivElement | null>
  cardRefs: MutableRefObject<Map<string, HTMLDivElement>>
  cardPressRef: MutableRefObject<CombatCardPress | null>
  onUpdate: (id: string, patch: Partial<CombatParticipant>) => void
  onOpenDetails: (id: string) => void
  onRollInitiative: (participant: CombatParticipant) => void
  onDamage: (participant: CombatParticipant, amount: number) => void
  onHeal: (participant: CombatParticipant, amount: number) => void
  onRemove: (id: string) => void
  onWeaponSelect: (participant: CombatParticipant, key: string) => void
  onAttack: (participant: CombatParticipant, action: CombatAction) => void
  onClearConcentration: (id: string) => void
  onRemoveCondition: (id: string, index: number) => void
  onRemoveEffect: (id: string, index: number) => void
  setLinkDragSourceId: (id: string | null) => void
  setLinkDragStart: (point: { x: number; y: number } | null) => void
  setLinkDragActive: (active: boolean) => void
  setTargetingSourceId: (id: string | null) => void
  setTargetingCursor: (point: { x: number; y: number } | null) => void
  setResizingCard: (resize: CombatCardResize | null) => void
}

export default function CombatParticipantCard({
  participant,
  target,
  index,
  active,
  targetingSourceId,
  impactFlash,
  defaultSize,
  boardRef,
  cardRefs,
  cardPressRef,
  onUpdate,
  onOpenDetails,
  onRollInitiative,
  onDamage,
  onHeal,
  onRemove,
  onWeaponSelect,
  onAttack,
  onClearConcentration,
  onRemoveCondition,
  onRemoveEffect,
  setLinkDragSourceId,
  setLinkDragStart,
  setLinkDragActive,
  setTargetingSourceId,
  setTargetingCursor,
  setResizingCard
}: Props): JSX.Element {
  const isTargeting = targetingSourceId === participant.id
  const isSelectable = Boolean(targetingSourceId && targetingSourceId !== participant.id)
  const position = participant.position ?? {
    x: 20 + (index % 4) * 260,
    y: 20 + Math.floor(index / 4) * 230
  }
  const width = participant.size?.width ?? defaultSize.width
  const height = participant.size?.height ?? defaultSize.height

  const resetTargeting = (): void => {
    setTargetingSourceId(null)
    setTargetingCursor(null)
    setLinkDragSourceId(null)
    setLinkDragStart(null)
    setLinkDragActive(false)
  }

  const beginLink = (event: PointerEvent<HTMLElement>, activeLink: boolean): void => {
    setLinkDragSourceId(participant.id)
    setLinkDragStart({ x: event.clientX, y: event.clientY })
    setLinkDragActive(activeLink)
    setTargetingSourceId(participant.id)
    const board = boardRef.current
    if (activeLink && board) {
      const rect = board.getBoundingClientRect()
      setTargetingCursor({ x: event.clientX - rect.left, y: event.clientY - rect.top })
    } else {
      setTargetingCursor(null)
    }
  }

  const startResize = (dir: CombatCardResize['dir'], event: PointerEvent<HTMLDivElement>): void => {
    event.stopPropagation()
    if (event.button !== 0) return
    setResizingCard({
      id: participant.id,
      dir,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: width,
      startHeight: height
    })
  }

  return (
    <div
      ref={(element) => {
        if (element) cardRefs.current.set(participant.id, element)
        else cardRefs.current.delete(participant.id)
      }}
      data-id={participant.id}
      className={[
        'combat-card',
        active ? 'combat-card--active' : '',
        isTargeting ? 'combat-card--source' : '',
        isSelectable ? 'combat-card--selectable' : '',
        participant.hpCurrent !== null && participant.hpCurrent <= 0 ? 'combat-card--down' : '',
        impactFlash?.id === participant.id
          ? impactFlash.tone === 'hit'
            ? 'combat-card--hit'
            : 'combat-card--miss'
          : ''
      ].filter(Boolean).join(' ')}
      style={{ left: position.x, top: position.y, width, height }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.button === 2) {
          event.preventDefault()
          if (!boardRef.current) return
          beginLink(event, true)
          event.currentTarget.setPointerCapture(event.pointerId)
          return
        }
        if (event.button !== 0 || targetingSourceId) return
        const targetElement = event.target as HTMLElement
        if (targetElement.closest('input, button, textarea, select') || !boardRef.current) return
        const timerId = window.setTimeout(() => {
          beginLink(event, true)
          const press = cardPressRef.current
          if (press) press.linkActive = true
        }, 240)
        cardPressRef.current = {
          id: participant.id,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          timerId,
          linkActive: false
        }
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onOpenDetails(participant.id)
      }}
      onClick={() => {
        if (!targetingSourceId) return
        if (targetingSourceId !== participant.id) {
          onUpdate(targetingSourceId, { targetId: participant.id })
        }
        resetTargeting()
      }}
    >
      <div className="combat-card__header">
        <div className="combat-card__title">
          <input
            className="combat-card__name"
            value={participant.name}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onUpdate(participant.id, { name: event.target.value })}
            onBlur={(event) => {
              const name = event.target.value.trim()
              if (!name) {
                onUpdate(participant.id, {
                  name: participant.kind === 'character' ? 'Персонаж' : 'Монстр'
                })
              } else if (name !== participant.name) {
                onUpdate(participant.id, { name })
              }
            }}
          />
          <span className="list__subtitle">
            {participant.kind === 'character' ? 'персонаж' : 'монстр'}
          </span>
          {participant.hpCurrent !== null && participant.hpCurrent <= 0 && (
            <span className="combat-down-badge">💀 Без сознания</span>
          )}
        </div>
        <div className="combat-card__quick">
          <button className="chip" onClick={(event) => { event.stopPropagation(); onRollInitiative(participant) }}>Иниц</button>
          <button className="chip chip--warn" onClick={(event) => { event.stopPropagation(); onDamage(participant, 5) }}>-5</button>
          <button className="chip" onClick={(event) => { event.stopPropagation(); onHeal(participant, 5) }}>+5</button>
          <button className="chip" onClick={(event) => { event.stopPropagation(); onRemove(participant.id) }}>×</button>
        </div>
      </div>
      <div className="combat-card__stats">
        <div className="combat-card__stat">
          <label>ХП</label>
          <input value={participant.hpCurrent ?? ''} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate(participant.id, { hpCurrent: event.target.value ? Number(event.target.value) : null })} placeholder="тек" />
          <span>/</span>
          <input value={participant.hpMax ?? ''} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate(participant.id, { hpMax: event.target.value ? Number(event.target.value) : null })} placeholder="макс" />
        </div>
        <div className="combat-card__stat">
          <label>КД</label>
          <input value={participant.ac ?? ''} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate(participant.id, { ac: event.target.value ? Number(event.target.value) : null })} placeholder="AC" />
        </div>
        <div className="combat-card__stat">
          <label>Иниц</label>
          <input value={participant.initiative ?? ''} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate(participant.id, { initiative: event.target.value ? Number(event.target.value) : null })} placeholder="иниц" />
        </div>
      </div>
      <div className="combat-card__target">
        <span className="combat-card__target-label">Цель: {target?.name ?? '—'}</span>
        <div className="combat-card__target-actions">
          <button
            className="chip"
            onPointerDown={(event) => {
              event.stopPropagation()
              if (event.button !== 0) return
              beginLink(event, false)
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onClick={(event) => { event.stopPropagation(); setTargetingSourceId(participant.id); setTargetingCursor(null) }}
          >
            {participant.targetId ? 'Сменить' : 'Выбрать'}
          </button>
          {participant.targetId && <button className="chip" onClick={(event) => { event.stopPropagation(); onUpdate(participant.id, { targetId: null }) }}>Сброс</button>}
        </div>
      </div>
      {(participant.conditions.length > 0 || participant.effects.length > 0 || participant.concentration) && (
        <div className="combat-card__badges">
          {participant.concentration && (
            <span className="chip chip--accent chip--small" title="Концентрация" onClick={(event) => { event.stopPropagation(); onClearConcentration(participant.id) }}>
              🔮 {participant.concentration.name}{participant.concentration.rounds !== null ? ` · ${participant.concentration.rounds}р` : ''} ×
            </span>
          )}
          {participant.conditions.map((condition, conditionIndex) => (
            <span key={`${participant.id}-card-condition-${conditionIndex}`} className="chip chip--warn chip--small" onClick={(event) => { event.stopPropagation(); onRemoveCondition(participant.id, conditionIndex) }}>
              {condition.name}{condition.rounds !== null ? ` · ${condition.rounds}р` : ''} ×
            </span>
          ))}
          {participant.effects.map((effect, effectIndex) => (
            <span key={`${participant.id}-card-effect-${effectIndex}`} className="chip chip--small" onClick={(event) => { event.stopPropagation(); onRemoveEffect(participant.id, effectIndex) }}>
              {effect.name}{effect.rounds !== null ? ` · ${effect.rounds}р` : ''} ×
            </span>
          ))}
        </div>
      )}
      <div className="combat-card__basic">
        {participant.kind === 'character' && participant.weaponOptions && participant.weaponOptions.length > 0 && (
          <select value={participant.selectedWeaponKey ?? ''} onClick={(event) => event.stopPropagation()} onChange={(event) => onWeaponSelect(participant, event.target.value)}>
            <option value="">Оружие: без выбора</option>
            {participant.weaponOptions.map((weapon) => <option key={`${participant.id}-${weapon.key}`} value={weapon.key}>{weapon.name}</option>)}
          </select>
        )}
        <input value={participant.attackBonus ?? ''} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate(participant.id, { attackBonus: event.target.value ? Number(event.target.value) : null })} placeholder="бонус атаки" />
        <input value={participant.damageExpr} onClick={(event) => event.stopPropagation()} onChange={(event) => onUpdate(participant.id, { damageExpr: event.target.value })} placeholder="урон" />
        <button className="button button--ghost" onClick={(event) => { event.stopPropagation(); onAttack(participant, { name: 'Базовая атака', text: '', attackBonus: participant.attackBonus, damageExpr: participant.damageExpr, saveDc: null, saveAbility: '' }) }}>Атака</button>
      </div>
      {participant.actions && participant.actions.length > 0 && (
        <div className="combat-card__actions">
          {participant.actions.map((action, actionIndex) => (
            <button key={`${participant.id}-card-action-${actionIndex}`} className="chip" onClick={(event) => { event.stopPropagation(); onAttack(participant, action) }} title={stripHtml(action.text || '')}>{action.name}</button>
          ))}
        </div>
      )}
      {impactFlash?.id === participant.id && impactFlash.value != null && <div className="combat-card__impact">-{impactFlash.value}</div>}
      <div className="combat-card__resize combat-card__resize--e" onPointerDown={(event) => startResize('e', event)} />
      <div className="combat-card__resize combat-card__resize--s" onPointerDown={(event) => startResize('s', event)} />
      <div className="combat-card__resize combat-card__resize--se" onPointerDown={(event) => startResize('se', event)} />
    </div>
  )
}
