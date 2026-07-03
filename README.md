# CACHE PROXY SERVER

*CLI tool that starts a caching proxy server, it will forward requests to the actual server and cache the responses. If the same request is made again, it will return the cached response instead of forwarding the request to the server.*

## Starting the Server

User should be able to start the caching proxy server by running a command like following:

``` shell
caching-proxy --port <number> --origin <url>
```

* `--port` is the port on which the caching proxy server will run.
* `--origin` is the URL of the server to which the requests will be forwarded.

## Response

The headers to the response indicate whether the response is from the cache or the server.

```plaintext
# If the response is from the cache
X-Cache: HIT
# If the response is from the origin server
X-Cache: MISS
```
## Clear Cache

```shell
caching-proxy --clear-cache
```

# Limitations

* **Memory Exhaustion**: The system loads entire origin responses into RAM (Buffer.from(await blob.arrayBuffer())) prior to disk writing. The Node.js process will crash with an out-of-memory (OOM) error if attempting to proxy large payloads, such as video files or bulk data streams.

* **Storage Saturation (No TTL)**: The implementation lacks an eviction policy, such as Time-To-Live (TTL) or Least Recently Used (LRU). The local cache directory will expand infinitely until disk space is completely exhausted.

# Conclusion

*This is a minimal implementation intended as a starting point for more complex caching proxy solutions.*

