import { currentLayoutState, type LayoutState } from "../services/layout";
import type { InteractionMenuAnchor } from "../types/messages";

export interface Point {
  x: number;
  y: number;
}

export interface RectLike extends Point {
  width: number;
  height: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ContainerRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function viewportSize(layout: LayoutState = currentLayoutState()): { width: number; height: number } {
  return {
    width: Math.max(1, layout.gameWidth || layout.viewportWidth || 1),
    height: Math.max(1, layout.gameHeight || layout.viewportHeight || 1)
  };
}

export function visibleViewportSize(layout: LayoutState = currentLayoutState()): { width: number; height: number } {
  return {
    width: Math.max(1, layout.viewportWidth || layout.visualViewportWidth || layout.gameWidth || 1),
    height: Math.max(1, layout.viewportHeight || layout.visualViewportHeight || layout.gameHeight || 1)
  };
}

export function viewportCenter(layout: LayoutState = currentLayoutState(), visible = false): Point {
  const { width, height } = visible ? visibleViewportSize(layout) : viewportSize(layout);
  return { x: width / 2, y: height / 2 };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rectFromElement(element: Element | null | undefined): RectLike | null {
  const rect = element?.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height,
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom
  };
}

export function containerRect(container: Element | null | undefined, layout: LayoutState = currentLayoutState()): ContainerRect {
  const rect = container?.getBoundingClientRect();
  if (rect && rect.width > 0 && rect.height > 0) {
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  }
  const visible = visibleViewportSize(layout);
  return { left: 0, top: 0, width: visible.width, height: visible.height };
}

export function pointRelativeToContainer(
  point: Point,
  container: Element | null | undefined,
  layout: LayoutState = currentLayoutState()
): Point {
  const rect = containerRect(container, layout);
  return {
    x: Number(point.x || 0) - rect.left,
    y: Number(point.y || 0) - rect.top
  };
}

export function centerOfRect(rect: Pick<RectLike, "x" | "y"> | null | undefined, fallback: Point): Point {
  return rect ? { x: rect.x, y: rect.y } : fallback;
}

export function getElementRect(target: Element | string | null | undefined): RectLike | null {
  if (typeof document === "undefined" || !target) return null;
  const element = typeof target === "string" ? document.querySelector(target) : target;
  return rectFromElement(element);
}

export function seatCenter(viewIndex: number): Point | null {
  return getElementRect(`#seat${viewIndex} .avatar`) || getElementRect(`#seat${viewIndex}`);
}

export function cardRect(cardId: string): RectLike | null {
  if (!cardId || typeof document === "undefined") return null;
  return getElementRect(`#hand .card[data-id="${CSS.escape(cardId)}"]`);
}

export function trickSlotRect(viewIndex: number): RectLike | null {
  return getElementRect(`#slot${viewIndex} .card`) || getElementRect(`#slot${viewIndex}`);
}

export function cardPileCenter(viewIndex: number): Point | null {
  if (typeof document === "undefined") return null;
  const container = document.querySelector(viewIndex === 0 ? "#hand" : `#opHand${viewIndex}`);
  if (!container) return seatCenter(viewIndex);
  const cards = Array.from(container.querySelectorAll(viewIndex === 0 ? ".card:not(.passing-out)" : ".card-back"))
    .map(rectFromElement)
    .filter((rect): rect is RectLike => Boolean(rect));

  if (cards.length) {
    const middle = Math.floor(cards.length / 2);
    const focus = cards.length > 5 ? cards.slice(Math.max(0, middle - 2), Math.min(cards.length, middle + 3)) : cards;
    const sum = focus.reduce((acc, rect) => ({ x: acc.x + rect.x, y: acc.y + rect.y }), { x: 0, y: 0 });
    return { x: sum.x / focus.length, y: sum.y / focus.length };
  }

  return getElementRect(container) || seatCenter(viewIndex);
}

export function elementCenterRelativeToContainer(
  target: Element | string | null | undefined,
  container: Element | null | undefined,
  fallback: Point,
  layout: LayoutState = currentLayoutState()
): Point {
  const rect = getElementRect(target);
  return pointRelativeToContainer(centerOfRect(rect, fallback), container, layout);
}

export function cardPileCenterRelativeToContainer(
  viewIndex: number,
  container: Element | null | undefined,
  fallback: Point,
  layout: LayoutState = currentLayoutState()
): Point {
  const point = cardPileCenter(viewIndex) || seatCenter(viewIndex);
  return pointRelativeToContainer(point || fallback, container, layout);
}

export function cardCenterRelativeToContainer(
  cardId: string,
  container: Element | null | undefined,
  fallback: Point,
  layout: LayoutState = currentLayoutState()
): Point | null {
  const rect = cardRect(cardId);
  if (!rect) return null;
  return pointRelativeToContainer(rect, container, layout);
}

export function trickSlotCenterRelativeToContainer(
  viewIndex: number,
  container: Element | null | undefined,
  fallback: Point,
  layout: LayoutState = currentLayoutState()
): Point | null {
  const rect = trickSlotRect(viewIndex);
  if (!rect) return null;
  return pointRelativeToContainer(rect, container, layout);
}

export function isForcedLandscapeFlightMode(forceLandscape: boolean): boolean {
  if (typeof document === "undefined") return forceLandscape;
  return Boolean(forceLandscape || document.body.classList.contains("force-landscape"));
}

export function rotateVectorClockwise90(vector: Point): Point {
  return { x: -Number(vector.y || 0), y: Number(vector.x || 0) };
}

export function maybeRotateVectorForLandscape(vector: Point, forceLandscape: boolean): Point {
  return isForcedLandscapeFlightMode(forceLandscape) ? rotateVectorClockwise90(vector) : vector;
}

export function screenDirectionVector(viewIndex: number, forceLandscape: boolean): Point {
  let vector: Point = { x: 0, y: 0 };
  if (viewIndex === 0) vector = { x: 0, y: 1 };
  else if (viewIndex === 1) vector = { x: -1, y: 0 };
  else if (viewIndex === 2) vector = { x: 0, y: -1 };
  else if (viewIndex === 3) vector = { x: 1, y: 0 };
  return maybeRotateVectorForLandscape(vector, forceLandscape);
}

export function screenDirectionTarget(viewIndex: number, forceLandscape: boolean, margin = 86, layout: LayoutState = currentLayoutState()): Point {
  const { width, height } = viewportSize(layout);
  const vector = screenDirectionVector(viewIndex, forceLandscape);
  return {
    x: width / 2 + vector.x * (width / 2 + margin),
    y: height / 2 + vector.y * (height / 2 + margin)
  };
}

export function screenDirectionTargetVisible(viewIndex: number, forceLandscape: boolean, margin = 86, layout: LayoutState = currentLayoutState()): Point {
  const { width, height } = visibleViewportSize(layout);
  const vector = screenDirectionVector(viewIndex, forceLandscape);
  return {
    x: width / 2 + vector.x * (width / 2 + margin),
    y: height / 2 + vector.y * (height / 2 + margin)
  };
}

export function screenDirectionTargetInContainer(
  viewIndex: number,
  forceLandscape: boolean,
  margin = 86,
  container: Element | null | undefined,
  layout: LayoutState = currentLayoutState()
): Point {
  const rect = containerRect(container, layout);
  const vector = screenDirectionVector(viewIndex, forceLandscape);
  return {
    x: rect.width / 2 + vector.x * (rect.width / 2 + margin),
    y: rect.height / 2 + vector.y * (rect.height / 2 + margin)
  };
}

export function passArcVector(baseArcY: number, forceLandscape: boolean): Point {
  const vector = maybeRotateVectorForLandscape({ x: 0, y: Number(baseArcY || 0) }, forceLandscape);
  return { x: Math.round(vector.x || 0), y: Math.round(vector.y || 0) };
}

export function viewportDistance(a: Point, b: Point): number {
  return Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));
}

export function clampPointToViewport(point: Point, padding = 22, layout: LayoutState = currentLayoutState(), visible = false): Point {
  const { width, height } = visible ? visibleViewportSize(layout) : viewportSize(layout);
  return {
    x: clamp(Math.round(point.x || width / 2), padding, width - padding),
    y: clamp(Math.round(point.y || height / 2), padding, height - padding)
  };
}

export function normalizedVectorFromCenter(point: Point, layout: LayoutState = currentLayoutState(), visible = false): Point | null {
  const { width, height } = visible ? visibleViewportSize(layout) : viewportSize(layout);
  const dx = point.x - width / 2;
  const dy = point.y - height / 2;
  const length = Math.hypot(dx, dy);
  if (length < 12) return null;
  return { x: dx / length, y: dy / length };
}

export function interactionBubbleAnchor(viewIndex: number, forceLandscape: boolean, layout: LayoutState = currentLayoutState()): Point {
  const { width, height } = visibleViewportSize(layout);
  const base = seatCenter(viewIndex) || cardPileCenter(viewIndex) || { x: width / 2, y: height / 2 };
  const vector = normalizedVectorFromCenter(base, layout, true) || screenDirectionVector(viewIndex, forceLandscape);
  return clampPointToViewport({
    x: base.x - Number(vector.x || 0) * 48,
    y: base.y - Number(vector.y || 0) * 48
  }, 22, layout, true);
}

export function interactionPlacementForView(viewIndex: number): InteractionMenuAnchor["placement"] {
  if (viewIndex === 1) return "right";
  if (viewIndex === 2) return "below";
  if (viewIndex === 3) return "left";
  return "above";
}

export function interactionAnchorFromElement(
  viewIndex: number,
  target: Element | null | undefined,
  layout: LayoutState = currentLayoutState()
): InteractionMenuAnchor {
  const rect = target?.querySelector?.(".avatar")?.getBoundingClientRect() || target?.getBoundingClientRect();
  const fallback = viewportCenter(layout, true);
  const point = rect
    ? {
      x: rect.left + rect.width / 2,
      y: viewIndex === 2 ? rect.bottom + 8 : viewIndex === 0 ? rect.top - 8 : rect.top + rect.height / 2
    }
    : fallback;
  const clamped = clampPointToViewport(point, 22, layout, true);
  return {
    x: clamped.x,
    y: clamped.y,
    placement: interactionPlacementForView(viewIndex)
  };
}

export function centerInteractionAnchor(layout: LayoutState = currentLayoutState()): InteractionMenuAnchor {
  const center = viewportCenter(layout, true);
  return { x: center.x, y: center.y, placement: "center" };
}
