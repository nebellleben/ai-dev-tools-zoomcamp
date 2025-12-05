#!/bin/bash
# AWS Deployment Script for Code Interview Platform
# This script builds and pushes the Docker image to AWS ECR

set -e

# Configuration
REGION=${AWS_REGION:-us-east-1}
REPO_NAME=code-interview-platform

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== AWS Deployment Script ===${NC}\n"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Get AWS account ID
echo -e "${YELLOW}Getting AWS account ID...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

echo -e "${GREEN}AWS Account ID: $ACCOUNT_ID${NC}\n"

# Check if ECR repository exists, create if not
echo -e "${YELLOW}Checking ECR repository...${NC}"
if ! aws ecr describe-repositories --repository-names $REPO_NAME --region $REGION &> /dev/null; then
    echo -e "${YELLOW}Creating ECR repository...${NC}"
    aws ecr create-repository \
        --repository-name $REPO_NAME \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true
    echo -e "${GREEN}Repository created${NC}\n"
else
    echo -e "${GREEN}Repository exists${NC}\n"
fi

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t $REPO_NAME .
echo -e "${GREEN}Build complete${NC}\n"

# Login to ECR
echo -e "${YELLOW}Logging into ECR...${NC}"
aws ecr get-login-password --region $REGION | \
    docker login --username AWS --password-stdin \
    $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
echo -e "${GREEN}Login successful${NC}\n"

# Tag image
IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:latest"
echo -e "${YELLOW}Tagging image...${NC}"
docker tag $REPO_NAME:latest $IMAGE_URI
echo -e "${GREEN}Tagged: $IMAGE_URI${NC}\n"

# Push to ECR
echo -e "${YELLOW}Pushing image to ECR...${NC}"
docker push $IMAGE_URI
echo -e "${GREEN}Push complete${NC}\n"

# Success message
echo -e "${GREEN}=== Deployment Complete! ===${NC}\n"
echo -e "Image URI: ${GREEN}$IMAGE_URI${NC}\n"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go to AWS App Runner: https://console.aws.amazon.com/apprunner"
echo "2. Create new service"
echo "3. Select 'Container registry' → 'Amazon ECR'"
echo "4. Use image: $IMAGE_URI"
echo "5. Configure:"
echo "   - Port: 3001"
echo "   - Environment variables:"
echo "     NODE_ENV=production"
echo "     PORT=3001"
echo ""
echo "Or use ECS/Elastic Beanstalk as described in AWS_DEPLOYMENT.md"

