import { useState } from 'react'
import type { CombatParticipant } from '../appSupport'
import { conditionPresets, effectPresets } from '../appSupport'

type CombatAction = NonNullable<CombatParticipant['actions']>[number]

type Props = {
  participant?: CombatParticipant | null
  onNextTurn: () => void
  onDamage: (participant: CombatParticipant, amount: number) => void
  onHeal: (participant: CombatParticipant, amount: number) => void
  onDamageAll: (amount: number) => void
  onHealAll: (amount: number) => void
  onAddCondition: (id: string, name: string, rounds: number | null) => void
  onAddEffect: (id: string, name: string, rounds: number | null) => void
  onSetConcentration: (id: string, name: string, rounds: number | null) => void
  onClearConcentration: (id: string) => void
  onRemoveCondition: (id: string, index: number) => void
  onRemoveEffect: (id: string, index: number) => void
  onPerformAction: (participant: CombatParticipant, action: CombatAction) => void
  onRollSave: (participant: CombatParticipant, action: CombatAction) => void
}

const parseRounds = (value: string): number | null => {
  if (!value) return null
  const rounds = Number(value)
  return Number.isNaN(rounds) ? null : rounds
}

export default function CombatTurnControls({
  participant,
  onNextTurn,
  onDamage,
  onHeal,
  onDamageAll,
  onHealAll,
  onAddCondition,
  onAddEffect,
  onSetConcentration,
  onClearConcentration,
  onRemoveCondition,
  onRemoveEffect,
  onPerformAction,
  onRollSave
}: Props): JSX.Element {
  const [damageValue, setDamageValue] = useState('')
  const [massValue, setMassValue] = useState('')
  const [effectName, setEffectName] = useState('')
  const [effectRounds, setEffectRounds] = useState('')
  const [conditionName, setConditionName] = useState('')
  const [conditionRounds, setConditionRounds] = useState('')
  const [concentrationName, setConcentrationName] = useState('')
  const [concentrationRounds, setConcentrationRounds] = useState('')

  const addEffect = (): void => {
    if (!participant) return
    const name = effectName.trim()
    if (!name) return
    onAddEffect(participant.id, name, parseRounds(effectRounds))
    setEffectName('')
    setEffectRounds('')
  }

  const addCondition = (): void => {
    if (!participant) return
    const name = conditionName.trim()
    if (!name) return
    onAddCondition(participant.id, name, parseRounds(conditionRounds))
    setConditionName('')
    setConditionRounds('')
  }

  const setConcentration = (): void => {
    if (!participant) return
    const name = concentrationName.trim()
    if (!name) return
    onSetConcentration(participant.id, name, parseRounds(concentrationRounds))
    setConcentrationName('')
    setConcentrationRounds('')
  }

  return (
    <>
      <div className="combat-turn">
        <div className="combat-turn__label">Сейчас ход</div>
        <div className="combat-turn__name">{participant?.name}</div>
        <div className="combat-turn__meta">
          инициатива: {participant?.initiative ?? '—'} · хп: {participant?.hpCurrent ?? '—'}/{participant?.hpMax ?? '—'} · кд: {participant?.ac ?? '—'}
        </div>
      </div>
      <button className="button" onClick={onNextTurn}>Следующий ход</button>
      <div className="detail__text">
        Совет: чтобы навесить состояние/эффект не на того, чей сейчас ход, а на любого другого участника — дважды кликни по его карточке.
      </div>
      {participant && (
        <div className="combat-actions">
          <div className="detail__label">Быстрые действия</div>
          <div className="combat-actions__row">
            <input value={damageValue} onChange={(event) => setDamageValue(event.target.value)} placeholder="Значение (например 8)" />
            <button className="button button--ghost" onClick={() => onDamage(participant, Number(damageValue || 0))}>Урон</button>
            <button className="button button--ghost" onClick={() => onHeal(participant, Number(damageValue || 0))}>Лечение</button>
          </div>

          <div className="detail__label">Эффекты</div>
          <div className="combat-actions__row">
            <input value={effectName} onChange={(event) => setEffectName(event.target.value)} placeholder="Название эффекта" />
            <input value={effectRounds} onChange={(event) => setEffectRounds(event.target.value)} placeholder="Раунды" />
            <button className="button button--ghost" onClick={addEffect}>Добавить</button>
          </div>
          <div className="chips">
            {effectPresets.map((preset) => <button key={preset} className="chip" onClick={() => onAddEffect(participant.id, preset, null)}>{preset}</button>)}
          </div>

          <div className="detail__label">Состояния</div>
          <div className="combat-actions__row">
            <input value={conditionName} onChange={(event) => setConditionName(event.target.value)} placeholder="Название состояния" />
            <input value={conditionRounds} onChange={(event) => setConditionRounds(event.target.value)} placeholder="Раунды" />
            <button className="button button--ghost" onClick={addCondition}>Добавить</button>
          </div>
          <div className="chips">
            {conditionPresets.map((preset) => <button key={preset} className="chip chip--warn" onClick={() => onAddCondition(participant.id, preset, null)}>{preset}</button>)}
          </div>

          <div className="detail__label">Концентрация</div>
          <div className="combat-actions__row">
            <input value={concentrationName} onChange={(event) => setConcentrationName(event.target.value)} placeholder="Заклинание/эффект" />
            <input value={concentrationRounds} onChange={(event) => setConcentrationRounds(event.target.value)} placeholder="Раунды" />
            <button className="button button--ghost" onClick={setConcentration}>Установить</button>
          </div>

          <div className="detail__label">Массовые действия</div>
          <div className="combat-actions__row">
            <input value={massValue} onChange={(event) => setMassValue(event.target.value)} placeholder="Значение (например 5)" />
            <button className="button button--ghost" onClick={() => onDamageAll(Number(massValue || 0))}>Урон всем</button>
            <button className="button button--ghost" onClick={() => onHealAll(Number(massValue || 0))}>Лечение всем</button>
          </div>

          <div className="chips">
            {participant.concentration && (
              <div className="chip chip--accent">
                <span>Конц.: {participant.concentration.name}{participant.concentration.rounds !== null ? ` · ${participant.concentration.rounds}р` : ''}</span>
                <button onClick={() => onClearConcentration(participant.id)}>×</button>
              </div>
            )}
            {participant.conditions.map((condition, index) => (
              <div key={`${condition.name}-${index}`} className="chip chip--warn">
                <span>{condition.name}{condition.rounds !== null ? ` · ${condition.rounds}р` : ''}</span>
                <button onClick={() => onRemoveCondition(participant.id, index)}>×</button>
              </div>
            ))}
            {participant.effects.map((effect, index) => (
              <div key={`${effect.name}-${index}`} className="chip">
                <span>{effect.name}{effect.rounds !== null ? ` · ${effect.rounds}р` : ''}</span>
                <button onClick={() => onRemoveEffect(participant.id, index)}>×</button>
              </div>
            ))}
            {participant.effects.length === 0 && participant.conditions.length === 0 && !participant.concentration && <div className="empty">Нет эффектов</div>}
          </div>

          {participant.actions && participant.actions.length > 0 && (
            <>
              <div className="detail__label">Быстрые действия</div>
              <div className="combat-actions__quicklist">
                {participant.actions.map((action, index) => (
                  <div key={`${action.name}-${index}`} className="combat-buttons">
                    <button className="button button--ghost combat-action-button" onClick={() => onPerformAction(participant, action)}>{action.name}</button>
                    <button className="button button--ghost combat-action-button" onClick={() => onRollSave(participant, action)}>СЛ</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
