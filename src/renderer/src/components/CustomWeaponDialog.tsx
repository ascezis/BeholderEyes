export type CustomWeaponDraft = {
  name: string
  kind: string
  attackBonus: string
  damage: string
  damageType: string
  rangeText: string
  notes: string
}

type Props = {
  draft: CustomWeaponDraft
  error: string | null
  editing: boolean
  saving: boolean
  campaignAvailable: boolean
  onClose: () => void
  onChange: (key: keyof CustomWeaponDraft, value: string) => void
  onSave: () => void
  onReset: () => void
}

const weaponKinds = [
  'Простое рукопашное',
  'Простое дальнобойное',
  'Воинское рукопашное',
  'Воинское дальнобойное',
  'Импровизированное'
]

const damageTypes = [
  'Дробящий', 'Колющий', 'Рубящий', 'Огонь', 'Холод', 'Кислота',
  'Электричество', 'Яд', 'Психический', 'Силовой', 'Некротический',
  'Излучение', 'Звук'
]

export default function CustomWeaponDialog(props: Props): JSX.Element {
  return (
    <div
      className="modal"
      onClick={(event) => {
        if (event.target === event.currentTarget) props.onClose()
      }}
    >
      <div className="modal__card" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h3>{props.editing ? 'Редактирование кастомного оружия' : 'Создание кастомного оружия'}</h3>
          <button className="modal__close" onClick={props.onClose}>X</button>
        </div>
        <div className="modal__content">
          <div className="form custom-monster-grid custom-weapon-grid">
            <input value={props.draft.name} onChange={(event) => props.onChange('name', event.target.value)} placeholder="Название оружия" />
            <select value={props.draft.kind} onChange={(event) => props.onChange('kind', event.target.value)}>
              <option value="">Тип оружия</option>
              {weaponKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
            <input value={props.draft.attackBonus} onChange={(event) => props.onChange('attackBonus', event.target.value)} placeholder="Бонус атаки (например, 7)" />
            <input className="custom-weapon-damage" value={props.draft.damage} onChange={(event) => props.onChange('damage', event.target.value)} placeholder="Кость урона (например, 1d8+4)" />
            <select value={props.draft.damageType} onChange={(event) => props.onChange('damageType', event.target.value)}>
              <option value="">Тип урона</option>
              {damageTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input value={props.draft.rangeText} onChange={(event) => props.onChange('rangeText', event.target.value)} placeholder="Дальность/досягаемость" />
            <textarea value={props.draft.notes} onChange={(event) => props.onChange('notes', event.target.value)} placeholder="Заметки" rows={3} />
          </div>
          {props.error && <div className="error">{props.error}</div>}
          <div className="form">
            <button className="button" onClick={props.onSave} disabled={props.saving || !props.campaignAvailable}>
              {props.editing ? 'Сохранить изменения' : 'Создать оружие'}
            </button>
            <button className="button button--ghost" onClick={props.onReset} disabled={props.saving}>Очистить форму</button>
          </div>
        </div>
      </div>
    </div>
  )
}
