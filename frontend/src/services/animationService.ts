import { animate } from "animejs";
import type { Card, DisplayInteractionEvent, SettingsState, SpecialEvent, TrickPlay } from "../types/messages";
import { cardVisualClass, rankText, SUITS } from "../utils/cards";
import {
  cardPileCenter,
  cardPileCenterRelativeToContainer,
  containerRect,
  cardRect,
  interactionBubbleAnchor,
  passArcVector,
  screenDirectionTargetVisible,
  pointRelativeToContainer,
  seatCenter,
  trickSlotCenterRelativeToContainer,
  viewportDistance,
  visibleViewportSize,
  type Point,
  type RectLike
} from "../utils/geometry";
import type { LayoutState } from "../services/layout";

export interface AnimationRuntimeSettings {
  settings: SettingsState;
  forceLandscape: boolean;
  layout: LayoutState;
}

export interface PassFlowAnimationItem {
  fromView: number;
  toView: number;
  count: number;
}

const CARD_CORNER_HTML = (card: Card): string => {
  const suit = SUITS[card.suit];
  const rank = rankText(card.rank);
  const symbol = suit?.symbol || card.suit;
  return `
    <div class="card-corner">${rank}<br />${symbol}</div>
    <div class="card-pip">${symbol}</div>
    <div class="card-corner bottom">${rank}<br />${symbol}</div>
  `;
};

let runningAnimations: Array<{ revert: () => unknown }> = [];

function canUseDOM(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function prefersReducedMotion(): boolean {
  return canUseDOM() && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
}

export function shouldPlayGameAnimation(settings: SettingsState): boolean {
  return Boolean(settings.effectsEnabled && !prefersReducedMotion());
}

export function shouldPlayInteractionAnimation(settings: SettingsState): boolean {
  return Boolean(settings.interactionEffectsEnabled && !prefersReducedMotion());
}

export function animationDuration(baseMs: number, settings: SettingsState): number {
  return Math.max(120, Math.round(baseMs * Math.max(0.7, Math.min(1.4, Number(settings.effectSpeed || 1)))));
}

export function nextAnimationFrame(): Promise<void> {
  if (!canUseDOM()) return Promise.resolve();
  return new Promise(resolve => window.requestAnimationFrame(() => resolve()));
}

function layerById(id: string): HTMLElement | null {
  return canUseDOM() ? document.getElementById(id) : null;
}

export function clearAnimationLayer(id: string): void {
  const layer = layerById(id);
  if (layer) layer.innerHTML = "";
}

export function cleanupAnimationNode(node: HTMLElement | null | undefined): void {
  try {
    node?.remove();
  } catch {
    // Animation nodes are non-critical visual affordances.
  }
}

export function cancelRunningAnimations(): void {
  for (const animation of runningAnimations.splice(0)) {
    try {
      animation.revert();
    } catch {
      // Ignore stale Anime.js handles during resize or unmount.
    }
  }
}

function setLayerNodeBasics(node: HTMLElement, point: Point, forceLandscape: boolean): void {
  node.style.left = `${Math.round(point.x)}px`;
  node.style.top = `${Math.round(point.y)}px`;
  node.style.setProperty("--screen-rot", forceLandscape ? "90deg" : "0deg");
  node.style.setProperty("animation", "none", "important");
}

function appendToLayer(layerId: string, node: HTMLElement): HTMLElement | null {
  const layer = layerById(layerId);
  if (!layer) return null;
  layer.appendChild(node);
  return node;
}

function createCardElement(card: Card, small: boolean, extraClass: string): HTMLElement {
  const suit = SUITS[card.suit];
  const node = document.createElement("div");
  node.className = [
    "card",
    small ? "small" : "",
    suit?.color || "",
    cardVisualClass(card),
    extraClass
  ].filter(Boolean).join(" ");
  node.dataset.id = card.id;
  node.title = `${suit?.name || card.suit}${rankText(card.rank)}`;
  node.innerHTML = CARD_CORNER_HTML(card);
  return node;
}

export function createFlyingCard(card: Card | null, className: string): HTMLElement {
  if (card) return createCardElement(card, true, className);
  const node = document.createElement("div");
  node.className = className;
  return node;
}

export function createFlyingItem(icon: string, className = "interaction-fly-item"): HTMLElement {
  const node = document.createElement("div");
  node.className = className;
  node.textContent = icon;
  node.style.marginLeft = "-23px";
  node.style.marginTop = "-23px";
  return node;
}

export async function runAnimeTimeline(node: HTMLElement, params: Parameters<typeof animate>[1]): Promise<void> {
  const animation = animate(node, params);
  runningAnimations.push(animation);
  try {
    await animation.then(() => undefined);
  } finally {
    runningAnimations = runningAnimations.filter(item => item !== animation);
  }
}

async function animateNode(node: HTMLElement, params: Parameters<typeof animate>[1]): Promise<void> {
  try {
    await runAnimeTimeline(node, params);
  } catch {
    // Visual animation failures must not affect gameplay.
  }
}

function safePoint(rect: RectLike | Point | null, fallback: Point): Point {
  return rect ? { x: rect.x, y: rect.y } : fallback;
}

function shouldUseMobileCollectAnimation(runtime: AnimationRuntimeSettings): boolean {
  return Boolean(runtime.layout.isMobile && (runtime.layout.isRealLandscape || runtime.forceLandscape || runtime.layout.isCompactLandscape));
}

function passTargetForMode(passMode: number): number {
  if (passMode === 1) return 3;
  if (passMode === 2) return 2;
  return 1;
}

function collectTargetForView(viewIndex: number, layer: Element | null, fallback: Point, runtime: AnimationRuntimeSettings): Point {
  return cardPileCenterRelativeToContainer(viewIndex, layer, fallback, runtime.layout)
    || pointRelativeToContainer(seatCenter(viewIndex) || fallback, layer, runtime.layout);
}

export async function playLocalPassAnimation(cardIds: readonly string[], passMode: number, runtime: AnimationRuntimeSettings): Promise<void> {
  if (!canUseDOM() || !shouldPlayGameAnimation(runtime.settings) || passMode === 3 || !cardIds.length) return;
  const targetView = passTargetForMode(passMode);
  const layer = layerById("passFlightLayer");
  if (!layer) return;
  const layerBox = containerRect(layer, runtime.layout);
  const fallback = { x: layerBox.width / 2, y: layerBox.height / 2 };
  const end = cardPileCenterRelativeToContainer(targetView, layer, fallback, runtime.layout);

  const animations = cardIds.slice(0, 3).map(async (cardId, index) => {
    const rect = cardRect(cardId);
    if (!rect) return;
    const start = pointRelativeToContainer(rect, layer, runtime.layout);
    const node = createFlyingCard(null, "pass-flight-card");
    setLayerNodeBasics(node, start, runtime.forceLandscape);
    node.style.setProperty("--pass-fly-rot", `${(index - 1) * 9}deg`);
    appendToLayer("passFlightLayer", node);
    const distance = viewportDistance(start, end);
    const arc = passArcVector(-Math.max(18, Math.min(44, distance * 0.07)) + index * 5, runtime.forceLandscape);
    const dx = Math.round(end.x - start.x);
    const dy = Math.round(end.y - start.y);
    await animateNode(node, {
      delay: index * 96,
      duration: animationDuration(1180, runtime.settings),
      ease: "out(3)",
      opacity: [0, 1, 1, 0],
      x: [0, Math.round(dx * 0.38 + arc.x), Math.round(dx * 0.82 + arc.x * 0.35), dx],
      y: [0, Math.round(dy * 0.38 + arc.y), Math.round(dy * 0.82 + arc.y * 0.25), dy],
      scale: [0.58, 0.98, 0.78, 0.56],
      rotate: [`${(index - 1) * 9}deg`, `${(index - 1) * 9 + 6}deg`, `${(index - 1) * 9 + 11}deg`, `${(index - 1) * 9 + 14}deg`],
      filter: ["brightness(1.16) saturate(1.05)", "brightness(1.24) saturate(1.12)", "brightness(1.08) saturate(1.02)", "brightness(.96) saturate(.92)"],
      onComplete: () => cleanupAnimationNode(node)
    });
  });
  await Promise.all(animations);
}

export async function playPassFlowAnimation(items: readonly PassFlowAnimationItem[], runtime: AnimationRuntimeSettings): Promise<void> {
  if (!canUseDOM() || !shouldPlayGameAnimation(runtime.settings) || !items.length) return;
  clearAnimationLayer("passFlightLayer");
  const layer = layerById("passFlightLayer");
  if (!layer) return;
  const layerBox = containerRect(layer, runtime.layout);
  const fallback = { x: layerBox.width / 2, y: layerBox.height / 2 };
  const animations: Promise<void>[] = [];

  items.forEach((item, flowIndex) => {
    const start = cardPileCenterRelativeToContainer(item.fromView, layer, fallback, runtime.layout);
    const end = cardPileCenterRelativeToContainer(item.toView, layer, fallback, runtime.layout);
    const count = Math.max(1, Math.min(3, Number(item.count || 3)));
    for (let index = 0; index < count; index += 1) {
      const node = createFlyingCard(null, "pass-flight-card");
      setLayerNodeBasics(node, start, runtime.forceLandscape);
      appendToLayer("passFlightLayer", node);
      const distance = viewportDistance(start, end);
      const arc = passArcVector(-Math.max(10, Math.min(34, distance * 0.055)) + index * 4, runtime.forceLandscape);
      const dx = Math.round(end.x - start.x);
      const dy = Math.round(end.y - start.y);
      animations.push(animateNode(node, {
        delay: flowIndex * 145 + index * 104,
        duration: animationDuration(1420, runtime.settings),
        ease: "out(3)",
        opacity: [0, 1, 1, 0],
        x: [0, Math.round(dx * 0.31 + arc.x), Math.round(dx * 0.71 + arc.x * 0.4), dx],
        y: [0, Math.round(dy * 0.31 + arc.y), Math.round(dy * 0.71 + arc.y * 0.45), dy],
        scale: [0.6, 0.94, 0.98, 0.62],
        rotate: [`${(index - 1) * 9}deg`, `${(index - 1) * 9 + 4}deg`, `${(index - 1) * 9 + 8}deg`, `${(index - 1) * 9 + 14}deg`],
        filter: ["brightness(1.15) saturate(1.05)", "brightness(1.22) saturate(1.10)", "brightness(1.10) saturate(1.02)", "brightness(.98) saturate(.94)"],
        onComplete: () => cleanupAnimationNode(node)
      }));
    }
  });

  await Promise.all(animations);
}

export async function playCollectAnimation(trick: readonly TrickPlay[], winnerView: number, runtime: AnimationRuntimeSettings): Promise<void> {
  if (!canUseDOM() || !shouldPlayGameAnimation(runtime.settings) || trick.length !== 4 || winnerView == null) return;
  if (shouldUseMobileCollectAnimation(runtime)) {
    await playMobileCollectAnimation(trick, winnerView, runtime);
    return;
  }

  clearAnimationLayer("collectFlightLayer");
  const layer = layerById("collectFlightLayer");
  if (!layer) return;
  const layerBox = containerRect(layer, runtime.layout);
  const fallback = { x: layerBox.width / 2, y: layerBox.height / 2 };
  const winnerRect = trickSlotCenterRelativeToContainer(winnerView, layer, fallback, runtime.layout)
    || pointRelativeToContainer(seatCenter(winnerView) || fallback, layer, runtime.layout);
  const target = collectTargetForView(winnerView, layer, fallback, runtime);
  if (!target) return;

  const loserOrder = trick.map(item => item.player).filter(player => player !== winnerView);
  const animations = trick.map(async play => {
    const rect = trickSlotCenterRelativeToContainer(play.player, layer, fallback, runtime.layout)
      || pointRelativeToContainer(seatCenter(play.player) || fallback, layer, runtime.layout);
    if (!play.card) return;
    const isWinner = play.player === winnerView;
    const loserIndex = Math.max(0, loserOrder.indexOf(play.player));
    const stackOffsetX = isWinner ? 0 : [-8, 0, 8][loserIndex % 3];
    const stackOffsetY = isWinner ? 0 : 10 + loserIndex * 5;
    const gatherX = Math.round(winnerRect.x - rect.x + stackOffsetX);
    const gatherY = Math.round(winnerRect.y - rect.y + stackOffsetY);
    const finalX = Math.round(target.x - rect.x + stackOffsetX);
    const finalY = Math.round(target.y - rect.y + stackOffsetY);
    const travel = Math.hypot(finalX - gatherX, finalY - gatherY);
    const duration = animationDuration(Math.max(1280, Math.min(1980, 1080 + travel * 0.46)), runtime.settings);
    const stackRot = isWinner ? 0 : [-7, 2, 8][loserIndex % 3];
    const endRot = isWinner ? 0 : [-9, 3, 10][loserIndex % 3];

    const node = createFlyingCard(play.card, "collect-flight-card");
    setLayerNodeBasics(node, rect, runtime.forceLandscape);
    node.style.setProperty("--collect-z", isWinner ? "44" : String(40 - loserIndex));
    appendToLayer("collectFlightLayer", node);
    await animateNode(node, {
      duration,
      ease: "out(3)",
      opacity: [1, 1, 1, 0],
      x: [0, gatherX, gatherX, Math.round(finalX * 0.72 + gatherX * 0.28), finalX],
      y: [0, gatherY, gatherY, Math.round(finalY * 0.72 + gatherY * 0.28), finalY],
      scale: [0.98, 0.94, 0.94, 0.68, 0.48],
      rotate: ["0deg", `${stackRot}deg`, `${stackRot}deg`, `${endRot}deg`, `${endRot}deg`],
      filter: [
        "brightness(1.10) saturate(1.05)",
        "brightness(1.22) saturate(1.12)",
        "brightness(1.18) saturate(1.08)",
        "brightness(1.08) saturate(1.02)",
        "brightness(.92) saturate(.90)"
      ],
      onComplete: () => cleanupAnimationNode(node)
    });
  });

  await Promise.all(animations);
}

async function playMobileCollectAnimation(trick: readonly TrickPlay[], winnerView: number, runtime: AnimationRuntimeSettings): Promise<void> {
  clearAnimationLayer("collectFlightLayer");
  const layer = layerById("collectFlightLayer");
  if (!layer) return;
  const layerBox = containerRect(layer, runtime.layout);
  const fallback = { x: layerBox.width / 2, y: layerBox.height / 2 };
  const winnerSeat = seatCenter(winnerView);
  const winnerSlot = trickSlotCenterRelativeToContainer(winnerView, layer, fallback, runtime.layout);
  const gather = winnerSlot || pointRelativeToContainer(winnerSeat || fallback, layer, runtime.layout);
  const target = collectTargetForView(winnerView, layer, fallback, runtime);
  const loserOrder = trick.map(item => item.player).filter(player => player !== winnerView);
  const duration = Math.min(1180, animationDuration(980, runtime.settings));

  const animations = trick.map(async play => {
    if (!play.card) return;
    const start = trickSlotCenterRelativeToContainer(play.player, layer, fallback, runtime.layout)
      || pointRelativeToContainer(seatCenter(play.player) || fallback, layer, runtime.layout);
    const isWinner = play.player === winnerView;
    const loserIndex = Math.max(0, loserOrder.indexOf(play.player));
    const stackOffsetX = isWinner ? 0 : [-5, 0, 5][loserIndex % 3];
    const stackOffsetY = isWinner ? 0 : 7 + loserIndex * 4;
    const gatherX = Math.round(gather.x - start.x + stackOffsetX);
    const gatherY = Math.round(gather.y - start.y + stackOffsetY);
    const finalX = Math.round(target.x - start.x + stackOffsetX);
    const finalY = Math.round(target.y - start.y + stackOffsetY);
    const stackRot = isWinner ? 0 : [-5, 2, 6][loserIndex % 3];
    const node = createFlyingCard(play.card, "collect-flight-card mobile-collect-card");
    setLayerNodeBasics(node, start, runtime.forceLandscape);
    node.style.setProperty("--collect-z", isWinner ? "44" : String(40 - loserIndex));
    appendToLayer("collectFlightLayer", node);
    await animateNode(node, {
      duration,
      ease: "out(2)",
      opacity: [1, 1, 1, 0],
      x: [0, gatherX, gatherX, finalX],
      y: [0, gatherY, gatherY, finalY],
      scale: [0.9, 0.78, 0.78, 0.44],
      rotate: ["0deg", `${stackRot}deg`, `${stackRot}deg`, `${stackRot + 6}deg`],
      filter: [
        "brightness(1.10) saturate(1.05)",
        "brightness(1.12) saturate(1.04)",
        "brightness(1.06) saturate(1.00)",
        "brightness(.92) saturate(.88)"
      ],
      onComplete: () => cleanupAnimationNode(node)
    });
  });

  await Promise.all(animations);
}

export async function playInteractionFlight(event: DisplayInteractionEvent, runtime: AnimationRuntimeSettings): Promise<Point> {
  const layer = layerById("interactionLayer");
  const layerBox = containerRect(layer, runtime.layout);
  const layerFallback = { x: layerBox.width / 2, y: layerBox.height / 2 };
  const bubbleFallback = pointRelativeToContainer(interactionBubbleAnchor(event.toView, runtime.forceLandscape, runtime.layout), layer, runtime.layout);
  if (!canUseDOM() || !shouldPlayInteractionAnimation(runtime.settings) || event.kind === "emoji") return bubbleFallback;
  const startRaw = seatCenter(event.fromView) || cardPileCenter(event.fromView);
  const endRaw = seatCenter(event.toView) || cardPileCenter(event.toView);
  const start = startRaw ? pointRelativeToContainer(startRaw, layer, runtime.layout) : layerFallback;
  const end = endRaw ? pointRelativeToContainer(endRaw, layer, runtime.layout) : bubbleFallback;
  const node = createFlyingItem(event.icon || "+");
  setLayerNodeBasics(node, start, runtime.forceLandscape);
  appendToLayer("interactionLayer", node);
  const dx = Math.round(end.x - start.x);
  const dy = Math.round(end.y - start.y);
  const distance = Math.hypot(dx, dy);
  const duration = animationDuration(Math.max(840, Math.min(1380, 720 + distance * 0.42)), runtime.settings);
  const arc = passArcVector(-Math.max(18, Math.min(54, distance * 0.08)), runtime.forceLandscape);
  await animateNode(node, {
    duration,
    ease: "out(3)",
    opacity: [0, 1, 1, 0],
    x: [0, Math.round(dx * 0.45 + arc.x), Math.round(dx * 0.92), dx],
    y: [0, Math.round(dy * 0.45 + arc.y), Math.round(dy * 0.92), dy],
    scale: [0.52, 1.08, 0.92, 0.76],
    rotate: ["0deg", "10deg", "20deg", "24deg"],
    onComplete: () => cleanupAnimationNode(node)
  });
  showInteractionImpact(event.kind, event.icon || "+", end, runtime.forceLandscape, runtime.settings);
  return safePoint(end, bubbleFallback);
}

export function showInteractionImpact(kind: string, icon: string, point: Point, forceLandscape: boolean, settings: SettingsState, _layout?: LayoutState): void {
  if (!canUseDOM() || !shouldPlayInteractionAnimation(settings)) return;
  const node = document.createElement("div");
  node.className = `interaction-impact ${kind || "like"}`;
  node.textContent = icon || "+";
  setLayerNodeBasics(node, point, forceLandscape);
  appendToLayer("interactionLayer", node);
  void animateNode(node, {
    duration: animationDuration(820, settings),
    ease: "out(3)",
    opacity: [0, 1, 0],
    scale: [0.42, 1.08, 1.42],
    onComplete: () => cleanupAnimationNode(node)
  });
}

export function specialEventTarget(event: SpecialEvent | null, currentPlayer: number, resolveViewIndex: (event: SpecialEvent | null) => number | null, forceLandscape: boolean, layout: LayoutState): Point {
  const viewIndex = resolveViewIndex(event) ?? currentPlayer ?? 0;
  return seatCenter(viewIndex) || screenDirectionTargetVisible(viewIndex, forceLandscape, 190, layout);
}

export async function playSpecialEventAnimation(
  node: HTMLElement | null,
  event: SpecialEvent | null,
  runtime: AnimationRuntimeSettings,
  currentPlayer: number,
  resolveViewIndex: (event: SpecialEvent | null) => number | null
): Promise<void> {
  if (!node || !event || !canUseDOM() || !shouldPlayGameAnimation(runtime.settings)) return;
  const { width, height } = visibleViewportSize(runtime.layout);
  const target = specialEventTarget(event, currentPlayer, resolveViewIndex, runtime.forceLandscape, runtime.layout);
  const dx = Math.round(target.x - width / 2);
  const dy = Math.round(target.y - height / 2);
  node.style.setProperty("--screen-rot", runtime.forceLandscape ? "90deg" : "0deg");
  node.style.setProperty("--special-to-x", `${dx}px`);
  node.style.setProperty("--special-to-y", `${dy}px`);
  node.style.setProperty("--special-duration", `${animationDuration(event.level === "legendary" ? 2350 : event.level === "epic" ? 2150 : 2000, runtime.settings)}ms`);
  node.style.setProperty("animation", "none", "important");
  await animateNode(node, {
    duration: animationDuration(event.level === "legendary" ? 2350 : event.level === "epic" ? 2150 : 2000, runtime.settings),
    ease: "out(3)",
    opacity: [0, 1, 1, 0],
    x: ["-50%", "-50%", `calc(-50% + ${dx}px)`],
    y: ["-50%", "-50%", `calc(-50% + ${dy}px)`],
    scale: [0.88, 1.04, 1, 0.68],
    rotate: [runtime.forceLandscape ? "90deg" : "0deg"],
    filter: ["brightness(1.10) saturate(1.06)", "brightness(1.20) saturate(1.10)", "brightness(1.10) saturate(1.04)", "brightness(.96) saturate(.92)"]
  });
}
