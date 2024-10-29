#!/bin/bash

# Define variables
S3_BUCKET="maxai-containers"
ZIP_FILE="multilogin.zip"
AWS_REGION="us-east-2"
CONTAINER_ZIP="maxai-containers-latest.zip"

# Create the S3 bucket if it doesn't exist
if ! aws s3api head-bucket --bucket "$S3_BUCKET" --profile sirenai-s3 2>/dev/null; then
  echo "Bucket does not exist. Creating bucket: $S3_BUCKET"
  if ! aws s3api create-bucket --bucket "$S3_BUCKET" --region "$AWS_REGION" --create-bucket-configuration LocationConstraint="$AWS_REGION" --profile sirenai-s3; then
    echo "Failed to create bucket. Exiting."
    exit 1
  fi
else
  echo "Bucket already exists: $S3_BUCKET"
fi

# Upload the zip file to S3
if ! aws s3 cp $ZIP_FILE s3://$S3_BUCKET/$CONTAINER_ZIP --acl public-read --profile sirenai-s3; then
  echo "Failed to upload file to S3. Exiting."
  exit 1
fi

# Get the S3 URL
S3_URL="https://$S3_BUCKET.s3.$AWS_REGION.amazonaws.com/$CONTAINER_ZIP"

# Display the S3 URL
echo "File uploaded to S3:"
echo "$S3_URL"

# Post a message to Slack channel with the URL link
SLACK_CHANNEL="C076D4QJ2HX"
SLACK_BOT_TOKEN="xoxb-5188695769920-6699023740496-rpwFe3WjRiGsDkFkvIruQg6m"
SLACK_MESSAGE="*File Uploaded*: multilogin.zip\nLink: $S3_URL"

# Send the message to Slack using direct API calls
response=$(curl -s -X POST -H "Authorization: Bearer $SLACK_BOT_TOKEN" -H "Content-type: application/json" --data "{\"channel\":\"$SLACK_CHANNEL\",\"text\":\"$SLACK_MESSAGE\"}" https://slack.com/api/chat.postMessage)

if echo "$response" | grep -q '"ok":false'; then
  echo "Error posting to Slack. Retrying without Slack message."
  response=$(curl -s -X POST -H "Authorization: Bearer $SLACK_BOT_TOKEN" -H "Content-type: application/json" --data "{\"channel\":\"$SLACK_CHANNEL\",\"text\":\"File multilogin.zip uploaded to S3: $S3_URL\"}" https://slack.com/api/chat.postMessage)
  if echo "$response" | grep -q '"ok":false'; then
    echo "Retry failed. Response: $response"
    exit 1
  else
    echo "Retry successful. Message posted to Slack."
  fi
else
  echo "Message posted to Slack successfully."
fi