document.addEventListener('DOMContentLoaded', () => {
    // ---
    // SECTIONS 1-5 are the same as before
    // ---

    // 1. Transparent Header on Scroll
    const header = document.querySelector('.page-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Scroll Animation Observer
    const animatedElements = document.querySelectorAll('.reveal-on-scroll, .animate-up');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 
    };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);
    animatedElements.forEach(el => observer.observe(el));

    // 3. DYNAMIC TYPING ANIMATION FOR HERO TITLE
    const typingElement = document.querySelector('.hero-title');
    const questions = [
        "WHAT DO WE TRULY WANT?",
        "WHAT ARE WE AFRAID TO ASK?",
        "WHAT DO WE MISUNDERSTAND?",
    ];
    let questionIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeAnimation() {
        if (!typingElement) return;
        const currentQuestion = questions[questionIndex];
        let displayText = '';
        if (isDeleting) {
            displayText = currentQuestion.substring(0, charIndex - 1);
            charIndex--;
        } else {
            displayText = currentQuestion.substring(0, charIndex + 1);
            charIndex++;
        }
        typingElement.textContent = displayText;
        let typeSpeed = isDeleting ? 75 : 150;
        if (!isDeleting && charIndex === currentQuestion.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            questionIndex = (questionIndex + 1) % questions.length;
        }
        setTimeout(typeAnimation, typeSpeed);
    }
    typeAnimation();

    // 4. MULTI-STEP FORM LOGIC
    const formStep1 = document.getElementById('form-step-1');
    const formStep2 = document.getElementById('form-step-2');
    const nextButton = document.getElementById('next-step-btn');
    const questionTextarea = formStep1.querySelector('textarea');

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (questionTextarea.value.trim() !== '') {
                formStep1.classList.add('fade-out');
                setTimeout(() => {
                    formStep1.classList.remove('active');
                    formStep2.classList.add('active');
                }, 400);
            } else {
                questionTextarea.style.borderColor = 'red';
                setTimeout(() => {
                    questionTextarea.style.borderColor = '';
                }, 1500);
            }
        });
    }

    // 5. GOOGLE SHEET DATA & INTERACTIVE CHART LOGIC
    const sheetUrl = '/api/get-sheet-data';
    const chartContainer = document.getElementById('chart-container');
    const chartTitle = document.getElementById('chart-title');
    const commonGroundToggle = document.getElementById('common-ground-checkbox');
    const locationFilter = document.getElementById('location');
    const ageFilterButtons = document.querySelectorAll('.filter-group .filter-btn');

    // --- State Management ---
    let masterData = []; // To store the full dataset once fetched
    let currentFilters = {
        location: 'all',
        ageGroup: 'all'
    };

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

    // --- Chart Drawing Function ---
    function displayMirroredBarChart(data) {
        if (!chartContainer) return;

        const questionData = data.filter(row => row.QuestionID === 'Q1');
        if (chartTitle) chartTitle.textContent = questionData[0]?.QuestionText || "What is the most important quality in a partner?";

        chartContainer.innerHTML = ''; // Clear previous chart or loading text

        if (questionData.length === 0) {
            chartContainer.innerHTML = '<p class="loading-text">No data available for the selected filters.</p>';
            return;
        }

        const maleResponses = questionData.filter(r => r.Gender === 'Male');
        const femaleResponses = questionData.filter(r => r.Gender === 'Female');
        const maleCounts = countResponses(maleResponses);
        const femaleCounts = countResponses(femaleResponses);
        const combinedTotals = {};
        const allKeys = [...new Set([...Object.keys(maleCounts), ...Object.keys(femaleCounts)])];
        allKeys.forEach(key => {
            combinedTotals[key] = (maleCounts[key] || 0) + (femaleCounts[key] || 0);
        });
        
        const top5Responses = Object.keys(combinedTotals).sort((a, b) => combinedTotals[b] - combinedTotals[a]).slice(0, 5);

        const headerRow = document.createElement('div');
        headerRow.className = 'chart-row chart-headers';
        headerRow.innerHTML = `
            <div>He/Him</div>
            <div>Response</div>
            <div>She/Her</div>
        `;
        chartContainer.appendChild(headerRow);

        top5Responses.forEach(response => {
            const maleCount = maleCounts[response] || 0;
            const femaleCount = femaleCounts[response] || 0;
            const malePercent = maleResponses.length > 0 ? (maleCount / maleResponses.length) * 100 : 0;
            const femalePercent = femaleResponses.length > 0 ? (femaleCount / femaleResponses.length) * 100 : 0;
            const commonGroundPercent = Math.min(malePercent, femalePercent);

            const row = document.createElement('div');
            row.className = 'chart-row animate-up';
            row.innerHTML = `
                <div class="chart-bar-wrapper">
                    <div class="chart-bar-container">
                        <div class="chart-bar bar-him" data-full-width="${malePercent}" data-common-width="${commonGroundPercent}"></div>
                    </div>
                    <span class="bar-percentage">${Math.round(malePercent)}%</span>
                </div>
                <div class="bar-label">${response}</div>
                <div class="chart-bar-wrapper">
                    <span class="bar-percentage">${Math.round(femalePercent)}%</span>
                    <div class="chart-bar-container">
                        <div class="chart-bar bar-her" data-full-width="${femalePercent}" data-common-width="${commonGroundPercent}"></div>
                    </div>
                </div>
            `;
            chartContainer.appendChild(row);

            setTimeout(() => {
                const bars = row.querySelectorAll('.chart-bar');
                bars.forEach(bar => bar.style.width = `${bar.dataset.fullWidth}%`);
            }, 100);
        });
        
        const newAnimatedElements = chartContainer.querySelectorAll('.animate-up');
        newAnimatedElements.forEach(el => observer.observe(el));
    }

    function countResponses(dataArray) {
        const counts = {};
        dataArray.forEach(row => {
            const response = row.ResponseValue;
            counts[response] = (counts[response] || 0) + 1;
        });
        return counts;
    }
    
    // --- New Filter Logic ---
    function applyFiltersAndRedraw() {
        let filteredData = [...masterData];

        // Location Filter
        if (currentFilters.location !== 'all') {
            filteredData = filteredData.filter(row => row.Location === currentFilters.location);
        }

        // Age Group Filter
        if (currentFilters.ageGroup !== 'all') {
            const [min, max] = currentFilters.ageGroup.replace('+', '-999').split('-').map(Number);
            filteredData = filteredData.filter(row => {
                const age = Number(row.Age);
                return age >= min && age <= max;
            });
        }
        
        // Redraw the chart with the newly filtered data
        displayMirroredBarChart(filteredData);
    }
    
    function populateLocationFilter(data) {
        if (!locationFilter) return;
        const locations = [...new Set(data.map(item => item.Location).filter(Boolean))];
        
        // Clear existing options except for "All"
        locationFilter.innerHTML = '<option value="all">All</option>';

        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }

    // --- Event Listeners for Filters ---
    if (locationFilter) {
        locationFilter.addEventListener('change', (e) => {
            currentFilters.location = e.target.value;
            applyFiltersAndRedraw();
        });
    }

    ageFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // UI update for active class
            ageFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Logic update
            currentFilters.ageGroup = button.textContent;
            applyFiltersAndRedraw();
        });
    });

    if (commonGroundToggle) {
        commonGroundToggle.addEventListener('change', () => {
            chartContainer.classList.toggle('common-ground-active');
            const bars = document.querySelectorAll('.chart-bar');
            bars.forEach(bar => {
                const width = commonGroundToggle.checked ? bar.dataset.commonWidth : bar.dataset.fullWidth;
                bar.style.width = `${width}%`;
            });
        });
    }

    // --- Initial Data Fetch ---
    fetch(sheetUrl)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(csvText => {
            masterData = parseCSV(csvText);
            populateLocationFilter(masterData);
            displayMirroredBarChart(masterData); // Initial display with all data
        })
        .catch(error => {
            console.error('Error fetching sheet data:', error);
            if(chartContainer) {
                chartContainer.innerHTML = '<p class="loading-text">Could not load insights.</p>';
            }
        });
});