const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow } = require("electron");

// Each PNG is rendered from the vector master at its target size.
// The ICO embeds those same PNGs, including Windows fractional-DPI sizes.
const root = path.resolve(__dirname, "..");
const sizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const svg = fs.readFileSync(path.join(root, "assets", "deskpilot.svg"), "utf8");
  const window = new BrowserWindow({ show: false, width: 256, height: 256,
    backgroundColor: "#00000000", transparent: true, webPreferences: { offscreen: true } });
  const images = [];
  for (const size of sizes) {
    window.setContentSize(size, size);
    await window.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(
      '<style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block;width:' + size + 'px;height:' + size + 'px}</style>' + svg));
    await new Promise(resolve => setTimeout(resolve, 150));
    const image = await window.webContents.capturePage();
    const png = image.resize({ width: size, height: size, quality: "best" }).toPNG();
    images.push(png);
    fs.writeFileSync(path.join(root, "browser-extension", "icons", "deskpilot-" + size + ".png"), png);
  }
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const p = 6 + i * 16;
    header[p] = size === 256 ? 0 : size;
    header[p + 1] = header[p];
    header.writeUInt16LE(1, p + 4);
    header.writeUInt16LE(32, p + 6);
    header.writeUInt32LE(images[i].length, p + 8);
    header.writeUInt32LE(offset, p + 12);
    offset += images[i].length;
  });
  fs.writeFileSync(path.join(root, "assets", "deskpilot.ico"), Buffer.concat([header, ...images]));
  const rows = ["#f0f3f6", "#202327"].map(background =>
    '<section style="background:' + background + ';color:' + (background === "#202327" ? "#dae4ed" : "#273d51") + '">' +
    sizes.map((size, i) => '<div><img width="' + size + '" height="' + size +
      '" src="data:image/png;base64,' + images[i].toString("base64") + '"><span>' + size + ' px</span></div>').join("") + '</section>').join("");
  window.setContentSize(1000, 700);
  await window.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(
    '<style>body{margin:0;font:13px system-ui}section{height:350px;display:flex;align-items:center;justify-content:space-evenly}div{display:flex;align-items:center;flex-direction:column;gap:20px}img{object-fit:contain}</style>' + rows));
  await new Promise(resolve => setTimeout(resolve, 150));
  fs.writeFileSync(path.join(root, "assets", "deskpilot-icon-sizes.png"), (await window.webContents.capturePage()).toPNG());
  console.log("Generated PNGs, Windows ICO and light/dark preview.");
  window.destroy();
  app.quit();
}).catch(error => { console.error(error); app.exit(1); });

