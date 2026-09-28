export const getFrontendOrigin = () =>
  typeof window === "undefined" ? "" : window.location.origin

export const setFrontendOriginHeader = (headers: Headers) => {
  const origin = getFrontendOrigin()
  if (origin) headers.set("X-Intera-Frontend-Origin", origin)
  return headers
}
