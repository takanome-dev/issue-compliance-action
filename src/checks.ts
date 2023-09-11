import * as core from '@actions/core'

export function escapeChecks(checkResult: boolean, message: string) {
  core.info(message)
  core.setOutput('title-check', checkResult)
}

export function checkTitle(
  title: string,
  issueTypes: string[],
  forbiddenCharacters: string[]
) {
  const regex1 = new RegExp(`^${issueTypes.join('|')}`, 'mi')

  if (!title || !regex1.test(title)) {
    return {
      valid: false,
      errors: [
        {
          message: `The title does not match the required format. It should start with one of the following: 
           - ${issueTypes.join('\n - ')}
          Please update the title to allow the checks to pass.`
        }
      ]
    }
  }

  const regex2 = new RegExp(/^(?=.*:\s).*$/, 'mi')

  if (!regex2.test(title)) {
    return {
      valid: false,
      errors: [
        {
          message:
            'The title should have a space after the issue type and colon. Please add a space after the colon to allow the checks to pass.'
        }
      ]
    }
  }

  const regex3 = new RegExp(/^.*:\s{1}[^\s].*$/, 'mi')

  if (!regex3.test(title)) {
    return {
      valid: false,
      errors: [
        {
          message: `The title shouldn't have more than one space after the issue type. Please remove the extra space to allow the checks to pass.`
        }
      ]
    }
  }

  const regex4 = new RegExp(
    `^(?!.*(\\s[${forbiddenCharacters.join('')}]))`,
    'mi'
  )

  if (!regex4.test(title)) {
    return {
      valid: false,
      errors: [
        {
          message: `The following characters are not allowed in the title: ${forbiddenCharacters.join(
            ', '
          )}. Please remove them to allow the checks to pass.`
        }
      ]
    }
  }

  // if (defaultIssueTitleComment && !defaultIssueTitle) {
  //   return {
  //     valid: false,
  //     errors: [
  //       {
  //         message: `Please set the "defaultIssueTitle" input in order to use the defaultIssueTitleComment.`
  //       }
  //     ]
  //   }
  // }

  // const regex5 = new RegExp(`^${defaultIssueTitle}`, 'mi')

  // if (!regex5.test(title)) {
  //   return {
  //     valid: false,
  //     errors: [
  //       {
  //         message: defaultIssueTitleComment
  //       }
  //     ]
  //   }
  // }

  return { valid: true, errors: [] }
}
