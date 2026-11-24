# Changes

## 0.4.0 2026-11-20

* Seneca 4: the peer dependencies are `seneca` `^4.0.0` and
  `@seneca/entity` `^29.0.0`. Seneca 3 is no longer supported; Seneca 3
  users stay on `@seneca/azure-blob-store@0.3`. The `seneca-promisify`
  peer dependency is removed: promises are built into Seneca 4.
* Node.js 24 or later (`engines.node` `>=24`).
* Seneca 4 validates plugin options with
  [shape](https://github.com/rjrodger/shape), the renamed successor of
  Gubu, and rejects option defaults built with Gubu, so 0.3.1 stops the
  process at startup there (`plugin_gubu_shape`). `defaults` is now a
  function of `{ valid }`, the builders Seneca passes to it. The options
  are unchanged. The `ent` entries are now validated: a `jsonl` or `bin`
  value that is not a string fails the plugin load
  (`invalid_plugin_option`); Gubu did not check them.
* The plugin no longer imports gubu, which it never declared as a
  dependency (it used whatever copy was installed, usually Seneca's).
  It has no runtime dependencies.
* The package name is `@seneca/azure-blob-store` again, the name it is
  published under. The repository had renamed it to
  `@seneca/azureblob-store`, which was never published.
* Breaking: the entity plugin is `@seneca/entity` 29, its new package
  name; the peer dependency was `seneca-entity >=25`. seneca-entity
  28.1.0, the last version under the old name, does not load on Seneca
  4. Load it by package name, `.use('@seneca/entity')`.
* The published package contains `dist`, `src`, `README.md`,
  `CHANGES.md` and `LICENSE` (0.3.1 also shipped the tests, the coverage
  report and `tsconfig.json`), and `prepublishOnly` builds `dist`.
* Tests run on Seneca 4 with `@seneca/entity` 29, `@seneca/store-test` 7
  and the azurite blob emulator; TypeScript 5.9 and `@types/node` 24.
  `package-lock.json` and the generated `test/coverage.html` are no
  longer committed. The live Azure mode
  (`SENECA_TEST_LIVE_BLOB_STORE=true`) was not tested on Seneca 4.

