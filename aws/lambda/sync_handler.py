import os
import json
import boto3
from botocore.exceptions import ClientError

# Initialize DynamoDB resource outside handler for warm starts
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(TABLE_NAME) if TABLE_NAME else None

def lambda_handler(event, context):
    try:
        # Support both direct invocation and API Gateway proxy integration
        if 'body' in event:
            payload = json.loads(event['body'])
        else:
            payload = event

        # Extract required fields
        inspection_id = payload.get('inspection_id')
        device_id = payload.get('device_id')
        
        if not inspection_id or not device_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields: inspection_id, device_id'})
            }

        # Build DynamoDB item using existing AeroEdge-X schema
        item = {
            'inspection_id': inspection_id,
            'device_id': device_id,
            'timestamp': payload.get('timestamp'),
            'defect': payload.get('defect'),
            'confidence': str(payload.get('confidence')), # Convert floats to strings or decimals for Dynamo
            'severity': payload.get('severity'),
            'bbox': json.dumps(payload.get('bbox', {})),
            'model': payload.get('model'),
            'model_version': payload.get('model_version'),
            'inference_device': payload.get('inference_device'),
            'report_key': payload.get('report_key'),
            'image_key': payload.get('image_key'),
            'sync_timestamp': context.aws_request_id  # Unique sync trace
        }

        # Idempotent write: Only insert if inspection_id does not already exist
        try:
            table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(inspection_id)'
            )
            return {
                'statusCode': 200,
                'body': json.dumps({'status': 'success', 'message': 'Inspection metadata synchronized.'})
            }
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                # Idempotency hit - record already exists. Safe to return success.
                return {
                    'statusCode': 200,
                    'body': json.dumps({'status': 'success', 'message': 'Inspection already synchronized.'})
                }
            else:
                raise e

    except Exception as e:
        print(f"Error processing sync: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
