<?php
// This PHP file replaces the Vercel Node.js function.
// It fetches the CSV data and serves it to the frontend.

// 1. Define the Google Sheet URL
$sheetId = '1Co4oNp5L6aXUx6_jdGGFtRSzyNKg9aPc';
$sheetUrl = "https://docs.google.com/spreadsheets/d/{$sheetId}/gviz/tq?tqx=out:csv";

// 2. Attempt to fetch the CSV content using file_get_contents
// The '@' silences PHP warnings if the fetch fails
$csvText = @file_get_contents($sheetUrl);

if ($csvText === false) {
    // Error handling if the fetch fails (e.g., network issue or restriction)
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to fetch data from Google Sheets. The server could not reach the external API.']);
    exit;
}

// 3. Set response headers for the browser
// This ensures caching is disabled, similar to the original Node.js logic
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma', 'no-cache');
header('Expires', '0');

// 4. Set content type and send the data back to the frontend
header('Content-Type: text/csv');
http_response_code(200);
echo $csvText;
?>