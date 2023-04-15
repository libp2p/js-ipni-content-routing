/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { ipniContentRouting } from '../src/index.js'
import { CID } from 'multiformats/cid'
import all from 'it-all'

describe('IPNIContentRouting', function () {
  it('should find providers', async () => {
    if (process.env.ECHO_SERVER == null) {
      throw new Error('Echo server not configured correctly')
    }

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

    const routing = ipniContentRouting(new URL(process.env.ECHO_SERVER))()

    const provs = await all(routing.findProviders(cid))
    expect(provs.map(prov => ({
      id: prov.id.toString(),
      addrs: prov.multiaddrs.map(ma => ma.toString())
    }))).to.deep.equal(providers.map(prov => ({
      id: prov.Provider.ID,
      addrs: prov.Provider.Addrs
    })))
  })
})
