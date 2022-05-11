
export async function getCustomAliases(
  {
    resolveCurrentLibPath
  } )
{
  return {
    "@platform": resolveCurrentLibPath()
  };
}