let vehicleCount = 0;
const lineY = 400; // Y-coordinate of the counting line
let vehicleCenters = []; // Array to track vehicle positions

function onOpenCvReady() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Start button to initiate vehicle detection
    document.getElementById('startButton').onclick = () => {
        video.play();
        detectVehicles();
    };

    function detectVehicles() {
        const cap = new cv.VideoCapture(video);
        const bgSubtractor = new cv.BackgroundSubtractorMOG2(500, 16, true);

        function processFrame() {
            if (video.paused || video.ended) {
                requestAnimationFrame(processFrame);
                return;
            }

            let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            cap.read(frame);

            // Convert frame to grayscale and apply background subtraction
            let gray = new cv.Mat();
            cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY);
            let fgMask = new cv.Mat();
            bgSubtractor.apply(gray, fgMask);

            // Smooth and close gaps in the mask
            let kernel = cv.Mat.ones(5, 5, cv.CV_8U);
            cv.morphologyEx(fgMask, fgMask, cv.MORPH_CLOSE, kernel);

            // Find contours on the mask
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            cv.findContours(fgMask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawLine();

            // Process each contour
            for (let i = 0; i < contours.size(); i++) {
                let contour = contours.get(i);
                let rect = cv.boundingRect(contour);

                // Filter out small contours (non-vehicle objects)
                if (rect.width > 50 && rect.height > 50) {
                    let cx = rect.x + rect.width / 2;
                    let cy = rect.y + rect.height / 2;

                    // Draw bounding boxes for detected objects
                    ctx.beginPath();
                    ctx.rect(rect.x, rect.y, rect.width, rect.height);
                    ctx.strokeStyle = '#00FF00';
                    ctx.stroke();

                    // Check if vehicle crosses the counting line
                    if (cy > lineY - 10 && cy < lineY + 10) {
                        if (!vehicleCenters.some(([x, y]) => Math.abs(x - cx) < 50 && Math.abs(y - cy) < 50)) {
                            vehicleCenters.push([cx, cy]);
                            vehicleCount++;
                            document.getElementById('vehicleCounter').innerText = `Vehicle Count: ${vehicleCount}`;
                        }
                    }
                }
            }

            // Clean up outdated vehicle center data to prevent double-counting
            vehicleCenters = vehicleCenters.filter(([x, y]) => y > lineY);

            // Clean up
            frame.delete();
            gray.delete();
            fgMask.delete();
            contours.delete();
            hierarchy.delete();
            kernel.delete();

            requestAnimationFrame(processFrame);
        }

        // Draws the counting line on the canvas
        function drawLine() {
            ctx.beginPath();
            ctx.moveTo(0, lineY);
            ctx.lineTo(canvas.width, lineY);
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        processFrame();
    }
}
