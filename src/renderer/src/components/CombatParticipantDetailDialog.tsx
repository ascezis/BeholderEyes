import { useState } from 'react'
import type { CombatParticipant } from '../appSupport'
import { conditionPresets, effectPresets, normalizeActionText } from '../appSupport'

type CombatAction = NonNullable<CombatParticipant['actions']>[number]

type Props = {
  participant: CombatParticipant
  targetName?: string
  onClose: () => void
  onAddCondition: (id: string, name: string, rounds: number | null) => void
  onAddEffect: (id: string, name: string, rounds: number | null) => void
  onSetConcentration: (id: string, name: string, rounds: number | null) => void
  onClearConcentration: (id: string) => void
  onRemoveCondition: (id: string, index: number) => void
  onRemoveEffect: (id: string, index: number) => void
  onAttack: (participant: CombatParticipant, action: CombatAction) => void
  onRollSave: (participant: CombatParticipant, action: CombatAction) => void
}

const parseRounds = (value: string): number | null => {
  if (!value) return null
  const rounds = Number(value)
  return Number.isNaN(rounds) ? null : rounds
}

export default function CombatParticipantDetailDialog({
  participant,
  targetName,
  onClose,
  onAddCondition,
  onAddEffect,
  onSetConcentration,
  onClearConcentration,
  onRemoveCondition,
  onRemoveEffect,
  onAttack,
  onRollSave
}: Props): JSX.Element {
  const [conditionName, setConditionName] = useState('')
  const [conditionRounds, setConditionRounds] = useState('')
  const [effectName, setEffectName] = useState('')
  const [effectRounds, setEffectRounds] = useState('')
  const [concentrationName, setConcentrationName] = useState('')
  const [concentrationRounds, setConcentrationRounds] = useState('')

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__card modal__card--wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h3>{participant.name}</h3>
          <button className="modal__close" onClick={onClose}>X</button>
        </div>
        <div className="modal__tag">
          {participant.kind === 'character' ? 'персонаж' : 'монстр'}
        </div>
        <div className="modal__content">
          <div className="detail__grid">
            <div><div className="detail__label">ХП</div><div>{participant.hpCurrent ?? '—'} / {participant.hpMax ?? '—'}</div></div>
            <div><div className="detail__label">КД</div><div>{participant.ac ?? '—'}</div></div>
            <div><div className="detail__label">Инициатива</div><div>{participant.initiative ?? '—'}</div></div>
            <div><div className="detail__label">Цель</div><div>{targetName ?? '—'}</div></div>
          </div>

          <div className="detail__section">
            <div className="detail__label">Состояния и эффекты</div>
            <div className="chips">
              {participant.concentration && (
                <div className="chip chip--accent">
                  <span>Конц.: {participant.concentration.name}{participant.concentration.rounds !== null ? ` · ${participant.concentration.rounds}р` : ''}</span>
                  <button onClick={() => onClearConcentration(participant.id)}>×</button>
                </div>
              )}
              {participant.conditions.map((condition, index) => (
                <div key={`${participant.id}-modal-condition-${index}`} className="chip chip--warn">
                  <span>{condition.name}{condition.rounds !== null ? ` · ${condition.rounds}р` : ''}</span>
                  <button onClick={() => onRemoveCondition(participant.id, index)}>×</button>
                </div>
              ))}
              {participant.effects.map((effect, index) => (
                <div key={`${participant.id}-modal-effect-${index}`} className="chip">
                  <span>{effect.name}{effect.rounds !== null ? ` · ${effect.rounds}р` : ''}</span>
                  <button onClick={() => onRemoveEffect(participant.id, index)}>×</button>
                </div>
              ))}
              {participant.effects.length === 0 && participant.conditions.length === 0 && !participant.concentration && <div className="empty">Нет эффектов</div>}
            </div>

            <div className="combat-actions__row">
              <input value={conditionName} onChange={(event) => setConditionName(event.target.value)} placeholder="Название состояния" />
              <input value={conditionRounds} onChange={(event) => setConditionRounds(event.target.value)} placeholder="Раунды" />
              <button className="button button--ghost" onClick={() => {
                const name = conditionName.trim()
                if (!name) return
                onAddCondition(participant.id, name, parseRounds(conditionRounds))
                setConditionName('')
                setConditionRounds('')
              }}>Добавить состояние</button>
            </div>
            <div className="chips">
              {conditionPresets.map((preset) => <button key={`detail-condition-preset-${preset}`} className="chip chip--warn" onClick={() => onAddCondition(participant.id, preset, null)}>{preset}</button>)}
            </div>

            <div className="combat-actions__row">
              <input value={effectName} onChange={(event) => setEffectName(event.target.value)} placeholder="Название эффекта" />
              <input value={effectRounds} onChange={(event) => setEffectRounds(event.target.value)} placeholder="Раунды" />
              <button className="button button--ghost" onClick={() => {
                const name = effectName.trim()
                if (!name) return
                onAddEffect(participant.id, name, parseRounds(effectRounds))
                setEffectName('')
                setEffectRounds('')
              }}>Добавить эффект</button>
            </div>
            <div className="chips">
              {effectPresets.map((preset) => <button key={`detail-effect-preset-${preset}`} className="chip" onClick={() => onAddEffect(participant.id, preset, null)}>{preset}</button>)}
            </div>

            <div className="combat-actions__row">
              <input value={concentrationName} onChange={(event) => setConcentrationName(event.target.value)} placeholder="Заклинание/эффект концентрации" />
              <input value={concentrationRounds} onChange={(event) => setConcentrationRounds(event.target.value)} placeholder="Раунды" />
              <button className="button button--ghost" onClick={() => {
                const name = concentrationName.trim()
                if (!name) return
                onSetConcentration(participant.id, name, parseRounds(concentrationRounds))
                setConcentrationName('')
                setConcentrationRounds('')
              }}>Установить концентрацию</button>
            </div>
          </div>

          <div className="detail__section">
            <div className="detail__label">Действия</div>
            {participant.actions && participant.actions.length > 0 ? (
              <div className="detail__entries">
                {participant.actions.map((action, index) => (
                  <div key={`${participant.id}-detail-action-${index}`} className="detail__entry">
                    <div className="detail__entry-title">{action.name}</div>
                    {action.text && <div className="detail__text">{normalizeActionText(action.text)}</div>}
                    <div className="combat-buttons">
                      <button className="button button--ghost" onClick={() => onAttack(participant, action)}>Атака по цели</button>
                      <button className="button button--ghost" onClick={() => onRollSave(participant, action)}>Спасбросок цели</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="empty">Действий нет</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
