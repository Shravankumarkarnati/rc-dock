import classNames from "classnames";
import Dropdown from "rc-dropdown";
import Menu, { MenuItem } from "rc-menu";
import Tabs, { TabsProps } from "rc-tabs";
import * as React from "react";
import { getFloatPanelSize } from "./Algorithm";
import { DropDirection, PanelData, TabData, useDockContext } from "./DockData";
import { DockTabBar } from "./DockTabBar";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import * as DragManager from "./dragdrop/DragManager";
import { useForceUpdate } from "./UseForceUpdate";
import { groupClassNames } from "./Utils";
import { isWindowBoxEnabled } from "./WindowBox";
import DockTabPane, { getStyles } from "./DockTabPane";

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

type Tab = TabsProps["items"][0];

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

  const tabGroup = context.getGroup(group);

  const renderTabBar: TabsProps["renderTabBar"] = React.useCallback(
    (props, TabNavList) => {
      const { panelLock } = panelData;
      const group = tabGroup;
      let { panelExtra } = group;

      let maximizable = group.maximizable;
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
        for (const tab of panelData.tabs) {
          context.dockMove(tab, null, "remove");
        }
      };

      const showNewWindowButton =
        group.newWindow &&
        isWindowBoxEnabled() &&
        panelData.parent.mode === "float";

      let panelExtraContent: React.ReactElement;
      if (panelExtra) {
        panelExtraContent = panelExtra(panelData, context);
      } else if (maximizable || showNewWindowButton) {
        const onMaximizeClick = (e: React.MouseEvent) => {
          context.dockMove(panelData, null, "maximize");
          // prevent the focus change logic
          e.stopPropagation();
        };

        let maxBtn = (
          <div
            className={
              panelData.parent.mode === "maximize"
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
        if (
          panelData.parent.mode === "float" &&
          !panelData.tabs.find((tab) => !tab.closable)
        ) {
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
          isMaximized={panelData.parent.mode === "maximize"}
          {...props}
          extra={panelExtraContent}
        />
      );
    },
    [
      panelData,
      tabGroup,
      context,
      onPanelDragStart,
      onPanelDragEnd,
      onPanelDragMove,
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

  const items: Tab[] = React.useMemo(() => {
    return tabs.map((tab) => {
      const { id, content, cached } = tab;
      const children = typeof content === "function" ? content(tab) : content;

      const active = activeId === id;

      return {
        key: id,
        label: <TabLabel data={tab} />,
        children: (
          <DockTabPane id={id} cached={cached} active={active}>
            {children}
          </DockTabPane>
        ),
        style: getStyles(active, true),
      };
    });
  }, [tabs, activeId]);

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

type TabLabelProps = {
  data: TabData;
};

const TabLabel = React.memo(function _TabLabel({ data }: TabLabelProps) {
  const [_ref, setRef] = React.useState<null | HTMLDivElement>(null);
  const [_hitAreaRef, setHitAreaRef] = React.useState<null | HTMLDivElement>(
    null
  );

  const context = useDockContext();

  const getRef = React.useCallback((_r: HTMLDivElement | null) => {
    if (isPopupDiv(_r)) {
      return;
    }
    setRef(_r);
  }, []);

  const getHitAreaRef = React.useCallback((_r: HTMLDivElement | null) => {
    if (isPopupDiv(_r)) {
      return;
    }
    setHitAreaRef(_r);
  }, []);

  const onCloseClick = React.useCallback(
    (e: React.MouseEvent) => {
      context.dockMove(data, null, "remove");
      e.stopPropagation();
    },
    [data, context.dockMove]
  );

  const onDragStart = React.useCallback(
    (e: DragManager.DragState) => {
      if (!_ref) return;

      const panel = data.parent;
      if (panel.parent.mode === "float" && panel.tabs.length === 1) {
        // when it's the only tab in a float panel, skip this drag, const parent tab bar handle it
        return;
      }
      const panelElement = findParentPanel(_ref);
      const tabGroup = context.getGroup(data.group);
      const [panelWidth, panelHeight] = getFloatPanelSize(
        panelElement,
        tabGroup
      );

      e.setData(
        {
          tab: data,
          panelSize: [panelWidth, panelHeight],
          tabGroup: data.group,
        },
        context.getDockId()
      );
      e.startDrag(_ref.parentElement, _ref.parentElement);
    },
    [_ref, data, context.getGroup, context.getDockId]
  );

  const getDropDirection = React.useCallback(
    (e: DragManager.DragState): DropDirection => {
      if (!_hitAreaRef) return;

      const rect = _hitAreaRef.getBoundingClientRect();
      const midx = rect.left + rect.width * 0.5;
      return e.clientX > midx ? "after-tab" : "before-tab";
    },
    [_hitAreaRef]
  );

  const onDragOver = React.useCallback(
    (e: DragManager.DragState) => {
      if (!_ref || !_hitAreaRef) return;

      const dockId = context.getDockId();
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
      const tabGroup = context.getGroup(group);
      if (group !== data.group) {
        e.reject();
      } else if (
        tabGroup?.floatable === "singleTab" &&
        data.parent?.parent?.mode === "float"
      ) {
        e.reject();
      } else if (tab && tab !== data) {
        const direction = getDropDirection(e);
        context.setDropRect(_hitAreaRef, direction, _ref);
        e.accept("");
      } else if (panel && panel !== data.parent) {
        const direction = getDropDirection(e);
        context.setDropRect(_hitAreaRef, direction, _ref);
        e.accept("");
      }
    },
    [
      _hitAreaRef,
      _ref,
      data,
      context.getGroup,
      context.getDockId,
      context.setDropRect,
      getDropDirection,
    ]
  );

  const onDragLeave = React.useCallback(
    (e: DragManager.DragState) => {
      if (!_ref) return;

      context.setDropRect(null, "remove", _ref);
    },
    [_ref]
  );

  const onDrop = React.useCallback(
    (e: DragManager.DragState) => {
      const dockId = context.getDockId();
      let panel: PanelData;
      const tab: TabData = DragManager.DragState.getData("tab", dockId);
      if (tab) {
        panel = tab.parent;
      } else {
        panel = DragManager.DragState.getData("panel", dockId);
      }
      if (tab && tab !== data) {
        const direction = getDropDirection(e);
        context.dockMove(tab, data, direction);
      } else if (panel && panel !== data.parent) {
        const direction = getDropDirection(e);
        context.dockMove(panel, data, direction);
      }
    },
    [data, context.getDockId, context.dockMove, getDropDirection]
  );

  const { id, title, closable, parent } = data;

  const isInWindowPanel = parent.parent.mode === "window";

  return (
    <DragDropDiv
      getRef={getRef}
      role="tab"
      aria-selected={parent.activeId === id}
      onDragStartT={isInWindowPanel ? null : onDragStart}
      onDragOverT={isInWindowPanel ? null : onDragOver}
      onDropT={isInWindowPanel ? null : onDrop}
      onDragLeaveT={isInWindowPanel ? null : onDragLeave}
    >
      {title}
      {closable ? (
        <div className="dock-tab-close-btn" onClick={onCloseClick} />
      ) : null}
      <div className="dock-tab-hit-area" ref={getHitAreaRef} />
    </DragDropDiv>
  );
});
