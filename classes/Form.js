
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectNotEmptyString,
  expectDefined,
  expectObject } from "@hkd-base/helpers/expect.js";

import { equals } from "@hkd-base/helpers/compare.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

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

    const values =
      this._values = {};

    this._flags = {};

    const schemaProperties = schema.describe().keys;

    // this.log.debug( "schemaProperties", schemaProperties );

    const keys = Object.keys( schemaProperties );

    this._keys = keys;

    // == Update missing intialValues using schema and store flags

    for( const key in schemaProperties )
    {
      values[ key ] = new ValueStore();

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

      this._flags[ key ] = flags || {};

    } // end for

    // == Initialize values

    for( const key in initialValues )
    {
      values[ key ].set( initialValues[ key ] );
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

    if( !this._values[ key ] )
    {
      throw new Error(
        `Cannot get update handler. ` +
        `Form property [${key}] has not been defined` );
    }

    // == Return update handler for specified key

    /**
     * Update handler
     * - Accepts an input component event
     *
     * @param {object} event
     * @param {*} event.detail - Updated value
     */
    return ( event ) => {

      const detail = event.detail;

      // console.log( "formPropertyUpdate", {key, ...detail } );

      expectObject( detail,
        "Missing or invalid parameter [event.detail]" );

      let updatedValue;

      if( "updatedValue" in detail )
      {
        updatedValue = detail.updatedValue;
      }
      else if( "value" in detail )
      {
        updatedValue = detail.value;
      }
      else {
        throw new Error(
          "Missing property [updatedValue] or [value] in [event.detail]");
      }

      expectDefined( updatedValue,
        "Missing or invalid parameter [event.detail.updatedValue]" );

      this.setValue( key, updatedValue );
    };
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set a form property value
   *
   * @note
   *   Consider using `updateHandler` to interact with a Form instance.
   *
   *   - Use an input component and supply it and `updateHandler`
   *   - Set the value on the input component and let the input component call
   *     the updateHandler
   *
   * @param {string} key
   * @param {*} updatedValue
   *
   */
  setValue( key, updatedValue )
  {
    expectString( key,
      "Missing or invalid parameter [key]" );

    expectDefined( updatedValue,
      "Missing or invalid parameter [updatedValue]" );

    const { value,
            error,
            /*finalValue*/ } = this._parseProperty( key, updatedValue );

    // this.log.debug(
    //   "updateHandler",
    //   { key, updatedValue, value, error, finalValue, values: this._values } );

    // == Store value

    if( error )
    {
      //
      // Parsing failed -> set `raw unparsed value`
      //
      this._values[ key ].set( updatedValue );
    }
    else {
      //
      // Set parsed value
      //
      this._values[ key ].set( value );
    }

    // == Update pristine

    const initialValues = this._initialValues;
    const values = this._values;

    // this.log.debug( "CHECK",
    //   {
    //     values,
    //     value: values[ key ],
    //     initialValue: initialValues[ key ]
    //   } );

    if( !equals( values[ key ].get(), initialValues[ key ] ) )
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
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get a store that returns the value currently set in the form data
   * - The value may or may not be valid
   *
   * @param {string} key
   *
   * @returns {object} value store
   */
  getValueStore( key )
  {
    expectNotEmptyString( key,
      "Missing or invalid parameter [key]" );

    return this._values[ key ];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Returns true if a value is optional
   *
   * @param {string} key
   *
   * @returns {boolean} true if the value is optional
   */
  isOptional( key )
  {
    expectNotEmptyString( key,
      "Missing or invalid parameter [key]" );

    // return !this._schema._required.includes( key );

    return this._flags[ key ].presence === "optional";
  }

  // -------------------------------------------------------------------- Method

  /**
   * Returns the input type of the parser
   *
   * @param {string} key
   *
   * @returns {string} type
   */
  inputType( key )
  {
    expectNotEmptyString( key,
      "Missing or invalid parameter [key]" );

    const properties = this._schema._keys[ key ];

    if( ! properties )
    {
      throw new Error(`Form property [${key}] does not exist`);
    }

    return properties.type || "text";
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

    // const exportValues = {};

    // const values = this._values;

    // for( let key in values )
    // {
    //   exportValues[ key ] = values[ key ].get();
    // }

    const {
      value: formData,
      error } =
        this._schema.validate(
          this._values,
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
   * @returns {object} {
   *   value: <*>,
   *   finalValue: <*>,
   *   valid: <boolean> }
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

    const { finalValue, error } =
      this._schema.validateProperty( values, key );

    const result = { value: values[ key ].get() };

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

      if( !("finalValue" in result) )
      {
        result.finalValue = result.value;
      }
    }

    return result;
  }

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

      this._values[ key ].set( initialValue );

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

    this._values[ key ].set( initialValue );

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

    if( !values[ key ] )
    {
      throw new Error(
        `Cannot parse property. ` +
        `Form property [${key}] has not been defined` );
    }

    values[ key ].set( value );

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

    values[ key ].set( value );

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

    // this.log.debug("_updateFormValid", error );

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
      if( !equals( values[ key ].get(), initialValues[ key ] ) )
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
