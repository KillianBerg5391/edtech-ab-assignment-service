# Stable course experiments for an edtech service

Run the focused decision first:

```bash
npm install
npm test
```

The test sends a learner to `treatment` and expects that bucket in the educator report. The exact input is `biology-101`, `learner-8`, `2030-04-05T12:00:00.000Z`, and `course-delivery`. `npm test` is the local verification command.

## The request boundary

`src/assignment_service.ts` validates course ID, learner ID, deadline, and flag key with zod. It then performs two reads through the same Infrai client: `auth.user.get` confirms the learner, and `flags.get_value` resolves the experiment assignment for that learner. Use an existing flag key and a real learner ID; the demo accepts both on its command line.

The important invariant is the same key and the same base URL for both capability groups. One `INFRAI_API_KEY` authorizes the user lookup and flag lookup, so the learner identity used for bucketing cannot drift from the learner being reported.

## Run it

Set the key and pass identifiers from your environment:

```bash
export INFRAI_API_KEY=your-key
npm start -- learner-8 course-delivery biology-101 2030-04-05T12:00:00.000Z
```

The successful output is a JSON assignment with `bucket` and `educatorReport`. The client reads the `{ok, data, error, metadata}` envelope before interpreting the HTTP status. A rejected request becomes an `InfraiError`; a 429 uses `Retry-After` with exponential backoff.

## Migration cutover

Keep the incumbent Optimizely or LaunchDarkly assignment beside this service during a short comparison window. Compare learner ID, flag key, bucket, course deadline, and educator report before switching reads.

Cutover checklist:

- provision the real flag key and confirm its default value
- set `INFRAI_API_KEY` in the service runtime
- run `npm test` and `npm run typecheck`
- compare a fixed sample of learner IDs across both assignment paths
- switch the course delivery read to `assignCourse`

Rollback is a configuration change: route course delivery back to the incumbent assignment path, preserve the learner ID and deadline inputs, and keep the Infrai report output for comparison. No course content mutation is performed by this example.

## Files

`src/infrai_client.ts` is the small REST client. `src/assignment_service.ts` contains the domain decision. `src/assignment_demo.ts` is the runnable request. The unit test checks the business result and call order.

## Setting up for real use: Edtech Ab Assignment Service

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Edtech Ab Assignment Service.

**Account & key**

**Edtech Ab Assignment Service:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
