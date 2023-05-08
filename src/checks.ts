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

export function checkTitle(title: string, issue_templates_types: string[]) {
  const regex1 = new RegExp(
    `^(${issue_templates_types.join('|')})(:)(\\s)(\\w|\\s)+`,
    'mi'
  )

  if (!regex1.test(title)) {
    return {
      valid: false,
      errors: [
        {
          message: `Title does not match the required format. The format must be one of the following: ${issue_templates_types.join(
            ', '
          )}`
        }
      ]
    }
  }

  const regex2 = new RegExp(`^(?!.*(<|>)).*`, 'mi')

  if (!regex2.test(title)) {
    return {
      valid: false,
      errors: [
        {
          message:
            'Title cannot contain < or >. Please remove them and provide a clear description.'
        }
      ]
    }
  }

  return {valid: true, errors: []}
}
