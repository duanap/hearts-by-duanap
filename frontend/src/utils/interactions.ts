import type { DisplayInteractionEvent, InteractionEvent, InteractionType } from "../types/messages";

export interface InteractionItem {
  kind: InteractionType;
  icon: string;
  label: string;
  cooldown: number;
  className?: string;
}

export const INTERACTION_COOLDOWN_MS = 3000;

export const INTERACTION_EMOJIS: InteractionItem[] = [
  { kind: "emoji", icon: "👍", label: "干得漂亮", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "😂", label: "哈哈哈", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "⚡", label: "搞快点！搞快点！", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "🛸", label: "小飞棍来喽~", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "🚨", label: "拦住他", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "🌕", label: "我要冲月亮", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "😭", label: "家人们，谁懂啊", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "🔍", label: "我要验牌", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "✅", label: "牌没有问题", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "😏", label: "小瘪三", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "🧸", label: "小儿科", cooldown: INTERACTION_COOLDOWN_MS },
  { kind: "emoji", icon: "👞", label: "给我擦皮鞋", cooldown: INTERACTION_COOLDOWN_MS }
];

export const INTERACTION_TOOLS: InteractionItem[] = [
  { kind: "flower", icon: "🌹", label: "送花", cooldown: INTERACTION_COOLDOWN_MS, className: "tool-flower" },
  { kind: "tomato", icon: "🍅", label: "扔番茄", cooldown: INTERACTION_COOLDOWN_MS, className: "tool-tomato" },
  { kind: "like", icon: "💙", label: "点赞", cooldown: INTERACTION_COOLDOWN_MS, className: "tool-like" },
  { kind: "applause", icon: "👏", label: "鼓掌", cooldown: INTERACTION_COOLDOWN_MS, className: "tool-applause" },
  { kind: "brick", icon: "🧱", label: "板砖", cooldown: INTERACTION_COOLDOWN_MS, className: "tool-brick" },
  { kind: "slipper", icon: "🩴", label: "拖鞋", cooldown: INTERACTION_COOLDOWN_MS, className: "tool-slipper" },
  { kind: "cabbage", icon: "🥬", label: "大白菜", cooldown: INTERACTION_COOLDOWN_MS, className: "tool-cabbage" },
  { kind: "doge", icon: "🐶", label: "狗头", cooldown: INTERACTION_COOLDOWN_MS, className: "tool-doge" }
];

export const TARGET_INTERACTION_TOOLS: InteractionItem[] = [
  INTERACTION_TOOLS[3],
  INTERACTION_TOOLS[0],
  INTERACTION_TOOLS[1],
  INTERACTION_TOOLS[2],
  INTERACTION_TOOLS[4],
  INTERACTION_TOOLS[5],
  INTERACTION_TOOLS[6],
  INTERACTION_TOOLS[7]
];

export const INTERACTION_ITEMS = [...INTERACTION_EMOJIS, ...INTERACTION_TOOLS];

export function interactionItemByKind(kind: InteractionType | string): InteractionItem {
  return INTERACTION_ITEMS.find(item => item.kind === kind) || INTERACTION_EMOJIS[0];
}

export function interactionCooldownKey(kind: InteractionType | string, targetViewIndex = 0, globalCooldown = false): string {
  const safeKind = String(kind || "emoji");
  if (globalCooldown) return `global:${safeKind}`;
  const target = Math.max(0, Math.min(3, Number(targetViewIndex || 0)));
  return `${safeKind}:to:${target}`;
}

export function interactionCooldownRemaining(
  cooldowns: Record<string, number>,
  kind: InteractionType | string,
  targetViewIndex = 0,
  globalCooldown = false,
  now = Date.now()
): number {
  const until = Number(cooldowns[interactionCooldownKey(kind, targetViewIndex, globalCooldown)] || 0);
  const remainingMs = until - now;
  if (!Number.isFinite(until) || remainingMs <= 0) return 0;
  if (remainingMs > INTERACTION_COOLDOWN_MS + 1000) return 0;
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function isInteractionType(value: unknown): value is InteractionType {
  return ["emoji", "flower", "tomato", "like", "applause", "brick", "slipper", "cabbage", "doge"].includes(String(value));
}

export function normalizeInteractionKind(value: unknown): InteractionType {
  return isInteractionType(value) ? value : "emoji";
}

export function interactionEventKey(event: Pick<InteractionEvent, "seq" | "fromIndex" | "toIndex" | "kind" | "label">): string {
  return `${Number(event.seq || 0)}:${event.fromIndex}:${event.toIndex}:${event.kind}:${event.label}`;
}

export function formatInteractionLabel(kind: InteractionType | string, label?: string): string {
  return label || interactionItemByKind(kind).label;
}

export function formatInteractionMessage(event: Pick<DisplayInteractionEvent, "from" | "to" | "kind" | "label">): string {
  const from = event.from || "玩家";
  const to = event.to || "玩家";
  return `${from} 对 ${to} 发送互动：${formatInteractionLabel(event.kind, event.label)}`;
}
