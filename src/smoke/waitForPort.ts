import net from "node:net";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function canConnect(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    const finish = (result: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(1_000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

export async function waitForPort(
  port: number,
  host = "127.0.0.1",
  options: { attempts?: number; delayMs?: number } = {},
): Promise<void> {
  const attempts = options.attempts ?? 60;
  const delayMs = options.delayMs ?? 1_000;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (await canConnect(host, port)) {
      return;
    }

    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  throw new Error(
    `Timed out waiting for ${host}:${port} to accept connections after ${attempts} attempts.`,
  );
}
