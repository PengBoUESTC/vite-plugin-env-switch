# vite-plugin-env-switch
vite-plugin-env-switch

## change the server env 

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


// your components 
if (import.meta.hot) {
  // trigger this event to restart node server with env 'development'
  import.meta.hot.send('env-check',{ env: 'development' })
}
```