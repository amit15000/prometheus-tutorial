import express from 'express';
import { httpMetricsMiddleware } from './httpMetricsMiddleware';
import {
  renderMetrics,
  tutorialCounterEventsTotal,
  tutorialLatencySeconds,
  tutorialPayloadSizeBytes,
  tutorialQueueDepth,
} from './metrics';

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(httpMetricsMiddleware);

app.get('/', (_req, res) => {
  res.type('json');
  res.json({
    message:
      'Prometheus tutorial — scrape GET /metrics; with Docker Compose also use Grafana on port 3001',
    routes: {
      'GET /metrics': 'Prometheus text exposition (same as /matrics)',
      'GET /matrics': 'Alias for /metrics',
      'GET /user': 'Sample JSON route (included in HTTP metrics)',
      'GET /demo/counter': 'Increments tutorial_counter_events_total',
      'GET /demo/gauge?depth=3': 'Sets tutorial_queue_depth (default depth=0)',
      'GET /demo/histogram?bytes=120': 'Observes tutorial_payload_size_bytes',
      'GET /demo/summary?ms=40': 'Observes tutorial_latency_seconds (quantiles)',
      'GET /demo/slow?ms=250': 'Slow handler so histogram/summary are visible on real requests',
    },
  });
});

app.get('/user', (_req, res) => {
  res.json({ name: 'Amit Maurya' });
});

app.get('/demo/counter', (req, res) => {
  const kind = typeof req.query.kind === 'string' ? req.query.kind : 'click';
  tutorialCounterEventsTotal.inc({ kind });
  res.json({ ok: true, kind, hint: 'Check tutorial_counter_events_total on /metrics' });
});

app.get('/demo/gauge', (req, res) => {
  const raw = req.query.depth;
  const depth =
    typeof raw === 'string' && raw.trim() !== '' ? Number.parseFloat(raw) : 0;
  if (Number.isNaN(depth)) {
    res.status(400).json({ error: 'depth must be a number' });
    return;
  }
  tutorialQueueDepth.set(depth);
  res.json({ ok: true, depth, hint: 'Check tutorial_queue_depth on /metrics' });
});

app.get('/demo/histogram', (req, res) => {
  const raw = req.query.bytes;
  const bytes =
    typeof raw === 'string' && raw.trim() !== '' ? Number.parseInt(raw, 10) : 512;
  if (Number.isNaN(bytes) || bytes < 0) {
    res.status(400).json({ error: 'bytes must be a non-negative integer' });
    return;
  }
  tutorialPayloadSizeBytes.observe({ source: 'query' }, bytes);
  res.json({ ok: true, bytes, hint: 'Check tutorial_payload_size_bytes_bucket on /metrics' });
});

app.post('/demo/histogram', (req, res) => {
  const bodyStr = JSON.stringify(req.body ?? {});
  const bytes = Buffer.byteLength(bodyStr, 'utf8');
  tutorialPayloadSizeBytes.observe({ source: 'body' }, bytes);
  res.json({
    ok: true,
    bytes,
    hint: 'Check tutorial_payload_size_bytes_count and buckets',
  });
});

app.get('/demo/summary', (req, res) => {
  const raw = req.query.ms;
  const ms =
    typeof raw === 'string' && raw.trim() !== '' ? Number.parseFloat(raw) : 25;
  if (Number.isNaN(ms) || ms < 0) {
    res.status(400).json({ error: 'ms must be a non-negative number' });
    return;
  }
  tutorialLatencySeconds.observe({ path: '/demo/summary' }, ms / 1000);
  res.json({
    ok: true,
    observedSeconds: ms / 1000,
    hint: 'Check tutorial_latency_seconds quantiles on /metrics',
  });
});

app.get('/demo/slow', async (req, res) => {
  const raw = req.query.ms;
  const ms =
    typeof raw === 'string' && raw.trim() !== '' ? Number.parseInt(raw, 10) : 200;
  const delay = Number.isNaN(ms) ? 200 : Math.min(Math.max(ms, 0), 10_000);
  await new Promise((r) => setTimeout(r, delay));
  res.json({ ok: true, delayedMs: delay });
});

async function exposeMetrics(_req: express.Request, res: express.Response): Promise<void> {
  const { body, contentType } = await renderMetrics();
  res.set('Content-Type', contentType);
  res.end(body);
}

app.get('/metrics', exposeMetrics);
app.get('/matrics', exposeMetrics);

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
  console.log(`Metrics: http://0.0.0.0:${port}/metrics`);
});
