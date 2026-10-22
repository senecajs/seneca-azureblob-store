# Changes

## 0.4.0 2026-10-22

* Seneca 4 support. Seneca 4.0.0 validates plugin options with
  [shape](https://github.com/rjrodger/shape), the renamed successor of
  Gubu, and rejects option defaults built with Gubu, so 0.3.1 stops the
  process at startup there (`plugin_gubu_shape`). `defaults` is now a
  function of `{ valid }`, the builders Seneca passes to it: shape on
  Seneca 4.0.0, Gubu on Seneca 3 and 4.0.0-rc5. The options are
  unchanged. On Seneca 4.0.0 the `ent` entries are also validated: a
  `jsonl` or `bin` value that is not a string fails the plugin load
  (`invalid_plugin_option`); Gubu does not check them.
* The plugin no longer imports gubu, which it never declared as a
  dependency (it used whatever copy was installed, usually Seneca's).
  It has no runtime dependencies.
* The package name is `@seneca/azure-blob-store` again, the name it is
  published under. The repository had renamed it to
  `@seneca/azureblob-store`, which was never published.
* Breaking: the entity plugin is `@seneca/entity` 29 or later, its new
  package name; the peer dependency was `seneca-entity >=25`.
  seneca-entity 28.1.0, the last version under the old name, does not
  load on Seneca 4.0.0. Load it by package name,
  `.use('@seneca/entity')`: `use('entity')` finds seneca-entity first
  when another package installs it.
* Breaking: Seneca 3 support starts at 3.38. The peer range is
  `>=3.38||>=4.0.0-rc5` (was `>=3`). On Seneca 3, load
  seneca-promisify before this plugin.
* The tests run against Seneca 4.0.0, 4.0.0-rc5 (the development
  dependency, `^4.0.0-rc5`, was 3.33.0) and 3.38 (with
  seneca-promisify), with the azurite blob emulator. The README states
  the supported versions, lists the peer dependencies to install, and
  its example loads `@seneca/entity` and sets the connection options.
