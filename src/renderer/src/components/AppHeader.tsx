import { SegmentedControl } from '@mantine/core'
import type { ThemeMode, ViewKey } from '../appSupport'

type AppHeaderProps = {
  activeView: ViewKey
  themeMode: ThemeMode
  combatBoardMode: boolean
  combatPanelMode: boolean
  referenceWindowMode: boolean
  onChangeView: (view: ViewKey) => void
  onToggleTheme: () => void
}

export default function AppHeader({
  activeView,
  themeMode,
  combatBoardMode,
  combatPanelMode,
  referenceWindowMode,
  onChangeView,
  onToggleTheme
}: AppHeaderProps): JSX.Element {
  const detachedMode = combatBoardMode || combatPanelMode || referenceWindowMode
  const subtitle = combatBoardMode
    ? 'Боевой стол'
    : combatPanelMode
      ? 'Панель боя'
      : referenceWindowMode
        ? 'Справочник'
        : 'Мастерский трекер D&D 5e'
  const modifier = combatBoardMode
    ? ' app__header--board'
    : combatPanelMode
      ? ' app__header--combat-panel'
      : referenceWindowMode
        ? ' app__header--reference'
        : ''

  return (
    <header className={`app__header${modifier}`}>
      <div className="brand">
        <div className="brand__mark">BE</div>
        <div>
          <div className="brand__title">Beholder Eye's</div>
          <div className="brand__subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="nav">
        <button className="button button--ghost" onClick={onToggleTheme}>
          Тема: {themeMode === 'dark' ? 'Тёмная' : 'Светлая'}
        </button>
        {!detachedMode && (
          <SegmentedControl
            value={activeView}
            onChange={(value) => onChangeView(value as ViewKey)}
            data={[
              { label: 'Главная', value: 'home' },
              { label: 'Кампания', value: 'campaign' },
              { label: 'Бой', value: 'combat' },
              { label: 'Справочник', value: 'reference' }
            ]}
          />
        )}
        {!detachedMode && (
          <button className="button button--ghost" onClick={() => window.beholder.referenceWindow.open()}>
            Окно справочника
          </button>
        )}
        {(!detachedMode || combatBoardMode) && (
          <button className="button button--ghost" onClick={() => window.beholder.combatPanel.open()}>
            {combatBoardMode ? 'Окно панели' : 'Панель боя'}
          </button>
        )}
        {detachedMode && (
          <button className="button" onClick={() => window.close()}>
            Закрыть окно
          </button>
        )}
      </div>
    </header>
  )
}
