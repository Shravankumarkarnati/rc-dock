import type { TabNavListProps } from "rc-tabs/lib/TabNavList";
import * as React from "react";
import { useDockContext } from "./DockData";
import { DragDropDiv } from "./dragdrop/DragDropDiv";
import * as DragManager from "./dragdrop/DragManager";

/**
 * @return returns true if navigation is handled in local tab move, otherwise returns false
 */
function checkLocalTabMove(key: string, tabbar: HTMLDivElement): boolean {
  if (key === "ArrowLeft" || key === "ArrowRight") {
    let tabs = Array.from(tabbar.querySelectorAll(".dock-tab-btn"));
    let activeTab = tabbar.querySelector(".dock-tab-active>.dock-tab-btn");
    let i = tabs.indexOf(activeTab);
    if (i >= 0) {
      if (key === "ArrowLeft") {
        if (i > 0) {
          (tabs[i - 1] as HTMLElement).click();
          (tabs[i - 1] as HTMLElement).focus();
          return true;
        }
      } else {
        if (i < tabs.length - 1) {
          (tabs[i + 1] as HTMLElement).click();
          (tabs[i + 1] as HTMLElement).focus();
          return true;
        }
      }
    }
  }
  return false;
}

interface DockTabBarProps extends TabNavListProps {
  isMaximized: boolean;
  onDragStart?: DragManager.DragHandler;
  onDragMove?: DragManager.DragHandler;
  onDragEnd?: DragManager.DragHandler;
  TabNavList: React.ComponentType<TabNavListProps>;
}

export const DockTabBar = (props: DockTabBarProps) => {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    TabNavList,
    isMaximized,
    ...restProps
  } = props;

  const { navigateToPanel } = useDockContext();

  const [ref, setRef] = React.useState<null | HTMLDivElement>(null);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (ref && e.key.startsWith("Arrow")) {
        if (!checkLocalTabMove(e.key, ref) && !isMaximized) {
          navigateToPanel(ref, e.key);
        }
        e.stopPropagation();
        e.preventDefault();
      }
    },
    [navigateToPanel, isMaximized]
  );

  return (
    <DragDropDiv
      onDragStartT={onDragStart}
      onDragMoveT={onDragMove}
      onDragEndT={onDragEnd}
      role="tablist"
      className="dock-bar"
      onKeyDown={onKeyDown}
      getRef={setRef}
      tabIndex={-1}
    >
      <TabNavList {...restProps} />
    </DragDropDiv>
  );
};
