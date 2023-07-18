import * as React from "react";
import * as DragManager from "./DragManager";
import { GestureState } from "./GestureManager";
import { FC, useCallback, useEffect, useRef } from "react";

export type AbstractPointerEvent = MouseEvent | TouchEvent;

interface DragDropDivProps extends React.HTMLAttributes<HTMLDivElement> {
  getRef?: (ref: HTMLDivElement) => void;
  onDragStartT?: DragManager.DragHandler;
  onDragMoveT?: DragManager.DragHandler;
  onDragEndT?: DragManager.DragHandler;
  onDragOverT?: DragManager.DragHandler;
  onDragLeaveT?: DragManager.DragHandler;
  /**
   * Anything returned by onDropT will be stored in DragState.dropped
   * return false to indicate the drop is canceled
   */
  onDropT?: DragManager.DropHandler;
  /**
   * by default onDragStartT will be called on first drag move
   * but if directDragT is true, onDragStartT will be called as soon as mouse is down
   */
  directDragT?: boolean;
  useRightButtonDragT?: boolean;

  onGestureStartT?: (state: GestureState) => boolean;
  onGestureMoveT?: (state: GestureState) => void;
  onGestureEndT?: () => void;

  gestureSensitivity?: number;
}

export const DragDropDiv: FC<DragDropDivProps & any> = ({
  getRef,
  onDragStartT,
  onDragMoveT,
  onDragEndT,
  onDragOverT,
  onDragLeaveT,
  onDropT,
  directDragT,
  useRightButtonDragT,
  onGestureStartT,
  onGestureMoveT,
  onGestureEndT,
  gestureSensitivity,
  children,
  className,
  ...rest
}: DragDropDivProps) => {
  const element = useRef<HTMLElement>();
  const ownerDocument = useRef<Document>();
  const dragType = useRef<DragManager.DragType>(null);
  const baseX = useRef<number>();
  const baseY = useRef<number>();
  const scaleX = useRef<number>();
  const scaleY = useRef<number>();
  const baseX2 = useRef<number>();
  const baseY2 = useRef<number>();
  const baseDis = useRef<number>();
  const baseAng = useRef<number>();
  const waitingMove = useRef<boolean>();
  const listening = useRef<boolean>();
  const gesturing = useRef<boolean>();

  const localGetRef = useCallback(
    (r: HTMLDivElement) => {
      if (r === element.current) {
        return;
      }

      if (element && onDragOverT) {
        DragManager.removeHandlers(element.current);
      }
      element.current = r;
      if (r) {
        ownerDocument.current = r.ownerDocument;
      }
      getRef?.(r);

      if (r && onDragOverT) {
        DragManager.addHandlers(r, { onDragLeaveT, onDragOverT, onDropT });
      }
    },
    [
      getRef,
      onDragOverT,
      onDragLeaveT,
      onDropT,
      element.current,
      ownerDocument.current,
    ]
  );

  const onDragEnd = useCallback((e?: TouchEvent | MouseEvent) => {
    let state = new DragManager.DragState(e, this);

    removeListeners();

    if (!waitingMove.current) {
      // e=null means drag is canceled
      state._onDragEnd(e == null);
      onDragEndT?.(state);
    }

    cleanupDrag(state);
  }, []);

  const addDragListeners = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (event.type === "touchstart") {
        ownerDocument.current.addEventListener("touchmove", onTouchMove);
        ownerDocument.current.addEventListener("touchend", onDragEnd);
        dragType.current = "touch";
      } else {
        ownerDocument.current.addEventListener("mousemove", onMouseMove);
        ownerDocument.current.addEventListener("mouseup", onDragEnd);
        if ((event as MouseEvent).button === 2) {
          dragType.current = "right";
        } else {
          dragType.current = "left";
        }
      }
      waitingMove.current = true;
      listening.current = true;
    },
    [
      ownerDocument.current,
      dragType.current,
      waitingMove.current,
      listening.current,
    ]
  );

  const executeFirstMove = useCallback(
    (state: DragManager.DragState): boolean => {
      waitingMove.current = false;
      onDragStartT(state);
      if (!DragManager.isDragging()) {
        onDragEnd();
        return false;
      }
      state._onMove();
      ownerDocument.current.addEventListener("keydown", onKeyDown);
      return true;
    },
    [waitingMove.current, onDragStartT, onDragEnd, ownerDocument.current]
  );

  // return true for a valid move
  const checkFirstMove = useCallback(
    (e: AbstractPointerEvent) => {
      let state = new DragManager.DragState(e, this, true);
      if (!state.moved()) {
        // not a move
        return false;
      }
      return executeFirstMove(state);
    },
    [executeFirstMove]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (waitingMove.current) {
        if (DragManager.isDragging()) {
          onDragEnd();
          return;
        }
        if (!checkFirstMove(e)) {
          return;
        }
      } else {
        let state = new DragManager.DragState(e, this);
        state._onMove();
        onDragMoveT?.(state);
      }
      e.preventDefault();
    },
    [onDragEnd, waitingMove.current, onDragMoveT]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (waitingMove.current) {
        if (DragManager.isDragging()) {
          onDragEnd();
          return;
        }
        if (!checkFirstMove(e)) {
          return;
        }
      } else if (e.touches.length !== 1) {
        onDragEnd();
      } else {
        let state = new DragManager.DragState(e, this);
        state._onMove();
        if (onDragMoveT) {
          onDragMoveT(state);
        }
      }
      e.preventDefault();
    },
    [waitingMove.current, onDragEnd, checkFirstMove, onDragMoveT]
  );

  const onGestureStart = useCallback(
    (event: TouchEvent) => {
      if (!DragManager.isDragging()) {
        // same pointer event shouldn't trigger 2 drag start
        return;
      }

      baseX.current = event.touches[0].pageX;
      baseY.current = event.touches[0].pageY;
      baseX2.current = event.touches[1].pageX;
      baseY2.current = event.touches[1].pageY;
      let baseElement = element.current.parentElement;
      let rect = baseElement.getBoundingClientRect();
      scaleX.current = baseElement.offsetWidth / Math.round(rect.width);
      scaleY.current = baseElement.offsetHeight / Math.round(rect.height);
      baseDis.current = Math.sqrt(
        Math.pow(baseX.current - baseX2.current, 2) +
          Math.pow(baseY.current - baseY2.current, 2)
      );
      baseAng.current = Math.atan2(
        baseY2.current - baseY.current,
        baseX2.current - baseX.current
      );

      let state = new GestureState(event, this, true);
      if (onGestureStartT(state)) {
        addGestureListeners(event);
        event.preventDefault();
      }
    },
    [
      baseX.current,
      baseY.current,
      baseX2.current,
      baseY2.current,
      element.current,
      scaleX.current,
      scaleY.current,
      baseDis.current,
      baseAng.current,
      onGestureStartT,
      addGestureListeners,
    ]
  );

  const removeListeners = useCallback(() => {
    if (gesturing.current) {
      ownerDocument.current.removeEventListener("touchmove", onGestureMove);
      ownerDocument.current.removeEventListener("touchend", onGestureEnd);
    } else if (listening.current) {
      if (dragType.current === "touch") {
        ownerDocument.current.removeEventListener("touchmove", onTouchMove);
        ownerDocument.current.removeEventListener("touchend", onDragEnd);
      } else {
        ownerDocument.current.removeEventListener("mousemove", onMouseMove);
        ownerDocument.current.removeEventListener("mouseup", onDragEnd);
      }
    }

    ownerDocument.current.removeEventListener("keydown", onKeyDown);
    listening.current = false;
    gesturing.current = false;
  }, [
    ownerDocument.current,
    gesturing.current,
    dragType.current,
    listening.current,
    onGestureMove,
    onTouchMove,
    onDragEnd,
    onMouseMove,
    onDragEnd,
    onKeyDown,
  ]);

  const onGestureEnd = useCallback(
    (e?: TouchEvent) => {
      removeListeners();
      onGestureEndT?.();
    },
    [removeListeners, onGestureEndT]
  );

  const cancel = useCallback(() => {
    if (listening.current) {
      onDragEnd();
    }
    if (gesturing.current) {
      onGestureEnd();
    }
  }, [listening.current, onDragEnd, onGestureEnd]);

  const onDragStart = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (DragManager.isDragging()) {
        // same pointer event shouldn't trigger 2 drag start
        return;
      }
      let state = new DragManager.DragState(event, this, true);
      baseX.current = state.pageX;
      baseY.current = state.pageY;

      let baseElement = element.current.parentElement;
      let rect = baseElement.getBoundingClientRect();
      scaleX.current = baseElement.offsetWidth / Math.round(rect.width);
      scaleY.current = baseElement.offsetHeight / Math.round(rect.height);
      addDragListeners(event);
      if (directDragT) {
        executeFirstMove(state);
      }
    },
    [
      baseX.current,
      baseY.current,
      element.current,
      scaleX.current,
      scaleY.current,
      addDragListeners,
      executeFirstMove,
    ]
  );

  const onPointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      let nativeTarget = e.nativeEvent.target as HTMLElement;
      if (
        nativeTarget instanceof HTMLInputElement ||
        nativeTarget instanceof HTMLTextAreaElement ||
        nativeTarget.classList.contains("drag-ignore")
      ) {
        // ignore drag from input element
        return;
      }

      let event = e.nativeEvent;
      cancel();
      if (event.type === "touchstart") {
        // check single or double fingure touch
        if ((event as TouchEvent).touches.length === 1) {
          if (onDragStartT) {
            onDragStart(event);
          }
        } else if ((event as TouchEvent).touches.length === 2) {
          if (onGestureStartT && onGestureMoveT) {
            onGestureStart(event as TouchEvent);
          }
        }
      } else if (onDragStartT) {
        if ((event as MouseEvent).button === 2 && !useRightButtonDragT) {
          return;
        }
        onDragStart(event);
      }
    },
    [onDragStartT, onDragStart, onGestureStartT, onGestureMoveT, onGestureStart]
  );

  const onGestureMove = useCallback(
    (e: TouchEvent) => {
      let state = new GestureState(e, this);
      if (waitingMove.current) {
        if (!(gestureSensitivity > 0)) {
          gestureSensitivity = 10; // default sensitivity
        }
        if (state.moved() > gestureSensitivity) {
          waitingMove.current = false;
        } else {
          return;
        }
      }

      onGestureMoveT?.(state);
    },
    [waitingMove.current, gestureSensitivity, onGestureMoveT, onGestureMoveT]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancel();
      }
    },
    [cancel]
  );

  const addGestureListeners = useCallback(
    (event: TouchEvent) => {
      ownerDocument.current.addEventListener("touchmove", onGestureMove);
      ownerDocument.current.addEventListener("touchend", onGestureEnd);
      ownerDocument.current.addEventListener("keydown", onKeyDown);
      gesturing.current = true;
      waitingMove.current = true;
    },
    [
      ownerDocument.current,
      onGestureMove,
      onGestureEnd,
      onKeyDown,
      gesturing.current,
      waitingMove.current,
    ]
  );

  const cleanupDrag = useCallback(
    (state: DragManager.DragState) => {
      dragType.current = null;
      waitingMove.current = false;
    },
    [dragType.current, waitingMove.current]
  );

  useCallback(() => {
    if (element.current) {
      if (onDragOverT) {
        DragManager.addHandlers(element.current, {
          onDragLeaveT,
          onDragOverT,
          onDropT,
        });
      } else {
        DragManager.removeHandlers(element.current);
      }
    }
  }, [onDragOverT, onDragLeaveT, onDragEndT]);

  useEffect(() => {
    return () => {
      if (element.current && onDragOverT) {
        DragManager.removeHandlers(element.current);
      }
      cancel();
    };
  }, [onDragOverT]);

  let onTouchDown = onPointerDown;
  let onMouseDown = onPointerDown;

  if (!onDragStartT) {
    onMouseDown = null;
    if (!onGestureStartT) {
      onTouchDown = null;
    }
  }
  if (onDragStartT || onGestureStartT) {
    if (className) {
      className = `${className} drag-initiator`;
    } else {
      className = "drag-initiator";
    }
  }

  return (
    <div
      ref={localGetRef}
      className={className}
      {...rest}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchDown}
    >
      {children}
    </div>
  );
};
