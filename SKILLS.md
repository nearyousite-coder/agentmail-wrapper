# SKILLS.md

## Overview
This document provides guidance on how to use the `AgentMailWrapper` and interact with the `agentmail` CLI interface. The `agentmail` CLI is designed to simplify email operations such as listing, sending, and managing emails.

## Prerequisites
- Node.js installed on your system.
- The `agentmail` CLI tool set up in your environment.
- Access to the AgentMail SDK.

## Instalation
```bash
npm install
nxp agentmail --version
nxp agentmail --help
```

## Using the `agentmail` CLI
The `agentmail` CLI provides the following commands:

### Forward Email
Command:
```bash
nxp agentmail forward -m <mailbox> -i <messageId> -t <recipient> [options]
```
Description:
- Forwards an email to the specified recipient(s).
- Options:
  - `-m, --mailbox <mailbox>`: Agent mailbox email address (required).
  - `-i, --id <messageId>`: Message ID to forward (required).
  - `-t, --to <recipient>`: Recipient email address(es), comma-separated (required).
  - `-b, --body <body>`: Forward plain text body (optional).
  - `-H, --html <html>`: Forward HTML body (optional).
  - `-c, --cc <cc>`: CC recipients, comma-separated (optional).
  - `-B, --bcc <bcc>`: BCC recipients, comma-separated (optional).
  - `-a, --attachment <file>`: Path to attachment file (optional).

### Delete Email
Command:
```bash
nxp agentmail delete -m <mailbox> -i <messageId>
```
Description:
- Deletes an email from the specified mailbox.
- Options:
  - `-m, --mailbox <mailbox>`: Agent mailbox email address (required).
  - `-i, --id <messageId>`: Message ID to delete (required).

### Mark Email as Read
Command:
```bash
nxp agentmail mark-read -m <mailbox> -i <messageId>
```
Description:
- Marks an email as read in the specified mailbox.
- Options:
  - `-m, --mailbox <mailbox>`: Agent mailbox email address (required).
  - `-i, --id <messageId>`: Message ID to mark as read (required).

### Mark Email as Unread
Command:
```bash
nxp agentmail mark-unread -m <mailbox> -i <messageId>
```
Description:
- Marks an email as unread in the specified mailbox.
- Options:
  - `-m, --mailbox <mailbox>`: Agent mailbox email address (required).
  - `-i, --id <messageId>`: Message ID to mark as unread (required).


### 5. Reply to Email
Command:
```bash
nxp agentmail reply -m <mailbox> -i <messageId> [options]
```
Description:
- Replies to a specific email in the mailbox.
- Options:
  - `-m, --mailbox <mailbox>`: Agent mailbox email address (required).
  - `-i, --id <messageId>`: Message ID to reply to (required).
  - `-b, --body <body>`: Reply plain text body (optional).
  - `-H, --html <html>`: Reply HTML body (optional).
  - `-c, --cc <cc>`: CC recipients, comma-separated (optional).
  - `-B, --bcc <bcc>`: BCC recipients, comma-separated (optional).
  - `-a, --attachment <file>`: Path to attachment file (optional).

### 6. Reply-All to Email
Command:
```bash
nxp agentmail reply-all -m <mailbox> -i <messageId> [options]
```
Description:
- Replies to all recipients of a specific email in the mailbox.
- Options:
  - `-m, --mailbox <mailbox>`: Agent mailbox email address (required).
  - `-i, --id <messageId>`: Message ID to reply-all to (required).
  - `-b, --body <body>`: Reply plain text body (optional).
  - `-H, --html <html>`: Reply HTML body (optional).
  - `-c, --cc <cc>`: CC recipients, comma-separated (optional).
  - `-B, --bcc <bcc>`: BCC recipients, comma-separated (optional).
  - `-a, --attachment <file>`: Path to attachment file (optional).


### 1. Send Email
Command:
```bash
nxp agentmail send -m <mailbox> -t <recipient> -s <subject> [options]
```
Description:
- Sends an email to the specified recipient(s).
- Options:
  - `-m, --mailbox <mailbox>`: Agent mailbox email address (required).
  - `-t, --to <recipient>`: Recipient email address(es), comma-separated (required).
  - `-s, --subject <subject>`: Email subject (required).
  - `-b, --body <body>`: Plain text body (optional).
  - `-H, --html <html>`: HTML body (optional).
  - `-c, --cc <cc>`: CC recipients, comma-separated (optional).
  - `-B, --bcc <bcc>`: BCC recipients, comma-separated (optional).
  - `-a, --attachment <file>`: Path to attachment file (optional).

### 2. List Emails
Command:
```bash
nxp agentmail list -m <mailbox> [options]
```
Description:
- Lists emails from a specified mailbox.
- Options:
  - `-m, --mailbox <mailbox>`: Agent mailbox email address (required).
  - `-l, --limit <number>`: Number of emails to fetch (default: 20).
  - `-f, --folder <folder>`: Folder to fetch emails from (default: inbox).
  - `-u, --unread`: Only show unread emails (optional).

### 3. Get Email
Command:
```bash
nxp agentmail get -m <mailbox> -i <messageId>
```
Description:
- Fetches and displays details of a specific email.
- Options:
  - `-m, --mailbox <mailbox>`: Agent mailbox email address (required).
  - `-i, --id <messageId>`: Message ID of the email to fetch (required).

### 4. Search Emails
Command:
```bash
nxp agentmail search -m <mailbox> -q <query> [options]
```
Description:
- Searches emails in a specified mailbox based on a query.
- Options:
  - `-m, --mailbox <mailbox>`: Agent mailbox email address (required).
  - `-q, --query <query>`: Search query (required).
  - `-l, --limit <number>`: Maximum number of results (default: 10).

## AgentMailWrapper
The `AgentMailWrapper` is a JavaScript module that wraps the AgentMail SDK, providing utility functions for email operations.

### Key Functions
1. `getEmails(mailbox, options)`
   - Fetches a list of emails from the specified mailbox.
   - Options include `limit`, `folder`, and `unreadOnly`.

2. `getEmail(mailbox, emailId)`
   - Fetches the details of a specific email by its ID.

3. `sendEmail(mailbox, emailOptions)`
   - Sends an email using the specified mailbox and options.

### Example Usage
```javascript
const AgentMailWrapper = require('./dist/AgentMailWrapper');

// Initialize the wrapper
const agentMail = new AgentMailWrapper();

// List emails
agentMail.getEmails('example@mail.com', { limit: 10, folder: 'inbox' })
  .then(emails => {
    console.log('Emails:', emails);
  });

// Send an email
agentMail.sendEmail('example@mail.com', {
  to: ['recipient@mail.com'],
  subject: 'Hello',
  text: 'This is a test email.',
})
  .then(response => {
    console.log('Email sent:', response);
  });

// Get a specific email
agentMail.getEmail('example@mail.com', 'message-id-123')
  .then(email => {
    console.log('Email details:', email);
  });
```

## Notes
- Ensure that the AgentMail SDK is properly configured with your credentials.
- Use the `agentmail` CLI for quick operations and the `AgentMailWrapper` for programmatic access.

For further assistance, refer to the project documentation or contact the development team.