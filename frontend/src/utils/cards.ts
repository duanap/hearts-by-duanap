import type { Card, Suit } from "../types/messages";

export const PASS_NAMES = ["向左传牌", "向右传牌", "对家传牌", "不传牌"] as const;
export const PASS_HINTS = ["选择 3 张牌传给左边。", "选择 3 张牌传给右边。", "选择 3 张牌传给对家。", "本局不传牌。"] as const;

export const VIEW_AVATAR_CLASSES = ["you", "west", "north", "east"] as const;
export const VIEW_AVATARS = ["🐾", "魏", "蜀", "吴"] as const;
export const SEAT_POSITIONS = ["south", "west", "north", "east"] as const;

export const SUITS: Record<Suit, { symbol: string; name: string; color: "red" | "black"; order: number }> = {
  C: { symbol: "♣", name: "梅花", color: "black", order: 0 },
  D: { symbol: "♦", name: "方块", color: "red", order: 1 },
  S: { symbol: "♠", name: "黑桃", color: "black", order: 2 },
  H: { symbol: "♥", name: "红桃", color: "red", order: 3 }
};

export function rankText(rank: number): string {
  if (rank <= 10) return String(rank);
  return ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Record<number, string>)[rank] || String(rank);
}

export function cardName(card: Card): string {
  const suit = SUITS[card.suit];
  return `${suit?.name || card.suit}${rankText(card.rank)}`;
}

export function cardVisualClass(card: Card | null | undefined): string {
  if (!card) return "";
  if (card.suit === "S" && card.rank === 12) return "queen-spades";
  if (card.suit === "H") return "heart-card";
  return "";
}

export function sortCards(cards: readonly Card[]): Card[] {
  return [...cards].sort((left, right) => {
    const suitDelta = (SUITS[left.suit]?.order ?? 0) - (SUITS[right.suit]?.order ?? 0);
    if (suitDelta) return suitDelta;
    return left.rank - right.rank;
  });
}

export function sortHand(cards: readonly Card[]): Card[] {
  return sortCards(cards);
}

export function cardId(card: Card): string {
  return card.id || `${card.suit}${card.rank}`;
}

export function cardLabel(card: Card): string {
  return cardName(card);
}

export function suitSymbol(suit: Suit): string {
  return SUITS[suit]?.symbol || suit;
}

export function rankLabel(rank: number): string {
  return rankText(rank);
}

export function getPassMotionVector(mode: number, direction: "out" | "in" = "out"): { x: string; y: string } {
  const map = [
    { x: -170, y: -28 },
    { x: 170, y: -28 },
    { x: 0, y: -190 },
    { x: 0, y: 0 }
  ];
  const base = map[Number(mode) || 0] || map[0];
  const sign = direction === "in" ? -1 : 1;
  return { x: `${base.x * sign}px`, y: `${base.y * sign}px` };
}
