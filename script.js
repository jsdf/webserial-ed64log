'use strict';

let port;
let reader;
let inputDone;
let inputStream;

const log = document.getElementById('log');
const butConnect = document.getElementById('butConnect');

document.addEventListener('DOMContentLoaded', () => {
  butConnect.addEventListener('click', clickConnect);
  if (!('serial' in navigator)) {
    const notSupported = document.getElementById('notSupported');
    notSupported.classList.remove('hidden');
  }
});

async function connect() {
  // - Request a port and open a connection.
  port = await navigator.serial.requestPort();
  // - Wait for the port to open.
  await port.open({baudrate: 57600});
  let decoder = new TextDecoderStream();
  inputDone = port.readable.pipeTo(decoder.writable);
  inputStream = decoder.readable;

  reader = inputStream.getReader();
  readLoop();
}

// Click handler for the connect/disconnect button
async function clickConnect() {
  if (port) {
    await disconnect();
    toggleUIConnected(false);
    return;
  }
  try {
    await connect();
  } catch (err) {
    alert(err);
    return;
  }
  toggleUIConnected(true);
}

async function disconnect() {
  if (reader) {
    await reader.cancel();
    await inputDone.catch(() => {});
    reader = null;
    inputDone = null;
  }
  await port.close();
  port = null;
}

// Reads data from the input stream and displays it on screen.
async function readLoop() {
  while (true) {
    const {value, done} = await reader.read();
    if (value) {
      const nullPos = value.indexOf('\0');
      const valueTrimmed = nullPos > -1 ? value.slice(0, nullPos) : value;
      log.textContent += valueTrimmed;
      // auto scroll to bottom
      log.parentElement.scrollTop = log.parentElement.scrollHeight;
    }
    if (done) {
      console.log('[readLoop] DONE', done);
      reader.releaseLock();
      break;
    }
  }
}

function toggleUIConnected(connected) {
  let lbl = 'Connect';
  if (connected) {
    lbl = 'Disconnect';
  }
  butConnect.textContent = lbl;
}
