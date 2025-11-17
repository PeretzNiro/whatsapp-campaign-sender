# Quick Start Guide

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] WhatsApp Business Account set up
- [ ] Meta Business Manager access
- [ ] Phone Number ID from WhatsApp Cloud API
- [ ] Permanent Access Token from Meta
- [ ] At least one approved message template

## 5-Minute Setup

### Step 1: Configure Environment (2 min)

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# REQUIRED: Get these from Meta Business Manager
WHATSAPP_TOKEN=EAAGxxxxxxxxxxxxxxxxxxxxxxxx
PHONE_NUMBER_ID=123456789012345

# REQUIRED: Choose a secure token for webhook verification
WEBHOOK_VERIFY_TOKEN=choose-a-random-secure-token-here

# Optional: Business Account ID
BUSINESS_ACCOUNT_ID=your_business_account_id

# OPTIONAL: Adjust these based on your needs
PORT=3000
SEND_MAX_PER_SECOND=80
SEND_CONCURRENCY=15
```

### Step 2: Add Test Contacts (1 min)

**Option A: Using the Web UI** (After starting the app)
- Navigate to http://localhost in your browser
- Upload a CSV file via the Contacts tab

**Option B: Using CSV file** (Legacy fallback)

Edit `contacts.csv`:

```csv
phone,opt_in,tags
+1234567890,true,test
```

**Important**:
- Use your own phone number for testing
- Must be in E.164 format: `+[country code][number]`
- Set `opt_in=true` to receive messages

### Step 3: Start the Application (1 min)

**Option A: Using Docker (Recommended)**

```bash
# Build and start all services (backend, frontend, database)
docker-compose up --build
```

Access the application at:
- Frontend: http://localhost
- Backend API: http://localhost:3000

**Option B: Development Mode (Local)**

```bash
# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start backend server
npm run dev
```

You should see:
```
Server listening on :3000
```

### Step 4: Test Health Check (30 sec)

Open a new terminal:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"ok":true,"database":true}
```

### Step 5: Send Test Message (30 sec)

**Dry Run First** (doesn't actually send):

```bash
curl -X POST http://localhost:3000/send \
  -H 'Content-Type: application/json' \
  -d '{
    "limit": 1,
    "bodyText": "Test message",
    "dryRun": true
  }'
```

Expected response:
```json
{
  "total": 1,
  "sent": 1,
  "results": [
    {
      "to": "+1234567890",
      "ok": true,
      "dryRun": true
    }
  ]
}
```

**Send Real Message** (remove `dryRun`):

```bash
curl -X POST http://localhost:3000/send \
  -H 'Content-Type: application/json' \
  -d '{
    "limit": 1,
    "bodyText": "Hello! This is your first WhatsApp campaign message."
  }'
```

Check your phone - you should receive the message!

## Common Issues & Solutions

### ❌ "WHATSAPP_TOKEN is required"
**Solution**: Make sure you created `.env` file (not `.env.example`) with your token

### ❌ "Template not found"
**Solution**:
1. Check template name is exact match (case-sensitive)
2. Verify template is approved in Meta Business Manager
3. Ensure language code matches template

### ❌ "Invalid phone number"
**Solution**: Use E.164 format: `+[country code][number]`
- ✅ Correct: `+14155551234`
- ❌ Wrong: `4155551234`, `(415) 555-1234`

### ❌ "Recipient not opted in"
**Solution**: In `contacts.csv`, ensure `opt_in=true` for test contacts

### ❌ Server won't start
**Solution**:
1. Check port 3000 is not in use: `netstat -ano | findstr :3000` (Windows)
2. Or change PORT in `.env` to something else

## Where to Get WhatsApp Credentials

### 1. Phone Number ID

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your WhatsApp Business App
3. Click "WhatsApp" → "Getting Started"
4. Copy the "Phone number ID" (15-digit number)

### 2. Access Token

**Option A: Temporary Token (24 hours - for testing)**
1. Same page as Phone Number ID
2. Copy the "Temporary access token"

**Option B: Permanent Token (recommended for production)**
1. Go to Business Settings → System Users
2. Create a system user
3. Add WhatsApp permissions
4. Generate permanent token
5. Save it securely (you can't view it again)

### 3. Create Message Template

1. Go to WhatsApp Manager
2. Click "Message templates"
3. Create new template
4. Add template name (e.g., `welcome_message`)
5. Add body text with optional variables: `Hello {{1}}!`
6. Submit for approval
7. Wait for approval (usually 5-30 minutes)

## Next Steps

### Test Webhook (Optional)

1. Install ngrok: `npm install -g ngrok`
2. Start tunnel: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. In Meta Developer Console:
   - Go to WhatsApp → Configuration
   - Add webhook URL: `https://abc123.ngrok.io/webhook`
   - Add verify token: same as in your `.env`
   - Subscribe to: `messages` and `message_status`
5. Send "STOP" to your WhatsApp number
6. Check logs - contact should be opted out

### Send to Multiple Contacts

1. Add more rows to `contacts.csv`
2. Restart server: `Ctrl+C` then `npm run dev`
3. Send to multiple:

```bash
curl -X POST http://localhost:3000/send \
  -H 'Content-Type: application/json' \
  -d '{
    "limit": 10,
    "bodyText": "Special offer for our subscribers!"
  }'
```

### Use Tags for Segmentation

In `contacts.csv`:
```csv
phone,opt_in,tags
+1234567890,true,vip
+1234567891,true,vip
+1234567892,true,general
```

Send only to VIPs:
```bash
curl -X POST http://localhost:3000/send \
  -H 'Content-Type: application/json' \
  -d '{
    "limit": 100,
    "tag": "vip",
    "bodyText": "Exclusive VIP offer!"
  }'
```

## Production Deployment

### Using Docker

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start dist/index.js --name whatsapp-sender

# Monitor
pm2 status
pm2 logs whatsapp-sender

# Auto-restart on reboot
pm2 startup
pm2 save
```

## Important Limits & Compliance

### Message Limits (as of 2025)

- **Quality rating affects limits**: Maintain high engagement
- **Tier-based limits**: Start with 1,000/day, scale up to 100,000+
- **Rate limiting**: Max 80 messages/second (adjust in config)
- **Marketing messages**: Limited by engagement from March 2025

### Compliance Requirements

✅ **DO**:
- Get explicit opt-in before messaging
- Honor opt-out requests immediately
- Use approved templates for business-initiated messages
- Keep quality rating high (respond to users)

❌ **DON'T**:
- Send without opt-in
- Buy contact lists
- Spam users with irrelevant messages
- Ignore "STOP" requests

## Support Resources

- **WhatsApp API Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api/
- **Meta Business Help**: https://business.facebook.com/business/help
- **Rate Limits**: https://developers.facebook.com/docs/whatsapp/cloud-api/rate-limits

## Troubleshooting Commands

```bash
# Check if server is running
curl http://localhost:3000/health

# View real-time logs
npm run dev

# Rebuild project
npm run build

# Check Node version (must be 18+)
node --version

# Check for port conflicts
netstat -ano | findstr :3000

# Test dry run
curl -X POST http://localhost:3000/send \
  -H 'Content-Type: application/json' \
  -d '{"limit":1,"dryRun":true,"bodyText":"Test"}'
```

---

**You're all set!** 🎉

If everything worked, you should have received a test message. You can now:
1. Add more contacts to `contacts.csv`
2. Create more templates in WhatsApp Manager
3. Set up webhooks for two-way communication
4. Deploy to production with Docker or PM2

For detailed documentation, see [README.md](README.md)
