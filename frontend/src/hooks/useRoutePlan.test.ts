import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRoutePlan } from "./useRoutePlan";
import type { LngLat } from "../types/route.types";

const P = (i: number): LngLat => [151.2 + i * 0.01, -33.86 - i * 0.01];

describe("useRoutePlan reducer", () => {
  it("first addPoint sets start", () => {
    const { result } = renderHook(() => useRoutePlan());
    act(() => result.current[1]({ type: "addPoint", point: P(0) }));
    const [plan] = result.current;
    expect(plan.start).toEqual(P(0));
    expect(plan.waypoints).toEqual([]);
  });

  it("subsequent addPoints append waypoints", () => {
    const { result } = renderHook(() => useRoutePlan());
    act(() => result.current[1]({ type: "addPoint", point: P(0) }));
    act(() => result.current[1]({ type: "addPoint", point: P(1) }));
    act(() => result.current[1]({ type: "addPoint", point: P(2) }));
    const [plan] = result.current;
    expect(plan.start).toEqual(P(0));
    expect(plan.waypoints).toEqual([P(1), P(2)]);
  });

  it("p2p + setEndNext makes the next point the end", () => {
    const { result } = renderHook(() => useRoutePlan());
    act(() => result.current[1]({ type: "addPoint", point: P(0) })); // start
    act(() => result.current[1]({ type: "setMode", mode: "p2p" }));
    act(() => result.current[1]({ type: "addPoint", point: P(1) })); // waypoint
    act(() => result.current[1]({ type: "setEndNext" }));
    act(() => result.current[1]({ type: "addPoint", point: P(2) })); // end
    const [plan] = result.current;
    expect(plan.mode).toBe("p2p");
    expect(plan.waypoints).toEqual([P(1)]);
    expect(plan.end).toEqual(P(2));
    expect(plan.endNext).toBe(false);
  });

  it("removePoint(0) promotes the first waypoint to start", () => {
    const { result } = renderHook(() => useRoutePlan());
    act(() => result.current[1]({ type: "addPoint", point: P(0) }));
    act(() => result.current[1]({ type: "addPoint", point: P(1) }));
    act(() => result.current[1]({ type: "addPoint", point: P(2) }));
    act(() => result.current[1]({ type: "removePoint", index: 0 }));
    const [plan] = result.current;
    expect(plan.start).toEqual(P(1));
    expect(plan.waypoints).toEqual([P(2)]);
  });

  it("removePoint(0) with no waypoints clears start", () => {
    const { result } = renderHook(() => useRoutePlan());
    act(() => result.current[1]({ type: "addPoint", point: P(0) }));
    act(() => result.current[1]({ type: "removePoint", index: 0 }));
    const [plan] = result.current;
    expect(plan.start).toBeNull();
  });

  it("reorderWaypoint moves waypoints correctly", () => {
    const { result } = renderHook(() => useRoutePlan());
    act(() => result.current[1]({ type: "addPoint", point: P(0) })); // start
    act(() => result.current[1]({ type: "addPoint", point: P(1) })); // wp0
    act(() => result.current[1]({ type: "addPoint", point: P(2) })); // wp1
    act(() => result.current[1]({ type: "addPoint", point: P(3) })); // wp2
    act(() => result.current[1]({ type: "reorderWaypoint", from: 0, to: 2 }));
    const [plan] = result.current;
    expect(plan.waypoints).toEqual([P(2), P(3), P(1)]);
  });

  it("setMode('loop') clears end", () => {
    const { result } = renderHook(() => useRoutePlan());
    act(() => result.current[1]({ type: "addPoint", point: P(0) }));
    act(() => result.current[1]({ type: "setMode", mode: "p2p" }));
    act(() => result.current[1]({ type: "setEndNext" }));
    act(() => result.current[1]({ type: "addPoint", point: P(1) }));
    expect(result.current[0].end).toEqual(P(1));
    act(() => result.current[1]({ type: "setMode", mode: "loop" }));
    expect(result.current[0].mode).toBe("loop");
    expect(result.current[0].end).toBeNull();
  });

  it("movePoint updates the right slot (start, waypoint, end)", () => {
    const { result } = renderHook(() => useRoutePlan());
    act(() => result.current[1]({ type: "addPoint", point: P(0) })); // start
    act(() => result.current[1]({ type: "setMode", mode: "p2p" }));
    act(() => result.current[1]({ type: "addPoint", point: P(1) })); // wp0
    act(() => result.current[1]({ type: "setEndNext" }));
    act(() => result.current[1]({ type: "addPoint", point: P(2) })); // end

    act(() => result.current[1]({ type: "movePoint", index: 0, point: P(9) }));
    expect(result.current[0].start).toEqual(P(9));

    act(() => result.current[1]({ type: "movePoint", index: 1, point: P(8) }));
    expect(result.current[0].waypoints).toEqual([P(8)]);

    act(() => result.current[1]({ type: "movePoint", index: 2, point: P(7) }));
    expect(result.current[0].end).toEqual(P(7));
  });

  it("clear resets to the initial plan", () => {
    const { result } = renderHook(() => useRoutePlan());
    act(() => result.current[1]({ type: "addPoint", point: P(0) }));
    act(() => result.current[1]({ type: "addPoint", point: P(1) }));
    act(() => result.current[1]({ type: "setTargetKm", km: 12 }));
    act(() => result.current[1]({ type: "clear" }));
    const [plan] = result.current;
    expect(plan.start).toBeNull();
    expect(plan.waypoints).toEqual([]);
    expect(plan.end).toBeNull();
    expect(plan.mode).toBe("loop");
    expect(plan.targetKm).toBe(5);
    expect(plan.endNext).toBe(false);
  });
});
