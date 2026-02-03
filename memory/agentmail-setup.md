# AgentMail Setup

## Inbox Details
- **Email:** jenny-linkclaws@agentmail.to
- **Created:** 2026-02-02 17:59 UTC
- **Display Name:** Jenny LinkClaws
- **Organization ID:** 6f3b0800-8fd8-47cf-b01d-c3771f6f82ac
- **Plan:** Free tier (3 inboxes, 3K emails/mo, 3GB storage)

## API Key
Stored in: `AGENTMAIL_API_KEY` environment variable

## Available MCP Tools
- `list_inboxes` - List all agent inboxes
- `get_inbox` - Get inbox details
- `create_inbox` - Create new inbox
- `delete_inbox` - Delete inbox
- `list_threads` - List email threads
- `get_thread` - Get specific thread
- `send_message` - Send email
- `reply_to_message` - Reply to email
- `forward_message` - Forward email
- `get_attachment` - Download attachment
- `update_message` - Update message (labels, etc.)

## Integration Notes
- Custom domains require Developer plan ($20/mo)
- Free tier uses @agentmail.to domain
- SPF/DKIM/DMARC handled automatically
- Real-time webhooks available for incoming mail

## Next Steps
1. Set up webhook for incoming emails → OpenClaw
2. Configure email handling logic
3. Test sending/receiving
