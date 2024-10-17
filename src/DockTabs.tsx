import classNames from "classnames";
import Dropdown from "rc-dropdown";
import Menu, { MenuItem } from "rc-menu";
import Tabs, { TabsProps } from "rc-tabs";
import * as React from "react";
import { getFloatPanelSize } from "./Algorithm";
import {
  DockContext,
  DropDirection,
  PanelData,
  TabData,
  useDockContext,
} from "./DockData";
import { DockTabBar } from "./DockTabBar";
import DockTabPane from "./DockTabPane";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import * as DragManager from "./dragdrop/DragManager";
import { groupClassNames } from "./Utils";
import { isWindowBoxEnabled } from "./WindowBox";
import { useForceUpdate } from "./UseForceUpdate";

function findParentPanel(element: HTMLElement) {
  for (let i = 0; i < 10; ++i) {
    if (!element) {
      return null;
    }
    if (element.classList.contains("dock-panel")) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

function isPopupDiv(r: HTMLDivElement): boolean {
  return (
    r == null ||
    r.parentElement?.tagName === "LI" ||
    r.parentElement?.parentElement?.tagName === "LI"
  );
}

type Tab = Pick<
  NonNullable<TabsProps["items"]>[0],
  | "key"
  | "forceRender"
  | "style"
  | "className"
  | "destroyInactiveTabPane"
  | "children"
  | "label"
>;

type RenderTabBar = NonNullable<TabsProps["renderTabBar"]>;

export class TabCache {
  _ref: HTMLDivElement;
  getRef = (r: HTMLDivElement) => {
    if (isPopupDiv(r)) {
      return;
    }
    this._ref = r;
  };

  _hitAreaRef: HTMLDivElement;
  getHitAreaRef = (r: HTMLDivElement) => {
    if (isPopupDiv(r)) {
      return;
    }
    this._hitAreaRef = r;
  };

  data: TabData;
  context: DockContext;
  content: React.ReactElement;
  label: React.ReactNode;

  constructor(context: DockContext) {
    this.context = context;
  }

  setData(data: TabData) {
    if (data !== this.data) {
      this.data = data;
      [this.content, this.label] = this.render();
      return true;
    }
    return false;
  }

  onCloseClick = (e: React.MouseEvent) => {
    this.context.dockMove(this.data, null, "remove");
    e.stopPropagation();
  };

  onDragStart = (e: DragManager.DragState) => {
    const panel = this.data.parent;
    if (panel.parent.mode === "float" && panel.tabs.length === 1) {
      // when it's the only tab in a float panel, skip this drag, const parent tab bar handle it
      return;
    }
    const panelElement = findParentPanel(this._ref);
    const tabGroup = this.context.getGroup(this.data.group);
    const [panelWidth, panelHeight] = getFloatPanelSize(panelElement, tabGroup);

    e.setData(
      {
        tab: this.data,
        panelSize: [panelWidth, panelHeight],
        tabGroup: this.data.group,
      },
      this.context.getDockId()
    );
    e.startDrag(this._ref.parentElement, this._ref.parentElement);
  };
  onDragOver = (e: DragManager.DragState) => {
    const dockId = this.context.getDockId();
    const tab: TabData = DragManager.DragState.getData("tab", dockId);
    let panel: PanelData = DragManager.DragState.getData("panel", dockId);
    let group: string;
    if (tab) {
      panel = tab.parent;
      group = tab.group;
    } else {
      // drag whole panel
      if (!panel) {
        return;
      }
      if (panel?.panelLock) {
        e.reject();
        return;
      }
      group = panel.group;
    }
    const tabGroup = this.context.getGroup(group);
    if (group !== this.data.group) {
      e.reject();
    } else if (
      tabGroup?.floatable === "singleTab" &&
      this.data.parent?.parent?.mode === "float"
    ) {
      e.reject();
    } else if (tab && tab !== this.data) {
      const direction = this.getDropDirection(e);
      this.context.setDropRect(this._hitAreaRef, direction, this);
      e.accept("");
    } else if (panel && panel !== this.data.parent) {
      const direction = this.getDropDirection(e);
      this.context.setDropRect(this._hitAreaRef, direction, this);
      e.accept("");
    }
  };
  onDragLeave = (e: DragManager.DragState) => {
    this.context.setDropRect(null, "remove", this);
  };
  onDrop = (e: DragManager.DragState) => {
    const dockId = this.context.getDockId();
    let panel: PanelData;
    const tab: TabData = DragManager.DragState.getData("tab", dockId);
    if (tab) {
      panel = tab.parent;
    } else {
      panel = DragManager.DragState.getData("panel", dockId);
    }
    if (tab && tab !== this.data) {
      const direction = this.getDropDirection(e);
      this.context.dockMove(tab, this.data, direction);
    } else if (panel && panel !== this.data.parent) {
      const direction = this.getDropDirection(e);
      this.context.dockMove(panel, this.data, direction);
    }
  };

  getDropDirection(e: DragManager.DragState): DropDirection {
    const rect = this._hitAreaRef.getBoundingClientRect();
    const midx = rect.left + rect.width * 0.5;
    return e.clientX > midx ? "after-tab" : "before-tab";
  }

  render() {
    const { id, title, closable, cached, parent } = this.data;
    let { content } = this.data;
    let { onDragStart, onDragOver, onDrop, onDragLeave } = this;
    if (parent.parent.mode === "window") {
      onDragStart = null;
      onDragOver = null;
      onDrop = null;
      onDragLeave = null;
    }
    if (typeof content === "function") {
      content = content(this.data);
    }
    const label = (
      <DragDropDiv
        getRef={this.getRef}
        onDragStartT={onDragStart}
        role="tab"
        aria-selected={parent.activeId === id}
        onDragOverT={onDragOver}
        onDropT={onDrop}
        onDragLeaveT={onDragLeave}
      >
        {title}
        {closable ? (
          <div className="dock-tab-close-btn" onClick={this.onCloseClick} />
        ) : null}
        <div className="dock-tab-hit-area" ref={this.getHitAreaRef} />
      </DragDropDiv>
    );
    const _content = (
      <DockTabPane key={id} cacheId={id} cached={cached} tab={label}>
        {content}
      </DockTabPane>
    );

    return [_content, label];
  }

  destroy() {
    // place holder
  }
}

interface Props {
  panelData: PanelData;
  onPanelDragStart: DragManager.DragHandler;
  onPanelDragMove: DragManager.DragHandler;
  onPanelDragEnd: DragManager.DragHandler;
}

export const DockTabs = React.memo(function DockTabBase(props: Props) {
  let { panelData, onPanelDragStart, onPanelDragEnd, onPanelDragMove } = props;
  const { group, tabs, activeId } = panelData;

  const forceUpdate = useForceUpdate();

  const context = useDockContext();

  const [cache, setCache] = React.useState(new Map<string, TabCache>());
  React.useEffect(() => {
    // updateTabs
    setCache((prev) => {
      const newCache = new Map<string, TabCache>();

      let reused = 0;
      for (const tabData of tabs) {
        const { id } = tabData;
        if (prev.has(id)) {
          const tab = prev.get(id);
          newCache.set(id, tab);
          tab.setData(tabData);
          ++reused;
        } else {
          const tab = new TabCache(context);
          newCache.set(id, tab);
          tab.setData(tabData);
        }
      }
      if (reused !== prev.size) {
        for (const [id, tab] of prev) {
          if (!newCache.has(id)) {
            tab.destroy();
          }
        }
      }

      return newCache;
    });
  }, [context, tabs]);

  const tabGroup = context.getGroup(group);

  const onMaximizeClick = React.useCallback(
    (e: React.MouseEvent) => {
      context.dockMove(panelData, null, "maximize");
      // prevent the focus change logic
      e.stopPropagation();
    },
    [context.dockMove, panelData]
  );

  const renderTabBar: RenderTabBar = React.useCallback(
    (props, TabNavList) => {
      const { panelLock, tabs, parent } = panelData;
      let { panelExtra, maximizable, newWindow } = tabGroup;

      if (panelData.parent.mode === "window") {
        onPanelDragStart = null;
        maximizable = false;
      }

      if (panelLock) {
        if (panelLock.panelExtra) {
          panelExtra = panelLock.panelExtra;
        }
      }

      const onCloseAll = () => {
        for (const tab of tabs) {
          context.dockMove(tab, null, "remove");
        }
      };

      const showNewWindowButton =
        newWindow && isWindowBoxEnabled() && parent.mode === "float";

      let panelExtraContent: React.ReactElement;
      if (panelExtra) {
        panelExtraContent = panelExtra(panelData, context);
      } else if (maximizable || showNewWindowButton) {
        let maxBtn = (
          <div
            className={
              parent.mode === "maximize"
                ? "dock-panel-min-btn"
                : "dock-panel-max-btn"
            }
            onClick={maximizable ? onMaximizeClick : null}
          />
        );
        if (showNewWindowButton) {
          const addNewWindowMenu = (
            element: React.ReactElement,
            showWithLeftClick: boolean
          ) => {
            const onNewWindowClick = () =>
              context.dockMove(panelData, null, "new-window");

            const nativeMenu = (
              <Menu onClick={onNewWindowClick}>
                <MenuItem>New Window</MenuItem>
              </Menu>
            );

            return (
              <Dropdown
                prefixCls="dock-dropdown"
                overlay={nativeMenu}
                trigger={
                  showWithLeftClick ? ["contextMenu", "click"] : ["contextMenu"]
                }
                mouseEnterDelay={0.1}
                mouseLeaveDelay={0.1}
              >
                {element}
              </Dropdown>
            );
          };

          maxBtn = addNewWindowMenu(maxBtn, !maximizable);
        }
        if (parent.mode === "float" && !tabs.find((tab) => !tab.closable)) {
          panelExtraContent = (
            <>
              {maxBtn}
              <div className="dock-tab-close-btn" onClick={onCloseAll} />
            </>
          );
        } else {
          panelExtraContent = maxBtn;
        }
      }

      return (
        <DockTabBar
          onDragStart={onPanelDragStart}
          onDragMove={onPanelDragMove}
          onDragEnd={onPanelDragEnd}
          TabNavList={TabNavList}
          isMaximized={parent.mode === "maximize"}
          {...props}
          extra={panelExtraContent}
        />
      );
    },
    [
      panelData,
      tabGroup,
      onPanelDragStart,
      onPanelDragEnd,
      onPanelDragMove,
      context,
    ]
  );

  const onTabChange = React.useCallback(
    (activeId: string) => {
      props.panelData.activeId = activeId;
      context.onSilentChange(activeId, "active");
      forceUpdate();
    },
    [props.panelData, context.onSilentChange, forceUpdate]
  );

  let { animated, moreIcon } = tabGroup;
  if (animated == null) {
    animated = true;
  }
  if (!moreIcon) {
    moreIcon = "...";
  }

  const items: Tab[] = [...cache.entries()].map(([key, cache]) => ({
    key,
    label: cache.label,
    children: cache.content,
  }));

  return (
    <Tabs
      prefixCls="dock"
      more={{ icon: moreIcon }}
      animated={animated}
      renderTabBar={renderTabBar}
      activeKey={activeId}
      onChange={onTabChange}
      popupClassName={classNames(groupClassNames(group))}
      items={items}
    />
  );
});
