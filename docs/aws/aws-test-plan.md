# AeroEdge-X AWS Test Plan

## TEST 1: Normal online synchronization
**Action**: Run an inspection while connected to internet.
**Expected**: Inspection completes instantly locally. Within 30 seconds, `sync_outbox` status changes to `SYNCED`. DynamoDB shows the record. S3 shows the images.

## TEST 2: Internet unavailable
**Action**: Disconnect network. Run inspection.
**Expected**: Inspection completes instantly. `sync_outbox` remains `PENDING` (or `FAILED` if a timeout occurred during sync attempt). UI continues functioning normally.

## TEST 3: AWS endpoint unavailable
**Action**: Configure `.env` with a broken `AWS_API_URL`.
**Expected**: Worker throws exception, marks `sync_outbox` as `FAILED`, increments `sync_attempts`. App never crashes.

## TEST 4: S3 upload failure
**Action**: Deny S3 IAM permissions.
**Expected**: S3 exception is caught by worker. Job fails and queues for retry.

## TEST 5: DynamoDB failure
**Action**: Deny DynamoDB permissions on Lambda execution role.
**Expected**: Lambda returns HTTP 500. Worker catches non-2xx status, marks `FAILED`, queues for retry.

## TEST 6: Duplicate inspection synchronization
**Action**: Manually duplicate an API POST payload.
**Expected**: Lambda handles `ConditionalCheckFailedException` gracefully, returns 200 OK without overwriting the original DB row.

## TEST 7: Application restart with PENDING jobs
**Action**: Disconnect network, create inspection, kill application. Reconnect network, start application.
**Expected**: Sync worker wakes up, queries `PENDING`, and successfully syncs the missed record from previous session.
