![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/azure-blob-store

[![npm version](https://img.shields.io/npm/v/@seneca/azure-blob-store.svg)](https://npmjs.com/package/@seneca/azure-blob-store)
[![build](https://github.com/senecajs/seneca-azureblob-store/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-azureblob-store/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-azureblob-store/badge.svg)](https://snyk.io/test/github/senecajs/seneca-azureblob-store)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

Entity store using Azure Blob Storage.

NOTE: not for arbitrary binaries, just for Seneca data entities.

Works with Seneca 4 (tested with 4.0.0 and 4.0.0-rc5) and Seneca 3 from
3.38 (with seneca-promisify). Seneca 4.0.0 requires Node.js 24 or later.

## Install

```sh
npm install @seneca/azure-blob-store @azure/storage-blob @azure/identity seneca @seneca/entity
```

On Seneca 3 (3.38 or later) also install `seneca-promisify` and load it
before this plugin (`.use('promisify')`).

## Quick Example

```js
require('seneca')()
  .use('@seneca/entity', { mem_store: false })
  .use('@seneca/azure-blob-store', {
    blob: { connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING },
    shared: { Container: 'my-container' },
  })
```

## More Examples

See [test/](test/) for more usage examples.

## Motivation

A [Seneca.js](http://senecajs.org) plugin.

## Support

If you're using this module and need help, you can:

- Post a [github issue](https://github.com/senecajs/seneca-azureblob-store/issues)
- Tweet to [@senecajs](http://twitter.com/senecajs)
- Ask on the [Gitter](https://gitter.im/senecajs/seneca)

## API

See [source](https://github.com/senecajs/seneca-azureblob-store) for API details.

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

### Running tests

The tests use the azurite blob emulator (a development dependency) on
port 10000. Start it in another terminal with `npm run start-blob`, then:

```sh
npm run build
npm run test
```

## Background

Part of the [Senecajs org](https://github.com/senecajs/).
