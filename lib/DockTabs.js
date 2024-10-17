"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockTabs = exports.TabCache = void 0;
const classnames_1 = __importDefault(require("classnames"));
const rc_dropdown_1 = __importDefault(require("rc-dropdown"));
const rc_menu_1 = __importStar(require("rc-menu"));
const rc_tabs_1 = __importDefault(require("rc-tabs"));
const React = __importStar(require("react"));
const Algorithm_1 = require("./Algorithm");
const DockData_1 = require("./DockData");
const DockTabBar_1 = require("./DockTabBar");
const DockTabPane_1 = __importDefault(require("./DockTabPane"));
const DragDropDiv_1 = require("./dragdrop/DragDropDiv");
const DragManager = __importStar(require("./dragdrop/DragManager"));
const Utils_1 = require("./Utils");
const WindowBox_1 = require("./WindowBox");
const UseForceUpdate_1 = require("./UseForceUpdate");
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
class TabCache {
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
            const [panelWidth, panelHeight] = Algorithm_1.getFloatPanelSize(panelElement, tabGroup);
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
            this.content = this.render();
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
        const tab = (React.createElement(DragDropDiv_1.DragDropDiv, { getRef: this.getRef, onDragStartT: onDragStart, role: "tab", "aria-selected": parent.activeId === id, onDragOverT: onDragOver, onDropT: onDrop, onDragLeaveT: onDragLeave },
            title,
            closable ? (React.createElement("div", { className: "dock-tab-close-btn", onClick: this.onCloseClick })) : null,
            React.createElement("div", { className: "dock-tab-hit-area", ref: this.getHitAreaRef })));
        return (React.createElement(DockTabPane_1.default, { key: id, cacheId: id, cached: cached, tab: tab }, content));
    }
    destroy() {
        // place holder
    }
}
exports.TabCache = TabCache;
exports.DockTabs = React.memo(function DockTabBase(props) {
    let { panelData, onPanelDragStart, onPanelDragEnd, onPanelDragMove } = props;
    const { group, tabs, activeId } = panelData;
    const forceUpdate = UseForceUpdate_1.useForceUpdate();
    const context = DockData_1.useDockContext();
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
    }, [context, panelData]);
    const addNewWindowMenu = React.useCallback((element, showWithLeftClick) => {
        const onNewWindowClick = () => context.dockMove(panelData, null, "new-window");
        const nativeMenu = (React.createElement(rc_menu_1.default, { onClick: onNewWindowClick },
            React.createElement(rc_menu_1.MenuItem, null, "New Window")));
        const trigger = showWithLeftClick
            ? ["contextMenu", "click"]
            : ["contextMenu"];
        return (React.createElement(rc_dropdown_1.default, { prefixCls: "dock-dropdown", overlay: nativeMenu, trigger: trigger, mouseEnterDelay: 0.1, mouseLeaveDelay: 0.1 }, element));
    }, [context, panelData]);
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
            WindowBox_1.isWindowBoxEnabled() &&
            panelData.parent.mode === "float";
        let panelExtraContent;
        if (panelExtra) {
            panelExtraContent = panelExtra(panelData, context);
        }
        else if (maximizable || showNewWindowButton) {
            let maxBtn = (React.createElement("div", { className: panelData.parent.mode === "maximize"
                    ? "dock-panel-min-btn"
                    : "dock-panel-max-btn", onClick: maximizable ? onMaximizeClick : null }));
            if (showNewWindowButton) {
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
        return (React.createElement(DockTabBar_1.DockTabBar, Object.assign({ onDragStart: onPanelDragStart, onDragMove: onPanelDragMove, onDragEnd: onPanelDragEnd, TabNavList: TabNavList, isMaximized: panelData.parent.mode === "maximize" }, props, { extra: panelExtraContent })));
    }, []);
    const onTabChange = React.useCallback((activeId) => {
        props.panelData.activeId = activeId;
        context.onSilentChange(activeId, "active");
        forceUpdate();
    }, [props.panelData, context, forceUpdate]);
    let { animated, moreIcon } = tabGroup;
    if (animated == null) {
        animated = true;
    }
    if (!moreIcon) {
        moreIcon = "...";
    }
    const children = [];
    for (const [, tab] of cache) {
        children.push(tab.content);
    }
    return (React.createElement(rc_tabs_1.default, { prefixCls: "dock", moreIcon: moreIcon, animated: animated, renderTabBar: renderTabBar, activeKey: activeId, onChange: onTabChange, popupClassName: classnames_1.default(Utils_1.groupClassNames(group)) }, children));
});
