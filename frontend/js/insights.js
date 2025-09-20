document.addEventListener('DOMContentLoaded', () => {
    const sheetUrl = '/api/get-sheet-data.php'; // <--- ONLY CHANGE IS HERE
    const questionGrid = document.getElementById('question-grid');
    const locationFilter = document.getElementById('location-filter');
    const genderFilter = document.getElementById('gender-filter');
    const statusFilter = document.getElementById('status-filter');
    const ageFilter = document.getElementById('age-filter');

    let masterData = [];
    let currentFilters = {
        location: 'all',
        gender: 'all',
        maritalStatus: 'all',
        ageGroup: 'all'
    };

    // --- UTILITY FUNCTIONS ---
    function parseCSV(csvText) {
        const rows = csvText.trim().split('\n');
        const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/"/g, ''));
            const entry = {};
            for (let j = 0; j < headers.length; j++) {
                entry[headers[j]] = values[j];
            }
            data.push(entry);
        }
        return data;
    }

    function countResponses(dataArray) {
        const counts = {};
        dataArray.forEach(row => {
            const response = row.ResponseValue;
            counts[response] = (counts[response] || 0) + 1;
        });
        return counts;
    }
    
    // --- RENDERING FUNCTIONS ---
    function renderQuestionGrid(data) {
        if (!questionGrid) return;
        questionGrid.innerHTML = '';

        const questions = data.reduce((acc, row) => {
            (acc[row.QuestionID] = acc[row.QuestionID] || []).push(row);
            return acc;
        }, {});

        if (Object.keys(questions).length === 0) {
            questionGrid.innerHTML = '<p class="loading-text">No insights found for the selected filters.</p>';
            return;
        }

        let cardIndex = 0;
        for (const questionId in questions) {
            const questionData = questions[questionId];
            const card = createQuestionCard(questionId, questionData);
            card.style.transitionDelay = `${cardIndex * 50}ms`;
            questionGrid.appendChild(card);
            setTimeout(() => card.classList.add('visible'), 50);
            cardIndex++;
        }
    }

    function createQuestionCard(questionId, data) {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.dataset.questionId = questionId;
        const responseCounts = countResponses(data);
        const topResponse = Object.keys(responseCounts).sort((a,b) => responseCounts[b] - responseCounts[a])[0];

        card.innerHTML = `
            <div class="card-header">
                <h3>${data[0].QuestionText}</h3>
                <span class="expand-icon">+</span>
            </div>
            <div class="card-preview">
                Top Answer: <span class="top-answer">${topResponse || 'N/A'}</span>
            </div>
            <div class="card-details"></div>
        `;

        card.addEventListener('click', () => handleCardExpand(card, data));
        return card;
    }
    
    function renderMirroredBarChart(container, data) {
        const maleResponses = data.filter(r => r.Gender === 'Male');
        const femaleResponses = data.filter(r => r.Gender === 'Female');
        const maleCounts = countResponses(maleResponses);
        const femaleCounts = countResponses(femaleResponses);
        const combinedTotals = {};
        const allKeys = [...new Set([...Object.keys(maleCounts), ...Object.keys(femaleCounts)])];
        allKeys.forEach(key => {
            combinedTotals[key] = (maleCounts[key] || 0) + (femaleCounts[key] || 0);
        });
        const top5Responses = Object.keys(combinedTotals).sort((a, b) => combinedTotals[b] - combinedTotals[a]).slice(0, 5);

        let chartHTML = `
            <div class="chart-row chart-headers">
                <div>He/Him</div>
                <div>Response</div>
                <div>She/Her</div>
            </div>
        `;
        top5Responses.forEach(response => {
            const malePercent = maleResponses.length > 0 ? ((maleCounts[response] || 0) / maleResponses.length) * 100 : 0;
            const femalePercent = femaleResponses.length > 0 ? ((femaleCounts[response] || 0) / femaleResponses.length) * 100 : 0;
            chartHTML += `
                <div class="chart-row">
                    <div class="chart-bar-wrapper him">
                        <div class="chart-bar-container"><div class="chart-bar bar-him" style="width: ${malePercent}%"></div></div>
                        <span class="bar-percentage">${Math.round(malePercent)}%</span>
                    </div>
                    <div class="bar-label">${response}</div>
                    <div class="chart-bar-wrapper her">
                        <span class="bar-percentage">${Math.round(femalePercent)}%</span>
                        <div class="chart-bar-container"><div class="chart-bar bar-her" style="width: ${femalePercent}%"></div></div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = `<div class="chart-container">${chartHTML}</div>`;
    }

    // --- EVENT HANDLING & FILTER LOGIC ---
    function handleCardExpand(cardElement, data) {
        const isExpanded = cardElement.classList.contains('expanded');
        document.querySelectorAll('.question-card.expanded').forEach(card => {
            if (card !== cardElement) {
                card.classList.remove('expanded');
                card.querySelector('.expand-icon').textContent = '+';
            }
        });
        
        cardElement.classList.toggle('expanded');
        const icon = cardElement.querySelector('.expand-icon');
        icon.textContent = cardElement.classList.contains('expanded') ? '×' : '+';

        if (cardElement.classList.contains('expanded')) {
            const detailsContainer = cardElement.querySelector('.card-details');
            if (detailsContainer.innerHTML.trim() === '') {
                renderMirroredBarChart(detailsContainer, data);
            }
        }
    }

    function applyFilters() {
        let filteredData = [...masterData];
        if (currentFilters.location !== 'all') {
            filteredData = filteredData.filter(row => row.Location === currentFilters.location);
        }
        if (currentFilters.gender !== 'all') {
            filteredData = filteredData.filter(row => row.Gender === currentFilters.gender);
        }
        if (currentFilters.maritalStatus !== 'all') {
            filteredData = filteredData.filter(row => row.MaritalStatus === currentFilters.maritalStatus);
        }
        if (currentFilters.ageGroup !== 'all') {
            const [min, max] = currentFilters.ageGroup.replace('+', '-999').split('-').map(Number);
            filteredData = filteredData.filter(row => {
                const age = Number(row.Age);
                return age >= min && age <= max;
            });
        }
        renderQuestionGrid(filteredData);
    }
    
    function populateFilters(data) {
        const populateSelect = (element, key) => {
            if (!element) return;
            const values = [...new Set(data.map(item => item[key]).filter(Boolean))];
            values.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                element.appendChild(option);
            });
        };
        
        populateSelect(locationFilter, 'Location');
        populateSelect(genderFilter, 'Gender');
        populateSelect(statusFilter, 'MaritalStatus');
    }

    // --- INITIALIZATION ---
    async function init() {
        // NEW: Check for URL parameters before doing anything else
        const urlParams = new URLSearchParams(window.location.search);
        const genderFromURL = urlParams.get('gender');
        if (genderFromURL) {
            currentFilters.gender = genderFromURL;
        }

        try {
            const response = await fetch(sheetUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const csvText = await response.text();
            masterData = parseCSV(csvText);
            
            populateFilters(masterData);

            // NEW: Set the dropdown value if it came from the URL
            if (genderFromURL) {
                genderFilter.value = genderFromURL;
            }
            
            // Apply initial filters (which may include the one from the URL)
            applyFilters();

            // Add event listeners to all filters
            locationFilter.addEventListener('change', (e) => {
                currentFilters.location = e.target.value;
                applyFilters();
            });
            genderFilter.addEventListener('change', (e) => {
                currentFilters.gender = e.target.value;
                applyFilters();
            });
            statusFilter.addEventListener('change', (e) => {
                currentFilters.maritalStatus = e.target.value;
                applyFilters();
            });
            ageFilter.addEventListener('change', (e) => {
                currentFilters.ageGroup = e.target.value;
                applyFilters();
            });

        } catch (error) {
            console.error('Error fetching or processing sheet data:', error);
            if(questionGrid) questionGrid.innerHTML = '<p class="loading-text">Could not load insights.</p>';
        }
    }

    init();
});