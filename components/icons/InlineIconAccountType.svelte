<script>

/* ------------------------------------------------------------------ Imports */

import InlineIcon
  from "@hkd-fe/components/icons/InlineIcon.svelte";

import Sparkles
  from "@hkd-fe/components/icons/hero/outline/Sparkles.svelte";

import AcademicCap
  from "@hkd-fe/components/icons/hero/outline/AcademicCap.svelte";

import BuildingOffice
  from "@hkd-fe/components/icons/hero/outline/BuildingOffice.svelte";

import FaceFrown
  from "@hkd-fe/components/icons/hero/outline/FaceFrown.svelte";

import { IS_SCHOOL_ACCOUNT,
         IS_COMPANY_ACCOUNT,
         IS_OPERATOR_ACCOUNT }
  from "@jetnet-loket/constants/accounts.js";

import { getModuleLogger }
  from "@hkd-base/helpers/log.js";

const log = getModuleLogger( "InlineIconAccounType.svelte" );

/* ---------------------------------------------------------------- Internals */

let icon;

let cssClassNames = "";

/* ------------------------------------------------------------------ Exports */

export { cssClassNames as class };

export let onColor;

export let account;

export let hideSadFace = false;

/* ----------------------------------------------------------------- Reactive */

$: {
  //
  // Select icon based on the account type
  //
  if( account )
  {
    if( account[ IS_OPERATOR_ACCOUNT ] )
    {
      icon = Sparkles;
    }
    else if( account[ IS_SCHOOL_ACCOUNT ] )
    {
      icon = AcademicCap;
    }
    else if( account[ IS_COMPANY_ACCOUNT ] )
    {
      icon = BuildingOffice;
    }
    else {
      icon = FaceFrown;
      // log.error(
      //   `Cannot determine account type from [account=${account._id||""}]`);
    }
  }
}

</script>

{#if icon && (icon !== FaceFrown || !hideSadFace) }
  <InlineIcon
    {onColor}
    content={icon}
    class={cssClassNames} />
{/if}