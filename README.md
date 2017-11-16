# @angular/cli diff

See the diffs of `@angular/cli` generated apps for easier upgrades

Note: This project does not offer an automated way of upgrading your `@angular/cli` based app.
It only offers git diffs between the different versions for easy manual upgrading.

## How to

- Visit nolanus.github.io/angular-cli-diff and select your current and the target version
- Click to compare button to show the diff of the generated project
- Go over the changes and apply the changes to your codebase
- Update the `@angular/cli` version in your `package.json` and run `npm i``

## Why

The official `@angular/cli` does not offer an automated way to upgrade to a newer version of their generator. This
leaves the developers with manually comparing the changes to the angular application architecture and upgrading or
upgrading the cli without adjusting and hoping for the best.
This project tries to point out  the necessary differences in the generated apps so that developers can manually
upgrade their files and use the newer `@angular/cli` versions.

## Development

This repo is generated using a node script which checks for the released `@angular/cli` versions an generates
a new app whenever there is a new release detected. Additionally the subgenerators for services/pipes/components/...
are used. All code is committed onto separate branches in this repo.
