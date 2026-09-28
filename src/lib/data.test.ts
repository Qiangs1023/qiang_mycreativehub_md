// src/lib/data.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWritings, findWriting } from "./data";

test("loadWritings returns array from placeholder", () => {
  const writings = loadWritings();
  assert.ok(Array.isArray(writings));
});

test("findWriting returns undefined for non-existent slug", () => {
  assert.equal(findWriting("non-existent"), undefined);
});