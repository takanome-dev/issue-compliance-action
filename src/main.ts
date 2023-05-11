import * as core from '@actions/core'
import * as github from '@actions/github'
import {checkTitle, escapeChecks} from './checks'
import {Comment} from './types'

const repoToken = core.getInput('token')
const baseComment = core.getInput('base-comment')
const titleComment = core.getInput('title-comment')
const issueTemplateTypes = core.getInput('issue-template-types')
const charactersToExclude = core.getInput('characters-to-exclude')
const titleCheckEnable = core.getBooleanInput('title-check-enable')
const client = github.getOctokit(repoToken)

async function run(): Promise<void> {
  try {
    const ctx = github.context
    const issue = ctx.issue

    const isClosed =
      (ctx.payload.issue?.state ?? 'open').toLowerCase() === 'closed'

    if (isClosed) {
      escapeChecks(
        false,
        'The issue is closed, skipping checks, setting all outputs to false.'
      )
      return
    }

    const title = ctx.payload.issue?.title ?? ''

    // TODO: remove any type assertion
    const filteredIssueTypes = issueTemplateTypes
      .split('\n')
      .filter((x: string) => x !== '') as any[]

    const filteredCharactersToExclude = charactersToExclude
      .split('\n')
      .filter((x: string) => x !== '') as any[]

    const {valid: titleCheck, errors: titleErrors} = !titleCheckEnable
      ? {valid: true, errors: []}
      : checkTitle(title, filteredIssueTypes, filteredCharactersToExclude)

    const prCompliant = titleCheck

    core.setOutput('title-check', titleCheck)

    const commentsToLeave = []

    if (!prCompliant) {
      core.setFailed(titleErrors.map(error => error.message).join('\n'))

      const errorsComment = `\n\nLinting Errors\n${titleErrors
        .map(error => `\n- ${error.message}`)
        .join('')}`

      if (titleComment !== '')
        commentsToLeave.push(titleComment + errorsComment)

      // Update Review as needed
      let reviewBody = ''

      if (commentsToLeave.length > 0)
        reviewBody = [baseComment, ...commentsToLeave].join('\n\n')
      await updateReview(
        {owner: issue.owner, repo: issue.repo, issue_number: issue.number},
        reviewBody
      )
    } else {
      await updateReview(
        {owner: issue.owner, repo: issue.repo, issue_number: issue.number},
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
  const {data: comments} = await client.rest.issues.listComments({
    ...issue,
    per_page: 100
  })

  comment = comments.find(innerComment => {
    return (innerComment?.user?.login ?? '') === 'github-actions[bot]'
  })

  if (comment === undefined) comment = null
  // TODO: remove this type assertion
  return comment as Comment
}

async function updateReview(
  issue: {owner: string; repo: string; issue_number: number},
  body: string
) {
  const comment = await findExistingComment(issue)
  // if blank body and no existing review, exit
  if (body === '' && comment === null) return
  // if review body same as new body, exit
  if (body === comment?.body) return
  // if no existing review, body non blank, create a review
  if (comment === null && body !== '') {
    await Promise.all([
      await client.rest.issues.createComment({
        ...issue,
        body
      }),
      await client.rest.issues.addLabels({
        ...issue,
        labels: [':no_entry: invalid title']
      })
    ])
    return
  }
  // if body blank and review exists, update it to show passed
  if (comment !== null && body === '') {
    await Promise.all([
      await client.rest.issues.updateComment({
        ...issue,
        comment_id: comment.id,
        body: 'Issue Compliance Checks Passed! :tada:'
      }),
      await client.rest.issues.removeLabel({
        ...issue,
        name: ':no_entry: invalid title'
      })
    ])
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
