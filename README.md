# @libp2p/ipni-content-routing <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-ipni-content-routing.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-ipni-content-routing)
[![CI](https://img.shields.io/github/actions/workflow/status/libp2p/js-ipni-content-routing/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/libp2p/js-ipni-content-routing/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> Use an IPNI service to discover content providers

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Example](#example)
- [API Docs](#api-docs)
- [License](#license)
- [Contribution](#contribution)

## Install

```console
$ npm i @libp2p/ipni-content-routing
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `Libp2pIpniContentRouting` in the global namespace.

```html
<script src="https://unpkg.com/@libp2p/ipni-content-routing/dist/index.min.js"></script>
```

## Example

```js
import { createLibp2p } from 'libp2p'
import { ipniContentRouting } from '@libp2p/ipni-content-routing'

const node = await createLibp2p({
  peerRouting: [
    ipniContentRouting(new URL('https://cid.contact'))
  ]
  //.. other config
})
await node.start()

for await (const provider of node.contentRouting.findProviders('cid')) {
  console.log('provider', provider)
}
```

## API Docs

- <https://libp2p.github.io/js-ipni-content-routing>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
