/// <reference lib="webworker" />

// This file will run in a separate thread to offload heavy processing

addEventListener('message', ({ data }) => {
  if (data.type === 'process-images') {
    // Simulate heavy image processing work
    const results = processImages(data.images);
    postMessage({ type: 'process-complete', results });
  }
});

// Function to process images (simulated)
function processImages(images: any[]): any[] {
  // This would actually do something like image optimization, resizing, etc.
  // For now it's just a simulation

  return images.map((image) => {
    // Simulate processing time
    const start = Date.now();
    while (Date.now() - start < 10) {
      // Artificial delay - would be real processing work in a real app
    }

    return {
      ...image,
      processed: true,
      timestamp: new Date().toISOString(),
    };
  });
}
