<script>
/* ------------------------------------------------------------------ Imports */

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

let cssClassNames = '';
export { cssClassNames as class };

export let onColor = null;

/* Center the header text (element should have a width) */
export let center = false;

/* ----------------------------------------------------------------- Reactive */

let colorClasses = '';

$: {
  if( onColor )
  {
    colorClasses = `x-on-${onColor}`;
  }
  else {
    colorClasses = '';
  }
}

</script>

<!-- eslint-disable-next-line svelte/valid-compile -->
<div c-heading-text
     class="{colorClasses}
            {cssClassNames}"
     class:x-center={center}
     on:click
     on:keydown>
    <slot></slot>
</div>

<style>
  :global( [c-heading-text] )
  {
    /*font-family: sans-serif;
    font-size: 2rem;
    line-height: 1.4;
    letter-spacing: 0.02rem;
    padding: 0.5rem;*/
  }

  .x-center { text-align: center; }
</style>

