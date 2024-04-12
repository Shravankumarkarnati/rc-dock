import classNames from "classnames";
import Dropdown from "rc-dropdown";
import Menu, { MenuItem } from "rc-menu";
import Tabs from "rc-tabs";
import * as React from "react";
import { getFloatPanelSize } from "./Algorithm";
import { useDockContext } from "./DockData";
import { DockTabBar } from "./DockTabBar";
import DockTabPane from "./DockTabPane";
import { groupClassNames } from "./Utils";
import { isWindowBoxEnabled } from "./WindowBox";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import * as DragManager from "./dragdrop/DragManager";
function findParentPanel(element) {
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
function isPopupDiv(r) {
    var _a, _b, _c;
    return (r == null ||
        ((_a = r.parentElement) === null || _a === void 0 ? void 0 : _a.tagName) === "LI" ||
        ((_c = (_b = r.parentElement) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.tagName) === "LI");
}
const TabLabel = ({ data }) => {
    const ref = React.useRef(null);
    const setRef = React.useCallback((r) => {
        ref.current = isPopupDiv(r) ? null : r;
    }, []);
    const hitAreaRef = React.useRef(null);
    const setHitAreaRef = React.useCallback((r) => {
        hitAreaRef.current = isPopupDiv(r) ? null : r;
    }, []);
    const { dockMove, getGroup, getDockId, setDropRect } = useDockContext();
    const getDropDirection = React.useCallback((e) => {
        var _a;
        let rect = (_a = hitAreaRef.current) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        let midx = rect.left + rect.width * 0.5;
        return e.clientX > midx ? "after-tab" : "before-tab";
    }, []);
    const onCloseClick = React.useCallback((e) => {
        dockMove(data, null, "remove");
        e.stopPropagation();
    }, [data, dockMove]);
    const onDragStart = React.useCallback((e) => {
        let panel = data.parent;
        if (panel.parent.mode === "float" && panel.tabs.length === 1) {
            // when it's the only tab in a float panel, skip this drag, let parent tab bar handle it
            return;
        }
        let panelElement = findParentPanel(ref.current);
        let tabGroup = getGroup(data.group);
        let [panelWidth, panelHeight] = getFloatPanelSize(panelElement, tabGroup);
        e.setData({
            tab: data,
            panelSize: [panelWidth, panelHeight],
            tabGroup: data.group,
        }, getDockId());
        e.startDrag(ref.current.parentElement, ref.current.parentElement);
    }, [data, getDockId, getGroup]);
    const onDragOver = React.useCallback((e) => {
        var _a, _b;
        let dockId = getDockId();
        let tab = DragManager.DragState.getData("tab", dockId);
        let panel = DragManager.DragState.getData("panel", dockId);
        let group;
        if (tab) {
            panel = tab.parent;
            group = tab.group;
        }
        else {
            // drag whole panel
            if (!panel) {
                return;
            }
            if (panel === null || panel === void 0 ? void 0 : panel.panelLock) {
                e.reject();
                return;
            }
            group = panel.group;
        }
        let tabGroup = getGroup(group);
        if (group !== data.group) {
            e.reject();
        }
        else if ((tabGroup === null || tabGroup === void 0 ? void 0 : tabGroup.floatable) === "singleTab" && ((_b = (_a = data.parent) === null || _a === void 0 ? void 0 : _a.parent) === null || _b === void 0 ? void 0 : _b.mode) === "float") {
            e.reject();
        }
        else if (tab && tab !== data) {
            let direction = getDropDirection(e);
            setDropRect(hitAreaRef.current, direction, this);
            e.accept("");
        }
        else if (panel && panel !== data.parent) {
            let direction = getDropDirection(e);
            setDropRect(hitAreaRef.current, direction, this);
            e.accept("");
        }
    }, [data, getDockId, getDropDirection, getGroup, setDropRect]);
    const onDragLeave = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (e) => {
        setDropRect(null, "remove", this);
    }, [setDropRect]);
    const onDrop = React.useCallback((e) => {
        let dockId = getDockId();
        let panel;
        let tab = DragManager.DragState.getData("tab", dockId);
        if (tab) {
            panel = tab.parent;
        }
        else {
            panel = DragManager.DragState.getData("panel", dockId);
        }
        if (tab && tab !== data) {
            let direction = getDropDirection(e);
            dockMove(tab, data, direction);
        }
        else if (panel && panel !== data.parent) {
            let direction = getDropDirection(e);
            dockMove(panel, data, direction);
        }
    }, [data, dockMove, getDockId, getDropDirection]);
    let { id, title, closable, parent } = data;
    return (React.createElement(DragDropDiv, { getRef: setRef, onDragStartT: onDragStart, role: "tab", "aria-selected": parent.activeId === id, onDragOverT: onDragOver, onDropT: onDrop, onDragLeaveT: onDragLeave },
        title,
        closable ? React.createElement("div", { className: "dock-tab-close-btn", onClick: onCloseClick }) : null,
        React.createElement("div", { className: "dock-tab-hit-area", ref: setHitAreaRef })));
};
export const DockTabs = ({ panelData, onPanelDragEnd, onPanelDragMove, onPanelDragStart, }) => {
    const context = useDockContext();
    const { dockMove, onSilentChange, getGroup } = context;
    const onMaximizeClick = React.useCallback((e) => {
        dockMove(panelData, null, "maximize");
        // prevent the focus change logic
        e.stopPropagation();
    }, [dockMove, panelData]);
    const onNewWindowClick = React.useCallback(() => {
        dockMove(panelData, null, "new-window");
    }, [dockMove, panelData]);
    const addNewWindowMenu = React.useCallback((element, showWithLeftClick) => {
        const nativeMenu = (React.createElement(Menu, { onClick: onNewWindowClick },
            React.createElement(MenuItem, null, "New Window")));
        return (React.createElement(Dropdown, { prefixCls: "dock-dropdown", overlay: nativeMenu, trigger: showWithLeftClick ? ["contextMenu", "click"] : ["contextMenu"], mouseEnterDelay: 0.1, mouseLeaveDelay: 0.1 }, element));
    }, [onNewWindowClick]);
    const renderTabBar = React.useCallback((props, TabNavList) => {
        let { group: groupName, panelLock } = panelData;
        let group = getGroup(groupName);
        let { panelExtra } = group;
        let maximizable = group.maximizable;
        if (panelData.parent.mode === "window") {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            onPanelDragStart = null;
            maximizable = false;
        }
        if (panelLock) {
            if (panelLock.panelExtra) {
                panelExtra = panelLock.panelExtra;
            }
        }
        let showNewWindowButton = group.newWindow && isWindowBoxEnabled() && panelData.parent.mode === "float";
        let panelExtraContent;
        if (panelExtra) {
            panelExtraContent = panelExtra(panelData, context);
        }
        else if (maximizable || showNewWindowButton) {
            panelExtraContent = (React.createElement("div", { className: panelData.parent.mode === "maximize" ? "dock-panel-min-btn" : "dock-panel-max-btn", onClick: maximizable ? onMaximizeClick : null }));
            if (showNewWindowButton) {
                panelExtraContent = addNewWindowMenu(panelExtraContent, !maximizable);
            }
        }
        return (React.createElement(DockTabBar, Object.assign({ onDragStart: onPanelDragStart, onDragMove: onPanelDragMove, onDragEnd: onPanelDragEnd, TabNavList: TabNavList, isMaximized: panelData.parent.mode === "maximize" }, props, { extra: panelExtraContent })));
    }, [panelData, onPanelDragStart, onPanelDragMove, onPanelDragEnd, panelData, context, getGroup]);
    const onTabChange = React.useCallback((activeId) => {
        panelData.activeId = activeId;
        onSilentChange(activeId, "active");
    }, [panelData, onSilentChange]);
    let { group, tabs, activeId } = panelData;
    let tabGroup = getGroup(group);
    let { animated, moreIcon } = tabGroup;
    if (animated == null) {
        animated = true;
    }
    if (!moreIcon) {
        moreIcon = "...";
    }
    let items = React.useMemo(() => tabs.map((tab) => ({
        key: tab.id,
        label: React.createElement(TabLabel, { data: tab }),
        children: (React.createElement(DockTabPane, { key: tab.id, cacheId: tab.id, cached: tab.cached }, typeof tab.content === "function" ? tab.content(tab) : tab.content)),
    })), [tabs]);
    return (React.createElement(Tabs, { prefixCls: "dock", more: { icon: moreIcon }, animated: animated, renderTabBar: renderTabBar, activeKey: activeId, onChange: onTabChange, popupClassName: classNames(groupClassNames(group)), items: items }));
};
