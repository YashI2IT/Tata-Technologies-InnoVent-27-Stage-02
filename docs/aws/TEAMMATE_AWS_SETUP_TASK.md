# AeroEdge-X — Teammate AWS Prerequisite Setup Task (Line-by-Line)

> **Purpose:** This document is a complete, copy-pasteable, step-by-step checklist for setting up a brand-new AWS account from scratch and provisioning the AeroEdge-X Cloud Synchronization infrastructure.
> 
> **Estimated Time:** 15–20 minutes  
> **Cost:** $0.00 (100% within the AWS Free Tier)  
> **AWS Region to Use:** `us-east-1` (US East - N. Virginia)  

---

## What You Need to Return to the Team Lead When Finished

At the end of this guide, you will provide these 6 lines to be placed in the project `.env` file:
```ini
AWS_REGION=us-east-1
AWS_API_URL=https://<your-api-id>.execute-api.us-east-1.amazonaws.com
AWS_S3_BUCKET=aeroedge-x-sync-aeroedges3bucket-<unique-id>
AWS_DYNAMODB_TABLE=AeroEdge-Inspections
AWS_ACCESS_KEY_ID=AKIA...<Agent Access Key>
AWS_SECRET_ACCESS_KEY=...<Agent Secret Key>
```

---

## PHASE 1: Initial AWS Account Hardening (5 Minutes in Console)

1. Open your browser and navigate to: **https://console.aws.amazon.com/**
2. Sign in using your **Root User** email and password.
3. In the top-right header, verify the Region selector shows **US East (N. Virginia) `us-east-1`**.  
   *(Keep all resources in `us-east-1`)*.
4. **Enable Multi-Factor Authentication (MFA) on Root:**
   - Click your account name in top-right $\rightarrow$ **Security credentials**.
   - Under **Multi-factor authentication (MFA)**, click **Assign MFA device**.
   - Device name: `RootPhoneMFA` $\rightarrow$ Select **Authenticator app** (Google Authenticator / Authy) $\rightarrow$ Scan QR code and enter 2 consecutive codes $\rightarrow$ Click **Add MFA**.
5. **Set a $5 Budget Alert (Zero Surprise Bill Protection):**
   - In the search bar at top, type `Budgets` and select **AWS Budgets**.
   - Click **Create budget** $\rightarrow$ Choose **Zero spend budget** (or Monthly cost budget: $5) $\rightarrow$ Enter your email $\rightarrow$ Click **Create budget**.

---

## PHASE 2: Create IAM Admin User for CLI & Deployments

> **Rule:** Never use the Root user for terminal commands or deployments. Create a dedicated Admin IAM user.

1. In the top AWS search bar, type `IAM` and select **IAM (Identity and Access Management)**.
2. In the left navigation sidebar, click **Users** $\rightarrow$ Click the orange **Create user** button.
3. **Step 1 (User details):**
   - User name: `aeroedge-admin`
   - *(Optional)* Check "Provide user access to the AWS Management Console" if you want to log in with this user later.
   - Click **Next**.
4. **Step 2 (Set permissions):**
   - Select **Attach policies directly**.
   - In the search filter box, type: `AdministratorAccess`
   - Check the checkbox next to **AdministratorAccess**.
   - Click **Next**.
5. **Step 3 (Review):**
   - Click **Create user**.
6. **Generate CLI Access Keys:**
   - In the Users list, click on `aeroedge-admin`.
   - Click the **Security credentials** tab.
   - Scroll down to the **Access keys** section $\rightarrow$ Click **Create access key**.
   - Select **Command Line Interface (CLI)**.
   - Check the confirmation box: *"I understand the above recommendation..."*
   - Click **Next** $\rightarrow$ Click **Create access key**.
   - **IMPORTANT:** Click **Download .csv file** or copy:
     - **Access key ID** (starts with `AKIA...`)
     - **Secret access key** (starts with a long random string)
   - Store these safely. You will not be able to view the secret key again.

---

## PHASE 3: Install & Configure AWS CLI on Your Machine

### 1. Install AWS CLI v2
- **Windows:** Download and run the installer:  
  `https://awscli.amazonaws.com/AWSCLIV2.msi`
- **macOS:** In terminal:  
  `curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg" && sudo installer -pkg AWSCLIV2.pkg -target /`
- **Linux:** In terminal:  
  `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install`

### 2. Verify Installation
Open a new PowerShell or Terminal window:
```bash
aws --version
```
*(Should output `aws-cli/2.x.x`)*

### 3. Configure Credentials
Run:
```bash
aws configure
```
Enter the prompts one by one:
```text
AWS Access Key ID [None]: <Paste your aeroedge-admin Access Key ID>
AWS Secret Access Key [None]: <Paste your aeroedge-admin Secret Access Key>
Default region name [None]: us-east-1
Default output format [None]: json
```

### 4. Verify Active Identity
Run:
```bash
aws sts get-caller-identity
```
Expected output:
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/aeroedge-admin"
}
```
If you see your Account ID and `aeroedge-admin`, your CLI is 100% ready!

---

## PHASE 4: Deploy AeroEdge-X Cloud Infrastructure

Choose **EITHER Option A (CLI)** OR **Option B (AWS Web Console)**:

### OPTION A: Deploy via CLI (Recommended - 60 Seconds)

1. Open PowerShell or Terminal and navigate to the project directory:
   ```bash
   cd "d:\Tata Innovent\Tata_Innovent-main"
   ```
2. Run the deployment script:
   ```powershell
   .\aws\deploy.ps1
   ```
   *(If on Mac/Linux or standard bash, run:)*
   ```bash
   aws cloudformation deploy \
       --template-file aws/cloudformation/aeroedge-x-sync.yml \
       --stack-name aeroedge-x-sync \
       --capabilities CAPABILITY_NAMED_IAM \
       --region us-east-1
   ```
3. Wait ~60 seconds until you see:
   `Successfully created/updated stack - aeroedge-x-sync`

---

### OPTION B: Deploy via AWS Web Console (No CLI needed for deploy)

1. In the AWS Console search bar, type `CloudFormation` and open the service.
2. Ensure top-right region is `us-east-1`.
3. Click the orange **Create stack** button $\rightarrow$ Select **With new resources (standard)**.
4. Under **Template source**, select **Upload a template file**.
5. Click **Choose file** and select:  
   `aws/cloudformation/aeroedge-x-sync.yml`
6. Click **Next**.
7. **Stack name:** Enter `aeroedge-x-sync` $\rightarrow$ Click **Next**.
8. **Configure stack options:** Leave everything default $\rightarrow$ Click **Next**.
9. **Review:** Scroll to the very bottom, check the capability box:  
   ☑ *"I acknowledge that AWS CloudFormation might create IAM resources with custom names."*
10. Click **Submit**.
11. Watch the events update until the status changes to green **CREATE_COMPLETE** (~60 seconds).

---

## PHASE 5: Retrieve Stack Outputs

Run this command in terminal to view the generated cloud resources:
```bash
aws cloudformation describe-stacks --stack-name aeroedge-x-sync --region us-east-1 --query "Stacks[0].Outputs" --output table
```
*(Or in the AWS CloudFormation Console, click on `aeroedge-x-sync` $\rightarrow$ click the **Outputs** tab).*

You will see:
- `BucketName` (e.g. `aeroedge-x-sync-aeroedges3bucket-1a2b3c4d5e`)
- `DynamoTableName` (e.g. `AeroEdge-Inspections`)
- `ApiEndpoint` (e.g. `https://abc123xyz.execute-api.us-east-1.amazonaws.com/sync/inspection`)

Copy down these three values.

---

## PHASE 6: Generate Edge Device Agent Credentials

The CloudFormation stack automatically created a dedicated, least-privilege IAM User named **`AeroEdge-Jetson-Agent`**. This user has write-only access to S3 and invoke-only access to API Gateway.

You now need to generate Access Keys for this agent:

1. In the AWS Console, search for **IAM** $\rightarrow$ Click **Users**.
2. Click on the user named **`AeroEdge-Jetson-Agent`**.
3. Click the **Security credentials** tab.
4. Scroll to **Access keys** $\rightarrow$ Click **Create access key**.
5. Select **Application running outside AWS** (or CLI).
6. Click **Next** $\rightarrow$ Click **Create access key**.
7. Copy:
   - **Access key ID** (starts with `AKIA...`)
   - **Secret access key**

---

## PHASE 7: Sanity Check (Test that AWS is Working)

Run these 3 quick commands in terminal to verify everything is operational:

### 1. Test S3 Bucket:
```bash
aws s3 ls s3://<Your-BucketName>
```
*(Should succeed and return an empty list with no errors)*

### 2. Test DynamoDB Table:
```bash
aws dynamodb describe-table --table-name AeroEdge-Inspections --region us-east-1 --query "Table.TableStatus"
```
*(Should return `"ACTIVE"`)*

### 3. Test API Gateway Endpoint:
```bash
curl -X POST <Your-ApiEndpoint> -H "Content-Type: application/json" -d "{\"inspection_id\":\"TEST-001\",\"device_id\":\"TEST-CLI\"}"
```
*(Should return `{"status": "success", "message": "Inspection metadata synchronized."}`)*

---

## PHASE 8: Send Configuration to Team Lead

Copy and fill out the block below, then send it to the team lead:

```ini
# ========================================================
# AeroEdge-X AWS Cloud Configuration (Created for us-east-1)
# ========================================================
AEROEDGE_DEVICE_ID=AEROEDGE-DESKTOP-001
AWS_REGION=us-east-1
AWS_API_URL=<Your-ApiEndpoint>
AWS_S3_BUCKET=<Your-BucketName>
AWS_DYNAMODB_TABLE=AeroEdge-Inspections
AWS_ACCESS_KEY_ID=<Agent-Access-Key-ID>
AWS_SECRET_ACCESS_KEY=<Agent-Secret-Access-Key>
AWS_SYNC_INTERVAL_SECONDS=30
```

Once this is placed into the team's `.env` file and `python app.py` is started, all aircraft inspection images and reports will automatically synchronize to AWS!
