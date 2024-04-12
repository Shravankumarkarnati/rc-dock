import * as React from "react"
import {
  DropDirection,
  LayoutBase,
  LayoutData,
  PanelBase,
  PanelData,
  TabBase,
  TabData,
  TabGroup,
} from "./DockData"

export interface LayoutProps {
  /**
   * when there are multiple DockLayout, by default, you can't drag panel between them
   * but if you assign same dockId, it will allow panels to be dragged from one layout to another
   */
  dockId?: string

  /**
   * - when [[LayoutProps.loadTab]] callback is defined, tabs in defaultLayout only need to have an id, unless loadTab requires other fields
   * - when [[LayoutProps.loadTab]] is not defined, tabs must contain title and content, as well as other fields in [[TabData]] when needed
   */
  defaultLayout?: LayoutData

  /**
   * set layout only when you want to use DockLayout as a fully controlled react component
   * when using controlled layout, [[LayoutProps.onChange]] must be set to enable any layout change
   */
  layout?: LayoutBase

  /**
   * Tab Groups, defines additional configuration for different groups
   */
  groups?: { [key: string]: TabGroup }

  /**
   * @param newLayout layout data can be set to [[LayoutProps.layout]] directly when used as controlled component
   * @param currentTabId id of current tab
   * @param direction direction of the dock change
   */
  onLayoutChange?(newLayout: LayoutBase, currentTabId?: string, direction?: DropDirection): void

  /**
   * - default mode: showing 4 to 9 squares to help picking drop areas
   * - edge mode: using the distance between mouse and panel border to pick drop area
   *   - in edge mode, dragging float panel's header won't bring panel back to dock layer
   */
  dropMode?: "default" | "edge"

  /**
   * override the default saveTab behavior
   * @return must at least have an unique id
   */
  saveTab?(tab: TabData): TabBase

  /**
   * override the default loadTab behavior
   * - when loadTab is not defined, [[LayoutProps.defaultLayout]] will be used to find a tab to load, thus defaultLayout must contain the titles and contents for TabData
   * - when loadTab is defined, [[LayoutProps.defaultLayout]] can ignore all those and only keep id and other custom data
   */
  loadTab?(tab: TabBase): TabData

  /**
   * modify the savedPanel, you can add additional data into the savedPanel
   */
  afterPanelSaved?(savedPanel: PanelBase, panel: PanelData): void

  /**
   * modify the loadedPanel, you can retrieve additional data into the panel
   * - modifying panel tabs is allowed, make sure to add or replace full TabData with title and content, because loadTab won't be called after this
   * - if tabs is empty, but still remaining in layout because of panelLock, make sure also set the group if it's not null
   */
  afterPanelLoaded?(savedPanel: PanelBase, loadedPanel: PanelData): void

  style?: React.CSSProperties

  /**
   * when specified, docklayout will create a react portal for the maximized panel
   * use dom element as the value, or use the element's id
   */
  maximizeTo?: string | HTMLElement
}
