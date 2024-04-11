import classNames from "classnames";
import Dropdown from "rc-dropdown";
import Menu, { MenuItem } from "rc-menu";
import Tabs from "rc-tabs";
import * as React from "react";
import { getFloatPanelSize } from "./Algorithm";
import { useDockContext } from "./DockData";
import { DockTabBar } from "./DockTabBar";
import DockTabPane from "./DockTabPane";
import { useForceUpdate } from "./UseForceUpdate";
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
            let panel = this.data.parent;
            if (panel.parent.mode === "float" && panel.tabs.length === 1) {
                // when it's the only tab in a float panel, skip this drag, let parent tab bar handle it
                return;
            }
            let panelElement = findParentPanel(this._ref);
            let tabGroup = this.context.getGroup(this.data.group);
            let [panelWidth, panelHeight] = getFloatPanelSize(panelElement, tabGroup);
            e.setData({
                tab: this.data,
                panelSize: [panelWidth, panelHeight],
                tabGroup: this.data.group,
            }, this.context.getDockId());
            e.startDrag(this._ref.parentElement, this._ref.parentElement);
        };
        this.onDragOver = (e) => {
            var _a, _b;
            let dockId = this.context.getDockId();
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
            let tabGroup = this.context.getGroup(group);
            if (group !== this.data.group) {
                e.reject();
            }
            else if ((tabGroup === null || tabGroup === void 0 ? void 0 : tabGroup.floatable) === "singleTab" && ((_b = (_a = this.data.parent) === null || _a === void 0 ? void 0 : _a.parent) === null || _b === void 0 ? void 0 : _b.mode) === "float") {
                e.reject();
            }
            else if (tab && tab !== this.data) {
                let direction = this.getDropDirection(e);
                this.context.setDropRect(this._hitAreaRef, direction, this);
                e.accept("");
            }
            else if (panel && panel !== this.data.parent) {
                let direction = this.getDropDirection(e);
                this.context.setDropRect(this._hitAreaRef, direction, this);
                e.accept("");
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.onDragLeave = (e) => {
            this.context.setDropRect(null, "remove", this);
        };
        this.onDrop = (e) => {
            let dockId = this.context.getDockId();
            let panel;
            let tab = DragManager.DragState.getData("tab", dockId);
            if (tab) {
                panel = tab.parent;
            }
            else {
                panel = DragManager.DragState.getData("panel", dockId);
            }
            if (tab && tab !== this.data) {
                let direction = this.getDropDirection(e);
                this.context.dockMove(tab, this.data, direction);
            }
            else if (panel && panel !== this.data.parent) {
                let direction = this.getDropDirection(e);
                this.context.dockMove(panel, this.data, direction);
            }
        };
        this.context = context;
    }
    setData(data) {
        if (data !== this.data) {
            this.data = data;
            this.content = this.render();
            return true;
        }
        return false;
    }
    getDropDirection(e) {
        let rect = this._hitAreaRef.getBoundingClientRect();
        let midx = rect.left + rect.width * 0.5;
        return e.clientX > midx ? "after-tab" : "before-tab";
    }
    render() {
        let { id, title, content, closable, cached, parent } = this.data;
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
        let tab = (React.createElement(DragDropDiv, { getRef: this.getRef, onDragStartT: onDragStart, role: "tab", "aria-selected": parent.activeId === id, onDragOverT: onDragOver, onDropT: onDrop, onDragLeaveT: onDragLeave },
            title,
            closable ? React.createElement("div", { className: "dock-tab-close-btn", onClick: this.onCloseClick }) : null,
            React.createElement("div", { className: "dock-tab-hit-area", ref: this.getHitAreaRef })));
        return {
            key: id,
            label: tab,
            children: (React.createElement(DockTabPane, { key: id, cacheId: id, cached: cached, label: tab }, content)),
        };
    }
    destroy() {
        // place holder
    }
}
export const DockTabs = ({ panelData, onPanelDragEnd, onPanelDragMove, onPanelDragStart, }) => {
    const context = useDockContext();
    const { dockMove, onSilentChange, getGroup } = context;
    const forceUpdate = useForceUpdate();
    const cachedTabs = React.useRef(null);
    const cache = React.useRef(new Map());
    const updateTabs = React.useCallback((tabs) => {
        if (tabs === cachedTabs.current) {
            return;
        }
        cachedTabs.current = tabs;
        let newCache = new Map();
        let reused = 0;
        for (let tabData of tabs) {
            let { id } = tabData;
            if (cache.current.has(id)) {
                let tab = cache.current.get(id);
                newCache.set(id, tab);
                tab.setData(tabData);
                ++reused;
            }
            else {
                let tab = new TabCache(context);
                newCache.set(id, tab);
                tab.setData(tabData);
            }
        }
        if (reused !== cache.current.size) {
            for (let [id, tab] of cache.current) {
                if (!newCache.has(id)) {
                    tab.destroy();
                }
            }
        }
        cache.current = newCache;
    }, [context]);
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
        forceUpdate();
    }, [panelData, onSilentChange, forceUpdate]);
    let { group, tabs, activeId } = panelData;
    React.useEffect(() => {
        updateTabs(tabs);
    }, [updateTabs, tabs]);
    let tabGroup = getGroup(group);
    let { animated, moreIcon } = tabGroup;
    if (animated == null) {
        animated = true;
    }
    if (!moreIcon) {
        moreIcon = "...";
    }
    let items = [...cache.current.values()].map((c) => c.content);
    return (React.createElement(Tabs, { prefixCls: "dock", more: { icon: moreIcon }, animated: animated, renderTabBar: renderTabBar, activeKey: activeId, onChange: onTabChange, popupClassName: classNames(groupClassNames(group)), items: items }));
};
