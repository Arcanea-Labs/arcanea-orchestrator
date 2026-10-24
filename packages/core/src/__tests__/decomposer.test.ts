import { describe, it, expect } from "vitest";
import { formatLineage, formatSiblings, getLeaves, getSiblings, propagateStatus, type TaskNode } from "../decomposer";

describe("decomposer", () => {
  describe("formatLineage", () => {
    it("formats lineage correctly", () => {
      const lineage = ["Root task", "Child task"];
      const current = "Leaf task";
      const formatted = formatLineage(lineage, current);
      expect(formatted).toBe(
        "0. Root task\n  1. Child task\n    2. Leaf task  <-- (this task)"
      );
    });
  });

  describe("formatSiblings", () => {
    it("formats siblings correctly", () => {
      const siblings = ["Task A", "Task B", "Task C"];
      const current = "Task B";
      const formatted = formatSiblings(siblings, current);
      expect(formatted).toBe(
        "Sibling tasks being worked on in parallel:\n  - Task A\n  - Task B  <-- (you)\n  - Task C"
      );
    });

    it("returns empty string if no siblings", () => {
      expect(formatSiblings([], "Task A")).toBe("");
    });
  });

  describe("tree operations", () => {
    const createMockTree = (): TaskNode => ({
      id: "1",
      depth: 0,
      description: "Root",
      status: "pending",
      lineage: [],
      children: [
        {
          id: "1.1",
          depth: 1,
          description: "Child A",
          status: "pending",
          lineage: ["Root"],
          children: [
            {
              id: "1.1.1",
              depth: 2,
              description: "Leaf A1",
              status: "pending",
              lineage: ["Root", "Child A"],
              children: [],
            },
            {
              id: "1.1.2",
              depth: 2,
              description: "Leaf A2",
              status: "pending",
              lineage: ["Root", "Child A"],
              children: [],
            },
          ],
        },
        {
          id: "1.2",
          depth: 1,
          description: "Child B",
          status: "pending",
          lineage: ["Root"],
          children: [],
        },
      ],
    });

    describe("getLeaves", () => {
      it("extracts all leaf nodes", () => {
        const tree = createMockTree();
        const leaves = getLeaves(tree);
        expect(leaves.map((l) => l.id)).toEqual(["1.1.1", "1.1.2", "1.2"]);
      });
    });

    describe("getSiblings", () => {
      it("returns sibling descriptions", () => {
        const tree = createMockTree();
        const siblings = getSiblings(tree, "1.1.1");
        expect(siblings).toEqual(["Leaf A2"]);
      });

      it("returns empty array for root", () => {
        const tree = createMockTree();
        const siblings = getSiblings(tree, "1");
        expect(siblings).toEqual([]);
      });
    });

    describe("propagateStatus", () => {
      it("updates parent to done if all children are done", () => {
        const tree = createMockTree();
        tree.children[0].children[0].status = "done";
        tree.children[0].children[1].status = "done";
        propagateStatus(tree);
        expect(tree.children[0].status).toBe("done");
      });

      it("updates parent to failed if any child is failed", () => {
        const tree = createMockTree();
        tree.children[0].children[0].status = "done";
        tree.children[0].children[1].status = "failed";
        propagateStatus(tree);
        expect(tree.children[0].status).toBe("failed");
      });

      it("updates parent to running if any child is running", () => {
        const tree = createMockTree();
        tree.children[0].children[0].status = "done";
        tree.children[0].children[1].status = "pending";
        propagateStatus(tree);
        expect(tree.children[0].status).toBe("running");
      });
    });
  });
});
