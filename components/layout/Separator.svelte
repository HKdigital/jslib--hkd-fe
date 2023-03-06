<script>

/* ---------------------------------------------------------------- Internals */

let cssClassNames = "";

/* ------------------------------------------------------------------ Exports */

export { cssClassNames as class };

export let onColor;

/* ----------------------------------------------------------------- Reactive */

</script>

<div c-separator
     class="x-color-on-{onColor} {cssClassNames}"></div>

<style>

  [c-separator]
  {
    background-color: aqua;
    min-height: 1px;
  }

</style>