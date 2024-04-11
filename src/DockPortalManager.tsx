import React, { useCallback, useMemo, useRef, useState } from "react"
import { TabPaneCache } from "./DockData"
import { createPortal } from "react-dom"

type PortalManager = {
  caches: Map<string, TabPaneCache>
  getTabCache(id: string, owner: any): TabPaneCache
  removeTabCache(id: string, owner: any): void
  updateTabCache(id: string, children: React.ReactNode): void
}

/** @ignore */
const PortalManagerContextType = React.createContext<PortalManager>(null!)

export const usePortalManager = () => React.useContext(PortalManagerContextType)

type Props = {
  children: React.ReactNode
}

export const DockPortalManager = ({ children }: Props) => {
  const [caches, setCaches] = useState(new Map<string, TabPaneCache>())
  const pendingDestroy = useRef<unknown | null>()

  const destroyRemovedPane = useCallback(() => {
    pendingDestroy.current = null
    setCaches((prev) => {
      const next = new Map(prev)
      for (let [id, cache] of next) {
        if (cache.owner == null) {
          next.delete(id)
        }
      }
      return prev
    })
  }, [])

  const getTabCache = useCallback(
    (id: string, owner: any): TabPaneCache => {
      let cache = caches.get(id)

      if (!cache) {
        let div = document.createElement("div")
        div.className = "dock-pane-cache"
        cache = { div, id, owner }
        setCaches((prev) => {
          const next = new Map(prev)
          next.set(id, cache)
          return next
        })
      } else {
        cache.owner = owner
      }

      return cache
    },
    [caches],
  )

  const removeTabCache = useCallback(
    (id: string, owner: any): void => {
      let cache = caches.get(id)
      if (cache && cache.owner === owner) {
        cache.owner = null
        if (!pendingDestroy.current) {
          // it could be reused by another component, so let's wait
          pendingDestroy.current = setTimeout(destroyRemovedPane, 1)
        }
      }
    },
    [caches, destroyRemovedPane],
  )

  const updateTabCache = useCallback((id: string, children: React.ReactNode): void => {
    setCaches((prev) => {
      const next = new Map(prev)
      let cache = next.get(id)
      if (cache) {
        cache.portal = createPortal(children, cache.div, cache.id)
      }
      return next
    })
  }, [])

  const value: PortalManager = useMemo(
    () => ({ caches, getTabCache, removeTabCache, updateTabCache }),
    [caches, getTabCache, removeTabCache, updateTabCache],
  )

  return (
    <PortalManagerContextType.Provider value={value}>{children}</PortalManagerContextType.Provider>
  )
}

export const RenderDockPortals = () => {
  const { caches } = usePortalManager()

  let portals: React.ReactPortal[] = []
  for (let [, cache] of caches) {
    if (cache.portal) {
      portals.push(cache.portal)
    }
  }

  return <>portals</>
}
