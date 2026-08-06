import type { Campaign, ViewKey } from '../appSupport'

type HomeViewProps = {
  campaign: Campaign | null
  onChangeView: (view: ViewKey) => void
}

export default function HomeView({ campaign, onChangeView }: HomeViewProps): JSX.Element {
  return (
    <section className="panel panel--hero home">
      <div>
        <h2>Главный экран мастера</h2>
        <p>Базовый поток: кампания → участники → боевой стол.</p>
      </div>
      <div className="home__actions">
        <button className="button" onClick={() => onChangeView('campaign')}>Кампания</button>
        <button className="button" onClick={() => window.beholder.combatBoard.open()}>Боевой стол</button>
        <button className="button button--ghost" onClick={() => onChangeView('reference')}>Справочник</button>
        <button
          className="button button--ghost"
          onClick={() => window.open(`${window.location.origin}${window.location.pathname}?mode=player-form`, '_blank')}
        >
          Форма игрока (web)
        </button>
      </div>
      <div className="home__status">
        {campaign ? (
          <>Активная кампания: <strong>{campaign.name}</strong></>
        ) : (
          <>Нет активной кампании — открой вкладку <strong>Кампания</strong> и создай её.</>
        )}
      </div>
    </section>
  )
}
