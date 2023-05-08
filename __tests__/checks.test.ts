import {checkTitle} from '../src/checks'
import {expect, test} from 'vitest'
// import {expect, test} from '@jest/globals'

const badFeatureTitle = 'Feat: fix stuff'
const goodFeatureTitle = 'Feature: fix stuff'
const badBugTitle = 'Bug: <short description>'
const goodBugTitle = 'Bug: Github action not working'
const badCiTitle = 'CI: <The actions are failing'
const goodCiTitle = 'CI: The actions are failing'
const badChoreTitle = 'Chor: What is chore?>'
const goodChoreTitle = 'Chore: What is chore?'

const issueTemplatesTypes = ['Feature', 'Bug', 'CI', 'Chore']

test('checkTitle false on empty', async () => {
  const {valid, errors} = checkTitle('', issueTemplatesTypes)
  expect(valid).toBeFalsy()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toBe(
    `Title does not match the required format. The format must be one of the following: ${issueTemplatesTypes.join(
      ', '
    )}`
  )
})

test('checkTitle false on bad feature title', async () => {
  const {valid, errors} = checkTitle(badFeatureTitle, issueTemplatesTypes)
  expect(valid).toBeFalsy()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toBe(
    `Title does not match the required format. The format must be one of the following: ${issueTemplatesTypes.join(
      ', '
    )}`
  )
})

test('checkTitle true on good feature title', async () => {
  const {valid, errors} = checkTitle(goodFeatureTitle, issueTemplatesTypes)
  expect(valid).toBeTruthy()
  expect(errors.length).toBe(0)
})

test('checkTitle false on bad bug title', async () => {
  const {valid, errors} = checkTitle(badBugTitle, issueTemplatesTypes)
  expect(valid).toBeFalsy()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain(
    'Title does not match the required format'
  )
})

test('checkTitle true on good bug title', async () => {
  const {valid, errors} = checkTitle(goodBugTitle, issueTemplatesTypes)
  expect(valid).toBeTruthy()
  expect(errors.length).toBe(0)
})

test('checkTitle false on bad ci title', async () => {
  const {valid, errors} = checkTitle(badCiTitle, issueTemplatesTypes)
  expect(valid).toBeFalsy()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain('Title cannot contain < or >.')
})

// test('checkBody false on empty', () => {
//   const regexString = '(fixes|closes) #d+'
//   const check = checkBody('', regexString)
//   expect(check).toBeFalsy()
// })
// test('checkBody false on invalid issue reference', () => {
//   const regexString = '(fixes|closes) #\\d+'
//   const check = checkBody(badBody, regexString)
//   expect(check).toBeFalsy()
// })
// test('checkBody false when valid issue reference is inside comment', () => {
//   const regexString = '(fixes|closes) #\\d+'
//   const check = checkBody(commentedBadBody, regexString)
//   expect(check).toBeFalsy()
// })
// test('checkBody true on valid message with multiline', () => {
//   const regexString = '(fixes|closes) #\\d+'
//   const check = checkBody(goodBody, regexString)
//   expect(check).toBeTruthy()
// })
// test('checkTitle false on empty', async () => {
//   const {valid, errors} = await checkTitle('')
//   expect(valid).toBeFalsy()
//   expect(errors.length).toBeGreaterThan(0)
//   expect(errors[0]).toHaveProperty('message')
//   expect(errors[0]).toHaveProperty('valid')
// })
// test('checkTitle true on valid title', async () => {
//   const {valid, errors} = await checkTitle(goodTitle)
//   expect(valid).toBeTruthy()
//   expect(errors).toHaveLength(0)
// })
// test('checkTitle false on invalid title', async () => {
//   const {valid, errors} = await checkTitle(badTitle)
//   expect(valid).toBeFalsy()
//   expect(errors.length).toBeGreaterThan(0)
//   expect(errors[0]).toHaveProperty('message')
//   expect(errors[0]).toHaveProperty('valid')
// })
// test('checkBranch false on protected branch', () => {
//   const check = checkBranch('main', 'main')
//   expect(check).toBeFalsy()
// })
// test('checkBranch true on string other than protected branch', () => {
//   const check = checkBranch('1234-fix-weird-bug', 'main')
//   expect(check).toBeTruthy()
// })
