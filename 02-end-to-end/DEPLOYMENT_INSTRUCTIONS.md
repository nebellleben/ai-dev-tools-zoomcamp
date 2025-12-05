# AWS Deployment - Manual Steps

The automated deployment script encountered a subscription requirement. Here are the manual steps to complete the deployment:

## Issue
AWS App Runner requires enabling the service in your AWS account first.

## Solution: Enable App Runner (One-time setup)

### Step 1: Enable App Runner Service

1. Go to AWS App Runner Console: https://console.aws.amazon.com/apprunner
2. If prompted, click "Get started" or "Enable App Runner"
3. This is a one-time setup that enables App Runner in your account

### Step 2: Deploy via Console

After enabling App Runner, you can either:

**Option A: Use the automated script again**
```bash
./deploy-apprunner.sh
```

**Option B: Deploy manually via Console**

1. Go to: https://console.aws.amazon.com/apprunner
2. Click "Create service"
3. Select "Container registry" → "Amazon ECR"
4. Use this image URI: `808055627316.dkr.ecr.us-east-1.amazonaws.com/code-interview-platform:latest`
5. Configure:
   - **Service name:** `code-interview-platform`
   - **Virtual CPU:** 0.25 vCPU
   - **Memory:** 0.5 GB
   - **Port:** 3001
   - **Environment variables:**
     - `NODE_ENV` = `production`
     - `PORT` = `3001`
6. Click "Create & deploy"
7. Wait 5-10 minutes for deployment

### Step 3: Update FRONTEND_URL

After deployment, you'll get a URL like: `https://xxxxx.us-east-1.awsapprunner.com`

1. Go to your App Runner service
2. Click "Configuration" → "Edit"
3. Under "Environment variables", add:
   - `FRONTEND_URL` = `https://xxxxx.us-east-1.awsapprunner.com`
4. Save and redeploy

## Alternative: Use AWS ECS Fargate

If you prefer not to enable App Runner, you can use ECS Fargate instead. See `AWS_DEPLOYMENT.md` for ECS deployment instructions.

## Quick Commands

After enabling App Runner, run:
```bash
./deploy-apprunner.sh
```

Or check service status:
```bash
aws apprunner list-services --region us-east-1
```

