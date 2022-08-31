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
      root: __dirname,
      eventName: 'env-check',
    })
  ]
  //...
})

```

- <font color="red"> careful about that dont publish these code in production</font>

- add code in index.html, there are three btn to trigger ws event (just for debug)

```html
<div class="env-btn-wrapper">
  <button class="env-btn" data-env="development">dev</button>
  <button class="env-btn" data-env="prepare">pre</button>
  <button class="env-btn" data-env="production">pro</button>
</div>
```
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
