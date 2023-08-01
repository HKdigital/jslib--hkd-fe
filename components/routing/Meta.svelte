<script>
  //
  // This component adds meta data to the page
  // - This can be used for SEO, but also to give the browser information
  //   about the page, such as the page title
  //
  // About SEO optimalization
  // @see https://www.seobility.net/en/seocheck/
  //

  // @see https://ogp.me/

  /* ---------------------------------------------------------------- Imports */

  import { onDestroy } from "svelte";

  /* -------------------------------------------------------------- Internals */

  const DELAY_LOAD_MS = 100;

  let delayTimer;
  let img;

  let imageHref;

  let imageWidth;
  let imageHeight;

  /* ---------------------------------------------------------------- Exports */

  export let title;
  export let description;

  export let imageUri = '/static/defaultimage.jpg';

  export let ogTitle;
  export let ogDescription;

  export let imageAlt;

  // export let ogImageType;

  // export let twitterTitle;
  // export let twitterDescription;
  // export let twitterImage;
  // export let twitterImageAlt;

  // export let url = 'https://example.com';
  // export let slug;

  /* --------------------------------------------------------------- Reactive */

  $: {
    //
    // Copy title to ogTitle if not set
    //
    if( title && !ogTitle )
    {
      ogTitle = title;
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Copy description to ogDescription if not set
    //
    if( description && !ogDescription )
    {
      ogDescription = description;
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Copy imageUri to imageAlt if not set
    //
    if( imageUri && !imageAlt )
    {
      imageAlt = imageUri;
    }
  }

  // ---------------------------------------------------------------------------

  $: {
    //
    // Initialize the (delayed) loading of the SEO image
    //
    if( imageUri && !img )
    {
      delayTimer =
        setTimeout( () =>
          {
            if( imageUri )
            {
              const url = new URL( imageUri, location.origin );

              const href = url.href;

              img = new Image();

              img.onload = () =>
                {
                  imageWidth = img.width;
                  imageHeight = img.height;
                  imageHref = href;
                };

              img.src = href;
            }
          },
          DELAY_LOAD_MS );
    }
  }

  // ---------------------------------------------------------------------------

  onDestroy( () => {
    if( delayTimer )
    {
      clearTimeout( delayTimer );
      delayTimer = null;
    }

    if( img )
    {
      img.src = "";
      img = null;
    }
  } );

</script>

<svelte:head>

  <title>{title}</title>
  <meta name="description" content={description} />

  <meta property="og:type" content="website" />

  {#if ogTitle}
    <meta property="og:title" content={ogTitle || title} />
  {/if}

  {#if ogDescription}
    <meta property="og:description" content={ogDescription} />
  {/if}

  {#if imageHref && imageAlt && imageWidth && imageHeight}
    <meta property="og:image" content="{imageHref}" />
    <meta property="og:image:alt" content={imageAlt} />
    <meta property="og:image:width" content={imageWidth} />
    <meta property="og:image:height" content={imageHeight} />
  {/if}

  <!--
  {#if ogImageType}
    <meta property="og:image:type"
          content={ogImageType} />
  {/if}

  <meta property="twitter:title"
        content={twitterTitle || title} />

  <meta property="twitter:description"
        content={twitterDescription || description} />
  <meta
    property="twitter:image"
    content={twitterImage ? `${url}${twitterImage}` : `${url}${image}`}
  />
  <meta property="twitter:image:alt"
        content={twitterImageAlt ? twitterImageAlt : alt} />

  <meta property="twitter:card" content="summary" />

  {#if url}
    <meta property="og:url" content={`${url}${slug}`} />
    <link rel="canonical" href={`${url}${slug}`} />
  {/if} -->

</svelte:head>
