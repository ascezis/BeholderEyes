# Beholder Eye's

Desktop-приложение для мастера D&D 5e: кампании, персонажи, справочник и боевой трекер. Интерфейс построен на Electron, React и TypeScript; локальные данные хранятся в SQLite.

## Требования

- Node.js 20+
- npm

## Установка и запуск

```powershell
npm install
npm.cmd run dev
```

В PowerShell используется `npm.cmd`, поскольку локальная execution policy Windows может блокировать `npm.ps1`.

## Проверка и сборка

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run build:player-form
```

Результаты сборки создаются в `dist/` и не хранятся в Git.

## Структура

- `src/main` — Electron main process, SQLite и IPC.
- `src/preload` — безопасный API renderer-процесса.
- `src/renderer` — React-интерфейс приложения и форма игрока.
- `assets` — исходные справочники игровых сущностей.
- `data` — неизменяемая seed-база SQLite и подготовленные TTG-данные.
- `scripts` — импорт и нормализация справочных данных.

Рабочая база с кампаниями и персонажами хранится в каталоге Electron `userData`, а не внутри репозитория. При первом запуске seed-база копируется туда автоматически.

## Форма игрока

Отдельная web-сборка создаётся командой:

```powershell
npm.cmd run build:player-form
```

Подробности публикации находятся в `PLAYER_FORM_DEPLOY.md`.
