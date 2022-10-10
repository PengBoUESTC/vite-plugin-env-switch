# vite-plugin-env-switch
vite-plugin-env-switch

## change the server env 

- vite.config.ts
```javascript
// vite config 
export default defineConfig({
  //...
  plugins: [
    envSwitchPlugin({
      wsProtocol: 'vite-hmr', // ws protocol
      envs: ['prepare', 'development', 'production'], // env vars
      wsPath: `${wsprotocol}://${host}/${base}:${port}/`, // link
      root: __dirname, // env config root path
      eventName: 'env-check'
    }),
  ]
  //...
})
```

- inject code in index.html, depend on `envs` config, there will be some buttons to trigger ws event.
- these code will be inject by `transformIndexHtml.transform`
```html
<div class="env-btn-wrapper">
  <button class="env-btn" data-env="development">dev</button>
  <button class="env-btn" data-env="prepare">pre</button>
  <button class="env-btn" data-env="production">pro</button>
</div>
```
![operation buttons](data:image/png;base64,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)
- get a ws socket to send event to vite server

```javascript
const ws = new WebSocket('wss://xx', 'vite-hmr')
document.querySelectorAll('.env-btn').forEach(dom => {
  const { dataset } = dom
  dom.addEventListener('click', () => handleEnv(dataset.env))
})
function handleEnv(env) {
  ws.send(JSON.stringify({ type: 'custom', event: 'env-check', data: { env } }))
}
```
