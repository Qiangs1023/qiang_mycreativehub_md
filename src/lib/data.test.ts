// src/lib/data.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadWritings, findWriting, byDateDesc, byOrderAsc, neighbours } from "./data";

test("loadWritings returns array from placeholder", () => {
  const writings = loadWritings();
  assert.ok(Array.isArray(writings));
});

test("findWriting returns undefined for non-existent slug", () => {
  assert.equal(findWriting("non-existent"), undefined);
});

test("byDateDesc sorts by publishedAt desc, falls back to date", () => {
  const items = [
    { slug: "a", date: "2025-01-01", publishedAt: "2025-06-01" },
    { slug: "b", date: "2025-03-01", publishedAt: "2025-05-01" },
    { slug: "c", date: "2025-02-01", publishedAt: undefined },
  ];
  const sorted = items.slice().sort(byDateDesc);
  assert.deepEqual(sorted.map((i) => i.slug), ["a", "b", "c"]);
});

test("byDateDesc handles missing publishedAt and date", () => {
  const items = [{ slug: "x" }, { slug: "y", date: "2025-01-01" }];
  const sorted = items.slice().sort(byDateDesc);
  assert.equal(sorted.length, 2);
});

test("byOrderAsc sorts by order ascending", () => {
  const items = [{ order: 3 }, { order: 1 }, { order: 2 }];
  const sorted = items.slice().sort(byOrderAsc);
  assert.deepEqual(sorted.map((i) => i.order), [1, 2, 3]);
});

test("neighbours returns undefined for missing slug", () => {
  const coll = [{ slug: "a" }, { slug: "b" }];
  const result = neighbours(coll, "missing");
  assert.equal(result.prev, undefined);
  assert.equal(result.next, undefined);
});

test("neighbours returns prev only for last item", () => {
  const coll = [{ slug: "a" }, { slug: "b" }];
  const result = neighbours(coll, "b");
  assert.deepEqual(result.prev, { slug: "a" });
  assert.equal(result.next, undefined);
});

test("neighbours returns next only for first item", () => {
  const coll = [{ slug: "a" }, { slug: "b" }];
  const result = neighbours(coll, "a");
  assert.equal(result.prev, undefined);
  assert.deepEqual(result.next, { slug: "b" });
});

test("neighbours returns both for middle item", () => {
  const coll = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];
  const result = neighbours(coll, "b");
  assert.deepEqual(result.prev, { slug: "a" });
  assert.deepEqual(result.next, { slug: "c" });
});

test("neighbours returns undefined for both in single-element collection", () => {
  const coll = [{ slug: "only" }];
  const result = neighbours(coll, "only");
  assert.equal(result.prev, undefined);
  assert.equal(result.next, undefined);
});