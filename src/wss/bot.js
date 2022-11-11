import SlackBolt from "@slack/bolt";
import JiraService from "../services/JiraService.js";
import { issueSlackBlock, multipleIssuesMessage } from "../services/MessageBuilderService.js";

const { App } = SlackBolt;

export default class Bot {
  constructor() {
    this.jiraService = new JiraService();

    this.app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: true,
      appToken: process.env.SLACK_APP_TOKEN,
    });

    // Listens to incoming messages that contain Jira Issue Regex Pattern
    this.app.message(
      /([A-Z][A-Z0-9]+-[0-9]+)/g,
      async ({ message, say, context, client }) => {
        try {
          if (context.matches.length >= 3) {
            client.chat.postEphemeral(multipleIssuesMessage(message.channel, message.user, context.matches)); 
          } else {
            context.matches.forEach(async (key) => {
              const issue = await this.jiraService.findIssue(key);
              if (issue) {
                await say({...issueSlackBlock(issue), thread_ts: message.thread_ts });
              }
            });
          }
        } catch (error) {
          console.error(error);
        }
      }
    );

    this.app.action("button_yes", async ({ ack, respond, say, action }) => {
      // Acknowledge action request
      await ack();

      // Close the ephemeral message
      await respond({
        response_type: "ephemeral",
        delete_original: true,
      });

      // Extract issue keys from button value
      const issueKeys = action.value.split(",");

      // Find each issue and display its information
      issueKeys.forEach(async (key) => {
        const issue = await this.jiraService.findIssue(key);
        if (issue) {
          await say(issueSlackBlock(issue));
        }
      });
    });

    this.app.action("button_no", async ({ ack, respond }) => {
      // Acknowledge action request
      await ack();

      // Close the ephemeral message
      await respond({
        response_type: "ephemeral",
        delete_original: true,
      });
    });
  }

  start = async () => {
    (async () => {
        // Start the app
        await this.app.start(process.env.PORT || 3000);
  
        console.log("⚡️ Jirabot is running!");
      })();
  };
}
