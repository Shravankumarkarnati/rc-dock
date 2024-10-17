import debounce from "lodash/debounce";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Algorithm from "./Algorithm";
import { DockBox } from "./DockBox";
import {
  BoxData,
  defaultGroup,
  DockContext,
  DockContextProvider,
  DropDirection,
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
} from "./DockData";
import { DockPortalManager } from "./DockPortalManager";
import * as DragManager from "./dragdrop/DragManager";
import { DroppingPanel } from "./DroppingPanel";
import { FloatBox } from "./FloatBox";
import { MaxBox } from "./MaxBox";
import * as Serializer from "./Serializer";
import { useForceUpdate } from "./UseForceUpdate";
import { WindowBox } from "./WindowBox";

export interface LayoutProps {
  /**
   * when there are multiple DockLayout, by default, you can't drag panel between them
   * but if you assign same dockId, it will allow panels to be dragged from one layout to another
   */
  dockId?: string;

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

type DockRef = {
  saveLayout(): LayoutBase;
  loadLayout(savedLayout: LayoutBase): void;
} & Pick<DockContext, "dockMove" | "find" | "updateTab">;

interface LayoutState {
  layout: LayoutData;
  /** @ignore */
  dropRect?: {
    left: number;
    width: number;
    top: number;
    height: number;
    element: HTMLElement;
    source?: any;
    direction?: DropDirection;
  };
}

const DockLayoutBase = React.forwardRef<DockRef, LayoutProps>(
  function _DockLayout(props, ref) {
    const forceUpdate = useForceUpdate();

    let {
      groups,
      loadTab,
      dockId,
      style,
      maximizeTo,
      layout,
      onLayoutChange,
      saveTab,
      afterPanelSaved,
      dropMode,
      defaultLayout,
    } = props;

    const [_ref, setRef] = React.useState<HTMLDivElement | null>(null);
    const [state, setState] = React.useState<LayoutState>(() => {
      let preparedLayout: LayoutData;
      if (defaultLayout) {
        preparedLayout = prepareInitData(props.defaultLayout, groups, loadTab);
      } else if (!loadTab) {
        throw new Error(
          "DockLayout.loadTab and DockLayout.defaultLayout should not both be undefined."
        );
      }

      if (layout) {
        // controlled layout
        return {
          layout: loadLayoutData(layout, props),
          dropRect: null,
        };
      } else {
        return {
          layout: preparedLayout,
          dropRect: null,
        };
      }
    });

    /** @ignore
     * layout state doesn't change instantly after setState, use this to make sure the correct layout is
     */
    const tempLayout = React.useRef<null | LayoutData>(null);
    const panelToFocus = React.useRef<null | string>(null);

    const getRootElement = React.useCallback(() => _ref, [_ref]);
    const getDockId = React.useCallback(() => dockId, [dockId]);
    const useEdgeDrop = React.useCallback(
      () => dropMode === "edge",
      [dropMode]
    );
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
      (): LayoutData => tempLayout.current || state.layout,
      [state.layout]
    );

    const setLayout = React.useCallback((layout: LayoutData) => {
      tempLayout.current = layout;
      setState((prev) => ({ ...prev, layout }));
    }, []);

    const find: DockContext["find"] = React.useCallback(
      (id, filter): PanelData | TabData | BoxData | undefined =>
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
      [layout, onLayoutChange, saveTab, afterPanelSaved, forceUpdate, setLayout]
    );

    const dockMove: DockContext["dockMove"] = React.useCallback(
      (source, target, direction, floatPosition) => {
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
            if (_ref) {
              layout = Algorithm.fixFloatPanelPos(
                layout,
                _ref.offsetWidth,
                _ref.offsetHeight
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
      },
      [getLayout, find, _ref, groups, changeLayout, state.dropRect]
    );

    const getLayoutSize = React.useCallback((): LayoutSize => {
      if (_ref) {
        return { width: _ref.offsetWidth, height: _ref.offsetHeight };
      }
      return { width: 0, height: 0 };
    }, [_ref]);

    const updateTab: DockContext["updateTab"] = React.useCallback(
      (id, newTab, makeActive) => {
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
      [find, loadTab, getLayout, groups, changeLayout]
    );

    const navigateToPanel: DockContext["navigateToPanel"] = React.useCallback(
      (fromElement, direction) => {
        if (!direction) {
          if (!fromElement) {
            fromElement = _ref.querySelector(".dock-tab-active>.dock-tab-btn");
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
        let panels = Array.from(_ref.querySelectorAll(selector));

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
          targetTab = match.panel.querySelector(
            ".dock-tab-active>.dock-tab-btn"
          );
          if (targetTab) {
            break;
          }
        }

        if (targetTab) {
          targetTab.focus();
        }
      },
      [_ref]
    );

    const setDropRect: DockContext["setDropRect"] = React.useCallback(
      (element, direction, source, event, panelSize) => {
        setState((prev) => {
          let dropRect = prev.dropRect;
          if (dropRect) {
            if (direction === "remove") {
              if (dropRect.source === source) {
                return { ...prev, dropRect: null };
              }
              return prev;
            } else if (
              dropRect.element === element &&
              dropRect.direction === direction &&
              direction !== "float"
            ) {
              // skip duplicated update except for float dragging
              return prev;
            }
          }
          if (!element) {
            return { ...prev, dropRect: null };
          }
          let layoutRect = _ref.getBoundingClientRect();
          let scaleX = _ref.offsetWidth / layoutRect.width;
          let scaleY = _ref.offsetHeight / layoutRect.height;

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

          return {
            ...prev,
            dropRect: { left, top, width, height, element, source, direction },
          };
        });
      },
      [_ref]
    );

    const onSilentChange: DockContext["onSilentChange"] = React.useCallback(
      (currentTabId = null, direction) => {
        if (onLayoutChange) {
          changeLayout(getLayout(), currentTabId, direction, true);
        }
      },
      [onLayoutChange, getLayout, changeLayout]
    );

    const value: DockContext = React.useMemo(
      () => ({
        getDockId,
        getGroup,
        getRootElement,
        find,
        dockMove,
        getLayoutSize,
        updateTab,
        navigateToPanel,
        useEdgeDrop,
        setDropRect,
        onSilentChange,
      }),
      [
        getDockId,
        getGroup,
        getRootElement,
        find,
        dockMove,
        getLayoutSize,
        updateTab,
        navigateToPanel,
        useEdgeDrop,
        setDropRect,
        onSilentChange,
      ]
    );

    React.useEffect(() => {
      const _onWindowResize: any = debounce(() => {
        let layout = getLayout();

        if (_ref) {
          let newLayout = Algorithm.fixFloatPanelPos(
            layout,
            _ref.offsetWidth,
            _ref.offsetHeight
          );
          if (layout !== newLayout) {
            newLayout = Algorithm.fixLayoutData(newLayout, groups); // panel parent might need a fix
            changeLayout(newLayout, null, "move");
          }
        }
      }, 200);

      globalThis.addEventListener?.("resize", _onWindowResize);

      return () => {
        globalThis.removeEventListener?.("resize", _onWindowResize);
        _onWindowResize.cancel();
      };
    }, [getLayout, _ref, groups, changeLayout]);

    React.useEffect(() => {
      const onDragStateChange = (draggingScope: any) => {
        if (draggingScope == null) {
          DroppingPanel.droppingPanel = null;
          if (state.dropRect) {
            setState((prev) => ({ ...prev, dropRect: null }));
          }
        }
      };

      DragManager.addDragStateListener(onDragStateChange);

      return () => {
        DragManager.removeDragStateListener(onDragStateChange);
      };
    }, [state.dropRect]);

    React.useEffect(() => {
      // componentDidUpdate
      /** @ignore
       * move focus to panelToFocus
       */
      if (panelToFocus.current) {
        let panel = _ref.querySelector(
          `.dock-panel[data-dockid="${panelToFocus.current}"]`
        ) as HTMLElement;
        if (panel && !panel.contains(_ref.ownerDocument.activeElement)) {
          (panel.querySelector(".dock-bar") as HTMLElement)?.focus();
        }
        panelToFocus.current = null;
      }
    });

    /**
     * load layout
     * calling this api won't trigger the [[LayoutProps.onLayoutChange]] callback
     */
    const loadLayout = React.useCallback(
      (savedLayout: LayoutBase) => {
        if (_ref) {
          setLayout(
            loadLayoutData(
              savedLayout,
              props,
              _ref.offsetWidth,
              _ref.offsetHeight
            )
          );
        }
      },
      [setLayout, props, _ref]
    );

    const saveLayout = React.useCallback((): LayoutBase => {
      return Serializer.saveLayoutData(
        getLayout(),
        props.saveTab,
        props.afterPanelSaved
      );
    }, [getLayout, props.saveTab, props.afterPanelSaved]);

    //public api
    React.useImperativeHandle(
      ref,
      React.useCallback(
        () => ({
          dockMove,
          find,
          loadLayout,
          saveLayout,
          updateTab,
        }),
        [dockMove, find, loadLayout, saveLayout, updateTab]
      )
    );

    // render
    // clear tempLayout
    tempLayout.current = null;

    let dropRectStyle: React.CSSProperties;
    if (state.dropRect) {
      let { element, direction, ...rect } = state.dropRect;
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
        <MaxBox boxData={state.layout.maxbox} />,
        maximizeTo
      );
    } else {
      maximize = <MaxBox boxData={state.layout.maxbox} />;
    }

    return (
      <div ref={setRef} className="dock-layout" style={style}>
        <DockContextProvider value={value}>
          <DockPortalManager>
            <DockBox size={1} boxData={state.layout.dockbox} />
            <FloatBox boxData={state.layout.floatbox} />
            <WindowBox boxData={state.layout.windowbox} />
            {maximize}
          </DockPortalManager>
        </DockContextProvider>
        <div className="dock-drop-indicator" style={dropRectStyle} />
      </div>
    );
  }
);

export const DockLayout = React.memo(DockLayoutBase);

function prepareInitData(
  data: LayoutData,
  groups: LayoutProps["groups"],
  loadTab: LayoutProps["loadTab"]
): LayoutData {
  let _layout = { ...data };
  Algorithm.fixLayoutData(_layout, groups, loadTab);
  return _layout;
}

function loadLayoutData(
  savedLayout: LayoutBase,
  props: LayoutProps,
  width = 0,
  height = 0
): LayoutData {
  let { defaultLayout, loadTab, afterPanelLoaded, groups } = props;
  let layout = Serializer.loadLayoutData(
    savedLayout,
    defaultLayout,
    loadTab,
    afterPanelLoaded
  );
  layout = Algorithm.fixFloatPanelPos(layout, width, height);
  layout = Algorithm.fixLayoutData(layout, groups);
  layout.loadedFrom = savedLayout;
  return layout;
}
