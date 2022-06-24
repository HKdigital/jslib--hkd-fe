# Frontend library for javascript projects by HKdigital

## About

This library contains code that can be used to implement frontend projects.

This library depends on [hkd-jslib-base](https://github.com/HKdigital/hkd-jslib-base).

## Add this library to your project

You can add libraries to your project as git submodules.

Checkout [HKdigital devtool](https://github.com/HKdigital/hkdigital-devtool) to make this process a bit easier than doing everything with the git command line tool.

The devtool can als be used to setup a NodeJS (backend) or SVELTE (frontend) project for you from scratch.

e.g. to add the base library and this library (which is a git submodule) to the folders `/lib/jslib--hkd-base` and `/lib/jslib--hkd-fe`:

```bash
node devtool.mjs submodule-add git@github.com:HKdigital/jslib--hkd-base.git
node devtool.mjs submodule-add git@github.com:HKdigital/jslib--hkd-fe.git
```
