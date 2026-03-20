import { AgentMailWrapper, createAgentMailWrapper } from '../src/AgentMailWrapper';
import { AgentMail } from 'agentmail';

const MockAgentMail = AgentMail as any;

// Mock the agentmail module directly
jest.mock('agentmail', () => {
  const messages = {
    send: jest.fn().mockResolvedValue({ success: true, messageId: 'test123' }),
    reply: jest.fn().mockResolvedValue({ success: true, messageId: 'reply123' }),
    replyAll: jest.fn().mockResolvedValue({ success: true, messageId: 'replyall123' }),
    forward: jest.fn().mockResolvedValue({ success: true, messageId: 'forward123' }),
    list: jest.fn().mockResolvedValue({ messages: [{ id: 'msg1', subject: 'Test' }] }),
    get: jest.fn().mockResolvedValue({ id: 'msg1', subject: 'Test Email' }),
    search: jest.fn().mockResolvedValue({ messages: [{ id: 'msg1', subject: 'Search Result' }] }),
  };

  const threads = {
    list: jest.fn().mockResolvedValue({ threads: [{ id: 'thread1', subject: 'Thread Test' }] }),
    get: jest.fn().mockResolvedValue({ id: 'thread1', messages: [] }),
  };

  const drafts = {
    create: jest.fn().mockResolvedValue({ success: true, draftId: 'draft123' }),
    list: jest.fn().mockResolvedValue({ drafts: [{ id: 'draft1', subject: 'Draft Test' }] }),
    get: jest.fn().mockResolvedValue({ id: 'draft1', subject: 'Draft Subject' }),
    update: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true }),
    send: jest.fn().mockResolvedValue({ success: true, messageId: 'sent123' }),
  };

  const inboxes = {
    messages,
    threads,
    drafts,
    info: jest.fn().mockResolvedValue({ email: 'test@example.com', status: 'active' }),
  };

  return {
    AgentMail: {
      apiKeys: {
        set: jest.fn(),
      },
      inboxes,
    },
  };
});

describe('AgentMailWrapper', () => {
  let wrapper: AgentMailWrapper;
  const testMailboxId = 'test@example.com';

  beforeEach(() => {
    process.env.AGENTMAIL_API_KEY = 'test-api-key';
    // Reset all mocks
    MockAgentMail.apiKeys.set = jest.fn();
    MockAgentMail.inboxes.messages.send = jest.fn().mockResolvedValue({ success: true, messageId: 'test123' });
    MockAgentMail.inboxes.messages.reply = jest.fn().mockResolvedValue({ success: true, messageId: 'reply123' });
    MockAgentMail.inboxes.messages.replyAll = jest.fn().mockResolvedValue({ success: true, messageId: 'replyall123' });
    MockAgentMail.inboxes.messages.forward = jest.fn().mockResolvedValue({ success: true, messageId: 'forward123' });
    MockAgentMail.inboxes.messages.list = jest.fn().mockResolvedValue({ messages: [{ id: 'msg1', subject: 'Test' }] });
    MockAgentMail.inboxes.messages.get = jest.fn().mockResolvedValue({ id: 'msg1', subject: 'Test Email' });
    MockAgentMail.inboxes.messages.search = jest.fn().mockResolvedValue({ messages: [{ id: 'msg1', subject: 'Search Result' }] });
    MockAgentMail.inboxes.threads.list = jest.fn().mockResolvedValue({ threads: [{ id: 'thread1', subject: 'Thread Test' }] });
    MockAgentMail.inboxes.threads.get = jest.fn().mockResolvedValue({ id: 'thread1', messages: [] });
    MockAgentMail.inboxes.drafts.create = jest.fn().mockResolvedValue({ success: true, draftId: 'draft123' });
    MockAgentMail.inboxes.drafts.list = jest.fn().mockResolvedValue({ drafts: [{ id: 'draft1', subject: 'Draft Test' }] });
    MockAgentMail.inboxes.drafts.get = jest.fn().mockResolvedValue({ id: 'draft1', subject: 'Draft Subject' });
    MockAgentMail.inboxes.drafts.update = jest.fn().mockResolvedValue({ success: true });
    MockAgentMail.inboxes.drafts.delete = jest.fn().mockResolvedValue({ success: true });
    MockAgentMail.inboxes.drafts.send = jest.fn().mockResolvedValue({ success: true, messageId: 'sent123' });
    MockAgentMail.inboxes.info = jest.fn().mockResolvedValue({ email: 'test@example.com', status: 'active' });

    wrapper = createAgentMailWrapper();
  });

  describe('Constructor', () => {
    it('should throw error if AGENTMAIL_API_KEY is missing', () => {
      delete process.env.AGENTMAIL_API_KEY;
      expect(() => createAgentMailWrapper()).toThrow('AGENTMAIL_API_KEY environment variable is required');
    });

    it('should initialize successfully with valid env vars', () => {
      expect(wrapper).toBeInstanceOf(AgentMailWrapper);
    });
  });

  describe('Email Operations', () => {
    it('should send an email successfully', async () => {
      const result = await wrapper.sendEmail(testMailboxId, {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test body',
      });

      expect(result).toEqual({ success: true, messageId: 'test123' });
      expect(MockAgentMail.inboxes.messages.send).toHaveBeenCalledWith(testMailboxId, {
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        text: 'Test body',
        html: undefined,
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
      });
    });

    it('should reply to an email', async () => {
      const result = await wrapper.replyToEmail(testMailboxId, 'msg123', {
        text: 'Reply body',
      });

      expect(result).toEqual({ success: true, messageId: 'reply123' });
      expect(MockAgentMail.inboxes.messages.reply).toHaveBeenCalledWith(testMailboxId, 'msg123', {
        text: 'Reply body',
        html: undefined,
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
      });
    });

    it('should forward an email', async () => {
      const result = await wrapper.forwardEmail(testMailboxId, 'msg123', {
        to: 'recipient2@example.com',
        text: 'Forward body',
      });
      expect(result).toEqual({ success: true, messageId: 'forward123' });
      expect(MockAgentMail.inboxes.messages.forward).toHaveBeenCalledWith(testMailboxId, 'msg123', {
        to: ['recipient2@example.com'],
        text: 'Forward body',
        html: undefined,
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
      });
    });

    it('should delete an email (thread-based)', async () => {
      // Mock thread and thread deletion
      MockAgentMail.inboxes.threads.list = jest.fn().mockResolvedValue({ threads: [{ id: 'thread1', messages: [{ id: 'msg123' }] }] });
      MockAgentMail.inboxes.threads.delete = jest.fn().mockResolvedValue({ success: true });
      await wrapper.deleteEmail(testMailboxId, 'msg123');
      expect(MockAgentMail.inboxes.threads.delete).toHaveBeenCalledWith(testMailboxId, 'thread1');
    });

    it('should mark an email as read', async () => {
      // Add mock implementation for markRead
      MockAgentMail.inboxes.messages.markRead = jest.fn().mockResolvedValue({ success: true });
      await wrapper.markRead(testMailboxId, 'msg123');
      expect(MockAgentMail.inboxes.messages.markRead).toHaveBeenCalledWith(testMailboxId, 'msg123');
    });

    it('should mark an email as unread', async () => {
      // Add mock implementation for markUnread
      MockAgentMail.inboxes.messages.markUnread = jest.fn().mockResolvedValue({ success: true });
      await wrapper.markUnread(testMailboxId, 'msg123');
      expect(MockAgentMail.inboxes.messages.markUnread).toHaveBeenCalledWith(testMailboxId, 'msg123');
    });

    it('should reply all to an email', async () => {
      const result = await wrapper.replyAllToEmail(testMailboxId, 'msg123', {
        text: 'Reply all body',
      });

      expect(result).toEqual({ success: true, messageId: 'replyall123' });
      expect(MockAgentMail.inboxes.messages.replyAll).toHaveBeenCalledWith(testMailboxId, 'msg123', {
        text: 'Reply all body',
        html: undefined,
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
      });
    });

    it('should forward an email', async () => {
      const result = await wrapper.forwardEmail(testMailboxId, 'msg123', {
        to: 'forward@example.com',
        text: 'Forward body',
      });

      expect(result).toEqual({ success: true, messageId: 'forward123' });
      expect(MockAgentMail.inboxes.messages.forward).toHaveBeenCalledWith(testMailboxId, 'msg123', {
        to: ['forward@example.com'],
        text: 'Forward body',
        html: undefined,
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
      });
    });
  });

  describe('Receiving Emails', () => {
    it('should get list of emails', async () => {
      const emails = await wrapper.getEmails(testMailboxId);
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toBe('Test');
      expect(MockAgentMail.inboxes.messages.list).toHaveBeenCalledWith(testMailboxId, {});
    });

    it('should get a specific email', async () => {
      const email = await wrapper.getEmail(testMailboxId, 'msg1');
      expect(email.subject).toBe('Test Email');
      expect(MockAgentMail.inboxes.messages.get).toHaveBeenCalledWith(testMailboxId, 'msg1');
    });

    it('should get list of threads', async () => {
      const threads = await wrapper.getThreads(testMailboxId);
      expect(threads).toHaveLength(1);
      expect(threads[0].subject).toBe('Thread Test');
      expect(MockAgentMail.inboxes.threads.list).toHaveBeenCalledWith(testMailboxId, {});
    });

    it('should get a specific thread', async () => {
      const thread = await wrapper.getThread(testMailboxId, 'thread1');
      expect(thread.id).toBe('thread1');
      expect(MockAgentMail.inboxes.threads.get).toHaveBeenCalledWith(testMailboxId, 'thread1');
    });

    it('should search emails', async () => {
      const results = await wrapper.searchEmails(testMailboxId, { query: 'test' });
      expect(results).toHaveLength(1);
      expect(results[0].subject).toBe('Search Result');
      expect(MockAgentMail.inboxes.messages.search).toHaveBeenCalledWith(testMailboxId, {
        query: 'test',
        limit: undefined,
        offset: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
    });
  });

  describe('Draft Operations', () => {
    it('should create a draft', async () => {
      const result = await wrapper.createDraft(testMailboxId, {
        subject: 'Draft Subject',
        text: 'Draft body',
      });

      expect(result).toEqual({ success: true, draftId: 'draft123' });
      expect(MockAgentMail.inboxes.drafts.create).toHaveBeenCalledWith(testMailboxId, {
        subject: 'Draft Subject',
        text: 'Draft body',
        html: undefined,
        to: undefined,
        cc: undefined,
        bcc: undefined,
      });
    });

    it('should get list of drafts', async () => {
      const drafts = await wrapper.getDrafts(testMailboxId);
      expect(drafts).toHaveLength(1);
      expect(drafts[0].subject).toBe('Draft Test');
      expect(MockAgentMail.inboxes.drafts.list).toHaveBeenCalledWith(testMailboxId, {});
    });

    it('should get a specific draft', async () => {
      const draft = await wrapper.getDraft(testMailboxId, 'draft1');
      expect(draft.subject).toBe('Draft Subject');
      expect(MockAgentMail.inboxes.drafts.get).toHaveBeenCalledWith(testMailboxId, 'draft1');
    });

    it('should update a draft', async () => {
      const result = await wrapper.updateDraft(testMailboxId, 'draft1', {
        subject: 'Updated Subject',
      });

      expect(result).toEqual({ success: true });
      expect(MockAgentMail.inboxes.drafts.update).toHaveBeenCalledWith(testMailboxId, 'draft1', {
        subject: 'Updated Subject',
        text: undefined,
        html: undefined,
        to: undefined,
        cc: undefined,
        bcc: undefined,
      });
    });

    it('should delete a draft', async () => {
      await expect(wrapper.deleteDraft(testMailboxId, 'draft1')).resolves.not.toThrow();
      expect(MockAgentMail.inboxes.drafts.delete).toHaveBeenCalledWith(testMailboxId, 'draft1');
    });

    it('should send a draft', async () => {
      const result = await wrapper.sendDraft(testMailboxId, 'draft1');
      expect(result).toEqual({ success: true, messageId: 'sent123' });
      expect(MockAgentMail.inboxes.drafts.send).toHaveBeenCalledWith(testMailboxId, 'draft1');
    });
  });

  describe('Mailbox Operations', () => {
    it('should get mailbox info', async () => {
      const info = await wrapper.getMailboxInfo(testMailboxId);
      expect(info.email).toBe('test@example.com');
      expect(info.status).toBe('active');
      expect(MockAgentMail.inboxes.info).toHaveBeenCalledWith(testMailboxId);
    });
  });
});
