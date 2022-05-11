<script>

  // -- Exports

  let cssClassNames = "";
  export { cssClassNames as class };

</script>

<div class="c-column {cssClassNames}">
  <slot></slot>
</div>

<style>
  :global(.c-column)
  {
    display: grid;
    width: 100%;
    grid-template-columns: minmax(7.5rem, 40rem);
  }

  /* Center the column */
  :global(.c-column.x-center)
  {
    justify-content: center;
    justify-items: center;
  }

  :global(.c-column > *)
  {
    /* prevent 'too big content' to break out */
    max-width: 100%;
  }

  :global(.c-column.x-padding-bottom-100)
  {
    padding-bottom: 1rem;
  }

  /*:global(.c-column > *)
  {
    border: solid 1px blue;
  }*/
</style>