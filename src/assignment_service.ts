import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const assignmentRequest = z.object({
  courseId: z.string().min(1),
  learnerId: z.string().min(1),
  deadline: z.string().datetime(),
  flagKey: z.string().min(1)
});
export type AssignmentRequest = z.infer<typeof assignmentRequest>;

export type Assignment = AssignmentRequest & { bucket: "control" | "treatment"; educatorReport: string };

function bucketFrom(data: unknown): "control" | "treatment" {
  const value = typeof data === "object" && data !== null && "value" in data ? (data as { value: unknown }).value : data;
  return value === "treatment" || value === true ? "treatment" : "control";
}

export async function assignCourse(input: AssignmentRequest, client: InfraiClient): Promise<Assignment> {
  const request = assignmentRequest.parse(input);
  await client.user(request.learnerId);
  const value = await client.flagValue(request.flagKey, request.learnerId);
  const bucket = bucketFrom(value);
  return { ...request, bucket, educatorReport: `${request.courseId}:${request.learnerId}:${bucket}:due-${request.deadline}` };
}
