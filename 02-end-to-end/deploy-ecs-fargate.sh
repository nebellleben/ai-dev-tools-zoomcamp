#!/bin/bash
# AWS ECS Fargate Deployment Script
# Alternative to App Runner - doesn't require subscription

set -e

# Configuration
REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME="code-interview-cluster"
SERVICE_NAME="code-interview-service"
TASK_FAMILY="code-interview-platform"
ALB_NAME="code-interview-alb"
TG_NAME="code-interview-tg"
REPO_NAME="code-interview-platform"
PORT=3001

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== AWS ECS Fargate Deployment ===${NC}\n"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:latest"

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Cluster: ${GREEN}${CLUSTER_NAME}${NC}"
echo -e "  Service: ${GREEN}${SERVICE_NAME}${NC}"
echo -e "  Image: ${GREEN}${IMAGE_URI}${NC}"
echo -e "  Region: ${GREEN}${REGION}${NC}\n"

# Create CloudWatch log group
echo -e "${YELLOW}Creating CloudWatch log group...${NC}"
aws logs create-log-group \
    --log-group-name /ecs/${TASK_FAMILY} \
    --region $REGION 2>/dev/null || echo "Log group already exists"

# Create ECS cluster
echo -e "${YELLOW}Creating ECS cluster...${NC}"
aws ecs create-cluster \
    --cluster-name $CLUSTER_NAME \
    --region $REGION > /dev/null 2>&1 || echo "Cluster already exists"

# Get default VPC and subnets
echo -e "${YELLOW}Getting VPC configuration...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $REGION)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --region $REGION | tr '\t' ' ' | cut -d' ' -f1,2)
FIRST_SUBNET=$(echo $SUBNET_IDS | cut -d' ' -f1)
SECOND_SUBNET=$(echo $SUBNET_IDS | cut -d' ' -f2)
SG_ID=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=default" --query "SecurityGroups[0].GroupId" --output text --region $REGION)

# Create security group for ALB
echo -e "${YELLOW}Creating security group for load balancer...${NC}"
ALB_SG=$(aws ec2 create-security-group \
    --group-name code-interview-alb-sg \
    --description "Security group for ALB" \
    --vpc-id $VPC_ID \
    --region $REGION \
    --query 'GroupId' --output text 2>/dev/null || \
    aws ec2 describe-security-groups --filters "Name=group-name,Values=code-interview-alb-sg" --query "SecurityGroups[0].GroupId" --output text --region $REGION)

# Allow HTTP/HTTPS traffic
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $REGION 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $REGION 2>/dev/null || true

# Allow traffic from ALB to ECS
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port $PORT \
    --source-group $ALB_SG \
    --region $REGION 2>/dev/null || true

# Get or create execution role
echo -e "${YELLOW}Setting up IAM execution role...${NC}"
EXEC_ROLE_NAME="ecsTaskExecutionRole"
EXEC_ROLE_ARN=$(aws iam get-role --role-name $EXEC_ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$EXEC_ROLE_ARN" ]; then
    echo -e "${YELLOW}Creating execution role...${NC}"
    aws iam create-role \
        --role-name $EXEC_ROLE_NAME \
        --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}' > /dev/null 2>&1
    
    aws iam attach-role-policy \
        --role-name $EXEC_ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy > /dev/null 2>&1
    
    sleep 5
    EXEC_ROLE_ARN=$(aws iam get-role --role-name $EXEC_ROLE_NAME --query 'Role.Arn' --output text)
fi

echo -e "${GREEN}Execution role: ${EXEC_ROLE_ARN}${NC}"

# Create task definition
echo -e "${YELLOW}Creating task definition...${NC}"
cat > /tmp/task-definition.json << EOF
{
  "family": "${TASK_FAMILY}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "${EXEC_ROLE_ARN}",
  "containerDefinitions": [
    {
      "name": "${TASK_FAMILY}",
      "image": "${IMAGE_URI}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": ${PORT},
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "${PORT}"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${TASK_FAMILY}",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

aws ecs register-task-definition \
    --cli-input-json file:///tmp/task-definition.json \
    --region $REGION > /dev/null

echo -e "${GREEN}Task definition registered${NC}"

# Create Application Load Balancer
echo -e "${YELLOW}Creating Application Load Balancer...${NC}"
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name $ALB_NAME \
    --subnets $FIRST_SUBNET $SECOND_SUBNET \
    --security-groups $ALB_SG \
    --region $REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text 2>/dev/null || \
    aws elbv2 describe-load-balancers \
        --names $ALB_NAME \
        --region $REGION \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text)

# Create target group
echo -e "${YELLOW}Creating target group...${NC}"
TG_ARN=$(aws elbv2 create-target-group \
    --name $TG_NAME \
    --protocol HTTP \
    --port $PORT \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /api/rooms \
    --region $REGION \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text 2>/dev/null || \
    aws elbv2 describe-target-groups \
        --names $TG_NAME \
        --region $REGION \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text)

# Create listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN \
    --region $REGION 2>/dev/null || echo "Listener already exists"

# Create or update ECS service
echo -e "${YELLOW}Creating ECS service...${NC}"
SERVICE_EXISTS=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION \
    --query 'services[0].status' \
    --output text 2>/dev/null || echo "MISSING")

if [ "$SERVICE_EXISTS" = "ACTIVE" ] || [ "$SERVICE_EXISTS" = "DRAINING" ]; then
    echo -e "${YELLOW}Service exists. Updating...${NC}"
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $TASK_FAMILY \
        --region $REGION > /dev/null
    echo -e "${GREEN}Service updated${NC}"
else
    aws ecs create-service \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --task-definition $TASK_FAMILY \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${FIRST_SUBNET},${SECOND_SUBNET}],securityGroups=[${SG_ID}],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=${TG_ARN},containerName=${TASK_FAMILY},containerPort=${PORT}" \
        --region $REGION > /dev/null
    echo -e "${GREEN}Service created${NC}"
fi

# Get ALB DNS name
echo -e "${YELLOW}Getting load balancer URL...${NC}"
sleep 5
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --region $REGION \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

echo -e "\n${GREEN}=== Deployment Complete! ===${NC}"
echo -e "${GREEN}Application URL: http://${ALB_DNS}${NC}\n"
echo -e "${YELLOW}Note:${NC}"
echo -e "  - It may take 2-3 minutes for the service to be fully running"
echo -e "  - Update FRONTEND_URL environment variable with: http://${ALB_DNS}"
echo -e "  - Monitor service: ${BLUE}https://console.aws.amazon.com/ecs/v2/clusters/${CLUSTER_NAME}/services${NC}"
echo -e "  - View logs: ${BLUE}https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups/log-group//ecs/${TASK_FAMILY}${NC}"

rm -f /tmp/task-definition.json

