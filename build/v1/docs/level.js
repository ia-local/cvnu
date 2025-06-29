document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.content-section');
    const profileLink = document.getElementById('profile-link'); // Assuming you have a profile link in the top right

    // Function to show a specific section and hide others
    const showSection = (id) => {
        sections.forEach(section => {
            section.classList.remove('active');
        });
        const activeSection = document.getElementById(id);
        if (activeSection) {
            activeSection.classList.add('active');
            // Re-render chart if it's a section with a chart
            if (id === 'accueil') renderAccueilChart();
            else if (id === 'dashboard') renderDashboardChart();
            else if (id === 'smart-progression-valorisation') renderProgressionSmartChart();
            else if (id === 'vision-globale') renderVisionGlobaleChart();
            else if (id === 'niveau-1-revenu') renderNiveau1Chart();
            else if (id === 'niveau-2-croissance') renderNiveau2Chart();
            else if (id === 'niveau-3-scalabilite') renderNiveau3Chart();
            else if (id === 'optimisation-comptable') renderOptimisationComptableChart();
            // No chart for profile-management yet
        }
    };

    // Function to set active class on nav link
    const setActiveNavLink = (targetSectionId) => {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === targetSectionId) {
                link.classList.add('active');
            }
        });
    };

    // Add click listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor behavior
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
            setActiveNavLink(sectionId);
        });
    });

    // Add click listener for the top-right profile link (if it exists)
    if (profileLink) {
        profileLink.addEventListener('click', (event) => {
            event.preventDefault();
            showSection('profile-management');
            setActiveNavLink('profile-management');
        });
    }

    // Show the first section (Accueil) by default on load and render its chart
    if (sections.length > 0) {
        const firstSectionId = navLinks[0].getAttribute('data-section'); // 'accueil'
        showSection(firstSectionId);
        setActiveNavLink(firstSectionId);
    }

    // --- Chart Rendering Functions (Placeholders) ---
    // You will need to implement the actual chart logic here
    const renderAccueilChart = () => {
        const ctx = document.getElementById('accueilChart');
        if (ctx) {
             // Destroy existing chart if it exists to prevent re-render issues
            if (Chart.getChart(ctx)) {
                Chart.getChart(ctx).destroy();
            }
            new Chart(ctx, {
                type: 'pie', // Example chart type
                data: {
                    labels: ['Valorisation', 'IA au Cœur', 'Économie Circulaire', 'Croissance'],
                    datasets: [{
                        data: [25, 25, 25, 25],
                        backgroundColor: ['#4299e1', '#10b981', '#9f7aea', '#f6e05e'],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Piliers du Projet WALLET PAI'
                        }
                    }
                }
            });
        }
    };

    const renderDashboardChart = () => {
        // Implement dashboard specific charts here
        console.log("Rendering Dashboard Chart...");
    };

    const renderProgressionSmartChart = () => {
        console.log("Rendering SMART Progression Chart...");
    };

    const renderVisionGlobaleChart = () => {
        console.log("Rendering Vision Globale Chart...");
    };

    const renderNiveau1Chart = () => {
        console.log("Rendering Niveau 1 Chart...");
    };

    const renderNiveau2Chart = () => {
        console.log("Rendering Niveau 2 Chart...");
    };

    const renderNiveau3Chart = () => {
        console.log("Rendering Niveau 3 Chart...");
    };

    const renderOptimisationComptableChart = () => {
        console.log("Rendering Optimisation Comptable Chart...");
    };
});