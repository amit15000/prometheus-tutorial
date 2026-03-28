import type { NextFunction, Request, Response } from 'express';
import {
  httpRequestDurationSeconds,
  httpRequestsInFlight,
  httpRequestsTotal,
} from './metrics';

function routeLabel(req: Request): string {
  if (req.route && typeof req.route.path === 'string') {
    return req.route.path;
  }
  return req.path || '/';
}

/**
 * Records Counter (with status), Histogram (duration), and Gauge (in-flight) per request.
 */
export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const route = routeLabel(req);
  const labels = { method: req.method, route };

  httpRequestsInFlight.inc(labels);

  const endTimer = httpRequestDurationSeconds.startTimer({
    method: req.method,
    route,
  });

  let recorded = false;
  const onDone = (): void => {
    if (recorded) return;
    recorded = true;
    const status = String(res.statusCode);
    httpRequestsInFlight.dec(labels);
    httpRequestsTotal.inc({ ...labels, status });
    endTimer({ status });
  };

  res.on('finish', onDone);
  res.on('close', onDone);

  next();
}
