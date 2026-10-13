import type { HttpClientPort, HttpResponse } from '../../core/sync/ports';

/**
 * Adaptador de cliente HTTP que utiliza fetch estándar de React Native / Node (RF-12).
 */
export class FetchHttpClientPort implements HttpClientPort {
  async post<T>(url: string, headers: Record<string, string>, body: unknown): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      let data: unknown;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return {
        status: response.status,
        data: data as T,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      let data: unknown;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return {
        status: response.status,
        data: data as T,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
