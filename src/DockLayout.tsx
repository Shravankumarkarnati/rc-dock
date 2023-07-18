import * as React from "react";
import * as ReactDOM from "react-dom";
import debounce from "lodash/debounce";
import {
  BoxData,
  defaultGroup,
  DockContext,
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
  TabPaneCache,
} from "./DockData";
import { DockBox } from "./DockBox";
import { FloatBox } from "./FloatBox";
import { DockPanel } from "./DockPanel";
import * as Algorithm from "./Algorithm";
import * as Serializer from "./Serializer";
import * as DragManager from "./dragdrop/DragManager";
import { MaxBox } from "./MaxBox";
import { WindowBox } from "./WindowBox";
import { DockContextProvider } from "./DockContext";
import { useForceUpdateFC } from "./Hooks";

export interface LayoutProps {
  /**
   * when there are multiple DockLayout, by default, you can't drag panel between them
   * but if you assign same dockId, it will allow panels to be dragged from one layout to another
   */
  dockId: string;

  /**
   * - when [[LayoutProps.loadTab]] callback is defined, tabs in defaultLayout only need to have an id, unless loadTab requires other fields
   * - when [[LayoutProps.loadTab]] is not defined, tabs must contain title and content, as well as other fields in [[TabData]] when needed
   */
  defaultLayout?: LayoutData;

  /**
   * set layout only when you want to use DockLayout as a fully controlled react component
   * when using controlled layout, [[LayoutProps.onChange]] must be set to enable any layout change
   */
  layout?: LayoutBase;

  /**
   * Tab Groups, defines additional configuration for different groups
   */
  groups?: { [key: string]: TabGroup };

  /**
   * @param newLayout layout data can be set to [[LayoutProps.layout]] directly when used as controlled component
   * @param currentTabId id of current tab
   * @param direction direction of the dock change
   */
  onLayoutChange?(
    newLayout: LayoutBase,
    currentTabId?: string,
    direction?: DropDirection
  ): void;

  /**
   * - default mode: showing 4 to 9 squares to help picking drop areas
   * - edge mode: using the distance between mouse and panel border to pick drop area
   *   - in edge mode, dragging float panel's header won't bring panel back to dock layer
   */
  dropMode?: "default" | "edge";

  /**
   * override the default saveTab behavior
   * @return must at least have an unique id
   */
  saveTab?(tab: TabData): TabBase;

  /**
   * override the default loadTab behavior
   * - when loadTab is not defined, [[LayoutProps.defaultLayout]] will be used to find a tab to load, thus defaultLayout must contain the titles and contents for TabData
   * - when loadTab is defined, [[LayoutProps.defaultLayout]] can ignore all those and only keep id and other custom data
   */
  loadTab?(tab: TabBase): TabData;

  /**
   * Called before closing a tab
   * @param tabData TabData of the tab being closed
   * @param closeTab callback to confirm the tab close action
   */
  onTabClose?(tabData: TabData, closeTab: () => void): void;

  /**
   * return `true` to trigger a layout change.
   * @param panelData panel data of the panel clicked or focused on
   */
  onFocusOrClickWithinPanel?(panelData: PanelData): boolean | undefined;

  /**
   * modify the savedPanel, you can add additional data into the savedPanel
   */
  afterPanelSaved?(savedPanel: PanelBase, panel: PanelData): void;

  /**
   * modify the loadedPanel, you can retrieve additional data into the panel
   * - modifying panel tabs is allowed, make sure to add or replace full TabData with title and content, because loadTab won't be called after this
   * - if tabs is empty, but still remaining in layout because of panelLock, make sure also set the group if it's not null
   */
  afterPanelLoaded?(savedPanel: PanelBase, loadedPanel: PanelData): void;

  style?: React.CSSProperties;

  /**
   * when specified, docklayout will create a react portal for the maximized panel
   * use dom element as the value, or use the element's id
   */
  maximizeTo?: string | HTMLElement;
}

interface LayoutState {
  layout: LayoutData;
  dropRect: {
    left: number;
    width: number;
    top: number;
    height: number;
    element: HTMLElement;
    source?: any;
    direction?: DropDirection;
  } | null;
}

export const DockLayout: React.FC<LayoutProps> = React.memo((props) => {
  const {
    groups,
    loadTab,
    dockId,
    layout,
    defaultLayout,
    afterPanelLoaded,
    onLayoutChange,
    saveTab,
    afterPanelSaved,
    dropMode,
    style,
    onTabClose: givenOnTabClose,
    onFocusOrClickWithinPanel: givenOnFocusOrClickWithinPanel,
  } = props;
  let { maximizeTo } = props;

  const _caches = React.useRef(new Map<string, TabPaneCache>());
  const _ref = React.useRef<HTMLDivElement | null>(null);
  const panelToFocus = React.useRef<string | null>(null);
  const tempLayout = React.useRef<LayoutData | null>(null);
  const _pendingDestroy = React.useRef<NodeJS.Timeout | null>(null);
  const _isMounted = React.useRef(false);

  const forceUpdate = useForceUpdateFC();

  const destroyRemovedPane = React.useCallback(() => {
    _pendingDestroy.current = null;
    let cacheRemoved = false;
    for (let [id, cache] of _caches.current) {
      if (cache.owner == null) {
        _caches.current.delete(id);
        cacheRemoved = true;
      }
    }
    if (cacheRemoved && _isMounted) {
      forceUpdate();
    }
  }, [forceUpdate]);

  const getTabCache = React.useCallback(
    (id: string, owner: any): TabPaneCache => {
      let cache = _caches.current.get(id);
      if (!cache) {
        let div = document.createElement("div");
        div.className = "dock-pane-cache";
        cache = { div, id, owner };
        _caches.current.set(id, cache);
      } else {
        cache.owner = owner;
      }

      return cache;
    },
    []
  );

  const removeTabCache = React.useCallback((id: string, owner: any): void => {
    let cache = _caches.current.get(id);
    if (cache && cache.owner === owner) {
      cache.owner = null;
      if (!_pendingDestroy.current) {
        // it could be reused by another component, so let's wait
        _pendingDestroy.current = setTimeout(destroyRemovedPane, 1);
      }
    }
  }, []);

  const updateTabCache = React.useCallback(
    (id: string, children: React.ReactNode): void => {
      let cache = _caches.current.get(id);
      if (cache) {
        cache.portal = ReactDOM.createPortal(children, cache.div, cache.id);
        forceUpdate();
      }
    },
    [forceUpdate]
  );

  const loadLayoutData = React.useCallback(
    (savedLayout: LayoutBase, width = 0, height = 0): LayoutData => {
      let _layout = Serializer.loadLayoutData(
        savedLayout,
        defaultLayout,
        loadTab,
        afterPanelLoaded
      );
      _layout = Algorithm.fixFloatPanelPos(_layout, width, height);
      _layout = Algorithm.fixLayoutData(_layout, groups);
      _layout.loadedFrom = savedLayout;
      return _layout;
    },
    [groups, defaultLayout, loadTab, afterPanelLoaded]
  );

  const [state, setState] = React.useState<LayoutState>(
    (() => {
      let preparedLayout: LayoutData;
      if (defaultLayout) {
        preparedLayout = Algorithm.fixLayoutData(
          { ...props.defaultLayout },
          groups,
          loadTab
        );
      } else if (!loadTab) {
        throw new Error(
          "DockLayout.loadTab and DockLayout.defaultLayout should not both be undefined."
        );
      }

      if (layout) {
        // controlled layout
        return {
          layout: loadLayoutData(layout),
          dropRect: null,
        } as LayoutState;
      } else {
        return {
          layout: preparedLayout,
          dropRect: null,
        };
      }
    })()
  );

  const getRef = React.useCallback(
    (r: HTMLDivElement) => (_ref.current = r),
    []
  );

  const getRootElement = () => _ref.current;
  const getDockId = () => dockId;
  const useEdgeDrop = () => dropMode === "edge";
  const getLayoutSize = (): LayoutSize => {
    if (_ref.current) {
      return {
        width: _ref.current.offsetWidth,
        height: _ref.current.offsetHeight,
      };
    }
    return { width: 0, height: 0 };
  };

  const setLayout = React.useCallback((layout: LayoutData) => {
    tempLayout.current = layout;
    setState((prev) => ({ ...prev, layout }));
  }, []);

  const getGroup = React.useCallback(
    (name: string) => {
      if (name) {
        if (groups && name in groups) {
          return groups[name];
        }
        if (name === placeHolderStyle) {
          return placeHolderGroup;
        }
      }
      return defaultGroup;
    },
    [groups]
  );

  const getLayout = React.useCallback(
    () => tempLayout.current || state.layout,
    [state.layout]
  );

  const find = React.useCallback(
    (
      id: string,
      filter?: Algorithm.Filter
    ): PanelData | TabData | BoxData | undefined =>
      Algorithm.find(getLayout(), id, filter),
    [getLayout]
  );

  const changeLayout = React.useCallback(
    (
      layoutData: LayoutData,
      currentTabId: string,
      direction: DropDirection,
      silent: boolean = false
    ) => {
      let savedLayout: LayoutBase;
      if (onLayoutChange) {
        savedLayout = Serializer.saveLayoutData(
          layoutData,
          saveTab,
          afterPanelSaved
        );
        layoutData.loadedFrom = savedLayout;
        onLayoutChange(savedLayout, currentTabId, direction);
        if (layout) {
          // if layout prop is defined, we need to force an update to make sure it's either updated or reverted back
          forceUpdate();
        }
      }
      if (!layout && !silent) {
        // uncontrolled layout when Props.layout is not defined
        setLayout(layoutData);
      }
    },
    [onLayoutChange, saveTab, afterPanelSaved, forceUpdate]
  );

  const onDragStateChange = React.useCallback((draggingScope: any) => {
    if (draggingScope == null) {
      DockPanel.droppingPanel = null;
      if (state.dropRect) {
        setState((prev) => ({ ...prev, dropRect: null }));
      }
    }
  }, []);

  const dockMove = React.useCallback(
    (
      source: TabData | PanelData,
      target: string | TabData | PanelData | BoxData | null,
      direction: DropDirection,
      floatPosition?: FloatPosition
    ) => {
      let layout = getLayout();
      if (direction === "maximize") {
        layout = Algorithm.maximize(layout, source);
        panelToFocus.current = source.id;
      } else if (direction === "front") {
        layout = Algorithm.moveToFront(layout, source);
      } else {
        layout = Algorithm.removeFromLayout(layout, source);
      }

      if (typeof target === "string") {
        target = find(target, Algorithm.Filter.All);
      } else {
        target = Algorithm.getUpdatedObject(target); // target might change during removeTab
      }

      if (direction === "float") {
        let newPanel = Algorithm.converToPanel(source);
        newPanel.z = Algorithm.nextZIndex(null);
        if (state.dropRect || floatPosition) {
          layout = Algorithm.floatPanel(
            layout,
            newPanel,
            state.dropRect || floatPosition
          );
        } else {
          layout = Algorithm.floatPanel(layout, newPanel);
          if (_ref.current) {
            layout = Algorithm.fixFloatPanelPos(
              layout,
              _ref.current.offsetWidth,
              _ref.current.offsetHeight
            );
          }
        }
      } else if (direction === "new-window") {
        let newPanel = Algorithm.converToPanel(source);
        layout = Algorithm.panelToWindow(layout, newPanel);
      } else if (target) {
        if ("tabs" in (target as PanelData)) {
          // panel target
          if (direction === "middle") {
            layout = Algorithm.addTabToPanel(
              layout,
              source,
              target as PanelData
            );
          } else {
            let newPanel = Algorithm.converToPanel(source);
            layout = Algorithm.dockPanelToPanel(
              layout,
              newPanel,
              target as PanelData,
              direction
            );
          }
        } else if ("children" in (target as BoxData)) {
          // box target
          let newPanel = Algorithm.converToPanel(source);
          layout = Algorithm.dockPanelToBox(
            layout,
            newPanel,
            target as BoxData,
            direction
          );
        } else {
          // tab target
          layout = Algorithm.addNextToTab(
            layout,
            source,
            target as TabData,
            direction
          );
        }
      }
      if (layout !== getLayout()) {
        layout = Algorithm.fixLayoutData(layout, groups);
        const currentTabId: string = source.hasOwnProperty("tabs")
          ? (source as PanelData).activeId
          : (source as TabData).id;
        changeLayout(layout, currentTabId, direction);
      }
      onDragStateChange(false);
    },
    [getLayout, changeLayout, onDragStateChange, groups, find, state.dropRect]
  );

  const updateTab = React.useCallback(
    (
      id: string,
      newTab: TabData | null,
      makeActive: boolean = true
    ): boolean => {
      let tab = find(id, Algorithm.Filter.AnyTab) as TabData;
      if (!tab) {
        return false;
      }
      let panelData = tab.parent;
      let idx = panelData.tabs.indexOf(tab);
      if (idx >= 0) {
        let layout = getLayout();
        if (newTab) {
          let activeId = panelData.activeId;
          if (loadTab && !("content" in newTab && "title" in newTab)) {
            newTab = loadTab(newTab);
          }
          layout = Algorithm.removeFromLayout(layout, tab); // remove old tab
          panelData = Algorithm.getUpdatedObject(panelData); // panelData might change during removeTab
          layout = Algorithm.addTabToPanel(layout, newTab, panelData, idx); // add new tab
          panelData = Algorithm.getUpdatedObject(panelData); // panelData might change during addTabToPanel
          if (!makeActive) {
            // restore the previous activeId
            panelData.activeId = activeId;
            panelToFocus.current = panelData.id;
          }
        } else if (makeActive && panelData.activeId !== id) {
          layout = Algorithm.replacePanel(layout, panelData, {
            ...panelData,
            activeId: id,
          });
        }

        layout = Algorithm.fixLayoutData(layout, groups);
        changeLayout(layout, newTab?.id ?? id, "update");
        return true;
      }
    },
    [getLayout, changeLayout, loadTab, groups, find]
  );

  const navigateToPanel = React.useCallback(
    (fromElement?: HTMLElement, direction?: string) => {
      if (!direction) {
        if (!fromElement) {
          fromElement = _ref.current.querySelector(
            ".dock-tab-active>.dock-tab-btn"
          );
        }
        fromElement.focus();
        return;
      }
      let targetTab: HTMLElement;
      // use panel rect when move left/right, and use tabbar rect for up/down
      let selector =
        direction === "ArrowUp" || direction === "ArrowDown"
          ? ".dock>.dock-bar"
          : ".dock-box>.dock-panel";
      let panels = Array.from(_ref.current.querySelectorAll(selector));

      let currentPanel = panels.find((panel) => panel.contains(fromElement));
      let currentRect = currentPanel.getBoundingClientRect();
      let matches: any[] = [];
      for (let panel of panels) {
        if (panel !== currentPanel) {
          let rect = panel.getBoundingClientRect();
          let distance = Algorithm.findNearestPanel(
            currentRect,
            rect,
            direction
          );
          if (distance >= 0) {
            matches.push({ panel, rect, distance });
          }
        }
      }
      matches.sort((a, b) => a.distance - b.distance);
      for (let match of matches) {
        targetTab = match.panel.querySelector(".dock-tab-active>.dock-tab-btn");
        if (targetTab) {
          break;
        }
      }

      if (targetTab) {
        targetTab.focus();
      }
    },
    []
  );

  const _onWindowResize = React.useMemo(
    () =>
      debounce(() => {
        let layout = getLayout();

        if (_ref.current) {
          let newLayout = Algorithm.fixFloatPanelPos(
            layout,
            _ref.current.offsetWidth,
            _ref.current.offsetHeight
          );
          if (layout !== newLayout) {
            newLayout = Algorithm.fixLayoutData(newLayout, groups); // panel parent might need a fix
            changeLayout(newLayout, null, "move");
          }
        }
      }, 200),
    [changeLayout, getLayout]
  );

  React.useEffect(() => {
    _isMounted.current = true;
    globalThis.addEventListener?.("resize", _onWindowResize);
    DragManager.addDragStateListener(onDragStateChange);

    return () => {
      globalThis.removeEventListener?.("resize", _onWindowResize);
      DragManager.removeDragStateListener(onDragStateChange);
      _onWindowResize.cancel();
      _isMounted.current = false;
    };
  }, [_onWindowResize, onDragStateChange]);

  React.useEffect(() => {
    if (panelToFocus.current) {
      let panel = _ref.current.querySelector(
        `.dock-panel[data-dockid="${panelToFocus.current}"]`
      ) as HTMLElement;
      if (panel && !panel.contains(_ref.current.ownerDocument.activeElement)) {
        (panel.querySelector(".dock-bar") as HTMLElement)?.focus();
      }
      panelToFocus.current = null;
    }
  });

  const setDropRect = React.useCallback(
    (
      element: HTMLElement,
      direction?: DropDirection,
      source?: any,
      event?: { clientX: number; clientY: number },
      panelSize: [number, number] = [300, 300]
    ) => {
      let dropRect = state.dropRect;
      if (dropRect) {
        if (direction === "remove") {
          if (dropRect.source === source) {
            setState((prev) => ({ ...prev, dropRect: null }));
          }
          return;
        } else if (
          dropRect.element === element &&
          dropRect.direction === direction &&
          direction !== "float"
        ) {
          // skip duplicated update except for float dragging
          return;
        }
      }
      if (!element) {
        setState((prev) => ({ ...prev, dropRect: null }));
        return;
      }
      let layoutRect = _ref.current.getBoundingClientRect();
      let scaleX = _ref.current.offsetWidth / layoutRect.width;
      let scaleY = _ref.current.offsetHeight / layoutRect.height;

      let elemRect = element.getBoundingClientRect();
      let left = (elemRect.left - layoutRect.left) * scaleX;
      let top = (elemRect.top - layoutRect.top) * scaleY;
      let width = elemRect.width * scaleX;
      let height = elemRect.height * scaleY;

      let ratio = 0.5;
      if (element.classList.contains("dock-box")) {
        ratio = 0.3;
      }
      switch (direction) {
        case "float": {
          let x = (event.clientX - layoutRect.left) * scaleX;
          let y = (event.clientY - layoutRect.top) * scaleY;
          top = y - 15;
          width = panelSize[0];
          height = panelSize[1];
          left = x - (width >> 1);
          break;
        }
        case "right":
          left += width * (1 - ratio);
        case "left": // tslint:disable-line no-switch-case-fall-through
          width *= ratio;
          break;
        case "bottom":
          top += height * (1 - ratio);
        case "top": // tslint:disable-line no-switch-case-fall-through
          height *= ratio;
          break;
        case "after-tab":
          left += width - 15;
          width = 30;
          break;
        case "before-tab":
          left -= 15;
          width = 30;
          break;
      }

      setState((prev) => ({
        ...prev,
        dropRect: { left, top, width, height, element, source, direction },
      }));
    },
    [state.dropRect]
  );

  const onSilentChange = React.useCallback(
    (currentTabId: string = null, direction?: DropDirection) => {
      if (onLayoutChange) {
        let layout = getLayout();
        changeLayout(layout, currentTabId, direction, true);
      }
    },
    [getLayout, changeLayout]
  );

  const onTabClose = React.useCallback(
    (tabData: TabData, closeTab: () => void): void => {
      if (givenOnTabClose) {
        givenOnTabClose(tabData, closeTab);
      } else {
        closeTab();
      }
    },
    [givenOnTabClose]
  );

  const onFocusOrClickWithinPanel = React.useCallback(
    (panelData: PanelData) => {
      if (givenOnFocusOrClickWithinPanel) {
        const shouldUpdate = givenOnFocusOrClickWithinPanel(panelData);
        if (shouldUpdate) {
          onSilentChange(panelData.activeId, "active");
        }
      }
    },
    [givenOnFocusOrClickWithinPanel, onSilentChange]
  );

  // clear tempLayout
  tempLayout.current = null;

  let { layout: stateLayout, dropRect } = state;
  let dropRectStyle: React.CSSProperties;
  if (dropRect) {
    let { element, direction, ...rect } = dropRect;
    dropRectStyle = { ...rect, display: "block" };
    if (direction === "float") {
      dropRectStyle.transition = "none";
    }
  }
  let maximize: React.ReactNode;
  // if (layout.maxbox && layout.maxbox.children.length === 1) {
  if (maximizeTo) {
    if (typeof maximizeTo === "string") {
      maximizeTo = document.getElementById(maximizeTo);
    }
    maximize = ReactDOM.createPortal(
      <MaxBox boxData={stateLayout.maxbox} />,
      maximizeTo
    );
  } else {
    maximize = <MaxBox boxData={stateLayout.maxbox} />;
  }
  // }

  let portals: React.ReactPortal[] = [];
  for (let [, cache] of _caches.current) {
    if (cache.portal) {
      portals.push(cache.portal);
    }
  }

  const value: DockContext = React.useMemo(
    () => ({
      dockMove,
      onFocusOrClickWithinPanel,
      find,
      getDockId,
      getGroup,
      getLayoutSize,
      getRootElement,
      getTabCache,
      navigateToPanel,
      onSilentChange,
      onTabClose,
      removeTabCache,
      setDropRect,
      updateTab,
      updateTabCache,
      useEdgeDrop,
    }),
    []
  );

  return (
    <div ref={getRef} className="dock-layout" style={style}>
      <DockContextProvider value={value}>
        <DockBox size={1} boxData={stateLayout.dockbox} />
        <FloatBox boxData={stateLayout.floatbox} />
        <WindowBox boxData={stateLayout.windowbox} />
        {maximize}
        {portals}
      </DockContextProvider>
      <div className="dock-drop-indicator" style={dropRectStyle} />
    </div>
  );
});
