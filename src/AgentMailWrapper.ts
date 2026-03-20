import * as AgentMailModule from 'agentmail';
import dotenv from 'dotenv';

dotenv.config();

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  sortBy?: 'received_at' | 'sent_at' | 'subject';
  sortOrder?: 'asc' | 'desc';
}

export interface ThreadOptions {
  limit?: number;
  offset?: number;
}

export interface DraftOptions {
  subject?: string;
  text?: string;
  html?: string;
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
}

export class AgentMailWrapper {
  private agentMail: any;

  constructor() {
    const apiKey = process.env.AGENTMAIL_API_KEY;
    if (!apiKey) {
      throw new Error('AGENTMAIL_API_KEY environment variable is required');
    }
    const moduleRoot = (AgentMailModule as any);
    const am = moduleRoot.AgentMail || moduleRoot;
    const Client = moduleRoot.AgentMailClient || am.AgentMailClient;

    if (typeof Client === 'function') {
      this.agentMail = new Client({ apiKey });
    } else if (typeof am === 'function') {
      this.agentMail = new (am as any)({ apiKey });
    } else {
      this.agentMail = am;
      if (this.agentMail.apiKeys && typeof this.agentMail.apiKeys.set === 'function') {
        this.agentMail.apiKeys.set(apiKey);
      }
    }
  }

  /**
   * Send a new email
   */
  async sendEmail(
    mailboxId: string,
    options: EmailOptions
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.messages.send(mailboxId, {
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc ? Array.isArray(options.cc) ? options.cc : [options.cc] : undefined,
        bcc: options.bcc ? Array.isArray(options.bcc) ? options.bcc : [options.bcc] : undefined,
        attachments: options.attachments,
      });
      return result;
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Reply to an existing email
   */
  async replyToEmail(
    mailboxId: string,
    messageId: string,
    options: Omit<EmailOptions, 'to' | 'subject'>
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.messages.reply(mailboxId, messageId, {
        text: options.text,
        html: options.html,
        cc: options.cc ? Array.isArray(options.cc) ? options.cc : [options.cc] : undefined,
        bcc: options.bcc ? Array.isArray(options.bcc) ? options.bcc : [options.bcc] : undefined,
        attachments: options.attachments,
      });
      return result;
    } catch (error: any) {
      throw new Error(`Failed to reply to email: ${error.message}`);
    }
  }

  /**
   * Reply all to an existing email
   */
  async replyAllToEmail(
    mailboxId: string,
    messageId: string,
    options: Omit<EmailOptions, 'to' | 'subject'>
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.messages.replyAll(mailboxId, messageId, {
        text: options.text,
        html: options.html,
        cc: options.cc ? Array.isArray(options.cc) ? options.cc : [options.cc] : undefined,
        bcc: options.bcc ? Array.isArray(options.bcc) ? options.bcc : [options.bcc] : undefined,
        attachments: options.attachments,
      });
      return result;
    } catch (error: any) {
      throw new Error(`Failed to reply all to email: ${error.message}`);
    }
  }

  /**
   * Forward an existing email
   */
  async forwardEmail(
    mailboxId: string,
    messageId: string,
    options: Omit<EmailOptions, 'subject'>
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.messages.forward(mailboxId, messageId, {
        to: Array.isArray(options.to) ? options.to : [options.to],
        text: options.text,
        html: options.html,
        cc: options.cc ? Array.isArray(options.cc) ? options.cc : [options.cc] : undefined,
        bcc: options.bcc ? Array.isArray(options.bcc) ? options.bcc : [options.bcc] : undefined,
        attachments: options.attachments,
      });
      return result;
    } catch (error: any) {
      throw new Error(`Failed to forward email: ${error.message}`);
    }
  }

  /**
   * Delete the thread containing a given message ID
   */
  async deleteEmail(
    mailboxId: string,
    messageId: string
  ): Promise<void> {
    try {
      // Find the thread containing the message
      const threads = await this.getThreads(mailboxId);
      let foundThread = null;
      for (const thread of threads) {
        if (thread.messages && thread.messages.some((msg: any) => msg.id === messageId)) {
          foundThread = thread;
          break;
        }
        // If thread.messages is not populated, fetch thread details
        if (!thread.messages) {
          const fullThread = await this.getThread(mailboxId, thread.id);
          if (fullThread.messages && fullThread.messages.some((msg: any) => msg.id === messageId)) {
            foundThread = fullThread;
            break;
          }
        }
      }
      if (!foundThread) {
        throw new Error(`No thread found containing message ID: ${messageId}`);
      }
      await this.deleteThread(mailboxId, foundThread.id);
    } catch (error: any) {
      throw new Error(`Failed to delete email (thread): ${error.message}`);
    }
  }

  /**
   * Delete a thread by thread ID
   */
  async deleteThread(
    mailboxId: string,
    threadId: string
  ): Promise<void> {
    try {
      if (!this.agentMail.inboxes.threads.delete) {
        throw new Error('Thread deletion is not supported by the AgentMail SDK.');
      }
      await this.agentMail.inboxes.threads.delete(mailboxId, threadId);
    } catch (error: any) {
      throw new Error(`Failed to delete thread: ${error.message}`);
    }
  }

  /**
   * Mark an email as read
   */
  async markRead(
    mailboxId: string,
    messageId: string
  ): Promise<void> {
    try {
      await this.agentMail.inboxes.messages.markRead(mailboxId, messageId);
    } catch (error: any) {
      throw new Error(`Failed to mark email as read: ${error.message}`);
    }
  }

  /**
   * Mark an email as unread
   */
  async markUnread(
    mailboxId: string,
    messageId: string
  ): Promise<void> {
    try {
      await this.agentMail.inboxes.messages.markUnread(mailboxId, messageId);
    } catch (error: any) {
      throw new Error(`Failed to mark email as unread: ${error.message}`);
    }
  }

  /**
   * Get list of emails with optional filtering
   */
  async getEmails(
    mailboxId: string,
    options?: {
      limit?: number;
      offset?: number;
      folder?: 'inbox' | 'sent' | 'drafts' | 'trash';
      unreadOnly?: boolean;
    }
  ): Promise<any[]> {
    try {
      const result = await this.agentMail.inboxes.messages.list(mailboxId, {
        limit: options?.limit,
        offset: options?.offset,
        folder: options?.folder,
        unread_only: options?.unreadOnly,
      });
      return result.messages || [];
    } catch (error: any) {
      throw new Error(`Failed to get emails: ${error.message}`);
    }
  }

  /**
   * Get a specific email by message ID
   */
  async getEmail(
    mailboxId: string,
    messageId: string
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.messages.get(mailboxId, messageId);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to get email: ${error.message}`);
    }
  }

  /**
   * Get list of email threads
   */
  async getThreads(
    mailboxId: string,
    options?: ThreadOptions
  ): Promise<any[]> {
    try {
      const result = await this.agentMail.inboxes.threads.list(mailboxId, {
        limit: options?.limit,
        offset: options?.offset,
      });
      return result.threads || [];
    } catch (error: any) {
      throw new Error(`Failed to get threads: ${error.message}`);
    }
  }

  /**
   * Get a specific thread by thread ID
   */
  async getThread(
    mailboxId: string,
    threadId: string
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.threads.get(mailboxId, threadId);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to get thread: ${error.message}`);
    }
  }

  /**
   * Search emails with query
   */
  async searchEmails(
    mailboxId: string,
    options: SearchOptions
  ): Promise<any[]> {
    try {
      const result = await this.agentMail.inboxes.messages.search(mailboxId, {
        query: options.query,
        limit: options.limit,
        offset: options.offset,
        sort_by: options.sortBy,
        sort_order: options.sortOrder,
      });
      return result.messages || [];
    } catch (error: any) {
      throw new Error(`Failed to search emails: ${error.message}`);
    }
  }

  /**
   * Create a draft email
   */
  async createDraft(
    mailboxId: string,
    options: DraftOptions
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.drafts.create(mailboxId, {
        subject: options.subject,
        text: options.text,
        html: options.html,
        to: options.to ? Array.isArray(options.to) ? options.to : [options.to] : undefined,
        cc: options.cc ? Array.isArray(options.cc) ? options.cc : [options.cc] : undefined,
        bcc: options.bcc ? Array.isArray(options.bcc) ? options.bcc : [options.bcc] : undefined,
      });
      return result;
    } catch (error: any) {
      throw new Error(`Failed to create draft: ${error.message}`);
    }
  }

  /**
   * Get list of drafts
   */
  async getDrafts(
    mailboxId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    try {
      const result = await this.agentMail.inboxes.drafts.list(mailboxId, {
        limit: options?.limit,
        offset: options?.offset,
      });
      return result.drafts || [];
    } catch (error: any) {
      throw new Error(`Failed to get drafts: ${error.message}`);
    }
  }

  /**
   * Get a specific draft by draft ID
   */
  async getDraft(
    mailboxId: string,
    draftId: string
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.drafts.get(mailboxId, draftId);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to get draft: ${error.message}`);
    }
  }

  /**
   * Update a draft
   */
  async updateDraft(
    mailboxId: string,
    draftId: string,
    options: Partial<DraftOptions>
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.drafts.update(mailboxId, draftId, {
        subject: options.subject,
        text: options.text,
        html: options.html,
        to: options.to ? Array.isArray(options.to) ? options.to : [options.to] : undefined,
        cc: options.cc ? Array.isArray(options.cc) ? options.cc : [options.cc] : undefined,
        bcc: options.bcc ? Array.isArray(options.bcc) ? options.bcc : [options.bcc] : undefined,
      });
      return result;
    } catch (error: any) {
      throw new Error(`Failed to update draft: ${error.message}`);
    }
  }

  /**
   * Delete a draft
   */
  async deleteDraft(
    mailboxId: string,
    draftId: string
  ): Promise<void> {
    try {
      await this.agentMail.inboxes.drafts.delete(mailboxId, draftId);
    } catch (error: any) {
      throw new Error(`Failed to delete draft: ${error.message}`);
    }
  }

  /**
   * Send a draft
   */
  async sendDraft(
    mailboxId: string,
    draftId: string
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.drafts.send(mailboxId, draftId);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to send draft: ${error.message}`);
    }
  }

  /**
   * Get mailbox information
   */
  async getMailboxInfo(
    mailboxId: string
  ): Promise<any> {
    try {
      const result = await this.agentMail.inboxes.info(mailboxId);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to get mailbox info: ${error.message}`);
    }
  }
}

export function createAgentMailWrapper(): AgentMailWrapper {
  return new AgentMailWrapper();
}
