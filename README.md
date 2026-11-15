# nanodsh-distros

Distro packages for nanodsh. A distro is the host a dsh profile resolves against: it pins the packages every profile in an instance shares, and names the bundles a new profile starts with.

## Packages

| Package | Contents |
|---|---|
| `@nanodsh/distro-standard` | `@deepseek-ai/dsh-base` with the peers it needs, for the official profiles |

## Use

```bash
nanodsh distro add @nanodsh/distro-standard
nanodsh distro show
```

A distro is a plain npm package. nanodsh reads this metadata from its manifest:

```json
{
  "dsh": {
    "distro": {
      "api": 1,
      "defaultBundles": ["@deepseek-ai/dsh-base"]
    }
  }
}
```

The `dependencies` carry the host packages the official dsh package provides outside its bundles, plus `@deepseek-ai/dsh-base`, each pinned to one version. The package version follows the `@deepseek-ai/dsh-base` version it pins, so `@nanodsh/distro-standard@0.2.2-rc.3` is the standard host set for dsh `0.2.2-rc.3`. A package that needs its install scripts to run declares them in `dsh.distro.allowBuilds`.
