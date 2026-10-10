// Client picture (#39): the concern ledger read as kinds, from a topic prefix.
import { describe, expect, it } from "vitest";
import { clientPicture, kindOf } from "@/components/meeting/picture";
import { followUpTasks } from "@/components/meeting/replay";
import type { Concern } from "@/lib/types";

const c = (id: string, topic: string, status: Concern["status"] = "open"): Concern => ({
  id,
  topic,
  status,
  raisedAtTurn: "t2",
  ...(status === "resolved" ? { resolvedAtTurn: "t4" } : {}),
});

describe("kindOf", () => {
  it("reads the kind from the topic prefix and strips it", () => {
    expect(kindOf("life event: son's down payment")).toEqual({ kind: "life event", text: "son's down payment" });
    expect(kindOf("Request:  send college options")).toEqual({ kind: "request", text: "send college options" });
    expect(kindOf("learn: how the reserve works")).toEqual({ kind: "learn", text: "how the reserve works" });
    expect(kindOf("decide: start now or wait")).toEqual({ kind: "decide", text: "start now or wait" });
  });

  it("treats an untagged topic as a worry, unchanged", () => {
    expect(kindOf("liquidity")).toEqual({ kind: "worry", text: "liquidity" });
    expect(kindOf("worry: market timing")).toEqual({ kind: "worry", text: "market timing" });
  });
});

describe("clientPicture", () => {
  it("groups concerns by kind in a fixed order, skipping empty kinds, open before resolved", () => {
    const groups = clientPicture([
      c("1", "request: send college options"),
      c("2", "liquidity", "resolved"),
      c("3", "life event: son's down payment"),
      c("4", "market timing"),
    ]);
    expect(groups.map((g) => g.kind)).toEqual(["worry", "life event", "request"]);
    expect(groups[0].items.map((i) => i.text)).toEqual(["market timing", "liquidity"]);
    expect(groups[1].items[0].text).toBe("son's down payment");
  });

  it("is empty for no concerns", () => {
    expect(clientPicture([])).toEqual([]);
  });
});

describe("followUpTasks", () => {
  it("names an item by its text, without the raw prefix", () => {
    const [task] = followUpTasks([c("1", "request: send college options")], "Dana Whitfield");
    expect(task).toContain("send college options");
    expect(task).not.toContain("request:");
  });
});
