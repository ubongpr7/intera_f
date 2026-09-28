import assert from "node:assert/strict"
import test from "node:test"

import { setFrontendOriginHeader } from "../lib/frontendOrigin.ts"

test("frontend API headers include the browser origin", () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { origin: "https://dev.interaims.com" } },
  })

  const headers = setFrontendOriginHeader(new Headers())
  assert.equal(headers.get("X-Intera-Frontend-Origin"), "https://dev.interaims.com")
})
