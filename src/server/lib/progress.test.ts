import { expect, test, describe } from "bun:test";
import { calculateProgress, isCompleted, generateSlug } from "./progress";

describe("calculateProgress", () => {
  test("returns 0 when no lessons exist", () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  test("returns 0 when no lessons completed", () => {
    expect(calculateProgress(0, 5)).toBe(0);
  });

  test("returns 100 when all lessons completed", () => {
    expect(calculateProgress(5, 5)).toBe(100);
  });

  test("returns correct percentage for partial completion", () => {
    expect(calculateProgress(1, 4)).toBe(25);
    expect(calculateProgress(2, 4)).toBe(50);
    expect(calculateProgress(3, 4)).toBe(75);
  });

  test("rounds to nearest integer", () => {
    expect(calculateProgress(1, 3)).toBe(33);
    expect(calculateProgress(2, 3)).toBe(67);
  });

  test("caps at 100 when completed exceeds total", () => {
    expect(calculateProgress(6, 5)).toBe(100);
  });
});

describe("isCompleted", () => {
  test("returns false for 0%", () => {
    expect(isCompleted(0)).toBe(false);
  });

  test("returns false for partial completion", () => {
    expect(isCompleted(50)).toBe(false);
    expect(isCompleted(99)).toBe(false);
  });

  test("returns true for 100%", () => {
    expect(isCompleted(100)).toBe(true);
  });

  test("returns true for over 100%", () => {
    expect(isCompleted(105)).toBe(true);
  });
});

describe("generateSlug", () => {
  test("converts to lowercase", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  test("replaces spaces with hyphens", () => {
    expect(generateSlug("ancient egypt")).toBe("ancient-egypt");
  });

  test("removes special characters", () => {
    expect(generateSlug("Hello! World?")).toBe("hello-world");
  });

  test("handles multiple spaces", () => {
    expect(generateSlug("hello   world")).toBe("hello-world");
  });

  test("trims whitespace", () => {
    expect(generateSlug("  hello world  ")).toBe("hello-world");
  });

  test("removes leading and trailing hyphens", () => {
    expect(generateSlug("-hello-world-")).toBe("hello-world");
  });

  test("handles numbers", () => {
    expect(generateSlug("Chapter 1")).toBe("chapter-1");
  });
});
