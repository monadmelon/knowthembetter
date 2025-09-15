document.addEventListener('DOMContentLoaded', () => {

    // 1. Transparent Header on Scroll & Scroll Indicator Hiding
    const header = document.querySelector('.page-header');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        if (scrollIndicator) {
            if (window.scrollY > 20) {
                scrollIndicator.classList.add('hidden');
            } else {
                scrollIndicator.classList.remove('hidden');
            }
        }
        if (mobileNavToggle) {
            if (window.scrollY > window.innerHeight / 2) {
                mobileNavToggle.classList.add('hidden');
            } else {
                mobileNavToggle.classList.remove('hidden');
            }
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
    if (typingElement) {
        const questions = [
            "WHAT DO WE TRULY WANT?",
            "WHAT ARE WE AFRAID TO ASK?",
            "WHAT DO WE MISUNDERSTAND?",
        ];
        let questionIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function typeAnimation() {
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
    }

    // 4. MULTI-STEP FORM LOGIC
    const formStep1 = document.getElementById('form-step-1');
    if (formStep1) {
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
    }


    // 5. GOOGLE SHEET DATA FOR TRENDING INSIGHT
    const trendingQuestionTitle = document.getElementById('trending-question-title');
    if (trendingQuestionTitle) {
        const sheetUrl = '/api/get-sheet-data';
        const trendingHeadline = document.getElementById('trending-headline');
        const trendingInsightContainer = document.querySelector('.insight-stat');

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
        
        function generateInsights(data) {
            const headlines = ["Today's Insight", "This Week's Finding", "This Month's Trending Topic"];
            const insights = [];
            const questionData = data.filter(row => row.QuestionID === 'Q1');
            const responseCounts = {};
            questionData.forEach(row => {
                const response = row.ResponseValue;
                responseCounts[response] = (responseCounts[response] || 0) + 1;
            });
            const sortedResponses = Object.entries(responseCounts).sort(([,a],[,b]) => b-a);
            if (sortedResponses.length > 0) {
                const topResponse = sortedResponses[0][0];
                const topResponseCount = sortedResponses[0][1];
                const percentage = Math.round((topResponseCount / questionData.length) * 100);
                insights.push({
                    headline: headlines[0],
                    questionText: questionData[0]?.QuestionText,
                    statNumber: `${percentage}%`,
                    statCaption: `of all respondents chose '${topResponse}' as the most important quality in a partner.`
                });
            }
            
            const femaleResponses = questionData.filter(r => r.Gender === 'Female');
            if (femaleResponses.length > 0) {
                 const femaleCounts = {};
                 femaleResponses.forEach(row => {
                    const response = row.ResponseValue;
                    femaleCounts[response] = (femaleCounts[response] || 0) + 1;
                });
                const topFemaleResponse = Object.entries(femaleCounts).sort(([,a],[,b]) => b-a)[0][0];
                insights.push({
                    headline: headlines[1],
                    questionText: questionData[0]?.QuestionText,
                    statNumber: `'${topFemaleResponse}'`,
                    statCaption: `was the most frequent answer among female respondents.`
                });
            }
            
            const maleResponses = questionData.filter(r => r.Gender === 'Male');
            if (maleResponses.length > 0) {
                 const maleCounts = {};
                 maleResponses.forEach(row => {
                    const response = row.ResponseValue;
                    maleCounts[response] = (maleCounts[response] || 0) + 1;
                });
                const topMaleResponse = Object.entries(maleCounts).sort(([,a],[,b]) => b-a)[0][0];
                insights.push({
                    headline: headlines[2],
                    questionText: questionData[0]?.QuestionText,
                    statNumber: `'${topMaleResponse}'`,
                    statCaption: `was the most frequent answer among male respondents.`
                });
            }

            return insights;
        }

        function cycleInsights(insights) {
            if (!trendingHeadline || insights.length === 0) return;
            let currentIndex = 0;
            const updateDOM = () => {
                const insight = insights[currentIndex];
                trendingHeadline.textContent = insight.headline;
                trendingQuestionTitle.textContent = insight.questionText;
                trendingInsightContainer.querySelector('#trending-stat-number').textContent = insight.statNumber;
                trendingInsightContainer.querySelector('#trending-stat-caption').textContent = insight.statCaption;
            };
            updateDOM();
            setInterval(() => {
                trendingHeadline.classList.add('fade-out');
                trendingQuestionTitle.classList.add('fade-out');
                trendingInsightContainer.classList.add('fade-out');
                setTimeout(() => {
                    currentIndex = (currentIndex + 1) % insights.length;
                    updateDOM();
                    trendingHeadline.classList.remove('fade-out');
                    trendingQuestionTitle.classList.remove('fade-out');
                    trendingInsightContainer.classList.remove('fade-out');
                }, 500);
            }, 7000);
        }

        fetch(sheetUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(csvText => {
                const data = parseCSV(csvText);
                const insights = generateInsights(data);
                if (insights.length > 0) {
                    cycleInsights(insights);
                }
            })
            .catch(error => {
                console.error('Error fetching sheet data:', error);
                if(trendingQuestionTitle) {
                    trendingQuestionTitle.textContent = 'Could not load insights at this time.';
                }
            });
    }

    // 6. MOBILE NAVIGATION LOGIC
    const mainNav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.main-nav a');

    function toggleMenu() {
        mainNav.classList.toggle('mobile-nav-active');
        mobileNavToggle.classList.toggle('mobile-nav-active');
    }

    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', toggleMenu);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav.classList.contains('mobile-nav-active')) {
                toggleMenu();
            }
        });
    });

    // 7. === NEW: FORM SUBMISSION LOGIC ===
    const questionForm = document.querySelector('.question-form');
    if (questionForm) {
        const scriptURL = 'https://script.google.com/macros/s/AKfycbwyJvcRwSCoF6a7-o3LZ-Bi21SvAY3w7kYB0IfpqvRppzwVOOKQb37dvN3qro60lFFtpg/exec';
        const formContainer = document.querySelector('#submit-question .panel-content');

        questionForm.addEventListener('submit', e => {
            e.preventDefault();
            const submitButton = questionForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            const formData = new FormData(questionForm);
            const data = Object.fromEntries(formData);

            fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors', // Important for this type of request
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                // Since it's a no-cors request, we can't read the response, but we assume success
                formContainer.innerHTML = `
                    <h2>Thank You!</h2>
                    <p class="sub-headline">Your question has been submitted anonymously. Your curiosity helps build a more understanding world.</p>
                `;
            })
            .catch(error => {
                console.error('Error!', error.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Anonymously';
                // You could add an error message to the user here
                alert("There was an error submitting your question. Please try again.");
            });
        });
    }
});