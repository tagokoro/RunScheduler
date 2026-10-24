import assert from "node:assert/strict";
import { test } from "node:test";
import { getCarouselPage } from "../src/lib/carousel";

test("all nine records remain reachable on desktop, including the final single card", () => {
  const seen: number[] = [];
  let start = 0;
  while (true) {
    const page = getCarouselPage(9, start, 2);
    seen.push(
      ...Array.from(
        { length: page.end - page.start },
        (_, i) => page.start + i,
      ),
    );
    if (!page.hasNext) {
      assert.deepEqual(page, {
        start: 8,
        end: 9,
        hasPrevious: true,
        hasNext: false,
      });
      break;
    }
    start = page.end;
  }
  assert.deepEqual(seen, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
});

test("mobile shows a single record and does not navigate outside the list", () => {
  assert.deepEqual(getCarouselPage(1, 0, 1), {
    start: 0,
    end: 1,
    hasPrevious: false,
    hasNext: false,
  });
  assert.equal(getCarouselPage(9, -1, 1).start, 0);
  assert.equal(getCarouselPage(9, 99, 1).start, 8);
});

test("deletion or resizing keeps a valid visible page", () => {
  assert.deepEqual(getCarouselPage(4, 4, 2), {
    start: 2,
    end: 4,
    hasPrevious: true,
    hasNext: false,
  });
  assert.equal(getCarouselPage(9, 5, 2).start, 4);
  assert.equal(getCarouselPage(9, 4, 1).start, 4);
  assert.deepEqual(getCarouselPage(0, 4, 2), {
    start: 0,
    end: 0,
    hasPrevious: false,
    hasNext: false,
  });
});
