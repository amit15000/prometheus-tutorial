import express from 'express'
import client from 'prom-client'
import { requestCount } from './requestCounter';
import { gaugeCounter } from './Guage';
const app = express();

// app.use(calTime)

// // @ts-ignore
// function calTime(req,res,next){
//     const st = Date.now();

//     next();

//     const ed = Date.now();

//     console.log("It took ", ed-st, 'ms');
// }

// app.use(requestCount)
app.use(gaugeCounter)


app.get('/user', (req,res)=>{
    res.json({
        name:"Amit Maurya"
    })
})

app.get('/metrics', async(req,res)=>{
    const metrics = await client.register.metrics();
    res.set('Content-Type',client.register.contentType);
    res.end(metrics)
})

app.listen(3000, ()=>{
    console.log("Server Running on Port 3000")
})