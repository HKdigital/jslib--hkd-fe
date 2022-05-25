<script>
/**
 * The ObjectBox component is a `container` component.
 * - By default the ObjectBox has a style `width: 100%; height: 100%`
 *   so it will fill the surrounding parent
 *
 * - By design this component does help offer support for `aspect`. It is
 *   usually better to specify a height and a width and to fit the inner
 *   component inside the specified box dimensions, e.g. using `cover`.
 *
 * - Optionally custom properties `style` or `classNames` can be set
 *   to control the (min/max)width and (min/max)height of the component
 *
 * - The component will throw an exception if its `width` or `height` is zero
 */

/* ------------------------------------------------------------------ Imports */

import { expectString } from "@hkd-base/expect.js";

/* ---------------------------------------------------------------- Internals */

let objectBoxElem;
let widthAndHeightChecked = false;

/* ------------------------------------------------------------------ Exports */

let classNames = "";
export { classNames as class };

let customStyle = "";
export { customStyle as style };

$: expectString( customStyle, "Invalid value for property [style]" );

/* -------------------------------------------------------------------- Logic */

$: {
  // Throw an exception if the object box has zero width or height

  if( !widthAndHeightChecked && objectBoxElem )
  {
    const { width, height } = objectBoxElem.getBoundingClientRect();

    if( !width )
    {
      throw new Error("ObjectBox [width] should not be 0");
    }

    if( !height )
    {
      throw new Error("ObjectBox [height] should not be 0");
    }
  }
}

</script> <!----------------------------------------------------------- HTML -->

<div bind:this={objectBoxElem}
     class="c-object-box {classNames}"
     style={customStyle}>
  <slot></slot>
</div>

<style> /* ------------------------------------------------------------ Style */

  :global(.c-object-box)
  {
    position: relative;
    height: 100%;
    width: 100%;
    /*border:  dashed 1px yellow;*/
  }

</style>
