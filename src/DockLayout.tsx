import debounce from "lodash/debounce"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Algorithm from "./Algorithm"
import { DockBox } from "./DockBox"
import {
  BoxData,
  defaultGroup,
  DockContext,
  DockContextProvider,
  DropDirection,
  FloatPosition,
  LayoutBase,
  LayoutData,
  LayoutSize,
  PanelBase,
  PanelData,
  placeHolderGroup,
  placeHolderStyle,
  TabBase,
  TabData,
  TabGroup,
} from "./DockData"
import { DockPortalManager, RenderDockPortals } from "./DockPortalManager"
import * as DragManager from "./dragdrop/DragManager"
import { FloatBox } from "./FloatBox"
import { MaxBox } from "./MaxBox"
import * as Serializer from "./Serializer"
import { WindowBox } from "./WindowBox"

export interface LayoutProps {
  /**
   * when there are multiple DockLayout, by default, you can't drag panel between them
   * but if you assign same dockId, it will allow panels to be dragged from one layout to another
   */
  dockId?: string

  /**
   * - when [[LayoutProps.loadTab]] callback is defined, tabs in defaultLayout only need to have an id, unless loadTab requires other fields
   * - when [[LayoutProps.loadTab]] is not defined, tabs must contain title and content, as well as other fields in [[TabData]] when needed
   */
  defaultLayout?: LayoutData

  /**
   * set layout only when you want to use DockLayout as a fully controlled react component
   * when using controlled layout, [[LayoutProps.onChange]] must be set to enable any layout change
   */
  layout?: LayoutBase

  /**
   * Tab Groups, defines additional configuration for different groups
   */
  groups?: { [key: string]: TabGroup }

  /**
   * @param newLayout layout data can be set to [[LayoutProps.layout]] directly when used as controlled component
   * @param currentTabId id of current tab
   * @param direction direction of the dock change
   */
  onLayoutChange?(newLayout: LayoutBase, currentTabId?: string, direction?: DropDirection): void

  /**
   * - default mode: showing 4 to 9 squares to help picking drop areas
   * - edge mode: using the distance between mouse and panel border to pick drop area
   *   - in edge mode, dragging float panel's header won't bring panel back to dock layer
   */
  dropMode?: "default" | "edge"

  /**
   * override the default saveTab behavior
   * @return must at least have an unique id
   */
  saveTab?(tab: TabData): TabBase

  /**
   * override the default loadTab behavior
   * - when loadTab is not defined, [[LayoutProps.defaultLayout]] will be used to find a tab to load, thus defaultLayout must contain the titles and contents for TabData
   * - when loadTab is defined, [[LayoutProps.defaultLayout]] can ignore all those and only keep id and other custom data
   */
  loadTab?(tab: TabBase): TabData

  /**
   * modify the savedPanel, you can add additional data into the savedPanel
   */
  afterPanelSaved?(savedPanel: PanelBase, panel: PanelData): void

  /**
   * modify the loadedPanel, you can retrieve additional data into the panel
   * - modifying panel tabs is allowed, make sure to add or replace full TabData with title and content, because loadTab won't be called after this
   * - if tabs is empty, but still remaining in layout because of panelLock, make sure also set the group if it's not null
   */
  afterPanelLoaded?(savedPanel: PanelBase, loadedPanel: PanelData): void

  style?: React.CSSProperties

  /**
   * when specified, docklayout will create a react portal for the maximized panel
   * use dom element as the value, or use the element's id
   */
  maximizeTo?: string | HTMLElement
}

interface LayoutState {
  layout: LayoutData
  /** @ignore */
  dropRect?: {
    left: number
    width: number
    top: number
    height: number
    element: HTMLElement
    source?: any
    direction?: DropDirection
  }
}

export const DockLayout = ({
  afterPanelLoaded,
  afterPanelSaved,
  defaultLayout,
  dockId,
  dropMode,
  groups,
  layout,
  loadTab,
  maximizeTo,
  onLayoutChange,
  saveTab,
  style,
}: LayoutProps) => {
  const [ref, setRef] = React.useState<null | HTMLDivElement>(null)
  const [state, setState] = React.useState<LayoutState>(() => {
    let preparedLayout: LayoutData
    if (defaultLayout) {
      preparedLayout = utils.prepareInitData(defaultLayout, groups, loadTab)
    } else if (!loadTab) {
      throw new Error(
        "DockLayout.loadTab and DockLayout.defaultLayout should not both be undefined.",
      )
    }

    if (layout) {
      // controlled layout
      return {
        layout: utils.loadLayoutData(layout, {
          afterPanelLoaded,
          defaultLayout,
          groups,
          loadTab,
        }),
        dropRect: null,
      }
    } else {
      return {
        layout: preparedLayout,
        dropRect: null,
      }
    }
  })

  const layoutId = React.useId()

  const getDockId = React.useCallback(() => dockId || layoutId, [dockId, layoutId])

  const find = React.useCallback(
    (id: string, filter?: Algorithm.Filter) => Algorithm.find(state.layout, id, filter),
    [state.layout],
  )

  const getGroup = React.useCallback(
    (name: string) => {
      if (name) {
        if (groups && name in groups) {
          return groups[name]
        }
        if (name === placeHolderStyle) {
          return placeHolderGroup
        }
      }
      return defaultGroup
    },
    [groups],
  )

  const panelToFocus = React.useRef<string | null>(null)

  const changeLayout = React.useCallback(
    (
      layoutData: LayoutData,
      currentTabId: string,
      direction: DropDirection,
      silent: boolean = false,
    ) => {
      let savedLayout: LayoutBase
      if (onLayoutChange) {
        savedLayout = Serializer.saveLayoutData(layoutData, saveTab, afterPanelSaved)
        layoutData.loadedFrom = savedLayout
        onLayoutChange(savedLayout, currentTabId, direction)
      }

      if (!layout && !silent) {
        // uncontrolled layout when Props.layout is not defined
        setState((prev) => ({ ...prev, layout: layoutData }))
      }
    },
    [layout, onLayoutChange, saveTab, afterPanelSaved],
  )

  const onDragStateChange = React.useCallback(
    (draggingScope: any) => {
      if (draggingScope == null) {
        if (state.dropRect) {
          setState((prev) => ({ ...prev, dropRect: null }))
        }
      }
    },
    [state.dropRect],
  )

  const dockMove = React.useCallback(
    (
      source: TabData | PanelData,
      target: string | TabData | PanelData | BoxData | null,
      direction: DropDirection,
      floatPosition?: FloatPosition,
    ) => {
      let layout = state.layout
      if (direction === "maximize") {
        layout = Algorithm.maximize(layout, source)
        panelToFocus.current = source.id
      } else if (direction === "front") {
        layout = Algorithm.moveToFront(layout, source)
      } else {
        layout = Algorithm.removeFromLayout(layout, source)
      }

      if (typeof target === "string") {
        target = find(target, Algorithm.Filter.All)
      } else {
        target = Algorithm.getUpdatedObject(target) // target might change during removeTab
      }

      if (direction === "float") {
        let newPanel = Algorithm.converToPanel(source)
        newPanel.z = Algorithm.nextZIndex(null)
        if (state.dropRect || floatPosition) {
          layout = Algorithm.floatPanel(layout, newPanel, state.dropRect || floatPosition)
        } else {
          layout = Algorithm.floatPanel(layout, newPanel)
          if (ref) {
            layout = Algorithm.fixFloatPanelPos(layout, ref.offsetWidth, ref.offsetHeight)
          }
        }
      } else if (direction === "new-window") {
        let newPanel = Algorithm.converToPanel(source)
        layout = Algorithm.panelToWindow(layout, newPanel)
      } else if (target) {
        if ("tabs" in (target as PanelData)) {
          // panel target
          if (direction === "middle") {
            layout = Algorithm.addTabToPanel(layout, source, target as PanelData)
          } else {
            let newPanel = Algorithm.converToPanel(source)
            layout = Algorithm.dockPanelToPanel(layout, newPanel, target as PanelData, direction)
          }
        } else if ("children" in (target as BoxData)) {
          // box target
          let newPanel = Algorithm.converToPanel(source)
          layout = Algorithm.dockPanelToBox(layout, newPanel, target as BoxData, direction)
        } else {
          // tab target
          layout = Algorithm.addNextToTab(layout, source, target as TabData, direction)
        }
      }
      if (layout !== state.layout) {
        layout = Algorithm.fixLayoutData(layout, groups)
        const currentTabId: string =
          "tabs" in source ? (source as PanelData).activeId : (source as TabData).id
        changeLayout(layout, currentTabId, direction)
      }
      onDragStateChange(false)
    },
    [changeLayout, find, groups, onDragStateChange, ref, state.dropRect, state.layout],
  )

  const getLayoutSize = React.useCallback((): LayoutSize => {
    if (ref) {
      return { width: ref.offsetWidth, height: ref.offsetHeight }
    }
    return { width: 0, height: 0 }
  }, [ref])

  const updateTab = React.useCallback(
    (id: string, newTab: TabData | null, makeActive: boolean = true): boolean => {
      let layout = state.layout

      let tab = find(id, Algorithm.Filter.AnyTab) as TabData

      if (!tab) {
        return false
      }

      let panelData = tab.parent
      let idx = panelData.tabs.indexOf(tab)
      if (idx >= 0) {
        if (newTab) {
          let activeId = panelData.activeId
          if (loadTab && !("content" in newTab && "title" in newTab)) {
            newTab = loadTab(newTab)
          }
          layout = Algorithm.removeFromLayout(layout, tab) // remove old tab
          panelData = Algorithm.getUpdatedObject(panelData) // panelData might change during removeTab
          layout = Algorithm.addTabToPanel(layout, newTab, panelData, idx) // add new tab
          panelData = Algorithm.getUpdatedObject(panelData) // panelData might change during addTabToPanel
          if (!makeActive) {
            // restore the previous activeId
            panelData.activeId = activeId
            panelToFocus.current = panelData.id
          }
        } else if (makeActive && panelData.activeId !== id) {
          layout = Algorithm.replacePanel(layout, panelData, {
            ...panelData,
            activeId: id,
          })
        }

        layout = Algorithm.fixLayoutData(layout, groups)
        changeLayout(layout, newTab?.id ?? id, "update")
        return true
      }
    },
    [state.layout, loadTab, groups, changeLayout, find],
  )

  const navigateToPanel = React.useCallback(
    (fromElement?: HTMLElement, direction?: string) => {
      if (!direction) {
        if (!fromElement) {
          fromElement = ref.querySelector(".dock-tab-active>.dock-tab-btn")
        }
        fromElement.focus()
        return
      }

      let targetTab: HTMLElement
      // use panel rect when move left/right, and use tabbar rect for up/down
      let selector =
        direction === "ArrowUp" || direction === "ArrowDown"
          ? ".dock>.dock-bar"
          : ".dock-box>.dock-panel"
      let panels = Array.from(ref.querySelectorAll(selector))

      let currentPanel = panels.find((panel) => panel.contains(fromElement))
      let currentRect = currentPanel.getBoundingClientRect()
      let matches: any[] = []
      for (let panel of panels) {
        if (panel !== currentPanel) {
          let rect = panel.getBoundingClientRect()
          let distance = Algorithm.findNearestPanel(currentRect, rect, direction)
          if (distance >= 0) {
            matches.push({ panel, rect, distance })
          }
        }
      }
      matches.sort((a, b) => a.distance - b.distance)
      for (let match of matches) {
        targetTab = match.panel.querySelector(".dock-tab-active>.dock-tab-btn")
        if (targetTab) {
          break
        }
      }

      if (targetTab) {
        targetTab.focus()
      }
    },
    [ref],
  )

  React.useEffect(() => {
    const onWindowResize = debounce(() => {
      let layout = state.layout

      if (ref) {
        let newLayout = Algorithm.fixFloatPanelPos(layout, ref.offsetWidth, ref.offsetHeight)
        if (layout !== newLayout) {
          newLayout = Algorithm.fixLayoutData(newLayout, groups) // panel parent might need a fix
          changeLayout(newLayout, null, "move")
        }
      }
    }, 200)

    globalThis.addEventListener("resize", onWindowResize)

    return () => {
      globalThis.removeEventListener("resize", onWindowResize)
      onWindowResize.cancel()
    }
  }, [state.layout, ref, groups, changeLayout])

  React.useEffect(() => {
    DragManager.addDragStateListener(onDragStateChange)

    return () => {
      DragManager.removeDragStateListener(onDragStateChange)
    }
  }, [onDragStateChange])

  React.useEffect(() => {
    if (panelToFocus.current) {
      let panel = ref.querySelector(
        `.dock-panel[data-dockid="${panelToFocus.current}"]`,
      ) as HTMLElement
      if (panel && !panel.contains(ref.ownerDocument.activeElement)) {
        ;(panel.querySelector(".dock-bar") as HTMLElement)?.focus()
      }
      panelToFocus.current = null
    }
  }, [ref])

  const shouldUseEdgeDrop = React.useCallback(() => dropMode === "edge", [dropMode])

  const setDropRect = React.useCallback(
    (
      element: HTMLElement,
      direction?: DropDirection,
      source?: any,
      event?: { clientX: number; clientY: number },
      panelSize: [number, number] = [300, 300],
    ) => {
      let dropRect = state.dropRect
      if (dropRect) {
        if (direction === "remove") {
          if (dropRect.source === source) {
            setState((prev) => ({ ...prev, dropRect: null }))
          }
          return
        } else if (
          dropRect.element === element &&
          dropRect.direction === direction &&
          direction !== "float"
        ) {
          // skip duplicated update except for float dragging
          return
        }
      }
      if (!element) {
        setState((prev) => ({ ...prev, dropRect: null }))
        return
      }

      let layoutRect = ref.getBoundingClientRect()
      let scaleX = ref.offsetWidth / layoutRect.width
      let scaleY = ref.offsetHeight / layoutRect.height

      let elemRect = element.getBoundingClientRect()
      let left = (elemRect.left - layoutRect.left) * scaleX
      let top = (elemRect.top - layoutRect.top) * scaleY
      let width = elemRect.width * scaleX
      let height = elemRect.height * scaleY

      let ratio = 0.5
      if (element.classList.contains("dock-box")) {
        ratio = 0.3
      }
      switch (direction) {
        case "float": {
          let x = (event.clientX - layoutRect.left) * scaleX
          let y = (event.clientY - layoutRect.top) * scaleY
          top = y - 15
          width = panelSize[0]
          height = panelSize[1]
          left = x - (width >> 1)
          break
        }
        case "right":
          left += width * (1 - ratio)
        // eslint-disable-next-line no-fallthrough
        case "left":
          width *= ratio
          break
        case "bottom":
          top += height * (1 - ratio)
        // eslint-disable-next-line no-fallthrough
        case "top":
          height *= ratio
          break
        case "after-tab":
          left += width - 15
          width = 30
          break
        case "before-tab":
          left -= 15
          width = 30
          break
      }

      setState((prev) => ({
        ...prev,
        dropRect: { left, top, width, height, element, source, direction },
      }))
    },
    [ref, state.dropRect],
  )

  const getRootElement = React.useCallback(() => ref, [ref])
  const onSilentChange = React.useCallback(
    (currentTabId: string = null, direction?: DropDirection) => {
      if (onLayoutChange) {
        let layout = state.layout
        changeLayout(layout, currentTabId, direction, true)
      }
    },
    [onLayoutChange, state.layout, changeLayout],
  )

  const context: DockContext = React.useMemo(
    () => ({
      dockMove,
      find,
      getDockId,
      getGroup,
      getLayoutSize,
      getRootElement,
      navigateToPanel,
      onSilentChange,
      setDropRect,
      updateTab,
      shouldUseEdgeDrop,
    }),
    [
      dockMove,
      find,
      getDockId,
      getGroup,
      getLayoutSize,
      getRootElement,
      navigateToPanel,
      onSilentChange,
      setDropRect,
      updateTab,
      shouldUseEdgeDrop,
    ],
  )

  let dropRectStyle: React.CSSProperties
  if (state.dropRect) {
    let { direction, ...rect } = state.dropRect
    dropRectStyle = { ...rect, display: "block" }
    if (direction === "float") {
      dropRectStyle.transition = "none"
    }
  }
  let maximize: React.ReactNode
  // if (layout.maxbox && layout.maxbox.children.length === 1) {
  if (maximizeTo) {
    if (typeof maximizeTo === "string") {
      maximizeTo = document.getElementById(maximizeTo)
    }
    maximize = ReactDOM.createPortal(<MaxBox boxData={state.layout.maxbox} />, maximizeTo)
  } else {
    maximize = <MaxBox boxData={state.layout.maxbox} />
  }

  return (
    <div ref={setRef} className="dock-layout" style={style}>
      <DockPortalManager>
        <DockContextProvider value={context}>
          <DockBox size={1} boxData={state.layout.dockbox} />
          <FloatBox boxData={state.layout.floatbox} />
          <WindowBox boxData={state.layout.windowbox} />
          {maximize}
          <RenderDockPortals />
        </DockContextProvider>
      </DockPortalManager>
      <div className="dock-drop-indicator" style={dropRectStyle} />
    </div>
  )
}

const utils = {
  prepareInitData(
    data: LayoutData,
    groups: LayoutProps["groups"],
    loadTab: LayoutProps["loadTab"],
  ): LayoutData {
    let layout = { ...data }
    Algorithm.fixLayoutData(layout, groups, loadTab)
    return layout
  },
  loadLayoutData(
    savedLayout: LayoutBase,
    {
      defaultLayout,
      loadTab,
      afterPanelLoaded,
      groups,
    }: Pick<LayoutProps, "defaultLayout" | "loadTab" | "afterPanelLoaded" | "groups">,
    width = 0,
    height = 0,
  ): LayoutData {
    let layout = Serializer.loadLayoutData(savedLayout, defaultLayout, loadTab, afterPanelLoaded)
    layout = Algorithm.fixFloatPanelPos(layout, width, height)
    layout = Algorithm.fixLayoutData(layout, groups)
    layout.loadedFrom = savedLayout
    return layout
  },
}
