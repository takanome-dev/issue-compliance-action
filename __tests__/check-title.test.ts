import { checkTitle } from '../src/checks'
import { describe, expect, test } from 'vitest'

const issueTemplatesTypes = ['Feature', 'Bug', 'CI', 'Chore', 'Question']

describe('[checkTitle]', () => {
  let title = ''
  let defaultIssueTitle = ''
  let defaultIssueTitleComment = ''
  let forbiddenCharacters = []

  test('should return false on empty title', async () => {
    const { valid, errors } = checkTitle(
      title,
      defaultIssueTitle,
      defaultIssueTitleComment,
      issueTemplatesTypes,
      forbiddenCharacters
    )
    expect(valid).toBeFalsy()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toMatch(
      `The title does not match the required format.`
    )
  })

  test('should return false if the title does not start with one of the issue template types', async () => {
    title = 'fix stuff'
    const { valid, errors } = checkTitle(
      title,
      defaultIssueTitle,
      defaultIssueTitleComment,
      issueTemplatesTypes,
      forbiddenCharacters
    )
    expect(valid).toBeFalsy()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toMatch(
      `The title does not match the required format.`
    )
  })

  test('should return false if the title does not have a space after the issue type and colon', async () => {
    title = 'Feature:fix stuff'
    const { valid, errors } = checkTitle(
      title,
      defaultIssueTitle,
      defaultIssueTitleComment,
      issueTemplatesTypes,
      forbiddenCharacters
    )
    expect(valid).toBeFalsy()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toMatch(
      `The title should have a space after the issue type and colon`
    )
  })

  test('should return false if the title has more than one space after the issue type', async () => {
    title = 'Feature:  fix stuff'
    const { valid, errors } = checkTitle(
      title,
      defaultIssueTitle,
      defaultIssueTitleComment,
      issueTemplatesTypes,
      forbiddenCharacters
    )
    expect(valid).toBeFalsy()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toMatch(
      `The title shouldn't have more than one space after the issue type`
    )
  })

  test('should return false if the title has a forbidden character', async () => {
    title = 'Feature: fix stuff @'
    const { valid, errors } = checkTitle(
      title,
      defaultIssueTitle,
      defaultIssueTitleComment,
      issueTemplatesTypes,
      ['@']
    )
    expect(valid).toBeFalsy()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toMatch(
      `The following characters are not allowed in the title`
    )
  })

  test('should return false if defaultIssueTitleComment is set but defaultIssueTitle is not', async () => {
    title = 'Feature: fix stuff'
    defaultIssueTitleComment =
      'The title uses the default title for its template.'
    const { valid, errors } = checkTitle(
      title,
      '',
      defaultIssueTitleComment,
      issueTemplatesTypes,
      forbiddenCharacters
    )
    expect(valid).toBeFalsy()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toMatch(
      `Please set the "defaultIssueTitle" input in order to use the defaultIssueTitleComment`
    )
  })

  test('should return false if the title contains the defaultIssueTitle', async () => {
    title = 'Feature: <a short description>'
    defaultIssueTitle = 'a short description'
    defaultIssueTitleComment =
      'The title uses the default title for its template.'
    const { valid, errors } = checkTitle(
      title,
      defaultIssueTitle,
      defaultIssueTitleComment,
      issueTemplatesTypes,
      forbiddenCharacters
    )
    expect(valid).toBeFalsy()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toMatch(defaultIssueTitleComment)
  })
})
