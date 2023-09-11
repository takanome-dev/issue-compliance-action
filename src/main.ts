import * as core from '@actions/core'
import * as github from '@actions/github'
// import * as yaml from 'js-yaml';
import { context } from '@actions/github/lib/utils'

import { checkTitle, escapeChecks } from './checks'
import { Comment } from './types'

// type PullRequestReview = {
//   id: number
//   node_id: string
//   user: {
//     login: string
//     id: number
//     node_id: string
//   } | null
//   body: string
//   state: string
// }

const repoToken = core.getInput('token')
const label = core.getInput('label')
const baseComment = core.getInput('base-comment')
const titleComment = core.getInput('title-comment')
const issueTemplateTypes = core.getInput('issue-templates-types')
const titleCheckEnable = core.getBooleanInput('title-check-enable')
const forbiddenCharacters = core.getInput('forbidden-characters')
const defaultIssueTitle = core.getInput('default-title')
const defaultIssueTitleComment = core.getInput('default-title-comment')
const client = github.getOctokit(repoToken)

// import * as core from '@actions/core';
// import * as github from '@actions/github';

async function getIssueTemplateTitles() {
  const octokit = github.getOctokit(core.getInput('github-token'))
  const { owner, repo } = github.context.repo

  // Get the contents of the .github/ISSUE_TEMPLATE directory
  const response = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: '.github/ISSUE_TEMPLATE'
  })

  console.log('--------------------------------------------')
  console.log(JSON.stringify(response.data, null, 2))
  console.log('--------------------------------------------')

  // Extract the issue title from each file
  // const titles = response.data
  //   .filter(file => file.type === 'file' && file.name.endsWith('.md'))
  //   .map(async file => {
  //     const content = await octokit.rest.repos.getContent({
  //       owner,
  //       repo,
  //       path: file.path
  //     });
  //     const template = yaml.safeLoad(Buffer.from(content.data.content, 'base64').toString());
  //     return template.title.split(':')[0].trim();
  //   });

  // return Promise.all(titles);
}

async function run(): Promise<void> {
  try {
    const ctx = github.context
    const issue = ctx.issue
    const repoOwner = context.repo.owner

    const isClosed =
      (ctx.payload.issue?.state ?? 'open').toLowerCase() === 'closed'
    // eslint-disable-next-line no-console
    console.log({ repoOwner, issue, isClosed })

    if (isClosed) {
      escapeChecks(
        false,
        'The issue is closed, skipping checks, setting all outputs to false.'
      )
      return
    }

    const author = ctx.payload.issue?.user?.login ?? ''
    const body = ctx.payload.issue?.body ?? ''
    const title = ctx.payload.issue?.title ?? ''

    // eslint-disable-next-line no-console
    console.log({ author, body, title })

    getIssueTemplateTitles()

    // TODO: remove any type assertion
    const filteredIssueTypes = issueTemplateTypes
      .split('\n')
      .filter((x: string) => x !== '') as any[]

    console.log({ issueTemplateTypes, filteredIssueTypes })

    const filteredForbiddenCharacters = forbiddenCharacters
      .split('\n')
      .filter((x: string) => x !== '') as any[]

    console.log({ forbiddenCharacters, filteredForbiddenCharacters })

    const { valid: titleCheck, errors: titleErrors } = !titleCheckEnable
      ? { valid: true, errors: [] }
      : checkTitle(
          title,
          defaultIssueTitle ?? '',
          defaultIssueTitleComment ?? '',
          filteredIssueTypes,
          filteredForbiddenCharacters
        )

    const prCompliant = titleCheck
    // eslint-disable-next-line no-console
    console.log({ prCompliant })

    core.setOutput('title-check', titleCheck)

    const commentsToLeave = []

    if (!prCompliant) {
      if (!titleCheck) {
        core.setFailed(
          `This issue title should conform to the following format: ${issueTemplateTypes}`
        )
        core.setFailed(titleErrors.map(error => error.message).join('\n'))
        const errorsComment = `\n\nLinting Errors\n${titleErrors
          .map(error => `\n- ${error.message}`)
          .join('')}`

        if (titleComment !== '')
          commentsToLeave.push(titleComment + errorsComment)
      }

      // Update Review as needed
      let reviewBody = ''

      if (commentsToLeave.length > 0)
        reviewBody = [baseComment, ...commentsToLeave].join('\n\n')
      await Promise.allSettled([
        await updateReview(
          { owner: issue.owner, repo: issue.repo, issue_number: issue.number },
          reviewBody
        ),
        await labelIssue(
          prCompliant,
          { owner: issue.owner, repo: issue.repo, issue_number: issue.number },
          label
        )
      ])
    } else {
      await Promise.allSettled([
        await updateReview(
          { owner: issue.owner, repo: issue.repo, issue_number: issue.number },
          ''
        ),
        await labelIssue(
          prCompliant,
          { owner: issue.owner, repo: issue.repo, issue_number: issue.number },
          label
        )
      ])
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function findExistingComment(issue: {
  owner: string
  repo: string
  issue_number: number
}): Promise<Comment | null> {
  let comment
  const { data: comments } = await client.rest.issues.listComments({
    ...issue,
    per_page: 100
  })

  // eslint-disable-next-line no-console
  console.log({ comments })

  comment = comments.find(innerComment => {
    return (innerComment?.user?.login ?? '') === 'github-actions[bot]'
  })

  if (comment === undefined) comment = null
  // TODO: remove this type assertion
  return comment as Comment
}

async function updateReview(
  issue: { owner: string; repo: string; issue_number: number },
  body: string
) {
  const comment = await findExistingComment(issue)
  // if blank body and no existing review, exit
  if (body === '' && comment === null) return
  // if review body same as new body, exit
  if (body === comment?.body) return
  // if no existing review, body non blank, create a review
  if (comment === null && body !== '') {
    await client.rest.issues.createComment({
      ...issue,
      body
    })
    return
  }
  // if body blank and review exists, update it to show passed
  if (comment !== null && body === '') {
    await client.rest.issues.updateComment({
      ...issue,
      comment_id: comment.id,
      body: 'Issue Compliance Checks Passed!'
    })
    return
  }
  // if body non-blank and review exists, update it
  if (comment !== null && body !== comment?.body) {
    await client.rest.issues.updateComment({
      ...issue,
      comment_id: comment.id,
      body
    })
    return
  }
}

async function labelIssue(
  prCompliant: boolean,
  issue: { owner: string; repo: string; issue_number: number },
  label: string
) {
  if (prCompliant) {
    await client.rest.issues.removeLabel({
      ...issue,
      name: label
    })
    return
  } else {
    await client.rest.issues.addLabels({
      ...issue,
      labels: [label]
    })
    return
  }
}

run()
