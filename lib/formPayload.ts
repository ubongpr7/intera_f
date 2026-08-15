type FieldKey = string | number | symbol;

const DATE_FIELD_HINTS = ["date", "expires_at", "started_at", "ended_at", "created_at", "updated_at"];

const NUMERIC_FIELD_HINTS = [
  "amount",
  "capacity",
  "count",
  "discount",
  "height",
  "level",
  "limit",
  "margin",
  "multiplier",
  "percentage",
  "price",
  "priority",
  "quantity",
  "rate",
  "score",
  "threshold",
  "value",
  "weight",
  "width",
];

const isBlankString = (value: unknown) => typeof value === "string" && value.trim() === "";

const looksNumericField = (fieldName: string) => {
  const normalized = fieldName.toLowerCase();
  return NUMERIC_FIELD_HINTS.some((hint) => normalized === hint || normalized.endsWith(`_${hint}`) || normalized.includes(`_${hint}_`));
};

const looksDateField = (fieldName: string) => {
  const normalized = fieldName.toLowerCase();
  return DATE_FIELD_HINTS.some((hint) => normalized === hint || normalized.endsWith(`_${hint}`));
};

const shouldKeepBlankString = (fieldName: string) => {
  const normalized = fieldName.toLowerCase();
  return ["description", "notes", "name", "title", "email", "phone", "website", "link"].some(
    (field) => normalized === field || normalized.endsWith(`_${field}`),
  );
};

export function normalizeFormPayload<T extends Record<FieldKey, unknown>>(
  formData: Partial<T>,
  options: {
    optionalFields?: FieldKey[];
    hiddenFields?: Partial<T>;
    dateFields?: FieldKey[];
    datetimeFields?: FieldKey[];
  } = {},
): Partial<T> {
  const optionalFields = new Set((options.optionalFields ?? []).map(String));
  const dateFields = new Set([...(options.dateFields ?? []), ...(options.datetimeFields ?? [])].map(String));
  const payload: Partial<T> = {};

  Object.entries(formData).forEach(([key, rawValue]) => {
    const isOptional = optionalFields.has(key);

    if (isBlankString(rawValue)) {
      if (isOptional && (looksNumericField(key) || looksDateField(key) || dateFields.has(key))) {
        payload[key as keyof T] = null as T[keyof T];
        return;
      }
      if (isOptional && !shouldKeepBlankString(key)) {
        payload[key as keyof T] = null as T[keyof T];
        return;
      }
    }

    payload[key as keyof T] = rawValue as T[keyof T];
  });

  return {
    ...payload,
    ...(options.hiddenFields ?? {}),
  };
}
