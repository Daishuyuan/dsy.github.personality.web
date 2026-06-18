import { describe, expect, it } from "vitest";
import { runAlgorithm } from "../algorithms";
import { splitIpAddress } from "../algorithms/ipAddressSplit";

describe("splitIpAddress", () => {
  it("returns valid IPv4 splits", () => {
    expect(splitIpAddress("25525511135")).toEqual(["255.255.11.135", "255.255.111.35"]);
  });

  it("rejects invalid input", () => {
    expect(splitIpAddress("123")).toEqual([]);
    expect(splitIpAddress("abc12345")).toEqual([]);
  });

  it("returns empty result when no split exists", () => {
    expect(splitIpAddress("256256256256")).toEqual([]);
  });

  it("runs from raw digit input and dotted candidate input", () => {
    const raw = runAlgorithm("ip-address-split", { address: "25525511135" });
    const dotted = runAlgorithm("ip-address-split", { address: "255.255.11.135" });

    expect(raw.lines).toContain("255.255.11.135");
    expect(raw.lines).toContain("255.255.111.35");
    expect(dotted.lines).toContain("255.255.111.35");
  });
});
