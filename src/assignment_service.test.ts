import test from "node:test";
import assert from "node:assert/strict";
import { assignCourse } from "./assignment_service.ts";

test("a treatment assignment is visible in the educator report", async () => {
  const calls: string[] = [];
  const client = {
    user: async (id: string) => { calls.push(`user:${id}`); return { id }; },
    flagValue: async (key: string, id: string) => { calls.push(`flag:${key}:${id}`); return { value: "treatment" }; }
  } as any;
  const result = await assignCourse({ courseId: "biology-101", learnerId: "learner-8", deadline: "2030-04-05T12:00:00.000Z", flagKey: "course-delivery" }, client);
  assert.equal(result.bucket, "treatment");
  assert.match(result.educatorReport, /biology-101:learner-8:treatment/);
  assert.deepEqual(calls, ["user:learner-8", "flag:course-delivery:learner-8"]);
});
