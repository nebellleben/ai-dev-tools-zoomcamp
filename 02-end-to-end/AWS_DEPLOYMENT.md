# AWS Deployment Guide

This guide covers deploying the Code Interview Platform to AWS using Docker containers.

## AWS Deployment Options

### 1. AWS App Runner (⭐ Recommended - Easiest)
- ✅ Simplest AWS deployment
- ✅ Automatic scaling
- ✅ Built-in load balancing
- ✅ HTTPS by default
- ✅ WebSocket support
- ✅ Pay-per-use pricing

### 2. AWS ECS with Fargate (⭐ Recommended - Production)
- ✅ Full control and flexibility
- ✅ Production-ready
- ✅ Auto-scaling
- ✅ WebSocket support
- ✅ More configuration options

### 3. AWS Elastic Beanstalk
- ✅ Platform as a Service
- ✅ Easy deployment
- ✅ Auto-scaling
- ✅ WebSocket support

### 4. AWS EC2
- ✅ Full control
- ✅ Manual setup
- ⚠️ More maintenance required

---

## Option 1: AWS App Runner (Easiest)

AWS App Runner is the simplest way to deploy Docker containers on AWS, similar to Railway or Render.

### Prerequisites
- AWS Account
- AWS CLI installed and configured
- Docker installed locally (for testing)

### Steps

#### 1. Install and Configure AWS CLI

```bash
# Install AWS CLI (if not installed)
# macOS
brew install awscli

# Or download from: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region (e.g., us-east-1)
# Enter default output format (json)
```

#### 2. Create ECR Repository (Container Registry)

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name code-interview-platform \
  --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

#### 3. Build and Push Docker Image

```bash
cd 02-end-to-end

# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1

# Build the image
docker build -t code-interview-platform .

# Tag the image
docker tag code-interview-platform:latest \
  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/code-interview-platform:latest

# Push to ECR
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/code-interview-platform:latest
```

#### 4. Deploy to App Runner

**Option A: Using AWS Console**

1. Go to AWS App Runner console: https://console.aws.amazon.com/apprunner
2. Click "Create service"
3. Choose "Container registry" → "Amazon ECR"
4. Select your repository: `code-interview-platform`
5. Configure:
   - **Service name:** `code-interview-platform`
   - **Virtual CPU:** 0.25 vCPU (minimum)
   - **Memory:** 0.5 GB (minimum)
   - **Port:** 3001
   - **Environment variables:**
     - `NODE_ENV=production`
     - `PORT=3001`
     - `FRONTEND_URL=https://your-app.run.app` (will be provided after deployment)
6. Click "Create & deploy"
7. Wait for deployment (5-10 minutes)
8. Get your URL from the service dashboard

**Option B: Using AWS CLI**

```bash
# Create apprunner service configuration
cat > apprunner-config.json << EOF
{
  "ServiceName": "code-interview-platform",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/code-interview-platform:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3001",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "PORT": "3001"
        }
      }
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  }
}
EOF

# Create the service
aws apprunner create-service \
  --cli-input-json file://apprunner-config.json \
  --region us-east-1
```

#### 5. Update Environment Variables

After deployment, update `FRONTEND_URL`:
1. Go to App Runner service
2. Configuration → Environment variables
3. Add/Update: `FRONTEND_URL=https://your-app.run.app`
4. Save and redeploy

**App Runner automatically provides:**
- HTTPS certificate
- Public URL (format: `https://xxxxx.us-east-1.awsapprunner.com`)
- Auto-scaling
- Load balancing

**Pricing:** ~$0.007 per vCPU-hour + $0.0008 per GB-hour (~$5-10/month for small app)

---

## Option 2: AWS ECS with Fargate (Production)

ECS Fargate is the most flexible and production-ready option.

### Prerequisites
- Same as App Runner
- Basic understanding of AWS services

### Steps

#### 1. Create ECR Repository (same as App Runner)

```bash
aws ecr create-repository \
  --repository-name code-interview-platform \
  --region us-east-1
```

#### 2. Build and Push Image (same as App Runner)

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1

docker build -t code-interview-platform .
docker tag code-interview-platform:latest \
  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/code-interview-platform:latest

aws ecr get-login-password --region ${REGION} | \
  docker login --username AWS --password-stdin \
  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/code-interview-platform:latest
```

#### 3. Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster \
  --cluster-name code-interview-platform-cluster \
  --region us-east-1
```

#### 4. Create Task Definition

Create `task-definition.json`:

```json
{
  "family": "code-interview-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "code-interview-platform",
      "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/code-interview-platform:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
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
          "value": "3001"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/code-interview-platform",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
# Replace ACCOUNT_ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
sed -i '' "s/<ACCOUNT_ID>/$ACCOUNT_ID/g" task-definition.json

# Create CloudWatch log group
aws logs create-log-group \
  --log-group-name /ecs/code-interview-platform \
  --region us-east-1

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region us-east-1
```

#### 5. Create VPC and Networking (if needed)

```bash
# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)

# Get default subnets
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text | tr '\t' ',')

# Get default security group
SG_ID=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=default" --query "SecurityGroups[0].GroupId" --output text)
```

#### 6. Create Application Load Balancer

```bash
# Create security group for ALB
ALB_SG=$(aws ec2 create-security-group \
  --group-name code-interview-platform-alb-sg \
  --description "Security group for ALB" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

# Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name code-interview-platform-alb \
  --subnets $(echo $SUBNET_IDS | tr ',' ' ') \
  --security-groups $ALB_SG \
  --region us-east-1 \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Create target group
TG_ARN=$(aws elbv2 create-target-group \
  --name code-interview-platform-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /api/rooms \
  --region us-east-1 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region us-east-1
```

#### 7. Create ECS Service

```bash
# Update security group to allow traffic from ALB
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3001 \
  --source-group $ALB_SG

# Create service
aws ecs create-service \
  --cluster code-interview-platform-cluster \
  --service-name code-interview-platform-service \
  --task-definition code-interview-platform \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$(echo $SUBNET_IDS | cut -d',' -f1)],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=code-interview-platform,containerPort=3001" \
  --region us-east-1
```

#### 8. Get ALB URL

```bash
aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

**ECS Fargate provides:**
- Full control over infrastructure
- Auto-scaling
- Load balancing
- Production-ready setup

**Pricing:** ~$0.04 per vCPU-hour + $0.004 per GB-hour (~$15-30/month for small app)

---

## Option 3: AWS Elastic Beanstalk (Simpler Alternative)

Elastic Beanstalk is easier than ECS but less flexible.

### Steps

#### 1. Install EB CLI

```bash
# macOS
brew install aws-elasticbeanstalk

# Or: pip install awsebcli
```

#### 2. Initialize Elastic Beanstalk

```bash
cd 02-end-to-end
eb init -p docker code-interview-platform --region us-east-1
```

#### 3. Create and Deploy

```bash
# Create environment
eb create code-interview-platform-env

# Or with specific configuration
eb create code-interview-platform-env \
  --instance-type t3.micro \
  --envvars NODE_ENV=production,PORT=3001
```

#### 4. Deploy Updates

```bash
eb deploy
```

#### 5. Get URL

```bash
eb status
eb open
```

**Elastic Beanstalk automatically provides:**
- Load balancer
- Auto-scaling
- HTTPS (with certificate)
- Monitoring

**Pricing:** Pay for underlying EC2/ALB resources (~$10-20/month)

---

## Quick Start Script

Create `deploy-aws.sh` for easy deployment:

```bash
#!/bin/bash
set -e

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}
REPO_NAME=code-interview-platform

echo "Building Docker image..."
docker build -t $REPO_NAME .

echo "Logging into ECR..."
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin \
  $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

echo "Tagging image..."
docker tag $REPO_NAME:latest \
  $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:latest

echo "Pushing to ECR..."
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:latest

echo "Deployment complete!"
echo "Image URI: $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:latest"
echo ""
echo "Next steps:"
echo "1. Go to AWS App Runner console"
echo "2. Create service using the image above"
echo "3. Or use ECS/Elastic Beanstalk as described in this guide"
```

Make it executable:
```bash
chmod +x deploy-aws.sh
```

---

## Cost Comparison

| Service | Monthly Cost (Small App) | Best For |
|---------|-------------------------|----------|
| App Runner | $5-10 | Quick deployment |
| ECS Fargate | $15-30 | Production, flexibility |
| Elastic Beanstalk | $10-20 | Simpler than ECS |
| EC2 | $10-15 | Full control |

*Costs are approximate and vary by region and usage*

---

## Recommended Deployment Options

### Option 1: AWS App Runner (If Enabled)
**Note:** App Runner requires enabling the service in AWS Console first (one-time setup).

For most users, **AWS App Runner** is the best choice:
- ✅ Simplest deployment
- ✅ Automatic scaling
- ✅ Built-in HTTPS
- ✅ WebSocket support
- ✅ Pay-per-use pricing
- ✅ Minimal configuration

**To enable App Runner:**
1. Go to: https://console.aws.amazon.com/apprunner
2. Click "Get started" or "Enable App Runner"
3. Then run: `./deploy-apprunner.sh`

### Option 2: AWS ECS Fargate (No Subscription Required)
If App Runner is not enabled, use **ECS Fargate**:
- ✅ No subscription required
- ✅ Production-ready
- ✅ Full control
- ✅ WebSocket support
- ✅ Auto-scaling

**Quick deploy:**
```bash
./deploy-ecs-fargate.sh
```

---

## Troubleshooting

### WebSocket Issues
- Ensure load balancer supports WebSockets (ALB does, Classic LB doesn't)
- Check security group rules allow WebSocket connections
- Verify CORS settings in backend

### Container Issues
- Check CloudWatch logs: `aws logs tail /ecs/code-interview-platform --follow`
- Verify environment variables are set correctly
- Ensure port 3001 is exposed in Dockerfile

### Build Issues
- Verify Dockerfile is in root directory
- Check ECR repository exists and is accessible
- Ensure AWS credentials have proper permissions

---

## Security Best Practices

1. **Use IAM roles** instead of access keys when possible
2. **Enable CloudWatch logging** for monitoring
3. **Use security groups** to restrict access
4. **Enable HTTPS** (automatic with App Runner/ALB)
5. **Rotate credentials** regularly
6. **Use secrets manager** for sensitive environment variables

---

## Next Steps

1. Choose your deployment method (App Runner recommended)
2. Follow the steps above
3. Update `FRONTEND_URL` environment variable after deployment
4. Test WebSocket connections
5. Monitor using CloudWatch

For questions or issues, refer to AWS documentation or AWS Support.

