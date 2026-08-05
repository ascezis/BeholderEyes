import type { ReferenceModal } from '../appSupport'
import { getRuleSectionBucket, renderSectionContent } from '../appSupport'

type ReferenceModalDialogProps = {
  modal: ReferenceModal
  pinnedRuleSlugs: string[]
  onClose: () => void
  onToggleRulePin: (slug: string) => void
}

export default function ReferenceModalDialog({
  modal,
  pinnedRuleSlugs,
  onClose,
  onToggleRulePin
}: ReferenceModalDialogProps): JSX.Element {
  const pinned = Boolean(modal.slug && pinnedRuleSlugs.includes(modal.slug))

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__card" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h3>{modal.title}</h3>
          <div className="modal__actions">
            {modal.kind === 'ttg_rule' && modal.slug && (
              <button
                type="button"
                className={`modal__pin${pinned ? ' modal__pin--active' : ''}`}
                onClick={() => onToggleRulePin(modal.slug!)}
                title="Закрепить правило"
              >
                {pinned ? '★' : '☆'}
              </button>
            )}
            <button className="modal__close" onClick={onClose}>X</button>
          </div>
        </div>
        {modal.subtitle && <div className="modal__tag">{modal.subtitle}</div>}
        <div className="modal__content">
          {modal.columns && modal.columns.length > 0 && (
            <div className="detail__grid">
              {modal.columns.map((column) => (
                <div key={column.label}>
                  <div className="detail__label">{column.label}</div>
                  <div>{column.value || '—'}</div>
                </div>
              ))}
            </div>
          )}
          {modal.text && (
            <div>
              <div className="detail__label">Описание</div>
              <div className="detail__text">{renderSectionContent('Описание', modal.text)}</div>
            </div>
          )}
          {modal.sections && modal.sections.length > 0 && (
            <div>
              {modal.kind === 'ttg_rule' && (
                <div className="chips modal-anchors">
                  {(['base', 'mechanic', 'exception'] as const).map((bucket) => {
                    const index = modal.sections?.findIndex(
                      (section) => getRuleSectionBucket(section.title) === bucket
                    )
                    if (index === undefined || index < 0) return null
                    const label = bucket === 'base' ? 'Базово' : bucket === 'mechanic' ? 'Механика' : 'Исключения'
                    return (
                      <button
                        key={bucket}
                        type="button"
                        className="chip"
                        onClick={() => document.getElementById(`rule-section-${index}`)?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start'
                        })}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="detail__label">Структура</div>
              <div className="reference-sections">
                {modal.sections.map((section, index) => (
                  <details
                    key={`${section.title}-${index}`}
                    id={modal.kind === 'ttg_rule' ? `rule-section-${index}` : undefined}
                    className="statblock-section"
                    open={index < 2}
                  >
                    <summary>{section.title}</summary>
                    <div className="detail__text">{renderSectionContent(section.title, section.content)}</div>
                  </details>
                ))}
              </div>
            </div>
          )}
          {modal.related && modal.related.length > 0 && (
            <div>
              <div className="detail__label">Подклассы / подрасы</div>
              <div className="detail__entries">
                {modal.related.map((related, index) => (
                  <details key={`${related.title}-${index}`} className="statblock-section">
                    <summary>{related.title}</summary>
                    {related.subtitle && <div className="detail__label">{related.subtitle}</div>}
                    <div className="detail__text">
                      {related.text ? renderSectionContent(related.title, related.text) : 'Описание отсутствует'}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
