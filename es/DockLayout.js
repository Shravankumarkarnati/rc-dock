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
import { addDragStateListener } from "./dragdrop/DragManager";
import { FloatBox } from "./FloatBox";
import { MaxBox } from "./MaxBox";
import * as Serializer from "./Serializer";
import { WindowBox } from "./WindowBox";
export const DockLayout = ({ afterPanelLoaded, afterPanelSaved, defaultLayout, dockId, dropMode, groups, layout, loadTab, maximizeTo, onLayoutChange, saveTab, style, }) => {
    const [ref, setRef] = React.useState(null);
    const [state, setState] = React.useState(() => {
        if (defaultLayout) {
            return {
                layout: Algorithm.fixLayoutData(Object.assign({}, defaultLayout), groups, loadTab),
                dropRect: null,
            };
        }
        if (!loadTab || !layout) {
            throw new Error("DockLayout.loadTab and DockLayout.defaultLayout should not both be undefined.");
        }
        // controlled layout
        return {
            layout: utils.loadLayoutData(layout, {
                afterPanelLoaded,
                defaultLayout,
                groups,
                loadTab,
            }),
            dropRect: null,
        };
    });
    const layoutId = React.useId();
    const getDockId = React.useCallback(() => dockId || layoutId, [dockId, layoutId]);
    const find = React.useCallback((id, filter) => Algorithm.find(state.layout, id, filter), [state.layout]);
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
    const panelToFocus = React.useRef(null);
    const changeLayout = React.useCallback((layoutData, currentTabId, direction) => {
        if (onLayoutChange) {
            const savedLayout = Serializer.saveLayoutData(layoutData, saveTab, afterPanelSaved);
            layoutData.loadedFrom = savedLayout;
            onLayoutChange(savedLayout, currentTabId, direction);
        }
        if (!layout) {
            // uncontrolled layout when Props.layout is not defined
            setState((prev) => (Object.assign(Object.assign({}, prev), { layout: layoutData })));
        }
    }, [layout, onLayoutChange, saveTab, afterPanelSaved]);
    const onDragStateChange = React.useCallback((draggingScope) => {
        if (draggingScope == null) {
            if (state.dropRect) {
                setState((prev) => (Object.assign(Object.assign({}, prev), { dropRect: null })));
            }
        }
    }, [state.dropRect]);
    const dockMove = React.useCallback((source, target, direction, floatPosition) => {
        let layout = state.layout;
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
            if (state.dropRect || floatPosition) {
                layout = Algorithm.floatPanel(layout, newPanel, state.dropRect || floatPosition);
            }
            else {
                layout = Algorithm.floatPanel(layout, newPanel);
                if (ref) {
                    layout = Algorithm.fixFloatPanelPos(layout, ref.offsetWidth, ref.offsetHeight);
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
        if (layout !== state.layout) {
            layout = Algorithm.fixLayoutData(layout, groups);
            const currentTabId = "tabs" in source ? source.activeId : source.id;
            changeLayout(layout, currentTabId, direction);
        }
        onDragStateChange(false);
    }, [changeLayout, find, groups, onDragStateChange, ref, state.dropRect, state.layout]);
    const getLayoutSize = React.useCallback(() => {
        if (ref) {
            return { width: ref.offsetWidth, height: ref.offsetHeight };
        }
        return { width: 0, height: 0 };
    }, [ref]);
    const updateTab = React.useCallback((id, newTab, makeActive = true) => {
        var _a;
        let layout = state.layout;
        let tab = find(id, Algorithm.Filter.AnyTab);
        if (!tab) {
            return false;
        }
        let panelData = tab.parent;
        let idx = panelData.tabs.indexOf(tab);
        if (idx >= 0) {
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
    }, [state.layout, loadTab, groups, changeLayout, find]);
    const navigateToPanel = React.useCallback((fromElement, direction) => {
        if (!direction) {
            if (!fromElement) {
                fromElement = ref.querySelector(".dock-tab-active>.dock-tab-btn");
            }
            fromElement.focus();
            return;
        }
        let targetTab;
        // use panel rect when move left/right, and use tabbar rect for up/down
        let selector = direction === "ArrowUp" || direction === "ArrowDown"
            ? ".dock>.dock-bar"
            : ".dock-box>.dock-panel";
        let panels = Array.from(ref.querySelectorAll(selector));
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
    }, [ref]);
    React.useEffect(() => {
        const onWindowResize = debounce(() => {
            let layout = state.layout;
            if (ref) {
                let newLayout = Algorithm.fixFloatPanelPos(layout, ref.offsetWidth, ref.offsetHeight);
                if (layout !== newLayout) {
                    newLayout = Algorithm.fixLayoutData(newLayout, groups); // panel parent might need a fix
                    changeLayout(newLayout, null, "move");
                }
            }
        }, 200);
        globalThis.addEventListener("resize", onWindowResize);
        return () => {
            globalThis.removeEventListener("resize", onWindowResize);
            onWindowResize.cancel();
        };
    }, [state.layout, ref, groups, changeLayout]);
    React.useEffect(() => {
        const unSubscribe = addDragStateListener(onDragStateChange);
        return unSubscribe;
    }, [onDragStateChange]);
    React.useEffect(() => {
        var _a;
        if (panelToFocus.current) {
            let panel = ref.querySelector(`.dock-panel[data-dockid="${panelToFocus.current}"]`);
            if (panel && !panel.contains(ref.ownerDocument.activeElement)) {
                ;
                (_a = panel.querySelector(".dock-bar")) === null || _a === void 0 ? void 0 : _a.focus();
            }
            panelToFocus.current = null;
        }
    }, [ref]);
    const shouldUseEdgeDrop = React.useCallback(() => dropMode === "edge", [dropMode]);
    const setDropRect = React.useCallback((element, direction, source, event, panelSize = [300, 300]) => {
        let dropRect = state.dropRect;
        if (dropRect) {
            if (direction === "remove") {
                if (dropRect.source === source) {
                    setState((prev) => (Object.assign(Object.assign({}, prev), { dropRect: null })));
                }
                return;
            }
            else if (dropRect.element === element &&
                dropRect.direction === direction &&
                direction !== "float") {
                // skip duplicated update except for float dragging
                return;
            }
        }
        if (!element) {
            setState((prev) => (Object.assign(Object.assign({}, prev), { dropRect: null })));
            return;
        }
        let layoutRect = ref.getBoundingClientRect();
        let scaleX = ref.offsetWidth / layoutRect.width;
        let scaleY = ref.offsetHeight / layoutRect.height;
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
            // eslint-disable-next-line no-fallthrough
            case "left":
                width *= ratio;
                break;
            case "bottom":
                top += height * (1 - ratio);
            // eslint-disable-next-line no-fallthrough
            case "top":
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
        setState((prev) => (Object.assign(Object.assign({}, prev), { dropRect: { left, top, width, height, element, source, direction } })));
    }, [ref, state.dropRect]);
    const getRootElement = React.useCallback(() => ref, [ref]);
    const onSilentChange = React.useCallback((currentTabId = null, direction) => {
        changeLayout(state.layout, currentTabId, direction);
    }, [changeLayout, state.layout]);
    const context = React.useMemo(() => ({
        dockMove,
        find,
        getDockId,
        getGroup,
        getLayoutSize,
        getRootElement,
        navigateToPanel,
        onSilentChange,
        setDropRect,
        updateTab,
        shouldUseEdgeDrop,
    }), [
        dockMove,
        find,
        getDockId,
        getGroup,
        getLayoutSize,
        getRootElement,
        navigateToPanel,
        onSilentChange,
        setDropRect,
        updateTab,
        shouldUseEdgeDrop,
    ]);
    let dropRectStyle;
    if (state.dropRect) {
        let _a = state.dropRect, { direction } = _a, rect = __rest(_a, ["direction"]);
        dropRectStyle = Object.assign(Object.assign({}, rect), { display: "block" });
        if (direction === "float") {
            dropRectStyle.transition = "none";
        }
    }
    let maxBox;
    if (maximizeTo) {
        if (typeof maximizeTo === "string") {
            maximizeTo = document.getElementById(maximizeTo);
        }
        maxBox = ReactDOM.createPortal(React.createElement(MaxBox, { boxData: state.layout.maxbox }), maximizeTo);
    }
    else {
        maxBox = React.createElement(MaxBox, { boxData: state.layout.maxbox });
    }
    return (React.createElement("div", { ref: setRef, className: "dock-layout", style: style },
        React.createElement(DockPortalManager, null,
            React.createElement(DockContextProvider, { value: context },
                React.createElement(DockBox, { size: 1, boxData: state.layout.dockbox }),
                React.createElement(FloatBox, { boxData: state.layout.floatbox }),
                React.createElement(WindowBox, { boxData: state.layout.windowbox }),
                maxBox)),
        React.createElement("div", { className: "dock-drop-indicator", style: dropRectStyle })));
};
const utils = {
    loadLayoutData(savedLayout, { defaultLayout, loadTab, afterPanelLoaded, groups, }, width = 0, height = 0) {
        let layout = Serializer.loadLayoutData(Object.assign({}, savedLayout), defaultLayout, loadTab, afterPanelLoaded);
        layout = Algorithm.fixFloatPanelPos(layout, width, height);
        layout = Algorithm.fixLayoutData(layout, groups);
        layout.loadedFrom = savedLayout;
        return layout;
    },
};
