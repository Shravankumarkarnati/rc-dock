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
exports.DockTabs = void 0;
const classnames_1 = __importDefault(require("classnames"));
const rc_dropdown_1 = __importDefault(require("rc-dropdown"));
const rc_menu_1 = __importStar(require("rc-menu"));
const rc_tabs_1 = __importDefault(require("rc-tabs"));
const React = __importStar(require("react"));
const Algorithm_1 = require("./Algorithm");
const DockData_1 = require("./DockData");
const DockTabBar_1 = require("./DockTabBar");
const DragDropDiv_1 = require("./dragdrop/DragDropDiv");
const DragManager = __importStar(require("./dragdrop/DragManager"));
const UseForceUpdate_1 = require("./UseForceUpdate");
const Utils_1 = require("./Utils");
const WindowBox_1 = require("./WindowBox");
const DockTabPane_1 = __importStar(require("./DockTabPane"));
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
exports.DockTabs = React.memo(function DockTabBase(props) {
    let { panelData, onPanelDragStart, onPanelDragEnd, onPanelDragMove } = props;
    const { group, tabs, activeId } = panelData;
    const forceUpdate = UseForceUpdate_1.useForceUpdate();
    const context = DockData_1.useDockContext();
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
            WindowBox_1.isWindowBoxEnabled() &&
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
                    const nativeMenu = (React.createElement(rc_menu_1.default, { onClick: onNewWindowClick },
                        React.createElement(rc_menu_1.MenuItem, null, "New Window")));
                    return (React.createElement(rc_dropdown_1.default, { prefixCls: "dock-dropdown", overlay: nativeMenu, trigger: showWithLeftClick ? ["contextMenu", "click"] : ["contextMenu"], mouseEnterDelay: 0.1, mouseLeaveDelay: 0.1 }, element));
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
        return (React.createElement(DockTabBar_1.DockTabBar, Object.assign({ onDragStart: onPanelDragStart, onDragMove: onPanelDragMove, onDragEnd: onPanelDragEnd, TabNavList: TabNavList, isMaximized: panelData.parent.mode === "maximize" }, props, { extra: panelExtraContent })));
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
                children: (React.createElement(DockTabPane_1.default, { id: id, cached: cached, active: active }, children)),
                style: DockTabPane_1.getStyles(active, true),
            };
        });
    }, [tabs, activeId]);
    return (React.createElement(rc_tabs_1.default, { prefixCls: "dock", more: { icon: moreIcon }, animated: animated, renderTabBar: renderTabBar, activeKey: activeId, onChange: onTabChange, popupClassName: classnames_1.default(Utils_1.groupClassNames(group)), items: items }));
});
const TabLabel = React.memo(function _TabLabel({ data }) {
    const [_ref, setRef] = React.useState(null);
    const [_hitAreaRef, setHitAreaRef] = React.useState(null);
    const context = DockData_1.useDockContext();
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
        const [panelWidth, panelHeight] = Algorithm_1.getFloatPanelSize(panelElement, tabGroup);
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
    return (React.createElement(DragDropDiv_1.DragDropDiv, { getRef: getRef, role: "tab", "aria-selected": parent.activeId === id, onDragStartT: isInWindowPanel ? null : onDragStart, onDragOverT: isInWindowPanel ? null : onDragOver, onDropT: isInWindowPanel ? null : onDrop, onDragLeaveT: isInWindowPanel ? null : onDragLeave },
        title,
        closable ? (React.createElement("div", { className: "dock-tab-close-btn", onClick: onCloseClick })) : null,
        React.createElement("div", { className: "dock-tab-hit-area", ref: getHitAreaRef })));
});
