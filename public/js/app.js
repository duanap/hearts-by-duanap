
    const SUITS = {
      C: { symbol: "♣", name: "梅花", color: "black", order: 0 },
      D: { symbol: "♦", name: "方块", color: "red", order: 1 },
      S: { symbol: "♠", name: "黑桃", color: "black", order: 2 },
      H: { symbol: "♥", name: "红桃", color: "red", order: 3 }
    };

    const PASS_NAMES = ["向左传牌", "向右传牌", "对家传牌", "不传牌"];
    const PASS_HINTS = ["选择 3 张牌传给左边。", "选择 3 张牌传给右边。", "选择 3 张牌传给对家。", "本局不传牌。"];
    const APP_VERSION = "v1.4.20";
    const STORED_VERSION = localStorage.getItem("hearts-online-app-version");
    if (STORED_VERSION && STORED_VERSION !== APP_VERSION) {
      localStorage.removeItem("hearts-online-app-version");
      if ("caches" in window) {
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => location.reload());
      } else {
        location.reload();
      }
    }
    localStorage.setItem("hearts-online-app-version", APP_VERSION);

    (function detectDevice() {
      const w = window.innerWidth, h = window.innerHeight;
      const ua = navigator.userAgent;
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (w <= 768 && "ontouchstart" in window);
      const isTablet = /iPad|Tablet/i.test(ua) || (w > 768 && w <= 1366 && "ontouchstart" in window);
      const isDesktop = !isMobile && !isTablet;
      const orientation = w > h ? "landscape" : "portrait";
      document.documentElement.dataset.device = isMobile ? "mobile" : (isTablet ? "tablet" : "desktop");
      document.documentElement.dataset.orientation = orientation;
    })();

    const VIEW_AVATAR_CLASSES = ["you", "west", "north", "east"];
    const VIEW_AVATARS = ["🐾", "魏", "蜀", "吴"];
    const CLIENT_ID_KEY = "hearts-online-client-id";
    const ROOM_ID_KEY = "hearts-online-room-id";
    const NICKNAME_KEY = "hearts-online-nickname";
    const LANDSCAPE_PROMPT_KEY = "hearts-online-landscape-prompt-v1";
    const FORCE_LANDSCAPE_KEY = "hearts-online-force-landscape";
    const ROMANCE_NAMES = ["貂蝉", "大乔", "小乔", "甄姬", "黄月英", "孙尚香", "祝融", "蔡文姬", "王异", "步练师", "糜夫人", "甘夫人", "赵云", "马超", "诸葛亮", "关羽", "张飞", "刘备", "黄忠", "魏延", "庞统", "姜维", "法正", "徐庶", "曹操", "司马懿", "张辽", "许褚", "夏侯惇", "夏侯渊", "郭嘉", "荀彧", "荀攸", "典韦", "曹仁", "张郃", "徐晃", "周瑜", "陆逊", "鲁肃", "吕蒙", "甘宁", "太史慈", "孙权", "孙策", "黄盖", "程普", "凌统", "诸葛瑾", "袁绍", "吕布", "陈宫", "华佗", "孟获", "张角", "左慈", "司马昭", "邓艾", "钟会", "羊祜", "陆抗"];

    const THEME_KEY = "hearts-online-theme";
    const SOUND_KEY = "hearts-online-sound";
    const SOUND_VOLUME_KEY = "hearts-online-sound-volume";
    const EFFECTS_KEY = "hearts-online-effects";
    const EFFECT_SPEED_KEY = "hearts-online-effect-speed";
    const INTERACTION_EFFECTS_KEY = "hearts-online-interaction-effects";
    const INTERACTION_SOUND_KEY = "hearts-online-interaction-sound";
    const ALLOW_TOMATO_KEY = "hearts-online-allow-tomato";

    const INTERACTION_EMOJIS = [
      { kind: "emoji", icon: "👍", label: "干得漂亮", cooldown: 1000 },
      { kind: "emoji", icon: "😂", label: "哈哈哈", cooldown: 1000 },
      { kind: "emoji", icon: "⚡", label: "搞快点！搞快点！", cooldown: 1000 },
      { kind: "emoji", icon: "🛸", label: "小飞棍来喽~", cooldown: 1000 },
      { kind: "emoji", icon: "🚨", label: "拦住他", cooldown: 1000 },
      { kind: "emoji", icon: "🌕", label: "我要冲月亮", cooldown: 1000 },
      { kind: "emoji", icon: "😭", label: "家人们，谁懂啊", cooldown: 1000 },
      { kind: "emoji", icon: "🔍", label: "我要验牌", cooldown: 1000 },
      { kind: "emoji", icon: "✅", label: "牌没有问题", cooldown: 1000 },
      { kind: "emoji", icon: "😏", label: "小瘪三", cooldown: 1000 },
      { kind: "emoji", icon: "🧸", label: "小儿科", cooldown: 1000 },
      { kind: "emoji", icon: "👞", label: "给我擦皮鞋", cooldown: 1000 }
    ];

    const INTERACTION_TOOLS = [
      { kind: "flower", icon: "🌹", label: "送花", cooldown: 1800, className: "tool-flower" },
      { kind: "tomato", icon: "🍅", label: "扔番茄", cooldown: 1800, className: "tool-tomato" },
      { kind: "brick", icon: "🧱", label: "扔砖头", cooldown: 1800, className: "tool-brick" },
      { kind: "slipper", icon: "👟", label: "扔拖鞋", cooldown: 1800, className: "tool-slipper" },
      { kind: "cabbage", icon: "🥬", label: "扔白菜", cooldown: 1800, className: "tool-cabbage" },
      { kind: "like", icon: "❤️", label: "点赞", cooldown: 1000, className: "tool-like" },
      { kind: "applause", icon: "👏", label: "鼓掌", cooldown: 2200, className: "tool-applause" }
    ];

    const VERSION_LOGS = [
      { version: "v1.4.20（当前版本）", items: [
        "修复首页卡死：stale roomId + 服务端无响应导致页面卡在空白牌桌",
        "AI接管支持纯AI座位：新玩家输入AI名字+房间号可接管任意AI",
        "互动目标菜单动态加载全部道具",
        "首出牌闪烁描边：轮到你出牌时首出牌高亮脉冲提示",
        "上一墩首出标签移至玩家昵称旁，赢家同时显示方位+分数"
      ]},
      { version: "v1.4.19", items: [
        "Bug修复、AI策略优化、互动系统升级",
        "牌桌首出提示：首出牌面显示金色标签",
        "接管审批：玩家接管AI座位需房主批准",
        "缓存版本自动检查 + 设备检测"
      ]},
      { version: "v1.4（互动与AI增强）", items: [
        "新增牌桌互动系统：表情面板、送花、扔番茄",
        "AI出牌策略增强：换缺门、射月策略、防射月",
        "离线超过1分钟自动AI托管，重连后可接回原座位",
        "新增PWA支持：Service Worker缓存、安装入口",
        "胜利战绩结算重做，新增查看牌桌全览"
      ]},
      { version: "v1.3（动画与UI优化）", items: [
        "换牌/收墩/出牌动画全面重做",
        "高光事件系统：二点吃分、压轴自吃、大祸临头等",
        "房间号生成优先使用叠数（AAAA/AABB等）",
        "记分牌、头像框、牌桌指示器等UI统一优化"
      ]},
      { version: "v1.2（核心功能完善）", items: [
        "传牌系统：支持向左/向右/对家/不传四种模式",
        "AI补位：人数不满时自动填充AI机器人",
        "断线重连：5秒宽限期 + 60秒AI接管",
        "三国主题：魏蜀吴势力AI头像，60+人物昵称",
        "夜间模式、音效系统"
      ]},
      { version: "v1.1（网络多人）", items: [
        "WebSocket网络多人对战",
        "4位数字房间号创建/加入",
        "AI机器人基础出牌策略",
        "断线重连与AI接管",
        "横屏/全屏独立切换"
      ]},
      { version: "v0.1（单机版）", items: [
        "首个完整单机版：深色玻璃风格UI",
        "完整红心大战游戏引擎",
        "3个AI对手：基础出牌策略",
        "传牌系统：左/右/对家/不传循环"
      ]}
    ];

    function limitNickname(value) {
      const input = String(value || "").trim();
      let units = 0;
      let output = "";
      for (const char of Array.from(input)) {
        const unit = /[\x00-\xff]/.test(char) ? 1 : 2;
        if (units + unit > 20) break;
        output += char;
        units += unit;
      }
      return output;
    }

    function ensureClientId() {
      let id = localStorage.getItem(CLIENT_ID_KEY);
      if (!id) {
        id = "client-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(CLIENT_ID_KEY, id);
      }
      return id;
    }

    const clientId = ensureClientId();
    let socket = null;
    let reconnectTimer = null;

    const state = {
      connected: false,
      roomId: localStorage.getItem(ROOM_ID_KEY) || "",
      yourIndex: 0,
      isHost: false,
      serverPlayers: [],
      players: createPlaceholderPlayers(),
      roundNo: 1,
      passMode: 0,
      trickNo: 0,
      trick: [],
      currentPlayer: 0,
      heartsBroken: false,
      selectedPass: new Set(),
      passingCardIds: new Set(),
      passSending: false,
      receivedCards: [],
      receivedFrom: "",
      receivedHighlightIds: new Set(),
      lastReceiveKey: "",
      lastGameEndKey: "",
      phase: "offline",
      busy: false,
      gameOver: false,
      forceLandscape: localStorage.getItem(FORCE_LANDSCAPE_KEY) === "1",
      orientationLocked: false,
      landscapePromptShown: sessionStorage.getItem(LANDSCAPE_PROMPT_KEY) === "1",
      comparingTrick: false,
      collectingTrick: false,
      trickWinnerPlayer: null,
      judgeText: "",
      legalCardIds: new Set(),
      youPassed: false,
      log: [],
      aiPromptAction: "",
      lastAiPromptKey: "",
      lastYourTurnReminderKey: "",
      lastConnectionNoticeText: "",
      pendingTakeover: false,
      lastRenderedTrickKeys: ["", "", "", ""],
      nightMode: false,
      soundEnabled: localStorage.getItem(SOUND_KEY) !== "0",
      soundVolume: Math.max(0, Math.min(1, Number(localStorage.getItem(SOUND_VOLUME_KEY) || "1"))),
      effectsEnabled: localStorage.getItem(EFFECTS_KEY) !== "0",
      effectSpeed: Math.max(0.7, Math.min(1.4, Number(localStorage.getItem(EFFECT_SPEED_KEY) || "1"))),
      bgmEnabled: false,
      bgmVolume: 0.35,
      lastSoundTrickKey: "",
      moonShooter: null,
      lastMoonKey: "",
      specialEvents: [],
      lastSpecialEventSeq: 0,
      specialEventRoomId: "",
      specialEventQueue: [],
      specialEventShowing: false,
      passFlow: null,
      roundTable: null,
      lastTrick: null,
      moonEffectUntil: 0,
      lastPassFlowKey: "",
      lastCollectFlightKey: "",
      interactions: [],
      interactionRoomId: "",
      lastInteractionSeq: 0,
      interactionTarget: 0,
      interactionMenuMode: "",
      interactionCooldowns: {},
      interactionEffectsEnabled: localStorage.getItem(INTERACTION_EFFECTS_KEY) !== "0",
      interactionSoundEnabled: localStorage.getItem(INTERACTION_SOUND_KEY) !== "0",
      allowTomato: localStorage.getItem(ALLOW_TOMATO_KEY) !== "0"
    };

    const el = {
      scene: document.querySelector(".table-scene"),
      seats: [0,1,2,3].map(i => document.getElementById("seat" + i)),
      opHands: {
        1: document.getElementById("opHand1"),
        2: document.getElementById("opHand2"),
        3: document.getElementById("opHand3")
      },
      hand: document.getElementById("hand"),
      handTip: document.getElementById("handTip"),
      slots: [0,1,2,3].map(i => document.getElementById("slot" + i)),
      trickArea: document.querySelector(".trick-area"),
      roundTitle: document.getElementById("roundTitle"),
      turnArc: document.getElementById("turnArc"),
      turnPointer: document.getElementById("turnPointer"),
      message: document.getElementById("message"),
      centerBtn: document.getElementById("centerBtn"),
      passCounter: document.getElementById("passCounter"),
      receiveToast: document.getElementById("receiveToast"),
      actionToast: document.getElementById("actionToast"),
      passFlightLayer: document.getElementById("passFlightLayer"),
      collectFlightLayer: document.getElementById("collectFlightLayer"),
      interactionLayer: document.getElementById("interactionLayer"),
      interactionBtn: document.getElementById("interactionBtn"),
      interactionTargetMenu: document.getElementById("interactionTargetMenu"),
      yourTurnReminder: document.getElementById("yourTurnReminder"),
      offlineBanner: document.getElementById("offlineBanner"),
      moonEffect: document.getElementById("moonEffect"),
      moonTitle: document.getElementById("moonTitle"),
      moonSubtitle: document.getElementById("moonSubtitle"),
      specialEvent: document.getElementById("specialEvent"),
      specialEventLevel: document.getElementById("specialEventLevel"),
      specialEventTitle: document.getElementById("specialEventTitle"),
      specialEventSubtitle: document.getElementById("specialEventSubtitle"),
      landscapeBtn: document.getElementById("landscapeBtn"),
      fullscreenBtn: document.getElementById("fullscreenBtn"),
      openRoomBtn: document.getElementById("openRoomBtn"),
      openSettingsBtn: document.getElementById("openSettingsBtn"),
      soundBtn: document.getElementById("soundBtn"),
      effectsBtn: document.getElementById("effectsBtn"),
      effectSpeedSelect: document.getElementById("effectSpeedSelect"),
      soundVolumeRange: document.getElementById("soundVolumeRange"),
      soundVolumeValue: document.getElementById("soundVolumeValue"),
      bgmBtn: document.getElementById("bgmBtn"),
      bgmVolumeRange: document.getElementById("bgmVolumeRange"),
      bgmVolumeValue: document.getElementById("bgmVolumeValue"),
      interactionEffectsBtn: document.getElementById("interactionEffectsBtn"),
      interactionSoundBtn: document.getElementById("interactionSoundBtn"),
      allowTomatoBtn: document.getElementById("allowTomatoBtn"),
      clearCacheBtn: document.getElementById("clearCacheBtn"),
      openVersionLogBtn: document.getElementById("openVersionLogBtn"),
      openDebugBroadcastBtn: document.getElementById("openDebugBroadcastBtn"),
      openLogBtn: document.getElementById("openLogBtn"),
      openRulesBtn: document.getElementById("openRulesBtn"),
      roomModal: document.getElementById("roomModal"),
      roomMask: document.getElementById("roomMask"),
      closeRoomBtn: document.getElementById("closeRoomBtn"),
      closeRoomBottomBtn: document.getElementById("closeRoomBottomBtn"),
      roomTitle: document.getElementById("roomTitle"),
      roomSubtitle: document.getElementById("roomSubtitle"),
      roomChoicePanel: document.getElementById("roomChoicePanel"),
      roomActionPanel: document.getElementById("roomActionPanel"),
      roomIdField: document.getElementById("roomIdField"),
      chooseCreateRoomBtn: document.getElementById("chooseCreateRoomBtn"),
      chooseJoinRoomBtn: document.getElementById("chooseJoinRoomBtn"),
      backRoomChoiceBtn: document.getElementById("backRoomChoiceBtn"),
      nicknameInput: document.getElementById("nicknameInput"),
      randomNicknameIconBtn: document.getElementById("randomNicknameIconBtn"),
      roomIdInput: document.getElementById("roomIdInput"),
      roomInlineError: document.getElementById("roomInlineError"),
      createRoomBtn: document.getElementById("createRoomBtn"),
      joinRoomBtn: document.getElementById("joinRoomBtn"),
      startGameBtn: document.getElementById("startGameBtn"),
      fillBotsBtn: document.getElementById("fillBotsBtn"),
      takeoverBotsBtn: document.getElementById("takeoverBotsBtn"),
      leaveRoomBtn: document.getElementById("leaveRoomBtn"),
      disbandRoomBtn: document.getElementById("disbandRoomBtn"),
      copyRoomBtn: document.getElementById("copyRoomBtn"),
      copyRoomTitleBtn: document.getElementById("copyRoomTitleBtn"),
      roomStatus: document.getElementById("roomStatus"),
      roomPlayers: document.getElementById("roomPlayers"),
      resultModal: document.getElementById("resultModal"),
      resultMask: document.getElementById("resultMask"),
      resultTitle: document.getElementById("resultTitle"),
      resultSubtitle: document.getElementById("resultSubtitle"),
      resultScoreTable: document.getElementById("resultScoreTable"),
      closeResultBtn: document.getElementById("closeResultBtn"),
      playAgainBtn: document.getElementById("playAgainBtn"),
      viewVersionAfterWinBtn: document.getElementById("viewVersionAfterWinBtn"),
      viewTableBtn: document.getElementById("viewTableBtn"),
      viewRoundTableBtn: document.getElementById("viewRoundTableBtn"),
      lastTrickBtn: document.getElementById("lastTrickBtn"),
      lastTrickPopover: document.getElementById("lastTrickPopover"),
      roundTableModal: document.getElementById("roundTableModal"),
      roundTableMask: document.getElementById("roundTableMask"),
      closeRoundTableBtn: document.getElementById("closeRoundTableBtn"),
      closeRoundTableBottomBtn: document.getElementById("closeRoundTableBottomBtn"),
      roundTableTitle: document.getElementById("roundTableTitle"),
      roundTableSubtitle: document.getElementById("roundTableSubtitle"),
      roundTableView: document.getElementById("roundTableView"),
      aiPromptModal: document.getElementById("aiPromptModal"),
      aiPromptMask: document.getElementById("aiPromptMask"),
      closeAiPromptBtn: document.getElementById("closeAiPromptBtn"),
      aiPromptTitle: document.getElementById("aiPromptTitle"),
      aiPromptSubtitle: document.getElementById("aiPromptSubtitle"),
      aiPromptConfirmBtn: document.getElementById("aiPromptConfirmBtn"),
      aiPromptLaterBtn: document.getElementById("aiPromptLaterBtn"),
      landscapePromptModal: document.getElementById("landscapePromptModal"),
      landscapePromptMask: document.getElementById("landscapePromptMask"),
      closeLandscapePromptBtn: document.getElementById("closeLandscapePromptBtn"),
      enableLandscapePromptBtn: document.getElementById("enableLandscapePromptBtn"),
      skipLandscapePromptBtn: document.getElementById("skipLandscapePromptBtn"),
      settingsModal: document.getElementById("settingsModal"),
      settingsMask: document.getElementById("settingsMask"),
      closeSettingsBtn: document.getElementById("closeSettingsBtn"),
      closeSettingsBottomBtn: document.getElementById("closeSettingsBottomBtn"),
      interactionModal: document.getElementById("interactionModal"),
      interactionMask: document.getElementById("interactionMask"),
      closeInteractionBtn: document.getElementById("closeInteractionBtn"),
      closeInteractionBottomBtn: document.getElementById("closeInteractionBottomBtn"),
      interactionTargetStrip: document.getElementById("interactionTargetStrip"),
      quickEmojiGrid: document.getElementById("quickEmojiGrid"),
      interactionToolGrid: document.getElementById("interactionToolGrid"),
      interactionCooldownNote: document.getElementById("interactionCooldownNote"),
      versionLogModal: document.getElementById("versionLogModal"),
      versionLogMask: document.getElementById("versionLogMask"),
      versionLogList: document.getElementById("versionLogList"),
      closeVersionLogBtn: document.getElementById("closeVersionLogBtn"),
      closeVersionLogBottomBtn: document.getElementById("closeVersionLogBottomBtn"),
      debugBroadcastModal: document.getElementById("debugBroadcastModal"),
      debugBroadcastMask: document.getElementById("debugBroadcastMask"),
      debugBroadcastList: document.getElementById("debugBroadcastList"),
      debugInteractionList: document.getElementById("debugInteractionList"),
      debugExtraList: document.getElementById("debugExtraList"),
      closeDebugBroadcastBtn: document.getElementById("closeDebugBroadcastBtn"),
      closeDebugBroadcastBottomBtn: document.getElementById("closeDebugBroadcastBottomBtn"),
      logModal: document.getElementById("logModal"),
      logMask: document.getElementById("logMask"),
      logList: document.getElementById("logList"),
      logSummary: document.getElementById("logSummary"),
      closeLogBtn: document.getElementById("closeLogBtn"),
      closeLogBottomBtn: document.getElementById("closeLogBottomBtn"),
      rulesModal: document.getElementById("rulesModal"),
      rulesMask: document.getElementById("rulesMask"),
      closeRulesBtn: document.getElementById("closeRulesBtn"),
      closeRulesBottomBtn: document.getElementById("closeRulesBottomBtn")
    };

    function escapeHTML(value) {
      return String(value ?? "").replace(/[&<>'"]/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      }[char]));
    }

    function createPlaceholderPlayers() {
      return [0,1,2,3].map(i => ({
        name: i === 0 ? "你" : "等待中",
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
        passed: false
      }));
    }

    let wsFailCount = 0;
    let wsConnecting = false;
    let helloResponseTimer = null;

    function fallbackToLobby(reason) {
      state.connected = false;
      state.roomId = "";
      state.phase = "offline";
      state.busy = false;
      state.comparingTrick = false;
      state.collectingTrick = false;
      state.trickWinnerPlayer = null;
      state.judgeText = "";
      state.trick = [];
      state.lastTrick = null;
      state.specialEvents = [];
      state.interactions = [];
      state.passFlow = null;
      state.roundTable = null;
      state.gameOver = false;
      state.moonShooter = null;
      state.legalCardIds = new Set();
      state.youPassed = false;
      state.selectedPass.clear();
      state.passingCardIds.clear();
      state.passSending = false;
      state.lastRenderedTrickKeys = ["", "", "", ""];
      state.players = createPlaceholderPlayers();
      localStorage.removeItem(ROOM_ID_KEY);
      render();
      updateRoomPanel();
      openRoomModal("choice");
      if (reason) showActionToast(reason);
    }

    function connectSocket() {
      if (socket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(socket.readyState)) return;
      if (wsConnecting) return;
      wsConnecting = true;
      const protocol = location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(`${protocol}://${location.host}/ws`);

      socket.addEventListener("open", () => {
        state.connected = true;
        state.lastConnectionNoticeText = "";
        wsFailCount = 0;
        wsConnecting = false;
        sendMsg({ type: "hello", roomId: state.roomId });
        renderCenter();
        updateRoomPanel();
        updateConnectionNotice();
        clearTimeout(helloResponseTimer);
        helloResponseTimer = setTimeout(() => {
          if (state.phase === "offline" && state.roomId) {
            fallbackToLobby("连接超时，房间信息已重置。");
          }
        }, 5000);
      });

      socket.addEventListener("message", event => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }

        clearTimeout(helloResponseTimer);

        if (msg.type === "state") applyServerState(msg);
        else if (msg.type === "roomCreated") {
          state.roomId = msg.roomId;
          localStorage.setItem(ROOM_ID_KEY, msg.roomId);
          if (el.roomIdInput) el.roomIdInput.value = msg.roomId;
          state.roomPanelMode = "status";
          setRoomPanelMode("status");
          showActionToast(`房间创建成功：${msg.roomId}`);
          updateRoomPanel();
        } else if (msg.type === "roomClosed") {
          handleRoomClosed(msg);
        } else if (msg.type === "leftRoom") {
          handleLeftRoom(msg);
        } else if (msg.type === "error") {
          handleServerError(msg.message || "操作失败");
        } else if (msg.type === "takeoverRequested") {
          state.pendingTakeover = true;
          showActionToast(`已请求接管 AI「${msg.botName}」，等待房主批准……`);
          updateRoomPanel();
        } else if (msg.type === "takeoverRejected") {
          state.pendingTakeover = false;
          showActionToast(msg.message || "房主拒绝了你的接管请求");
          updateRoomPanel();
        } else if (msg.type === "takeoverApprovalNeeded") {
          state.pendingTakeover = false;
          if (state.isHost) {
            showTakeoverApprovalPrompt(msg.nickname, msg.botName, msg.botIndex);
          }
          updateRoomPanel();
        }
      });

      socket.addEventListener("close", () => {
        state.connected = false;
        wsConnecting = false;
        clearTimeout(helloResponseTimer);
        wsFailCount += 1;
        renderCenter();
        updateRoomPanel();
        updateConnectionNotice();
        if (wsFailCount >= 2 && state.roomId) {
          fallbackToLobby("无法连接服务端，房间信息已重置。");
        }
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectSocket, Math.min(1200 * wsFailCount, 8000));
      });

      socket.addEventListener("error", () => {
        state.connected = false;
        renderCenter();
        updateRoomPanel();
        updateConnectionNotice();
      });
    }

    function sendMsg(data) {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        showActionToast("连接已断开，正在重连……");
        connectSocket();
        return false;
      }
      socket.send(JSON.stringify({ ...data, clientId }));
      return true;
    }

    function absToView(absIndex) {
      if (absIndex == null || absIndex < 0) return absIndex;
      return (absIndex - state.yourIndex + 4) % 4;
    }

    function viewToAbs(viewIndex) {
      return (state.yourIndex + viewIndex) % 4;
    }

    function applyServerState(msg) {
      const oldPhase = state.phase;
      state.connected = true;
      const prevRoomId = state.roomId;
      state.roomId = msg.roomId != null ? msg.roomId : state.roomId;
      if (state.roomId) {
        localStorage.setItem(ROOM_ID_KEY, state.roomId);
        setRoomPanelMode("status");
      } else if (prevRoomId && msg.roomId === '') {
        localStorage.removeItem(ROOM_ID_KEY);
        state.roomPanelMode = "choice";
        setRoomPanelMode("choice");
        setTimeout(() => openRoomModal("choice"), 100);
      }
      state.yourIndex = Number.isInteger(msg.yourIndex) ? msg.yourIndex : 0;
      state.hostId = msg.hostId || "";
      state.isHost = Boolean(msg.isHost);
      state.serverPlayers = msg.players || [];
      state.roundNo = msg.roundNo || 1;
      state.passMode = msg.passMode || 0;
      state.phase = msg.phase || "lobby";
      state.trickNo = msg.trickNo || 0;
      state.currentPlayer = absToView(msg.currentPlayer || 0);
      state.heartsBroken = Boolean(msg.heartsBroken);
      state.busy = Boolean(msg.busy);
      state.gameOver = Boolean(msg.gameOver);
      state.moonShooter = msg.moonShooter == null ? null : absToView(msg.moonShooter);
      state.comparingTrick = Boolean(msg.comparingTrick);
      state.collectingTrick = Boolean(msg.collectingTrick);
      state.trickWinnerPlayer = msg.trickWinnerPlayer == null ? null : absToView(msg.trickWinnerPlayer);
      state.judgeText = cleanJudgeText(msg.judgeText || "");
      state.legalCardIds = new Set(msg.legalCardIds || []);
      state.log = msg.log || [];
      state.passFlow = msg.passFlow || null;
      state.lastTrick = normalizeLastTrick(msg.lastTrick || null);
      state.roundTable = msg.roundTable || null;

      state.players = [0,1,2,3].map(viewIndex => {
        const absIndex = viewToAbs(viewIndex);
        const player = state.serverPlayers[absIndex] || {};
        return {
          name: player.name || (viewIndex === 0 ? "你" : "等待中"),
          avatar: player.avatar || VIEW_AVATARS[viewIndex],
          avatarClass: VIEW_AVATAR_CLASSES[viewIndex],
          hand: viewIndex === 0 ? (player.hand || []) : [],
          handCount: Number.isInteger(player.handCount) ? player.handCount : ((player.hand || []).length),
          taken: [],
          round: player.round || 0,
          total: player.total || 0,
          isBot: Boolean(player.isBot),
          aiControlled: Boolean(player.aiControlled),
          connected: Boolean(player.connected),
          leftRoom: Boolean(player.leftRoom),
          passed: Boolean(player.passed)
        };
      });

      maybeShowMoonEffect();
      processSpecialEvents(msg.specialEvents || []);
      processInteractionEvents(msg.interactions || []);

      const you = state.serverPlayers[state.yourIndex] || {};
      state.youPassed = Boolean(you.passed);
      if (state.pendingTakeover && !you.isBot) {
        state.pendingTakeover = false;
      }
      if (state.youPassed && state.passSending) {
        state.passSending = false;
        state.passingCardIds.clear();
      }

      state.trick = (msg.trick || []).map(play => ({
        player: absToView(play.player),
        card: play.card
      }));

      if (oldPhase === "pass" && state.phase !== "pass") {
        state.selectedPass.clear();
        state.passingCardIds.clear();
        state.passSending = false;
      }

      const receivedCards = msg.receivedCards || [];
      const receiveKey = `${state.roomId}:${state.roundNo}:${receivedCards.map(card => card.id).join("|")}`;
      if (receivedCards.length && receiveKey !== state.lastReceiveKey) {
        state.lastReceiveKey = receiveKey;
        state.receivedCards = receivedCards;
        state.receivedFrom = msg.receivedFrom || "其他玩家";
        state.receivedHighlightIds = new Set(receivedCards.map(card => card.id));
        showReceiveToast();
        setTimeout(() => {
          state.receivedHighlightIds.clear();
          renderHand();
        }, 3600);
      }

      maybePlayTrickSound();
      maybeShowMoonEffect();
      render();
      updateRoomPanel();
      maybeAnimatePassFlow();
      maybeAnimateCollectFlow();
      maybeShowAiAssistPrompt();

      if (oldPhase === "lobby" && state.phase !== "lobby" && state.phase !== "offline") {
        el.roomModal?.classList.add("hidden");
      }

      const gameEndKey = `${state.roomId}:${state.roundNo}:gameEnd`;
      if (state.phase === "gameEnd" && state.lastGameEndKey !== gameEndKey) {
        state.lastGameEndKey = gameEndKey;
        showResultModal();
      }
    }

    function rankText(rank) {
      if (rank <= 10) return String(rank);
      return { 11: "J", 12: "Q", 13: "K", 14: "A" }[rank];
    }

    function cardName(card) {
      return SUITS[card.suit].name + rankText(card.rank);
    }

    function normalizeLastTrick(last) {
      if (!last || !Array.isArray(last.cards) || !last.cards.length) return null;
      return {
        ...last,
        winnerPlayer: last.winnerPlayer == null ? null : absToView(Number(last.winnerPlayer)),
        leaderPlayer: last.leaderPlayer == null ? (last.cards?.[0]?.player == null ? null : absToView(Number(last.cards[0].player))) : absToView(Number(last.leaderPlayer)),
        leadSuit: last.leadSuit || "",
        cards: last.cards.map(play => ({ player: absToView(Number(play.player)), card: play.card })).filter(play => play.card)
      };
    }

    function showReceiveToast() {
      if (!state.receivedCards.length) return;
      el.receiveToast.innerHTML = `你从${escapeHTML(state.receivedFrom)}收到：<strong>${state.receivedCards.map(cardName).join("、")}</strong>`;
      el.receiveToast.classList.remove("hidden");
      clearTimeout(showReceiveToast.timer);
      showReceiveToast.timer = setTimeout(hideReceiveToast, 5200);
    }

    function hideReceiveToast() {
      el.receiveToast.classList.add("hidden");
    }

    function updateConnectionNotice() {
      if (!el.offlineBanner) return;
      const browserOffline = navigator.onLine === false;
      let text = "";
      if (browserOffline) {
        text = "当前设备处于离线状态，请检查网络连接。";
      } else if (!state.connected) {
        text = state.roomId
          ? "已与联机服务断开，正在自动重连。"
          : "正在连接联机服务端……";
      }

      if (!text) {
        state.lastConnectionNoticeText = "";
        el.offlineBanner.classList.add("hidden");
        clearTimeout(updateConnectionNotice.timer);
        return;
      }

      if (text === state.lastConnectionNoticeText && !el.offlineBanner.classList.contains("hidden")) return;
      if (text === state.lastConnectionNoticeText) return;

      state.lastConnectionNoticeText = text;
      el.offlineBanner.textContent = text;
      el.offlineBanner.classList.remove("hidden");
      clearTimeout(updateConnectionNotice.timer);
      updateConnectionNotice.timer = setTimeout(() => {
        el.offlineBanner.classList.add("hidden");
      }, 1500);
    }

    function handleRoomClosed(msg) {
      const closedRoomId = String(msg.roomId || "");
      if (closedRoomId && state.roomId && closedRoomId !== state.roomId) return;
      localStorage.removeItem(ROOM_ID_KEY);
      state.roomId = "";
      state.roomPanelMode = "choice";
      setRoomPanelMode("choice");
      state.phase = "offline";
      state.isHost = false;
      state.serverPlayers = [];
      state.players = createPlaceholderPlayers();
      state.trick = [];
      state.lastRenderedTrickKeys = ["", "", "", ""];
      state.selectedPass.clear();
      state.legalCardIds.clear();
      state.youPassed = false;
      state.pendingTakeover = false;
      showActionToast(msg.message || "房间已解散。");
      render();
      updateRoomPanel();
      if (el.roomModal) el.roomModal.classList.remove("hidden");
    }

    function resetLocalRoomState(message = "已退出房间。") {
      localStorage.removeItem(ROOM_ID_KEY);
      state.roomId = "";
      state.roomPanelMode = "choice";
      setRoomPanelMode("choice");
      state.phase = state.connected ? "lobby" : "offline";
      state.isHost = false;
      state.serverPlayers = [];
      state.players = createPlaceholderPlayers();
      state.trick = [];
      state.lastRenderedTrickKeys = ["", "", "", ""];
      state.selectedPass.clear();
      state.legalCardIds.clear();
      state.youPassed = false;
      state.pendingTakeover = false;
      showActionToast(message);
      render();
      updateRoomPanel();
      openRoomModal("choice");
    }

    function handleLeftRoom(msg) {
      resetLocalRoomState(msg.message || "已退出房间，可重新输入房间号加入。");
    }
    function showRoomInlineError(message) {
      if (!el.roomInlineError) return showActionToast(message);
      el.roomInlineError.textContent = message;
      el.roomInlineError.classList.remove("hidden");
      el.roomIdField?.classList.add("has-error");
    }

    function clearRoomInlineError() {
      if (el.roomInlineError) {
        el.roomInlineError.textContent = "";
        el.roomInlineError.classList.add("hidden");
      }
      el.roomIdField?.classList.remove("has-error");
    }

    function shouldUseRoomInlineError(message) {
      const text = String(message || "");
      return state.roomPanelMode === "join" && /房间|4 位|4位|已满|牌局/.test(text);
    }

    function handleServerError(message) {
      if (/房间不存在|已超时解散/.test(String(message || ""))) {
        localStorage.removeItem(ROOM_ID_KEY);
        if (!state.roomId) state.roomPanelMode = "join";
      }
      if (shouldUseRoomInlineError(message)) showRoomInlineError(message);
      else showActionToast(message);
      playGameSound("error");
    }

    function showTakeoverApprovalPrompt(nickname, botName, botIndex) {
      const toast = el.actionToast;
      if (!toast) return;
      toast.innerHTML = `<div class="action-toast-content"><span>${escapeHTML(nickname)} 请求接管 AI「${escapeHTML(botName)}」</span><div class="toast-actions"><button class="toast-btn approve" id="approveTakeoverBtn">批准</button><button class="toast-btn reject" id="rejectTakeoverBtn">拒绝</button></div></div>`;
      toast.classList.remove("hidden");
      document.getElementById("approveTakeoverBtn")?.addEventListener("click", () => {
        sendMsg({ type: "approveTakeover" });
        toast.classList.add("hidden");
      });
      document.getElementById("rejectTakeoverBtn")?.addEventListener("click", () => {
        sendMsg({ type: "rejectTakeover" });
        toast.classList.add("hidden");
      });
    }

    function updateThemeAndSoundButtons() {
      state.nightMode = false;
      document.body.classList.remove("night-mode");
      localStorage.removeItem(THEME_KEY);
      if (el.soundBtn) {
        el.soundBtn.textContent = state.soundEnabled ? "开启" : "关闭";
        el.soundBtn.classList.toggle("is-on", state.soundEnabled);
        el.soundBtn.setAttribute("aria-pressed", state.soundEnabled ? "true" : "false");
      }
      if (el.effectsBtn) {
        el.effectsBtn.textContent = state.effectsEnabled ? "开启" : "关闭";
        el.effectsBtn.classList.toggle("is-on", state.effectsEnabled);
        el.effectsBtn.setAttribute("aria-pressed", state.effectsEnabled ? "true" : "false");
      }
      if (el.effectSpeedSelect) el.effectSpeedSelect.value = String(state.effectSpeed);
      if (el.soundVolumeRange) el.soundVolumeRange.value = String(Math.round(state.soundVolume * 100));
      if (el.soundVolumeValue) el.soundVolumeValue.textContent = `${Math.round(state.soundVolume * 100)}%`;
      if (el.bgmVolumeValue) el.bgmVolumeValue.textContent = `${Math.round(state.bgmVolume * 100)}%`;
      if (el.interactionEffectsBtn) {
        el.interactionEffectsBtn.textContent = state.interactionEffectsEnabled ? "开启" : "关闭";
        el.interactionEffectsBtn.classList.toggle("is-on", state.interactionEffectsEnabled);
        el.interactionEffectsBtn.setAttribute("aria-pressed", state.interactionEffectsEnabled ? "true" : "false");
      }
      if (el.interactionSoundBtn) {
        el.interactionSoundBtn.textContent = state.interactionSoundEnabled ? "开启" : "关闭";
        el.interactionSoundBtn.classList.toggle("is-on", state.interactionSoundEnabled);
        el.interactionSoundBtn.setAttribute("aria-pressed", state.interactionSoundEnabled ? "true" : "false");
      }
      if (el.allowTomatoBtn) {
        el.allowTomatoBtn.textContent = state.allowTomato ? "开启" : "关闭";
        el.allowTomatoBtn.classList.toggle("is-on", state.allowTomato);
        el.allowTomatoBtn.setAttribute("aria-pressed", state.allowTomato ? "true" : "false");
      }
      renderInteractionPanel();
    }

    function toggleTheme() {
      state.nightMode = false;
      document.body.classList.remove("night-mode");
      localStorage.removeItem(THEME_KEY);
    }

    let audioContext = null;
    function playTone(freq = 520, duration = 0.08, type = "sine", gainValue = 0.035) {
      if (!state.soundEnabled) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioContext = audioContext || new AC();
        if (audioContext.state === "suspended") audioContext.resume();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, Math.min(1, gainValue * state.soundVolume * 2)), audioContext.currentTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        osc.stop(audioContext.currentTime + duration + 0.02);
      } catch (error) {
        // 忽略浏览器音频权限或设备不支持。
      }
    }

    function playGameSound(kind) {
      if (!state.soundEnabled) return;
      if (kind === "play") playTone(560, 0.075, "triangle", 0.035);
      else if (kind === "pass") { playTone(430, 0.07, "sine", 0.026); setTimeout(() => playTone(620, 0.08, "sine", 0.026), 75); }
      else if (kind === "moon") { playTone(523, 0.14, "sine", 0.04); setTimeout(() => playTone(659, 0.14, "sine", 0.04), 150); setTimeout(() => playTone(784, 0.22, "sine", 0.04), 310); }
      else if (kind === "error") playTone(220, 0.12, "sawtooth", 0.02);
    }

    function toggleSound() {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem(SOUND_KEY, state.soundEnabled ? "1" : "0");
      updateThemeAndSoundButtons();
      if (state.soundEnabled) playGameSound("pass");
      showActionToast(state.soundEnabled ? "出牌音效已开启。" : "出牌音效已关闭。");
    }

    function toggleEffects() {
      state.effectsEnabled = !state.effectsEnabled;
      localStorage.setItem(EFFECTS_KEY, state.effectsEnabled ? "1" : "0");
      updateThemeAndSoundButtons();
      showActionToast(state.effectsEnabled ? "牌局特效已开启。" : "牌局特效已关闭。");
    }

    function setEffectSpeed(value) {
      const next = Math.max(0.7, Math.min(1.4, Number(value || 1)));
      state.effectSpeed = next;
      localStorage.setItem(EFFECT_SPEED_KEY, String(next));
      updateThemeAndSoundButtons();
    }

    function setSoundVolume(value) {
      const next = Math.max(0, Math.min(1, Number(value || 0) / 100));
      state.soundVolume = next;
      localStorage.setItem(SOUND_VOLUME_KEY, String(next));
      updateThemeAndSoundButtons();
      if (state.soundEnabled && next > 0) playTone(560, 0.05, "triangle", 0.03);
    }

    function submitPassWithAnimation() {
      if (state.passSending || state.youPassed || state.selectedPass.size !== 3) return;
      const cards = [...state.selectedPass];
      state.passSending = true;
      state.passingCardIds = new Set(cards);
      renderHand();
      renderCenter();
      playGameSound("pass");
      setTimeout(() => {
        const sent = sendMsg({ type: "passCards", cards });
        if (!sent) {
          state.passSending = false;
          state.passingCardIds.clear();
          renderHand();
          renderCenter();
          return;
        }
        setTimeout(() => {
          if (!state.passSending) return;
          state.passSending = false;
          state.passingCardIds.clear();
          renderHand();
          renderCenter();
        }, 1800);
      }, 430);
    }

    function seatCenter(viewIndex) {
      const seat = el.seats[viewIndex]?.querySelector(".avatar") || el.seats[viewIndex];
      if (!seat) return null;
      const rect = seat.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    function cardPileCenter(viewIndex) {
      const container = viewIndex === 0 ? el.hand : el.opHands[viewIndex];
      if (!container) return seatCenter(viewIndex);
      const cards = Array.from(container.querySelectorAll(".card:not(.passing-out), .card-back"))
        .filter(node => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
      if (cards.length) {
        const focusCards = cards.length > 5
          ? cards.slice(Math.max(0, Math.floor(cards.length / 2) - 2), Math.min(cards.length, Math.floor(cards.length / 2) + 3))
          : cards;
        const sum = focusCards.reduce((acc, node) => {
          const rect = node.getBoundingClientRect();
          acc.x += rect.left + rect.width / 2;
          acc.y += rect.top + rect.height / 2;
          return acc;
        }, { x: 0, y: 0 });
        return { x: sum.x / focusCards.length, y: sum.y / focusCards.length };
      }
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      return seatCenter(viewIndex);
    }


    function isForcedLandscapeFlightMode() {
      return Boolean(state.forceLandscape || document.body.classList.contains("force-landscape"));
    }

    function rotateVectorClockwise90(vector) {
      return { x: -Number(vector.y || 0), y: Number(vector.x || 0) };
    }

    function maybeRotateVectorForLandscape(vector) {
      return isForcedLandscapeFlightMode() ? rotateVectorClockwise90(vector) : vector;
    }

    function screenDirectionVector(viewIndex) {
      let vector = { x: 0, y: 0 };
      if (viewIndex === 0) vector = { x: 0, y: 1 };       // 本家：底部
      else if (viewIndex === 2) vector = { x: 0, y: -1 }; // 对家：顶部
      else if (viewIndex === 1) vector = { x: -1, y: 0 }; // 上家：左侧
      else if (viewIndex === 3) vector = { x: 1, y: 0 };  // 下家：右侧
      return maybeRotateVectorForLandscape(vector);
    }

    function screenDirectionTarget(viewIndex, margin = 86) {
      const w = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
      const h = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      const center = { x: w / 2, y: h / 2 };
      const vector = screenDirectionVector(viewIndex);
      return {
        x: center.x + vector.x * (w / 2 + margin),
        y: center.y + vector.y * (h / 2 + margin)
      };
    }

    function passArcVector(baseArcY) {
      const vector = maybeRotateVectorForLandscape({ x: 0, y: Number(baseArcY || 0) });
      return { x: Math.round(vector.x || 0), y: Math.round(vector.y || 0) };
    }

    function centerRingViewportMetrics() {
      const ring = document.querySelector(".center-ring");
      const scene = el.scene || document.querySelector(".table-scene");
      const rect = ring?.getBoundingClientRect?.();
      if (rect && rect.width > 1 && rect.height > 1) {
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          r: Math.max(58, Math.min(rect.width, rect.height) / 2)
        };
      }
      const sceneRect = scene?.getBoundingClientRect?.();
      return {
        x: sceneRect ? sceneRect.left + sceneRect.width / 2 : (window.innerWidth || 1) / 2,
        y: sceneRect ? sceneRect.top + sceneRect.height / 2 : (window.innerHeight || 1) / 2,
        r: Math.max(58, Math.min(window.innerWidth || 1, window.innerHeight || 1) * .14)
      };
    }

    function clampToViewport(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function placeTableFloatButton(node, offset, options = {}) {
      if (!node) return;
      const metrics = centerRingViewportMetrics();
      const rotated = maybeRotateVectorForLandscape(offset || { x: 0, y: 0 });
      const pad = Number(options.pad || 18);
      const vw = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
      const vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      const x = clampToViewport(metrics.x + rotated.x, pad, vw - pad);
      const y = clampToViewport(metrics.y + rotated.y, pad, vh - pad);
      applyFixedButtonPosition(node, x, y);
    }

    function applyFixedButtonPosition(node, x, y) {
      if (!node) return;
      const pad = 18;
      const vw = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
      const vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      const safeX = clampToViewport(Number(x || 0), pad, vw - pad);
      const safeY = clampToViewport(Number(y || 0), pad, vh - pad);
      // 用 inline !important 覆盖历史版本残留的 body.force-landscape 定位规则。
      node.style.setProperty("left", `${Math.round(safeX)}px`, "important");
      node.style.setProperty("top", `${Math.round(safeY)}px`, "important");
      node.style.setProperty("right", "auto", "important");
      node.style.setProperty("bottom", "auto", "important");
      node.style.setProperty("--screen-rot", isForcedLandscapeFlightMode() ? "90deg" : "0deg");
      node.classList.toggle("landscape-flight-mode", isForcedLandscapeFlightMode());
    }

    function rectsOverlap(a, b, gap = 0) {
      if (!a || !b || a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) return false;
      return !(a.right + gap <= b.left || a.left - gap >= b.right || a.bottom + gap <= b.top || a.top - gap >= b.bottom);
    }

    function avoidButtonOverlap(movingNode, referenceNode, direction, gap = 8) {
      if (!movingNode || !referenceNode) return;
      if (movingNode.classList.contains("hidden") || getComputedStyle(movingNode).display === "none" || getComputedStyle(referenceNode).display === "none") return;
      const movingRect = movingNode.getBoundingClientRect?.();
      const referenceRect = referenceNode.getBoundingClientRect?.();
      if (!rectsOverlap(movingRect, referenceRect, 2)) return;
      let dx = Number(direction?.x || 0);
      let dy = Number(direction?.y || 0);
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const overlapX = Math.max(0, Math.min(movingRect.right - referenceRect.left, referenceRect.right - movingRect.left));
      const overlapY = Math.max(0, Math.min(movingRect.bottom - referenceRect.top, referenceRect.bottom - movingRect.top));
      const push = Math.max(18, Math.min(overlapX || 0, overlapY || 0)) + Number(gap || 8) + 8;
      const currentX = parseFloat(movingNode.style.left || "0") || (movingRect.left + movingRect.width / 2);
      const currentY = parseFloat(movingNode.style.top || "0") || (movingRect.top + movingRect.height / 2);
      applyFixedButtonPosition(movingNode, currentX + dx * push, currentY + dy * push);
    }

    function transformedCenterButtonAnchor() {
      const metrics = centerRingViewportMetrics();
      const btn = el.centerBtn;
      const rect = btn?.getBoundingClientRect?.();
      if (rect && rect.width > 1 && rect.height > 1 && getComputedStyle(btn).display !== "none") {
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
      }
      // v1.4.17：play 阶段中心按钮会隐藏，但【上一轮】应占用“开始下一局”的同一位置；
      // 因此用牌桌圆心 + 中心按钮在圆圈里的固定向量估算，并随右上角横屏状态顺时针旋转。
      const baseOffset = Math.max(34, Math.min(56, metrics.r * .36));
      const rotated = maybeRotateVectorForLandscape({ x: 0, y: baseOffset });
      return { x: metrics.x + rotated.x, y: metrics.y + rotated.y, rect: null };
    }

    function positionTableActionButtons() {
      const metrics = centerRingViewportMetrics();
      // 互动：仍保持牌桌右侧锚点，横屏后围绕圆心顺时针旋转 90°。
      const sideGap = Math.max(54, Math.min(92, metrics.r * .55));
      placeTableFloatButton(el.interactionBtn, { x: metrics.r + sideGap, y: 0 });

      // v1.4.17：上一轮复用【开始下一局】位置；查看牌桌仍放在其下方，
      // 但横屏时按按钮实际包围盒重新计算间距，避免旋转后与【开始下一局】重叠。
      const centerAnchor = transformedCenterButtonAnchor();
      applyFixedButtonPosition(el.lastTrickBtn, centerAnchor.x, centerAnchor.y);

      const viewRect = el.viewRoundTableBtn?.getBoundingClientRect?.();
      const centerBtnRect = centerAnchor.rect || el.centerBtn?.getBoundingClientRect?.();
      const landscapeMode = isForcedLandscapeFlightMode();
      const centerMeasure = landscapeMode
        ? Math.max(centerBtnRect?.width || 0, centerBtnRect?.height || 0, 42)
        : Math.max(30, Math.min(54, centerBtnRect?.height || 38));
      const viewMeasure = landscapeMode
        ? Math.max(viewRect?.width || 0, viewRect?.height || 0, 42)
        : Math.max(28, Math.min(46, viewRect?.height || 34));
      const viewGap = landscapeMode ? 10 : 6;
      const belowOffset = maybeRotateVectorForLandscape({ x: 0, y: centerMeasure / 2 + viewMeasure / 2 + viewGap });
      applyFixedButtonPosition(el.viewRoundTableBtn, centerAnchor.x + belowOffset.x, centerAnchor.y + belowOffset.y);
      avoidButtonOverlap(el.viewRoundTableBtn, el.centerBtn, belowOffset, viewGap);
    }

    function ensureViewportAnimationLayers() {
      // v1.4.0：飞牌 / 收墩 / 特效层挂到 body；强制横屏时文字与飞行方向同步顺时针旋转 90°。
      const forced = isForcedLandscapeFlightMode();
      const screenRot = forced ? "90deg" : "0deg";
      [el.passFlightLayer, el.collectFlightLayer, el.interactionLayer, el.interactionTargetMenu, el.specialEvent, el.lastTrickPopover, el.yourTurnReminder, el.moonEffect, el.lastTrickBtn, el.viewRoundTableBtn, el.interactionBtn].forEach(node => {
        if (node && node.parentElement !== document.body) document.body.appendChild(node);
        if (node) {
          node.style.setProperty("--screen-rot", screenRot);
          node.classList.toggle("landscape-flight-mode", forced);
        }
      });
      positionTableActionButtons();
    }

    function viewportDistance(a, b) {
      if (!a || !b) return 0;
      return Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));
    }

    function maybeAnimatePassFlow() {
      ensureViewportAnimationLayers();
      const flow = state.passFlow;
      if (!flow || state.phase !== "play" || !el.passFlightLayer) return;
      const key = `${state.roomId}:${flow.seq || 0}:${flow.roundNo || state.roundNo}:${flow.passMode ?? state.passMode}`;
      if (!flow.seq || key === state.lastPassFlowKey) return;
      state.lastPassFlowKey = key;
      const flows = Array.isArray(flow.flows) ? flow.flows : [];
      if (!flows.length) return;

      el.passFlightLayer.innerHTML = "";
      flows.forEach((item, flowIndex) => {
        const from = absToView(item.from);
        const to = absToView(item.to);
        const start = cardPileCenter(from);
        const end = cardPileCenter(to);
        if (!start || !end) return;
        const count = Math.max(1, Math.min(3, Number(item.count || 3)));
        for (let i = 0; i < count; i++) {
          const card = document.createElement("div");
          card.className = "pass-flight-card";
          card.style.left = `${start.x}px`;
          card.style.top = `${start.y}px`;
          card.style.setProperty("--pass-to-x", `${Math.round(end.x - start.x)}px`);
          card.style.setProperty("--pass-to-y", `${Math.round(end.y - start.y)}px`);
          const distance = viewportDistance(start, end);
          const arcBaseY = -Math.round(Math.max(10, Math.min(34, distance * 0.055))) + i * 4;
          const arc = passArcVector(arcBaseY);
          card.style.setProperty("--pass-fly-delay", `${flowIndex * 145 + i * 104}ms`);
          card.style.setProperty("--pass-fly-rot", `${(i - 1) * 9}deg`);
          card.style.setProperty("--pass-arc-x", `${arc.x}px`);
          card.style.setProperty("--pass-arc-y", `${arc.y}px`);
          el.passFlightLayer.appendChild(card);
        }
      });
      clearTimeout(maybeAnimatePassFlow.timer);
      maybeAnimatePassFlow.timer = setTimeout(() => {
        if (el.passFlightLayer) el.passFlightLayer.innerHTML = "";
      }, 3400);
    }


    function maybeAnimateCollectFlow() {
      ensureViewportAnimationLayers();
      if (!el.collectFlightLayer) return;
      if (!state.collectingTrick || state.trick.length !== 4 || state.trickWinnerPlayer == null) {
        if (!state.collectingTrick) state.lastCollectFlightKey = "";
        return;
      }

      const key = `${state.roomId}:${state.roundNo}:${state.trickNo}:${state.trickWinnerPlayer}:${state.trick.map(item => `${item.player}-${item.card?.id || ""}`).join("|")}`;
      if (key === state.lastCollectFlightKey) return;
      state.lastCollectFlightKey = key;

      const winnerSlot = el.slots[state.trickWinnerPlayer];
      const winnerCard = winnerSlot?.querySelector(".card");
      const winnerRect = (winnerCard || winnerSlot)?.getBoundingClientRect();
      const target = screenDirectionTarget(state.trickWinnerPlayer, 190);
      if (!winnerRect || !target) return;

      const winnerCenter = {
        x: winnerRect.left + winnerRect.width / 2,
        y: winnerRect.top + winnerRect.height / 2
      };
      const loserOrder = state.trick.map(item => item.player).filter(player => player !== state.trickWinnerPlayer);
      el.collectFlightLayer.innerHTML = "";

      let maxDurationMs = 0;
      state.trick.forEach(play => {
        const slot = el.slots[play.player];
        const original = slot?.querySelector(".card");
        const rect = original?.getBoundingClientRect();
        if (!rect || !play.card) return;

        const isWinner = play.player === state.trickWinnerPlayer;
        const loserIndex = Math.max(0, loserOrder.indexOf(play.player));
        const stackOffsetX = isWinner ? 0 : [-7, 0, 7][loserIndex % 3];
        const stackOffsetY = isWinner ? 0 : 8 + loserIndex * 5;
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        const gatherX = Math.round(winnerCenter.x - startX + stackOffsetX);
        const gatherY = Math.round(winnerCenter.y - startY + stackOffsetY);
        const finalX = Math.round(target.x - startX + stackOffsetX);
        const finalY = Math.round(target.y - startY + stackOffsetY);
        const travel = Math.hypot(finalX - gatherX, finalY - gatherY);
        const duration = Math.round(Math.max(1780, Math.min(2780, (1380 + travel * 0.62) * state.effectSpeed)));
        maxDurationMs = Math.max(maxDurationMs, duration);

        const holder = document.createElement("div");
        holder.innerHTML = cardHTML(play.card, true).trim();
        const card = holder.firstElementChild;
        if (!card) return;
        card.classList.add("collect-flight-card");
        card.style.left = `${startX}px`;
        card.style.top = `${startY}px`;
        card.style.setProperty("--collect-gather-x", `${gatherX}px`);
        card.style.setProperty("--collect-gather-y", `${gatherY}px`);
        card.style.setProperty("--collect-to-x", `${finalX}px`);
        card.style.setProperty("--collect-to-y", `${finalY}px`);
        card.style.setProperty("--collect-z", isWinner ? "44" : String(40 - loserIndex));
        card.style.setProperty("--collect-stack-rot", isWinner ? "0deg" : `${[-6, 2, 7][loserIndex % 3]}deg`);
        card.style.setProperty("--collect-end-rot", isWinner ? "0deg" : `${[-9, 3, 9][loserIndex % 3]}deg`);
        card.style.setProperty("--collect-fly-duration", `${duration}ms`);
        el.collectFlightLayer.appendChild(card);
      });

      clearTimeout(maybeAnimateCollectFlow.timer);
      maybeAnimateCollectFlow.timer = setTimeout(() => {
        if (el.collectFlightLayer) el.collectFlightLayer.innerHTML = "";
      }, maxDurationMs + 280);
    }


    function getInteractionItems() {
      return [...INTERACTION_EMOJIS, ...INTERACTION_TOOLS];
    }

    function interactionItemByKind(kind) {
      return getInteractionItems().find(item => item.kind === kind) || INTERACTION_EMOJIS[0];
    }

    function interactionCooldownKey(kind, targetViewIndex = state.interactionTarget || 0, options = {}) {
      const safeKind = String(kind || "emoji");
      if (options.globalCooldown) return `global:${safeKind}`;
      const target = Math.max(0, Math.min(3, Number(targetViewIndex || 0)));
      return `${safeKind}:to:${target}`;
    }

    function interactionCooldownRemaining(kind, targetViewIndex = state.interactionTarget || 0, options = {}) {
      const key = interactionCooldownKey(kind, targetViewIndex, options);
      const until = Number(state.interactionCooldowns[key] || 0);
      return Math.max(0, Math.ceil((until - Date.now()) / 1000));
    }

    function setInteractionCooldown(kind, ms, targetViewIndex = state.interactionTarget || 0, options = {}) {
      const key = interactionCooldownKey(kind, targetViewIndex, options);
      state.interactionCooldowns[key] = Date.now() + Math.max(0, Number(ms || 0));
      renderInteractionPanel();
      refreshInteractionMenuContent();
      clearTimeout(setInteractionCooldown.timer);
      setInteractionCooldown.timer = setTimeout(() => {
        renderInteractionPanel();
        refreshInteractionMenuContent();
      }, Math.max(300, Number(ms || 0) + 80));
    }

    function renderQuickEmojiMenuButtons() {
      return INTERACTION_EMOJIS.map((item, index) => {
        const remain = interactionCooldownRemaining(item.kind, 0, { globalCooldown: true });
        return `<button type="button" data-quick-emoji-index="${index}" ${remain ? "disabled" : ""}>${item.icon} ${escapeHTML(remain ? `${item.label} ${remain}s` : item.label)}</button>`;
      }).join("");
    }

    function targetMenuButtonHtml(kind, icon, label, extraDisabled = false) {
      const remain = interactionCooldownRemaining(kind, state.interactionTarget || 0);
      const disabled = extraDisabled || Boolean(remain);
      const text = remain ? `${label} ${remain}s` : label;
      return `<button type="button" data-target-menu-kind="${kind}" ${disabled ? "disabled" : ""}>${icon} ${escapeHTML(text)}</button>`;
    }

    function refreshInteractionMenuContent() {
      if (!el.interactionTargetMenu || el.interactionTargetMenu.classList.contains("hidden")) return;
      ensureViewportAnimationLayers();
      if (state.interactionMenuMode === "quick") {
        el.interactionTargetMenu.innerHTML = renderQuickEmojiMenuButtons();
      } else if (state.interactionMenuMode === "target") {
        el.interactionTargetMenu.innerHTML = INTERACTION_TOOLS.map(item => {
          const disabled = item.kind === "tomato" && !state.allowTomato;
          return targetMenuButtonHtml(item.kind, item.icon, item.kind === "tomato" && !state.allowTomato ? "番茄已关" : item.label, disabled);
        }).join("");
      }
    }

    function startInteractionMenuTicker() {
      clearInterval(startInteractionMenuTicker.timer);
      refreshInteractionMenuContent();
      startInteractionMenuTicker.timer = setInterval(() => {
        if (!el.interactionTargetMenu || el.interactionTargetMenu.classList.contains("hidden")) {
          clearInterval(startInteractionMenuTicker.timer);
          return;
        }
        refreshInteractionMenuContent();
      }, 500);
    }

    function playerLabel(viewIndex) {
      const p = state.players[viewIndex] || {};
      if (viewIndex === 0) return p.name && p.name !== "等待中" ? p.name : "自己";
      return p.name || ["本家", "上家", "对家", "下家"][viewIndex] || "玩家";
    }

    function renderInteractionPanel() {
      if (!el.interactionTargetStrip) return;
      const target = Math.max(0, Math.min(3, Number(state.interactionTarget || 0)));
      el.interactionTargetStrip.innerHTML = `<span class="interaction-target-label">当前目标</span>` + [0,1,2,3].map(i =>
        `<button class="interaction-target-chip ${i === target ? "is-active" : ""}" type="button" data-interaction-target="${i}">${escapeHTML(playerLabel(i))}</button>`
      ).join("");

      if (el.quickEmojiGrid) {
        el.quickEmojiGrid.innerHTML = INTERACTION_EMOJIS.map((item, index) => {
          const remain = interactionCooldownRemaining(item.kind, target);
          return `<button class="interaction-option" type="button" data-interaction-emoji-index="${index}" ${remain ? "disabled" : ""}>
            <span class="interaction-icon">${item.icon}</span><span>${escapeHTML(remain ? `${item.label} ${remain}s` : item.label)}</span>
          </button>`;
        }).join("");
      }
      if (el.interactionToolGrid) {
        el.interactionToolGrid.innerHTML = INTERACTION_TOOLS.map(item => {
          const remain = interactionCooldownRemaining(item.kind, target);
          const disabled = remain || (item.kind === "tomato" && !state.allowTomato);
          const label = item.kind === "tomato" && !state.allowTomato ? "番茄已关" : (remain ? `${item.label} ${remain}s` : item.label);
          return `<button class="interaction-option ${item.className || ""}" type="button" data-interaction-kind="${item.kind}" ${disabled ? "disabled" : ""}>
            <span class="interaction-icon">${item.icon}</span><span>${escapeHTML(label)}</span>
          </button>`;
        }).join("");
      }
    }

    function openInteractionPanel(targetViewIndex = state.interactionTarget || 0) {
      state.interactionTarget = Math.max(0, Math.min(3, Number(targetViewIndex || 0)));
      hideInteractionTargetMenu();
      renderInteractionPanel();
      el.interactionModal?.classList.remove("hidden");
    }

    function closeInteractionPanel() {
      el.interactionModal?.classList.add("hidden");
    }

    function toggleInteractionEffects() {
      state.interactionEffectsEnabled = !state.interactionEffectsEnabled;
      localStorage.setItem(INTERACTION_EFFECTS_KEY, state.interactionEffectsEnabled ? "1" : "0");
      updateThemeAndSoundButtons();
      showActionToast(state.interactionEffectsEnabled ? "互动特效已开启。" : "互动特效已关闭。普通表情仍会以简洁提示显示。");
    }

    function toggleInteractionSound() {
      state.interactionSoundEnabled = !state.interactionSoundEnabled;
      localStorage.setItem(INTERACTION_SOUND_KEY, state.interactionSoundEnabled ? "1" : "0");
      updateThemeAndSoundButtons();
      if (state.interactionSoundEnabled) playInteractionSound("emoji");
      showActionToast(state.interactionSoundEnabled ? "互动音效已开启。" : "互动音效已关闭。");
    }

    function toggleAllowTomato() {
      state.allowTomato = !state.allowTomato;
      localStorage.setItem(ALLOW_TOMATO_KEY, state.allowTomato ? "1" : "0");
      updateThemeAndSoundButtons();
      showActionToast(state.allowTomato ? "扔番茄互动已开启。" : "扔番茄互动已关闭。");
    }

    function playInteractionSound(kind) {
      if (!state.soundEnabled || !state.interactionSoundEnabled) return;
      if (kind === "flower") { playTone(660, .07, "sine", .024); setTimeout(() => playTone(880, .09, "sine", .022), 70); }
      else if (kind === "tomato") { playTone(180, .08, "triangle", .030); setTimeout(() => playTone(120, .08, "sawtooth", .018), 75); }
      else if (kind === "applause") { playTone(520, .045, "triangle", .020); setTimeout(() => playTone(560, .045, "triangle", .018), 70); }
      else playTone(720, .06, "sine", .018);
    }

    function sendInteraction(kind, targetViewIndex = state.interactionTarget || 0, options = {}) {
      const item = options.itemOverride || interactionItemByKind(kind);
      const cooldownKind = options.cooldownKind || item.kind || kind;
      const target = Math.max(0, Math.min(3, Number(targetViewIndex || 0)));
      if (kind === "tomato" && !state.allowTomato) {
        showActionToast("已关闭扔番茄互动，可在设置里开启。");
        return;
      }
      const globalCooldown = Boolean(options.globalCooldown);
      const remain = interactionCooldownRemaining(cooldownKind, target, { globalCooldown });
      if (remain && !options.debug) {
        showActionToast(`${item.label}还需 ${remain} 秒冷却。`);
        return;
      }
      const event = {
        seq: Date.now(),
        kind: item.kind,
        icon: item.icon,
        label: item.label,
        fromIndex: state.yourIndex,
        toIndex: viewToAbs(target),
        from: playerLabel(0),
        to: playerLabel(target),
        at: Date.now()
      };
      if (options.debug) {
        displayInteractionEvent({ ...event, fromView: 0, toView: target, debug: true });
        playInteractionSound(kind);
        return;
      }
      setInteractionCooldown(cooldownKind, item.cooldown || 3000, target, { globalCooldown });
      hideInteractionTargetMenu();
      closeInteractionPanel();
      if (!sendMsg({ type: "interaction", interaction: event })) {
        displayInteractionEvent({ ...event, fromView: 0, toView: target, localOnly: true });
      }
    }

    function processInteractionEvents(events) {
      const list = Array.isArray(events) ? events : [];
      if (state.interactionRoomId !== state.roomId) {
        state.interactionRoomId = state.roomId;
        state.lastInteractionSeq = Math.max(0, ...list.map(item => Number(item.seq || 0)));
        state.interactions = list;
        return;
      }
      const fresh = list
        .filter(item => Number(item.seq || 0) > state.lastInteractionSeq)
        .sort((a, b) => Number(a.seq || 0) - Number(b.seq || 0));
      if (fresh.length) {
        state.lastInteractionSeq = Math.max(state.lastInteractionSeq, ...fresh.map(item => Number(item.seq || 0)));
        fresh.forEach((item, index) => setTimeout(() => {
          displayInteractionEvent({ ...item, fromView: absToView(Number(item.fromIndex)), toView: absToView(Number(item.toIndex)) });
        }, index * 160));
      }
      state.interactions = list;
    }

    function normalizedVectorFromCenter(point) {
      const w = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
      const h = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      const dx = Number(point?.x || w / 2) - w / 2;
      const dy = Number(point?.y || h / 2) - h / 2;
      const len = Math.hypot(dx, dy);
      if (len < 12) return null;
      return { x: dx / len, y: dy / len };
    }

    function visualDirectionFromCenter(viewIndex = 0, fallback = null) {
      const base = seatCenter(viewIndex) || cardPileCenter(viewIndex);
      const vector = normalizedVectorFromCenter(base);
      if (vector) return vector;
      return fallback || screenDirectionVector(viewIndex);
    }

    function interactionBubbleAnchor(viewIndex = 0) {
      const base = seatCenter(viewIndex) || cardPileCenter(viewIndex) || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      // v1.4.13：气泡以“当前屏幕上的头像真实位置”为锚点。
      // 这样手机横屏 / 游戏内强制横屏时，上家、对家、下家的互动不会再按旧逻辑错位。
      const vector = visualDirectionFromCenter(viewIndex, screenDirectionVector(viewIndex));
      const offset = 48;
      return clampMenuPoint({
        x: base.x - Number(vector.x || 0) * offset,
        y: base.y - Number(vector.y || 0) * offset
      }, 22);
    }

    function showInteractionBubble(event, viewIndex = 0, delay = 0) {
      if (!el.interactionLayer) return;
      ensureViewportAnimationLayers();
      const pos = interactionBubbleAnchor(viewIndex);
      const bubble = document.createElement("div");
      bubble.className = "interaction-bubble";
      bubble.style.left = `${Math.round(pos.x)}px`;
      bubble.style.top = `${Math.round(pos.y)}px`;
      bubble.style.animationDelay = `${delay}ms`;
      bubble.style.setProperty("--screen-rot", isForcedLandscapeFlightMode() ? "90deg" : "0deg");
      bubble.innerHTML = `<span class="ib-icon">${escapeHTML(event.icon || "💬")}</span><span class="ib-label">${escapeHTML(event.label || "互动")}</span><span class="ib-from">${escapeHTML(event.from || "玩家")}</span>`;
      el.interactionLayer.appendChild(bubble);
      setTimeout(() => bubble.remove(), 2600 + delay);
    }

    function showInteractionImpact(kind, icon, pos) {
      if (!el.interactionLayer || !pos) return;
      const impact = document.createElement("div");
      impact.className = `interaction-impact ${kind || "like"}`;
      impact.style.left = `${Math.round(pos.x)}px`;
      impact.style.top = `${Math.round(pos.y)}px`;
      impact.style.setProperty("--screen-rot", isForcedLandscapeFlightMode() ? "90deg" : "0deg");
      impact.textContent = icon || "✨";
      el.interactionLayer.appendChild(impact);
      setTimeout(() => impact.remove(), 900);
    }

    function displayInteractionEvent(event) {
      if (!event || !el.interactionLayer) return;
      ensureViewportAnimationLayers();
      const kind = event.kind || "emoji";
      const fromView = Number.isInteger(event.fromView) ? event.fromView : 0;
      const toView = Number.isInteger(event.toView) ? event.toView : fromView;
      const item = interactionItemByKind(kind);
      const icon = event.icon || item.icon;
      const label = event.label || item.label;
      const safeEvent = { ...event, icon, label };
      const isTool = kind === "flower" || kind === "tomato" || kind === "brick" || kind === "slipper" || kind === "cabbage" || kind === "like" || kind === "applause";
      const bubbleView = isTool ? toView : fromView;
      const target = seatCenter(bubbleView) || { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      if (!state.interactionEffectsEnabled || kind === "emoji") {
        showInteractionBubble(safeEvent, bubbleView);
        playInteractionSound(kind);
        return;
      }

      if (kind === "applause") {
        showInteractionBubble(safeEvent, bubbleView);
        setTimeout(() => showInteractionBubble({ ...safeEvent, icon: "👏", label: "掌声送上" }, bubbleView, 0), 260);
        playInteractionSound(kind);
        return;
      }

      const start = seatCenter(fromView) || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const end = target;
      const fly = document.createElement("div");
      fly.className = "interaction-fly-item";
      fly.textContent = icon;
      fly.style.left = `${Math.round(start.x)}px`;
      fly.style.top = `${Math.round(start.y)}px`;
      const dx = Math.round(end.x - start.x);
      const dy = Math.round(end.y - start.y);
      const distance = Math.hypot(dx, dy);
      const duration = Math.round(Math.max(840, Math.min(1380, 720 + distance * .42)));
      const arc = passArcVector(-Math.max(18, Math.min(54, distance * .08)));
      fly.style.setProperty("--interaction-to-x", `${dx}px`);
      fly.style.setProperty("--interaction-to-y", `${dy}px`);
      fly.style.setProperty("--interaction-mid-x", `${Math.round(dx * .45 + arc.x)}px`);
      fly.style.setProperty("--interaction-mid-y", `${Math.round(dy * .45 + arc.y)}px`);
      fly.style.setProperty("--interaction-duration", `${duration}ms`);
      fly.style.setProperty("--screen-rot", isForcedLandscapeFlightMode() ? "90deg" : "0deg");
      el.interactionLayer.appendChild(fly);
      playInteractionSound(kind);
      setTimeout(() => {
        fly.remove();
        showInteractionImpact(kind, icon, end);
        showInteractionBubble(safeEvent, bubbleView, 70);
      }, duration - 40);
    }

    function renderDebugInteractionList() {
      if (!el.debugInteractionList) return;
      const samples = [
        ...INTERACTION_EMOJIS,
        ...INTERACTION_TOOLS
      ];
      el.debugInteractionList.innerHTML = samples.map((item, index) => `
        <div class="interaction-debug-item">
          <div><span style="font-size:20px;margin-right:8px;">${item.icon}</span>${escapeHTML(item.label)}<div class="debug-broadcast-subtitle">预览目标：对家 / 横屏模式会跟随旋转</div></div>
          <button class="debug-play-btn" type="button" data-debug-interaction-index="${index}">播放</button>
        </div>
      `).join("");
      renderDebugInteractionList.samples = samples;
      renderDebugExtraList();
    }

    function renderDebugExtraList() {
      if (!el.debugExtraList) return;
      const extras = [
        { key: "viewTable", title: "查看牌桌", desc: "预览每局结束后的全屏牌桌回看，横屏状态下同步旋转。" }
      ];
      el.debugExtraList.innerHTML = extras.map(item => `
        <div class="debug-extra-item">
          <div><strong>${escapeHTML(item.title)}</strong><div class="debug-broadcast-subtitle">${escapeHTML(item.desc)}</div></div>
          <button class="debug-play-btn" type="button" data-debug-extra="${item.key}">播放</button>
        </div>
      `).join("");
    }

    function menuAnchorRectForView(viewIndex) {
      const avatar = el.seats[viewIndex]?.querySelector(".avatar");
      const node = avatar || el.seats[viewIndex];
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      if (!rect.width && !rect.height) return null;
      return rect;
    }

    function clampMenuPoint(point, padding = 18) {
      const w = window.innerWidth || document.documentElement.clientWidth || 1;
      const h = window.innerHeight || document.documentElement.clientHeight || 1;
      return {
        x: Math.max(padding, Math.min(w - padding, Math.round(point.x || w / 2))),
        y: Math.max(padding, Math.min(h - padding, Math.round(point.y || h / 2)))
      };
    }

    function placeInteractionMenu(point, placement = "above", extraClass = "") {
      if (!el.interactionTargetMenu) return;
      const pos = clampMenuPoint(point || { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      el.interactionTargetMenu.className = `interaction-target-menu hidden menu-${placement} ${extraClass}`.trim();
      el.interactionTargetMenu.style.left = `${pos.x}px`;
      el.interactionTargetMenu.style.top = `${pos.y}px`;
      el.interactionTargetMenu.style.setProperty("--screen-rot", isForcedLandscapeFlightMode() ? "90deg" : "0deg");
    }

    function showQuickEmojiMenu(anchorEvent = null) {
      if (!el.interactionTargetMenu) return;
      state.interactionTarget = 0;
      state.interactionMenuMode = "quick";
      ensureViewportAnimationLayers();
      const point = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      placeInteractionMenu(point, "center", "quick-emoji-menu");
      el.interactionTargetMenu.innerHTML = renderQuickEmojiMenuButtons();
      el.interactionTargetMenu.classList.remove("hidden");
      startInteractionMenuTicker();
    }

    function showInteractionTargetMenu(viewIndex, anchorEvent = null) {
      if (!el.interactionTargetMenu) return;
      state.interactionTarget = Math.max(0, Math.min(3, Number(viewIndex || 0)));
      ensureViewportAnimationLayers();
      const rect = menuAnchorRectForView(state.interactionTarget);
      let placement = "above";
      let point = null;
      if (rect) {
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const vector = visualDirectionFromCenter(state.interactionTarget, screenDirectionVector(state.interactionTarget));
        if (Math.abs(vector.y || 0) >= Math.abs(vector.x || 0)) {
          if ((vector.y || 0) < 0) {
            placement = "below";
            point = { x: center.x, y: rect.bottom + 8 };
          } else {
            placement = "above";
            point = { x: center.x, y: rect.top - 8 };
          }
        } else if ((vector.x || 0) < 0) {
          placement = "right";
          point = { x: rect.right + 8, y: center.y };
        } else {
          placement = "left";
          point = { x: rect.left - 8, y: center.y };
        }
      }
      if (!point && anchorEvent?.clientX != null) point = { x: anchorEvent.clientX, y: anchorEvent.clientY };
      if (!point) point = seatCenter(state.interactionTarget) || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      placeInteractionMenu(point, placement, "");
      state.interactionMenuMode = "target";
      refreshInteractionMenuContent();
      el.interactionTargetMenu.classList.remove("hidden");
      startInteractionMenuTicker();
    }

    function hideInteractionTargetMenu() {
      el.interactionTargetMenu?.classList.add("hidden");
      state.interactionMenuMode = "";
      clearInterval(startInteractionMenuTicker.timer);
    }

    function maybePlayTrickSound() {
      if (!state.soundEnabled || !state.trick.length) return;
      const latest = state.trick[state.trick.length - 1];
      if (!latest?.card?.id) return;
      const key = `${state.roomId}:${state.roundNo}:${state.trickNo}:${state.trick.length}:${latest.player}:${latest.card.id}`;
      if (key === state.lastSoundTrickKey) return;
      state.lastSoundTrickKey = key;
      playGameSound("play");
    }

    const SPECIAL_LEVEL_NAMES = {
      minor: "小事件",
      highlight: "高光",
      epic: "名场面",
      legendary: "封神"
    };


    const SPECIAL_EVENT_DEBUG_SAMPLES = [
      { type: "hearts-broken", level: "minor", title: "红桃已破", subtitle: "刘备打出第一张红桃，现在可以主动出红桃了。", playerIndex: 0 },
      { type: "twoPointCapture", level: "highlight", title: "二点吃分", subtitle: "诸葛亮用梅花 2 收下 5 分。", playerIndex: 2 },
      { type: "queenCaptured", level: "highlight", title: "黑桃女王入袋", subtitle: "曹操吃下黑桃 Q，+13 分。", playerIndex: 1 },
      { type: "lastQueenSelf", level: "epic", title: "压轴自吃", subtitle: "孙权最后一墩打出黑桃 Q，却自己收回。", playerIndex: 3 },
      { type: "lastQueenThrow", level: "epic", title: "压轴甩锅", subtitle: "张辽最后一墩甩出黑桃 Q，关羽接锅。", playerIndex: 0 },
      { type: "disasterTrick", level: "epic", title: "大祸临头", subtitle: "司马懿一墩收下 15 分：2 张红桃 + 黑桃 Q。", playerIndex: 1 },
      { type: "zeroRound", level: "highlight", title: "零分过关", subtitle: "赵云、小乔本局完美避分。", playerIndex: 2 },
      { type: "nearMoon", level: "epic", title: "差点射月", subtitle: "周瑜本局吃到 25 分，只差一步。", playerIndex: 3 },
      { type: "heartCollector", level: "epic", title: "红桃收集者", subtitle: "吕蒙收下 10 张红桃。", playerIndex: 1 },
      { type: "shoot-moon", level: "legendary", title: "射中月亮", subtitle: "貂蝉独揽 26 分，全场改命！", playerIndex: 0 }
    ];



    function normalizeSpecialEventLevel(level) {
      return ["minor", "highlight", "epic", "legendary"].includes(level) ? level : "minor";
    }

    function renderDebugBroadcastList() {
      if (!el.debugBroadcastList) return;
      el.debugBroadcastList.innerHTML = SPECIAL_EVENT_DEBUG_SAMPLES.map((item, index) => {
        const level = normalizeSpecialEventLevel(item.level);
        const levelName = SPECIAL_LEVEL_NAMES[level] || "高光";
        return `<div class="debug-broadcast-item">
          <div class="debug-broadcast-main">
            <div class="debug-broadcast-title"><span class="debug-level-pill ${level}">${levelName}</span><span>${escapeHTML(item.title)}</span></div>
            <div class="debug-broadcast-subtitle">${escapeHTML(item.subtitle)}</div>
          </div>
          <button class="debug-play-btn" type="button" data-debug-index="${index}">播放</button>
        </div>`;
      }).join("");
    }

    function openDebugBroadcastModal() {
      renderDebugBroadcastList();
      renderDebugInteractionList();
      el.settingsModal?.classList.add("hidden");
      el.debugBroadcastModal?.classList.remove("hidden");
    }

    function closeDebugBroadcastModal() {
      el.debugBroadcastModal?.classList.add("hidden");
    }

    function previewSpecialEvent(event) {
      if (!event || !el.specialEvent) return;
      clearTimeout(playNextSpecialEvent.timer);
      clearTimeout(previewSpecialEvent.timer);
      state.specialEventShowing = false;
      const level = normalizeSpecialEventLevel(event.level);
      const baseDuration = level === "legendary" ? 2350 : (level === "epic" ? 2150 : 2000);
      const duration = Math.round(baseDuration * state.effectSpeed);
      ensureViewportAnimationLayers();
      el.specialEvent.className = `special-event ${level} type-${event.type || "general"} special-flying`;
      el.specialEvent.classList.remove("hidden");
      el.specialEvent.style.setProperty("--special-duration", `${duration}ms`);
      positionSpecialEventFlight(event);
      if (el.specialEventLevel) el.specialEventLevel.textContent = SPECIAL_LEVEL_NAMES[level] || "高光";
      if (el.specialEventTitle) el.specialEventTitle.textContent = event.title || "牌局高光";
      if (el.specialEventSubtitle) el.specialEventSubtitle.textContent = event.subtitle || "";
      el.specialEvent.style.animation = "none";
      void el.specialEvent.offsetWidth;
      el.specialEvent.style.removeProperty("animation");
      playSpecialSound(level);
      previewSpecialEvent.timer = setTimeout(() => {
        el.specialEvent.classList.add("hidden");
        el.specialEvent.classList.remove("special-flying");
        el.specialEvent.style.removeProperty("--special-duration");
      }, duration);
    }

    function processSpecialEvents(events) {
      const list = Array.isArray(events) ? events : [];
      if (state.specialEventRoomId !== state.roomId) {
        state.specialEventRoomId = state.roomId;
        state.lastSpecialEventSeq = Math.max(0, ...list.map(item => Number(item.seq || 0)));
        state.specialEvents = list;
        return;
      }

      const fresh = list
        .filter(item => Number(item.seq || 0) > state.lastSpecialEventSeq)
        .sort((a, b) => Number(a.seq || 0) - Number(b.seq || 0));

      if (fresh.length) {
        state.lastSpecialEventSeq = Math.max(state.lastSpecialEventSeq, ...fresh.map(item => Number(item.seq || 0)));
        state.specialEventQueue.push(...fresh);
        playNextSpecialEvent();
      }
      state.specialEvents = list;
    }

    function playSpecialSound(level) {
      if (!state.soundEnabled) return;
      if (level === "legendary") {
        playGameSound("moon");
      } else if (level === "epic") {
        playTone(330, .11, "triangle", .036);
        setTimeout(() => playTone(494, .12, "triangle", .034), 110);
      } else if (level === "highlight") {
        playTone(622, .09, "sine", .032);
        setTimeout(() => playTone(830, .10, "sine", .028), 90);
      } else {
        playTone(520, .07, "sine", .022);
      }
    }

    function resolveSpecialEventViewIndex(event) {
      if (!event) return null;
      if (Number.isInteger(event.playerIndex)) return absToView(event.playerIndex);
      if (Number.isInteger(Number(event.playerIndex))) return absToView(Number(event.playerIndex));
      const name = String(event.player || "").split(/[、,，\s]+/).filter(Boolean)[0] || "";
      if (!name) return null;
      const absIndex = state.serverPlayers.findIndex(player => player?.name === name);
      return absIndex >= 0 ? absToView(absIndex) : null;
    }

    function positionSpecialEventFlight(event) {
      ensureViewportAnimationLayers();
      if (!el.specialEvent) return;
      let viewIndex = resolveSpecialEventViewIndex(event);
      if (viewIndex == null || viewIndex < 0) viewIndex = Number.isInteger(state.currentPlayer) ? absToView(Number(state.currentPlayer)) : 0;
      const target = screenDirectionTarget(viewIndex, 190);
      const centerX = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1) / 2;
      const centerY = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1) / 2;
      const dx = Math.round(target.x - centerX);
      const dy = Math.round(target.y - centerY);
      el.specialEvent.style.setProperty("--screen-rot", isForcedLandscapeFlightMode() ? "90deg" : "0deg");
      el.specialEvent.style.setProperty("--special-to-x", `${dx}px`);
      el.specialEvent.style.setProperty("--special-to-y", `${dy}px`);
    }

    function playNextSpecialEvent() {
      if (state.specialEventShowing || !state.specialEventQueue.length || !el.specialEvent) return;
      const event = state.specialEventQueue.shift();
      const level = event.level || "minor";
      if (event?.type === "shootMoon" && state.moonEffectUntil && Date.now() < state.moonEffectUntil) {
        state.specialEventQueue.unshift(event);
        clearTimeout(playNextSpecialEvent.timer);
        playNextSpecialEvent.timer = setTimeout(playNextSpecialEvent, Math.max(160, state.moonEffectUntil - Date.now() + 120));
        return;
      }
      if (!state.effectsEnabled) {
        state.specialEventShowing = false;
        setTimeout(playNextSpecialEvent, 10);
        return;
      }
      const baseDuration = level === "legendary" ? 2350 : (level === "epic" ? 2150 : 2000);
      const duration = Math.round(baseDuration * state.effectSpeed);

      ensureViewportAnimationLayers();
      state.specialEventShowing = true;
      el.specialEvent.className = `special-event ${level} type-${event.type || "general"} special-flying`;
      el.specialEvent.classList.remove("hidden");
      el.specialEvent.style.setProperty("--special-duration", `${duration}ms`);
      positionSpecialEventFlight(event);
      if (el.specialEventLevel) el.specialEventLevel.textContent = SPECIAL_LEVEL_NAMES[level] || "高光";
      if (el.specialEventTitle) el.specialEventTitle.textContent = event.title || "牌局高光";
      if (el.specialEventSubtitle) el.specialEventSubtitle.textContent = event.subtitle || "";
      el.specialEvent.style.animation = "none";
      void el.specialEvent.offsetWidth;
      el.specialEvent.style.removeProperty("animation");
      playSpecialSound(level);

      clearTimeout(playNextSpecialEvent.timer);
      playNextSpecialEvent.timer = setTimeout(() => {
        el.specialEvent.classList.add("hidden");
        el.specialEvent.classList.remove("special-flying");
        el.specialEvent.style.removeProperty("--special-duration");
        state.specialEventShowing = false;
        setTimeout(playNextSpecialEvent, 140);
      }, duration);
    }

    function maybeShowMoonEffect() {
      if (!state.effectsEnabled) return;
      if (state.moonShooter == null || state.moonShooter < 0) return;
      if (!["roundEnd", "gameEnd"].includes(state.phase)) return;
      const key = `${state.roomId}:${state.roundNo}:${state.moonShooter}`;
      if (key === state.lastMoonKey) return;
      state.lastMoonKey = key;
      const playerName = state.players[state.moonShooter]?.name || "玩家";
      if (el.moonTitle) el.moonTitle.textContent = "射中月亮！";
      if (el.moonSubtitle) el.moonSubtitle.textContent = `${playerName} 本局打满贯，其他玩家各加 26 分`;
      if (el.moonEffect) {
        state.moonEffectUntil = Date.now() + 3800;
        document.body.classList.add("moon-effect-active");
        el.moonEffect.classList.remove("hidden");
        clearTimeout(maybeShowMoonEffect.timer);
        maybeShowMoonEffect.timer = setTimeout(() => {
          el.moonEffect.classList.add("hidden");
          document.body.classList.remove("moon-effect-active");
        }, 3800);
      }
      playGameSound("moon");
    }


    function showActionToast(text, duration = 1500) {
      el.actionToast.textContent = text;
      el.actionToast.classList.remove("hidden");
      clearTimeout(showActionToast.timer);
      showActionToast.timer = setTimeout(() => {
        el.actionToast.classList.add("hidden");
      }, Math.max(900, Number(duration || 1500)));
    }


    function showHandTip(text) {
      if (!el.handTip || !text) return;
      el.handTip.textContent = text;
      el.handTip.classList.remove("hidden");
      clearTimeout(showHandTip.timer);
      showHandTip.timer = setTimeout(() => {
        el.handTip.classList.add("hidden");
      }, 1700);
    }

    function explainIllegalCard(card) {
      if (state.phase === "pass") return state.youPassed ? "你已经传过牌了，请等待其他玩家。" : "请先选择要传出的 3 张牌。";
      if (state.phase !== "play") return "当前不是出牌阶段。";
      if (state.busy || state.comparingTrick || state.collectingTrick) return "正在结算本墩，请稍等。";
      if (state.currentPlayer !== 0) return "还没轮到你出牌。";
      if (!card) return "这张牌当前不能出。";
      const hand = state.players[0]?.hand || [];
      const leadSuit = state.trick?.[0]?.card?.suit || null;
      const hasLeadSuit = leadSuit && hand.some(item => item.suit === leadSuit);
      const hasClub2 = hand.some(item => item.suit === "C" && Number(item.rank) === 2);
      const allHearts = hand.length > 0 && hand.every(item => item.suit === "H");
      const onlyPenalty = hand.length > 0 && hand.every(item => item.suit === "H" || (item.suit === "S" && Number(item.rank) === 12));
      const isFirstTrick = Number(state.trickNo || 0) === 0;
      const isLeading = !leadSuit;
      if (isFirstTrick && isLeading && hasClub2 && !(card.suit === "C" && Number(card.rank) === 2)) return "首轮首出必须先出梅花 2。";
      if (leadSuit && card.suit !== leadSuit && hasLeadSuit) return `本墩先出的是${SUITS[leadSuit].name}，你必须跟出同花色。`;
      if (isLeading && card.suit === "H" && !state.heartsBroken && !allHearts) return "红桃尚未破，暂时不能主动出红桃。";
      if (isFirstTrick && !isLeading && (card.suit === "H" || (card.suit === "S" && Number(card.rank) === 12)) && !onlyPenalty) return "第一墩不能垫红桃或黑桃 Q。";
      if (!state.legalCardIds.has(card.id)) return `${cardName(card)} 当前不符合出牌规则。`;
      return `${cardName(card)} 现在不能出。`;
    }

    function isFullscreenActive() {
      return Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
    }

    function requestAppFullscreen() {
      const target = document.documentElement;
      const fn =
        target.requestFullscreen ||
        target.webkitRequestFullscreen ||
        target.msRequestFullscreen;
      if (!fn) return Promise.reject(new Error("fullscreen unsupported"));
      const result = fn.call(target);
      return result && typeof result.then === "function" ? result : Promise.resolve();
    }

    function exitAppFullscreen() {
      const fn =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.msExitFullscreen;
      if (!fn) return Promise.reject(new Error("exit fullscreen unsupported"));
      const result = fn.call(document);
      return result && typeof result.then === "function" ? result : Promise.resolve();
    }

    function isSmallPortraitScreen() {
      return window.innerHeight > window.innerWidth && window.innerWidth <= 900;
    }

    function isMobileOrTabletScreen() {
      const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
      const narrowSide = Math.min(window.innerWidth, window.innerHeight);
      const longSide = Math.max(window.innerWidth, window.innerHeight);
      return Boolean(coarse && narrowSide <= 1024 && longSide <= 1400);
    }

    async function tryLockDeviceLandscape() {
      // v1.4.13：开启横屏默认不再请求浏览器全屏，只尝试系统方向锁定；失败则回退到游戏内横屏。
      try {
        if (screen.orientation && typeof screen.orientation.lock === "function") {
          await screen.orientation.lock("landscape");
          state.orientationLocked = true;
          return true;
        }
      } catch (error) {
        state.orientationLocked = false;
      }
      return false;
    }

    function updateSystemButtons() {
      if (el.fullscreenBtn) el.fullscreenBtn.textContent = isFullscreenActive() ? "退出全屏" : "全屏";
      if (el.landscapeBtn) el.landscapeBtn.textContent = state.forceLandscape ? "退出横屏" : "横屏";
      if (el.openRoomBtn) el.openRoomBtn.textContent = state.roomId ? `房间 ${state.roomId}` : "房间";
    }

    async function toggleFullscreenMode() {
      try {
        if (isFullscreenActive()) {
          await exitAppFullscreen();
          showActionToast("已退出全屏；横屏状态不受影响。");
        } else {
          await requestAppFullscreen();
          showActionToast("已进入全屏；可继续单独切换横屏。");
        }
      } catch (error) {
        showActionToast("当前浏览器不支持全屏，或需要在手机浏览器中打开。");
      } finally {
        updateSystemButtons();
        setTimeout(render, 180);
      }
    }

    function enableLandscapeMode(options = {}) {
      if (!options.keepLock) state.orientationLocked = false;
      state.forceLandscape = true;
      localStorage.setItem(FORCE_LANDSCAPE_KEY, "1");
      document.body.classList.add("force-landscape");
      if (options.toast !== false) showActionToast("已启用横屏显示；不会自动进入全屏。可再点“全屏”同时启用。");
      updateSystemButtons();
      ensureViewportAnimationLayers();
      refreshInteractionMenuContent();
      positionSpecialEventFlight({ playerIndex: state.currentPlayer });
      setTimeout(render, 220);
    }

    function disableLandscapeMode() {
      state.orientationLocked = false;
      state.forceLandscape = false;
      localStorage.removeItem(FORCE_LANDSCAPE_KEY);
      document.body.classList.remove("force-landscape");
      showActionToast("已退出横屏显示；全屏状态不受影响。");
      updateSystemButtons();
      ensureViewportAnimationLayers();
      refreshInteractionMenuContent();
      positionSpecialEventFlight({ playerIndex: state.currentPlayer });
      setTimeout(render, 220);
    }

    function toggleLandscapeMode() {
      if (state.forceLandscape) disableLandscapeMode();
      else enableLandscapeMode();
    }

    function shouldSuggestLandscape() {
      const isPortrait = window.innerHeight > window.innerWidth;
      const mobileOrTablet = isMobileOrTabletScreen();
      return isPortrait && mobileOrTablet && !state.forceLandscape && !state.orientationLocked;
    }

    function maybeShowLandscapePrompt(force = false) {
      if (!el.landscapePromptModal) return;
      if (!shouldSuggestLandscape()) return;
      if (!force && state.landscapePromptShown) return;
      state.landscapePromptShown = true;
      sessionStorage.setItem(LANDSCAPE_PROMPT_KEY, "1");
      el.landscapePromptModal.classList.add("mobile-landscape-required");
      el.landscapePromptModal.querySelector(".modal-title").textContent = "请开启横屏后进入游戏";
      el.landscapePromptModal.querySelector(".modal-subtitle").textContent = "手机 / 平板竖屏容易遮挡手牌、互动和上一轮按钮，本版本先强制横屏游玩。";
      el.landscapePromptModal.classList.remove("hidden");
    }

    function closeLandscapePrompt() {
      if (el.landscapePromptModal) el.landscapePromptModal.classList.add("hidden");
    }

    async function acceptLandscapePrompt() {
      closeLandscapePrompt();
      const locked = await tryLockDeviceLandscape();
      enableLandscapeMode({ keepLock: locked, toast: false });
      showActionToast(locked ? "已尝试锁定系统横屏；不会自动进入全屏。" : "当前浏览器不支持自动锁横屏，已启用游戏内横屏模式。", 2600);
    }

    function cleanJudgeText(text) {
      const value = String(text || "").trim();
      if (/最大牌|收下本墩|收下\s*\d+\s*分/.test(value)) return "";
      return value.replace(/^[^：:]{1,10}最大[：:]\s*/, "");
    }

    function getPassMotionVector(mode, direction = "out") {
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

    function cardVisualClass(card) {
      if (!card) return "";
      if (card.suit === "S" && card.rank === 12) return "queen-spades";
      if (card.suit === "H") return "heart-card";
      return "";
    }

    function cardHTML(card, small = false) {
      const suit = SUITS[card.suit];
      const visualClass = cardVisualClass(card);
      return `
        <div class="card ${suit.color} ${visualClass} ${small ? "small" : ""}">
          <div class="card-corner">${rankText(card.rank)}<br>${suit.symbol}</div>
          <div class="card-pip">${suit.symbol}</div>
          <div class="card-corner bottom">${rankText(card.rank)}<br>${suit.symbol}</div>
        </div>
      `;
    }

    function renderSeats() {
      const showTurn = state.phase === "play" && !state.comparingTrick && !state.collectingTrick;
      for (let i = 0; i < 4; i++) {
        const p = state.players[i] || createPlaceholderPlayers()[i];
        const kingdomAvatar = ["魏", "蜀", "吴"].includes(p.avatar);
        const factionClass = kingdomAvatar ? (p.avatar === "魏" ? "bot-wei" : (p.avatar === "蜀" ? "bot-shu" : (p.avatar === "吴" ? "bot-wu" : ""))) : "";
        const aiControlled = Boolean(p.aiControlled);
        const offline = state.roomId && ((aiControlled) || (!p.isBot && !p.connected)) && p.name !== "等待中" ? `<span class="seat-state offline"> · 离线</span>` : "";
        const bot = p.isBot ? (aiControlled ? `<span class="seat-state bot managed"> - AI托管中</span>` : `<span class="seat-state bot ${factionClass}"> · AI</span>`) : "";
        const avatarVisualClass = ((p.isBot && !aiControlled) || (p.name === "等待中" && kingdomAvatar)) ? "bot-avatar" : "human-avatar";
        const isTurn = Boolean(showTurn && state.currentPlayer === i && p.name !== "等待中");
        el.seats[i].classList.toggle("is-turn", isTurn);
        el.seats[i].innerHTML = `
          ${isTurn ? `<div class="turn-indicator"><span class="turn-dot"></span><span>出牌中</span></div>` : ""}
          <div class="avatar ${p.avatarClass} ${avatarVisualClass} ${factionClass}">${isTurn ? `<span class="avatar-wave wave-one"></span><span class="avatar-wave wave-two"></span>` : ""}<span class="avatar-symbol">${escapeHTML(p.avatar)}</span></div>
          <div class="seat-name">${escapeHTML(p.name)}${offline}${bot}</div>
          <div class="score-box">
            <div class="score-item"><span class="score-label">当前</span><span class="score-value">${p.round || 0}</span></div>
            <div class="score-divider"></div>
            <div class="score-item"><span class="score-label">总分</span><span class="score-value">${p.total || 0}</span></div>
          </div>
        `;
      }
    }

    function renderOpponentHands() {
      renderFanBacks(el.opHands[2], state.players[2]?.handCount || 0, "north");
      renderFanBacks(el.opHands[1], state.players[1]?.handCount || 0, "west");
      renderFanBacks(el.opHands[3], state.players[3]?.handCount || 0, "east");
    }

    function isPortraitNarrow() {
      return !state.forceLandscape && window.innerWidth <= 620 && window.innerHeight > window.innerWidth;
    }

    function isCompactLandscape() {
      return state.forceLandscape || (window.innerWidth > window.innerHeight && window.innerHeight <= 560);
    }

    function renderFanBacks(container, count, position) {
      if (!container) return;
      container.innerHTML = "";
      if (!count) return;

      const portrait = isPortraitNarrow();
      const compactLandscape = isCompactLandscape();
      const small = window.innerWidth <= 900;
      const cardW = portrait ? 32 : (compactLandscape ? 39 : (small ? 39 : 51));
      const cardH = portrait ? 47 : (compactLandscape ? 56 : (small ? 58 : 75));
      const frag = document.createDocumentFragment();

      for (let i = 0; i < count; i++) {
        const c = document.createElement("div");
        c.className = "card-back";
        c.style.width = cardW + "px";
        c.style.height = cardH + "px";

        const mid = (count - 1) / 2;
        if (position === "north") {
          const spread = portrait ? 14 : (compactLandscape ? 17 : (small ? 20 : 24));
          const angle = (i - mid) * (portrait ? 3.4 : (compactLandscape ? 3.2 : 4.3));
          const curve = Math.abs(i - mid) * (portrait ? 1.2 : (compactLandscape ? 1.4 : 2.2));
          const left = container.clientWidth / 2 + (i - mid) * spread - cardW / 2;
          const top = portrait ? 62 + curve : (compactLandscape ? 46 + curve : 80 + curve);
          c.style.left = left + "px";
          c.style.top = top + "px";
          c.style.setProperty("--rot", angle + "deg");
          c.style.setProperty("--deal-delay", `${(i * 4 + 2) * 26}ms`);
          c.style.setProperty("--deal-x", "0px");
          c.style.setProperty("--deal-y", "210px");
          c.style.transform = "rotate(var(--rot))";
          c.style.zIndex = i;
        } else if (position === "west") {
          const step = portrait ? 10 : (compactLandscape ? 13 : (small ? 15 : 19));
          const angle = portrait ? -72 + (i - mid) * 1.4 : (compactLandscape ? -68 + (i - mid) * 1.7 : -64 + (i - mid) * 2.3);
          c.style.left = (portrait ? 30 : (compactLandscape ? 34 : 45)) + Math.abs(i - mid) * .5 + "px";
          c.style.top = (portrait ? 10 : (compactLandscape ? 8 : 20)) + i * step + "px";
          c.style.setProperty("--rot", angle + "deg");
          c.style.setProperty("--deal-delay", `${(i * 4 + 1) * 26}ms`);
          c.style.setProperty("--deal-x", "190px");
          c.style.setProperty("--deal-y", "20px");
          c.style.transform = "rotate(var(--rot))";
          c.style.zIndex = i;
        } else {
          const step = portrait ? 10 : (compactLandscape ? 13 : (small ? 15 : 19));
          const angle = portrait ? 72 - (i - mid) * 1.4 : (compactLandscape ? 68 - (i - mid) * 1.7 : 64 - (i - mid) * 2.3);
          c.style.right = (portrait ? 30 : (compactLandscape ? 34 : 45)) + Math.abs(i - mid) * .5 + "px";
          c.style.top = (portrait ? 10 : (compactLandscape ? 8 : 20)) + i * step + "px";
          c.style.setProperty("--rot", angle + "deg");
          c.style.setProperty("--deal-delay", `${(i * 4 + 3) * 26}ms`);
          c.style.setProperty("--deal-x", "-190px");
          c.style.setProperty("--deal-y", "20px");
          c.style.transform = "rotate(var(--rot))";
          c.style.zIndex = i;
        }
        frag.appendChild(c);
      }
      container.appendChild(frag);
    }

    function renderHand() {
      const hand = state.players[0]?.hand || [];
      const canPlay = state.phase === "play" && state.currentPlayer === 0 && !state.busy;
      const canPass = state.phase === "pass" && !state.youPassed && !state.passSending;

      el.hand.innerHTML = "";
      const count = hand.length;
      if (!count) return;

      const portrait = isPortraitNarrow();
      const compactLandscape = isCompactLandscape();
      const small = window.innerWidth <= 900;
      const cardW = portrait ? 38 : (compactLandscape ? 46 : (small ? 54 : 78));
      const spread = Math.min(portrait ? 30 : (compactLandscape ? 38 : (small ? 42 : 54)), (el.hand.clientWidth - cardW) / Math.max(1, count - 1));
      const mid = (count - 1) / 2;
      const baseY = portrait ? 26 : (compactLandscape ? 32 : (small ? 48 : 58));
      const frag = document.createDocumentFragment();

      hand.forEach((card, i) => {
        const suit = SUITS[card.suit];
        const visualClass = cardVisualClass(card);
        const selected = state.selectedPass.has(card.id);
        const legal = canPlay && state.legalCardIds.has(card.id);
        const illegal = canPlay && !state.legalCardIds.has(card.id);
        const justReceived = state.receivedHighlightIds.has(card.id);
        const passingOut = state.passingCardIds.has(card.id);
        const angle = (i - mid) * (portrait ? 1.8 : (compactLandscape ? 2.8 : (small ? 4.1 : 3.8)));
        const x = el.hand.clientWidth / 2 + (i - mid) * spread - cardW / 2;
        const y = baseY + Math.abs(i - mid) * (portrait ? 1.2 : (compactLandscape ? 1.8 : (small ? 2.3 : 3.2)));

        const div = document.createElement("div");
        div.className = `card ${suit.color} ${visualClass} ${selected ? "selected" : ""} ${legal ? "legal" : ""} ${illegal ? "illegal" : ""} ${justReceived ? "just-received" : ""} ${passingOut ? "passing-out" : ""}`;
        div.dataset.id = card.id;
        div.title = cardName(card);
        div.style.left = x + "px";
        div.style.top = y + "px";
        div.style.setProperty("--rot", angle + "deg");
        div.style.setProperty("--deal-delay", `${i * 4 * 26}ms`);
        div.style.setProperty("--deal-x", "0px");
        div.style.setProperty("--deal-y", "-230px");
        const passOutVector = getPassMotionVector(state.passMode, "out");
        const passInVector = getPassMotionVector(state.passMode, "in");
        div.style.setProperty("--pass-x", passOutVector.x);
        div.style.setProperty("--pass-y", passOutVector.y);
        div.style.setProperty("--receive-x", passInVector.x);
        div.style.setProperty("--receive-y", passInVector.y);
        div.style.zIndex = String(20 + i);
        div.style.cursor = canPlay || canPass ? "pointer" : "default";
        div.innerHTML = `
          <div class="card-corner">${rankText(card.rank)}<br>${suit.symbol}</div>
          <div class="card-pip">${suit.symbol}</div>
          <div class="card-corner bottom">${rankText(card.rank)}<br>${suit.symbol}</div>
        `;
        frag.appendChild(div);
      });

      el.hand.appendChild(frag);
    }

    function renderTrick() {
      const leadSuit = state.trick[0]?.card?.suit;
      el.trickArea.classList.toggle("judging", state.comparingTrick && state.trick.length === 4);
      el.trickArea.classList.toggle("collecting", state.collectingTrick && state.trick.length === 4);

      const leadPlayer = state.trick.length >= 1 ? state.trick[0]?.player : null;
      const showLeadGlow = state.phase === "play" && state.currentPlayer === 0 && !state.busy && leadPlayer != null && state.trick.length < 4 && !state.comparingTrick && !state.collectingTrick;
      for (let i = 0; i < el.slots.length; i++) {
        const slot = el.slots[i];
        slot.classList.remove("compare-candidate", "compare-winner", "compare-loser", "new-card", "lead-glow");
        slot.style.setProperty("--play-x", i === 1 ? "-190px" : i === 3 ? "190px" : "0px");
        slot.style.setProperty("--play-y", i === 0 ? "180px" : i === 2 ? "-180px" : "0px");
        const play = state.trick.find(item => item.player === i);
        if (!play) {
          slot.innerHTML = "";
          slot.dataset.cardKey = "";
          state.lastRenderedTrickKeys[i] = "";
          continue;
        }
        const cardKey = `${play.player}:${play.card.id}`;
        if (slot.dataset.cardKey !== cardKey) {
          const isFirstPlay = state.trick[0]?.player === i && state.trick.length >= 1;
          const leadLabel = isFirstPlay ? '<span class="lead-tag">首出</span>' : '';
          slot.innerHTML = leadLabel + cardHTML(play.card, true);
          slot.dataset.cardKey = cardKey;
          slot.classList.add("new-card");
          state.lastRenderedTrickKeys[i] = cardKey;
        }
        if (state.comparingTrick && state.trick.length === 4) {
          if (play.player === state.trickWinnerPlayer) slot.classList.add("compare-winner");
        }
        if (showLeadGlow && i === leadPlayer) {
          slot.classList.add("lead-glow");
        }
      }

      let bubble = el.trickArea.querySelector(".judge-bubble");
      if (!bubble) {
        bubble = document.createElement("div");
        bubble.className = "judge-bubble";
        el.trickArea.appendChild(bubble);
      }
      bubble.textContent = state.judgeText || "";
      bubble.classList.toggle("hidden", !state.judgeText);
      updateCollectVectors();
    }

    function updateCollectVectors() {
      const resetCollectStyles = () => {
        el.slots.forEach(slot => {
          slot.style.zIndex = "";
          const card = slot.querySelector(".card");
          if (!card) return;
          ["--gather-x", "--gather-y", "--mid-x", "--mid-y", "--collect-x", "--collect-y", "--collect-duration", "--collect-rot", "--stack-rot", "--collect-delay"].forEach(name => card.style.removeProperty(name));
        });
      };

      if (!state.collectingTrick || state.trick.length !== 4 || state.trickWinnerPlayer == null) {
        resetCollectStyles();
        return;
      }

      requestAnimationFrame(() => {
        const winnerSlot = el.slots[state.trickWinnerPlayer];
        const winnerCard = winnerSlot?.querySelector(".card");
        const winnerRect = (winnerCard || winnerSlot)?.getBoundingClientRect();
        const target = screenDirectionTarget(state.trickWinnerPlayer, 92);
        if (!winnerRect || !target) return;

        const wx = winnerRect.left + winnerRect.width / 2;
        const wy = winnerRect.top + winnerRect.height / 2;
        const playOrder = state.trick.map(item => item.player);
        const loserOrder = playOrder.filter(player => player !== state.trickWinnerPlayer);

        el.slots.forEach((slot, index) => {
          const card = slot.querySelector(".card");
          if (!card) return;
          const rect = card.getBoundingClientRect();
          const sx = rect.left + rect.width / 2;
          const sy = rect.top + rect.height / 2;
          const isWinner = index === state.trickWinnerPlayer;
          const loserIndex = Math.max(0, loserOrder.indexOf(index));
          const stackOffsetX = isWinner ? 0 : [-6, 0, 6][loserIndex % 3];
          const stackOffsetY = isWinner ? 0 : 7 + loserIndex * 4;
          const gatherX = Math.round(wx - sx + stackOffsetX);
          const gatherY = Math.round(wy - sy + stackOffsetY);
          const finalX = Math.round(target.x - sx + stackOffsetX);
          const finalY = Math.round(target.y - sy + stackOffsetY);
          const midX = Math.round(gatherX + (finalX - gatherX) * .58);
          const midY = Math.round(gatherY + (finalY - gatherY) * .58);
          const travel = Math.hypot(finalX - gatherX, finalY - gatherY);
          const duration = Math.max(1.42, Math.min(2.08, 1.10 + travel / 1250));

          slot.style.zIndex = isWinner ? "34" : String(20 - loserIndex);
          card.style.setProperty("--gather-x", `${gatherX}px`);
          card.style.setProperty("--gather-y", `${gatherY}px`);
          card.style.setProperty("--mid-x", `${midX}px`);
          card.style.setProperty("--mid-y", `${midY}px`);
          card.style.setProperty("--collect-x", `${finalX}px`);
          card.style.setProperty("--collect-y", `${finalY}px`);
          card.style.setProperty("--collect-duration", `${duration.toFixed(2)}s`);
          card.style.setProperty("--stack-rot", isWinner ? "0deg" : `${[-5, 2, 6][loserIndex % 3]}deg`);
          card.style.setProperty("--collect-rot", isWinner ? "0deg" : `${[-7, 3, 8][loserIndex % 3]}deg`);
          card.style.setProperty("--collect-delay", "0ms");
        });
      });
    }

    function renderTurnArc() {
      if (!el.turnArc) return;
      const shouldShow = state.phase === "play" && state.currentPlayer != null;
      if (!shouldShow) {
        el.turnArc.className = "center-turn-arc hidden";
        el.turnArc.innerHTML = "";
        return;
      }
      el.turnArc.className = "center-turn-arc";
      const size = 420;
      const cx = size / 2;
      const cy = size / 2;
      const r = 162;
      const sweep = 72;
      const angleMap = { 0: 180, 1: 270, 2: 0, 3: 90 };
      const centerDeg = angleMap[state.currentPlayer] ?? 90;
      const startDeg = centerDeg - sweep / 2;
      const endDeg = centerDeg + sweep / 2;

      const polar = deg => {
        const rad = (deg - 90) * Math.PI / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
      };
      const p1 = polar(startDeg);
      const p2 = polar(endDeg);
      const arcPath = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      const fanPath = `M ${cx} ${cy} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Z`;
      el.turnArc.innerHTML = `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
        <defs>
          <radialGradient id="turnArcFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff3a6" stop-opacity="0.40"></stop>
            <stop offset="52%" stop-color="#f0bf25" stop-opacity="0.22"></stop>
            <stop offset="100%" stop-color="#f0bf25" stop-opacity="0"></stop>
          </radialGradient>
        </defs>
        <circle class="ring-base" cx="${cx}" cy="${cy}" r="${r}"></circle>
        ${state.currentPlayer === 0 && !state.comparingTrick && !state.collectingTrick ? `<circle class="self-wave-ring wave-one" cx="${cx}" cy="${cy}" r="${r + 8}"></circle><circle class="self-wave-ring wave-two" cx="${cx}" cy="${cy}" r="${r + 8}"></circle>` : ""}
        <path class="fan-fill" d="${fanPath}"></path>
        <path class="fan-arc" d="${arcPath}"></path>
      </svg>`;
    }

    function renderTurnPointer() {
      if (!el.turnPointer) return;
      el.turnPointer.className = "center-turn-pointer hidden";
      el.turnPointer.innerHTML = "";
    }

    function renderCenter() {
      el.roundTitle.textContent = state.roomId ? `第${state.roundNo}局` : "联机大厅";
      el.passCounter.textContent = "";
      el.centerBtn.style.display = "inline-block";
      el.centerBtn.disabled = false;
      try {
        if (el.viewRoundTableBtn) {
          const canViewTable = Boolean(state.roundTable && ["roundEnd", "gameEnd"].includes(state.phase));
          el.viewRoundTableBtn.classList.toggle("hidden", !canViewTable);
          el.viewRoundTableBtn.style.setProperty("--screen-rot", isForcedLandscapeFlightMode() ? "90deg" : "0deg");
        }
        if (el.lastTrickBtn) {
          const canViewLast = Boolean(state.lastTrick && state.lastTrick.cards?.length && state.phase === "play" && state.currentPlayer === 0 && !state.busy && !state.comparingTrick && !state.collectingTrick);
          el.lastTrickBtn.classList.toggle("hidden", !canViewLast);
          el.lastTrickBtn.style.setProperty("--screen-rot", isForcedLandscapeFlightMode() ? "90deg" : "0deg");
          if (!canViewLast) closeLastTrickPopover();
        }
        positionTableActionButtons();
      } catch (_) {}

      if (!state.connected) {
        el.message.textContent = "正在连接联机服务端……";
        el.centerBtn.style.display = "none";
      } else if (!state.roomId || state.phase === "offline") {
        el.message.textContent = "创建房间或输入房间号加入。";
        el.centerBtn.textContent = "房间";
      } else if (state.phase === "lobby") {
        el.message.textContent = `房间 ${state.roomId}，等待玩家加入。`;
        el.centerBtn.textContent = "房间";
      } else if (state.phase === "deal") {
        el.message.textContent = "正在发牌……";
        el.centerBtn.style.display = "none";
      } else if (state.phase === "pass") {
        el.message.textContent = state.youPassed ? "你已完成传牌，等待其他玩家。" : PASS_HINTS[state.passMode];
        el.centerBtn.textContent = state.passSending ? "传递中" : (state.youPassed ? "等待中" : "传递");
        el.centerBtn.disabled = state.passSending || state.youPassed || state.selectedPass.size !== 3;
        el.passCounter.textContent = state.passSending ? "传牌中" : (state.youPassed ? "已传牌" : `已选择 ${state.selectedPass.size}/3 张`);
      } else if (state.phase === "play") {
        el.centerBtn.style.display = "none";
        if (state.comparingTrick) el.message.textContent = "正在比牌收墩……";
        else if (state.currentPlayer === 0 && !state.busy) el.message.textContent = `轮到你出牌。${state.heartsBroken ? "红桃已破。" : "红桃尚未破。"}`;
        else el.message.textContent = `等待 ${state.players[state.currentPlayer]?.name || "其他玩家"} 出牌……`;
      } else if (state.phase === "roundEnd") {
        el.message.textContent = "本局结束，点击开始下一局继续。";
        el.centerBtn.textContent = "开始下一局";
      } else if (state.phase === "gameEnd") {
        el.message.textContent = "游戏结束，点击查看成绩。";
        el.centerBtn.textContent = "成绩";
      } else {
        el.message.textContent = "等待联机状态同步……";
        el.centerBtn.style.display = "none";
      }
      maybeShowRoundEndLandscapeTip();
    }


    function maybeShowYourTurnReminder() {
      if (!el.yourTurnReminder) return;
      const shouldShow = state.phase === "play" && state.currentPlayer === 0 && !state.busy && !state.comparingTrick && !state.collectingTrick;
      if (!shouldShow) {
        el.yourTurnReminder.classList.add("hidden");
        return;
      }
      const key = `${state.roomId}:${state.roundNo}:${state.trickNo}:${state.trick.length}:${state.legalCardIds.size}`;
      if (key === state.lastYourTurnReminderKey) return;
      state.lastYourTurnReminderKey = key;
      ensureViewportAnimationLayers();
      el.yourTurnReminder.classList.remove("hidden");
      el.yourTurnReminder.style.setProperty("--screen-rot", isForcedLandscapeFlightMode() ? "90deg" : "0deg");
      el.yourTurnReminder.style.animation = "none";
      void el.yourTurnReminder.offsetWidth;
      el.yourTurnReminder.style.removeProperty("animation");
      clearTimeout(maybeShowYourTurnReminder.timer);
      maybeShowYourTurnReminder.timer = setTimeout(() => el.yourTurnReminder?.classList.add("hidden"), 1900);
      playTone(760, .08, "sine", .025);
      setTimeout(() => playTone(980, .09, "sine", .022), 90);
    }

    function maybeShowRoundEndLandscapeTip() {
      const shouldShow = (state.phase === "roundEnd" || state.phase === "gameEnd") && !state.forceLandscape && isPortraitScreen();
      if (!shouldShow) return;
      const key = `${state.roomId}:${state.roundNo}:${state.phase}`;
      if (state.lastRoundEndLandscapeTipKey === key) return;
      state.lastRoundEndLandscapeTipKey = key;
      setTimeout(() => {
        if (!state.forceLandscape && isPortraitScreen()) {
          showActionToast("建议点击右上角“横屏”，下局手牌、互动和牌桌回看会更清楚。", 4200);
        }
      }, 560);
    }

    function classifyLogText(text) {
      const value = String(text || "");
      if (value.includes(" 出 ")) return "出牌";
      if (value.includes("收墩") || value.includes("收下本墩")) return "收墩";
      if (value.includes("传牌")) return "传牌";
      if (value.includes("发牌")) return "发牌";
      if (value.includes("加入") || value.includes("创建") || value.includes("连接") || value.includes("退出") || value.includes("断开") || value.includes("房间")) return "房间";
      if (value.includes("打满贯") || value.includes("游戏结束") || value.includes("局结束")) return "结算";
      if (value.includes("AI")) return "AI";
      return "记录";
    }

    function logTypeClass(type) {
      return ({
        "出牌": "log-play",
        "收墩": "log-trick",
        "传牌": "log-pass",
        "发牌": "log-deal",
        "房间": "log-room",
        "结算": "log-score",
        "AI": "log-ai"
      })[type] || "log-note";
    }

    function simplifyLogText(text) {
      return String(text || "")
        .replace(/^第\s*(\d+)\s*局发牌：/, "第$1局 · 发牌：")
        .replace(/^第\s*(\d+)\s*墩：/, "第$1墩 · ")
        .replace(/收下本墩/g, "收墩")
        .replace(/。$/g, "");
    }

    function renderLogButton() {
      if (el.openLogBtn) el.openLogBtn.textContent = state.log.length ? `日志 ${state.log.length}` : "日志";
    }

    function renderLogList() {
      renderLogButton();
      if (!state.log.length) {
        el.logSummary.textContent = "暂无出牌记录。";
        el.logList.innerHTML = `
          <table class="log-table">
            <thead><tr><th>局数</th><th>类型</th><th>内容</th></tr></thead>
            <tbody><tr><td class="log-round">-</td><td><span class="log-type">-</span></td><td class="log-detail">暂无记录</td></tr></tbody>
          </table>`;
        return;
      }
      const counts = {};
      state.log.forEach(item => { const t = classifyLogText(item.text); counts[t] = (counts[t] || 0) + 1; });
      const summaryParts = Object.entries(counts).slice(0, 4).map(([t, c]) => `${t}×${c}`).join(" · ");
      el.logSummary.textContent = `${state.log.length} 条 · ${summaryParts}`;
      el.logList.innerHTML = `
        <table class="log-table">
          <thead>
            <tr><th>局</th><th>类型</th><th>内容</th></tr>
          </thead>
          <tbody>
            ${state.log.slice().reverse().map(item => {
              const type = classifyLogText(item.text);
              const typeClass = logTypeClass(type);
              return `
                <tr>
                  <td class="log-round">${escapeHTML(item.round)}</td>
                  <td><span class="log-type ${typeClass}">${escapeHTML(type)}</span></td>
                  <td class="log-detail" title="${escapeHTML(item.text)}">${escapeHTML(simplifyLogText(item.text))}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>`;
    }

    function lastTrickMiniCardHTML(card) {
      if (!card || !SUITS[card.suit]) return `<div class="last-trick-card">?</div>`;
      const suit = SUITS[card.suit];
      const red = suit.color === "red" ? "red" : "";
      return `<div class="last-trick-card ${red}">${escapeHTML(rankText(card.rank))}<br>${suit.symbol}</div>`;
    }

    function relationLabelForView(viewIndex) {
      if (viewIndex === 0) return "本家 / 自己";
      if (viewIndex === 1) return "上家";
      if (viewIndex === 2) return "对家";
      if (viewIndex === 3) return "下家";
      return "玩家";
    }

    function orderedLastTrickCards(last) {
      const cards = Array.isArray(last?.cards) ? [...last.cards] : [];
      const leader = last?.leaderPlayer == null ? cards[0]?.player : last.leaderPlayer;
      const idx = cards.findIndex(play => play.player === leader);
      if (idx <= 0) return cards;
      return [...cards.slice(idx), ...cards.slice(0, idx)];
    }

    function openLastTrickPopover() {
      const last = state.lastTrick;
      if (!last || !Array.isArray(last.cards) || !last.cards.length || !el.lastTrickPopover) return showActionToast("暂无上一轮出牌记录。");
      ensureViewportAnimationLayers();
      const points = Number(last.points || 0);
      const winnerName = state.players[last.winnerPlayer]?.name || "玩家";
      const orderedCards = orderedLastTrickCards(last);
      el.lastTrickPopover.style.setProperty("--screen-rot", isForcedLandscapeFlightMode() ? "90deg" : "0deg");
      el.lastTrickPopover.innerHTML = `
        <div class="last-trick-title"><span>上一墩</span><button class="last-trick-close" type="button" data-close-last-trick>×</button></div>
        <div class="last-trick-grid">
          ${orderedCards.map(play => {
            const isLeader = play.player === last.leaderPlayer;
            const isWinner = play.player === last.winnerPlayer;
            const relation = relationLabelForView(play.player);
            const meta = isWinner ? `${relation} · ${points}分` : relation;
            return `<div class="last-trick-cell ${isWinner ? "is-winner" : ""} ${isLeader ? "is-leader" : ""}">
              <div class="last-trick-name">${escapeHTML(state.players[play.player]?.name || "?")}${isLeader ? `<span class="last-trick-lead-badge">首出</span>` : ""}</div>
              <div class="last-trick-card-row">${lastTrickMiniCardHTML(play.card)}</div>
              <div class="last-trick-meta">${escapeHTML(meta)}</div>
            </div>`;
          }).join("")}
        </div>
        <div class="last-trick-summary">${escapeHTML(winnerName)} 收墩 · ${points} 分</div>
      `;
      el.lastTrickPopover.classList.remove("hidden");
      el.lastTrickPopover.setAttribute("aria-hidden", "false");
    }

    function closeLastTrickPopover() {
      if (!el.lastTrickPopover) return;
      el.lastTrickPopover.classList.add("hidden");
      el.lastTrickPopover.setAttribute("aria-hidden", "true");
    }

    function renderVersionLogList() {
      if (!el.versionLogList) return;
      el.versionLogList.innerHTML = VERSION_LOGS.map(item => `
        <div class="version-log-item">
          <h3>${escapeHTML(item.version)}</h3>
          <ul>${(item.items || []).map(line => `<li>${escapeHTML(line)}</li>`).join("")}</ul>
        </div>
      `).join("");
    }

    function render() {
      if (el.scene) el.scene.classList.toggle("dealing", state.phase === "deal");
      renderSeats();
      renderOpponentHands();
      renderTrick();
      renderHand();
      renderCenter();
      renderTurnArc();
      renderTurnPointer();
      renderLogButton();
      updateSystemButtons();
      updateConnectionNotice();
      updateThemeAndSoundButtons();
      maybeShowYourTurnReminder();
    }

    function showResultModal() {
      const minScore = Math.min(...state.players.map(player => player.total || 0));
      const winners = state.players.filter(player => (player.total || 0) === minScore).map(player => player.name).join("、");
      el.resultTitle.textContent = `${winners} 获胜！`;
      el.resultSubtitle.textContent = "本局战绩已结算，低分玩家获胜。";
      if (el.playAgainBtn) {
        el.playAgainBtn.classList.toggle("hidden", !state.isHost);
        el.playAgainBtn.disabled = !state.isHost;
      }
      const ranked = state.players
        .map((player, index) => ({ player, index, total: Number(player.total || 0), round: Number(player.round || 0) }))
        .sort((a, b) => a.total - b.total || a.round - b.round || a.index - b.index);
      el.resultScoreTable.innerHTML = `
        ${ranked.map((item, rankIndex) => `
          <div class="result-player-card ${item.total === minScore ? "is-winner" : ""}">
            <div class="result-rank-medal">${rankIndex === 0 ? "🏆" : rankIndex + 1}</div>
            <div class="result-player-main">
              <div class="result-player-name">${escapeHTML(item.player.name)}</div>
              <div class="result-player-sub">${escapeHTML(item.player.avatar || "")}${item.player.isBot ? " · AI 玩家" : " · 真人玩家"}</div>
            </div>
            <div class="result-score-pill"><span>本局</span><strong>${item.round}</strong></div>
            <div class="result-score-pill total"><span>总分</span><strong>${item.total}</strong></div>
            <div class="result-badge-wrap">${item.total === minScore ? `<span class="result-badge">胜利</span>` : `<span class="result-keep-going">继续加油</span>`}</div>
          </div>
        `).join("")}
      `;
      el.resultModal.classList.remove("hidden");
    }

    function roundCardMiniHTML(card, receivedSet = new Set()) {
      if (!card || !SUITS[card.suit]) return "";
      const suit = SUITS[card.suit];
      const red = suit.color === "red" ? "red" : "";
      const received = receivedSet.has(card.id) ? "received" : "";
      return `<span class="round-mini-card ${red} ${received}" title="${escapeHTML(cardName(card))}">${escapeHTML(rankText(card.rank))}<br>${suit.symbol}</span>`;
    }

    function renderRoundTableModal() {
      const table = state.roundTable;
      if (!table || !el.roundTableView) {
        showActionToast("当前还没有可查看的牌桌记录。");
        return false;
      }
      const rows = Array.isArray(table.players) ? table.players : [];
      if (el.roundTableTitle) el.roundTableTitle.textContent = `第 ${table.roundNo || state.roundNo} 局`;
      if (el.roundTableSubtitle) el.roundTableSubtitle.textContent = `${table.passName || PASS_NAMES[table.passMode] || "传牌"} · 金色描边为换入牌`;
      el.roundTableView.innerHTML = `
        <thead><tr><th>玩家</th><th>手牌</th><th>传牌</th></tr></thead>
        <tbody>
          ${rows.map(row => {
            const receivedSet = new Set((row.receivedCards || []).map(card => card.id));
            const cards = (row.cards || []).map(card => roundCardMiniHTML(card, receivedSet)).join("");
            const passedCards = (row.passedCards || []).map(card => roundCardMiniHTML(card)).join("");
            const passText = row.passedTo ? `${escapeHTML(row.passedTo)}` : "不传";
            return `<tr>
              <td class="round-player-cell"><div class="round-player-avatar">${escapeHTML(row.avatar || "?")}</div><div><div class="round-player-name">${escapeHTML(row.name || "?")}</div><div class="round-player-meta">${Number(row.round || 0)}分 · 总${Number(row.total || 0)}</div></div></td>
              <td><div class="round-card-strip">${cards || `<span class="round-pass-muted">-</span>`}</div></td>
              <td><div class="round-pass-info"><span class="round-pass-pill">→ ${passText}</span></div><div class="round-card-strip pass-cards">${passedCards || `<span class="round-pass-muted">-</span>`}</div></td>
            </tr>`;
          }).join("")}
        </tbody>
      `;
      return true;
    }

    function openRoundTableModal() {
      if (!renderRoundTableModal()) return;
      ensureViewportAnimationLayers();
      el.resultModal?.classList.add("hidden");
      el.roundTableModal?.classList.remove("hidden");
      requestAnimationFrame(() => {
        const wrap = el.roundTableModal?.querySelector(".round-table-wrap");
        const card = el.roundTableModal?.querySelector(".round-table-card");
        if (wrap) { wrap.scrollTop = 0; wrap.scrollLeft = 0; }
        if (card) card.scrollTop = 0;
      });
    }

    function hideAllModals() {
      el.resultModal.classList.add("hidden");
      el.logModal.classList.add("hidden");
      el.rulesModal.classList.add("hidden");
      if (el.roomModal) el.roomModal.classList.add("hidden");
      if (el.roundTableModal) el.roundTableModal.classList.add("hidden");
    }

    function toggleSelectCard(cardId) {
      if (state.selectedPass.has(cardId)) {
        state.selectedPass.delete(cardId);
      } else if (state.selectedPass.size < 3) {
        state.selectedPass.add(cardId);
      }
      renderHand();
      renderCenter();
    }


    function setRoomPanelMode(mode) {
      state.roomPanelMode = mode || "choice";
      const hasRoom = Boolean(state.roomId);
      const modeToUse = hasRoom ? "status" : state.roomPanelMode;

      if (el.roomChoicePanel) el.roomChoicePanel.classList.toggle("hidden", modeToUse !== "choice");
      if (el.roomActionPanel) el.roomActionPanel.classList.toggle("hidden", !["create", "join"].includes(modeToUse));
      if (el.roomIdField) el.roomIdField.classList.toggle("hidden", modeToUse !== "join");
      if (el.createRoomBtn) el.createRoomBtn.classList.toggle("hidden", modeToUse !== "create");
      if (el.joinRoomBtn) el.joinRoomBtn.classList.toggle("hidden", modeToUse !== "join");
      if (el.backRoomChoiceBtn) el.backRoomChoiceBtn.classList.toggle("hidden", hasRoom);
      if (el.copyRoomBtn) el.copyRoomBtn.classList.toggle("hidden", !hasRoom);
      if (el.copyRoomTitleBtn) el.copyRoomTitleBtn.classList.toggle("hidden", !hasRoom);

      if (el.roomTitle) {
        if (hasRoom) el.roomTitle.textContent = `房间号 ${state.roomId}`;
        else if (modeToUse === "create") el.roomTitle.textContent = "创建房间";
        else if (modeToUse === "join") el.roomTitle.textContent = "加入房间";
        else el.roomTitle.textContent = "联机房间";
      }

      if (el.roomSubtitle) {
        if (hasRoom) el.roomSubtitle.textContent = state.isHost ? "满 4 人会自动开始，人数不足可 AI 补位，也可以解散房间。" : "等待房主开始；你可以主动退出房间，之后仍可用房间号重新加入。";
        else if (modeToUse === "create") el.roomSubtitle.textContent = "填写昵称后创建房间，系统会生成 4 位纯数字房间号。";
        else if (modeToUse === "join") el.roomSubtitle.textContent = "填写昵称，并输入好友给你的 4 位纯数字房间号。";
        else el.roomSubtitle.textContent = "请选择创建房间或加入房间。";
      }
    }

    function openRoomModal(mode = null) {
      if (!state.roomId) setRoomPanelMode(mode || "choice");
      else setRoomPanelMode("status");
      updateRoomPanel();
      el.roomModal?.classList.remove("hidden");
    }

    function randomRomanceName(exclude = "") {
      const pool = ROMANCE_NAMES.filter(name => name !== exclude);
      const list = pool.length ? pool : ROMANCE_NAMES;
      return list[Math.floor(Math.random() * list.length)];
    }

    function ensureNicknameSeed(forceNew = false) {
      const current = (el.nicknameInput?.value || "").trim();
      const stored = (localStorage.getItem(NICKNAME_KEY) || "").trim();
      const fallback = forceNew ? "" : (current || stored);
      let nickname = limitNickname(fallback);
      if (!nickname || nickname === "玩家" || nickname === "房主") nickname = randomRomanceName();
      nickname = limitNickname(nickname);
      if (el.nicknameInput) el.nicknameInput.value = nickname;
      localStorage.setItem(NICKNAME_KEY, nickname);
      return nickname;
    }

    function rerollNickname() {
      const current = (el.nicknameInput?.value || localStorage.getItem(NICKNAME_KEY) || "").trim();
      const nickname = limitNickname(randomRomanceName(current));
      if (el.nicknameInput) el.nicknameInput.value = nickname;
      localStorage.setItem(NICKNAME_KEY, nickname);
      showActionToast(`已随机为：${nickname}`);
      return nickname;
    }

    function getNickname() {
      const nickname = limitNickname(el.nicknameInput?.value || "") || ensureNicknameSeed();
      if (el.nicknameInput) el.nicknameInput.value = nickname;
      localStorage.setItem(NICKNAME_KEY, nickname);
      return nickname;
    }

    function createRoom() {
      sendMsg({ type: "createRoom", nickname: getNickname() });
    }

    function joinRoom() {
      const roomId = (el.roomIdInput?.value || "").replace(/\D/g, "").slice(0, 4);
      if (el.roomIdInput) el.roomIdInput.value = roomId;
      if (roomId.length !== 4) return showActionToast("请输入 4 位数字房间号。");
      localStorage.setItem(NICKNAME_KEY, getNickname());
      sendMsg({ type: "joinRoom", roomId, nickname: getNickname() });
    }

    function updateRoomPanel() {
      ensureNicknameSeed();
      if (el.roomIdInput && state.roomId) el.roomIdInput.value = state.roomId;
      setRoomPanelMode(state.roomId ? "status" : state.roomPanelMode);

      const hasRoom = Boolean(state.roomId);
      if (el.roomStatus) {
        el.roomStatus.classList.toggle("hidden", !hasRoom);
        if (hasRoom) {
          const host = state.serverPlayers.find(player => player.id === state.hostId) || state.serverPlayers[0] || { name: "未知" };
          el.roomStatus.innerHTML = `
            <span class="room-status-left">服务端：<span class="service-state ${state.connected ? "online" : "offline"}">${state.connected ? "已连接" : "未连接"}</span></span>
            <span class="room-status-right">当前房主：<strong class="room-host-inline">${escapeHTML(host.name)}</strong></span>
          `;
        } else {
          el.roomStatus.innerHTML = "";
        }
      }

      if (el.roomPlayers) {
        el.roomPlayers.classList.toggle("hidden", !hasRoom);
        if (hasRoom) {
          const players = state.serverPlayers.length ? state.serverPlayers : [];
          el.roomPlayers.innerHTML = players.length ? players.map((player, index) => {
            const status = player.aiControlled
              ? `<span class="room-player-state offline">离线 · AI托管中</span>`
              : (player.isBot
                  ? "在线"
                  : (player.leftRoom ? `<span class="room-player-state offline">已退出</span>` : (player.connected ? "在线" : `<span class="room-player-state offline">离线</span>`)));
            const isHostPlayer = player.id === state.hostId;
            const factionClass = (player.isBot && !player.aiControlled) ? (player.avatar === "魏" ? "bot-wei" : (player.avatar === "蜀" ? "bot-shu" : (player.avatar === "吴" ? "bot-wu" : ""))) : "";
            const botBadge = player.isBot ? (player.aiControlled ? `<span class="room-player-bot managed">AI托管</span>` : `<span class="room-player-bot ${factionClass}">${escapeHTML(player.avatar)} AI</span>`) : "";
            const hostBadge = isHostPlayer ? `<span class="host-badge">👑 房主</span>` : "";
            const canRequestTakeover = !state.isHost && player.isBot && hasRoom && state.connected && !state.pendingTakeover;
            const requestBtn = canRequestTakeover ? `<button class="takeover-request-btn" data-bot-index="${index}" type="button">请求接管</button>` : "";
            return `
              <div class="room-player ${isHostPlayer ? "host-player" : ""}">
                <span class="room-player-main"><span>${index + 1}. ${escapeHTML(player.name)}</span>${hostBadge}${botBadge}</span>
                <span class="room-player-status">${player.passed ? `<span class="pass-ready-pill">已传牌</span>` : ""}${status}${requestBtn}</span>
              </div>
            `;
          }).join("") : `<div class="room-player"><span>等待玩家</span><span>可邀请好友加入</span></div>`;
        } else {
          el.roomPlayers.innerHTML = "";
        }
      }

      const inLobby = state.roomId && state.phase === "lobby";
      const hasLeftHumans = state.serverPlayers.some(player => !player.isBot && player.leftRoom);
      const hasOfflineHumans = state.serverPlayers.some(player => !player.isBot && !player.connected && !player.leftRoom);
      const canShowHostControls = Boolean(hasRoom && state.isHost && state.phase !== "gameEnd");
      if (el.startGameBtn) {
        el.startGameBtn.classList.add("hidden");
        el.startGameBtn.disabled = true;
      }
      if (el.fillBotsBtn) {
        const showFill = canShowHostControls && ((inLobby && state.serverPlayers.length < 4) || hasLeftHumans);
        el.fillBotsBtn.textContent = hasLeftHumans ? "AI补位" : "AI补位开始";
        el.fillBotsBtn.classList.toggle("hidden", !showFill);
        el.fillBotsBtn.disabled = !(state.connected && showFill);
      }
      if (el.takeoverBotsBtn) {
        const showTakeover = canShowHostControls && hasOfflineHumans;
        el.takeoverBotsBtn.classList.toggle("hidden", !showTakeover);
        el.takeoverBotsBtn.disabled = !(state.connected && showTakeover);
      }
      if (el.leaveRoomBtn) {
        el.leaveRoomBtn.classList.toggle("hidden", !hasRoom);
        el.leaveRoomBtn.disabled = !(state.connected && state.roomId);
      }
      if (el.disbandRoomBtn) {
        el.disbandRoomBtn.classList.toggle("hidden", !(hasRoom && state.isHost));
        el.disbandRoomBtn.disabled = !(state.connected && state.roomId && state.isHost);
      }
      if (el.copyRoomBtn) el.copyRoomBtn.disabled = !state.roomId;
      if (el.copyRoomTitleBtn) el.copyRoomTitleBtn.disabled = !state.roomId;
      updateSystemButtons();
      updateConnectionNotice();
    }

    function copyRoomId() {
      if (!state.roomId) return;
      const text = state.roomId;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => showActionToast("房间号已复制。"));
      } else {
        showActionToast(`房间号：${text}`);
      }
    }

    function disbandRoom() {
      if (!state.roomId || !state.isHost) return showActionToast("只有房主可以解散房间。");
      const ok = window.confirm(`确定要解散房间 ${state.roomId} 吗？所有玩家都会退出当前牌局。`);
      if (!ok) return;
      sendMsg({ type: "disbandRoom" });
    }

    function leaveRoom() {
      if (!state.roomId) return resetLocalRoomState("已清空本地房间状态。");
      const ok = window.confirm(`确定退出房间 ${state.roomId} 吗？之后可重新输入房间号加入。`);
      if (!ok) return;
      if (!sendMsg({ type: "leaveRoom" })) resetLocalRoomState("已退出本地房间状态，可重新输入房间号加入。");
    }

    function restartGame() {
      if (!state.roomId) return showActionToast("请先创建或加入房间。");
      if (!state.isHost) return showActionToast("只有房主可以发起再来一局。");
      sendMsg({ type: "restartGame" });
      if (el.resultModal) el.resultModal.classList.add("hidden");
    }

    function playerDisplayList(players) {
      return players.map(player => escapeHTML(player.name || "玩家")).join("、");
    }

    function closeAiPrompt() {
      if (el.aiPromptModal) el.aiPromptModal.classList.add("hidden");
      state.aiPromptAction = "";
    }

    function maybeShowAiAssistPrompt() {
      if (!state.roomId || !state.isHost || !el.aiPromptModal || state.phase === "gameEnd") {
        closeAiPrompt();
        return;
      }
      const leftPlayers = state.serverPlayers.filter(player => !player.isBot && player.leftRoom);
      const offlinePlayers = state.serverPlayers.filter(player => !player.isBot && !player.connected && !player.leftRoom);

      let action = "";
      let title = "";
      let subtitle = "";
      let button = "";
      let names = [];

      if (leftPlayers.length) {
        action = "fill";
        names = leftPlayers.map(player => player.name || "玩家");
        title = "有玩家已退出";
        subtitle = `${playerDisplayList(leftPlayers)} 已主动退出房间，可使用 AI 补位接管其当前手牌，避免牌局卡住。`;
        button = "AI补位";
      } else if (offlinePlayers.length) {
        action = "takeover";
        names = offlinePlayers.map(player => player.name || "玩家");
        title = "有玩家已离线";
        subtitle = `${playerDisplayList(offlinePlayers)} 与服务器断开连接，可使用 AI 接管离线座位，后续玩家可用相同昵称重新加入并取代 AI。`;
        button = "AI接管离线";
      }

      if (!action) {
        closeAiPrompt();
        return;
      }
      const key = `${state.roomId}:${state.phase}:${action}:${names.join("|")}`;
      if (state.lastAiPromptKey === key && !el.aiPromptModal.classList.contains("hidden")) return;
      if (state.lastAiPromptKey === key) return;
      state.lastAiPromptKey = key;
      state.aiPromptAction = action;
      if (el.aiPromptTitle) el.aiPromptTitle.textContent = title;
      if (el.aiPromptSubtitle) el.aiPromptSubtitle.innerHTML = subtitle;
      if (el.aiPromptConfirmBtn) el.aiPromptConfirmBtn.textContent = button;
      el.aiPromptModal.classList.remove("hidden");
    }

    function confirmAiPrompt() {
      const action = state.aiPromptAction;
      closeAiPrompt();
      if (action === "fill") sendMsg({ type: "fillBotsAndStart" });
      else if (action === "takeover") sendMsg({ type: "takeoverOffline" });
    }

    function takeoverOfflinePlayers() {
      if (!state.roomId || !state.isHost) return showActionToast("只有房主可以设置 AI 接管。");
      sendMsg({ type: "takeoverOffline" });
    }

    function clearLocalCache() {
      const ok = window.confirm("确定清除本地缓存并刷新页面吗？这会清空本机保存的房间号、玩家标识和横屏设置，可用于解决卡住或进不了游戏的问题。");
      if (!ok) return;
      try { if (socket) socket.close(); } catch (error) { /* ignore */ }
      localStorage.removeItem(CLIENT_ID_KEY);
      localStorage.removeItem(ROOM_ID_KEY);
      localStorage.removeItem(NICKNAME_KEY);
      localStorage.removeItem(FORCE_LANDSCAPE_KEY);
      sessionStorage.removeItem(LANDSCAPE_PROMPT_KEY);
      location.reload();
    }

    el.hand.addEventListener("click", event => {
      const cardEl = event.target.closest(".card");
      if (!cardEl) return;
      const cardId = cardEl.dataset.id;
      const card = state.players[0].hand.find(item => item.id === cardId);
      if (!card) return;

      if (state.phase === "pass") {
        if (state.passSending) return showHandTip("传牌动画进行中，请稍等。");
        if (state.youPassed) return showHandTip("你已经传过牌了，等待其他玩家。");
        toggleSelectCard(cardId);
        return;
      }

      if (state.phase === "play") {
        if (state.currentPlayer !== 0 || state.busy || state.comparingTrick || state.collectingTrick) {
          showHandTip(explainIllegalCard(card));
          return;
        }
        if (!state.legalCardIds.has(cardId)) {
          showHandTip(explainIllegalCard(card));
          return;
        }
        sendMsg({ type: "playCard", cardId });
      }
    });

    el.centerBtn.addEventListener("click", () => {
      if (!state.roomId || state.phase === "lobby" || state.phase === "offline") {
        openRoomModal();
      } else if (state.phase === "pass") {
        submitPassWithAnimation();
      } else if (state.phase === "roundEnd") {
        sendMsg({ type: "startNextRound" });
      } else if (state.phase === "gameEnd") {
        showResultModal();
      }
    });

    el.landscapeBtn.addEventListener("click", toggleLandscapeMode);
    el.fullscreenBtn.addEventListener("click", toggleFullscreenMode);
    el.openRoomBtn?.addEventListener("click", () => openRoomModal());
    el.openSettingsBtn?.addEventListener("click", () => {
      updateThemeAndSoundButtons();
      el.settingsModal?.classList.remove("hidden");
    });
    el.soundBtn?.addEventListener("click", toggleSound);
    el.effectsBtn?.addEventListener("click", toggleEffects);
    el.effectSpeedSelect?.addEventListener("change", e => setEffectSpeed(e.target.value));
    el.soundVolumeRange?.addEventListener("input", e => setSoundVolume(e.target.value));
    el.interactionEffectsBtn?.addEventListener("click", toggleInteractionEffects);
    el.interactionSoundBtn?.addEventListener("click", toggleInteractionSound);
    el.allowTomatoBtn?.addEventListener("click", toggleAllowTomato);
    el.interactionBtn?.addEventListener("click", event => {
      event.stopPropagation();
      showQuickEmojiMenu(event);
    });
    el.interactionMask?.addEventListener("click", closeInteractionPanel);
    el.closeInteractionBtn?.addEventListener("click", closeInteractionPanel);
    el.closeInteractionBottomBtn?.addEventListener("click", closeInteractionPanel);
    el.interactionTargetStrip?.addEventListener("click", event => {
      const btn = event.target.closest("[data-interaction-target]");
      if (!btn) return;
      state.interactionTarget = Number(btn.dataset.interactionTarget || 0);
      renderInteractionPanel();
    });
    el.quickEmojiGrid?.addEventListener("click", event => {
      const btn = event.target.closest("[data-interaction-emoji-index]");
      if (!btn || btn.disabled) return;
      const item = INTERACTION_EMOJIS[Number(btn.dataset.interactionEmojiIndex || 0)] || INTERACTION_EMOJIS[0];
      sendInteraction(item.kind, state.interactionTarget || 0, { itemOverride: item, cooldownKind: item.kind });
    });
    el.interactionToolGrid?.addEventListener("click", event => {
      const btn = event.target.closest("[data-interaction-kind]");
      if (!btn || btn.disabled) return;
      sendInteraction(btn.dataset.interactionKind, state.interactionTarget || 0);
    });
    el.interactionTargetMenu?.addEventListener("click", event => {
      const quickBtn = event.target.closest("[data-quick-emoji-index]");
      if (quickBtn && !quickBtn.disabled) {
        const item = INTERACTION_EMOJIS[Number(quickBtn.dataset.quickEmojiIndex || 0)] || INTERACTION_EMOJIS[0];
        sendInteraction(item.kind, 0, { itemOverride: item, cooldownKind: item.kind, globalCooldown: true });
        return;
      }
      const btn = event.target.closest("[data-target-menu-kind]");
      if (!btn || btn.disabled) return;
      const kind = btn.dataset.targetMenuKind;
      sendInteraction(kind, state.interactionTarget || 0);
    });
    document.addEventListener("click", event => {
      const inInteractionMenu = Boolean(event.target.closest("#interactionTargetMenu"));
      const inAvatar = Boolean(event.target.closest(".seat .avatar"));
      const inInteractionBtn = Boolean(event.target.closest("#interactionBtn"));
      const inLastTrick = Boolean(event.target.closest("#lastTrickPopover"));
      const inLastTrickBtn = Boolean(event.target.closest("#lastTrickBtn"));

      if (el.interactionTargetMenu && !el.interactionTargetMenu.classList.contains("hidden")) {
        if (!inInteractionMenu && !inAvatar && !inInteractionBtn) hideInteractionTargetMenu();
      }
      if (el.lastTrickPopover && !el.lastTrickPopover.classList.contains("hidden")) {
        if (!inLastTrick && !inLastTrickBtn) closeLastTrickPopover();
      }
    });
    el.seats.forEach((seat, viewIndex) => seat?.addEventListener("click", event => {
      const avatar = event.target.closest(".avatar");
      if (!avatar) return;
      event.stopPropagation();
      showInteractionTargetMenu(viewIndex, event);
    }));
    document.querySelectorAll("#clearCacheBtn").forEach(btn => btn.addEventListener("click", clearLocalCache));

    el.chooseCreateRoomBtn?.addEventListener("click", () => setRoomPanelMode("create"));
    el.chooseJoinRoomBtn?.addEventListener("click", () => setRoomPanelMode("join"));
    el.backRoomChoiceBtn?.addEventListener("click", () => setRoomPanelMode("choice"));
    el.nicknameInput?.addEventListener("input", () => {
      const limited = limitNickname(el.nicknameInput.value);
      if (el.nicknameInput.value !== limited) el.nicknameInput.value = limited;
    });
    el.randomNicknameIconBtn?.addEventListener("click", rerollNickname);
    el.createRoomBtn?.addEventListener("click", createRoom);
    el.joinRoomBtn?.addEventListener("click", joinRoom);
    el.startGameBtn?.addEventListener("click", () => sendMsg({ type: "startGame" }));
    el.fillBotsBtn?.addEventListener("click", () => sendMsg({ type: "fillBotsAndStart" }));
    el.copyRoomBtn?.addEventListener("click", copyRoomId);
    el.copyRoomTitleBtn?.addEventListener("click", copyRoomId);
    el.leaveRoomBtn?.addEventListener("click", leaveRoom);
    el.takeoverBotsBtn?.addEventListener("click", takeoverOfflinePlayers);
    el.disbandRoomBtn?.addEventListener("click", disbandRoom);
    el.roomPlayers?.addEventListener("click", (e) => {
      const btn = e.target.closest(".takeover-request-btn");
      if (!btn) return;
      const botIndex = Number(btn.dataset.botIndex);
      if (isNaN(botIndex)) return;
      if (state.pendingTakeover) return showActionToast("已有待处理的接管请求，请等待。");
      if (!confirm(`确定要请求接管该 AI 座位吗？需要房主批准。`)) return;
      sendMsg({ type: "requestTakeover", botIndex });
      state.pendingTakeover = true;
      showActionToast("已发送接管请求，等待房主批准……");
      updateRoomPanel();
    });
    el.roomIdInput?.addEventListener("input", () => {
      el.roomIdInput.value = el.roomIdInput.value.replace(/\D/g, "").slice(0, 4);
      clearRoomInlineError();
    });
    el.roomMask?.addEventListener("click", () => el.roomModal.classList.add("hidden"));
    el.closeRoomBtn?.addEventListener("click", () => el.roomModal.classList.add("hidden"));
    el.closeRoomBottomBtn?.addEventListener("click", () => el.roomModal.classList.add("hidden"));

    el.settingsMask?.addEventListener("click", () => el.settingsModal.classList.add("hidden"));
    el.closeSettingsBtn?.addEventListener("click", () => el.settingsModal.classList.add("hidden"));
    el.closeSettingsBottomBtn?.addEventListener("click", () => el.settingsModal.classList.add("hidden"));

    el.openLogBtn?.addEventListener("click", () => {
      renderLogList();
      el.settingsModal?.classList.add("hidden");
      el.logModal.classList.remove("hidden");
    });
    el.openRulesBtn?.addEventListener("click", () => {
      el.settingsModal?.classList.add("hidden");
      el.rulesModal.classList.remove("hidden");
    });
    el.openVersionLogBtn?.addEventListener("click", () => {
      renderVersionLogList();
      el.settingsModal?.classList.add("hidden");
      el.versionLogModal?.classList.remove("hidden");
    });
    el.openDebugBroadcastBtn?.addEventListener("click", openDebugBroadcastModal);

    el.closeLogBtn.addEventListener("click", () => el.logModal.classList.add("hidden"));
    el.closeLogBottomBtn.addEventListener("click", () => el.logModal.classList.add("hidden"));
    el.logMask.addEventListener("click", () => el.logModal.classList.add("hidden"));

    el.closeVersionLogBtn?.addEventListener("click", () => el.versionLogModal.classList.add("hidden"));
    el.closeVersionLogBottomBtn?.addEventListener("click", () => el.versionLogModal.classList.add("hidden"));
    el.versionLogMask?.addEventListener("click", () => el.versionLogModal.classList.add("hidden"));

    el.closeDebugBroadcastBtn?.addEventListener("click", closeDebugBroadcastModal);
    el.closeDebugBroadcastBottomBtn?.addEventListener("click", closeDebugBroadcastModal);
    el.debugBroadcastMask?.addEventListener("click", closeDebugBroadcastModal);
    el.debugBroadcastList?.addEventListener("click", event => {
      const btn = event.target.closest("[data-debug-index]");
      if (!btn) return;
      const sample = SPECIAL_EVENT_DEBUG_SAMPLES[Number(btn.dataset.debugIndex || 0)];
      previewSpecialEvent(sample);
    });
    el.debugInteractionList?.addEventListener("click", event => {
      const btn = event.target.closest("[data-debug-interaction-index]");
      if (!btn) return;
      const samples = renderDebugInteractionList.samples || [...INTERACTION_EMOJIS, ...INTERACTION_TOOLS];
      const sample = samples[Number(btn.dataset.debugInteractionIndex || 0)];
      if (sample) sendInteraction(sample.kind, 2, { debug: true, itemOverride: sample, cooldownKind: sample.kind });
    });
    el.debugExtraList?.addEventListener("click", event => {
      const btn = event.target.closest("[data-debug-extra]");
      if (!btn) return;
      const key = btn.dataset.debugExtra;
      closeDebugBroadcastModal();
      if (key === "viewTable") { openRoundTableModal(); return; }
      if (key === "lastTrick") { openLastTrickPopover(); return; }
      if (key === "quickInteraction") { showQuickEmojiMenu(); return; }
      if (key === "avatarMenu") { showInteractionTargetMenu(2); return; }
    });

    el.closeRulesBtn.addEventListener("click", () => el.rulesModal.classList.add("hidden"));
    el.closeRulesBottomBtn.addEventListener("click", () => el.rulesModal.classList.add("hidden"));
    el.rulesMask.addEventListener("click", () => el.rulesModal.classList.add("hidden"));

    el.closeResultBtn.addEventListener("click", () => el.resultModal.classList.add("hidden"));
    el.playAgainBtn?.addEventListener("click", restartGame);
    el.viewVersionAfterWinBtn?.addEventListener("click", () => {
      el.resultModal.classList.add("hidden");
      renderVersionLogList();
      el.versionLogModal?.classList.remove("hidden");
    });
    el.viewTableBtn?.addEventListener("click", openRoundTableModal);
    el.viewRoundTableBtn?.addEventListener("click", openRoundTableModal);
    el.lastTrickBtn?.addEventListener("click", event => { event.stopPropagation(); openLastTrickPopover(); });
    el.lastTrickPopover?.addEventListener("click", event => { if (event.target.closest("[data-close-last-trick]")) closeLastTrickPopover(); });
    el.closeRoundTableBtn?.addEventListener("click", () => el.roundTableModal.classList.add("hidden"));
    el.closeRoundTableBottomBtn?.addEventListener("click", () => el.roundTableModal.classList.add("hidden"));
    el.roundTableMask?.addEventListener("click", () => el.roundTableModal.classList.add("hidden"));
    el.resultMask.addEventListener("click", () => el.resultModal.classList.add("hidden"));
    el.aiPromptMask?.addEventListener("click", closeAiPrompt);
    el.closeAiPromptBtn?.addEventListener("click", closeAiPrompt);
    el.aiPromptLaterBtn?.addEventListener("click", closeAiPrompt);
    el.aiPromptConfirmBtn?.addEventListener("click", confirmAiPrompt);
    el.landscapePromptMask?.addEventListener("click", closeLandscapePrompt);
    el.closeLandscapePromptBtn?.addEventListener("click", closeLandscapePrompt);
    el.skipLandscapePromptBtn?.addEventListener("click", closeLandscapePrompt);
    el.enableLandscapePromptBtn?.addEventListener("click", acceptLandscapePrompt);

    window.addEventListener("resize", () => { render(); positionTableActionButtons(); maybeShowLandscapePrompt(); });
    window.addEventListener("orientationchange", () => setTimeout(() => { render(); positionTableActionButtons(); maybeShowLandscapePrompt(); }, 260));
    window.addEventListener("offline", () => {
      state.connected = false;
      updateConnectionNotice();
      updateRoomPanel();
    });
    window.addEventListener("online", () => {
      updateConnectionNotice();
      connectSocket();
    });

    ["fullscreenchange", "webkitfullscreenchange", "msfullscreenchange"].forEach(eventName => {
      document.addEventListener(eventName, () => {
        if (!isFullscreenActive() && state.orientationLocked) state.orientationLocked = false;
        updateSystemButtons();
        setTimeout(render, 180);
      });
    });

    if (screen.orientation && typeof screen.orientation.addEventListener === "function") {
      screen.orientation.addEventListener("change", () => setTimeout(render, 220));
    }

    ensureNicknameSeed();
    ensureViewportAnimationLayers();
    if (el.roomIdInput && state.roomId) el.roomIdInput.value = state.roomId;
    document.body.classList.toggle("force-landscape", state.forceLandscape);
    updateThemeAndSoundButtons();
    try { render(); } catch (e) {
      console.error("初始渲染失败:", e);
      fallbackToLobby("页面初始化异常，已重置。");
    }
    updateRoomPanel();
    connectSocket();
    if (!state.roomId) setTimeout(() => openRoomModal("choice"), 260);
    setTimeout(() => maybeShowLandscapePrompt(), 900);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        if (!state.connected) connectSocket();
      }
    });

    if ("serviceWorker" in navigator && window.isSecureContext) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(reg => {
          if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
          reg.addEventListener("updatefound", () => {
            const newSw = reg.installing;
            if (newSw) newSw.addEventListener("statechange", () => {
              if (newSw.state === "activated") location.reload();
            });
          });
        }).catch(error => {
          console.warn("PWA service worker 注册失败：", error);
        });
      });
    }

  