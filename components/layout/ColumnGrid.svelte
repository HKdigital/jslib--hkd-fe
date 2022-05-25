<script>

/* ------------------------------------------------------------------ Imports */

/* ---------------------------------------------------------------- Internals */

let style = "";

/* ------------------------------------------------------------------ Exports */

let cssClassNames = "";
export { cssClassNames as class };

export let gridMaxWidth = "50rem";

export let columnMinWidth = "18rem";
export let columnMaxWidth = "50rem";

/* -------------------------------------------------------------------- Logic */

$: {
  // Update property `style` (set css variables)
  style =
    `--grid-max-width:${gridMaxWidth};` +
    `--column-min-width:${columnMinWidth};` +
    `--column-max-width:${columnMaxWidth};`;
}

</script>

<div {style} class="c-column-grid {cssClassNames}">

  <div class="inner-grid">
    <slot></slot>
  </div>

</div>

<style>

:global(.c-column-grid)
{
  display: grid;
  width: 100%;
  grid-template-columns: min( var(--grid-max-width, 50rem), 100vw );
  /*border: solid 5px salmon;*/

  justify-content: center;
}

/*:global(.c-column-grid.x-justify-start)
{
  justify-content: start;
}

:global(.c-column-grid.x-justify-start .grid)
{
  justify-content: start;
}*/

:global(.inner-grid)
{
  display: grid;

  width: min( var(--grid-max-width, 50rem), 100vw );

  /*grid-template-columns:
    repeat(auto-fit, minmax( var(--column-min-width, 18rem), 1fr) );*/

  grid-template-columns:
    repeat(auto-fit, minmax( var(--column-min-width, 18rem), 1fr) );

  justify-content: center;
  /*justify-content: start;*/
}

:global(.inner-grid > *)
{
  /* prevent 'too big content' to break out */
  max-width: min( var(--column-max-width, 25rem), 100% );
}

:global(.c-column-grid.x-padding-bottom-100)
{
  /* Add 1rem padding to the bottom of the grid */
  padding-bottom: 1rem;
}

:global(.c-column-grid.x-grid-gap-100 ,inner-grid)
{
  /* Add 1rem row gap (padding) between the rows */
  padding-bottom: 1rem;
}

</style>