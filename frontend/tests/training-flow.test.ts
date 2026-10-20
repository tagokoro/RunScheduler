import assert from "node:assert/strict";
import { test } from "node:test";
import {
  durationInput,
  durationSeconds,
  formatDuration,
} from "../src/lib/profile-time";
import { trainingToday } from "../src/lib/date";

test("race times convert without losing seconds and reject invalid input", () => {
  assert.equal(durationSeconds("4:30:15"), 16215);
  assert.equal(durationInput(16215), "4:30:15");
  assert.equal(formatDuration(16215), "4時間30分15秒");
  assert.equal(durationSeconds("0:25:00"), 1500);
  assert.equal(durationInput(null), "");
  assert.equal(formatDuration(null), "未登録");
  for (const value of ["4:60:00", "-1:30:00", "4:30", "14400", "invalid"]) {
    assert.equal(durationSeconds(value), null);
  }
});

test("today switches at midnight in Japan, independent of the server timezone", () => {
  assert.equal(trainingToday(new Date("2026-10-20T14:59:59Z")), "2026-10-20");
  assert.equal(trainingToday(new Date("2026-10-20T15:00:00Z")), "2026-10-21");
});
