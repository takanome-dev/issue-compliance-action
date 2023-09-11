import * as core from '@actions/core'
import * as github from '@actions/github'
import * as yaml from 'js-yaml'
import { context } from '@actions/github/lib/utils'

import { escapeChecks } from './checks'
import { Comment, GithubFile, GithubPayload } from './types'

const repoToken = core.getInput('token')
const label = core.getInput('label')
const baseComment = core.getInput('base-comment')
const titleComment = core.getInput('title-comment')
const forbiddenCharacters = core.getInput('forbidden-characters')
const client = github.getOctokit(repoToken)

interface Repo {
  owner: string
  repo: string
}

async function getIssueTemplateTitles(
  octokit: typeof client,
  ghRepo: Repo
): Promise<string[]> {
  const { owner, repo } = ghRepo

  // Get the contents of the .github/ISSUE_TEMPLATE directory
  const response = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: '.github/ISSUE_TEMPLATE'
  })

  const data = response.data as GithubPayload[]

  // Extract the issue title from each file
  const titles = data
    .filter(
      file =>
        (file.type === 'file' && file.name.endsWith('.yml')) ||
        file.name.endsWith('.yaml')
    )
    .map(async file => {
      const content = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.path
      })

      const fileContent = content.data as GithubFile
      const template = yaml.load(
        Buffer.from(fileContent.content, 'base64').toString()
      )

      return (template as any).title.trim()
    })

  return Promise.all(titles)
}

async function run(): Promise<void> {
  try {
    const ctx = github.context
    const issue = ctx.issue
    const repoOwner = context.repo.owner

    const errors = []
    let message = ''

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

    const titles = await getIssueTemplateTitles(client, {
      owner: issue.owner,
      repo: issue.repo
    })

    console.log({ titles })

    const issueTemplateTypes = titles.map(t => t.split(':')[0])

    const regex1 = new RegExp(`^${issueTemplateTypes.join('|')}`, 'mi')

    if (!title || !regex1.test(title)) {
      message = `The title does not match the required format. It should start with one of the following:
        - ${issueTemplateTypes.join('\n - ')}`
      errors.push(message)
    }

    if (titles.includes(title)) {
      message = `The title should not be the same as the issue template title.`
      errors.push(message)
    }

    const regex2 = new RegExp(/^(?=.*:\s).*$/, 'mi')

    if (!regex2.test(title)) {
      message = 'The title should have a space after the issue type and colon'
      errors.push(message)
    }

    const regex3 = new RegExp(/^.*:\s{1}[^\s].*$/, 'mi')

    if (!regex3.test(title)) {
      message = `The title shouldn't have more than one space after the issue type`
      errors.push(message)
    }

    const filteredForbiddenCharacters = forbiddenCharacters
      .split('\n')
      .filter((x: string) => x !== '') as any[]

    const regex4 = new RegExp(
      `^(?!.*(\\s[${filteredForbiddenCharacters.join('')}]))`,
      'mi'
    )

    if (!regex4.test(title)) {
      message = `The following characters are not allowed in the title: ${filteredForbiddenCharacters.join(
        ', '
      )}`
      errors.push(message)
    }

    const prCompliant = errors.length === 0
    // eslint-disable-next-line no-console
    console.log({ prCompliant, errors })

    core.setOutput('title-check', prCompliant)

    const commentsToLeave = []

    if (!prCompliant) {
      if (errors.length > 0) {
        core.setFailed(
          `This issue title should conform to the issue template. Please update the title to allow the checks to pass.`
        )
        core.setFailed(errors.map(error => error).join('\n'))

        const errorsComment = `\n\nLinting Errors\n${errors
          .map(error => `\n- ${error}`)
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
