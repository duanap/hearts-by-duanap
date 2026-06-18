import type { DisplayInteractionEvent, InteractionType, LogItem, PlayerState } from "../types/messages";
import { PASS_NAMES } from "./cards";
import { formatInteractionLabel as formatInteractionLabelBase, formatInteractionMessage as formatInteractionMessageBase } from "./interactions";

export const ROMANCE_NAMES = [
  "貂蝉", "大乔", "小乔", "甄姬", "黄月英", "孙尚香", "祝融", "蔡文姬", "王异", "步练师", "糜夫人", "甘夫人",
  "赵云", "马超", "诸葛亮", "关羽", "张飞", "刘备", "黄忠", "魏延", "庞统", "姜维", "法正", "徐庶",
  "曹操", "司马懿", "张辽", "许褚", "夏侯惇", "夏侯渊", "郭嘉", "荀彧", "荀攸", "典韦", "曹仁", "张郃", "徐晃",
  "周瑜", "陆逊", "鲁肃", "吕蒙", "甘宁", "太史慈", "孙权", "孙策", "黄盖", "程普", "凌统", "诸葛瑾",
  "袁绍", "吕布", "陈宫", "华佗", "孟获", "张角", "左慈", "司马昭", "邓艾", "钟会", "羊祜", "陆抗"
];

export function escapeHTML(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function limitNickname(value: string): string {
  const input = String(value || "").trim();
  let units = 0;
  let output = "";
  for (const char of input) {
    const unit = /[\x00-\xff]/.test(char) ? 1 : 2;
    if (units + unit > 12) break;
    units += unit;
    output += char;
  }
  return output;
}

export function randomRomanceName(exclude = ""): string {
  const pool = ROMANCE_NAMES.filter(name => name !== exclude);
  const list = pool.length ? pool : ROMANCE_NAMES;
  return list[Math.floor(Math.random() * list.length)] || "赵云";
}

export function ensureNickname(value: string, stored = ""): string {
  let nickname = limitNickname(value || stored);
  if (!nickname || nickname === "玩家" || nickname === "房主") nickname = randomRomanceName();
  return limitNickname(nickname);
}

export function cleanJudgeText(text: string): string {
  const value = String(text || "").trim();
  if (/最大牌|收下本墩|收下\s*\d+\s*分/.test(value)) return "";
  return value.replace(/^[^：:]{1,10}最大[：:]\s*/, "");
}

export function classifyLogText(text: string): string {
  const value = String(text || "");
  if (/出牌|打出/.test(value)) return "出牌";
  if (/收墩|得到\s*\d+\s*分/.test(value)) return "收墩";
  if (/传牌|换牌/.test(value)) return "换牌";
  if (/互动|送花|番茄|点赞|鼓掌/.test(value)) return "互动";
  if (/发牌|开始第/.test(value)) return "发牌";
  if (/房间|加入|退出|重连|解散/.test(value)) return "房间";
  if (/得分|本局|总分|\+\s*\d+\s*分/.test(value)) return "得分";
  if (/结算|游戏结束|获胜|总分/.test(value)) return "结算";
  if (/AI|托管|补位|接管/.test(value)) return "AI";
  return "记录";
}

export function logTypeClass(type: string): string {
  return ({
    出牌: "log-play",
    收墩: "log-trick",
    换牌: "log-pass",
    发牌: "log-deal",
    房间: "log-room",
    互动: "log-interaction",
    得分: "log-score",
    结算: "log-score",
    AI: "log-ai"
  } as Record<string, string>)[type] || "log-note";
}

export function simplifyLogText(text: string): string {
  return String(text || "")
    .replace(/^第\s*\d+\s*局[：:]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isVisiblePlayLog(item: LogItem): boolean {
  const text = String(item?.text || "");
  return Boolean(text && !/心跳|连接检查/.test(text));
}

export function visiblePlayLogs(logs: readonly LogItem[]): LogItem[] {
  return (logs || []).filter(isVisiblePlayLog);
}

export function formatScore(value: number | string | null | undefined): string {
  const score = Number(value || 0);
  return Number.isFinite(score) ? String(score) : "0";
}

export function formatPhaseLabel(phase: string): string {
  return ({
    offline: "未连接",
    lobby: "等待玩家",
    deal: "正在发牌",
    pass: "传牌阶段",
    play: "出牌阶段",
    roundEnd: "本局结束",
    gameEnd: "游戏结束"
  } as Record<string, string>)[phase] || "同步中";
}

export function formatPassDirection(passMode: number): string {
  return PASS_NAMES[passMode] || PASS_NAMES[0] || "传牌";
}

export function formatPlayerStatus(player: Pick<PlayerState, "isBot" | "aiControlled" | "connected" | "leftRoom">, isHost = false): string {
  const parts: string[] = [];
  if (isHost) parts.push("房主");
  if (player.aiControlled) parts.push("AI托管");
  else if (player.isBot) parts.push("AI");
  if (player.leftRoom) parts.push("已退出");
  else if (!player.isBot && !player.connected) parts.push("离线");
  return parts.join(" · ") || "在线";
}

export function formatTrickSummary(winnerName: string, points: number): string {
  return `${winnerName || "玩家"} 收下本墩 · ${Number(points || 0)} 分`;
}

export function formatInteractionLabel(kind: InteractionType | string, label?: string): string {
  return formatInteractionLabelBase(kind, label);
}

export function formatInteractionMessage(event: Pick<DisplayInteractionEvent, "from" | "to" | "kind" | "label">): string {
  return formatInteractionMessageBase(event);
}
