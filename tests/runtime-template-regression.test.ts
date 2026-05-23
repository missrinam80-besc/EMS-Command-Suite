import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateRuntimeFieldVisibility,
  extractRuntimeFieldValues,
  formatRuntimeFieldValue,
  validateRuntimeFieldValues,
  type RuntimeReportField,
} from "../src/lib/report-template-runtime";

function baseField(overrides: Partial<RuntimeReportField>): RuntimeReportField {
  return {
    id: "field-1",
    sectionKey: "general",
    fieldKey: "severity",
    label: "Severity",
    fieldType: "text",
    placeholder: null,
    helpText: null,
    options: [],
    isRequired: false,
    sortOrder: 100,
    validationRules: {},
    conditionalLogic: {},
    ...overrides,
  };
}

test("formatRuntimeFieldValue formats checkbox values", () => {
  assert.equal(formatRuntimeFieldValue(true, "checkbox"), "Ja");
  assert.equal(formatRuntimeFieldValue(false, "checkbox"), "Nee");
});

test("formatRuntimeFieldValue formats array values", () => {
  assert.equal(formatRuntimeFieldValue(["A", "B"], "multiselect"), "A, B");
  assert.equal(formatRuntimeFieldValue([], "multiselect"), "Niet ingevuld");
});

test("evaluateRuntimeFieldVisibility supports gt and lt", () => {
  const gtField = baseField({
    conditionalLogic: { when: { field: "score", operator: "gt", value: 5 } },
  });
  const ltField = baseField({
    conditionalLogic: { when: { field: "score", operator: "lt", value: 5 } },
  });

  assert.equal(evaluateRuntimeFieldVisibility(gtField, { score: 6 }), true);
  assert.equal(evaluateRuntimeFieldVisibility(gtField, { score: 4 }), false);
  assert.equal(evaluateRuntimeFieldVisibility(ltField, { score: 4 }), true);
  assert.equal(evaluateRuntimeFieldVisibility(ltField, { score: 6 }), false);
});

test("evaluateRuntimeFieldVisibility supports in and not_in", () => {
  const inField = baseField({
    conditionalLogic: { when: { field: "priority", operator: "in", value: ["P1", "P2"] } },
  });
  const notInField = baseField({
    conditionalLogic: { when: { field: "priority", operator: "not_in", value: ["P1", "P2"] } },
  });

  assert.equal(evaluateRuntimeFieldVisibility(inField, { priority: "P1" }), true);
  assert.equal(evaluateRuntimeFieldVisibility(inField, { priority: "P3" }), false);
  assert.equal(evaluateRuntimeFieldVisibility(notInField, { priority: "P3" }), true);
  assert.equal(evaluateRuntimeFieldVisibility(notInField, { priority: "P1" }), false);
});

test("validateRuntimeFieldValues keeps conditional required aligned", () => {
  const dependentField = baseField({
    fieldKey: "notes",
    label: "Notities",
    isRequired: true,
    conditionalLogic: { when: { field: "priority", operator: "equals", value: "P1" } },
  });

  const hiddenErrors = validateRuntimeFieldValues({ priority: "P2", notes: "" }, [dependentField]);
  const visibleErrors = validateRuntimeFieldValues({ priority: "P1", notes: "" }, [dependentField]);

  assert.equal(hiddenErrors.length, 0);
  assert.equal(visibleErrors.length, 1);
  assert.match(visibleErrors[0], /verplicht/i);
});

test("extractRuntimeFieldValues maps multiselect and checkbox correctly", () => {
  const fields: RuntimeReportField[] = [
    baseField({ fieldKey: "tags", fieldType: "multiselect" }),
    baseField({ fieldKey: "approved", fieldType: "checkbox" }),
    baseField({ fieldKey: "notes", fieldType: "text" }),
  ];

  const formData = new FormData();
  formData.append("tags", "alpha");
  formData.append("tags", "beta");
  formData.append("approved", "on");
  formData.append("notes", "  hello world  ");

  const extracted = extractRuntimeFieldValues(formData, fields);
  assert.deepEqual(extracted.tags, ["alpha", "beta"]);
  assert.equal(extracted.approved, true);
  assert.equal(extracted.notes, "hello world");
});

test("extractRuntimeFieldValues maps missing checkbox to false", () => {
  const fields: RuntimeReportField[] = [baseField({ fieldKey: "approved", fieldType: "checkbox" })];
  const formData = new FormData();
  const extracted = extractRuntimeFieldValues(formData, fields);
  assert.equal(extracted.approved, false);
});

test("extractRuntimeFieldValues maps number field to numeric value", () => {
  const fields: RuntimeReportField[] = [baseField({ fieldKey: "score", fieldType: "number" })];

  const withValue = new FormData();
  withValue.append("score", "42");
  const extractedWithValue = extractRuntimeFieldValues(withValue, fields);
  assert.equal(extractedWithValue.score, 42);

  const missingValue = new FormData();
  const extractedMissingValue = extractRuntimeFieldValues(missingValue, fields);
  assert.equal(extractedMissingValue.score, 0);
});
