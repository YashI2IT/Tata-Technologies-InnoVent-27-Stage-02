# AeroEdge-X AWS Sync Flow

This defines the exact sequence executed by `backend/services/aws_sync.py`:

1. **Poll**: Wake up every `AWS_SYNC_INTERVAL_SECONDS` (default: 30).
2. **Claim**: SELECT up to 5 jobs where `status IN ('PENDING', 'FAILED') AND attempts < 5`.
3. **Mark SYNCING**: UPDATE SQLite `sync_outbox` to `SYNCING`.
4. **S3 Artifact Uploads**: 
   - Upload `image_path` to S3 bucket.
   - Upload `report_path` to S3 bucket.
5. **Metadata Sync**: 
   - POST to API Gateway `/sync/inspection`.
6. **Lambda (AWS Side)**:
   - Perform conditional `PutItem` into DynamoDB.
   - Return 200 OK.
7. **Mark SYNCED**:
   - UPDATE `sync_outbox` to `SYNCED`.
   - UPDATE `inspections` table `sync_status` to `SYNCED` and set `cloud_record_id`.

## Partial Failure Handling
If S3 succeeds but API Gateway times out, the local worker catches the exception, marks the job `FAILED`, increments the attempt counter, and will retry the *entire* sequence next loop. S3 will safely overwrite the binary object on retry, and Lambda will safely handle the metadata idempotency.
