<h2 align="center">Issue Compliance Action :clipboard:</h2>

<p align="center"><a href="https://github.com/takanome-dev/issue-compliance-action"><img alt="Licence Badge" src="https://img.shields.io/github/license/takanome-dev/issue-compliance-action?color=%2330C151"></a> <a href="https://github.com/takanome-dev/issue-compliance-action"><img alt="Release" src="https://img.shields.io/github/release/takanome-dev/issue-compliance-action?color=%2330C151"></a> <a href="https://github.com/takanome-dev/issue-compliance-action"><img alt="GitHub Actions status" src="https://github.com/takanome-dev/issue-compliance-action/actions/workflows/ci.yml/badge.svg"></a> <a href="https://github.com/takanome-dev/issue-compliance-action"><img alt="GitHub Actions status" src="https://github.com/takanome-dev/issue-compliance-action/actions/workflows/codeql-analysis.yml/badge.svg"></a>
<!-- <a href="https://codecov.io/gh/takanome-dev/issue-compliance-action"><img src="https://codecov.io/gh/takanome-dev/issue-compliance-action/branch/master/graph/badge.svg?token=MX3SB0GFB3" /></a> -->
</p>

This action is meant to help in managing issues. It will check for the following:

- [x] Issue has a title
  - [x] Title starts with a valid issue type (e.g. bug, feature, chore)
  - [x] Title does not contain some characters (e.g. <,>,#)
  - [x] Add a label `:no_entry: invalid title` if the title is invalid and remove it if it is valid
- [ ] Issue has a description
  - [ ] Description should include all required information based on the issue template
- [ ] What else?

This is a fork of [pr-compliance-action](https://github.com/mtfoley/pr-compliance-action) that is meant to be used with pull requests instead of issues.

## 🚀 Usage

Create a workflow (eg: .github/workflows/issue-compliance.yml)

```yaml
name: Issue Compliance

on:
  issues:
    types: [opened, edited, reopened]

# Action should have write permission to create comments, labels, etc.
permissions:
  pull-requests: write

jobs:
  pr-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: takanome-dev/issue-compliance-action@0.2.0
        with:
          token: '${{ secrets.GITHUB_TOKEN }}'
```

## 📖 Inputs

Various inputs are defined in action.yml to let you configure the action:

| Name                  | Default                                   | Description                                                                            |
| --------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| token                 | `secrets.GITHUB_TOKEN`                    | Access token for which this action will run. This action uses `@actions/core` library. |
| base-comment          | (see [full example below](#full-example)) | Preamble to any comment the action leaves on the issue.                                |
| issue-template-types  | `Feature Request, Bug Report, Question`   | The types of issue templates that are allowed. See below for more information.         |
| title-check-enable    | true                                      | Whether or not to lint the issue title based on the issue template type provided.      |
| title-comment         | (see [full example below](#full-example)) | Comment to leave on the issue on failed check of title.                                |
| characters-to-exclude | `#,<,>`                                   | Characters that are not allowed in the issue title.                                    |

## Full Example

```yaml
name: Issue Compliance

on:
  issues:
    types: [opened, edited, reopened]

# Action should have write permission to create comments, labels, etc.
permissions:
  pull-requests: write

jobs:
  pr-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: takanome-dev/issue-compliance-action@0.2.0
        with:
          token: '${{ secrets.GITHUB_TOKEN }}'
          title-check-enable: true
          # feel free to add more characters to exclude
          characters-to-exclude: |
            <
            >
            #
          # add your own issue template types
          issue-template-types: |
            Feature Request
            Bug Report
            Question
          # tweak the title comment to your liking
          title-comment: >
            ## Issue Title Format :pencil2:

            In order for this issue to be considered for triage, the issue title must match the specification below:
          # tweak the base comment to your liking
          base-comment: >
            # Issue Compliance Checks :clipboard:

            Thank you for opening this issue! We have run several checks on this issue to ensure it complies with our contributing guidelines. Please review the statements below and make any necessary changes to this issue. Once all checks have passed, we will be able to triage this issue and take any necessary actions.
```

## ✏️ Contributing

We would love you to contribute to `takanome-dev/issue-compliance-action`, pull requests are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## ⚖️ License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
