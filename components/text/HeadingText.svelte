<script>
/* ------------------------------------------------------------------ Imports */

import { expectValidSurfaceColor } from "@hkd-fe/helpers/theme.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

let cssClassNames = "";
export { cssClassNames as class };

export let onColor;
$: expectValidSurfaceColor( onColor );

/* -------------------------------------------------------------------- Logic */


</script>

<div class="c-heading-text
            g-color gg-default-on-{onColor}
            {cssClassNames}"
            on:click>
    <slot></slot>
</div>

<style>
  :global(.c-heading-text)
  {
    font-family: sans-serif;
    font-weight: 400;
    font-size: 2rem;
    line-height: 1.4;
    letter-spacing: 0.02rem;
    padding: 0.5rem;

    /*inline-size: calc( 100% - 2rem );*/
  }

  :global(.c-heading-text.x-center)
  {
    text-align: center;
    inline-size: calc( 100% - 2rem );
    margin-left: 1rem;
  }

  /* Fix for c-heading-text inside a c-column.x-center component */
  :global(.c-column.x-center .c-heading-text)
  {
    /*background-color: red;*/
    width: 100%;
  }

  :global(.c-heading-text.x-size-small)
  {
    font-size: 1.8rem;
  }

  :global(.c-heading-text.x-size-large)
  {
    font-size: 2.2rem
  }

  /*:global(.c-skills-heading-text)
  {
    padding-left: 1rem;
    inline-size: calc( 100% - 2rem );
    text-align: center;
    background-color:  red;
  }*/

  :global(.c-heading-text.x-compact)
  {
    padding-left: 0;
    inline-size: auto;
  }

</style>

