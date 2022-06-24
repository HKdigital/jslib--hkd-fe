<script>
  //
  // About SEO optimalization
  // @see https://www.seobility.net/en/seocheck/
  //

  // @see https://ogp.me/

  export let title;
  export let description;

  export let imageUri = '/static/defaultimage.jpg';

  export let ogTitle;
  export let ogDescription;

  $: if( title && !ogTitle ) { ogTitle = title; }
  $: if( description && !ogDescription ) { ogDescription = description; }

  export let imageAlt;

  $: if( imageUri && !imageAlt ) { imageAlt = imageUri; }

  // export let ogImageType;

  // export let twitterTitle;
  // export let twitterDescription;
  // export let twitterImage;
  // export let twitterImageAlt;

  // export let url = 'https://example.com';
  // export let slug;

  let imageHref;

  let imageWidth;
  let imageHeight;

  $: {
    if( imageUri )
    {
      const url = new URL( imageUri, location.origin );

      const href = url.href;

      const img = new Image();

      img.onload = () =>
        {
          imageWidth = img.width;
          imageHeight = img.height;
          imageHref = href;
        };

      img.src = href;
    }
  }
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
