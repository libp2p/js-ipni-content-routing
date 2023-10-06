# @libp2p/ipni-content-routing <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-ipni-content-routing.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-ipni-content-routing)
[![CI](https://img.shields.io/github/actions/workflow/status/libp2p/js-ipni-content-routing/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/libp2p/js-ipni-content-routing/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> Use an IPNI service to discover content providers

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [About](#about)
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

## About

This is an implementation of the libp2p [content routing interface](https://libp2p.github.io/js-libp2p-interfaces/interfaces/_libp2p_interface_content_routing.ContentRouting.html) that uses an [IPNI](https://github.com/ipni/specs) HTTP endpoint.

An alternative is [HTTP Routing V1](https://github.com/libp2p/js-reframe-content-routing) (previously known as Reframe) but the advantage of IPNI at least as of 2023-05-19 is that it returns results in a streaming fashion which can be faster.  Note that this will change with the rollout of [IPIP-410](https://github.com/ipfs/specs/pull/410), at which point one can use the HTTP Routing V1 interface/implementation directly.

## Example

```js
import { createLibp2p } from 'libp2p'
import { ipniContentRouting } from '@libp2p/ipni-content-routing'

const node = await createLibp2p({
  contentRouters: [
    ipniContentRouting('https://cid.contact')
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
