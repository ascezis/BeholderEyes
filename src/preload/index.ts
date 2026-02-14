import { contextBridge, ipcRenderer } from 'electron'

type ListParams = {
  query?: string
  limit?: number
  offset?: number
}

type ListResponse<T> = {
  total: number
  items: T[]
}

contextBridge.exposeInMainWorld('beholder', {
  version: '0.1.0',
  campaign: {
    get: (): Promise<{ id: number; name: string } | null> => ipcRenderer.invoke('campaign:get'),
    create: (name: string): Promise<{ id: number }> => ipcRenderer.invoke('campaign:create', name),
    update: (payload: { id: number; name: string }): Promise<{ ok: true }> =>
      ipcRenderer.invoke('campaign:update', payload),
    delete: (id: number): Promise<{ ok: true }> => ipcRenderer.invoke('campaign:delete', id)
  },
  characters: {
    list: (campaignId: number): Promise<any[]> =>
      ipcRenderer.invoke('characters:list', campaignId),
    get: (id: number): Promise<any | null> => ipcRenderer.invoke('characters:get', id),
    create: (payload: {
      campaignId: number
      name: string
      race?: string
      class?: string
      level?: number
    }): Promise<{ id: number }> => ipcRenderer.invoke('characters:create', payload),
    updateData: (payload: { id: number; data: unknown }): Promise<{ ok: true }> =>
      ipcRenderer.invoke('characters:updateData', payload),
    updateBase: (payload: {
      id: number
      name: string
      race?: string
      class?: string
      level?: number
    }): Promise<{ ok: true }> => ipcRenderer.invoke('characters:updateBase', payload)
    ,
    import: (campaignId: number): Promise<
      | { canceled: true }
      | { canceled: false; id?: number; name?: string; error?: string }
    > => ipcRenderer.invoke('characters:import', campaignId),
    export: (id: number): Promise<{ ok: boolean; canceled?: boolean }> =>
      ipcRenderer.invoke('characters:export', id),
    delete: (id: number): Promise<{ ok: true }> => ipcRenderer.invoke('characters:delete', id)
  },
  combats: {
    list: (campaignId: number): Promise<Array<{ id: number; name: string; updated_at: string }>> =>
      ipcRenderer.invoke('combats:list', campaignId),
    save: (payload: {
      campaignId: number
      name: string
      data: unknown
      combatId?: number
    }): Promise<{ id: number }> => ipcRenderer.invoke('combats:save', payload),
    get: (id: number): Promise<{ id: number; name: string; data: unknown } | null> =>
      ipcRenderer.invoke('combats:get', id),
    delete: (id: number): Promise<{ ok: true }> => ipcRenderer.invoke('combats:delete', id),
    export: (id: number): Promise<{ ok: boolean; canceled?: boolean; error?: string }> =>
      ipcRenderer.invoke('combats:export', id),
    import: (campaignId: number): Promise<{ ok: boolean; canceled?: boolean; id?: number; error?: string }> =>
      ipcRenderer.invoke('combats:import', campaignId)
  },
  monsters: {
    list: (params?: ListParams): Promise<ListResponse<unknown>> =>
      ipcRenderer.invoke('monsters:list', params),
    get: (id: number): Promise<unknown> => ipcRenderer.invoke('monsters:get', id)
  },
  customMonsters: {
    list: (payload: {
      campaignId: number
      query?: string
      limit?: number
      offset?: number
    }): Promise<ListResponse<unknown>> => ipcRenderer.invoke('customMonsters:list', payload),
    get: (id: number): Promise<unknown> => ipcRenderer.invoke('customMonsters:get', id),
    create: (payload: {
      campaignId: number
      name: string
      cr?: string | null
      data: unknown
    }): Promise<{ id: number }> => ipcRenderer.invoke('customMonsters:create', payload),
    update: (payload: {
      id: number
      name: string
      cr?: string | null
      data: unknown
    }): Promise<{ ok: true }> => ipcRenderer.invoke('customMonsters:update', payload),
    delete: (id: number): Promise<{ ok: true }> => ipcRenderer.invoke('customMonsters:delete', id)
  },
  spells: {
    list: (params?: ListParams): Promise<ListResponse<unknown>> =>
      ipcRenderer.invoke('spells:list', params),
    get: (id: number): Promise<unknown> => ipcRenderer.invoke('spells:get', id)
  },
  items: {
    list: (params?: ListParams): Promise<ListResponse<unknown>> =>
      ipcRenderer.invoke('items:list', params),
    get: (id: number): Promise<unknown> => ipcRenderer.invoke('items:get', id)
  },
  weapons: {
    list: (params?: ListParams): Promise<ListResponse<unknown>> =>
      ipcRenderer.invoke('weapons:list', params),
    get: (id: number): Promise<unknown> => ipcRenderer.invoke('weapons:get', id)
  },
  artifacts: {
    list: (params?: ListParams): Promise<ListResponse<unknown>> =>
      ipcRenderer.invoke('artifacts:list', params),
    get: (id: number): Promise<unknown> => ipcRenderer.invoke('artifacts:get', id)
  },
  customWeapons: {
    list: (payload: {
      campaignId: number
      query?: string
      limit?: number
      offset?: number
    }): Promise<ListResponse<unknown>> => ipcRenderer.invoke('customWeapons:list', payload),
    get: (id: number): Promise<unknown> => ipcRenderer.invoke('customWeapons:get', id),
    create: (payload: {
      campaignId: number
      name: string
      kind?: string | null
      attackBonus?: number | null
      damage?: string | null
      damageType?: string | null
      rangeText?: string | null
      notes?: string | null
      data?: unknown
    }): Promise<{ id: number }> => ipcRenderer.invoke('customWeapons:create', payload),
    update: (payload: {
      id: number
      name: string
      kind?: string | null
      attackBonus?: number | null
      damage?: string | null
      damageType?: string | null
      rangeText?: string | null
      notes?: string | null
      data?: unknown
    }): Promise<{ ok: true }> => ipcRenderer.invoke('customWeapons:update', payload),
    delete: (id: number): Promise<{ ok: true }> => ipcRenderer.invoke('customWeapons:delete', id)
  },
  ttg: {
    getAll: (): Promise<{ summary: unknown; classes: unknown[]; races: unknown[]; rules: unknown[] }> =>
      ipcRenderer.invoke('ttg:getAll')
  },
  combatBoard: {
    open: (): Promise<{ ok: true }> => ipcRenderer.invoke('combatBoard:open')
  },
  referenceWindow: {
    open: (): Promise<{ ok: true }> => ipcRenderer.invoke('referenceWindow:open')
  },
  combatPanel: {
    open: (): Promise<{ ok: true }> => ipcRenderer.invoke('combatPanel:open')
  }
})


