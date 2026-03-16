# Implementation Guide: Workers & Aggregation

This guide provides the technical implementation details for the improvements suggested in the Code Review Report without modifying the actual source files.

## 1. Graceful Worker Shutdown

To prevent orphaned connections and "ghost" jobs, workers should be closed cleanly when the application terminates.

### Step A: Update Workers to Return Instances
In [src/workers/analytics.worker.ts](file:///home/abhijeet/Desktop/NextBigProject/url-shortener/url_shortener_server/src/workers/analytics.worker.ts) and [src/workers/analytics.aggregation.worker.ts](file:///home/abhijeet/Desktop/NextBigProject/url-shortener/url_shortener_server/src/workers/analytics.aggregation.worker.ts), modify the start functions to return the worker object.

```typescript
// Example for analytics.worker.ts
let worker: Worker;

export async function startAnalyticsWorker() {
  worker = new Worker(...);
  return worker;
}

export async function stopAnalyticsWorker() {
  if (worker) await worker.close();
}
```

### Step B: Handle Shutdown in Server
In [src/server.ts](file:///home/abhijeet/Desktop/NextBigProject/url-shortener/url_shortener_server/src/server.ts), store the worker references and close them in the signal handlers.

```typescript
let analyticsWorker: Worker;
let aggregationWorker: Worker;

// Inside app.listen
analyticsWorker = await startAnalyticsWorker();
aggregationWorker = await startAggregationAnalyticsWorker();

// Inside SIGINT / SIGTERM handlers
process.on("SIGINT", async () => {
  await analyticsWorker?.close();
  await aggregationWorker?.close();
  await closeRedis();
  await disconnectDB();
  process.exit(0);
});
```

---

## 2. Optimized Aggregation Logic (MongoDB Pipeline)

Instead of fetching thousands of records into Node.js memory, use MongoDB's aggregation engine to perform the counting.

### The Aggregation Pipeline
In [src/repositories/analytics.repository.ts](file:///home/abhijeet/Desktop/NextBigProject/url-shortener/url_shortener_server/src/repositories/analytics.repository.ts), refactor [aggregateAnalytics](file:///home/abhijeet/Desktop/NextBigProject/url-shortener/url_shortener_server/src/services/analytics.service.ts#36-39) to use the `$group` stage. 

```typescript
async aggregateAnalytics(start: Date, end: Date) {
  const results = await RawAnalytics.aggregate([
    {
      $match: {
        utcDate: { $gte: start, $lt: end }
      }
    },
    {
      $group: {
        _id: "$urlId",
        clicks: { $sum: 1 },
        // Use $push or $objectToArray if you want to count sub-properties 
        // Or aggregate per dimension:
        os: { $push: "$os" },
        browsers: { $push: "$browser" },
        devices: { $push: "$device" },
        countries: { $push: "$country" }
        // ... etc (city, region)
      }
    }
  ]);

  for (const doc of results) {
    // Helper function to count occurrences in arrays
    const countMap = (arr: string[]) => arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    await HourlyAggregatedAnalytics.create({
      urlId: doc._id,
      clicks: doc.clicks,
      os: countMap(doc.os),
      browser: countMap(doc.browsers),
      device: countMap(doc.devices),
      country: countMap(doc.countries),
      utcStartDate: start,
      utcEndDate: end
    });
  }
}
```

> [!TIP]
> **Advanced Optimization**: You can use `$facet` to perform all counting in a single DB pass entirely on the server side, returning a perfectly formatted object ready for injection into [HourlyAggregatedAnalytics](file:///home/abhijeet/Desktop/NextBigProject/url-shortener/url_shortener_server/src/models/analytics.model.ts#15-28).
