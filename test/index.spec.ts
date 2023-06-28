/* eslint-env mocha */

import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { expect } from 'aegir/chai'
import all from 'it-all'
import drain from 'it-drain'
import { CID } from 'multiformats/cid'
import { type StubbedInstance, stubInterface } from 'sinon-ts'
import { ipniContentRouting } from '../src/index.js'
import type { PeerId } from '@libp2p/interface-peer-id'
import type { PeerStore } from '@libp2p/interface-peer-store'

if (process.env.ECHO_SERVER == null) {
  throw new Error('Echo server not configured correctly')
}

const serverUrl = process.env.ECHO_SERVER

describe('IPNIContentRouting', function () {
  let peerId: PeerId
  let peerStore: StubbedInstance<PeerStore>

  beforeEach(async () => {
    peerId = await createEd25519PeerId()
    peerStore = stubInterface<PeerStore>()
    peerStore.get.withArgs(peerId).resolves({
      metadata: new Map()
    })
  })

  it('should find providers', async () => {
    const providers = [{
      Metadata: 'gBI=',
      ContextID: '',
      Provider: {
        ID: (await createEd25519PeerId()).toString(),
        Addrs: ['/ip4/41.41.41.41/tcp/1234']
      }
    }, {
      Metadata: 'gBI=',
      ContextID: '',
      Provider: {
        ID: (await createEd25519PeerId()).toString(),
        Addrs: ['/ip4/42.42.42.42/tcp/1234']
      }
    }]

    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: providers.map(prov => JSON.stringify(prov)).join('\n')
    })

    const routing = ipniContentRouting(serverUrl)({
      peerId,
      peerStore
    })

    const provs = await all(routing.findProviders(cid))
    expect(provs.map(prov => ({
      id: prov.id.toString(),
      addrs: prov.multiaddrs.map(ma => ma.toString())
    }))).to.deep.equal(providers.map(prov => ({
      id: prov.Provider.ID,
      addrs: prov.Provider.Addrs
    })))
  })

  it('should handle non-json input', async () => {
    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: 'not json'
    })

    const routing = ipniContentRouting(serverUrl)({
      peerId,
      peerStore
    })

    const provs = await all(routing.findProviders(cid))
    expect(provs).to.be.empty()
  })

  it('should handle bad input providers', async () => {
    const providers = [{
      Metadata: 'gBI=',
      Provider: {
        Bad: 'field'
      }
    }, {
      Metadata: 'gBI=',
      ContextID: '',
      Another: {
        Bad: 'field'
      }
    }]

    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: providers.map(prov => JSON.stringify(prov)).join('\n')
    })

    const routing = ipniContentRouting(serverUrl)({
      peerId,
      peerStore
    })

    const provs = await all(routing.findProviders(cid))
    expect(provs).to.be.empty()
  })

  it('should handle empty input', async () => {
    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    const routing = ipniContentRouting(serverUrl)({
      peerId,
      peerStore
    })

    const provs = await all(routing.findProviders(cid))
    expect(provs).to.be.empty()
  })

  it('should send user agent header', async () => {
    const agentVersion = 'herp/1.0.0 derp/1.0.0'

    // return user agent
    peerStore.get.withArgs(peerId).resolves({
      metadata: new Map([['AgentVersion', new TextEncoder().encode(agentVersion)]])
    })

    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')

    // load providers for the router to fetch
    await fetch(`${process.env.ECHO_SERVER}/add-providers/${cid.toString()}`, {
      method: 'POST',
      body: '[]\n'
    })

    const routing = ipniContentRouting(serverUrl)({
      peerId,
      peerStore
    })

    await drain(routing.findProviders(cid))

    const response = await fetch(`${process.env.ECHO_SERVER}/last-request`, {
      method: 'GET'
    })
    const bodyText = await response.text()
    const body = JSON.parse(bodyText)

    expect(body).to.have.nested.property('headers.user-agent', agentVersion)
  })
})
