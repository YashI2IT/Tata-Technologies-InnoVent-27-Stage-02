# AeroEdge-X AWS Setup Guide

## 1. Deploy CloudFormation
Execute the provided CloudFormation template to spin up the required S3 bucket, DynamoDB table, IAM Role, and Edge IAM User.

```bash
aws cloudformation create-stack \
    --stack-name AeroEdge-X-Sync \
    --template-body file://aws/cloudformation/aeroedge-x-sync.yml \
    --capabilities CAPABILITY_NAMED_IAM
```

## 2. Deploy Lambda
Zip the `sync_handler.py` and upload to your Lambda. Configure API Gateway as a trigger for this Lambda and capture the Invoke URL.

## 3. Generate Credentials
Generate an Access Key for the `AeroEdge-Jetson-Agent` IAM User created in step 1.

## 4. Configure Edge Node / Desktop
Update the `.env` on your deployment node:

```env
AEROEDGE_DEVICE_ID=JETSON-001
AWS_REGION=us-east-1
AWS_API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/sync/inspection
AWS_S3_BUCKET=<created-bucket-name>
AWS_DYNAMODB_TABLE=AeroEdge-Inspections
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
```
