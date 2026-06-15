import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Card, Player, TrickPlay, LastTrick, PassFlow, RoundTable, SpecialEvent, Interaction, GamePhase, ServerState } from '../types'
import { SUITS, VIEW_AVATAR_CLASSES, VIEW_AVATARS, PASS_HINTS, cardPoints } from '../types'

function createPlaceholderPlayers(): Player[] {
  return [0, 1, 2, 3].map(i => ({
    id: '',
    name: i === 0 ? '你' : '等待中',
    avatar: VIEW_AVATARS[i],
    avatarClass: VIEW_AVATAR_CLASSES[i],
    hand: [],
    handCount: 0,
    taken: [],
    round: 0,
    total: 0,
    isBot: false,
    aiControlled: false,
    connected: false,
    leftRoom: false,
    passed: false,
    receivedCards: [],
    receivedFrom: ''
  }))
}

export const useGameStore = defineStore('game', () => {
  // ── 核心状态 ──
  const phase = ref<GamePhase>('offline')
  const roundNo = ref(1)
  const passMode = ref(0)
  const trickNo = ref(0)
  const trick = ref<TrickPlay[]>([])
  const currentPlayer = ref(0)
  const heartsBroken = ref(false)
  const busy = ref(false)
  const comparingTrick = ref(false)
  const collectingTrick = ref(false)
  const trickWinnerPlayer = ref<number | null>(null)
  const judgeText = ref('')
  const gameOver = ref(false)
  const moonShooter = ref<number | null>(null)

  // ── 玩家 ──
  const players = ref<Player[]>(createPlaceholderPlayers())
  const yourIndex = ref(0)
  const legalCardIds = ref<Set<string>>(new Set())

  // ── 传牌 ──
  const selectedPass = ref<Set<string>>(new Set())
  const passingCardIds = ref<Set<string>>(new Set())
  const passSending = ref(false)
  const youPassed = ref(false)
  const receivedCards = ref<Card[]>([])
  const receivedFrom = ref('')
  const receivedHighlightIds = ref<Set<string>>(new Set())

  // ── 特效 ──
  const specialEvents = ref<SpecialEvent[]>([])
  const interactions = ref<Interaction[]>([])

  // ── 上一轮 / 牌桌全览 ──
  const lastTrick = ref<LastTrick | null>(null)
  const roundTable = ref<RoundTable | null>(null)
  const passFlow = ref<PassFlow | null>(null)

  // ── 日志 ──
  const log = ref<{ round: number; text: string }[]>([])

  // ── 计算属性 ──
  const isYourTurn = computed(() =>
    phase.value === 'play' && currentPlayer.value === 0 && !busy.value && !comparingTrick.value && !collectingTrick.value
  )

  const passHint = computed(() => PASS_HINTS[passMode.value] || '')

  const passProgress = computed(() => `${selectedPass.value.size}/3 张`)

  function applyServerState(msg: ServerState) {
    yourIndex.value = msg.yourIndex ?? 0
    phase.value = (msg.phase || 'offline') as GamePhase
    roundNo.value = msg.roundNo || 1
    passMode.value = msg.passMode || 0
    trickNo.value = msg.trickNo || 0
    currentPlayer.value = msg.currentPlayer ?? 0
    heartsBroken.value = Boolean(msg.heartsBroken)
    busy.value = Boolean(msg.busy)
    comparingTrick.value = Boolean(msg.comparingTrick)
    collectingTrick.value = Boolean(msg.collectingTrick)
    trickWinnerPlayer.value = msg.trickWinnerPlayer ?? null
    judgeText.value = msg.judgeText || ''
    gameOver.value = Boolean(msg.gameOver)
    moonShooter.value = msg.moonShooter ?? null
    legalCardIds.value = new Set(msg.legalCardIds || [])
    log.value = msg.log || []
    specialEvents.value = msg.specialEvents || []
    interactions.value = msg.interactions || []
    passFlow.value = msg.passFlow || null
    lastTrick.value = msg.lastTrick || null
    roundTable.value = msg.roundTable || null

    // 更新玩家
    if (msg.players) {
      players.value = msg.players.map((p, i: number) => ({
        id: p.id || '',
        name: p.name || (i === 0 ? '你' : '等待中'),
        avatar: p.avatar || VIEW_AVATARS[i],
        avatarClass: VIEW_AVATAR_CLASSES[i],
        hand: i === yourIndex.value ? (p.hand || []) : [],
        handCount: p.handCount ?? (p.hand?.length || 0),
        taken: [],
        round: p.round || 0,
        total: p.total || 0,
        isBot: Boolean(p.isBot),
        aiControlled: Boolean(p.aiControlled),
        connected: Boolean(p.connected),
        leftRoom: Boolean(p.leftRoom),
        passed: Boolean(p.passed),
        receivedCards: [],
        receivedFrom: ''
      }))
    }

    // 更新出牌
    trick.value = (msg.trick || []).map((play) => ({
      player: (play.player - yourIndex.value + 4) % 4,
      card: play.card
    }))

    // 传牌阶段清空
    if (phase.value !== 'pass') {
      selectedPass.value.clear()
      passingCardIds.value.clear()
      passSending.value = false
    }

    // 收到传牌
    const rc = msg.receivedCards || []
    if (rc.length) {
      receivedCards.value = rc
      receivedFrom.value = msg.receivedFrom || '其他玩家'
      receivedHighlightIds.value = new Set(rc.map((c: Card) => c.id))
    }

    const you = msg.players?.[msg.yourIndex]
    youPassed.value = Boolean(you?.passed)
  }

  function reset() {
    phase.value = 'offline'
    players.value = createPlaceholderPlayers()
    trick.value = []
    lastTrick.value = null
    roundTable.value = null
    passFlow.value = null
    specialEvents.value = []
    interactions.value = []
    legalCardIds.value = new Set()
    selectedPass.value.clear()
    passSending.value = false
    youPassed.value = false
    busy.value = false
    comparingTrick.value = false
    collectingTrick.value = false
    trickWinnerPlayer.value = null
    judgeText.value = ''
    gameOver.value = false
    moonShooter.value = null
    log.value = []
    receivedCards.value = []
    receivedFrom.value = ''
    receivedHighlightIds.value = new Set()
  }

  return {
    phase, roundNo, passMode, trickNo, trick, currentPlayer,
    heartsBroken, busy, comparingTrick, collectingTrick,
    trickWinnerPlayer, judgeText, gameOver, moonShooter,
    players, yourIndex, legalCardIds,
    selectedPass, passingCardIds, passSending, youPassed,
    receivedCards, receivedFrom, receivedHighlightIds,
    specialEvents, interactions, lastTrick, roundTable, passFlow, log,
    isYourTurn, passHint, passProgress,
    applyServerState, reset
  }
})
