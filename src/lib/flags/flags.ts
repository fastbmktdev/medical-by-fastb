import { growthbookAdapter } from "@flags-sdk/growthbook";
import { after } from "next/server";

growthbookAdapter.setTrackingCallback((experiment, result) => {
  // Safely fire and forget async calls (Next.js)
  after(async () => {
    console.log("Viewed Experiment", {
      experimentId: experiment.key,
      variationId: result.key,
    });
  });
});