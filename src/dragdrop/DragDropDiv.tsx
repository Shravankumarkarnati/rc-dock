import * as React from "react"
import * as DragManager from "./DragManager"

export type AbstractPointerEvent = MouseEvent

interface DragDropDivProps extends React.HTMLAttributes<HTMLDivElement> {
  getRef?: (ref: HTMLDivElement) => void
  onDragStartT?: DragManager.DragHandler
  onDragMoveT?: DragManager.DragHandler
  onDragEndT?: DragManager.DragHandler
  onDragOverT?: DragManager.DragHandler
  onDragLeaveT?: DragManager.DragHandler
  /**
   * Anything returned by onDropT will be stored in DragState.dropped
   * return false to indicate the drop is canceled
   */
  onDropT?: DragManager.DropHandler
}

export const DragDropDiv = (props: DragDropDivProps) => {
  const {
    getRef,
    onDragStartT,
    onDragMoveT,
    onDragEndT,
    onDragOverT,
    onDragLeaveT,
    onDropT,
    children,
    className,
    ...others
  } = props

  const [element, setElement] = React.useState<HTMLDivElement | null>(null)
  const [ownerDocument, setOwnerDocument] = React.useState<Document | null>(null)

  const [event, setEvent] = React.useState<null | MouseEvent>(null)

  const dragComponent = React.useRef<DragManager.DragDropComponent | null>(null)

  const listening = React.useRef(false)
  const waitingMove = React.useRef(false)

  const ref = React.useCallback(
    (_ref: HTMLDivElement) => {
      setOwnerDocument(_ref.ownerDocument)
      getRef?.(_ref)
      setElement(_ref)
    },
    [getRef],
  )

  React.useEffect(() => {
    if (element) {
      if (onDragOverT) {
        DragManager.addHandlers(element, { onDragLeaveT, onDragOverT, onDropT })
      } else {
        DragManager.removeHandlers(element)
      }
    }

    return () => {
      if (element) {
        DragManager.removeHandlers(element)
      }
    }
  }, [element, onDragLeaveT, onDragOverT, onDropT])

  const onPointerDown = React.useCallback((e: React.MouseEvent) => {
    let nativeTarget = e.nativeEvent.target as HTMLElement
    if (
      nativeTarget instanceof HTMLInputElement ||
      nativeTarget instanceof HTMLTextAreaElement ||
      nativeTarget.classList.contains("drag-ignore")
    ) {
      // ignore drag from input element
      return
    }

    setEvent(e.nativeEvent)
  }, [])

  React.useEffect(() => {
    if (DragManager.isDragging()) {
      // same pointer event shouldn't trigger 2 drag start
      return
    }

    if (!element || !ownerDocument) {
      return
    }

    const onMouseMove = (e: MouseEvent) => {
      console.log("mousemove", e)
    }
    const onMouseUp = (e: MouseEvent) => {
      console.log("mouseup", e)
    }

    let state = new DragManager.DragState(event, this, true)
    let baseX = state.pageX
    let baseY = state.pageY

    let baseElement = element.parentElement
    let rect = baseElement.getBoundingClientRect()
    let scaleX = baseElement.offsetWidth / Math.round(rect.width)
    let scaleY = baseElement.offsetHeight / Math.round(rect.height)

    let dragType: DragManager.DragType

    ownerDocument.addEventListener("mousemove", onMouseMove)
    ownerDocument.addEventListener("mouseup", onMouseUp)
    if ((event as MouseEvent).button === 2) {
      dragType = "right"
    } else {
      dragType = "left"
    }
    waitingMove.current = true
    listening.current = true

    return () => {
      ownerDocument?.removeEventListener("mousemove", onMouseMove)
      ownerDocument?.removeEventListener("mouseup", onMouseUp)
    }
  }, [event, element, ownerDocument])

  let onMouseDown
  let _className = className

  if (onDragStartT) {
    onMouseDown = onPointerDown

    if (_className) {
      _className = `${_className} drag-initiator`
    } else {
      _className = "drag-initiator"
    }
  }

  return (
    <div ref={ref} className={_className} {...others} onMouseDown={onMouseDown}>
      {children}
    </div>
  )
}
