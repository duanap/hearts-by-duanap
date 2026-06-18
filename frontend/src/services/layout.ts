import { writable } from "svelte/store";

export const LANDSCAPE_PROMPT_SESSION_KEY = "hearts-online-landscape-prompt-v1";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type OrientationLock = "any" | "natural" | "landscape" | "portrait" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary";

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: OrientationLock) => Promise<void>;
};

export interface ScreenProfile {
  mobile: boolean;
  portrait: boolean;
}

export interface LayoutState {
  viewportWidth: number;
  viewportHeight: number;
  visualViewportWidth: number;
  visualViewportHeight: number;
  gameWidth: number;
  gameHeight: number;
  isMobile: boolean;
  isPortrait: boolean;
  isRealLandscape: boolean;
  isCompactLandscape: boolean;
  forceLandscape: boolean;
  screenRotation: 0 | 90;
  layoutKey: string;
}

export const DEFAULT_LAYOUT_STATE: LayoutState = {
  viewportWidth: 1024,
  viewportHeight: 768,
  visualViewportWidth: 1024,
  visualViewportHeight: 768,
  gameWidth: 1024,
  gameHeight: 768,
  isMobile: false,
  isPortrait: false,
  isRealLandscape: true,
  isCompactLandscape: false,
  forceLandscape: false,
  screenRotation: 0,
  layoutKey: "1024x768:0:desktop:landscape"
};

let latestLayoutState = DEFAULT_LAYOUT_STATE;
export const layoutState = writable<LayoutState>(latestLayoutState);

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function roundPositive(value: number | undefined, fallback: number): number {
  const next = Number(value);
  return Math.max(1, Math.round(Number.isFinite(next) && next > 0 ? next : fallback));
}

function buildLayoutKey(layout: Omit<LayoutState, "layoutKey">): string {
  return [
    `${layout.gameWidth}x${layout.gameHeight}`,
    `v${layout.viewportWidth}x${layout.viewportHeight}`,
    layout.forceLandscape ? "force" : "natural",
    layout.isMobile ? "mobile" : "desktop",
    layout.isPortrait ? "portrait" : "landscape",
    `r${layout.screenRotation}`
  ].join(":");
}

function applyCssVariables(layout: LayoutState): void {
  if (!hasWindow()) return;
  const root = document.documentElement;
  root.style.setProperty("--viewport-width", `${layout.viewportWidth}px`);
  root.style.setProperty("--viewport-height", `${layout.viewportHeight}px`);
  root.style.setProperty("--visual-viewport-width", `${layout.visualViewportWidth}px`);
  root.style.setProperty("--visual-viewport-height", `${layout.visualViewportHeight}px`);
  root.style.setProperty("--game-width", `${layout.gameWidth}px`);
  root.style.setProperty("--game-height", `${layout.gameHeight}px`);
  root.style.setProperty("--screen-rot", `${layout.screenRotation}deg`);
}

export function readLayoutState(forceLandscape = latestLayoutState.forceLandscape): LayoutState {
  if (!hasWindow()) {
    const gameWidth = forceLandscape ? Math.max(DEFAULT_LAYOUT_STATE.viewportWidth, DEFAULT_LAYOUT_STATE.viewportHeight) : DEFAULT_LAYOUT_STATE.viewportWidth;
    const gameHeight = forceLandscape ? Math.min(DEFAULT_LAYOUT_STATE.viewportWidth, DEFAULT_LAYOUT_STATE.viewportHeight) : DEFAULT_LAYOUT_STATE.viewportHeight;
    const fallback: Omit<LayoutState, "layoutKey"> = {
      ...DEFAULT_LAYOUT_STATE,
      gameWidth,
      gameHeight,
      forceLandscape,
      screenRotation: forceLandscape ? 90 : 0
    };
    return { ...fallback, layoutKey: buildLayoutKey(fallback) };
  }

  const viewportWidth = roundPositive(window.innerWidth || document.documentElement.clientWidth, DEFAULT_LAYOUT_STATE.viewportWidth);
  const viewportHeight = roundPositive(window.innerHeight || document.documentElement.clientHeight, DEFAULT_LAYOUT_STATE.viewportHeight);
  const visualViewportWidth = roundPositive(window.visualViewport?.width, viewportWidth);
  const visualViewportHeight = roundPositive(window.visualViewport?.height, viewportHeight);
  const measuredWidth = visualViewportWidth || viewportWidth;
  const measuredHeight = visualViewportHeight || viewportHeight;
  const narrowSide = Math.min(measuredWidth, measuredHeight);
  const longSide = Math.max(measuredWidth, measuredHeight);
  const coarse = Boolean(window.matchMedia?.("(pointer: coarse)").matches);
  const mobileBySize = narrowSide <= 540 && longSide <= 1000;
  const tabletByTouch = coarse && narrowSide <= 1024 && longSide <= 1400;
  const gameWidth = forceLandscape ? longSide : measuredWidth;
  const gameHeight = forceLandscape ? narrowSide : measuredHeight;
  const layout: Omit<LayoutState, "layoutKey"> = {
    viewportWidth,
    viewportHeight,
    visualViewportWidth,
    visualViewportHeight,
    gameWidth,
    gameHeight,
    isMobile: mobileBySize || tabletByTouch,
    isPortrait: measuredHeight > measuredWidth,
    isRealLandscape: measuredWidth > measuredHeight,
    isCompactLandscape: gameWidth > gameHeight && gameHeight <= 560,
    forceLandscape,
    screenRotation: forceLandscape ? 90 : 0
  };
  return { ...layout, layoutKey: buildLayoutKey(layout) };
}

export function currentLayoutState(): LayoutState {
  return latestLayoutState;
}

export function readScreenProfile(): ScreenProfile {
  const layout = readLayoutState(latestLayoutState.forceLandscape);
  return { mobile: layout.isMobile, portrait: layout.isPortrait };
}

export function applyLayoutClasses(forceLandscape: boolean): LayoutState {
  const layout = readLayoutState(forceLandscape);
  if (!hasWindow()) {
    latestLayoutState = layout;
    layoutState.set(layout);
    return layout;
  }

  const root = document.documentElement;
  root.dataset.screenOrientation = layout.isPortrait ? "portrait" : "landscape";
  root.dataset.screenDevice = layout.isMobile ? "mobile" : "desktop";
  root.classList.toggle("screen-mobile-preflight", layout.isMobile);

  document.body.classList.toggle("force-landscape", forceLandscape);
  document.body.classList.toggle("screen-mobile", layout.isMobile);
  document.body.classList.toggle("screen-portrait", layout.isPortrait);
  document.body.classList.toggle("screen-landscape", !layout.isPortrait);
  applyCssVariables(layout);
  latestLayoutState = layout;
  layoutState.set(layout);
  return layout;
}

export function updateLayoutState(forceLandscape: boolean): LayoutState {
  return applyLayoutClasses(forceLandscape);
}

export function shouldShowLandscapePrompt(forceLandscape: boolean, promptEnabled: boolean): boolean {
  if (!hasWindow() || !promptEnabled || forceLandscape) return false;
  const layout = readLayoutState(forceLandscape);
  if (!layout.isMobile || !layout.isPortrait) return false;
  return sessionStorage.getItem(LANDSCAPE_PROMPT_SESSION_KEY) !== "1";
}

export function markLandscapePromptShown(): void {
  if (!hasWindow()) return;
  sessionStorage.setItem(LANDSCAPE_PROMPT_SESSION_KEY, "1");
}

export function isFullscreenActive(): boolean {
  if (!hasWindow()) return false;
  const doc = document as FullscreenDocument;
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
}

export async function requestAppFullscreen(target: HTMLElement = document.documentElement): Promise<void> {
  const node = target as FullscreenElement;
  const request =
    node.requestFullscreen ||
    node.webkitRequestFullscreen ||
    node.msRequestFullscreen;
  if (!request) throw new Error("fullscreen unsupported");
  await request.call(node);
}

export async function exitAppFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument;
  const exit =
    document.exitFullscreen ||
    doc.webkitExitFullscreen ||
    doc.msExitFullscreen;
  if (!exit) throw new Error("exit fullscreen unsupported");
  await exit.call(document);
}

export async function toggleAppFullscreen(target: HTMLElement = document.documentElement): Promise<boolean> {
  if (isFullscreenActive()) {
    await exitAppFullscreen();
    return false;
  }
  await requestAppFullscreen(target);
  return true;
}

export async function tryLockDeviceLandscape(): Promise<boolean> {
  if (!hasWindow()) return false;
  try {
    const orientation = screen.orientation as LockableOrientation | undefined;
    if (orientation && typeof orientation.lock === "function") {
      await orientation.lock("landscape");
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function listenLayoutChanges(onChange: () => void): () => void {
  if (!hasWindow()) return () => undefined;
  let timer: number | null = null;
  const schedule = () => {
    if (timer != null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      onChange();
    }, 180);
  };

  const orientation = screen.orientation;
  const visualViewport = window.visualViewport;
  window.addEventListener("resize", schedule);
  window.addEventListener("orientationchange", schedule);
  visualViewport?.addEventListener("resize", schedule);
  visualViewport?.addEventListener("scroll", schedule);
  document.addEventListener("fullscreenchange", schedule);
  document.addEventListener("webkitfullscreenchange", schedule);
  document.addEventListener("msfullscreenchange", schedule);
  orientation?.addEventListener?.("change", schedule);

  return () => {
    if (timer != null) window.clearTimeout(timer);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("orientationchange", schedule);
    visualViewport?.removeEventListener("resize", schedule);
    visualViewport?.removeEventListener("scroll", schedule);
    document.removeEventListener("fullscreenchange", schedule);
    document.removeEventListener("webkitfullscreenchange", schedule);
    document.removeEventListener("msfullscreenchange", schedule);
    orientation?.removeEventListener?.("change", schedule);
  };
}
