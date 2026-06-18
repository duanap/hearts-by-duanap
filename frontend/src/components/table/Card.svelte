<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Card } from "../../types/messages";
  import { cardName, cardVisualClass, rankText, SUITS } from "../../stores/gameStore";

  export let card: Card;
  export let small = false;
  export let selected = false;
  export let legal = false;
  export let illegal = false;
  export let justReceived = false;
  export let passingOut = false;
  export let disabled = false;
  export let extraClass = "";
  export let style = "";

  const dispatch = createEventDispatcher<{ cardclick: string }>();

  $: suit = SUITS[card.suit];
  $: classes = [
    "card",
    small ? "small" : "",
    suit?.color || "",
    cardVisualClass(card),
    selected ? "selected" : "",
    legal ? "legal" : "",
    illegal ? "illegal" : "",
    justReceived ? "just-received" : "",
    passingOut ? "passing-out" : "",
    disabled ? "disabled" : "",
    extraClass
  ].filter(Boolean).join(" ");
</script>

{#if small}
  <div class={classes} {style} data-id={card.id} title={cardName(card)}>
    <div class="card-corner">{rankText(card.rank)}<br />{suit?.symbol}</div>
    <div class="card-pip">{suit?.symbol}</div>
    <div class="card-corner bottom">{rankText(card.rank)}<br />{suit?.symbol}</div>
  </div>
{:else}
  <button type="button" class={classes} {style} data-id={card.id} title={cardName(card)} {disabled} on:click={() => dispatch("cardclick", card.id)}>
    <div class="card-corner">{rankText(card.rank)}<br />{suit?.symbol}</div>
    <div class="card-pip">{suit?.symbol}</div>
    <div class="card-corner bottom">{rankText(card.rank)}<br />{suit?.symbol}</div>
  </button>
{/if}
