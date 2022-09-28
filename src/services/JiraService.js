import JiraApi from 'jira-client';

export default class JiraService {
    constructor (){
        this.jiraApi = new JiraApi({
            protocol: 'https',
            host: process.env.JIRA_HOST,
            username: process.env.JIRA_USERNAME,
            password: process.env.JIRA_PASSWORD,
            apiVersion: 'latest',
            strictSSL: true
        });
    }

  findIssue = async (issueKey) => {
    try {
      const issue = await this.jiraApi.findIssue(issueKey);
      
      return {
        key: issueKey,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority.name,
        zendeskTicketCount: issue.fields.customfield_13557 ?? "No data",
        url: this.buildIssueUrl(issueKey),
      };
    } catch (err) {
      console.error(`(${issueKey}) ${err}`);
    }
  };

  buildIssueUrl = (issueKey) => {
    return `${process.env.JIRA_HOST}/browse/${issueKey}`;
  };
}
