interface BuildFieldGuidanceOptions {
  fieldName: string;
  label: string;
  inputType: string;
  isOptional?: boolean;
  isReadOnly?: boolean;
  isSelect?: boolean;
}

const containsAny = (value: string, patterns: string[]) =>
  patterns.some((pattern) => value.includes(pattern));

export function buildFieldGuidance({
  fieldName,
  label,
  inputType,
  isOptional = false,
  isReadOnly = false,
  isSelect = false,
}: BuildFieldGuidanceOptions) {
  const normalizedName = fieldName.toLowerCase();
  const normalizedLabel = label.toLowerCase();

  const notes: string[] = [];

  if (isReadOnly) {
    notes.push("This value is shown for reference and cannot be edited in this form.");
  } else if (normalizedName === "email") {
    notes.push("Enter a valid email address that can receive system communication.");
  } else if (normalizedName === "phone") {
    notes.push("Enter a reachable phone number, including the correct country code when needed.");
  } else if (normalizedName === "website" || normalizedName.endsWith("_link") || normalizedName === "link") {
    notes.push("Enter the full web address, including `https://` when available.");
  } else if (normalizedName === "password") {
    notes.push("Enter a secure password that the user or integration can safely use.");
  } else if (containsAny(normalizedName, ["barcode"])) {
    notes.push("Enter the barcode value exactly as it appears on the product or label.");
  } else if (containsAny(normalizedName, ["sku"])) {
    notes.push("Enter a unique internal SKU code that your team can search and recognize quickly.");
  } else if (containsAny(normalizedName, ["name", "title"]) && normalizedName !== "username") {
    notes.push(`Enter a clear ${normalizedLabel} that users will easily recognize later.`);
  } else if (containsAny(normalizedName, ["description", "notes", "note"])) {
    notes.push(`Provide any extra context users should know about this ${normalizedLabel}.`);
  } else if (containsAny(normalizedName, ["address", "street", "postal_code", "zip"])) {
    notes.push("Enter the physical or mailing location details exactly as they should be stored.");
  } else if (containsAny(normalizedName, ["country"])) {
    notes.push("Select the country that this record belongs to.");
  } else if (containsAny(normalizedName, ["region", "state"])) {
    notes.push("Select the state or region for this record after choosing the country.");
  } else if (containsAny(normalizedName, ["subregion", "province"])) {
    notes.push("Select the subordinate region that best matches the address hierarchy.");
  } else if (containsAny(normalizedName, ["city", "town"])) {
    notes.push("Select the city or locality that matches the record address.");
  } else if (containsAny(normalizedName, ["official", "owner", "assignee"])) {
    notes.push("Select the responsible staff member or official for this record.");
  } else if (containsAny(normalizedName, ["parent"])) {
    notes.push("Select a parent record only if this item should sit under an existing hierarchy.");
  } else if (containsAny(normalizedName, ["location"])) {
    notes.push("Select the location that should own, store, or default this record.");
  } else if (containsAny(normalizedName, ["supplier", "vendor"])) {
    notes.push("Select the supplier associated with this record.");
  } else if (containsAny(normalizedName, ["contact"])) {
    notes.push("Select the contact person tied to the supplier or company for this record.");
  } else if (containsAny(normalizedName, ["category"])) {
    notes.push("Select the category that best groups this record for reporting and search.");
  } else if (containsAny(normalizedName, ["unit", "uom"])) {
    notes.push("Choose the unit of measure that should be used when this record is processed.");
  } else if (containsAny(normalizedName, ["price", "cost", "amount", "value"])) {
    notes.push("Enter the monetary amount using your workspace currency and standard decimal format.");
  } else if (containsAny(normalizedName, ["quantity", "stock", "threshold", "limit", "count"])) {
    notes.push("Enter the numeric quantity or control value that should be used operationally.");
  } else if (containsAny(normalizedName, ["weight"])) {
    notes.push("Enter the weight using the unit expected by the form, typically kilograms.");
  } else if (containsAny(normalizedName, ["dimension", "length", "width", "height", "size"])) {
    notes.push("Enter the measurement details in the format your team expects to report and search.");
  } else if (containsAny(normalizedName, ["discount", "tax", "rate", "percentage", "percent"])) {
    notes.push("Enter the rate or amount carefully, because it affects pricing and downstream calculations.");
  } else if (containsAny(normalizedName, ["date"])) {
    notes.push("Choose the calendar date that applies to this record.");
  } else if (containsAny(normalizedName, ["time"]) || inputType === "datetime-local") {
    notes.push("Choose the exact date and time that should be stored for this record.");
  }

  if (notes.length === 0) {
    if (inputType === "checkbox") {
      notes.push(`Turn this on when ${normalizedLabel} should be enabled for this record.`);
    } else if (isSelect || inputType === "select" || inputType === "geo-select") {
      notes.push(`Choose the ${normalizedLabel} that best matches this record.`);
    } else if (inputType === "number" || inputType === "percentage") {
      notes.push(`Enter a numeric value for ${normalizedLabel}.`);
    } else if (inputType === "date") {
      notes.push(`Choose the date to use for ${normalizedLabel}.`);
    } else if (inputType === "phone") {
      notes.push(`Enter the ${normalizedLabel} in a reachable phone-number format.`);
    } else {
      notes.push(`Enter the ${normalizedLabel} for this record.`);
    }
  }

  if (isOptional) {
    notes.push("You can leave this blank if it does not apply.");
  }

  return notes.join(" ");
}
