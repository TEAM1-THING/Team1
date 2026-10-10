// The hidden audio window: its own renderer process, so capture and the
// AudioWorklet never compete with the overlay's rendering or with the main
// process. It has its own in-memory session, so the media permission it needs
// is never granted to the meeting page.
import { BrowserWindow, desktopCapturer, session } from "electron";
import { config, dist } from "./config";

export function createAudioWindow() {
  const ses = session.fromPartition("sc-audio");
  ses.setPermissionRequestHandler((_wc, permission, cb) => cb(permission === "media"));
  ses.setPermissionCheckHandler((_wc, permission) => permission === "media");
  // Windows: system audio via loopback rides on a screen capture request. The
  // video track is stopped as soon as it arrives; only the audio is used.
  ses.setDisplayMediaRequestHandler(async (_req, cb) => {
    const [screen] = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 0, height: 0 } });
    cb(screen ? { video: screen, audio: "loopback" } : null);
  });

  const win = new BrowserWindow({
    show: false,
    width: 320,
    height: 120,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      session: ses,
      preload: dist("preload-audio.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      // Hidden windows are throttled by default, which would starve capture.
      backgroundThrottling: false,
      autoplayPolicy: "no-user-gesture-required",
    },
  });
  win.webContents.on("render-process-gone", (_e, d) => {
    console.error(`[audio] renderer gone (${d.reason}); reloading`);
    if (!win.isDestroyed()) win.reload();
  });
  void win.loadFile(dist("audio.html"), {
    query: { platform: process.platform, device: config.audioDevice, source: config.audioSource },
  });
  return win;
}
