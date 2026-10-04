# AeroEdge-X AWS Cloud Synchronization Architecture

The AWS layer acts purely as a durable metadata and artifact synchronization store. 
It is NOT in the critical path of an aircraft inspection. The application operates in a Local-First offline manner.

## Components
1. **SQLite `sync_outbox`**: The local source of truth for pending syncs.
2. **Background Sync Worker**: A local Python daemon that claims PENDING records and orchestrates the upload independently of the Flask web thread.
3. **AWS S3**: Stores original images and generated PDF reports using private AES256 encryption.
4. **AWS API Gateway & Lambda**: HTTP interface that acts as the front door for metadata synchronization, guaranteeing idempotency.
5. **AWS DynamoDB**: The final metadata store partitioned by `inspection_id`.

## Idempotency Mechanism
The Lambda function uses DynamoDB's `attribute_not_exists(inspection_id)` conditional check. If an edge device attempts to sync a record twice (due to network timeout drops), the Lambda safely swallows the `ConditionalCheckFailedException` and returns a 200 OK, preventing data duplication.
