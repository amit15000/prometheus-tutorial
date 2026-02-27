import { NextFunction, Request, Response } from 'express';
import client from 'prom-client'


const activeUserGauge = new client.Gauge({
    name: "active_user_guage",
    help: "Number of active users",
    labelNames: ["method", "route"]
});


export function gaugeCounter(req: Request, res: Response, next: NextFunction) {
    activeUserGauge.inc({
        method: req.method,
        route: req.path
    })

    res.on("finish", () => {
        setInterval(() => {
            activeUserGauge.dec({
                method: req.method,
                route: req.path
            })
        }, 10000)

    })
    next();
}