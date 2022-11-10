<script>

/* ------------------------------------------------------------------ Imports */

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

let cssClassNames = "";
export { cssClassNames as class };

export let onColor = null;

/* Center the element (element should have a width) */
export let center = false;

/* ----------------------------------------------------------------- Reactive */

let colorClasses = "";

$: {
  if( onColor )
  {
    colorClasses = `x-color-on-${onColor}`;
  }
  else {
    colorClasses = "";
  }
}

</script>

<div c-body-text
     class="{colorClasses}
            {cssClassNames}"
     class:x-center={center}
     on:click>
  <slot></slot>
</div>

<style>
  :global( [c-body-text ] )
  {
    /*font-family: sans-serif;
    font-weight: 300;
    font-size: 1.05rem;
    line-height: 1.4;
    letter-spacing: 0.02rem;
    padding: 0.5rem;*/
  }

  .x-center { text-align: center; }

</style>