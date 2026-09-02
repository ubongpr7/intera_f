import assert from "node:assert/strict"
import test from "node:test"

import { normalizeFormPayload } from "../lib/formPayload.ts"

test("keeps optional dimensions overrides as an empty string", () => {
  const payload = normalizeFormPayload(
    { dimensions_override: "", price_override: "" },
    { optionalFields: ["dimensions_override", "price_override"] },
  )

  assert.equal(payload.dimensions_override, "")
  assert.equal(payload.price_override, null)
})
