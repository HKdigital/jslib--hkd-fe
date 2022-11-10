
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectNotEmptyString,
  expectObject } from "@hkd-base/helpers/expect.js";

import { equals } from "@hkd-base/helpers/compare.js";

import LogBase from "@hkd-base/classes/LogBase.js";

import ObjectSchema from "@hkd-base/classes/ObjectSchema.js";

import DedupValueStore from "@hkd-base/classes/DedupValueStore.js";

import {
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_BOOLEAN,
  TYPE_NAME,
  TYPE_EMAIL } from "@hkd-base/types/schema-types.js";

/* ---------------------------------------------------------------- Internals */

const defaultsByType =
  {
    [ TYPE_STRING ]: "",
    [ TYPE_NUMBER ]: 0,
    [ TYPE_BOOLEAN ]: false,
    [ TYPE_NAME ]: "",
    [ TYPE_EMAIL ]: ""
  };

/* ------------------------------------------------------------------ Exports */

export default class Form extends LogBase
{
  // -------------------------------------------------------------------- Method

  /**
   * Construct a new form
   *
   * @param {object} _.schema
   * @param {object} _.initialValues
   *
   */
  constructor( { schema, initialValues={} }={} )
  {
    super( ...arguments );

    expectObject( schema,
      "Missing or invalid parameter [schema]" );

    if( !(schema instanceof ObjectSchema ) )
    {
      schema = new ObjectSchema( schema );
    }

    expectObject( initialValues,
      "Missing or invalid parameter [initialValues]" );

    this._schema = schema;
    this._initialValues = initialValues;
    this._values = {};

    const schemaProperties = schema.describe().keys;

    // this.log.debug( "schemaProperties", schemaProperties );

    const keys = Object.keys( schemaProperties );

    this._keys = keys;

    // == Update missing intialValues using schema

    for( const key in schemaProperties )
    {
      if( key in initialValues )
      {
        continue;
      }

      const { type, flags } = schemaProperties[ key ];

      if( flags && ("default" in flags) )
      {
        initialValues[ key ] = flags.default;
      }
      else if( type in defaultsByType )
      {
        initialValues[ key ] = defaultsByType[ type ];
      }

    } // end for

    // == Initialize values

    const values = this._values;

    for( const key in initialValues )
    {
      values[ key ] = initialValues[ key ];
    }

    // == Create property `pristine`

    this.pristine = new DedupValueStore( true );

    // == Create property `valid` (all form data valid)

    this.valid = new DedupValueStore();

    this._updateFormValid();

    // this.touched = {};
    // this.errors = {};

    // this.log.debug("CHECK",
    //   initialValues,
    //   values,
    //   {
    //     name: this.getInitialValue("name")
    //   } );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the initial value for the specified form property
   *
   * @param {string} key
   *
   * @returns {*|undefined} initial value
   */
  getInitialValue( key )
  {
    expectString( key, "Missing or invalid parameter [key]" );

    let initialValues = this._initialValues;

    if( key in initialValues )
    {
      return initialValues[ key ]; // might be undefined
    }
    else {
      const initialValue = initialValues[ key ];

      const { value,
              error,
              /* finalValue */ } = this._parseProperty( key, initialValue );

      // this.log.debug( "getInitialValue", { value, error, initialValue } );

      if( error )
      {
        // Return initialValue eventhough it is invalid
        return initialValue;
      }
      else {
        return value;
      }
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get a parser function that can be used to parse a single form property,
   * that is specified by `key`
   *
   * --
   *
   * @note This method returns and property parser.
   *       It does not parse properties
   *
   * --
   *
   * @param {string} key
   *
   * @returns {function} parser function
   */
  propertyParser( key )
  {
    expectString( key, "Missing or invalid parameter [key]" );

    return this._parseProperty.bind( this, key );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get an update handler that can be used to update a form property
   * - This method returns a function that can be used as update handler
   *   by e.g. an input component.
   * - The method does not handle updates itself
   *
   * @param {string} key
   *
   * @returns {function} update handler
   */
  updateHandler( key )
  {
    expectString( key, "Missing or invalid parameter [key]" );

    // == Return update handler for specified key

    /**
     * Update handler
     * - Accepts an input component event
     *
     * @param {object} event
     * @param {*} event.detail - Updated value
     */
    return ( event ) => {

      const updatedValue = event.detail;

      const { value,
              error,
              /*finalValue*/ } = this._parseProperty( key, updatedValue );

      // this.log.debug(
      //   "updateHandler",
      //   { key, updatedValue, value, error, finalValue } );

      // == Store value

      if( error )
      {
        this._values[ key ] = updatedValue;
      }
      else {
        this._values[ key ] = value;
      }

      // == Update pristine

      const initialValues = this._initialValues;
      const values = this._values;

      // this.log.debug( "CHECK",
      //   {
      //     value: values[ key ],
      //     initialValue: initialValues[ key ]
      //   } );

      if( !equals( values[ key ], initialValues[ key ] ) )
      {
        //
        // Value changed => form not pristine
        //
        this.pristine.set( false );
      }
      else {
        //
        // Check all form properties and update property `pristine`
        //
        this._updateFormPristine();
      }

      // == Update valid (validate all form properties)

      this._updateFormValid();
    };
  }


  // -------------------------------------------------------------------- Method

  /**
   * Get all form data
   * - Returns if all the form data is valid
   * - Returns final values of the form data (e.g. trims strings)
   *
   * @returns {object} (complete) form valid and form data
   *   {
   *     valid: <boolean>,
   *     formData: <object>
   *   }
   */
  export()
  {
    const valid = this.valid.get();

    const values = this._values;

    const {
      value: formData,
      error } =
        this._schema.validate( values,
          {
            abortEarly: false,
            useFinalValue: true
          } );

    if( error )
    {
      // This should not happen
      throw new Error(
        "Cannot export form data, validation failed", { cause: error } );
    }

    return { valid, formData };
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get a form value and it's valid status
   *
   * @param {string} key
   *
   * @returns {object} { value: <string>, valid: <boolean> }
   */
  peek( key )
  {
    expectNotEmptyString( key,
      "Missing or invalid value for parameter [key]" );

    const values = this._values;

    if( !(key in values) )
    {
      throw new Error(`Invalid parameter [key=${key}] (property not found)`);
    }

    const { value, finalValue, error } =
      this._schema.validateProperty( values, key );

    const result = { value: values[ key ] };

    if( undefined !== finalValue )
    {
      result.finalValue = finalValue;
    }

    if( error )
    {
      result.valid = false;
      // result.error = error;
    }
    else {
      result.valid = true;
    }

    return result;
  }

  // -------------------------------------------------------------------- Method



  // -------------------------------------------------------------------- Method

  /**
   * Clear all values
   * - Copy initialValues to value
   */
  clearAllValues()
  {
    const values = this._values;

    for( const key in values )
    {
      const initialValue = this.getInitialValue( key );

      this._values[ key ] = initialValue;

    } // end for

    this._updateFormPristine();
    this._updateFormValid();
  }

  // -------------------------------------------------------------------- Method

  /**
   * Clear the specified value
   * - Copy initialValue to value
   */
  clearValue( key )
  {
    expectString( key, "Missing or invalid parameter [key]" );

    const initialValue = this.getInitialValue( key );

    this._values[ key ] = initialValue;

    this._updateFormPristine();
    this._updateFormValid();
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Parse a value for a form property
   *
   * @param {string} key
   *
   * @returns {object} { value [,error, finalValue] }
   */
  _parseProperty( key, value )
  {
    expectString( key, "Missing or invalid parameter [key]" );

    const schema = this._schema;
    const values = this._values;

    // this.log.debug( `parse property [${key}]`, { value } );

    // if( !touched[ key ] &&
    //     value === initialValues[ key ] )
    // {
    //
    //   // FIXME: and invalid initialValue is a show stopper!
    //
    //   // value is untouched
    //   return { value };
    // }

    values[ key ] = value;

    let output;

    if( schema.validateProperty )
    {
      output = schema.validateProperty( values, key );
    }
    else {
      throw new Error("Schema should have a method [validateProperty]");
      //output = schema.validate( values, { abortEarly: false } );
    }

    // if( output.error )
    // {
    //   errors[ key ] = output.error;
    // }

    values[ key ] = value;

    // this.log.debug( `parse property [${key}] (after validate)`, { value } );

    return output;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Update form property `valid` (store)
   * - Sets property to true if all form  values are valid
   */
  _updateFormValid()
  {
    const values = this._values;

    const { error } =
      this._schema.validate( values, { abortEarly: true } );

    if( !error )
    {
      this.valid.set( true );
    }
    else {
      this.valid.set( false );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Update form property `pristine` (store)
   * - Sets property to true if all form  values equal their initial values
   */
  _updateFormPristine()
  {
    const values = this._values;
    const initialValues = this._initialValues;

    //
    // Value equals intialValue => check all form properties
    //
    const keys = this._keys;

    let pristine = true;

    for( const key of keys )
    {
      if( !equals( values[ key ], initialValues[ key ] ) )
      {
        // console.log(`Property [${key}] has not the initial value`,
        //   {
        //     value: values[ key ],
        //     initialValue: initialValues[ key ]
        //   });

        pristine = false;
        break;
      }
    } // end for

    this.pristine.set( pristine );
  }

} // end class
