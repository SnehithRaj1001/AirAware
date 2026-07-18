import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import db from '../db.js';

const DATASET_PATH = path.join(
  'D:',
  'Anurag_Stuff',
  'Programming',
  'AQI assets',
  'AQI-DATASET',
  'DATASET',
  'Data',
  'CSVs'
);

async function getCsvFiles() {
  try {
    const files = await fs.promises.readdir(DATASET_PATH);
    return files.filter(file => file.endsWith('.csv'));
  } catch (error) {
    console.error('Error reading dataset directory:', error.message);
    return [];
  }
}

async function findStationByFileName(fileName) {
  try {
    const result = await db.query(
      'SELECT id FROM stations WHERE file_name = $1',
      [fileName]
    );
    return result.rows[0]?.id || null;
  } catch (error) {
    console.error(`Error finding station for ${fileName}:`, error.message);
    return null;
  }
}

async function parseAndInsertCsv(filePath, stationId) {
  return new Promise((resolve, reject) => {
    const records = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Assuming CSV has columns: date, pm25, pm10, o3, no2, so2, co
        const record = {
          station_id: stationId,
          date: new Date(data.date), // Assuming 'date' column
          pm25: data.pm25 ? parseFloat(data.pm25) : null,
          pm10: data.pm10 ? parseFloat(data.pm10) : null,
          o3: data.o3 ? parseFloat(data.o3) : null,
          no2: data.no2 ? parseFloat(data.no2) : null,
          so2: data.so2 ? parseFloat(data.so2) : null,
          co: data.co ? parseFloat(data.co) : null,
        };
        records.push(record);
      })
      .on('end', async () => {
        try {
          if (records.length === 0) {
            resolve({ inserted: 0, skipped: 0 });
            return;
          }

          // Batch insert
          const values = records.map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`).join(', ');
          const params = records.flatMap(r => [r.station_id, r.date, r.pm25, r.pm10, r.o3, r.no2, r.so2, r.co]);

          const result = await db.query(
            `INSERT INTO aqi_data (station_id, date, pm25, pm10, o3, no2, so2, co)
             VALUES ${values}
             ON CONFLICT (station_id, date) DO NOTHING`,
            params
          );

          const inserted = result.rowCount;
          const skipped = records.length - inserted;
          resolve({ inserted, skipped });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function importAqiData() {
  console.log('Starting AQI data import...');

  const csvFiles = await getCsvFiles();
  if (csvFiles.length === 0) {
    console.log('No CSV files found in dataset directory.');
    return;
  }

  console.log(`Found ${csvFiles.length} CSV files.`);

  let successCount = 0;
  let failCount = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  for (let i = 0; i < csvFiles.length; i++) {
    const fileName = csvFiles[i];
    const filePath = path.join(DATASET_PATH, fileName);

    console.log(`[${i + 1}/${csvFiles.length}] Importing ${fileName}...`);

    // Check if file exists
    try {
      await fs.promises.access(filePath);
    } catch (error) {
      console.log(`[FAILED] File not found: ${fileName}`);
      failCount++;
      continue;
    }

    // Find station
    const stationId = await findStationByFileName(fileName);
    if (!stationId) {
      console.log(`[FAILED] No station found for file: ${fileName}`);
      failCount++;
      continue;
    }

    // Parse and insert
    try {
      const { inserted, skipped } = await parseAndInsertCsv(filePath, stationId);
      console.log(`[SUCCESS] Imported ${inserted} rows, skipped ${skipped} duplicates`);
      successCount++;
      totalInserted += inserted;
      totalSkipped += skipped;
    } catch (error) {
      console.log(`[FAILED] Error processing ${fileName}: ${error.message}`);
      failCount++;
    }
  }

  console.log('\nImport completed:');
  console.log(`Successful imports: ${successCount}`);
  console.log(`Failed imports: ${failCount}`);
  console.log(`Total rows inserted: ${totalInserted}`);
  console.log(`Total duplicates skipped: ${totalSkipped}`);

  // Close database connection
  await db.end();
}

importAqiData().catch(console.error);