import EchoServer from 'aegir/echo-server'
import body from 'body-parser'

export default {
  test: {
    before: async () => {
      let lastRequest = {
        headers: {},
        params: {},
        body: ''
      }

      const providers = new Map()
      const echoServer = new EchoServer()
      echoServer.polka.use(body.text())
      echoServer.polka.post('/add-providers/:cid', (req, res) => {
        lastRequest = {
          headers: req.headers,
          params: req.params,
          body: req.body
        }

        providers.set(req.params.cid, req.body)
        res.end()
      })
      echoServer.polka.get('/cid/:cid', (req, res) => {
        lastRequest = {
          headers: req.headers,
          params: req.params,
          body: req.body
        }

        const provs = providers.get(req.params.cid) ?? '[]'
        providers.delete(req.params.cid)

        res.end(provs)
      })
      echoServer.polka.get('/last-request', (req, res) => {
        res.end(JSON.stringify(lastRequest))
      })

      await echoServer.start()

      return {
        env: {
          ECHO_SERVER: `http://${echoServer.host}:${echoServer.port}`
        },
        echoServer
      }
    },
    after: async (options, beforeResult) => {
      await beforeResult.echoServer.stop()
    }
  }
}
