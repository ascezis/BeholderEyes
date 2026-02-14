export {}

type ListParams = {
  query?: string
  limit?: number
  offset?: number
}

type ListResponse<T> = {
  total: number
  items: T[]
}

declare global {
  interface Window {
    beholder: {
      version: string
      campaign: {
        get: () => Promise<{ id: number; name: string } | null>
        create: (name: string) => Promise<{ id: number }>
        update: (payload: { id: number; name: string }) => Promise<{ ok: true }>
        delete: (id: number) => Promise<{ ok: true }>
      }
      characters: {
        list: (campaignId: number) => Promise<
          Array<{
            id: number
            name: string
            race: string | null
            class: string | null
            level: number | null
            data: unknown
          }>
        >
        get: (id: number) => Promise<{
          id: number
          name: string
          race: string | null
          class: string | null
          level: number | null
          data: unknown
        } | null>
        create: (payload: {
          campaignId: number
          name: string
          race?: string
          class?: string
          level?: number
        }) => Promise<{ id: number }>
        updateData: (payload: { id: number; data: unknown }) => Promise<{ ok: true }>
        updateBase: (payload: {
          id: number
          name: string
          race?: string
          class?: string
          level?: number
        }) => Promise<{ ok: true }>
        import: (campaignId: number) => Promise<
          | { canceled: true }
          | { canceled: false; id?: number; name?: string; error?: string }
        >
        export: (id: number) => Promise<{ ok: boolean; canceled?: boolean }>
        delete: (id: number) => Promise<{ ok: true }>
      }
      combats: {
        list: (campaignId: number) => Promise<Array<{ id: number; name: string; updated_at: string }>>
        save: (payload: {
          campaignId: number
          name: string
          data: unknown
          combatId?: number
        }) => Promise<{ id: number }>
        get: (id: number) => Promise<{ id: number; name: string; data: unknown } | null>
        delete: (id: number) => Promise<{ ok: true }>
        export: (id: number) => Promise<{ ok: boolean; canceled?: boolean; error?: string }>
        import: (campaignId: number) => Promise<{ ok: boolean; canceled?: boolean; id?: number; error?: string }>
      }
      monsters: {
        list: (params?: ListParams) => Promise<ListResponse<{
          id: number
          name: string
          name_ru: string | null
          type: string | null
          cr: string | null
          source: string | null
        }>>
        get: (id: number) => Promise<{
          id: number
          name: string
          name_ru: string | null
          type: string | null
          cr: string | null
          source: string | null
          data: unknown
        } | null>
      }
      customMonsters: {
        list: (payload: {
          campaignId: number
          query?: string
          limit?: number
          offset?: number
        }) => Promise<ListResponse<{
          id: number
          name: string
          cr: string | null
          updated_at: string
        }>>
        get: (id: number) => Promise<{
          id: number
          campaignId: number
          name: string
          cr: string | null
          data: unknown
        } | null>
        create: (payload: {
          campaignId: number
          name: string
          cr?: string | null
          data: unknown
        }) => Promise<{ id: number }>
        update: (payload: {
          id: number
          name: string
          cr?: string | null
          data: unknown
        }) => Promise<{ ok: true }>
        delete: (id: number) => Promise<{ ok: true }>
      }
      spells: {
        list: (params?: ListParams) => Promise<ListResponse<{
          id: number
          name: string
          name_ru: string | null
          school: string | null
          level: number | null
          source: string | null
        }>>
        get: (id: number) => Promise<{
          id: number
          name: string
          name_ru: string | null
          school: string | null
          level: number | null
          source: string | null
          data: unknown
        } | null>
      }
      items: {
        list: (params?: ListParams) => Promise<ListResponse<{
          id: number
          name: string
          name_ru: string | null
          type: string | null
          rarity: number | null
          source: string | null
        }>>
        get: (id: number) => Promise<{
          id: number
          name: string
          name_ru: string | null
          type: string | null
          rarity: number | null
          source: string | null
          data: unknown
        } | null>
      }
      weapons: {
        list: (params?: ListParams) => Promise<ListResponse<{
          id: number
          name: string
          name_ru: string | null
          type: string | null
          rarity: number | null
          source: string | null
        }>>
        get: (id: number) => Promise<{
          id: number
          name: string
          name_ru: string | null
          type: string | null
          rarity: number | null
          source: string | null
          data: unknown
        } | null>
      }
      artifacts: {
        list: (params?: ListParams) => Promise<ListResponse<{
          id: number
          name: string
          name_ru: string | null
          rarity: number | null
          source: string | null
        }>>
        get: (id: number) => Promise<{
          id: number
          name: string
          name_ru: string | null
          rarity: number | null
          source: string | null
          data: unknown
        } | null>
      }
      customWeapons: {
        list: (payload: {
          campaignId: number
          query?: string
          limit?: number
          offset?: number
        }) => Promise<ListResponse<{
          id: number
          name: string
          kind: string | null
          damage: string | null
          attack_bonus: number | null
          updated_at: string
        }>>
        get: (id: number) => Promise<{
          id: number
          campaignId: number
          name: string
          kind: string | null
          attackBonus: number | null
          damage: string | null
          damageType: string | null
          rangeText: string | null
          notes: string | null
          data: unknown
        } | null>
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
        }) => Promise<{ id: number }>
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
        }) => Promise<{ ok: true }>
        delete: (id: number) => Promise<{ ok: true }>
      }
      ttg: {
        getAll: () => Promise<{
          summary: unknown
          classes: unknown[]
          races: unknown[]
          rules: unknown[]
        }>
      }
      combatBoard: {
        open: () => Promise<{ ok: true }>
      }
      referenceWindow: {
        open: () => Promise<{ ok: true }>
      }
      combatPanel: {
        open: () => Promise<{ ok: true }>
      }
    }
  }
}


