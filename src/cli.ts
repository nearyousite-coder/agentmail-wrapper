#!/usr/bin/env node

import { createAgentMailWrapper } from './AgentMailWrapper';
import { Command } from 'commander';

const program = new Command();

function formatSender(from: any): string {
  if (!from) return 'Unknown';
  if (typeof from === 'string') return from;
  if (Array.isArray(from)) return from.map(f => formatSender(f)).join(', ');
  if (typeof from === 'object') {
    const name = from.name || from.displayName || from.label;
    const email = from.email || from.address || from.value;
    if (name && email) return `${name} <${email}>`;
    return email || name || JSON.stringify(from);
  }
  return String(from);
}

function extractId(msg: any): string | undefined {
  return msg.id || msg.messageId || msg.message_id || msg.MessageId || msg.MessageID || msg.Message_Id || msg.Message || undefined;
}

function extractDate(msg: any): string | undefined {
  return msg.date || msg.received_at || msg.receivedAt || msg.created_at || msg.createdAt || msg.MessageCreatedAt || msg.message_date || msg.timestamp || undefined;
}

program
  .name('agentmail')
  .description('CLI tool for sending and managing emails via AgentMail')
  .version('1.0.0');

// Send email command
program
  .command('send')
  .description('Send an email')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-t, --to <recipient>', 'Recipient email address(es)', (val) => val.split(','))
  .requiredOption('-s, --subject <subject>', 'Email subject')
  .option('-b, --body <body>', 'Plain text body')
  .option('-H, --html <html>', 'HTML body')
  .option('-c, --cc <cc>', 'CC recipients', (val) => val.split(','))
  .option('-B, --bcc <bcc>', 'BCC recipients', (val) => val.split(','))
  .option('-a, --attachment <file>', 'Path to attachment file')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();

      const emailOptions: any = {
        to: options.to,
        subject: options.subject,
      };

      if (options.body) emailOptions.text = options.body;
      if (options.html) emailOptions.html = options.html;
      if (options.cc) emailOptions.cc = options.cc;
      if (options.bcc) emailOptions.bcc = options.bcc;

      if (options.attachment) {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.resolve(options.attachment);
        const content = fs.readFileSync(filePath, { encoding: 'base64' });
        emailOptions.attachments = [{
          filename: path.basename(filePath),
          content,
        }];
      }

      const result = await mail.sendEmail(options.mailbox, emailOptions);
      console.log('✓ Email sent successfully!');
      console.log(`Message ID: ${result.messageId || result.id || 'N/A'}`);
    } catch (error: any) {
      console.error('✗ Failed to send email:', error.message);
      process.exit(1);
    }
  });

// List emails command
program
  .command('list')
  .description('List emails from a mailbox')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .option('-l, --limit <number>', 'Number of emails to fetch', '20')
  .option('-f, --folder <folder>', 'Folder: inbox, sent, drafts, trash', 'inbox')
  .option('-u, --unread', 'Only show unread emails')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      const emails = await mail.getEmails(options.mailbox, {
        limit: parseInt(options.limit),
        folder: options.folder,
        unreadOnly: options.unread,
      });

      if (emails.length === 0) {
        console.log('No emails found.');
      } else {
        console.log(`\nFound ${emails.length} email(s):\n`);
        emails.forEach((email: any, idx: number) => {
          const id = extractId(email) || 'N/A';
          const date = extractDate(email) || 'N/A';
          console.log(`${idx + 1}. ${formatSender(email.from)} | ${email.subject || 'No subject'}`);
          console.log(`   ID: ${id} | Date: ${date}\n`);
        });
      }
    } catch (error: any) {
      console.error('✗ Failed to list emails:', error.message);
      process.exit(1);
    }
  });

// Get email command
program
  .command('get')
  .description('Get a specific email')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-i, --id <messageId>', 'Message ID')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      const email = await mail.getEmail(options.mailbox, options.id);

      console.log('\n=== Email Details ===');
      console.log(`From: ${formatSender(email.from)}`);
      console.log(`To: ${Array.isArray(email.to) ? email.to.join(', ') : email.to || 'N/A'}`);
      console.log(`Subject: ${email.subject || 'No subject'}`);
      console.log(`Date: ${extractDate(email) || 'N/A'}`);
      if (email.cc) console.log(`CC: ${email.cc}`);
      console.log('\n--- Body ---');
      console.log(email.body?.text || email.text || email.html || 'No body');
      if (email.attachments?.length) {
        console.log(`\nAttachments: ${email.attachments.map((a: any) => a.filename).join(', ')}`);
      }
    } catch (error: any) {
      console.error('✗ Failed to get email:', error.message);
      process.exit(1);
    }
  });

// Search emails command
program
  .command('search')
  .description('Search emails')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-q, --query <query>', 'Search query')
  .option('-l, --limit <number>', 'Max results', '10')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      const results = await mail.searchEmails(options.mailbox, {
        query: options.query,
        limit: parseInt(options.limit),
      });

      if (results.length === 0) {
        console.log('No matching emails found.');
      } else {
        console.log(`\nFound ${results.length} matching email(s):\n`);
        results.forEach((email: any, idx: number) => {
          const id = extractId(email) || 'N/A';
          console.log(`${idx + 1}. ${formatSender(email.from)} | ${email.subject || 'No subject'}`);
          console.log(`   ID: ${id}\n`);
        });
      }
    } catch (error: any) {
      console.error('✗ Failed to search emails:', error.message);
      process.exit(1);
    }
  });

// Reply to email command
program
  .command('reply')
  .description('Reply to an email')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-i, --id <messageId>', 'Message ID to reply to')
  .option('-b, --body <body>', 'Reply plain text body')
  .option('-H, --html <html>', 'Reply HTML body')
  .option('-c, --cc <cc>', 'CC recipients', (val) => val.split(','))
  .option('-B, --bcc <bcc>', 'BCC recipients', (val) => val.split(','))
  .option('-a, --attachment <file>', 'Path to attachment file')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      const replyOptions :any = {
        text: options.body,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
      };
      if (options.attachment) {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.resolve(options.attachment);
        const content = fs.readFileSync(filePath, { encoding: 'base64' });
        replyOptions.attachments = [{
          filename: path.basename(filePath),
          content,
        }];
      }
      const result = await mail.replyToEmail(options.mailbox, options.id, replyOptions);
      console.log('✓ Reply sent successfully!');
      console.log(`Message ID: ${result.messageId || result.id || 'N/A'}`);
    } catch (error: any) {
      console.error('✗ Failed to reply to email:', error.message);
      process.exit(1);
    }
  });

// Reply-all to email command
program
  .command('reply-all')
  .description('Reply-all to an email')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-i, --id <messageId>', 'Message ID to reply-all to')
  .option('-b, --body <body>', 'Reply plain text body')
  .option('-H, --html <html>', 'Reply HTML body')
  .option('-c, --cc <cc>', 'CC recipients', (val) => val.split(','))
  .option('-B, --bcc <bcc>', 'BCC recipients', (val) => val.split(','))
  .option('-a, --attachment <file>', 'Path to attachment file')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      const replyOptions :any = {
        text: options.body,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
      };
      if (options.attachment) {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.resolve(options.attachment);
        const content = fs.readFileSync(filePath, { encoding: 'base64' });
        replyOptions.attachments = [{
          filename: path.basename(filePath),
          content,
        }];
      }
      const result = await mail.replyAllToEmail(options.mailbox, options.id, replyOptions);
      console.log('✓ Reply-all sent successfully!');
      console.log(`Message ID: ${result.messageId || result.id || 'N/A'}`);
    } catch (error: any) {
      console.error('✗ Failed to reply-all to email:', error.message);
      process.exit(1);
    }
  });

// Draft commands
program
  .command('draft')
  .description('Create a draft')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-s, --subject <subject>', 'Draft subject')
  .option('-b, --body <body>', 'Plain text body')
  .option('-t, --to <recipient>', 'Recipient email(s)', (val) => val.split(','))
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      const draft = await mail.createDraft(options.mailbox, {
        subject: options.subject,
        text: options.body,
        to: options.to,
      });
      console.log('✓ Draft created successfully!');
      console.log(`Draft ID: ${draft.id || draft.draftId || 'N/A'}`);
    } catch (error: any) {
      console.error('✗ Failed to create draft:', error.message);
      process.exit(1);
    }
  });

program
  .command('drafts')
  .description('List all drafts')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      const drafts = await mail.getDrafts(options.mailbox);

      if (drafts.length === 0) {
        console.log('No drafts found.');
      } else {
        console.log(`\nFound ${drafts.length} draft(s):\n`);
        drafts.forEach((draft: any, idx: number) => {
          console.log(`${idx + 1}. ${draft.subject || 'No subject'}`);
          console.log(`   ID: ${draft.draftId} | To: ${draft.to?.join(', ') || 'None'}\n`);
        });
      }
    } catch (error: any) {
      console.error('✗ Failed to list drafts:', error.message);
      process.exit(1);
    }
  });

// Send draft command
program
  .command('draft-send')
  .description('Send a draft email by draft ID')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-i, --id <draftId>', 'Draft ID to send')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      const sentMessage = await mail.sendDraft(options.mailbox, options.id);
      console.log('✓ Draft sent successfully!');
      console.log(`Sent Message ID: ${sentMessage.messageId || sentMessage.id || 'N/A'}`);
    } catch (error: any) {
      console.error('✗ Failed to send draft:', error.message);
      process.exit(1);
    }
  });

// Forward email command
program
  .command('forward')
  .description('Forward an email')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-i, --id <messageId>', 'Message ID to forward')
  .requiredOption('-t, --to <recipient>', 'Recipient email address(es)', (val) => val.split(','))
  .option('-b, --body <body>', 'Forward plain text body')
  .option('-H, --html <html>', 'Forward HTML body')
  .option('-c, --cc <cc>', 'CC recipients', (val) => val.split(','))
  .option('-B, --bcc <bcc>', 'BCC recipients', (val) => val.split(','))
  .option('-a, --attachment <file>', 'Path to attachment file')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      const forwardOptions: any = {
        to: options.to,
        text: options.body,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
      };
      if (options.attachment) {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.resolve(options.attachment);
        const content = fs.readFileSync(filePath, { encoding: 'base64' });
        forwardOptions.attachments = [{
          filename: path.basename(filePath),
          content,
        }];
      }
      const result = await mail.forwardEmail(options.mailbox, options.id, forwardOptions);
      console.log('✓ Email forwarded successfully!');
      console.log(`Message ID: ${result.messageId || result.id || 'N/A'}`);
    } catch (error: any) {
      console.error('✗ Failed to forward email:', error.message);
      process.exit(1);
    }
  });

// Delete email command
program
  .command('delete')
  .description('Delete an email (deletes the entire thread containing the message)')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-i, --id <messageId>', 'Message ID to delete (deletes the thread)')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      await mail.deleteEmail(options.mailbox, options.id);
      console.log('✓ Thread containing the email deleted successfully!');
    } catch (error: any) {
      console.error('✗ Failed to delete email/thread:', error.message);
      process.exit(1);
    }
  });

// Mark email as read command
program
  .command('mark-read')
  .description('Mark an email as read')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-i, --id <messageId>', 'Message ID to mark as read')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      await mail.markRead(options.mailbox, options.id);
      console.log('✓ Email marked as read!');
    } catch (error: any) {
      console.error('✗ Failed to mark email as read:', error.message);
      process.exit(1);
    }
  });

// Mark email as unread command
program
  .command('mark-unread')
  .description('Mark an email as unread')
  .requiredOption('-m, --mailbox <mailbox>', 'Agent mailbox email address')
  .requiredOption('-i, --id <messageId>', 'Message ID to mark as unread')
  .action(async (options) => {
    try {
      const mail = createAgentMailWrapper();
      await mail.markUnread(options.mailbox, options.id);
      console.log('✓ Email marked as unread!');
    } catch (error: any) {
      console.error('✗ Failed to mark email as unread:', error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
