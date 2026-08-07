import type { CombatParticipant } from '../appSupport'
import { abilityKeys, abilityLabels, stripHtml } from '../appSupport'

type AbilityKey = (typeof abilityKeys)[number]
type CombatAction = NonNullable<CombatParticipant['actions']>[number]

type Props = {
  participant: CombatParticipant
  active: boolean
  onUpdate: (id: string, patch: Partial<CombatParticipant>) => void
  onWeaponSelect: (participant: CombatParticipant, weaponKey: string) => void
  onRollInitiative: (participant: CombatParticipant) => void
  onRollAttack: (participant: CombatParticipant) => void
  onRollDamage: (participant: CombatParticipant) => void
  onRollSave: (participant: CombatParticipant, ability: AbilityKey) => void
  onPerformAction: (participant: CombatParticipant, action: CombatAction) => void
  onRollActionSave: (participant: CombatParticipant, action: CombatAction) => void
  onDamage: (participant: CombatParticipant, amount: number) => void
  onHeal: (participant: CombatParticipant, amount: number) => void
  onRemove: (id: string) => void
}

const optionalNumber = (value: string): number | null => {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function CombatParticipantRow({ participant, active, ...actions }: Props): JSX.Element {
  const down = participant.hpCurrent !== null && participant.hpCurrent <= 0
  const update = (patch: Partial<CombatParticipant>) => actions.onUpdate(participant.id, patch)

  return (
    <details className={['combat-row', active ? 'combat-row--active' : '', down ? 'combat-row--down' : ''].filter(Boolean).join(' ')}>
      <summary className="combat-row__summary">
        <div className="combat-row__title">
          <strong>{participant.name}</strong>
          <span className="list__subtitle">{participant.kind === 'character' ? 'персонаж' : 'монстр'}</span>
          {active && <span className="combat-turn-crown" title="Сейчас ход">♛</span>}
          {down && <span className="combat-down-badge">💀 Без сознания</span>}
        </div>
        <div className="combat-row__stats">
          <span>Иниц: {participant.initiative ?? '—'}</span>
          <span>ХП: {participant.hpCurrent ?? '—'}/{participant.hpMax ?? '—'}</span>
          <span>КД: {participant.ac ?? '—'}</span>
        </div>
        <div className="combat-row__quick">
          <button className="chip" title="Бросить инициативу" aria-label={`Бросить инициативу: ${participant.name}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); actions.onRollInitiative(participant) }}>🎲</button>
          <button className="chip chip--warn" onClick={(event) => { event.preventDefault(); event.stopPropagation(); actions.onDamage(participant, 5) }}>-5</button>
          <button className="chip" onClick={(event) => { event.preventDefault(); event.stopPropagation(); actions.onHeal(participant, 5) }}>+5</button>
          <button className="chip" onClick={(event) => { event.preventDefault(); event.stopPropagation(); actions.onRemove(participant.id) }}>×</button>
        </div>
      </summary>
      <div className="combat-grid">
        <input
          value={participant.name}
          onChange={(event) => update({ name: event.target.value })}
          onBlur={(event) => {
            const name = event.target.value.trim()
            update({ name: name || (participant.kind === 'character' ? 'Персонаж' : 'Монстр') })
          }}
          placeholder="Имя в бою"
        />
        <input value={participant.hpCurrent ?? ''} onChange={(event) => update({ hpCurrent: optionalNumber(event.target.value) })} placeholder="ХП" />
        <input value={participant.hpMax ?? ''} onChange={(event) => update({ hpMax: optionalNumber(event.target.value) })} placeholder="ХП макс" />
        <input value={participant.ac ?? ''} onChange={(event) => update({ ac: optionalNumber(event.target.value) })} placeholder="КД" />
        <input value={participant.initiative ?? ''} onChange={(event) => update({ initiative: optionalNumber(event.target.value) })} placeholder="Иниц" />
        {participant.kind === 'character' && participant.weaponOptions && participant.weaponOptions.length > 0 && (
          <select value={participant.selectedWeaponKey ?? ''} onChange={(event) => actions.onWeaponSelect(participant, event.target.value)}>
            <option value="">Оружие: без выбора</option>
            {participant.weaponOptions.map((weapon) => <option key={`${participant.id}-row-${weapon.key}`} value={weapon.key}>{weapon.name}</option>)}
          </select>
        )}
        <input value={participant.attackBonus ?? ''} onChange={(event) => update({ attackBonus: optionalNumber(event.target.value) })} placeholder="Бонус" />
        <input value={participant.damageExpr} onChange={(event) => update({ damageExpr: event.target.value })} placeholder="Урон" />
        <div className="combat-buttons">
          <button className="button button--ghost" onClick={() => actions.onRollInitiative(participant)}>Инициатива</button>
          <button className="button button--ghost" onClick={() => actions.onRollAttack(participant)}>Атака</button>
          <button className="button button--ghost" onClick={() => actions.onRollDamage(participant)}>Урон</button>
          <button className="button button--ghost" onClick={() => actions.onRemove(participant.id)}>Удалить</button>
        </div>
      </div>
      <div className="combat-saves">
        {abilityKeys.map((key) => (
          <div key={`${participant.id}-${key}`} className="combat-save">
            <span>{abilityLabels[key]}</span>
            <input value={participant.saves[key] ?? ''} onChange={(event) => update({ saves: { ...participant.saves, [key]: optionalNumber(event.target.value) } })} placeholder="мод" />
            <button className="button button--ghost" onClick={() => actions.onRollSave(participant, key)}>d20</button>
          </div>
        ))}
      </div>
      {participant.actions && participant.actions.length > 0 && (
        <div className="combat-actions__list">
          <div className="detail__label">Действия монстра</div>
          {participant.actions.map((action, index) => (
            <div key={`${participant.id}-action-${index}`} className="combat-action-card">
              <div className="combat-action-card__name">{action.name}</div>
              {action.text && <div className="combat-action-card__text">{stripHtml(action.text)}</div>}
              <div className="combat-buttons">
                <button className="button button--ghost" onClick={() => actions.onPerformAction(participant, action)}>Атака: {action.name}</button>
                <button className="button button--ghost" onClick={() => actions.onRollActionSave(participant, action)}>Спасбросок цели</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </details>
  )
}
