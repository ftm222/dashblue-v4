import { describe, it, expect } from "vitest";
import { fmtCurrency, fmtShortCurrency, initials } from "@/lib/squad-utils";

describe("fmtCurrency", () => {
  it("should format number as BRL currency", () => {
    const result = fmtCurrency(1234.56);
    expect(result).toContain("1.234");
  });
});

describe("fmtShortCurrency", () => {
  it("should format large numbers with K suffix", () => {
    const result = fmtShortCurrency(15000);
    expect(result).toContain("15");
  });

  it("should format millions with M suffix", () => {
    const result = fmtShortCurrency(2500000);
    expect(result).toContain("2");
  });
});

describe("initials", () => {
  it("should return first letters of first and last name", () => {
    expect(initials("João Silva")).toBe("JS");
  });

  it("should handle single name", () => {
    expect(initials("Maria")).toBe("M");
  });

  it("should handle empty string", () => {
    expect(initials("")).toBe("");
  });
});
