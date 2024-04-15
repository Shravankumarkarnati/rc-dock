import classNames from "classnames"
import { groupClassNames } from "../Utils"
import once from "lodash/once"

export type DragType = "left" | "right"

interface DragDropComponent {
  element: HTMLElement
  ownerDocument: Document
  dragType: DragType
  baseX: number
  baseY: number
  scaleX: number
  scaleY: number
}

export type DragHandler = (state: DragState) => void
export type DropHandler = (state: DragState) => any

export interface DragHandlers {
  onDragOverT?: DragHandler
  onDragLeaveT?: DragHandler
  onDropT?: DropHandler
}

type DragListener = (scope: any) => void

const DragManagerSingleton = once(() => {
  const dragStateListeners = new Set<DragListener>()
  const dragListeners = new WeakMap<HTMLElement, DragHandlers>()

  let droppingHandlers: null | DragHandlers = null

  const setDroppingHandler = (handlers: DragHandlers, state: DragState) => {
    if (droppingHandlers === handlers) {
      return
    }
    if (droppingHandlers && droppingHandlers.onDragLeaveT) {
      droppingHandlers.onDragLeaveT(state)
    }
    droppingHandlers = handlers
  }

  const addDragStateListener = (listener: DragListener) => {
    dragStateListeners.add(listener)

    return () => {
      dragStateListeners.delete(listener)
    }
  }

  const addDragHandlers = (element: HTMLElement, handlers: DragHandlers) => {
    dragListeners.set(element, handlers)

    return () => {
      const handlers = dragListeners.get(element)
      if (handlers === droppingHandlers) {
        droppingHandlers = null
      }
      dragListeners.delete(element)
    }
  }

  const draggingElement = {
    onCreate: (dataScope?: any) => {
      for (let callback of dragStateListeners) {
        callback(dataScope ?? true)
      }
    },
    onMove: setDroppingHandler,
    onDragEnd: (state: DragState) => {
      if (droppingHandlers && droppingHandlers.onDropT) {
        return droppingHandlers.onDropT(state)
      }
      return null
    },
    onDelete: (state: DragState) => {
      setDroppingHandler(null, state)

      for (let callback of dragStateListeners) {
        callback(null)
      }
    },
  }

  const getDragHandlers = (el: HTMLElement) => dragListeners.get(el)

  return {
    draggingElement,
    addDragStateListener,
    addDragHandlers,
    getDragHandlers,
  }
})

class DraggingElement {
  private draggingDiv: HTMLElement
  private draggingIcon: HTMLElement

  public constructor(
    private state: DragState,
    private refElement: HTMLElement,
    draggingHtml?: HTMLElement | string,
    private data?: Record<string, unknown>,
  ) {
    if (refElement) {
      refElement.classList.add("dragging")
    }

    this.createDraggingElements(state.component.ownerDocument)
    state.component.ownerDocument.body.appendChild(this.draggingDiv)

    let draggingWidth = 0
    let draggingHeight = 0
    if (draggingHtml === undefined) {
      draggingHtml = state.component.element
    }
    if (draggingHtml && "outerHTML" in (draggingHtml as any)) {
      draggingWidth = (draggingHtml as HTMLElement).offsetWidth
      draggingHeight = (draggingHtml as HTMLElement).offsetHeight
      draggingHtml = (draggingHtml as HTMLElement).outerHTML
    }
    if (draggingHtml) {
      this.draggingDiv.firstElementChild.outerHTML = draggingHtml as string
      if (
        window.getComputedStyle(this.draggingDiv.firstElementChild).backgroundColor ===
        "rgba(0, 0, 0, 0)"
      ) {
        ;(this.draggingDiv.firstElementChild as HTMLElement).style.backgroundColor = window
          .getComputedStyle(this.draggingDiv)
          .getPropertyValue("--default-background-color")
      }
      if (draggingWidth) {
        if (draggingWidth > 400) draggingWidth = 400
        ;(this.draggingDiv.firstElementChild as HTMLElement).style.width = `${draggingWidth}px`
      }
      if (draggingHeight) {
        if (draggingHeight > 300) draggingHeight = 300
        ;(this.draggingDiv.firstElementChild as HTMLElement).style.height = `${draggingHeight}px`
      }
    }
  }

  public move() {
    this.draggingDiv.style.left = `${this.state.pageX}px`
    this.draggingDiv.style.top = `${this.state.pageY}px`

    if (this.state.rejected) {
      this.draggingIcon.className = "drag-accept-reject"
    } else if (this.state.acceptMessage) {
      this.draggingIcon.className = this.state.acceptMessage
    } else {
      this.draggingIcon.className = ""
    }
  }

  public destroyDraggingElement() {
    if (this.refElement) {
      this.refElement.classList.remove("dragging")
    }
    if (this.draggingDiv) {
      this.draggingDiv.remove()
    }
  }

  private createDraggingElements(doc: Document) {
    const _draggingDiv = doc.createElement("div")
    const _draggingIcon = doc.createElement("div")

    const tabGroup = (this.data && "tabGroup" in this.data ? this.data["tabGroup"] : undefined) as
      | string
      | undefined

    _draggingDiv.className = classNames(groupClassNames(tabGroup), "dragging-layer")

    _draggingDiv.appendChild(document.createElement("div")) // place holder for dragging element
    _draggingDiv.appendChild(_draggingIcon)

    this.draggingDiv = _draggingDiv
    this.draggingIcon = _draggingIcon
  }
}

export class DragState {
  public pageX: number = 0
  public pageY: number = 0

  public dropped: any = false
  public rejected: boolean
  public acceptMessage: string

  private clientX: number = 0
  private clientY: number = 0

  private dx: number = 0
  private dy: number = 0

  private draggingElement: DraggingElement | null = null

  private data: Record<string, unknown> = {}
  private dataScope: any = null

  public constructor(
    event: MouseEvent,
    public component: DragDropComponent,
    private init = false,
  ) {
    if (event) {
      if ("pageX" in event) {
        this.pageX = event.pageX
        this.pageY = event.pageY
        this.clientX = event.clientX
        this.clientY = event.clientY
      }
      this.dx = (this.pageX - component.baseX) * component.scaleX
      this.dy = (this.pageY - component.baseY) * component.scaleY
    }
  }

  public moved(): boolean {
    return Math.abs(this.dx) >= 1 || Math.abs(this.dy) >= 1
  }

  public setData(data?: { [key: string]: any }, scope?: any) {
    if (!this.init) {
      throw new Error("setData can only be used in onDragStart callback")
    }

    this.dataScope = scope
    this.data = data
  }

  public getData(field: string, scope?: any) {
    if (scope === this.dataScope && this.data) {
      return this.data[field]
    }
    return null
  }

  public get dragType(): DragType {
    return this.component.dragType
  }

  public accept(message: string = "") {
    this.acceptMessage = message
    this.rejected = false
  }

  public reject() {
    this.rejected = true
  }

  public isDragging() {
    return !!this.draggingElement
  }

  public startDrag(refElement?: HTMLElement, draggingHtml?: HTMLElement | string) {
    if (!this.init) {
      throw new Error("startDrag can only be used in onDragStart callback")
    }
    if (refElement === undefined) {
      refElement = this.component.element
    }

    this.draggingElement = new DraggingElement(this, refElement, draggingHtml, this.data)
    DragManagerSingleton().draggingElement.onCreate(this.dataScope)
    this.component.ownerDocument.body.classList.add("dock-dragging")
  }

  public onMove() {
    if (this.data) {
      let ownerDocument = this.component.ownerDocument
      let searchElement = ownerDocument.elementFromPoint(this.clientX, this.clientY) as HTMLElement
      let droppingHandlers: DragHandlers
      while (searchElement && searchElement !== ownerDocument.body) {
        let handlers = DragManagerSingleton().getDragHandlers(searchElement)
        if (handlers) {
          if (handlers.onDragOverT) {
            handlers.onDragOverT(this)
            if (this.acceptMessage != null) {
              droppingHandlers = handlers
              break
            }
          }
        }
        searchElement = searchElement.parentElement
      }
      DragManagerSingleton().draggingElement.onMove(droppingHandlers, this)
    }
    this.draggingElement.move()
  }

  public onDragEnd(canceled: boolean = false) {
    if (!canceled) {
      this.dropped = DragManagerSingleton().draggingElement.onDragEnd(this)

      const preventDefault = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
      }

      if (this.component.dragType === "right") {
        // prevent the next menu event if drop handler is called on right mouse button
        this.component.ownerDocument.addEventListener("contextmenu", preventDefault, true)
        setTimeout(() => {
          this.component.ownerDocument.removeEventListener("contextmenu", preventDefault, true)
        }, 0)
      }
    }

    this.draggingElement.destroyDraggingElement()
    DragManagerSingleton().draggingElement.onDelete(this)

    this.draggingElement = null
    this.data = {}
    this.dataScope = null

    this.component.ownerDocument.body.classList.remove("dock-dragging")
  }
}
