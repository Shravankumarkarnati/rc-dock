import classNames from "classnames";
import Dropdown from "rc-dropdown";
import Menu, { MenuItem } from "rc-menu";
import Tabs from "rc-tabs";
import * as React from "react";
import { getFloatPanelSize } from "./Algorithm";
import { useDockContext, } from "./DockData";
import { DockTabBar } from "./DockTabBar";
import DockTabPane from "./DockTabPane";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import * as DragManager from "./dragdrop/DragManager";
import { groupClassNames } from "./Utils";
import { isWindowBoxEnabled } from "./WindowBox";
import { useForceUpdate } from "./UseForceUpdate";
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
export class TabCache {
    constructor(context) {
        this.getRef = (r) => {
            if (isPopupDiv(r)) {
                return;
            }
            this._ref = r;
        };
        this.getHitAreaRef = (r) => {
            if (isPopupDiv(r)) {
                return;
            }
            this._hitAreaRef = r;
        };
        this.onCloseClick = (e) => {
            this.context.dockMove(this.data, null, "remove");
            e.stopPropagation();
        };
        this.onDragStart = (e) => {
            const panel = this.data.parent;
            if (panel.parent.mode === "float" && panel.tabs.length === 1) {
                // when it's the only tab in a float panel, skip this drag, const parent tab bar handle it
                return;
            }
            const panelElement = findParentPanel(this._ref);
            const tabGroup = this.context.getGroup(this.data.group);
            const [panelWidth, panelHeight] = getFloatPanelSize(panelElement, tabGroup);
            e.setData({
                tab: this.data,
                panelSize: [panelWidth, panelHeight],
                tabGroup: this.data.group,
            }, this.context.getDockId());
            e.startDrag(this._ref.parentElement, this._ref.parentElement);
        };
        this.onDragOver = (e) => {
            var _a, _b;
            const dockId = this.context.getDockId();
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
            const tabGroup = this.context.getGroup(group);
            if (group !== this.data.group) {
                e.reject();
            }
            else if ((tabGroup === null || tabGroup === void 0 ? void 0 : tabGroup.floatable) === "singleTab" &&
                ((_b = (_a = this.data.parent) === null || _a === void 0 ? void 0 : _a.parent) === null || _b === void 0 ? void 0 : _b.mode) === "float") {
                e.reject();
            }
            else if (tab && tab !== this.data) {
                const direction = this.getDropDirection(e);
                this.context.setDropRect(this._hitAreaRef, direction, this);
                e.accept("");
            }
            else if (panel && panel !== this.data.parent) {
                const direction = this.getDropDirection(e);
                this.context.setDropRect(this._hitAreaRef, direction, this);
                e.accept("");
            }
        };
        this.onDragLeave = (e) => {
            this.context.setDropRect(null, "remove", this);
        };
        this.onDrop = (e) => {
            const dockId = this.context.getDockId();
            let panel;
            const tab = DragManager.DragState.getData("tab", dockId);
            if (tab) {
                panel = tab.parent;
            }
            else {
                panel = DragManager.DragState.getData("panel", dockId);
            }
            if (tab && tab !== this.data) {
                const direction = this.getDropDirection(e);
                this.context.dockMove(tab, this.data, direction);
            }
            else if (panel && panel !== this.data.parent) {
                const direction = this.getDropDirection(e);
                this.context.dockMove(panel, this.data, direction);
            }
        };
        this.context = context;
    }
    setData(data) {
        if (data !== this.data) {
            this.data = data;
            [this.content, this.label] = this.render();
            return true;
        }
        return false;
    }
    getDropDirection(e) {
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
        const label = (React.createElement(DragDropDiv, { getRef: this.getRef, onDragStartT: onDragStart, role: "tab", "aria-selected": parent.activeId === id, onDragOverT: onDragOver, onDropT: onDrop, onDragLeaveT: onDragLeave },
            title,
            closable ? (React.createElement("div", { className: "dock-tab-close-btn", onClick: this.onCloseClick })) : null,
            React.createElement("div", { className: "dock-tab-hit-area", ref: this.getHitAreaRef })));
        const _content = (React.createElement(DockTabPane, { key: id, cacheId: id, cached: cached, tab: label }, content));
        return [_content, label];
    }
    destroy() {
        // place holder
    }
}
export const DockTabs = React.memo(function DockTabBase(props) {
    let { panelData, onPanelDragStart, onPanelDragEnd, onPanelDragMove } = props;
    const { group, tabs, activeId } = panelData;
    const forceUpdate = useForceUpdate();
    const context = useDockContext();
    const [cache, setCache] = React.useState(new Map());
    React.useEffect(() => {
        // updateTabs
        setCache((prev) => {
            const newCache = new Map();
            let reused = 0;
            for (const tabData of tabs) {
                const { id } = tabData;
                if (prev.has(id)) {
                    const tab = prev.get(id);
                    newCache.set(id, tab);
                    tab.setData(tabData);
                    ++reused;
                }
                else {
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
    const onMaximizeClick = React.useCallback((e) => {
        context.dockMove(panelData, null, "maximize");
        // prevent the focus change logic
        e.stopPropagation();
    }, [context.dockMove, panelData]);
    const renderTabBar = React.useCallback((props, TabNavList) => {
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
        const showNewWindowButton = newWindow && isWindowBoxEnabled() && parent.mode === "float";
        let panelExtraContent;
        if (panelExtra) {
            panelExtraContent = panelExtra(panelData, context);
        }
        else if (maximizable || showNewWindowButton) {
            let maxBtn = (React.createElement("div", { className: parent.mode === "maximize"
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
            if (parent.mode === "float" && !tabs.find((tab) => !tab.closable)) {
                panelExtraContent = (React.createElement(React.Fragment, null,
                    maxBtn,
                    React.createElement("div", { className: "dock-tab-close-btn", onClick: onCloseAll })));
            }
            else {
                panelExtraContent = maxBtn;
            }
        }
        return (React.createElement(DockTabBar, Object.assign({ onDragStart: onPanelDragStart, onDragMove: onPanelDragMove, onDragEnd: onPanelDragEnd, TabNavList: TabNavList, isMaximized: parent.mode === "maximize" }, props, { extra: panelExtraContent })));
    }, [
        panelData,
        tabGroup,
        onPanelDragStart,
        onPanelDragEnd,
        onPanelDragMove,
        context,
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
    const items = [...cache.entries()].map(([key, cache]) => ({
        key,
        label: cache.label,
        children: cache.content,
    }));
    return (React.createElement(Tabs, { prefixCls: "dock", more: { icon: moreIcon }, animated: animated, renderTabBar: renderTabBar, activeKey: activeId, onChange: onTabChange, popupClassName: classNames(groupClassNames(group)), items: items }));
});
