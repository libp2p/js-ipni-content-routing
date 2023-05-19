import { CodeError } from '@libp2p/interfaces/errors'
import { logger } from '@libp2p/logger'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'
import { anySignal } from 'any-signal'
import toIt from 'browser-readablestream-to-it'
// @ts-expect-error no types
import ndjson from 'iterable-ndjson'
import defer from 'p-defer'
import PQueue from 'p-queue'
import type { ContentRouting } from '@libp2p/interface-content-routing'
import type { PeerId } from '@libp2p/interface-peer-id'
import type { PeerInfo } from '@libp2p/interface-peer-info'
import type { PeerStore } from '@libp2p/interface-peer-store'
import type { AbortOptions } from '@libp2p/interfaces'
import type { Startable } from '@libp2p/interfaces/startable'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { CID } from 'multiformats/cid'

const log = logger('ipni-content-routing')

export interface IpniResponseItem {
  Metadata: string // gBI= means bitswap
  ContextID: string
  Provider: {
    ID: string
    Addrs: Multiaddr[]
  }
}

export interface IpniContentRoutingInit {
  /**
   * A concurrency limit to avoid request flood in web browser (default: 4)
   *
   * @see https://github.com/libp2p/js-libp2p-delegated-content-routing/issues/12
   */
  concurrentRequests?: number

  /**
   * How long a request is allowed to take in ms (default: 30 seconds)
   */
  timeout?: number
}

export interface IpniContentRoutingComponents {
  peerId: PeerId
  peerStore: PeerStore
}

const defaultValues = {
  concurrentRequests: 4,
  timeout: 30e3
}

/**
 * An implementation of content routing, using a delegated peer
 */
class IpniContentRouting implements ContentRouting, Startable {
  private started: boolean
  private readonly httpQueue: PQueue
  private readonly shutDownController: AbortController
  private readonly clientUrl: URL
  private readonly timeout: number
  private readonly peerId: PeerId
  private readonly peerStore: PeerStore
  private agentVersion?: string

  /**
   * Create a new DelegatedContentRouting instance
   */
  constructor (url: string | URL, init: IpniContentRoutingInit = {}, components: IpniContentRoutingComponents) {
    log('enabled IPNI routing via', url)
    this.started = false
    this.shutDownController = new AbortController()
    this.httpQueue = new PQueue({
      concurrency: init.concurrentRequests ?? defaultValues.concurrentRequests
    })
    this.clientUrl = url instanceof URL ? url : new URL(url)
    this.timeout = init.timeout ?? defaultValues.timeout
    this.peerId = components.peerId
    this.peerStore = components.peerStore
  }

  isStarted (): boolean {
    return this.started
  }

  start (): void {
    this.started = true
  }

  stop (): void {
    this.httpQueue.clear()
    this.shutDownController.abort()
    this.started = false
  }

  private async getAgentVersion (): Promise<string> {
    if (this.agentVersion == null) {
      const peer = await this.peerStore.get(this.peerId)
      const agentVersionBuf = peer.metadata.get('AgentVersion')

      if (agentVersionBuf != null) {
        this.agentVersion = new TextDecoder().decode(agentVersionBuf)
      } else {
        this.agentVersion = ''
      }
    }

    return this.agentVersion
  }

  async * findProviders (key: CID, options: AbortOptions = {}): AsyncIterable<PeerInfo> {
    log('findProviders starts: %c', key)

    const signal = anySignal([this.shutDownController.signal, options.signal, AbortSignal.timeout(this.timeout)])
    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return onFinish.promise
    })

    try {
      await onStart.promise

      const resource = `${this.clientUrl}cid/${key.toString()}?cascade=ipfs-dht`
      const getOptions = {
        headers: {
          Accept: 'application/x-ndjson',
          'User-Agent': await this.getAgentVersion()
        },
        signal
      }
      const a = await fetch(resource, getOptions)

      if (a.body == null) {
        throw new CodeError('IPNI response had no body', 'ERR_BAD_RESPONSE')
      }

      for await (const event of ndjson(toIt(a.body))) {
        if (event.Metadata !== 'gBI=') {
          continue
        }

        yield this.mapEvent(event)
      }
    } catch (err) {
      log.error('findProviders errored:', err)
    } finally {
      signal.clear()
      onFinish.resolve()
      log('findProviders finished: %c', key)
    }
  }

  private mapEvent (event: IpniResponseItem): PeerInfo {
    const peer = peerIdFromString(event.Provider.ID)
    const ma: Multiaddr[] = []

    for (const strAddr of event.Provider.Addrs) {
      const addr = multiaddr(strAddr)
      ma.push(addr)
    }

    const pi = {
      id: peer,
      multiaddrs: ma,
      protocols: []
    }

    return pi
  }

  async provide (): Promise<void> {
    // noop
  }

  async put (): Promise<void> {
    // noop
  }

  async get (): Promise<Uint8Array> {
    throw new CodeError('Not found', 'ERR_NOT_FOUND')
  }
}

export function ipniContentRouting (url: string | URL, init: IpniContentRoutingInit = {}): (components: IpniContentRoutingComponents) => ContentRouting {
  return (components: IpniContentRoutingComponents) => new IpniContentRouting(url, init, components)
}
