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
  /**
   * by default onDragStartT will be called on first drag move
   * but if directDragT is true, onDragStartT will be called as soon as mouse is down
   */
  directDragT?: boolean
  useRightButtonDragT?: boolean
}

export class DragDropDiv extends React.PureComponent<DragDropDivProps, any> {
  element: HTMLElement
  ownerDocument: Document
  _getRef = (r: HTMLDivElement) => {
    if (r === this.element) {
      return
    }
    let { getRef, onDragOverT } = this.props
    if (this.element && onDragOverT) {
      DragManager.removeHandlers(this.element)
    }
    this.element = r
    if (r) {
      this.ownerDocument = r.ownerDocument
    }
    if (getRef) {
      getRef(r)
    }
    if (r && onDragOverT) {
      DragManager.addHandlers(r, this.props)
    }
  }

  dragType: DragManager.DragType = null
  baseX: number
  baseY: number
  scaleX: number
  scaleY: number
  waitingMove = false
  listening = false

  baseX2: number
  baseY2: number
  baseDis: number
  baseAng: number

  onPointerDown = (e: React.MouseEvent) => {
    let nativeTarget = e.nativeEvent.target as HTMLElement
    if (
      nativeTarget instanceof HTMLInputElement ||
      nativeTarget instanceof HTMLTextAreaElement ||
      nativeTarget.classList.contains("drag-ignore")
    ) {
      // ignore drag from input element
      return
    }

    let { onDragStartT, useRightButtonDragT } = this.props
    let event = e.nativeEvent
    this.cancel()
    if (onDragStartT) {
      if (event.button === 2 && !useRightButtonDragT) {
        return
      }
      this.onDragStart(event)
    }
  }

  onDragStart(event: AbstractPointerEvent) {
    if (DragManager.isDragging()) {
      // same pointer event shouldn't trigger 2 drag start
      return
    }
    let state = new DragManager.DragState(event, this, true)
    this.baseX = state.pageX
    this.baseY = state.pageY

    let baseElement = this.element.parentElement
    let rect = baseElement.getBoundingClientRect()
    this.scaleX = baseElement.offsetWidth / Math.round(rect.width)
    this.scaleY = baseElement.offsetHeight / Math.round(rect.height)
    this.addDragListeners(event)
    if (this.props.directDragT) {
      this.executeFirstMove(state)
    }
  }

  addDragListeners(event: AbstractPointerEvent) {
    this.ownerDocument.addEventListener("mousemove", this.onMouseMove)
    this.ownerDocument.addEventListener("mouseup", this.onDragEnd)
    if ((event as MouseEvent).button === 2) {
      this.dragType = "right"
    } else {
      this.dragType = "left"
    }
    this.waitingMove = true
    this.listening = true
  }

  // return true for a valid move
  checkFirstMove(e: AbstractPointerEvent) {
    let state = new DragManager.DragState(e, this, true)
    if (!state.moved()) {
      // not a move
      return false
    }
    return this.executeFirstMove(state)
  }

  executeFirstMove(state: DragManager.DragState): boolean {
    let { onDragStartT } = this.props

    this.waitingMove = false
    onDragStartT(state)
    if (!DragManager.isDragging()) {
      this.onDragEnd()
      return false
    }
    state._onMove()
    this.ownerDocument.addEventListener("keydown", this.onKeyDown)
    return true
  }

  onMouseMove = (e: MouseEvent) => {
    let { onDragMoveT } = this.props
    if (this.waitingMove) {
      if (DragManager.isDragging()) {
        this.onDragEnd()
        return
      }
      if (!this.checkFirstMove(e)) {
        return
      }
    } else {
      let state = new DragManager.DragState(e, this)
      state._onMove()
      if (onDragMoveT) {
        onDragMoveT(state)
      }
    }
    e.preventDefault()
  }

  onDragEnd = (e?: MouseEvent) => {
    let { onDragEndT } = this.props
    let state = new DragManager.DragState(e, this)

    this.removeListeners()

    if (!this.waitingMove) {
      // e=null means drag is canceled
      state._onDragEnd(e == null)
      if (onDragEndT) {
        onDragEndT(state)
      }
    }

    this.cleanupDrag(state)
  }

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      this.cancel()
    }
  }

  cancel() {
    if (this.listening) {
      this.onDragEnd()
    }
  }

  removeListeners() {
    if (this.listening) {
      this.ownerDocument.removeEventListener("mousemove", this.onMouseMove)
      this.ownerDocument.removeEventListener("mouseup", this.onDragEnd)
    }

    this.ownerDocument.removeEventListener("keydown", this.onKeyDown)
    this.listening = false
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cleanupDrag(state: DragManager.DragState) {
    this.dragType = null
    this.waitingMove = false
  }

  render(): React.ReactNode {
    let { children, className, onDragStartT, ...others } = this.props
    let onMouseDown = this.onPointerDown
    if (!onDragStartT) {
      onMouseDown = null
    }
    if (onDragStartT) {
      if (className) {
        className = `${className} drag-initiator`
      } else {
        className = "drag-initiator"
      }
    }

    return (
      <div ref={this._getRef} className={className} {...others} onMouseDown={onMouseDown}>
        {children}
      </div>
    )
  }

  componentDidUpdate(prevProps: DragDropDivProps) {
    let { onDragOverT, onDragEndT, onDragLeaveT } = this.props
    if (
      this.element &&
      (prevProps.onDragOverT !== onDragOverT ||
        prevProps.onDragLeaveT !== onDragLeaveT ||
        prevProps.onDragEndT !== onDragEndT)
    ) {
      if (onDragOverT) {
        DragManager.addHandlers(this.element, this.props)
      } else {
        DragManager.removeHandlers(this.element)
      }
    }
  }

  componentWillUnmount(): void {
    let { onDragOverT } = this.props
    if (this.element && onDragOverT) {
      DragManager.removeHandlers(this.element)
    }
    this.cancel()
  }
}
