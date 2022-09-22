
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
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

    this.pristine = new DedupValueStore( true );
    this.valid = new DedupValueStore( false );

    this._schema = schema;
    this._initialValues = initialValues;
    this._values = {};

    const schemaProperties = schema.describe().keys;

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

    // this.touched = {};
    // this.errors = {};
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
   *
   * --
   *
   * @note This method returns and update handler.
   *       It does not handle updates
   *
   * --
   *
   * @param {string} key
   *
   * @returns {function} update handler
   */
  updateHandler( key )
  {
    expectString( key, "Missing or invalid parameter [key]" );

    // == Return update handler for specified key

    return ( event ) => {

      const updatedValue = event.detail;

      const { value,
              error,
              finalValue } = this._parseProperty( key, updatedValue );

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

      // == Update valid (validate all form properties)

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

    };
  }



  // -------------------------------------------------------------------- Method

  /**
   * Reset all values
   * - Copy initialValues to values
   */
  // reset() {}

  // -------------------------------------------------------------------- Method

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

} // end class
