<template>
  <Teleport to="body">
    <div class="modal" :class="{ hidden: !show }">
      <div class="modal-mask" @click="$emit('close')"></div>
      <div class="modal-card">
        <button class="modal-close" @click="$emit('close')">×</button>
        <h2 class="modal-title">{{ modalTitle }}</h2>
        <p class="modal-subtitle">{{ modalSubtitle }}</p>

        <!-- Choice Panel -->
        <div v-if="mode === 'choice'" class="room-choice-panel">
          <button class="action-btn" @click="mode = 'create'">创建房间</button>
          <button class="action-btn secondary" @click="mode = 'join'">加入房间</button>
        </div>

        <!-- Create Panel -->
        <div v-if="mode === 'create'" class="room-action-panel">
          <div class="room-field">
            <label>你的昵称</label>
            <div class="input-with-btn">
              <input class="room-input" v-model="nickname" placeholder="输入昵称" maxlength="20" />
              <button class="dice-icon-btn" @click="rerollNickname">🎲</button>
            </div>
          </div>
          <button class="action-btn" @click="$emit('createRoom', nickname)">创建房间</button>
          <button class="action-btn secondary" @click="mode = 'choice'">返回</button>
        </div>

        <!-- Join Panel -->
        <div v-if="mode === 'join'" class="room-action-panel">
          <div class="room-field">
            <label>你的昵称</label>
            <div class="input-with-btn">
              <input class="room-input" v-model="nickname" placeholder="输入昵称" maxlength="20" />
              <button class="dice-icon-btn" @click="rerollNickname">🎲</button>
            </div>
          </div>
          <div class="room-field">
            <label>房间号</label>
            <input class="room-input" v-model="joinRoomId" placeholder="4 位数字房间号" maxlength="4" />
          </div>
          <div class="room-inline-error hidden">{{ error }}</div>
          <button class="action-btn" @click="$emit('joinRoom', { nickname, roomId: joinRoomId })" :disabled="joinRoomId.length !== 4">加入房间</button>
          <button class="action-btn secondary" @click="mode = 'choice'">返回</button>
        </div>

        <!-- Status Panel -->
        <div v-if="mode === 'status'" class="room-status-panel">
          <div class="room-status">
            <span class="room-status-left">房间 {{ roomId }}</span>
            <button class="dice-btn" @click="$emit('copyRoomId')">复制</button>
          </div>
          <div class="room-players">
            <div v-for="(player, i) in players" :key="i" class="room-player-row">
              <span class="room-player-avatar">{{ player.avatar }}</span>
              <span class="room-player-name">{{ player.name }}</span>
              <span v-if="player.isBot" class="room-player-bot">AI</span>
              <span v-if="player.connected" class="room-player-connected">已连接</span>
            </div>
          </div>
          <div class="room-actions">
            <button v-if="isHost && players.length === 4" class="action-btn" @click="$emit('startGame')">开始游戏</button>
            <button v-if="isHost" class="action-btn" @click="$emit('fillBots')">AI补位开始</button>
            <button class="action-btn secondary" @click="$emit('leaveRoom')">退出房间</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  show: boolean
  initialMode?: 'choice' | 'create' | 'join' | 'status'
  roomId?: string
  players?: { name: string; avatar: string; isBot: boolean; connected: boolean }[]
  isHost?: boolean
}>(), {
  players: () => [],
  isHost: false
})

defineEmits<{
  close: []
  createRoom: [nickname: string]
  joinRoom: [data: { nickname: string; roomId: string }]
  startGame: []
  fillBots: []
  leaveRoom: []
  copyRoomId: []
}>()

const mode = ref(props.initialMode || 'choice')
const nickname = ref('')
const joinRoomId = ref('')
const error = ref('')

const ROMANCE_NAMES = ['貂蝉', '大乔', '小乔', '甄姬', '黄月英', '孙尚香', '祝融', '蔡文姬', '王异', '步练师', '赵云', '马超', '诸葛亮', '关羽', '张飞', '刘备', '黄忠', '魏延', '庞统', '姜维']

function rerollNickname() {
  nickname.value = ROMANCE_NAMES[Math.floor(Math.random() * ROMANCE_NAMES.length)]
}

const modalTitle = computed(() => {
  if (mode.value === 'create') return '创建房间'
  if (mode.value === 'join') return '加入房间'
  if (mode.value === 'status') return '房间详情'
  return 'Hearts by duanap'
})

const modalSubtitle = computed(() => {
  if (mode.value === 'choice') return '创建新房间或输入房间号加入已有房间'
  if (mode.value === 'create') return '创建房间后将生成 4 位数字房间号'
  if (mode.value === 'join') return '输入房间号加入其他玩家的房间'
  return ''
})
</script>

<style lang="scss" scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 999;
}
.modal.hidden { display: none; }

.modal-mask {
  position: absolute;
  inset: 0;
  background: rgba(70, 98, 55, .38);
  backdrop-filter: blur(8px);
}

.modal-card {
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(560px, calc(100vw - 24px));
  max-height: calc(100vh - 46px);
  overflow: auto;
  transform: translate(-50%, -50%);
  padding: 26px 24px 22px;
  border-radius: 34px;
  color: var(--ink);
  text-align: center;
  background:
    radial-gradient(circle at 18% 14%, rgba(255,255,255,.58), transparent 16%),
    radial-gradient(circle at 82% 22%, rgba(255,240,189,.38), transparent 14%),
    linear-gradient(145deg, rgba(255, 251, 235, .99), rgba(244, 219, 168, .98));
  border: 3px solid rgba(123, 82, 43, .2);
  box-shadow: 0 18px 0 rgba(123, 82, 43, .18), 0 28px 55px rgba(57, 70, 39, .26), inset 0 2px 0 rgba(255,255,255,.7);
}

.modal-close {
  position: absolute;
  right: 16px;
  top: 14px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(145deg, #fff9df, #f4d79c);
  border: 2px solid rgba(123, 82, 43, .2);
  color: #ff3434;
  font-size: 24px;
  cursor: pointer;
}

.modal-title {
  margin: 4px 0 8px;
  color: #6b4529;
  font-size: 30px;
  font-weight: 950;
  text-shadow: 0 2px 0 rgba(255,255,255,.72);
}

.modal-subtitle {
  color: rgba(91, 66, 39, .78);
  margin-bottom: 18px;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.action-btn {
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 999px;
  padding: 11px 18px;
  color: #172313;
  background: linear-gradient(145deg, #f5d676, #fff3b1);
  font-weight: 950;
  font-size: 15px;
  cursor: pointer;
  font-family: inherit;

  &:hover { filter: brightness(1.08); }

  &.secondary {
    color: var(--white);
    background: rgba(255,255,255,.12);
  }

  &:disabled { opacity: .5; cursor: not-allowed; }
}

.room-choice-panel,
.room-action-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.room-field {
  width: 100%;
  display: grid;
  gap: 6px;
  text-align: left;
  color: rgba(91, 66, 39, .78);
  font-weight: 900;

  label { font-size: 13px; }
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.room-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid rgba(123, 82, 43, .18);
  border-radius: 12px;
  background: rgba(255,255,255,.52);
  font-size: 15px;
  font-weight: 800;
  color: #5d422b;
  font-family: inherit;

  &:focus { outline: none; border-color: rgba(123, 82, 43, .36); }
}

.dice-btn, .dice-icon-btn {
  border: 1px solid rgba(123, 82, 43, .18);
  background: rgba(255,255,255,.52);
  color: #6b4b2d;
  border-radius: 999px;
  font-weight: 900;
  cursor: pointer;
}

.dice-icon-btn {
  width: 42px;
  min-width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  font-size: 20px;
}

.room-inline-error {
  color: #d54b58;
  font-size: 13px;
  font-weight: 900;
}

.room-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 20px;
  background: rgba(255,255,255,.45);
  border: 2px solid rgba(123, 82, 43, .13);
  font-weight: 900;
}

.room-players {
  display: grid;
  gap: 8px;
  margin: 14px 0;
  text-align: left;
}

.room-player-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(255,255,255,.38);
}

.room-player-avatar { font-size: 20px; }
.room-player-name { font-weight: 900; flex: 1; }
.room-player-bot {
  color: #62a8e5;
  font-size: 12px;
  font-weight: 900;
}
.room-player-connected {
  color: #6fc66d;
  font-size: 12px;
  font-weight: 900;
}

.room-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
