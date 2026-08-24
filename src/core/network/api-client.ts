import 'server-only';

import { AppConfig } from '@/core/config/app-config';
import { Failure } from '@/core/error/failure';

/// Thin JSON client for the consultation API in `../consultation_api/api`.
///
/// Server-only, and that import at the top is what enforces it. The browser
/// never holds the API token: a screen calls this app's own `/api/...` route,
/// the route reads the httpOnly session cookie, and only then does this client
/// talk to the API. Two jobs beyond `fetch`, the same two as
/// core/network/api_client.dart — it attaches the bearer token, and it turns
/// every failure into a `Failure` whose message is fit to show.
export class ApiClient {
  constructor(private readonly token: string | null) {}

  /// Long enough for a cold start, short enough that the spinner does not
  /// outlast the reviewer's patience.
  static readonly timeoutMs = 20_000;

  get<T>(path: string): Promise<T> {
    return this.send<T>('GET', path);
  }

  post<T>(path: string, body: unknown = {}): Promise<T> {
    return this.send<T>('POST', path, body);
  }

  patch<T>(path: string, body: unknown = {}): Promise<T> {
    return this.send<T>('PATCH', path, body);
  }

  private async send<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ApiClient.timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${AppConfig.apiBaseUrl}${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
        // An approval queue must never be served from a cache: a stale queue
        // shows an application two reviewers then both decide.
        cache: 'no-store',
      });
    } catch (error) {
      // Names the address on purpose. The usual cause is not a slow server but
      // an unreachable one — the API not running, or API_BASE_URL pointing
      // somewhere nothing answers.
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Failure(
          `Could not reach the API at ${AppConfig.apiBaseUrl}. Check that it is running.`,
        );
      }
      throw Failure.network();
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();

    if (!text) {
      if (response.status >= 400) throw this.statusFailure(response.status);
      return {} as T;
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw Failure.unexpected();
    }

    if (response.status >= 400) {
      // The API's own message wins when it has one — it knows why it refused.
      const message =
        typeof json === 'object' && json !== null && 'message' in json
          ? String((json as { message: unknown }).message)
          : null;
      throw message ? new Failure(message) : this.statusFailure(response.status);
    }

    return json as T;
  }

  private statusFailure(status: number): Failure {
    if (status === 401 || status === 403) return Failure.unauthorised();
    if (status === 404) return new Failure('That record no longer exists.');
    if (status === 409) {
      return new Failure('Someone else has already decided this application.');
    }
    return Failure.unexpected();
  }
}
