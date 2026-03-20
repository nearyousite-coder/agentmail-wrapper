# AgentMailWrapper

AgentMailWrapper is a Node.js package and CLI tool that provides a simple interface for sending, receiving, drafting, and searching emails using the AgentMail API. It wraps the AgentMail SDK and exposes convenient commands for common email operations.

## Features
- Send, receive, and manage emails from the command line
- Draft and search emails
- Integrates with the AgentMail API and SDK

## Prerequisites
- Node.js (v14 or higher) installed
- An established AgentMail account ([sign up here](https://www.agentmail.to))

## Installation
Clone the repository and install dependencies:

```bash
npm install
```

## Usage
You can use the CLI directly:

```bash
npx agentmail --help
npx agentmail --version
```

Or import the wrapper in your Node.js project:

```js
const AgentMailWrapper = require('agentmail-wrapper');
// Use AgentMailWrapper in your code
```

## Configuration
Make sure to set up your AgentMail credentials, either via environment variables or a `.env` file. Refer to the AgentMail documentation for details.

## License
MIT

