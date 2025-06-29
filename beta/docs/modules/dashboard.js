// docs/modules/dashboard.js

// getApiBaseUrl et showStatusMessage sont maintenant importés directement depuis app.js
import { getApiBaseUrl, showStatusMessage } from '../app.js';

let totalUtmiEl, totalEstimatedCostUSDEl, totalEstimatedCostEUREl, totalTaxeIAAmountEl,
    totalInteractionCountEl, averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl,
    utmiByTypeEl, utmiByModelEl, utmiPerCostRatioByModelEl, utmiByCognitiveAxisEl,
    thematicUtmiMarketingEl, thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl,
    thematicUtmiEducationTrainingEl, thematicUtmiProfessionalDevelopmentEl,
    mostValuableTopicsEl, mostCommonActivitiesEl, exchangeRatesEl, refreshDashboardBtn;


export function initDashboardPage() {
    // Initialiser les éléments DOM du dashboard
    totalUtmiEl = document.getElementById('totalUtmi');
    totalEstimatedCostUSDEl = document.getElementById('totalEstimatedCostUSD');
    totalEstimatedCostEUREl = document.getElementById('totalEstimatedCostEUR');
    totalTaxeIAAmountEl = document.getElementById('totalTaxeIAAmount');
    totalInteractionCountEl = document.getElementById('totalInteractionCount');
    averageUtmiPerInteractionEl = document.getElementById('averageUtmiPerInteraction');
    totalUtmiPerCostRatioEl = document.getElementById('totalUtmiPerCostRatio');
    utmiByTypeEl = document.getElementById('utmiByType');
    utmiByModelEl = document.getElementById('utmiByModel');
    utmiPerCostRatioByModelEl = document.getElementById('utmiPerCostRatioByModel');
    utmiByCognitiveAxisEl = document.getElementById('utmiByCognitiveAxis');
    thematicUtmiMarketingEl = document.getElementById('thematicUtmiMarketing');
    thematicUtmiAffiliationEl = document.getElementById('thematicUtmiAffiliation');
    thematicUtmiFiscalEconomicEl = document.getElementById('thematicUtmiFiscalEconomic');
    thematicUtmiEducationTrainingEl = document.getElementById('thematicUtmiEducationTraining');
    thematicUtmiProfessionalDevelopmentEl = document.getElementById('thematicUtmiProfessionalDevelopment');
    mostValuableTopicsEl = document.getElementById('mostValuableTopics');
    mostCommonActivitiesEl = document.getElementById('mostCommonActivities');
    exchangeRatesEl = document.getElementById('exchangeRates');
    refreshDashboardBtn = document.getElementById('refreshDashboardBtn');

    if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', fetchDashboardInsights);
    }
}

/**
 * Récupère et affiche les insights du tableau de bord.
 */
export async function fetchDashboardInsights() {
    showStatusMessage('Chargement du Dashboard...', 'info');
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/dashboard-insights`);
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("Trop de requêtes. Veuillez patienter un instant avant de réessayer.");
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const insights = await response.json();

        const updateElementText = (element, value, suffix = '') => {
            if (element) element.textContent = `${value}${suffix}`;
        };

        updateElementText(totalUtmiEl, (insights.totalUtmi ?? 0).toFixed(2));
        updateElementText(totalEstimatedCostUSDEl, (insights.totalEstimatedCostUSD ?? 0).toFixed(2));
        updateElementText(totalEstimatedCostEUREl, (insights.totalEstimatedCostEUR ?? 0).toFixed(2));
        updateElementText(totalTaxeIAAmountEl, (insights.totalTaxeIAAmount ?? 0).toFixed(2));
        updateElementText(totalInteractionCountEl, insights.totalInteractionCount ?? 0);
        updateElementText(averageUtmiPerInteractionEl, (insights.averageUtmiPerInteraction ?? 0).toFixed(2));
        updateElementText(totalUtmiPerCostRatioEl, (insights.totalUtmiPerCostRatio ?? 0).toFixed(2));

        const renderList = (element, data, itemFormatter) => {
            if (!element) return;
            element.innerHTML = data.map(item => `<li>${itemFormatter(item)}</li>`).join('');
        };
        const renderObjectList = (element, data, itemFormatter) => {
            if (!element) return;
            element.innerHTML = Object.entries(data).map(([key, value]) => `<li>${itemFormatter(key, value)}</li>`).join('');
        };

        renderList(utmiByTypeEl, insights.utmiByType || [], item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} EUR`);
        renderList(utmiByModelEl, insights.utmiByModel || [], item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} EUR`);
        renderObjectList(utmiPerCostRatioByModelEl, insights.utmiPerCostRatioByModel || {}, (key, value) => `<strong>${key}:</strong> ${(value ?? 0).toFixed(2)}`);
        renderList(utmiByCognitiveAxisEl, insights.utmiByCognitiveAxis || [], item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} EUR`);

        updateElementText(thematicUtmiMarketingEl, (insights.thematicUtmi?.marketing ?? 0).toFixed(2));
        updateElementText(thematicUtmiAffiliationEl, (insights.thematicUtmi?.affiliation ?? 0).toFixed(2));
        updateElementText(thematicUtmiFiscalEconomicEl, (insights.thematicUtmi?.fiscalEconomic ?? 0).toFixed(2));
        updateElementText(thematicUtmiEducationTrainingEl, (insights.thematicUtmi?.educationTraining ?? 0).toFixed(2));
        updateElementText(thematicUtmiProfessionalDevelopmentEl, (insights.thematicUtmi?.professionalDevelopment ?? 0).toFixed(2));

        renderList(mostValuableTopicsEl, insights.mostValuableTopics || [], item => `${item.name} (${(item.utmi ?? 0).toFixed(2)} EUR)`);
        renderList(mostCommonActivitiesEl, insights.mostCommonActivities || [], item => `${item.name} (${item.count ?? 0} fois)`);
        renderObjectList(exchangeRatesEl, insights.exchangeRates || {}, (key, value) => `1 EUR = ${(value ?? 0)} ${key}`);

        // Update User Profile section (simplified for now, to be moved to user_profile.js later)
        const userIdDisplay = document.getElementById('userIdDisplay');
        const cvnuAddressDisplay = document.getElementById('cvnuAddressDisplay');
        if (userIdDisplay) userIdDisplay.textContent = 'User_CVNU_ID_12345'; // Placeholder
        if (cvnuAddressDisplay) cvnuAddressDisplay.textContent = '0x123...abc'; // Placeholder for blockchain address

        showStatusMessage('Dashboard actualisé.', 'success');

    } catch (error) {
        console.error('Erreur lors du chargement des insights du dashboard:', error);
        showStatusMessage('Erreur lors du chargement du dashboard: ' + error.message, 'error');
        const elementsToUpdate = [
            totalUtmiEl, totalEstimatedCostUSDEl, totalEstimatedCostEUREl, totalTaxeIAAmountEl,
            totalInteractionCountEl, averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl,
            thematicUtmiMarketingEl, thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl,
            thematicUtmiEducationTrainingEl, thematicUtmiProfessionalDevelopmentEl
        ];
        elementsToUpdate.forEach(el => { if(el) el.textContent = 'Erreur...'; });
        const listElementsToUpdate = [
            utmiByTypeEl, utmiByModelEl, utmiPerCostRatioByModelEl, utmiByCognitiveAxisEl,
            mostValuableTopicsEl, mostCommonActivitiesEl, exchangeRatesEl
        ];
        listElementsToUpdate.forEach(el => { if(el) el.innerHTML = '<li>Erreur de chargement...</li>'; });
    }
}

// Render chart functionality (could be in a separate chart module if complex)
function renderDashboardChart() {
    const ctx = document.getElementById('dashboardChart');
    if (ctx) {
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Total UTMi', 'Coût USD', 'Coût EUR', 'Taxe IA'],
                datasets: [{
                    label: 'Values',
                    data: [
                        parseFloat(totalUtmiEl.textContent),
                        parseFloat(totalEstimatedCostUSDEl.textContent),
                        parseFloat(totalEstimatedCostEUREl.textContent),
                        parseFloat(totalTaxeIAAmountEl.textContent)
                    ],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 99, 132, 0.6)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Aperçu Financier Principal'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}
