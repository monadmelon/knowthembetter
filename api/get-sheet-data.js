// This is a serverless function that will fetch data from Google Sheets.
// It acts as our private, secure middleman to avoid CORS errors.

export default async function handler(request, response) {
  const sheetId = '1Co4oNp5L6aXUx6_jdGGFtRSzyNKg9aPc';
  // Note: We use the '/gviz/tq' endpoint which is a simpler way to get sheet data.
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

  try {
    const fetchResponse = await fetch(sheetUrl);
    if (!fetchResponse.ok) {
      // If Google returns an error, pass it along.
      return response.status(fetchResponse.status).json({ error: 'Failed to fetch from Google Sheets' });
    }
    
    const csvText = await fetchResponse.text();

    // Set headers to allow our website to access this data
    response.setHeader('Access-Control-Allow-Origin', '*'); 
    response.setHeader('Content-Type', 'text/csv');
    
    // Send the CSV data back to our website's JavaScript
    return response.status(200).send(csvText);

  } catch (error) {
    console.error('Error in serverless function:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}