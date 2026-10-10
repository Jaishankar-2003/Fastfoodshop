import https from "https";

export function customSupabaseFetch(url: string | URL | Request, options: RequestInit = {}): Promise<Response> {
  const urlString = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
  const parsedUrl = new URL(urlString);

  // If in browser or non-supabase domain, use standard fetch
  if (typeof window !== "undefined" || !parsedUrl.hostname.endsWith(".supabase.co")) {
    return fetch(url, options);
  }

  return new Promise((resolve, reject) => {
    // Cloudflare IP for Supabase to bypass local ISP DNS hijacking
    const targetHost = "104.18.38.10";

    const reqHeaders: Record<string, string> = {};
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((val, key) => {
          reqHeaders[key] = val;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, val]) => {
          reqHeaders[key] = val;
        });
      } else {
        Object.assign(reqHeaders, options.headers as Record<string, string>);
      }
    }
    reqHeaders["Host"] = parsedUrl.hostname;

    let bodyData: Buffer | string | undefined = undefined;
    if (options.body) {
      if (typeof options.body === "string" || Buffer.isBuffer(options.body)) {
        bodyData = options.body;
      } else {
        bodyData = String(options.body);
      }
      reqHeaders["Content-Length"] = String(Buffer.byteLength(bodyData));
    }

    const reqOptions: https.RequestOptions = {
      host: targetHost,
      port: parsedUrl.port ? Number(parsedUrl.port) : 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      servername: parsedUrl.hostname,
      headers: reqHeaders,
    };

    const req = https.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: ArrayBuffer) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => {
        const bodyBuffer = Buffer.concat(chunks);
        const headers = new Headers();
        for (const [key, value] of Object.entries(res.headers)) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
          } else if (typeof value === "string") {
            headers.set(key, value);
          }
        }
        const response = new Response(bodyBuffer, {
          status: res.statusCode || 200,
          statusText: res.statusMessage || "OK",
          headers,
        });
        resolve(response);
      });
    });

    req.on("error", (err: Error) => {
      reject(err);
    });

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}
