<script>
/* ------------------------------------------------------------------ Exports */

let cssClassNames = "";
export { cssClassNames as class };

</script>

<div class="c-layer {cssClassNames}">
  <slot></slot>
</div>

<style>
  :global(.c-layer)
  {
    position: absolute;
    overflow: hidden;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;

    pointer-events: none;
  }

  :global(.c-layer > *)
  {
    pointer-events: auto;
  }

  :global(.c-layer.x-top-left)
  {
    display: grid;
    justify-content: start;
    align-content: start;
  }

  :global(.c-layer.x-top-right)
  {
    display: grid;
    justify-content: end;
    align-content: start;
  }

  :global(.c-layer.x-bottom-left)
  {
    display: grid;
    justify-content: start;
    align-content: end;
  }

  :global(.c-layer.x-bottom-right)
  {
    display: grid;
    justify-content: end;
    align-content: end;
  }

  :global(.c-layer.x-center)
  {
    display: grid;
    justify-content: center;
    align-content: center;
  }

</style>