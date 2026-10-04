# AeroEdge-X AWS Deployment Checklist

Follow these exact steps to provision AWS infrastructure and validate the end-to-end sync.

### 1. Prerequisites
- [ ] Active AWS Account.
- [ ] AWS CLI installed and configured locally (`aws configure`).

### 2. CloudFormation Validation
- [ ] Run `aws cloudformation validate-template --template-body file://aws/cloudformation/aeroedge-x-sync.yml` to ensure template integrity.

### 3. Stack Deployment
- [ ] Execute `.\aws\deploy.ps1` to deploy the stack automatically.
- [ ] Wait for `UPDATE_COMPLETE` or `CREATE_COMPLETE`.

### 4. Stack Outputs
- [ ] Capture the **ApiEndpoint** URL.
- [ ] Capture the **BucketName**.
- [ ] Capture the **DynamoTableName**.
- [ ] In the AWS Console, generate an Access Key for the IAM User: `AeroEdge-Jetson-Agent`.

### 5. Local Backend Configuration
- [ ] Update `.env` with the outputs from step 4 and the Access Key credentials.
- [ ] Set `AEROEDGE_DEVICE_ID=JETSON-001`.

### 6. Validation Phase
- [ ] **API Test**: Send a manual cURL POST to the `ApiEndpoint` with a valid JSON payload. Verify 200 OK.
- [ ] **S3 Test**: Verify the `images/` folder exists in S3 via AWS Console.
- [ ] **DynamoDB Test**: Verify the JSON payload appeared in the DynamoDB table.
- [ ] **Desktop Application Test**: Start AeroEdge-X, run an inspection, and watch the UI shift from `PENDING` to `SYNCED`.
- [ ] **Offline Test**: Disconnect internet, run inspection. Verify UI says `PENDING`.
- [ ] **Reconnect Test**: Reconnect internet. Verify UI shifts from `PENDING` to `SYNCED` within 30 seconds.
- [ ] **Duplicate Test**: Try to force-send the exact same `inspection_id`. Verify DynamoDB record is not overwritten (idempotency holds).
- [ ] **Restart Test**: While offline, create a pending job. Kill AeroEdge-X. Reconnect internet, start AeroEdge-X. Verify job syncs automatically.
