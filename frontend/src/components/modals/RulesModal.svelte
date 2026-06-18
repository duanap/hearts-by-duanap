<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";

  export let state: GameState;

  const dispatch = createEventDispatcher<{ close: void }>();

  $: open = state.modals.rules;
</script>

<div class="modal" class:hidden={!open} id="rulesModal">
  <button type="button" class="modal-mask" id="rulesMask" aria-label="关闭规则弹窗" style="border:0;padding:0;" on:click={() => dispatch("close")}></button>
  <div class="modal-card">
    <button class="modal-close" id="closeRulesBtn" on:click={() => dispatch("close")}>×</button>
    <h2 class="modal-title">红心规则提示</h2>
    <ul class="rules-list">
      <li>游戏目标是尽量少得分；有人总分达到 100 分后，低分玩家获胜。</li>
      <li>红桃每张 1 分，黑桃 Q 13 分。</li>
      <li>每局第一墩必须由梅花 2 开始。</li>
      <li>能跟花色必须跟，不能跟时才可以垫牌。</li>
      <li>红桃未破前不能主动出红桃，除非手里全是红桃。</li>
      <li>第一墩不能垫红桃或黑桃 Q，除非手里没有安全牌。</li>
      <li>传牌按左、右、对家、不传循环，每次选择 3 张。</li>
      <li>一名玩家拿满 26 分为射月，其他三家各加 26 分。</li>
    </ul>
    <div class="modal-actions">
      <button class="action-btn secondary" id="closeRulesBottomBtn" on:click={() => dispatch("close")}>关闭</button>
    </div>
  </div>
</div>
