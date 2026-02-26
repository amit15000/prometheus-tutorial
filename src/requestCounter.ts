import client from 'prom-client'

const requestCounter = new client.Counter({
    name: "http_request_count",
    labelNames: ["method", "route"],
    help: "Calculates total number of requests for the specific method , route and status code"
})

//@ts-ignore
export function requestCount(req, res, next) {
    res.on('finish', () => {
        requestCounter.inc({
            method: req.method,
            route: req.path
        })
    })
    next();
}