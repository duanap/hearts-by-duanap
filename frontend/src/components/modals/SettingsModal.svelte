<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import { clearClientCache, setForceLandscape, updateSettings } from "../../stores/gameStore";
  import { playGameSound } from "../../services/audio";

  export let state: GameState;

  const dispatch = createEventDispatcher<{
    close: void;
    log: void;
    rules: void;
    version: void;
  }>();

  $: open = state.modals.settings;
  $: settings = state.settings;
  $: soundPercent = Math.round(settings.soundVolume * 100);
  $: bgmPercent = Math.round(settings.bgmVolume * 100);

  function toggle(key: "soundEnabled" | "effectsEnabled" | "interactionEnabled" | "interactionEffectsEnabled" | "interactionSoundEnabled" | "allowTomato" | "landscapePromptEnabled"): void {
    const next = !settings[key];
    updateSettings({ [key]: next });
    if (key === "soundEnabled" && next) playGameSound("pass", { ...settings, soundEnabled: true });
  }

  function setEffectSpeed(value: string): void {
    updateSettings({ effectSpeed: Math.max(0.7, Math.min(1.4, Number(value || 1))) });
  }

  function setSoundVolume(value: string): void {
    const soundVolume = Math.max(0, Math.min(1, Number(value || 0) / 100));
    updateSettings({ soundVolume });
    if (settings.soundEnabled && soundVolume > 0) playGameSound("play", { ...settings, soundVolume });
  }
</script>

<div class="modal" class:hidden={!open} id="settingsModal">
  <button type="button" class="modal-mask" id="settingsMask" aria-label="关闭设置弹窗" style="border:0;padding:0;" on:click={() => dispatch("close")}></button>
  <div class="modal-card settings-card">
    <button class="modal-close" id="closeSettingsBtn" on:click={() => dispatch("close")}>×</button>
    <h2 class="modal-title">设置</h2>
    <div class="modal-subtitle">按分区调整特效、音效和项目资料。</div>

    <div class="settings-sections">
      <section class="settings-section">
        <div class="settings-section-title">牌局特效</div>
        <div class="settings-row">
          <div class="settings-row-label">特效开关<div class="settings-row-desc">高光事件、射中月亮等动画提示。</div></div>
          <div class="settings-controls">
            <button class="settings-switch" class:is-on={settings.effectsEnabled} id="effectsBtn" type="button" aria-pressed={settings.effectsEnabled} on:click={() => toggle("effectsEnabled")}>{settings.effectsEnabled ? "开启" : "关闭"}</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">播放速度<div class="settings-row-desc">控制牌局高光与月亮特效的整体节奏。</div></div>
          <div class="settings-controls">
            <select class="settings-select" id="effectSpeedSelect" value={settings.effectSpeed} on:change={(event) => setEffectSpeed(event.currentTarget.value)}>
              <option value="0.85">偏快</option>
              <option value="1">标准</option>
              <option value="1.2">偏慢</option>
            </select>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">强制横屏<div class="settings-row-desc">沿用当前牌桌的横屏显示开关。</div></div>
          <div class="settings-controls">
            <button class="settings-switch" class:is-on={state.forceLandscape} id="forceLandscapeSettingsBtn" type="button" aria-pressed={state.forceLandscape} on:click={() => setForceLandscape(!state.forceLandscape)}>{state.forceLandscape ? "开启" : "关闭"}</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">横屏提示<div class="settings-row-desc">手机竖屏时提示切换横屏，关闭后不再主动弹出。</div></div>
          <div class="settings-controls">
            <button class="settings-switch" class:is-on={settings.landscapePromptEnabled} id="landscapePromptSettingsBtn" type="button" aria-pressed={settings.landscapePromptEnabled} on:click={() => toggle("landscapePromptEnabled")}>{settings.landscapePromptEnabled ? "开启" : "关闭"}</button>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section-title">音效</div>
        <div class="settings-row">
          <div class="settings-row-label">音效开关<div class="settings-row-desc">出牌、传牌、错误提示与高光播报音效。</div></div>
          <div class="settings-controls">
            <button class="settings-switch" class:is-on={settings.soundEnabled} id="soundBtn" type="button" aria-pressed={settings.soundEnabled} on:click={() => toggle("soundEnabled")}>{settings.soundEnabled ? "开启" : "关闭"}</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">音量大小<div class="settings-row-desc">仅影响当前网页音效。</div></div>
          <div class="settings-controls">
            <input type="range" min="0" max="100" step="5" class="settings-range" id="soundVolumeRange" value={soundPercent} on:input={(event) => setSoundVolume(event.currentTarget.value)} />
            <span class="settings-mini" id="soundVolumeValue">{soundPercent}%</span>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section-title">牌桌互动</div>
        <div class="settings-row">
          <div class="settings-row-label">互动开关<div class="settings-row-desc">关闭后不打开头像互动菜单和快捷互动。</div></div>
          <div class="settings-controls">
            <button class="settings-switch" class:is-on={settings.interactionEnabled} id="interactionEnabledBtn" type="button" aria-pressed={settings.interactionEnabled} on:click={() => toggle("interactionEnabled")}>{settings.interactionEnabled ? "开启" : "关闭"}</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">互动特效<div class="settings-row-desc">表情气泡、送花和扔番茄飞行动画。</div></div>
          <div class="settings-controls">
            <button class="settings-switch" class:is-on={settings.interactionEffectsEnabled} id="interactionEffectsBtn" type="button" aria-pressed={settings.interactionEffectsEnabled} on:click={() => toggle("interactionEffectsEnabled")}>{settings.interactionEffectsEnabled ? "开启" : "关闭"}</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">互动音效<div class="settings-row-desc">送花、扔番茄和表情提示音。</div></div>
          <div class="settings-controls">
            <button class="settings-switch" class:is-on={settings.interactionSoundEnabled} id="interactionSoundBtn" type="button" aria-pressed={settings.interactionSoundEnabled} on:click={() => toggle("interactionSoundEnabled")}>{settings.interactionSoundEnabled ? "开启" : "关闭"}</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">允许番茄<div class="settings-row-desc">关闭后隐藏并屏蔽扔番茄互动。</div></div>
          <div class="settings-controls">
            <button class="settings-switch" class:is-on={settings.allowTomato} id="allowTomatoBtn" type="button" aria-pressed={settings.allowTomato} on:click={() => toggle("allowTomato")}>{settings.allowTomato ? "开启" : "关闭"}</button>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section-title">背景音乐（预留）</div>
        <div class="settings-row">
          <div class="settings-row-label">背景音乐开关<div class="settings-row-desc">后期增加，目前仅预留设置位。</div></div>
          <div class="settings-controls">
            <button class="settings-switch" id="bgmBtn" type="button" aria-pressed="false" disabled>未开放</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">背景音乐音量<div class="settings-row-desc">功能开放后可在此调节。</div></div>
          <div class="settings-controls">
            <input type="range" min="0" max="100" step="5" value={bgmPercent} class="settings-range" id="bgmVolumeRange" disabled />
            <span class="settings-mini" id="bgmVolumeValue">{bgmPercent}%</span>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section-title">工具与资料</div>
        <div class="settings-actions-grid">
          <button class="action-btn secondary" id="openRulesBtn" on:click={() => dispatch("rules")}>规则</button>
          <button class="action-btn secondary" id="openLogBtn" on:click={() => dispatch("log")}>出牌日志</button>
          <button class="action-btn secondary" id="openVersionLogBtn" on:click={() => dispatch("version")}>版本日志</button>
          <button class="action-btn secondary" id="clearCacheBtn" on:click={() => void clearClientCache()}>刷新缓存</button>
        </div>
      </section>

      <section class="settings-section">
        <div class="settings-section-title">项目信息</div>
        <div class="settings-info">
          <div><strong>版本号：</strong>Svelte 迁移版 · v1.4.22 兼容</div>
          <div><strong>开发者 QQ：</strong>182827046</div>
          <div><strong>QQ 群：</strong>50475937</div>
        </div>
      </section>
    </div>

    <div class="modal-actions">
      <button class="action-btn secondary" id="closeSettingsBottomBtn" on:click={() => dispatch("close")}>关闭</button>
    </div>
  </div>
</div>
