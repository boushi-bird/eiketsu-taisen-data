import { LoggerOptions } from 'winston';
import Transport from 'winston-transport';
import { WebClient as SlackWebClient } from '@slack/web-api';

interface SlackLoggerOption extends LoggerOptions {
  token: string;
  channelId:
    | string
    | {
        info: string;
        warn?: string;
        error: string;
      };
}

export default class SlackTransport extends Transport {
  private opts: SlackLoggerOption;
  private slackClient: SlackWebClient;
  private enabled: boolean = false;
  private slackTestDone: boolean = false;

  constructor(opts: SlackLoggerOption) {
    super(opts);
    this.opts = opts;
    this.slackClient = new SlackWebClient(opts.token);
  }

  private async authTest() {
    if (this.slackTestDone) {
      return;
    }
    this.slackTestDone = true;
    try {
      const r = await this.slackClient.auth.test();
      this.enabled = r.ok;
    } catch (e) {
      console.error(e);
    }
  }

  private channelId(level: string): string {
    if (typeof this.opts.channelId === 'string') {
      return this.opts.channelId;
    }
    switch (level) {
      case 'warn':
        return this.opts.channelId.warn || this.opts.channelId.error;
      case 'error':
        return this.opts.channelId.error;
      case 'info':
      default:
        return this.opts.channelId.info;
    }
  }

  private createMessage(level: string, message: string) {
    const channel = this.channelId(level);
    let text = message;
    switch (level) {
      case 'info':
      case 'warn':
        return { channel, text };
      case 'error':
        return { channel, text: `<!channel> ${text}` };
      default:
        return null;
    }
  }

  private async sendLog(info: { level: string; message: string }) {
    await this.authTest();
    if (!this.enabled) {
      return;
    }
    const msg = this.createMessage(info.level, info.message);
    if (msg == null) {
      return;
    }
    await this.slackClient.chat.postMessage(msg);
  }

  async log(info: { level: string; message: string }, next: Function) {
    try {
      await this.sendLog(info);
    } catch (e) {
      this.enabled = false;
      console.error(e);
    } finally {
      next();
    }
  }
}
