# Environment Setup Guide

## Quick Start (Workflow Testing)

For testing workflows, you only need minimal configuration:

1. **Update OpenAI API Key**:
   ```bash
   # Edit configs/.env
   OPENAI_API_KEY=your_actual_openai_api_key
   ```

2. **Start test server**:
   ```bash
   node test-workflow-server.js
   ```

## Full Production Setup

1. **Copy template**:
   ```bash
   cp configs/.env.template configs/.env
   ```

2. **Fill in all values** in `configs/.env`

3. **Start full server**:
   ```bash
   node App.js
   ```

## Required vs Optional

### Minimum Required for Workflows:
- `OPENAI_API_KEY` - For AI agent nodes
- `NODE_ENV` - Environment mode
- `PORT` - Server port

### Required for Full App:
- All database configurations (MongoDB, MySQL, Milvus)
- WhatsApp Business API credentials
- Google Cloud / AWS credentials
- Email SMTP settings

## Configuration Files

- `configs/.env` - Your environment variables
- `configs/.env.template` - Complete reference template
- `configs/contexts/` - Business context configurations
- `configs/prompts/` - AI prompt templates