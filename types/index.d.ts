declare module "DropDirection" {
    export type DropDirection = "left" | "right" | "bottom" | "top" | "middle" | "remove" | "before-tab" | "after-tab" | "float" | "front" | "maximize" | "new-window" | "move" | "active" | "update";
}
declare module "Filter" {
    export enum Filter {
        Tab = 1,
        Panel = 2,
        Box = 4,
        Docked = 8,
        Floated = 16,
        Windowed = 32,
        Max = 64,
        EveryWhere = 120,
        AnyTab = 121,
        AnyPanel = 122,
        AnyTabPanel = 123,
        All = 127
    }
}
declare module "FloatSize" {
    export interface FloatSize {
        width: number;
        height: number;
    }
}
declare module "FloatPosition" {
    import { FloatSize } from "FloatSize";
    export interface FloatPosition extends FloatSize {
        left: number;
        top: number;
    }
}
declare module "DockMode" {
    export type DockMode = "horizontal" | "vertical" | "float" | "window" | "maximize";
}
declare module "LayoutData" {
    import { DockMode } from "DockMode";
    /** @ignore */
    interface DockDataBase {
        minWidth?: number;
        minHeight?: number;
    }
    export interface TabBase {
        /**
         * id must be unique
         */
        id?: string;
    }
    export interface PanelBase {
        /**
         * id will be auto generated if it's undefined
         */
        id?: string;
        /**
         * The size in dock box,
         * width when in horizontal layout and height when in vertical layout
         */
        size?: number;
        tabs: TabBase[];
        /**
         * The id of current tab
         */
        activeId?: string;
        /**
         * if group is undefined, it will be set to the group name of first tab
         */
        group?: string;
        /** float mode only */
        x?: number;
        /** float mode only */
        y?: number;
        /** float mode only */
        z?: number;
        /** float mode only */
        w?: number;
        /** float mode only */
        h?: number;
    }
    export interface BoxBase {
        /**
         * id will be auto generated if it's undefined
         */
        id?: string;
        mode: DockMode;
        /**
         * The size in dock box,
         * width when in horizontal layout and height when in vertical layout
         */
        size?: number;
        children: (BoxBase | PanelBase)[];
    }
    export interface LayoutBase {
        dockbox: BoxBase;
        floatbox?: BoxBase;
        windowbox?: BoxBase;
        maxbox?: BoxBase;
    }
    interface BoxChild extends DockDataBase {
        parent?: BoxData;
        widthFlex?: number;
        heightFlex?: number;
    }
    /**
     * a box is the layout element that contains other boxes or panels
     */
    export interface BoxData extends BoxBase, BoxChild {
        mode: DockMode;
        children: (BoxData | PanelData)[];
    }
    export interface TabData extends TabBase, DockDataBase {
        /**
         * - group defines style of the panel
         * - tabs with different tab groups can not be put in same panel
         * - more options for the group can be defined as TabGroup in [[LayoutProps.groups]]
         */
        group?: string;
        /** @ignore */
        parent?: PanelData;
        /**
         * title that's shown in the tab of the panel header
         */
        title: React.ReactChild;
        content: React.ReactElement | ((tab: TabData) => React.ReactElement);
        closable?: boolean;
        /**
         * - when value is true: content will always reuse the react component thus allows the component to keep its internal state
         * - when value is false: content will be destroyed when it's not visible, [[TabGroup.animated]] should be set to false, otherwise animation would show blank pages
         * - when value is undefined: content is rendered normally as react component
         */
        cached?: boolean;
        /**
         * @deprecated no longer needed
         */
        cacheContext?: React.Context<any>;
    }
    interface PanelLock {
        /** override the default style */
        panelStyle?: string;
        minWidth?: number;
        minHeight?: number;
        /**
         * override the default extra content from TabGroup.panelExtra,
         *
         * panelExtra can also be used as a listener on panel state changes,
         * if you don't need to show extra content in this case, just return null
         */
        panelExtra?: (panel: PanelData) => React.ReactElement;
        /**
         * override the default flex grow and flex shrink for panel width
         */
        widthFlex?: number;
        /**
         * override the default flex grow and flex shrink for panel height
         */
        heightFlex?: number;
    }
    /**
     * a panel is a visiaul container with tabs button in the title bar
     */
    export interface PanelData extends PanelBase, BoxChild {
        parent?: BoxData;
        tabs: TabData[];
        /**
         * addition information of a panel,
         * This prevents the panel from being removed when there is no tab inside
         * a locked panel can not be moved to float layer either
         */
        panelLock?: PanelLock;
    }
    export interface TabPaneCache {
        id: string;
        div: HTMLDivElement;
        owner: any;
        portal?: React.ReactPortal;
    }
    export interface LayoutData extends LayoutBase {
        /**
         * dock box
         */
        dockbox: BoxData;
        /**
         * float box,
         * Children must be PanelData, child box is not allowed
         */
        floatbox?: BoxData;
        /**
         * window box,
         * Children must be PanelData, child box is not allowed
         */
        windowbox?: BoxData;
        /**
         * The maximized panel,
         * only one child allowed, child must be PanelData
         */
        maxbox?: BoxData;
        /** @ignore
         * keep the last loaded layout to prevent unnecessary reloading
         */
        loadedFrom?: LayoutBase;
    }
}
declare module "LayoutSize" {
    import { FloatSize } from "FloatSize";
    export type LayoutSize = FloatSize;
}
declare module "TabGroup" {
    import { DockContext } from "DockContext";
    import { PanelData } from "LayoutData";
    export interface TabGroup {
        /**
         * Whether tab can be dragged into float layer.
         * If value is "singleTab", float panel can't have multiple tabs.
         *
         * default: false
         */
        floatable?: boolean | "singleTab";
        /**
         * Whether tab can be converted to native window, only works when floatable is true.
         *
         * default: false
         */
        newWindow?: boolean;
        /**
         * Disable dock, so the panel will only work in float mode.
         *
         * default: false
         */
        disableDock?: boolean;
        /**
         * Whether tab can be maximized
         *
         * default: false
         */
        maximizable?: boolean;
        /**
         * When tabs are locked, you can not drag tab to create new panel, but it can still be dropped into a different panel if they have the same tab group.
         *
         * default false
         */
        tabLocked?: boolean;
        /**
         * Whether to show animation effect when switch tabs.
         *
         * default true
         */
        animated?: boolean;
        /**
         * Generate extra content show in the right side of tab bar.
         *
         * panelExtra can also be used as a listener on panel state changes,
         * If you don't need to show extra content in this case, just return null.
         */
        panelExtra?: (panel: PanelData, context: DockContext) => React.ReactElement;
        /**
         * When creating float panel from dragging, DockLayout would use the original panel's size.
         * Use this to defined the [min, max] allowed with for the default size of a float panel.
         * If not specified, minWidth = 100, maxWidth = 600
         */
        preferredFloatWidth?: [number, number];
        /**
         * When creating float panel from dragging, DockLayout would use the original panel's size.
         * Use this to defined the [min, max] allowed height for the default size of a float panel.
         * If not specified, minHeight = 50, maxHeight = 500
         */
        preferredFloatHeight?: [number, number];
        /**
         * Override the default flex grow and flex shrink for panel width
         */
        widthFlex?: number;
        /**
         * Override the default flex grow and flex shrink for panel height
         */
        heightFlex?: number;
        /**
         * Override the default `moreIcon`
         */
        moreIcon?: React.ReactNode;
    }
}
declare module "DockContext" {
    import { DropDirection } from "DropDirection";
    import { Filter } from "Filter";
    import { FloatPosition } from "FloatPosition";
    import { TabData, PanelData, BoxData, TabPaneCache } from "LayoutData";
    import { LayoutSize } from "LayoutSize";
    import { TabGroup } from "TabGroup";
    export interface DockContext {
        /** @ignore */
        getDockId(): any;
        /** @ignore */
        useEdgeDrop(): boolean;
        /** @ignore */
        setDropRect(element: HTMLElement, direction?: DropDirection, source?: any, event?: {
            clientX: number;
            clientY: number;
        }, panelSize?: [number, number]): void;
        /** @ignore */
        getLayoutSize(): LayoutSize;
        /** @ignore
         * When a state change happen to the layout that's handled locally, like inside DockPanel or DockBox.
         * It still need to tell the context there is a change so DockLayout can call onLayoutChange callback.
         * This usually happens on dragEnd event of size/location change.
         */
        onSilentChange(currentTabId?: string, direction?: DropDirection): void;
        /**
         * Move a tab or a panel, if source or target is already in the layout, you can use the find method to get it with id first
         * @param source the source TabData or PanelData being moved
         *  - it can exist in the layout already
         *  - or can be a new tab or new panel that you want to add to the layout
         * @param target where you want to drop the source, can be the id or target data model
         * @param direction which direction to drop<br>
         *  - when direction is 'after-tab' or 'before-tab', target must be TabData
         *  - when direction is 'remove' or 'front', target must be null
         *  - when direction is 'float', target doesn't matter. If this is called directly from code without any user interaction, source must be PanelData with x,y,w,h properties
         * @param floatPosition position of float panel, used only when direction="float"
         */
        dockMove(source: TabData | PanelData, target: string | TabData | PanelData | BoxData | null, direction: DropDirection, floatPosition?: FloatPosition): void;
        /**
         * Get the TabGroup defined in defaultLayout
         */
        getGroup(name: string): TabGroup;
        /**
         * Find PanelData or TabData by id
         */
        find(id: string, filter?: Filter): PanelData | TabData | BoxData | undefined;
        /**
         * Update a tab with new TabData
         * @param id tab id to update
         * @param newTab new tab data, if newTab is null, it only changes the active tab of parent panel
         * @param makeActive whether to make the tab the active child of parent panel
         * @returns returns false if the tab is not found
         */
        updateTab(id: string, newTab: TabData | null, makeActive?: boolean): boolean;
        /**
         * Move focus to a dockpanel nearby
         * @param fromElement
         * @param direction
         */
        navigateToPanel(fromElement: HTMLElement, direction?: string): void;
        /** @ignore */
        getTabCache(id: string, owner: any): TabPaneCache;
        /** @ignore */
        removeTabCache(id: string, owner: any): void;
        /** @ignore */
        updateTabCache(id: string, portal: React.ReactNode): void;
        /** @ignore */
        updateVersion(): void
        /** @ignore */
        getRootElement(): HTMLDivElement;
    }
}
declare module "DockLayout" {
    import { DropDirection } from "DropDirection";
    import { LayoutData, LayoutBase, TabData, TabBase, PanelBase, PanelData } from "LayoutData";
    import { TabGroup } from "TabGroup";
    export interface LayoutProps {
        /**
         * when there are multiple DockLayout, by default, you can't drag panel between them
         * but if you assign same dockId, it will allow panels to be dragged from one layout to another
         */
        dockId?: string;
        /**
         * - when [[LayoutProps.loadTab]] callback is defined, tabs in defaultLayout only need to have an id, unless loadTab requires other fields
         * - when [[LayoutProps.loadTab]] is not defined, tabs must contain title and content, as well as other fields in [[TabData]] when needed
         */
        defaultLayout?: LayoutData;
        /**
         * set layout only when you want to use DockLayout as a fully controlled react component
         * when using controlled layout, [[LayoutProps.onChange]] must be set to enable any layout change
         */
        layout?: LayoutBase;
        /**
         * Tab Groups, defines additional configuration for different groups
         */
        groups?: {
            [key: string]: TabGroup;
        };
        /**
         * @param newLayout layout data can be set to [[LayoutProps.layout]] directly when used as controlled component
         * @param currentTabId id of current tab
         * @param direction direction of the dock change
         */
        onLayoutChange?(newLayout: LayoutBase, currentTabId?: string, direction?: DropDirection): void;
        /**
         * - default mode: showing 4 to 9 squares to help picking drop areas
         * - edge mode: using the distance between mouse and panel border to pick drop area
         *   - in edge mode, dragging float panel's header won't bring panel back to dock layer
         */
        dropMode?: "default" | "edge";
        /**
         * override the default saveTab behavior
         * @return must at least have an unique id
         */
        saveTab?(tab: TabData): TabBase;
        /**
         * override the default loadTab behavior
         * - when loadTab is not defined, [[LayoutProps.defaultLayout]] will be used to find a tab to load, thus defaultLayout must contain the titles and contents for TabData
         * - when loadTab is defined, [[LayoutProps.defaultLayout]] can ignore all those and only keep id and other custom data
         */
        loadTab?(tab: TabBase): TabData;
        /**
         * modify the savedPanel, you can add additional data into the savedPanel
         */
        afterPanelSaved?(savedPanel: PanelBase, panel: PanelData): void;
        /**
         * modify the loadedPanel, you can retrieve additional data into the panel
         * - modifying panel tabs is allowed, make sure to add or replace full TabData with title and content, because loadTab won't be called after this
         * - if tabs is empty, but still remaining in layout because of panelLock, make sure also set the group if it's not null
         */
        afterPanelLoaded?(savedPanel: PanelBase, loadedPanel: PanelData): void;
        style?: React.CSSProperties;
        /**
         * when specified, docklayout will create a react portal for the maximized panel
         * use dom element as the value, or use the element's id
         */
        maximizeTo?: string | HTMLElement;
    }
}
declare module "index" {
    export type * from "DockContext";
    export type * from "DockLayout";
    export type * from "DockMode";
    export type * from "DropDirection";
    export type * from "Filter";
    export type * from "FloatPosition";
    export type * from "FloatSize";
    export type * from "LayoutData";
    export type * from "LayoutSize";
    export type * from "TabGroup";
}
