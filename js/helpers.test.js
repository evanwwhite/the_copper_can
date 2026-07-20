import { describe, expect, test } from "bun:test";

import {
  makeBox,
  makeBoxFrame,
  makeMessageBox,
} from "./helpers.js";

describe("ASCII text boxes", () => {
  test("uses the shared +, -, and | frame", () => {
    expect(makeBox("NPC", ["Hello"], 7)).toBe([
      "+-----------+",
      "|    NPC    |",
      "+-----------+",
      "|  Hello    |",
      "+-----------+",
    ].join("\n"));
  });

  test("wraps dialogue without changing the frame width", () => {
    const box = makeBox("MESSAGE", ["one two three"], 7);
    const lines = box.split("\n");

    expect(lines).toContain("|  one two  |");
    expect(lines).toContain("|  three    |");
    expect(new Set(lines.map(line => line.length))).toEqual(new Set([13]));
  });

  test("exposes matching frame pieces for rich scrolling panels", () => {
    expect(makeBoxFrame("COMBAT", 6)).toEqual({
      header: "+----------+\n|  COMBAT  |\n+----------+",
      footer: "+----------+",
    });
  });

  test("omits an empty message", () => {
    expect(makeMessageBox("")).toBe("");
  });
});
