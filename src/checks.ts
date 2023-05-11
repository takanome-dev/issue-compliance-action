import * as core from '@actions/core'

// function checkBody(body: string, regexString: string): boolean {
//   const regex = new RegExp(regexString, 'mi')
//   const bodyNoComments = body.replace(/<!--(.*?)-->/gms, '')
//   return regex.test(bodyNoComments)
// }

// function checkBranch(branch: string, protectedBranch: string): boolean {
//   return branch !== protectedBranch
// }

export function escapeChecks(checkResult: boolean, message: string) {
  core.info(message)
  // core.setOutput('body-check', checkResult)
  core.setOutput('title-check', checkResult)
}

export function checkTitle(
  title: string,
  issueTypes: string[],
  charactersToExclude: string[]
) {
  const regex1 = new RegExp(`^(${issueTypes.join('|')})(:)(\\s).*`, 'mi')

  if (!regex1.test(title)) {
    return {
      valid: false,
      errors: [
        {
          message: `The title does not match the required format. The format must be one of the following: \n${issueTypes.join(
            `- \n`
          )}`
        }
      ]
    }
  }

  const regex2 = new RegExp(`^(?!.*(${charactersToExclude.join('|')})).*`, 'mi')

  if (!regex2.test(title)) {
    return {
      valid: false,
      errors: [
        {
          message: `The title cannot contain the following characters: \n${charactersToExclude.join(
            `- \n`
          )}`
        }
      ]
    }
  }

  return {valid: true, errors: []}
}
