import type { CustomMonsterActionDraft, CustomMonsterDraft } from '../appSupport'
import { customMonsterSizeOptions } from '../appSupport'

type Props = {
  draft: CustomMonsterDraft
  actions: CustomMonsterActionDraft[]
  error: string | null
  editing: boolean
  saving: boolean
  campaignAvailable: boolean
  onClose: () => void
  onDraftChange: (key: keyof CustomMonsterDraft, value: string) => void
  onActionChange: (id: string, key: keyof Omit<CustomMonsterActionDraft, 'id'>, value: string) => void
  onAddAction: () => void
  onRemoveAction: (id: string) => void
  onSave: () => void
  onReset: () => void
}

const baseFields: Array<[keyof CustomMonsterDraft, string]> = [
  ['name', 'Имя монстра'], ['type', 'Тип (humanoid, dragon...)'], ['alignment', 'Мировоззрение'],
  ['cr', 'CR'], ['ac', 'AC'], ['hp', 'HP (например 84 (13d8+26))'], ['speed', 'Скорость']
]
const statFields: Array<[keyof CustomMonsterDraft, string]> = [
  ['str', 'СИЛ'], ['dex', 'ЛВК'], ['con', 'ТЕЛ'], ['int', 'ИНТ'], ['wis', 'МДР'], ['cha', 'ХАР']
]
const defenseFields: Array<[keyof CustomMonsterDraft, string]> = [
  ['savesText', 'Спасброски (опц.)'], ['skillsText', 'Навыки (опц.)'],
  ['vulnerabilities', 'Уязвимости через запятую'], ['resistances', 'Сопротивления через запятую'],
  ['immunities', 'Иммунитеты к урону'], ['conditionImmunities', 'Иммунитеты к состояниям'],
  ['senses', 'Чувства'], ['languages', 'Языки']
]
const textFields: Array<[keyof CustomMonsterDraft, string, number]> = [
  ['traitsText', 'Черты: Название: описание (по одной на строку)', 4],
  ['actionsText', 'Доп. действия текстом: Название: описание', 4],
  ['reactionsText', 'Реакции', 3], ['legendaryText', 'Легендарные действия', 3],
  ['lairText', 'Действия логова', 3]
]

export default function CustomMonsterDialog(props: Props): JSX.Element {
  const { draft, actions } = props
  const field = ([key, placeholder]: [keyof CustomMonsterDraft, string]) => (
    <input key={key} value={draft[key]} onChange={(event) => props.onDraftChange(key, event.target.value)} placeholder={placeholder} />
  )

  return (
    <div className="modal" onClick={props.onClose}>
      <div className="modal__card modal__card--wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h3>{props.editing ? 'Редактирование кастомного монстра' : 'Создание кастомного монстра (D&D 5e)'}</h3>
          <button className="modal__close" onClick={props.onClose}>X</button>
        </div>
        <div className="modal__content custom-monster-modal">
          <div className="custom-monster-panel">
            <div className="detail__label">Базовые данные</div>
            <div className="form custom-monster-grid">
              {field(baseFields[0])}
              <select value={draft.size} onChange={(event) => props.onDraftChange('size', event.target.value)}>
                {customMonsterSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              {baseFields.slice(1).map(field)}
            </div>
          </div>
          <div className="custom-monster-panel">
            <div className="detail__label">Характеристики и защиты</div>
            <div className="combat-grid custom-monster-stats">{statFields.map(field)}</div>
            <div className="form custom-monster-grid">{defenseFields.map(field)}</div>
          </div>
          <div className="custom-monster-panel">
            <div className="detail__label">Структурированные действия</div>
            <div className="custom-actions-list">
              {actions.map((action) => (
                <div key={action.id} className="custom-action-row">
                  <div className="form custom-monster-grid">
                    <input value={action.name} onChange={(e) => props.onActionChange(action.id, 'name', e.target.value)} placeholder="Название действия (например, Когти)" />
                    <select value={action.attackKind} onChange={(e) => props.onActionChange(action.id, 'attackKind', e.target.value)}>
                      <option value="melee">Рукопашная</option><option value="ranged">Дальнобойная</option>
                      <option value="spell">Заклинанием</option><option value="melee_or_ranged">Рукопашная/дальнобойная</option>
                    </select>
                    <input value={action.attackBonus} onChange={(e) => props.onActionChange(action.id, 'attackBonus', e.target.value)} placeholder="Бонус атаки (например, 7)" />
                    <input value={action.rangeText} onChange={(e) => props.onActionChange(action.id, 'rangeText', e.target.value)} placeholder="Досягаемость/дистанция (например, 3 клетки)" />
                    <input value={action.targetText} onChange={(e) => props.onActionChange(action.id, 'targetText', e.target.value)} placeholder="Цель (например, одна цель)" />
                    <input value={action.damageExpr} onChange={(e) => props.onActionChange(action.id, 'damageExpr', e.target.value)} placeholder="Кость урона (например, 2d6+4)" />
                    <input value={action.damageType} onChange={(e) => props.onActionChange(action.id, 'damageType', e.target.value)} placeholder="Тип урона (колющий/огонь...)" />
                    <input value={action.saveDc} onChange={(e) => props.onActionChange(action.id, 'saveDc', e.target.value)} placeholder="СЛ спасброска (например, 15)" />
                    <select value={action.saveAbility} onChange={(e) => props.onActionChange(action.id, 'saveAbility', e.target.value)}>
                      <option value="">Без спасброска</option>{['СИЛ', 'ЛВК', 'ТЕЛ', 'ИНТ', 'МДР', 'ХАР'].map((ability) => <option key={ability} value={ability}>{ability}</option>)}
                    </select>
                    <input value={action.saveFailText} onChange={(e) => props.onActionChange(action.id, 'saveFailText', e.target.value)} placeholder="Эффект при провале" />
                    <input value={action.saveSuccessText} onChange={(e) => props.onActionChange(action.id, 'saveSuccessText', e.target.value)} placeholder="Эффект при успехе" />
                    <input value={action.extraText} onChange={(e) => props.onActionChange(action.id, 'extraText', e.target.value)} placeholder="Доп. текст (эффекты/КС/условия)" />
                  </div>
                  <div className="search-result__actions"><button className="chip chip--warn" onClick={() => props.onRemoveAction(action.id)}>Удалить действие</button></div>
                </div>
              ))}
            </div>
            <div className="form"><button className="button button--ghost" onClick={props.onAddAction}>Добавить действие</button></div>
          </div>
          <div className="custom-monster-panel">
            <div className="detail__label">Текстовые секции</div>
            <div className="form custom-monster-grid">
              {textFields.map(([key, placeholder, rows]) => <textarea key={key} value={draft[key]} onChange={(event) => props.onDraftChange(key, event.target.value)} placeholder={placeholder} rows={rows} />)}
            </div>
          </div>
          {props.error && <div className="error">{props.error}</div>}
          <div className="form">
            <button className="button" onClick={props.onSave} disabled={props.saving || !props.campaignAvailable}>{props.editing ? 'Сохранить изменения' : 'Создать монстра'}</button>
            <button className="button button--ghost" onClick={props.onReset} disabled={props.saving}>Очистить форму</button>
          </div>
        </div>
      </div>
    </div>
  )
}
