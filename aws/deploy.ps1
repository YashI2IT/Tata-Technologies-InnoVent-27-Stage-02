<#
.SYNOPSIS
Deploys the AeroEdge-X AWS Cloud Synchronization Stack using CloudFormation.

.DESCRIPTION
This script safely validates and deploys the CloudFormation template,
and outputs the required environment variables for the .env configuration.
#>

$TemplatePath = "aws\cloudformation\aeroedge-x-sync.yml"
$StackName = "aeroedge-x-sync"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AeroEdge-X AWS Infrastructure Deployer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Check AWS CLI
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed or not in PATH. Please install it first."
    exit 1
}

# 2. Validate Template
Write-Host "`n[1/3] Validating CloudFormation template..." -ForegroundColor Yellow
$ValidateOutput = aws cloudformation validate-template --template-body file://$TemplatePath 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Template validation failed:`n$ValidateOutput"
    exit 1
}
Write-Host "Template is valid." -ForegroundColor Green

# 3. Deploy Stack
Write-Host "`n[2/3] Deploying stack: $StackName..." -ForegroundColor Yellow
aws cloudformation deploy `
    --template-file $TemplatePath `
    --stack-name $StackName `
    --capabilities CAPABILITY_NAMED_IAM

if ($LASTEXITCODE -ne 0) {
    Write-Error "Stack deployment failed or no changes to deploy."
    exit 1
}
Write-Host "Deployment completed successfully." -ForegroundColor Green

# 4. Fetch Outputs
Write-Host "`n[3/3] Retrieving stack outputs for .env configuration..." -ForegroundColor Yellow
$Outputs = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs" --output table
Write-Host $Outputs

Write-Host "`nDeployment Complete." -ForegroundColor Cyan
Write-Host "Next steps:"
Write-Host "1. Create an Access Key for the IAM User 'AeroEdge-Jetson-Agent' in the AWS Console."
Write-Host "2. Copy the ApiEndpoint, BucketName, and DynamoTableName into your .env file."
