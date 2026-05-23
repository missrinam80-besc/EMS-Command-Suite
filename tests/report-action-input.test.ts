import assert from "node:assert/strict";
import test from "node:test";
import { mapOpnameReportInput, mapTraumaReportInput } from "../src/lib/report-action-input";
import type { RuntimeReportTemplate } from "../src/lib/report-template-runtime";

function createTemplate(): RuntimeReportTemplate {
  return {
    id: "tpl-1",
    code: "trauma_runtime",
    label: "Trauma Runtime",
    reportTypeCode: "trauma",
    fields: [
      {
        id: "f1",
        sectionKey: "general",
        fieldKey: "priorityTags",
        label: "Priority tags",
        fieldType: "multiselect",
        placeholder: null,
        helpText: null,
        options: ["P1", "P2"],
        isRequired: false,
        sortOrder: 1,
        validationRules: {},
        conditionalLogic: {},
      },
      {
        id: "f2",
        sectionKey: "general",
        fieldKey: "escalated",
        label: "Escalated",
        fieldType: "checkbox",
        placeholder: null,
        helpText: null,
        options: [],
        isRequired: false,
        sortOrder: 2,
        validationRules: {},
        conditionalLogic: {},
      },
    ],
  };
}

test("mapTraumaReportInput maps core and dynamic fields", () => {
  const formData = new FormData();
  formData.append("patientId", "pat-1");
  formData.append("caseId", "case-1");
  formData.append("title", "Trauma report");
  formData.append("summary", "Summary");
  formData.append("incidentLocation", "Dock");
  formData.append("priorityTags", "P1");
  formData.append("priorityTags", "P2");
  formData.append("escalated", "on");

  const input = mapTraumaReportInput(formData, createTemplate());

  assert.equal(input.patientId, "pat-1");
  assert.equal(input.caseId, "case-1");
  assert.equal(input.title, "Trauma report");
  assert.equal(input.incidentLocation, "Dock");
  assert.equal(input.templateCode, "trauma_runtime");
  assert.deepEqual(input.dynamicFields?.priorityTags, ["P1", "P2"]);
  assert.equal(input.dynamicFields?.escalated, true);
});

test("mapTraumaReportInput handles missing template", () => {
  const formData = new FormData();
  formData.append("patientId", "pat-2");
  formData.append("title", "No template");
  formData.append("summary", "Summary");

  const input = mapTraumaReportInput(formData, null);
  assert.equal(input.templateCode, "");
  assert.deepEqual(input.dynamicFields, {});
});

test("mapOpnameReportInput maps fields and templateCode", () => {
  const formData = new FormData();
  formData.append("patientId", "pat-3");
  formData.append("caseId", "case-3");
  formData.append("title", "Opname report");
  formData.append("summary", "Summary");
  formData.append("admissionReason", "Observatie");
  formData.append("priorityTags", "P1");
  formData.append("escalated", "on");

  const template = { ...createTemplate(), reportTypeCode: "opname", code: "opname_runtime" };
  const input = mapOpnameReportInput(formData, template);

  assert.equal(input.patientId, "pat-3");
  assert.equal(input.caseId, "case-3");
  assert.equal(input.admissionReason, "Observatie");
  assert.equal(input.templateCode, "opname_runtime");
  assert.deepEqual(input.dynamicFields?.priorityTags, ["P1"]);
  assert.equal(input.dynamicFields?.escalated, true);
});
