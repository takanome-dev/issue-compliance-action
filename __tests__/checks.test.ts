import {checkTitle} from '../src/checks'
import {expect, test} from 'vitest'

const issueTemplatesTypes = ['Feature', 'Bug', 'CI', 'Chore']
const characters = ['<', '>', '#', '&']

test('should return false if there is no title', async () => {
  const {valid, errors} = checkTitle('', issueTemplatesTypes, characters)
  expect(valid).toBeFalsy()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain(
    `The title does not match the required format`
  )
})

test('should return false on bad feature title', async () => {
  const badFeatureTitle = 'Feat: fix stuff'
  const {valid, errors} = checkTitle(
    badFeatureTitle,
    issueTemplatesTypes,
    characters
  )
  expect(valid).toBeFalsy()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain(
    `The title does not match the required format`
  )
})

test('should return true on good feature title', async () => {
  const goodFeatureTitle = 'Feature: fix stuff'
  const {valid, errors} = checkTitle(
    goodFeatureTitle,
    issueTemplatesTypes,
    characters
  )
  expect(valid).toBeTruthy()
  expect(errors.length).toBe(0)
})

test('should return false on bad bug title', async () => {
  const badBugTitle = 'Bug: <short description>'
  const {valid, errors} = checkTitle(
    badBugTitle,
    issueTemplatesTypes,
    characters
  )
  expect(valid).toBeFalsy()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain(
    'The title cannot contain the following characters'
  )
})

test('should return true on good bug title', async () => {
  const goodBugTitle = 'Bug: Github action not working'
  const {valid, errors} = checkTitle(
    goodBugTitle,
    issueTemplatesTypes,
    characters
  )
  expect(valid).toBeTruthy()
  expect(errors.length).toBe(0)
})

test('should return false on bad ci title', async () => {
  const badCiTitle = 'CI: <The actions are failing'
  const {valid, errors} = checkTitle(
    badCiTitle,
    issueTemplatesTypes,
    characters
  )
  expect(valid).toBeFalsy()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain(
    'The title cannot contain the following characters'
  )
})

test('should return true on good ci title', async () => {
  const goodCiTitle = 'CI: The actions are failing'
  const {valid, errors} = checkTitle(
    goodCiTitle,
    issueTemplatesTypes,
    characters
  )
  expect(valid).toBeTruthy()
  expect(errors.length).toBe(0)
})

test('should return false on bad chore title', async () => {
  const badChoreTitle = 'Chore: What is #chore?'
  const {valid, errors} = checkTitle(
    badChoreTitle,
    issueTemplatesTypes,
    characters
  )
  expect(valid).toBeFalsy()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain(
    'The title cannot contain the following characters'
  )
})

test('should return true on good chore title', async () => {
  const goodChoreTitle = 'Chore: What is chore?'
  const {valid, errors} = checkTitle(
    goodChoreTitle,
    issueTemplatesTypes,
    characters
  )
  expect(valid).toBeTruthy()
  expect(errors.length).toBe(0)
})
