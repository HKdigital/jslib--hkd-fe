<div align="center" style="text-align: center; ">
  <br>
  <br>
  <img alt="HKdigital" src="doc/doc-include/HKdigital-logo.svg" style="height: 100px;" />
  <br>
  <br>
</div>

<div align="center" style="text-align: center;">
  <h1>Frontend library for javascript projects by HKdigital</h1>
  <br>
</div>

## About

This library contains code that can be used to implement frontend projects.

This library depends on [hkd-jslib-base](https://github.com/HKdigital/hkd-jslib-base).

### Issues
If you encounter problems or have a good idea to make this library better, please create an [issue](https://github.com/HKdigital/jslib-hkd-fe/issues).

## Add this library to your project

The [HKdigital devtool](https://github.com/HKdigital/hkdigital-jsdevtool) can be used to setup a NodeJS (backend) or SVELTE (frontend) project from scratch.

### Add libraries to your project

You can add libraries to your project as git submodules.

To add the base library and this library (which is a git submodule) to the folders `/lib/jslib--hkd-base` and `/lib/jslib--hkd-fe`:

```bash
node devtool.mjs submodule-add git@github.com:HKdigital/jslib--hkd-base.git
node devtool.mjs submodule-add git@github.com:HKdigital/jslib--hkd-fe.git
```

The devtool includes support for import aliases, so you can refer to library files like this:

```js
import { backendJsonGet } from "@hkd-fe/helpers/http.js";
```
