var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import debounce from "lodash/debounce";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Algorithm from "./Algorithm";
import { DockBox } from "./DockBox";
import { defaultGroup, DockContextProvider, placeHolderGroup, placeHolderStyle, } from "./DockData";
import { DockPortalManager } from "./DockPortalManager";
import * as DragManager from "./dragdrop/DragManager";
import { DroppingPanel } from "./DroppingPanel";
import { FloatBox } from "./FloatBox";
import { MaxBox } from "./MaxBox";
import * as Serializer from "./Serializer";
import { useForceUpdate } from "./UseForceUpdate";
import { WindowBox } from "./WindowBox";
const DockLayoutBase = React.forwardRef(function _DockLayout(props, ref) {
    const forceUpdate = useForceUpdate();
    let { groups, loadTab, dockId, style, maximizeTo, layout, onLayoutChange, saveTab, afterPanelSaved, dropMode, defaultLayout, } = props;
    const [_ref, setRef] = React.useState(null);
    const [state, setState] = React.useState(() => {
        let preparedLayout;
        if (defaultLayout) {
            preparedLayout = prepareInitData(props.defaultLayout, groups, loadTab);
        }
        else if (!loadTab) {
            throw new Error("DockLayout.loadTab and DockLayout.defaultLayout should not both be undefined.");
        }
        if (layout) {
            // controlled layout
            return {
                layout: loadLayoutData(layout, props),
                dropRect: null,
            };
        }
        else {
            return {
                layout: preparedLayout,
                dropRect: null,
            };
        }
    });
    const dropRectRef = React.useRef();
    React.useEffect(() => {
        dropRectRef.current = state.dropRect;
    });
    /** @ignore
     * layout state doesn't change instantly after setState, use this to make sure the correct layout is
     */
    const tempLayout = React.useRef(null);
    const panelToFocus = React.useRef(null);
    const getRootElement = React.useCallback(() => _ref, [_ref]);
    const getDockId = React.useCallback(() => dockId, [dockId]);
    const useEdgeDrop = React.useCallback(() => dropMode === "edge", [dropMode]);
    const getGroup = React.useCallback((name) => {
        if (name) {
            if (groups && name in groups) {
                return groups[name];
            }
            if (name === placeHolderStyle) {
                return placeHolderGroup;
            }
        }
        return defaultGroup;
    }, [groups]);
    const getLayout = React.useCallback(() => tempLayout.current || state.layout, [state.layout]);
    const setLayout = React.useCallback((layout) => {
        tempLayout.current = layout;
        setState((prev) => (Object.assign(Object.assign({}, prev), { layout })));
    }, []);
    const find = React.useCallback((id, filter) => Algorithm.find(getLayout(), id, filter), [getLayout]);
    const changeLayout = React.useCallback((layoutData, currentTabId, direction, silent = false) => {
        let savedLayout;
        if (onLayoutChange) {
            savedLayout = Serializer.saveLayoutData(layoutData, saveTab, afterPanelSaved);
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
    }, [layout, onLayoutChange, saveTab, afterPanelSaved, forceUpdate, setLayout]);
    const dockMove = React.useCallback((source, target, direction, floatPosition) => {
        let layout = getLayout();
        if (direction === "maximize") {
            layout = Algorithm.maximize(layout, source);
            panelToFocus.current = source.id;
        }
        else if (direction === "front") {
            layout = Algorithm.moveToFront(layout, source);
        }
        else {
            layout = Algorithm.removeFromLayout(layout, source);
        }
        if (typeof target === "string") {
            target = find(target, Algorithm.Filter.All);
        }
        else {
            target = Algorithm.getUpdatedObject(target); // target might change during removeTab
        }
        if (direction === "float") {
            let newPanel = Algorithm.converToPanel(source);
            newPanel.z = Algorithm.nextZIndex(null);
            if (dropRectRef.current || floatPosition) {
                layout = Algorithm.floatPanel(layout, newPanel, dropRectRef.current || floatPosition);
            }
            else {
                layout = Algorithm.floatPanel(layout, newPanel);
                if (_ref) {
                    layout = Algorithm.fixFloatPanelPos(layout, _ref.offsetWidth, _ref.offsetHeight);
                }
            }
        }
        else if (direction === "new-window") {
            let newPanel = Algorithm.converToPanel(source);
            layout = Algorithm.panelToWindow(layout, newPanel);
        }
        else if (target) {
            if ("tabs" in target) {
                // panel target
                if (direction === "middle") {
                    layout = Algorithm.addTabToPanel(layout, source, target);
                }
                else {
                    let newPanel = Algorithm.converToPanel(source);
                    layout = Algorithm.dockPanelToPanel(layout, newPanel, target, direction);
                }
            }
            else if ("children" in target) {
                // box target
                let newPanel = Algorithm.converToPanel(source);
                layout = Algorithm.dockPanelToBox(layout, newPanel, target, direction);
            }
            else {
                // tab target
                layout = Algorithm.addNextToTab(layout, source, target, direction);
            }
        }
        if (layout !== getLayout()) {
            layout = Algorithm.fixLayoutData(layout, groups);
            const currentTabId = source.hasOwnProperty("tabs")
                ? source.activeId
                : source.id;
            changeLayout(layout, currentTabId, direction);
        }
    }, [getLayout, find, _ref, groups, changeLayout]);
    const getLayoutSize = React.useCallback(() => {
        if (_ref) {
            return { width: _ref.offsetWidth, height: _ref.offsetHeight };
        }
        return { width: 0, height: 0 };
    }, [_ref]);
    const updateTab = React.useCallback((id, newTab, makeActive) => {
        var _a;
        let tab = find(id, Algorithm.Filter.AnyTab);
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
            }
            else if (makeActive && panelData.activeId !== id) {
                layout = Algorithm.replacePanel(layout, panelData, Object.assign(Object.assign({}, panelData), { activeId: id }));
            }
            layout = Algorithm.fixLayoutData(layout, groups);
            changeLayout(layout, (_a = newTab === null || newTab === void 0 ? void 0 : newTab.id) !== null && _a !== void 0 ? _a : id, "update");
            return true;
        }
    }, [find, loadTab, getLayout, groups, changeLayout]);
    const navigateToPanel = React.useCallback((fromElement, direction) => {
        if (!direction) {
            if (!fromElement) {
                fromElement = _ref.querySelector(".dock-tab-active>.dock-tab-btn");
            }
            fromElement.focus();
            return;
        }
        let targetTab;
        // use panel rect when move left/right, and use tabbar rect for up/down
        let selector = direction === "ArrowUp" || direction === "ArrowDown"
            ? ".dock>.dock-bar"
            : ".dock-box>.dock-panel";
        let panels = Array.from(_ref.querySelectorAll(selector));
        let currentPanel = panels.find((panel) => panel.contains(fromElement));
        let currentRect = currentPanel.getBoundingClientRect();
        let matches = [];
        for (let panel of panels) {
            if (panel !== currentPanel) {
                let rect = panel.getBoundingClientRect();
                let distance = Algorithm.findNearestPanel(currentRect, rect, direction);
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
    }, [_ref]);
    const setDropRect = React.useCallback((element, direction, source, event, panelSize) => {
        setState((prev) => {
            let dropRect = prev.dropRect;
            if (dropRect) {
                if (direction === "remove") {
                    if (dropRect.source === source) {
                        return Object.assign(Object.assign({}, prev), { dropRect: null });
                    }
                    return prev;
                }
                else if (dropRect.element === element &&
                    dropRect.direction === direction &&
                    direction !== "float") {
                    // skip duplicated update except for float dragging
                    return prev;
                }
            }
            if (!element) {
                return Object.assign(Object.assign({}, prev), { dropRect: null });
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
            return Object.assign(Object.assign({}, prev), { dropRect: { left, top, width, height, element, source, direction } });
        });
    }, [_ref]);
    const onSilentChange = React.useCallback((currentTabId = null, direction) => {
        if (onLayoutChange) {
            changeLayout(getLayout(), currentTabId, direction, true);
        }
    }, [onLayoutChange, getLayout, changeLayout]);
    const value = React.useMemo(() => ({
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
    }), [
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
    ]);
    React.useEffect(() => {
        var _a;
        const _onWindowResize = debounce(() => {
            let layout = getLayout();
            if (_ref) {
                let newLayout = Algorithm.fixFloatPanelPos(layout, _ref.offsetWidth, _ref.offsetHeight);
                if (layout !== newLayout) {
                    newLayout = Algorithm.fixLayoutData(newLayout, groups); // panel parent might need a fix
                    changeLayout(newLayout, null, "move");
                }
            }
        }, 200);
        (_a = globalThis.addEventListener) === null || _a === void 0 ? void 0 : _a.call(globalThis, "resize", _onWindowResize);
        return () => {
            var _a;
            (_a = globalThis.removeEventListener) === null || _a === void 0 ? void 0 : _a.call(globalThis, "resize", _onWindowResize);
            _onWindowResize.cancel();
        };
    }, [getLayout, _ref, groups, changeLayout]);
    React.useEffect(() => {
        const onDragStateChange = (draggingScope) => {
            if (draggingScope == null) {
                DroppingPanel.droppingPanel = null;
                if (state.dropRect) {
                    setState((prev) => (Object.assign(Object.assign({}, prev), { dropRect: null })));
                }
            }
        };
        DragManager.addDragStateListener(onDragStateChange);
        return () => {
            DragManager.removeDragStateListener(onDragStateChange);
        };
    }, [state.dropRect]);
    React.useEffect(() => {
        var _a;
        // componentDidUpdate
        /** @ignore
         * move focus to panelToFocus
         */
        if (panelToFocus.current) {
            let panel = _ref.querySelector(`.dock-panel[data-dockid="${panelToFocus.current}"]`);
            if (panel && !panel.contains(_ref.ownerDocument.activeElement)) {
                (_a = panel.querySelector(".dock-bar")) === null || _a === void 0 ? void 0 : _a.focus();
            }
            panelToFocus.current = null;
        }
    });
    /**
     * load layout
     * calling this api won't trigger the [[LayoutProps.onLayoutChange]] callback
     */
    const loadLayout = React.useCallback((savedLayout) => {
        if (_ref) {
            setLayout(loadLayoutData(savedLayout, props, _ref.offsetWidth, _ref.offsetHeight));
        }
    }, [setLayout, props, _ref]);
    const saveLayout = React.useCallback(() => {
        return Serializer.saveLayoutData(getLayout(), props.saveTab, props.afterPanelSaved);
    }, [getLayout, props.saveTab, props.afterPanelSaved]);
    //public api
    React.useImperativeHandle(ref, React.useCallback(() => ({
        dockMove,
        find,
        loadLayout,
        saveLayout,
        updateTab,
    }), [dockMove, find, loadLayout, saveLayout, updateTab]));
    // render
    // clear tempLayout
    tempLayout.current = null;
    let dropRectStyle;
    if (state.dropRect) {
        let _a = state.dropRect, { element, direction } = _a, rect = __rest(_a, ["element", "direction"]);
        dropRectStyle = Object.assign(Object.assign({}, rect), { display: "block" });
        if (direction === "float") {
            dropRectStyle.transition = "none";
        }
    }
    let maximize;
    // if (layout.maxbox && layout.maxbox.children.length === 1) {
    if (maximizeTo) {
        if (typeof maximizeTo === "string") {
            maximizeTo = document.getElementById(maximizeTo);
        }
        maximize = ReactDOM.createPortal(React.createElement(MaxBox, { boxData: state.layout.maxbox }), maximizeTo);
    }
    else {
        maximize = React.createElement(MaxBox, { boxData: state.layout.maxbox });
    }
    return (React.createElement("div", { ref: setRef, className: "dock-layout", style: style },
        React.createElement(DockContextProvider, { value: value },
            React.createElement(DockPortalManager, null,
                React.createElement(DockBox, { size: 1, boxData: state.layout.dockbox }),
                React.createElement(FloatBox, { boxData: state.layout.floatbox }),
                React.createElement(WindowBox, { boxData: state.layout.windowbox }),
                maximize)),
        React.createElement("div", { className: "dock-drop-indicator", style: dropRectStyle })));
});
export const DockLayout = React.memo(DockLayoutBase);
function prepareInitData(data, groups, loadTab) {
    let _layout = Object.assign({}, data);
    Algorithm.fixLayoutData(_layout, groups, loadTab);
    return _layout;
}
function loadLayoutData(savedLayout, props, width = 0, height = 0) {
    let { defaultLayout, loadTab, afterPanelLoaded, groups } = props;
    let layout = Serializer.loadLayoutData(savedLayout, defaultLayout, loadTab, afterPanelLoaded);
    layout = Algorithm.fixFloatPanelPos(layout, width, height);
    layout = Algorithm.fixLayoutData(layout, groups);
    layout.loadedFrom = savedLayout;
    return layout;
}
