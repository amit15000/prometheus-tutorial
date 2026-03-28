import client from 'prom-client';

/**
 * Standard Node/process metrics: CPU, memory, event loop lag, GC, etc.
 * Appear on /metrics with the `process_` and `nodejs_` prefixes.
 */
client.collectDefaultMetrics({ register: client.register });

/** Counter: only increases. Use for totals (requests, errors, bytes sent). */
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests received',
  labelNames: ['method', 'route', 'status'],
});

/** Counter: tutorial — increments when you hit /demo/counter */
export const tutorialCounterEventsTotal = new client.Counter({
  name: 'tutorial_counter_events_total',
  help: 'Demo counter increments from /demo/counter',
  labelNames: ['kind'],
});

/** Gauge: goes up and down. Use for queue depth, open connections, memory you set manually. */
export const httpRequestsInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method', 'route'],
});

/** Gauge: tutorial — set via query on /demo/gauge */
export const tutorialQueueDepth = new client.Gauge({
  name: 'tutorial_queue_depth',
  help: 'Demo gauge set from /demo/gauge',
});

/** Histogram: observe many durations/sizes; Prometheus stores _count, _sum, and _bucket{le="..."} */
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

/** Histogram: tutorial — payload size demo */
export const tutorialPayloadSizeBytes = new client.Histogram({
  name: 'tutorial_payload_size_bytes',
  help: 'Demo histogram for payload sizes',
  labelNames: ['source'],
  buckets: [16, 64, 256, 1024, 4096, 16384, 65536],
});

/**
 * Summary: client-side quantiles over a sliding window (unlike histogram buckets on the server).
 * You will see _count, _sum, and quantile labels.
 */
export const tutorialLatencySeconds = new client.Summary({
  name: 'tutorial_latency_seconds',
  help: 'Demo summary latency observations in seconds',
  labelNames: ['path'],
  percentiles: [0.5, 0.9, 0.99],
});

export async function renderMetrics(): Promise<{ body: string; contentType: string }> {
  return {
    body: await client.register.metrics(),
    contentType: client.register.contentType,
  };
}
