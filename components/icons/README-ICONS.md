
# Hero Icons

## Download a new icon

SVG icons can be downloaded from:

https://heroicons.com/

## How to use

Copy the SVG into a file and save it as a SVELTE file, import the file as a normal SVELTE component.

### Recommendations for theming

Use the Wrapper components `InlineIcon`, `TabIcon` or `ListIcon` instead of using the icon directly in your Svelte file to get more control when using centralized styling (a theme).

#### Example

```svelte
<script>
import InlineIcon from "@hkd-fe/components/icons/InlineIcon.svelte";

import Sparkles
  from "@hkd-fe/components/icons/hero/solid/Sparkles.svelte";
</script>

<InlineIcon
  onColor={SURFACE_WHITE}
  content={Sparkles}
  class="x-spaced" />
```
