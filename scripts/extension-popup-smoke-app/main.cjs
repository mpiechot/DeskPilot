const path = require("node:path");
const fs = require("node:fs");
const { app, BrowserWindow } = require("electron");

runExtensionPopupSmoke().catch((error) => {
  console.error(error);
  app.exit(1);
});

async function runExtensionPopupSmoke() {
  await app.whenReady();

  const projectRoot = path.resolve(__dirname, "..", "..");
  const popupPath = path.join(projectRoot, "browser-extension", "popup.html");
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  await window.loadFile(popupPath);
  await waitFor(window, "document.querySelector('#profileBadge')?.textContent === 'Productive'");

  const connectedState = await window.webContents.executeJavaScript(`({
    profile: document.querySelector('#profileBadge')?.textContent,
    profileKind: document.querySelector('#profileBadge')?.dataset.profile,
    category: document.querySelector('#categorySelect')?.value,
    saveEnabled: !document.querySelector('#saveCurrentTabButton')?.disabled
  })`);

  assert(connectedState.profile === "Productive", "Expected popup to show the connected Productive profile");
  assert(connectedState.profileKind === "productive", "Expected Productive profile styling");
  assert(connectedState.category === "work", "Expected popup to select DeskPilot's active category");
  assert(connectedState.saveEnabled, "Expected current-tab save to be enabled after connecting");

  await window.webContents.executeJavaScript("document.querySelector('#saveCurrentTabButton').click()");
  await waitFor(window, "document.querySelector('#statusText')?.textContent === 'Saved to Work.'");

  const savedState = await window.webContents.executeJavaScript(`({
    profile: document.querySelector('#profileBadge')?.textContent,
    status: document.querySelector('#statusText')?.textContent,
    requests: window.__deskPilotSmokeRequests
  })`);
  const saveRequest = savedState.requests.find((request) => request.url.endsWith("/tabs/current/save"));

  assert(savedState.profile === "Productive", "Expected profile badge to remain visible after saving");
  assert(savedState.status === "Saved to Work.", "Expected current-tab save result in the popup");
  assert(saveRequest?.method === "POST", "Expected popup to post the current tab to DeskPilot");
  assert(JSON.parse(saveRequest.body).categoryId === "work", "Expected popup to save into the selected category");

  const verifiedResult = {
    profile: savedState.profile,
    status: savedState.status,
    category: connectedState.category
  };
  const resultPath = process.env.DESKPILOT_EXTENSION_SMOKE_RESULT_PATH;

  assert(resultPath, "Expected extension popup smoke result path");
  fs.writeFileSync(resultPath, JSON.stringify(verifiedResult));

  window.destroy();
  app.exit(0);
}

async function waitFor(window, expression, timeoutMs = 5000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await window.webContents.executeJavaScript(expression)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error(`Timed out waiting for extension popup: ${expression}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
