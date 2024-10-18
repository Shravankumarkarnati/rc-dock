import classNames from "classnames";
import Dropdown from "rc-dropdown";
import Menu, { MenuItem } from "rc-menu";
import Tabs from "rc-tabs";
import * as React from "react";
import { getFloatPanelSize } from "./Algorithm";
import { useDockContext } from "./DockData";
import { DockTabBar } from "./DockTabBar";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import * as DragManager from "./dragdrop/DragManager";
import { useForceUpdate } from "./UseForceUpdate";
import { groupClassNames } from "./Utils";
import { isWindowBoxEnabled } from "./WindowBox";
import DockTabPane, { getStyles } from "./DockTabPane";
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
export const DockTabs = React.memo(function DockTabBase(props) {
    let { panelData, onPanelDragStart, onPanelDragEnd, onPanelDragMove } = props;
    const { group, tabs, activeId } = panelData;
    const forceUpdate = useForceUpdate();
    const context = useDockContext();
    const tabGroup = context.getGroup(group);
    const renderTabBar = React.useCallback((props, TabNavList) => {
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
        const showNewWindowButton = group.newWindow &&
            isWindowBoxEnabled() &&
            panelData.parent.mode === "float";
        let panelExtraContent;
        if (panelExtra) {
            panelExtraContent = panelExtra(panelData, context);
        }
        else if (maximizable || showNewWindowButton) {
            const onMaximizeClick = (e) => {
                context.dockMove(panelData, null, "maximize");
                // prevent the focus change logic
                e.stopPropagation();
            };
            let maxBtn = (React.createElement("div", { className: panelData.parent.mode === "maximize"
                    ? "dock-panel-min-btn"
                    : "dock-panel-max-btn", onClick: maximizable ? onMaximizeClick : null }));
            if (showNewWindowButton) {
                const addNewWindowMenu = (element, showWithLeftClick) => {
                    const onNewWindowClick = () => context.dockMove(panelData, null, "new-window");
                    const nativeMenu = (React.createElement(Menu, { onClick: onNewWindowClick },
                        React.createElement(MenuItem, null, "New Window")));
                    return (React.createElement(Dropdown, { prefixCls: "dock-dropdown", overlay: nativeMenu, trigger: showWithLeftClick ? ["contextMenu", "click"] : ["contextMenu"], mouseEnterDelay: 0.1, mouseLeaveDelay: 0.1 }, element));
                };
                maxBtn = addNewWindowMenu(maxBtn, !maximizable);
            }
            if (panelData.parent.mode === "float" &&
                !panelData.tabs.find((tab) => !tab.closable)) {
                panelExtraContent = (React.createElement(React.Fragment, null,
                    maxBtn,
                    React.createElement("div", { className: "dock-tab-close-btn", onClick: onCloseAll })));
            }
            else {
                panelExtraContent = maxBtn;
            }
        }
        return (React.createElement(DockTabBar, Object.assign({ onDragStart: onPanelDragStart, onDragMove: onPanelDragMove, onDragEnd: onPanelDragEnd, TabNavList: TabNavList, isMaximized: panelData.parent.mode === "maximize" }, props, { extra: panelExtraContent })));
    }, [
        panelData,
        tabGroup,
        context,
        onPanelDragStart,
        onPanelDragEnd,
        onPanelDragMove,
    ]);
    const onTabChange = React.useCallback((activeId) => {
        props.panelData.activeId = activeId;
        context.onSilentChange(activeId, "active");
        forceUpdate();
    }, [props.panelData, context.onSilentChange, forceUpdate]);
    let { animated, moreIcon } = tabGroup;
    if (animated == null) {
        animated = true;
    }
    if (!moreIcon) {
        moreIcon = "...";
    }
    const items = React.useMemo(() => {
        return tabs.map((tab) => {
            const { id, content, cached } = tab;
            const children = typeof content === "function" ? content(tab) : content;
            const active = activeId === id;
            return {
                key: id,
                label: React.createElement(TabLabel, { data: tab }),
                children: (React.createElement(DockTabPane, { id: id, cached: cached, active: active }, children)),
                style: getStyles(active, true),
            };
        });
    }, [tabs, activeId]);
    return (React.createElement(Tabs, { prefixCls: "dock", more: { icon: moreIcon }, animated: animated, renderTabBar: renderTabBar, activeKey: activeId, onChange: onTabChange, popupClassName: classNames(groupClassNames(group)), items: items }));
});
const TabLabel = React.memo(function _TabLabel({ data }) {
    const [_ref, setRef] = React.useState(null);
    const [_hitAreaRef, setHitAreaRef] = React.useState(null);
    const context = useDockContext();
    const getRef = React.useCallback((_r) => {
        if (isPopupDiv(_r)) {
            return;
        }
        setRef(_r);
    }, []);
    const getHitAreaRef = React.useCallback((_r) => {
        if (isPopupDiv(_r)) {
            return;
        }
        setHitAreaRef(_r);
    }, []);
    const onCloseClick = React.useCallback((e) => {
        context.dockMove(data, null, "remove");
        e.stopPropagation();
    }, [data, context.dockMove]);
    const onDragStart = React.useCallback((e) => {
        if (!_ref)
            return;
        const panel = data.parent;
        if (panel.parent.mode === "float" && panel.tabs.length === 1) {
            // when it's the only tab in a float panel, skip this drag, const parent tab bar handle it
            return;
        }
        const panelElement = findParentPanel(_ref);
        const tabGroup = context.getGroup(data.group);
        const [panelWidth, panelHeight] = getFloatPanelSize(panelElement, tabGroup);
        e.setData({
            tab: data,
            panelSize: [panelWidth, panelHeight],
            tabGroup: data.group,
        }, context.getDockId());
        e.startDrag(_ref.parentElement, _ref.parentElement);
    }, [_ref, data, context.getGroup, context.getDockId]);
    const getDropDirection = React.useCallback((e) => {
        if (!_hitAreaRef)
            return;
        const rect = _hitAreaRef.getBoundingClientRect();
        const midx = rect.left + rect.width * 0.5;
        return e.clientX > midx ? "after-tab" : "before-tab";
    }, [_hitAreaRef]);
    const onDragOver = React.useCallback((e) => {
        var _a, _b;
        if (!_ref || !_hitAreaRef)
            return;
        const dockId = context.getDockId();
        const tab = DragManager.DragState.getData("tab", dockId);
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
        const tabGroup = context.getGroup(group);
        if (group !== data.group) {
            e.reject();
        }
        else if ((tabGroup === null || tabGroup === void 0 ? void 0 : tabGroup.floatable) === "singleTab" &&
            ((_b = (_a = data.parent) === null || _a === void 0 ? void 0 : _a.parent) === null || _b === void 0 ? void 0 : _b.mode) === "float") {
            e.reject();
        }
        else if (tab && tab !== data) {
            const direction = getDropDirection(e);
            context.setDropRect(_hitAreaRef, direction, _ref);
            e.accept("");
        }
        else if (panel && panel !== data.parent) {
            const direction = getDropDirection(e);
            context.setDropRect(_hitAreaRef, direction, _ref);
            e.accept("");
        }
    }, [
        _hitAreaRef,
        _ref,
        data,
        context.getGroup,
        context.getDockId,
        context.setDropRect,
        getDropDirection,
    ]);
    const onDragLeave = React.useCallback((e) => {
        if (!_ref)
            return;
        context.setDropRect(null, "remove", _ref);
    }, [_ref]);
    const onDrop = React.useCallback((e) => {
        const dockId = context.getDockId();
        let panel;
        const tab = DragManager.DragState.getData("tab", dockId);
        if (tab) {
            panel = tab.parent;
        }
        else {
            panel = DragManager.DragState.getData("panel", dockId);
        }
        if (tab && tab !== data) {
            const direction = getDropDirection(e);
            context.dockMove(tab, data, direction);
        }
        else if (panel && panel !== data.parent) {
            const direction = getDropDirection(e);
            context.dockMove(panel, data, direction);
        }
    }, [data, context.getDockId, context.dockMove, getDropDirection]);
    const { id, title, closable, parent } = data;
    const isInWindowPanel = parent.parent.mode === "window";
    return (React.createElement(DragDropDiv, { getRef: getRef, role: "tab", "aria-selected": parent.activeId === id, onDragStartT: isInWindowPanel ? null : onDragStart, onDragOverT: isInWindowPanel ? null : onDragOver, onDropT: isInWindowPanel ? null : onDrop, onDragLeaveT: isInWindowPanel ? null : onDragLeave },
        title,
        closable ? (React.createElement("div", { className: "dock-tab-close-btn", onClick: onCloseClick })) : null,
        React.createElement("div", { className: "dock-tab-hit-area", ref: getHitAreaRef })));
});
