import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import PlayerForm from './PlayerForm'
import '@mantine/core/styles.css'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider
      defaultColorScheme="dark"
      theme={{
        fontFamily: '"Rubik", "Segoe UI", sans-serif',
        headings: { fontFamily: '"Rubik", "Segoe UI", sans-serif' },
        primaryColor: 'blue'
      }}
    >
      <PlayerForm />
    </MantineProvider>
  </React.StrictMode>
)

