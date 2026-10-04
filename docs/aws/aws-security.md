# AeroEdge-X AWS Security Posture

## 1. Secrets Management
AWS credentials are never embedded in the frontend (React/Vite). They are read purely from environment variables by the backend Python worker. 
These are not committed to source control.

## 2. IAM Least Privilege
The `AeroEdge-Jetson-Agent` IAM user is restricted specifically to `s3:PutObject` on the target bucket and `execute-api:Invoke` on the API Gateway. It cannot delete items, nor can it read other items from DynamoDB.

## 3. S3 Public Access Block
The S3 bucket enforces strict `BlockPublicAcls` and `BlockPublicPolicy`. All objects are private and AES256 encrypted at rest.

## 4. Path Traversal & Injection
The Lambda parses raw JSON and explicitly assigns mapped variables (`payload.get('inspection_id')`). It does not dynamically build queries, inherently protecting against injection attacks.
