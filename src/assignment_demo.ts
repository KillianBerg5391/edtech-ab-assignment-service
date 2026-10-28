import { assignCourse } from "./assignment_service.ts";
import { InfraiClient } from "./infrai_client.ts";

const [learnerId, flagKey, courseId = "biology-101", deadline = "2030-04-05T12:00:00.000Z"] = process.argv.slice(2);
if (!learnerId || !flagKey) {
  console.error("Usage: npm start -- <learner-id> <existing-flag-key> [course-id] [deadline]");
  process.exit(1);
}
const result = await assignCourse({ learnerId, flagKey, courseId, deadline }, new InfraiClient());
console.log(JSON.stringify(result, null, 2));
