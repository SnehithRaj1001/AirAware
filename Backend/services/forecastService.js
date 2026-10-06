import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ForecastService {
    static async trainModel(stationId, onProgress = null) {
        return new Promise((resolve, reject) => {
            console.log(`Starting DB-backed training for station ID: ${stationId}`);
            const trainingScript = path.join(__dirname, '../../Model-XGBoost.py');
            const pythonProcess = spawn('python', [trainingScript, stationId.toString()]);

            const targets = ["PM2.5", "PM10", "NO2", "NH3", "SO2", "CO", "Ozone"];
            let completedTargets = 0;

            let errorString = '';
            pythonProcess.stdout.on('data', (data) => {
                const output = data.toString();
                // Simple parsing to track progress based on target prints
                targets.forEach(target => {
                    if (output.includes(target) && output.includes("Full")) {
                        completedTargets++;
                        if (onProgress) {
                            const progress = Math.round((completedTargets / targets.length) * 100);
                            onProgress({ status: 'training', progress, currentTask: `Training ${target}...` });
                        }
                    }
                });
            });

            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(`Training completed successfully for station ID: ${stationId}`);
                    if (onProgress) onProgress({ status: 'complete', progress: 100 });
                    resolve();
                } else {
                    console.error(`Training failed for station ID ${stationId}: ${errorString}`);
                    reject(new Error(`Training failed: ${errorString}`));
                }
            });
        });
    }

    static async getForecastStream(stationId, res) {
        const modelPath = path.join(__dirname, '../../models', `station_${stationId}.pkl`);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sendEvent = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        try {
            console.log(`[ForecastStream] Checking model at: ${modelPath}`);
            if (!fs.existsSync(modelPath)) {
                console.log(`[ForecastStream] Model not found. Starting training for station ${stationId}...`);
                sendEvent({ status: 'training', progress: 0, message: 'Initial training started...' });
                await this.trainModel(stationId, (progressData) => {
                    sendEvent(progressData);
                });
            } else {
                console.log(`[ForecastStream] Found existing model for station ${stationId}. Loading directly.`);
                sendEvent({ status: 'loading', progress: 50, message: 'Loading existing model...' });
            }

            sendEvent({ status: 'forecasting', progress: 90, message: 'Generating predictions...' });
            
            const pythonScript = path.join(__dirname, 'mlService.py');
            const pythonProcess = spawn('python', [pythonScript, stationId.toString(), modelPath]);

            let dataString = '';
            let errorString = '';

            pythonProcess.stdout.on('data', (data) => { dataString += data.toString(); });
            pythonProcess.stderr.on('data', (data) => { errorString += data.toString(); });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    sendEvent({ status: 'error', message: `Forecast script failed: ${errorString}` });
                    return res.end();
                }
                try {
                    const result = JSON.parse(dataString);
                    if (result.error) {
                        sendEvent({ status: 'error', message: result.error });
                    } else {
                        sendEvent({ status: 'done', forecast: result.forecast });
                    }
                } catch (e) {
                    sendEvent({ status: 'error', message: `Failed to parse forecast: ${e.message}` });
                }
                res.end();
            });

        } catch (err) {
            sendEvent({ status: 'error', message: err.message });
            res.end();
        }
    }

    static async getForecast(stationId) {
        // Models are in the root 'models' directory
        const modelPath = path.join(__dirname, '../../models', `station_${stationId}.pkl`);

        // Check if model already exists to avoid unnecessary training
        if (!fs.existsSync(modelPath)) {
            console.log(`Model for station ${stationId} not found at ${modelPath}. Starting initial training...`);
            await this.trainModel(stationId);
        } else {
            console.log(`Model for station ${stationId} already exists at ${modelPath}. Skipping training.`);
        }

        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, 'mlService.py');
            const pythonProcess = spawn('python', [pythonScript, stationId.toString(), modelPath]);

            let dataString = '';
            let errorString = '';

            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error(`Forecast script failed: ${errorString}`));
                }
                try {
                    const result = JSON.parse(dataString);
                    if (result.error) {
                        return reject(new Error(result.error));
                    }
                    resolve(result.forecast);
                } catch (e) {
                    reject(new Error(`Failed to parse forecast data: ${e.message}`));
                }
            });
        });
    }
}



