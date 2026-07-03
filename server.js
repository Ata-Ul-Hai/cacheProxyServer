import http from 'node:http'
import { blob, buffer } from 'node:stream/consumers'
import { Cache, Find } from './cache.js'
import { pipeline } from 'node:stream/promises'
import crypto from 'node:crypto'

function proxyServer(PORT, myURL) {
    const server = http.createServer(async (req, res) => {

        const {method, url} = req
        const rawKey = req.url + req.method
        const name = crypto.createHash('md5').update(rawKey).digest('hex') + '.json'
        const data = await Find(name)

        // Serves from Cache for GET requests
        if(method === 'GET' && data){
            const parseCache = JSON.parse(data)
            const cachedBuffer = Buffer.from(parseCache.body, 'base64')

            const responseHeader = {...parseCache.headers, 'X-Cache': 'HIT'}
            res.writeHead(200, responseHeader)

            res.end(cachedBuffer)
            return
        }

        // Serves from ORIGIN URL since cache not found
        const originURL = new URL( req.url, myURL ) //* this will add the relative path(/products, etc) to the URL

        {// HTTP request method

        // const proxyOptions = {
        //     method: req.method,
        //     headers: {...req.headers, host:originURL.host}
        // }

        //      //NOT in Cache Sending to myURL
        // const originReq = http.request(originURL, proxyOptions, (originRes)=>{
        //     // For sending back the response headers to the user
        //     const responseHeader = {...originRes.headers, 'X-Cache': 'MISS'};
        //     res.writeHead(originRes.statusCode, responseHeader)

        //     //  If GET and successful, capture body for caching while streaming
        //     if(originRes.method === 'GET' && originRes.statusCode === 200){
        //         const chunks = [];

        //         originRes.on('data', (chunk) =>{
        //             chunks.push(chunk)
        //         })

        //         originRes.on('end', () =>{
        //             // Adding to cache and closing 

        //             //* If you do not pass the len argument, Node.js has to loop through your 
        //             //* entire array first just to calculate the combined size before allocation.
        //             const len = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        //             const body = Buffer.concat(chunks, len)

        //             res.end()
        //         })
        //     }
        //     // If the request method is not GET (such as POST, PUT, DELETE, or PATCH),
        //     //! the proxy server completely bypasses the caching logic
        //     else{
        //         // source.pipe(destination)
        //         originRes.pipe(res)
        //     }
        // })
        // req.pipe(originReq)
        }
        
        // Fetch method
        try {
            const originResponse = await fetch(originURL.href, {
                method: req.method,
                // headers: Object.fromEntries(Object.entries(req.headers)),
                headers: {...req.headers, host: originURL.host},
        //* Native Node.js IncomingMessage (req) is inherently a Readable Stream. The native fetch API accepts Readable Streams directly as the body parameter.
                body: ['GET', 'HEAD'].includes(req.method)? undefined: req, 
                duplex: 'half' // Required by Fetch specification when forwarding streams
            })

        //* you cannot spread a Headers object into a plain JavaScript object using the spread operator (...).
        //* Headers object stores its headers data internally using private internal slots, not as standard object properties. 
            const responseHeader = Object.fromEntries(originResponse.headers.entries());
            responseHeader['X-Cache'] = 'MISS'
            // const responseHeader = new Headers(originResponse.headers);
            // responseHeader.set('X-Cache', 'MISS');

            res.writeHead(originResponse.status, responseHeader)

            if(req.method === 'GET' && originResponse.status === 200){
                const blob = await originResponse.blob()
                const buffer = Buffer.from(await blob.arrayBuffer())

                const cachePayload = JSON.stringify({
                    headers: responseHeader,
                    body: buffer.toString('base64')
                })
                //  save to cache
                Cache(name, cachePayload)

                res.end(buffer)
            }
        //! If it is not a GET request than the proxy server completely bypasses the caching logic
            else{ 
                // Readable.fromWeb(originResponse.body).pipe(clientRes);
                await pipeline(originResponse.body, res)
                return
            }
        } catch (error) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end(`Bad Gateway Proxy Error: ${error.message}`);
            return
        }
    })
    server.listen(PORT, () => console.log('Server Running on '+ PORT))
}

export default proxyServer