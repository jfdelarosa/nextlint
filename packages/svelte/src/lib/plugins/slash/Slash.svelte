<svelte:options accessors={true} />

<script lang="ts">
  import type {SuggestionProps} from '@tiptap/suggestion';

  import Item from './Item.svelte';
  import type {SlashMenuItem} from './slash-menu';
  import {onDestroy, onMount} from 'svelte';

  export let props: SuggestionProps<SlashMenuItem>;
  const SCROLL_HEIGHT = 400;
  const ELEMENT_HEIGHT = 54;

  const editor = props.editor;
  $: query = props.query;

  let selectedIndex = 0;

  $: menus = props.items;

  export const onKeyDown = ({event}: {event: KeyboardEvent}) => {
    if (event.key === 'ArrowUp') {
      upHandler();
      return true;
    }

    if (event.key === 'ArrowDown') {
      downHandler();
      return true;
    }

    if (event.key === 'Enter') {
      enterHandler();
      return true;
    }

    return false;
  };
  const upHandler = () => {
    selectedIndex = (selectedIndex + menus.length - 1) % menus.length;
  };

  const downHandler = () => {
    selectedIndex = (selectedIndex + 1) % menus.length;
  };

  const enterHandler = () => {
    onSelect(selectedIndex);
  };

  const getElementBounds = (parent: HTMLElement, element: HTMLElement) => {
    const parentRect = parent.getBoundingClientRect();
    const clientRect = element.getBoundingClientRect();
    const viewPort = [parent.scrollTop, parent.scrollTop + SCROLL_HEIGHT + 48];

    if (clientRect.top > viewPort[0] && clientRect.top < viewPort[1]) {
      return undefined;
    }

    requestAnimationFrame(() => {
      parent.scrollTo({
        top: viewPort[1],
        behavior: 'smooth'
      });
    });
  };

  const onActiveChange = (element: CustomEvent<HTMLElement>, idx: number) => {
    //max slash menu scroll is 400
    const parent = element.detail.parentElement!;
    const elementHeight = (idx + 1) * ELEMENT_HEIGHT;
    if (
      elementHeight < parent.scrollTop ||
      elementHeight > parent.scrollTop + SCROLL_HEIGHT
    ) {
      requestAnimationFrame(() => {
        parent.scrollTo({
          top: Math.max(elementHeight - ELEMENT_HEIGHT, 0),
          behavior: 'smooth'
        });
      });
    }
  };

  const onSelect = (idx: number) => {
    const item = menus[idx];
    if (item) {
      props.command(item);
    }
  };
</script>

<div class="wrapper">
  {#if menus.length === 0}
    <p
      style="width:100%;text-align: center;color:var(--svelteui-colors-dark300)"
    >
      No results
    </p>
  {:else}
    <div class="extension scroll" style="max-height:{SCROLL_HEIGHT}px">
      {#each menus as item, idx}
        <Item
          on:active={event => onActiveChange(event, idx)}
          text={item.title}
          icon={item.icon}
          description={item.description}
          active={selectedIndex === idx}
          onClick={() => onSelect(idx)}
        />
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .hidden {
    visibility: hidden;
  }
  .wrapper {
    width: 336px;
    height: 100%;
    display: flex;
    flex-direction: row;
    padding: 24px 8px;
    box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
    border-radius: 8px;
    z-index: 9;
    background: #fff;
    position: relative;

    .extension {
      overflow: auto;
      display: flex;
      flex-direction: column;
      overscroll-behavior: contain;
      width: 100%;
      padding: 0 8px;
    }
  }
  .scroll {
    scrollbar-color: var(--svelteui-colors-gray300)
      var(--svelteui-colors-gray400);

    scrollbar-width: thin;

    &::-webkit-scrollbar {
      width: 6px;
      height: 100%;
      &-track {
        background-color: var(--svelteui-colors-gray200);
        border-radius: 4px;
      }
      &-thumb {
        background-color: var(--svelteui-colors-gray500);
        border-radius: 4px;
      }
    }
  }
</style>
