<script>

/* ------------------------------------------------------------------ Imports */

// -- Routing

import { redirectToRoute }
  from "@hkd-fe/stores/router.js";

// -- Stores

import { screenWidthSmall }
  from "@hkd-fe/stores/screen-size.js";

/* ---------------------------------------------------------------- Internals */

let cssClassNames = "";

let colorClasses = "";

// -----------------------------------------------------------------------------

/**
 * Prevents emission of click event if the button is disabled
 * - This is a SVELTE action function
 *
 * @param {object} node - DOM node
 *
 * @returns {object} { destroy: <function> }
 */
function preventClickOnDisabled( node )
{
  const handleClick = (event) => {

    // console.log("preventClickOnDisabled", { disabled });

    if( disabled )
    {
      event.stopPropagation();
      return;
    }
  };

  node.addEventListener("click", handleClick, true);

  return {
    destroy() {
      node.removeEventListener("click", handleClick, true);
    }
  };
}

// -----------------------------------------------------------------------------

/**
 * Try redirect if a route propery has been supplied
 * - Prevents emission of click event if the button is disabled
 * - This is a SVELTE action function
 *
 * @param {object} node - DOM node
 *
 * @returns {object} { destroy: <function> }
 */
function tryRedirect( node )
{
  const handleClick = (event) => {

    // console.log("tryRedirect", { route, routeOptions } );
    // return;

    if( route )
    {
      event.stopPropagation();

      redirectToRoute( route, routeOptions );
    }
  };

  node.addEventListener("click", handleClick, true);

  return {
    destroy() {
      node.removeEventListener("click", handleClick, true);
    }
  };
}

/* ------------------------------------------------------------------ Exports */

export { cssClassNames as class };

export let onColor = null;

export let responsive = true;

export let disabled = false;

export let centerInner = true;

export let inline = false;

export let route = null;
export let routeOptions = { replaceCurrent: false };

/* ----------------------------------------------------------------- Reactive */

$: {
  //
  // Add color class `x-on-<surface color>`
  //
  if( onColor )
  {
    colorClasses = `x-on-${onColor}`;
  }
  else {
    colorClasses = "";
  }
}

</script>

<div c-button
     {...$$restProps}
     class="{colorClasses}
            {cssClassNames}"
     class:x-disabled={disabled}
     class:x-inline={inline}
     class:x-center-inner={centerInner}
     class:x-fit-width={!inline && responsive && $screenWidthSmall}
     class:x-width-max-content={!inline && responsive && !$screenWidthSmall}
     use:preventClickOnDisabled
     use:tryRedirect
     on:click>
  <div cc-button-inner><slot></slot></div>
</div>

<style lang="scss">

  :global( [c-button] )
  {
    cursor: pointer;

    user-select: none;
    -webkit-user-select: none; /* ios safari */

    color: aqua;
    background-color: olive;


    &:not(.x-inline)
    {
      // width: max-content;
      max-width: 100%;

      display: grid;

      grid-template-columns: 1fr;

      align-items: center;
      justify-content: center;
    }

    &.x-inline
    {
      display: inline-block;
    }

    &.x-disabled
    {
      opacity: 0.5;
      cursor: default;
    }

    // &.x-fit-width
    // {
    //   width: 100%;
    // }

    &.x-width-max-content
    {
      width: max-content;
    }

    &:not(.x-center-inner)
    {
      justify-self: start;
      max-width: max-content;
      text-align: left;
    }

    &.x-allow-line-breaks [cc-button-inner]
    {
      white-space: normal;
    }

    &:not(.x-inline) [cc-button-inner]
    {
      display: grid;
      grid-template-columns: 1fr;

      width: max-content;

      /* prevent breakout */
      max-width: 100%;

      /* prevent line breaks */
      white-space: nowrap;

      /* use ... if there is too much text */
      text-overflow: ellipsis;

      justify-self: center;
      justify-items: center;

      text-align: center;
    }

    &.x-inline [cc-button-inner]
    {
      display: inline-block;
    }
  }

</style>