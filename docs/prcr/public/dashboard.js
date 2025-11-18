// dashboard.js (Version Complète et Finale avec Robustesse DOM)

document.addEventListener('DOMContentLoaded', function() {
    // Couleurs de la charte PRCR
    const PRCR_BLUE = '#007BFF';
    const PRCR_GREEN = '#28A745';
    const PRCR_RED = '#DC3545';
    const PRCR_GRAY = '#6c757d';

    const API_BASE_URL = window.location.origin;

    // --- Fonction de Câblage Général (Appel API Unique) ---
    async function initDashboard() {
        try {
            // APPEL UNIQUE À LA ROUTE CORRECTE
            const response = await fetch(`${API_BASE_URL}/api/dashboard-data`); 
            
            if (!response.ok) throw new Error(`Échec de la connexion au Dashboard (${response.status}).`);
            
            const data = await response.json();
            
            // Initialisation des graphiques (Appels sécurisés)
            initRcCurveChart(data.rc_curve);
            initTaxeAiChart(data.finance_summary);
            initCvnuProgressChart(data.cvnu_scores);
            initIseMeterChart(data.ise_metric);
            
            // Transférer les données UTM pour l'indicateur de solvabilité
            loadFinanceStatus(data.accounting); 

        } catch (error) {
            console.error('Erreur Critique lors de l\'initialisation du Dashboard:', error);
            const baseElement = document.getElementById('cvnuFiduciaireBase');
            if (baseElement) baseElement.textContent = "Erreur de connexion UTM. Serveur injoignable.";
            alert(`Erreur de chargement des données : ${error.message}`);
        }
    }

    // --- 1. COURBE RC PROGRESSIF ---
    function initRcCurveChart(rcData) {
        const canvas = document.getElementById('rcCurveChart');
        if (!canvas) return; // <-- VÉRIFICATION DE SÉCURITÉ
        const rcCurveCtx = canvas.getContext('2d'); 

        new Chart(rcCurveCtx, {
            type: 'line',
            data: {
                labels: rcData.map(d => `${d.cvnu}%`),
                datasets: [{
                    label: 'RC (€) en fonction du CVNU Level (%)',
                    data: rcData.map(d => d.rc),
                    borderColor: PRCR_GREEN,
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { title: { display: true, text: 'Revenu Citoyen (€)' }, beginAtZero: true },
                    x: { title: { display: true, text: 'CVNU Level (Progression)' } }
                }
            }
        });
    }

    // --- 2. FINANCEMENT TAXE AI (Diagramme Circulaire Corrigé) ---
    function initTaxeAiChart(financeSummary) {
        const canvas = document.getElementById('taxeAiChart');
        if (!canvas) return; // <-- VÉRIFICATION DE SÉCURITÉ
        const taxeAiCtx = canvas.getContext('2d');
        
        const CVNU_FUNDS = financeSummary.taxe_ai_share_percent; 
        const BUDGET_GENERAL_REMAINING = 100 - CVNU_FUNDS; 
        
        const taxeData = {
            labels: [
                `Fonds CVNU (Affectation Taxe AI: ${CVNU_FUNDS}%)`, 
                `Recettes Générales (Part non affectée: ${BUDGET_GENERAL_REMAINING}%)`
            ],
            datasets: [{
                data: [CVNU_FUNDS, BUDGET_GENERAL_REMAINING], 
                backgroundColor: [PRCR_GREEN, PRCR_BLUE], 
                hoverOffset: 4
            }]
        };

        new Chart(taxeAiCtx, {
            type: 'doughnut',
            data: taxeData,
            options: { 
                responsive: true, 
                plugins: { 
                    legend: { position: 'top' },
                    title: { 
                        display: true, 
                        text: `Répartition des Recettes TVA` 
                    } 
                } 
            }
        });
    }

    // --- 3. PROGRESSION CVNU MOYENNE ---
    function initCvnuProgressChart(cvnuScores) {
        const canvas = document.getElementById('cvnuProgressChart');
        if (!canvas) return; // <-- VÉRIFICATION DE SÉCURITÉ
        const cvnuProgressCtx = canvas.getContext('2d');
        
        new Chart(cvnuProgressCtx, {
            type: 'bar',
            data: {
                labels: cvnuScores.labels,
                datasets: [{
                    label: 'Score Moyen CVNU Secteur DevOps (sur 100)',
                    data: cvnuScores.data,
                    backgroundColor: [PRCR_BLUE, PRCR_GREEN, PRCR_BLUE, PRCR_GRAY]
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }

    // --- 4. INDICE DE SOBRIÉTÉ ÉNERGÉTIQUE (ISE) ---
    function initIseMeterChart(iseMetric) {
        const canvas = document.getElementById('iseMeterChart');
        if (!canvas) return; // <-- VÉRIFICATION DE SÉCURITÉ
        const iseMeterCtx = canvas.getContext('2d');
        
        const iseValue = iseMetric.current_value;
        const statusText = iseValue >= 0.50 ? 'Rang Platine Débloqué' : (iseValue >= 0.30 ? 'Rang Or Débloqué' : 'Rang Bronze');

        new Chart(iseMeterCtx, {
            type: 'polarArea',
            data: {
                labels: iseMetric.labels,
                datasets: [{
                    data: iseMetric.values,
                    backgroundColor: [PRCR_GREEN, PRCR_BLUE, PRCR_RED, PRCR_GRAY],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: `ISE Actuel: ${Math.round(iseValue * 100)}% (${statusText})` }
                }
            }
        });
    }

    // --- 5. INDICATEUR DE SOLVABILITÉ UTM ---
    function loadFinanceStatus(accounting) {
        const baseValue = accounting.CVNU_FIDUCIAIRE_BASE;
        const totalRevenue = accounting.TOTAL_REVENUE;
        const totalExpenses = accounting.TOTAL_EXPENSES;

        const netBenefit = totalRevenue - totalExpenses;
        const marginPercentage = (netBenefit / totalRevenue) * 100;
        const safeMargin = Math.max(0, Math.min(100, marginPercentage));

        const baseElement = document.getElementById('cvnuFiduciaireBase');
        const bar = document.getElementById('solvabilityBar');

        if (baseElement) baseElement.textContent = `${baseValue.toFixed(2)} € (Base)`;
        
        if (bar) {
            bar.style.width = `${safeMargin.toFixed(0)}%`;
            bar.textContent = `${safeMargin.toFixed(0)}% de Marge Nette (Bénéfice UTMi)`;
            bar.className = `progress-bar ${safeMargin < 10 ? 'bg-danger' : 'bg-success'}`;
        }
    }


    // Démarrage de l'application
    initDashboard();
});