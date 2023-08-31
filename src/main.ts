/* eslint-disable no-console */
import * as core from '@actions/core'
import * as github from '@actions/github'
import { context } from '@actions/github/lib/utils'
import { checkTitle, escapeChecks } from './checks'
import { Comment, Issue } from './types'

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
const baseComment = core.getInput('base-comment')
const titleComment = core.getInput('title-comment')
const issueTemplatesTypes = core.getInput('issue-templates-types')
const titleCheckEnable = core.getBooleanInput('title-check-enable')
const forbiddenCharacters = core.getInput('forbidden-characters')
const defaultIssueTitle = core.getInput('default-title')
const defaultIssueTitleComment = core.getInput('default-title-comment')
const client = github.getOctokit(repoToken)

async function run(): Promise<void> {
  try {
    const ctx = github.context
    const issue = ctx.issue
    const repoOwner = context.repo.owner

    const isClosed =
      (ctx.payload.issue?.state ?? 'open').toLowerCase() === 'closed'
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

    console.log({ author, body, title })

    const { valid: titleCheck, errors: titleErrors } = !titleCheckEnable
      ? { valid: true, errors: [] }
      : checkTitle(
          title,
          defaultIssueTitle ?? '',
          defaultIssueTitleComment ?? '',
          issueTemplatesTypes.split(','),
          forbiddenCharacters.split(',') ?? []
        )

    const prCompliant = titleCheck
    console.log({ prCompliant })

    core.setOutput('title-check', titleCheck)

    const commentsToLeave = []

    if (!prCompliant) {
      if (!titleCheck) {
        core.setFailed(
          `This issue title should conform to the following format: ${issueTemplatesTypes}`
        )
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
      await updateReview(
        { owner: issue.owner, repo: issue.repo, issue_number: issue.number },
        reviewBody
      )
    } else {
      await updateReview(
        { owner: issue.owner, repo: issue.repo, issue_number: issue.number },
        ''
      )
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

run()
