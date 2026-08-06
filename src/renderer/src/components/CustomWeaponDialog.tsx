export type CustomWeaponDraft = {
  name: string; kind: string; attackBonus: string; damage: string
  damageType: string; rangeText: string; notes: string
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

const fields: Array<[keyof CustomWeaponDraft, string]> = [
  ['name', 'Название оружия'], ['kind', 'Тип (меч, лук, посох...)'],
  ['attackBonus', 'Бонус атаки (например, 7)'], ['damage', 'Кость урона (например, 1d8+4)'],
  ['damageType', 'Тип урона'], ['rangeText', 'Дальность/досягаемость']
]

export default function CustomWeaponDialog(props: Props): JSX.Element {
  return (
    <div className="modal" onClick={props.onClose}>
      <div className="modal__card" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h3>{props.editing ? 'Редактирование кастомного оружия' : 'Создание кастомного оружия'}</h3>
          <button className="modal__close" onClick={props.onClose}>X</button>
        </div>
        <div className="modal__content">
          <div className="form custom-monster-grid">
            {fields.map(([key, placeholder]) => <input key={key} value={props.draft[key]} onChange={(event) => props.onChange(key, event.target.value)} placeholder={placeholder} />)}
            <textarea value={props.draft.notes} onChange={(event) => props.onChange('notes', event.target.value)} placeholder="Заметки" rows={3} />
          </div>
          {props.error && <div className="error">{props.error}</div>}
          <div className="form">
            <button className="button" onClick={props.onSave} disabled={props.saving || !props.campaignAvailable}>{props.editing ? 'Сохранить изменения' : 'Создать оружие'}</button>
            <button className="button button--ghost" onClick={props.onReset} disabled={props.saving}>Очистить форму</button>
          </div>
        </div>
      </div>
    </div>
  )
}
