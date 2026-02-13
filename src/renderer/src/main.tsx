import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import PlayerForm from './PlayerForm'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './styles.css'

const queryClient = new QueryClient()
const search = new URLSearchParams(window.location.search)
const isPlayerForm = search.get('mode') === 'player-form'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        defaultColorScheme="light"
        theme={{
          fontFamily: '"Rubik", "Segoe UI", sans-serif',
          headings: { fontFamily: '"Rubik", "Segoe UI", sans-serif' },
          primaryColor: 'brown',
          colors: {
            brown: [
              '#f7efe6',
              '#ead8c6',
              '#dcbfa6',
              '#cda584',
              '#be8b63',
              '#a76f4a',
              '#865639',
              '#654027',
              '#472a18',
              '#2c150b'
            ]
          }
        }}
      >
        <Notifications position="top-right" />
        {isPlayerForm ? <PlayerForm /> : <App />}
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
