#!/bin/bash
# AWS App Runner Deployment Script
# This script deploys the Docker container to AWS App Runner

set -e

# Configuration
REGION=${AWS_REGION:-us-east-1}
SERVICE_NAME="code-interview-platform"
REPO_NAME="code-interview-platform"
CPU="0.25 vCPU"
MEMORY="0.5 GB"
PORT="3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== AWS App Runner Deployment ===${NC}\n"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Get AWS account ID and image URI
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:latest"

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Service Name: ${GREEN}${SERVICE_NAME}${NC}"
echo -e "  Region: ${GREEN}${REGION}${NC}"
echo -e "  Image URI: ${GREEN}${IMAGE_URI}${NC}"
echo -e "  CPU: ${GREEN}${CPU}${NC}"
echo -e "  Memory: ${GREEN}${MEMORY}${NC}"
echo -e "  Port: ${GREEN}${PORT}${NC}\n"

# Check if service already exists
echo -e "${YELLOW}Checking if service exists...${NC}"
SERVICE_EXISTS=$(aws apprunner list-services --region $REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceName" --output text 2>/dev/null || echo "")

if [ -n "$SERVICE_EXISTS" ]; then
    echo -e "${YELLOW}Service already exists. Updating...${NC}"
    
    # Get service ARN
    SERVICE_ARN=$(aws apprunner list-services --region $REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text)
    
    # Create new service source configuration
    cat > /tmp/apprunner-source.json << EOF
{
  "ImageRepository": {
    "ImageIdentifier": "${IMAGE_URI}",
    "ImageRepositoryType": "ECR",
    "ImageConfiguration": {
      "Port": "${PORT}",
      "RuntimeEnvironmentVariables": {
        "NODE_ENV": "production",
        "PORT": "${PORT}"
      }
    }
  },
  "AutoDeploymentsEnabled": true
}
EOF
    
    # Update service
    aws apprunner update-service \
        --service-arn "$SERVICE_ARN" \
        --source-configuration file:///tmp/apprunner-source.json \
        --region $REGION > /dev/null
    
    echo -e "${GREEN}Service update initiated${NC}\n"
    
    # Start deployment
    echo -e "${YELLOW}Starting new deployment...${NC}"
    aws apprunner start-deployment \
        --service-arn "$SERVICE_ARN" \
        --region $REGION > /dev/null
    
    echo -e "${GREEN}Deployment started!${NC}\n"
    
    # Get service URL
    echo -e "${YELLOW}Waiting for service details...${NC}"
    sleep 5
    
    SERVICE_URL=$(aws apprunner describe-service \
        --service-arn "$SERVICE_ARN" \
        --region $REGION \
        --query 'Service.ServiceUrl' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$SERVICE_URL" ]; then
        echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}\n"
        echo -e "${YELLOW}Note: Update FRONTEND_URL environment variable with: ${SERVICE_URL}${NC}"
    fi
    
    echo -e "\n${GREEN}=== Deployment Complete! ===${NC}"
    echo -e "Service ARN: ${SERVICE_ARN}"
    echo -e "Monitor deployment: ${BLUE}https://console.aws.amazon.com/apprunner/home?region=${REGION}#/services/${SERVICE_ARN}${NC}"
    
else
    echo -e "${YELLOW}Creating new service...${NC}"
    
    # Create service configuration
    cat > /tmp/apprunner-service.json << EOF
{
  "ServiceName": "${SERVICE_NAME}",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "${IMAGE_URI}",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "${PORT}",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "PORT": "${PORT}"
        }
      }
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "${CPU}",
    "Memory": "${MEMORY}"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/api/rooms",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
EOF
    
    # Create service
    echo -e "${YELLOW}Creating App Runner service (this may take a few minutes)...${NC}"
    CREATE_OUTPUT=$(aws apprunner create-service \
        --cli-input-json file:///tmp/apprunner-service.json \
        --region $REGION)
    
    SERVICE_ARN=$(echo $CREATE_OUTPUT | grep -o '"ServiceArn": "[^"]*' | cut -d'"' -f4)
    
    if [ -z "$SERVICE_ARN" ]; then
        echo -e "${RED}Error: Failed to create service${NC}"
        echo "$CREATE_OUTPUT"
        exit 1
    fi
    
    echo -e "${GREEN}Service created successfully!${NC}\n"
    echo -e "${YELLOW}Waiting for service to be ready (this may take 5-10 minutes)...${NC}"
    echo -e "${BLUE}You can monitor progress in the AWS Console${NC}\n"
    
    # Wait for service to be ready (with timeout)
    MAX_WAIT=600  # 10 minutes
    ELAPSED=0
    INTERVAL=30
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        STATUS=$(aws apprunner describe-service \
            --service-arn "$SERVICE_ARN" \
            --region $REGION \
            --query 'Service.Status' \
            --output text 2>/dev/null || echo "CREATING")
        
        if [ "$STATUS" = "RUNNING" ]; then
            SERVICE_URL=$(aws apprunner describe-service \
                --service-arn "$SERVICE_ARN" \
                --region $REGION \
                --query 'Service.ServiceUrl' \
                --output text)
            
            echo -e "\n${GREEN}=== Service is RUNNING! ===${NC}"
            echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}\n"
            
            echo -e "${YELLOW}Next steps:${NC}"
            echo -e "1. Update FRONTEND_URL environment variable:"
            echo -e "   ${BLUE}aws apprunner update-service --service-arn ${SERVICE_ARN} --source-configuration ...${NC}"
            echo -e "   Or update via AWS Console"
            echo -e "2. Test your application: ${BLUE}${SERVICE_URL}${NC}"
            echo -e "3. Monitor: ${BLUE}https://console.aws.amazon.com/apprunner/home?region=${REGION}#/services/${SERVICE_ARN}${NC}"
            break
        elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
            echo -e "\n${RED}Service creation failed!${NC}"
            echo -e "Check AWS Console for details:"
            echo -e "${BLUE}https://console.aws.amazon.com/apprunner/home?region=${REGION}#/services/${SERVICE_ARN}${NC}"
            exit 1
        else
            echo -e "Status: ${YELLOW}${STATUS}${NC} (waiting ${INTERVAL}s...)"
            sleep $INTERVAL
            ELAPSED=$((ELAPSED + INTERVAL))
        fi
    done
    
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo -e "\n${YELLOW}Timeout waiting for service. Check AWS Console for status.${NC}"
        echo -e "${BLUE}https://console.aws.amazon.com/apprunner/home?region=${REGION}#/services/${SERVICE_ARN}${NC}"
    fi
fi

# Cleanup
rm -f /tmp/apprunner-service.json /tmp/apprunner-source.json

echo -e "\n${GREEN}=== Script Complete ===${NC}"

