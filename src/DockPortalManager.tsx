import React, { useCallback, useMemo, useRef } from "react"
import { TabPaneCache } from "./DockData"
import { createPortal } from "react-dom"
import { useForceUpdate } from "./UseForceUpdate"

type PortalManager = {
  updateTabCache(id: string, children: React.ReactNode, owner: any): TabPaneCache
  removeTabCache(id: string, owner: any): void
}

/** @ignore */
const PortalManagerContextType = React.createContext<PortalManager>(null!)

export const usePortalManager = () => React.useContext(PortalManagerContextType)

type Props = {
  children: React.ReactNode
}

export const DockPortalManager = ({ children }: Props) => {
  const caches = useRef(new Map<string, TabPaneCache>())
  const pendingDestroy = useRef<unknown | null>()

  const forceUpdate = useForceUpdate()

  const destroyRemovedPane = useCallback(() => {
    pendingDestroy.current = null
    for (let [id, cache] of caches.current) {
      if (cache.owner == null) {
        caches.current.delete(id)
      }
    }
  }, [])

  const removeTabCache = useCallback(
    (id: string, owner: any): void => {
      let cache = caches.current.get(id)
      if (cache && cache.owner === owner) {
        cache.owner = null
        if (!pendingDestroy.current) {
          // it could be reused by another component, so let's wait
          pendingDestroy.current = setTimeout(destroyRemovedPane, 1)
        }
      }
      forceUpdate()
    },
    [destroyRemovedPane, forceUpdate],
  )

  const updateTabCache = useCallback(
    (id: string, children: React.ReactNode, owner: any): TabPaneCache => {
      let cache = caches.current.get(id)

      if (!cache) {
        let div = document.createElement("div")
        div.className = "dock-pane-cache"
        cache = { div, id, owner }
      }

      cache = { ...cache, portal: createPortal(children, cache.div, cache.id) }

      caches.current.set(id, cache)

      forceUpdate()

      return cache
    },
    [forceUpdate],
  )

  const value: PortalManager = useMemo(
    () => ({ removeTabCache, updateTabCache }),
    [removeTabCache, updateTabCache],
  )

  let portals: React.ReactPortal[] = []
  for (let [, cache] of caches.current) {
    if (cache.portal) {
      portals.push(cache.portal)
    }
  }

  return (
    <PortalManagerContextType.Provider value={value}>
      {children}
      <>{portals}</>
    </PortalManagerContextType.Provider>
  )
}
