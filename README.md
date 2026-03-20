# AgentMailWrapper

AgentMailWrapper is a Node.js package and CLI tool that provides a simple interface for sending, receiving, drafting, and searching emails using the AgentMail API. It wraps the AgentMail SDK and exposes convenient commands for common email operations.

## Features
- Send, receive, Draft, Delete, and Search and manage emails from the command line using npx CLI commands
- Integrates with the AgentMail API and SDK

## Prerequisites
- Node.js (v14 or higher) installed
- An established AgentMail account ([sign up here](https://www.agentmail.to))

## Installation
Clone the repository and install dependencies:

```bash
sudo npm install -g
```

## Usage
You can use the CLI directly:

```bash
npx agentmail --help
npx agentmail --version
```

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

## Configuration
Make sure to set up your AgentMail credentials, either via environment variables or a `.env` file. Refer to the AgentMail documentation for details.

## License
MIT

