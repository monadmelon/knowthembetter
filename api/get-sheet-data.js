// This is a serverless function that will fetch data from Google Sheets.
// It acts as our private, secure middleman to avoid CORS errors.

export default async function handler(request, response) {
  const sheetId = '1Co4oNp5L6aXUx6_jdGGFtRSzyNKg9aPc';
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

  try {
    const fetchResponse = await fetch(sheetUrl);
    if (!fetchResponse.ok) {
      return response.status(fetchResponse.status).json({ error: 'Failed to fetch from Google Sheets' });
    }
    
    const csvText = await fetchResponse.text();

    // NEW: Add cache-control headers to prevent Vercel from storing a stale copy.
    // This tells the browser and Vercel's servers not to cache this response.
    response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');

    // Set content type for the response
    response.setHeader('Content-Type', 'text/csv');
    
    // Send the fresh CSV data back to our website's JavaScript
    return response.status(200).send(csvText);

  } catch (error) {
    console.error('Error in serverless function:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}