// eslint-disable-next-line @typescript-eslint/no-unused-vars
function init(wsPath, wsProtocol, initMode, eventName) {
  const ws = new WebSocket(wsPath, wsProtocol);
  const btns = document.querySelectorAll('.env-btn');
  let curBtn;
  function activeBtn(dom) {
    curBtn && curBtn.setAttribute('style', 'background-color: pink');
    dom.setAttribute('style', 'background-color: #C3E88D');
    curBtn = dom;
  }
  function handleEnv(env, dom) {
    activeBtn(dom);
    ws.send(
      JSON.stringify({
        type: 'custom',
        event: eventName,
        data: { env },
      }),
    );
  }
  btns.forEach((dom: HTMLElement) => {
    const { dataset } = dom;
    if (initMode == dataset.env) {
      activeBtn(dom);
    }
    dom.addEventListener('click', () => handleEnv(dataset.env, dom));
  });
}
