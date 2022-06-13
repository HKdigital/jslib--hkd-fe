<script>

/* ------------------------------------------------------------------ Imports */

import { expectValidSurfaceColor } from "@hkd-fe/theme.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

let cssClassNames = "";
export { cssClassNames as class };

export let onColor;
$: expectValidSurfaceColor( onColor );

/* -------------------------------------------------------------------- Logic */

</script>

<div class="c-body-text
            g-color gx-default-on-{onColor}
            {cssClassNames}"
            on:click>
  <slot></slot>
</div>

<style>
  :global(.c-body-text)
  {
    font-family: sans-serif;
    font-weight: 300;
    font-size: 1.05rem;
    line-height: 1.4;
    letter-spacing: 0.02rem;
    padding: 0.5rem;
  }

  :global(.c-body-text.x-center)
  {
    text-align: center;
    inline-size: calc( 100% - 2rem );
    margin-left: 1rem;
    padding-left: 1rem;
  }

  :global(.c-body-text.x-right)
  {
    text-align: right;
    inline-size: 100%;
    padding-left: 1rem;
  }

  /* Fix for c-body-text inside a c-column.x-center component */
  :global(.c-column.x-center .c-body-text)
  {
    /*background-color: red;*/
    width: 100%;
  }

  :global(.c-body-text.x-size-small)
  {
    font-size: 0.945rem;
  }

  :global(.c-body-text.x-size-large)
  {
    font-size: 1.155rem
  }
</style>