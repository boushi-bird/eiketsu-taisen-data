import winston, { format } from 'winston';
import Transport from 'winston-transport';
import SlackTransport from './slack-transport';

const formatter = format.printf(
  ({ level, timestamp, message }) => `${timestamp} [${level}] ${message}`,
);

const transports: Transport[] = [
  new winston.transports.Console({
    level: 'debug',
  }),
];

const slackToken = process.env.SLACK_TOKEN;
const slackChannelId =
  process.env.SLACK_INFO_CHANNEL_ID || process.env.SLACK_CHANNEL_ID;

if (slackToken && slackChannelId) {
  const options = process.env.SLACK_ERROR_CHANNEL_ID
    ? {
        token: slackToken,
        channelId: {
          info: slackChannelId,
          warn: process.env.SLACK_WARN_CHANNEL_ID,
          error: process.env.SLACK_ERROR_CHANNEL_ID,
        },
      }
    : { token: slackToken, channelId: slackChannelId };
  transports.push(new SlackTransport(options));
}

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), formatter),
  transports,
});

export default logger;
