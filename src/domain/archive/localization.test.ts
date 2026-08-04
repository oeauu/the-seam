import { describe, expect, it } from "vitest";
import { getLocalizedText, resolveLocalizedText } from "./index";

describe("archive localization", () => {
  it("prefers the requested language", () => {
    expect(getLocalizedText({ en: "Archive", zh: "档案" }, "zh")).toBe("档案");
  });

  it("falls back to the requested fallback language and then the remaining text", () => {
    expect(resolveLocalizedText({ en: "Archive", zh: "", original: "Archiv" }, "zh")).toBe("Archive");
    expect(resolveLocalizedText({ en: "", zh: "档案", original: "Archiv" }, "en")).toBe("档案");
    expect(resolveLocalizedText({ en: "", zh: "", original: "Archiv" }, "en")).toBe("Archiv");
  });

  it("trims selected and fallback values", () => {
    expect(getLocalizedText({ en: "  Archive  ", zh: "" }, "zh")).toBe("Archive");
  });
});
