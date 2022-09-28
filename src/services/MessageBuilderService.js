export const issueSlackBlock = (issue) => ({
    "text": `Issue ${issue.key}!`,
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

  export const multipleIssuesMessage = (channel, user, issues) => (
    {
        channel,
        user,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Hey there <@${user}>! I found ${issues.length} potential Jira Issues. Do you want to see information of all of them?`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Yes",
                },
                style: "primary",
                value: issues.join(","),
                action_id: "button_yes",
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "No",
                },
                style: "danger",
                action_id: "button_no",
              },
            ],
          },
        ],
        text: "Multiple issues found!",
      }
  );
  