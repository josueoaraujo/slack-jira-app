const { App } = require('@slack/bolt');
const JiraApi = require('jira-client');

require('dotenv').config();

const jiraApi = new JiraApi({
  protocol: 'https',
  host: process.env.JIRA_HOST,
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_PASSWORD,
  apiVersion: 'latest',
  strictSSL: true
});

// Initializes your app with your bot token and app token
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, // enable the following to use socket mode
  appToken: process.env.SLACK_APP_TOKEN,
});

const findIssue = async (issueId) => {
  try{
  const issue = await jiraApi.findIssue(issueId);
  return {
    key: issueId,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    priority: issue.fields.priority.name,
    zendeskTicketCount: issue.fields.customfield_13557 ?? 'No data',
    url: buildIssueUrl(issueId)
  };
  } catch (err) {
    console.error(`(${issueId}) ${err}`);
  }
}

const issueSlackBlock = (issue) => ({
  "text": `Issue ${issue.key}`,
  "attachments": [
    {
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `*<${issue.url}|${issue.summary}>*`
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": `*Status:*\n${issue.status}`
            },
            {
              "type": "mrkdwn",
              "text": `*Priority:*\n${issue.priority}`
            },
            {
              "type": "mrkdwn",
              "text": `*Zendesk Ticket Count:*\n${issue.zendeskTicketCount}`
            }
          ]
        }
      ]
    }
  ]
});

const buildIssueUrl = (issueId) => {
  return `${process.env.JIRA_HOST}/browse/${issueId}`;
}
// Listens to incoming messages that contain Jira Issue Regex Pattern
app.message(/([A-Z][A-Z0-9]+-[0-9]+)/g, async ({message, say, context, client}) => {
  try {
    if(context.matches.length >= 3)
    {
      client.chat.postEphemeral({
        channel: message.channel,
        user: message.user,
        blocks: 
          [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": `Hey there <@${message.user}>! I found ${context.matches.length} potential Jira Issues. Do you want to see information of all of them?`
              }
            },
            {
              "type": "actions",
              "elements": [
                {
                  "type": "button",
                  "text": {
                    "type": "plain_text",
                    "text": "Yes"
                  },
                  "style": "primary",
                  "value": context.matches.join(','),
                  "action_id": "button_yes",
                },
                {
                  "type": "button",
                  "text": {
                    "type": "plain_text",
                    "text": "No"
                  },
                  "style": "danger",
                  "action_id": "button_no",
                }
              ]
            }
          ]
        ,
        text: 'Fallback'
      });
    }
    else {
      context.matches.forEach(async key => {
        const issue = await findIssue(key);
        if(issue) {
          await say(issueSlackBlock(issue));
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
});

app.action('button_yes', async ({ ack, respond, say, action }) => {
  // Acknowledge action request
  await ack();
  await respond({
    'response_type': 'ephemeral',
    'delete_original': true
  });

  const issueKeys = action.value.split(',');
  issueKeys.forEach(async key => {
    const issue = await findIssue(key);
    if(issue) {
      await say(issueSlackBlock(issue));
    }
  });
});

app.action('button_no', async ({ ack, respond }) => {
  // Acknowledge action request
  await ack();
  await respond({
    'response_type': 'ephemeral',
    'delete_original': true
  });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
