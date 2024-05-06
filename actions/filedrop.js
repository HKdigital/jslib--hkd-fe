
/**
 * File drop action
 *
 * @example
 *
 *   <div use:filedrop={options} on:filedrop />
 *
 * Inspired by https://github.com/chanced/filedrop-svelte
 *
 * @param {HTMLElement} node
 * @param {object} options
 * 
 * @returns { { update: function, destroy: function } }
 */
export const filedrop = function( node, options )
{
  let configured = false;

  let accept;
  let disabled;

  let inputElement;

  // ---------------------------------------------------------------------------

  configure( options );

  // ---------------------------------------------------------------------------

  /**
   * Configure the action
   * - Create hidden file input element
   * - Set or unset CSS classes
   * - Add or remove event listeners
   *
   * @param {object} [options={}]
   */
  function configure( options={} )
  {
    // -- Parse options

    ( { accept,
        disabled } = parseOptions( options ) );

    // -- Apply option `disabled`

    if( disabled )
    {
      node.classList.add('x-disabled');
      stop();
      return;
    }
    else {
      node.classList.remove('x-disabled');
    }


    // >> TODO: options tabindex, multiple


    // -- Setup hidden file input element

    createInputElement();

    // console.log( { accept } );

    if( accept )
    {
      inputElement.accept = accept;
    }
    else {
      inputElement.removeAttribute( accept );
    }

    // -- Add event listeners to node

    node.addEventListener( 'dragenter', handleDragEnter );
    node.addEventListener( 'dragleave', handleDragLeave );
    node.addEventListener( 'dragover', handleDragOver );
    node.addEventListener( 'drop', handleDrop );

    node.addEventListener( 'click', handleClick );
    node.addEventListener( 'keydown', handleKeyDown );

    // -- Add event listeners to input element

    inputElement.addEventListener( 'change', handleInputChange );

    configured = true;
  }

  // ---------------------------------------------------------------------------

  /**
   * Stop the action
   */
  function stop()
  {
    if( !configured )
    {
      return;
    }

    node.removeEventListener( 'dragenter', handleDragEnter );
    node.removeEventListener( 'dragleave', handleDragLeave );
    node.removeEventListener( 'dragover', handleDragOver );
    node.removeEventListener( 'drop', handleDrop );

    node.removeEventListener( 'click', handleClick );
    node.removeEventListener( 'keydown', handleKeyDown );

    // -- Remove event listeners from the input element

    inputElement.removeEventListener( 'change', handleInputChange );
  }

  // ---------------------------------------------------------------------------

  /**
   * Create a hidden file input element
   *
   * - Create a hidden INPUT type="file" DOM elment
   * - Append it as child of the current node
   * - Assign the DOM element to the internal variable `input`
   */
  function createInputElement()
  {
    if( !inputElement )
    {
      inputElement = document.createElement('input');
      inputElement.setAttribute('type', 'file');
      inputElement.style.display = 'none';
      inputElement.tabIndex = -1;
      inputElement.autocomplete = 'off';
    }

    return node.appendChild( inputElement );
  }

  // ---------------------------------------------------------------------------

  function handleDragOver( e )
  {
    e.preventDefault();

    // console.log(`handleDragOver`);
  }

  // ---------------------------------------------------------------------------

  /**
   * Handle a drag enter event
   * - Check if related target is not a child node
   * - Emit event `fileover`
   * - Adds CSS class `x-over`
   *
   * @param { {relatedTarget: HTMLElement} } [e]
   */
  function handleDragEnter( /* e */ )
  {
    // console.log(`handleDragEnter`);

    updateFileOver( true );
  }

  // ---------------------------------------------------------------------------

  /**
   * Handle a drag leave event
   * - Check if related target is not a child node
   * - Emit event `fileover`
   * - Remove CSS class `x-over`
   *
   * @param { {relatedTarget: HTMLElement} } e - event
   */
  function handleDragLeave( e )
  {
    if( node.contains( e.relatedTarget ) )
    {
      // Related target is a child node
      // => do nothing
      return;
    }

    // console.log(`handleDragLeave`);

    updateFileOver( false );
  }

  // ---------------------------------------------------------------------------

  /**
   * Handle a (file) drop event
   *
   * @param { { dataTransfer: { items: DataTransferItemList } } } e - event
   */
  function handleDrop( e )
  {
    e.preventDefault();

    console.log( 'handleDrop', e );

    const files = e.dataTransfer?.files || e.detail?.files || [];

    if( !files.length || disabled )
    {
      return;
    }

    dispatch( 'filedrop', { files: Array.from(files) } );

    updateFileOver( false );

    //
    // Reset input element
    // => Otherwise uploading the same file will not trigger a new change event
    //
    inputElement.value = '';
  }

  // ---------------------------------------------------------------------------

  /**
   * Handle an input change
   * - Emitted when a file is selected
   *
   * @param { { target: { files: File[] } } } e - event
   */
  async function handleInputChange( e )
  {
    e.preventDefault();

    const files = e.target.files;

    dispatch( 'drop', { files: Array.from(files) } );

    //
    // Reset input element
    // => Otherwise uploading the same file will not trigger a new change event
    //
    inputElement.value = '';
  }

  // ---------------------------------------------------------------------------

  /**
   * Handle a click event on the node
   */
  function handleClick()
  {
    inputElement.click();
  }

  // ---------------------------------------------------------------------------

  /**
   * Handle a key down event on the node
   * - Emit click event if the key is `enter`
   */
  function handleKeyDown( e )
  {
    if( e.key === 'Enter' ) { handleClick(); }
  }

  // ---------------------------------------------------------------------------


  /**
   * Update file over
   * - Emit event `fileover`
   * - Set or unset CSS class `x-over`
   *
   * @param {boolean} isOver
   */
  function updateFileOver( isOver )
  {
    if( isOver )
    {
      node.classList.add('x-over');
    }
    else {
      node.classList.remove('x-over');
    }

    dispatch('over', { isOver } );
  }

  // ---------------------------------------------------------------------------

  /**
   * Parse options
   *
   * @param {object} options
   * @param {(string|string[]|null)} [options.accept=null]
   * @param {object} [options.disabled=false]
   *
   * @returns {object} parsed options
   */
  function parseOptions( options )
  {
    const parsed = {};

    parsed.accept = parseOptionAccept(options.accept);
    parsed.disabled = parseOptionDisabled(options.disabled);

    return parsed;
  }

  // ---------------------------------------------------------------------------

  /**
   * Parse the option `accept`
   *
   * @param {(string|string[])} accept
   *
   * @returns {(string)} comma separates list of accepted file types
   */
  function parseOptionAccept( accept )
  {
    if( !accept )
    {
      return '';
    }

    if( Array.isArray( accept ) )
    {
      return accept.join(',');
    }
    else if( typeof accept === 'string' )
    {
      return accept;
    }

    throw new Error('Invalid value for option [accept]');
  }

  // ---------------------------------------------------------------------------

  /**
   * Parse the option `disabled`
   *
   * @param {boolean} [disabled=false]
   *
   * @returns {boolean} value for property disabled
   */
  function parseOptionDisabled( disabled=false )
  {
    return !!disabled;
  }

  // ---------------------------------------------------------------------------

  /**
   * Dispatch a custom event
   *
   * @param {string} type
   * @param {object|null} [detail]
   */
  function dispatch( type, detail=null )
  {
    // console.log( "dispatch", type, detail );

    node.dispatchEvent( new CustomEvent( type, { detail } ) );
  }

  // ---------------------------------------------------------------------------

  return {
    /**
     * Handle updates of action properties
     *
     * @param {object} options
     */
    update( options ) {
      configure( options || {} );
    },

    /**
     * Cleanup when the svelte component is destroyed
     */
    destroy() {
      stop();
    }
  };

}; // end function