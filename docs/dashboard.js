// public/js/dashboard.js

import { api } from './apiService.js';
import { showStatusMessage } from './utils.js';

// --- Éléments du DOM pour le Dashboard UTMi ---
let totalUtmiEl, totalEstimatedCostUSDEl, totalEstimatedCostEUREl, totalInteractionCountEl,
    averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl, utmiByTypeEl, utmiByModelEl,
    utmiPerCostRatioByModelEl, utmiByCognitiveAxisEl, thematicUtmiMarketingEl,
    thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl, mostValuableTopicsEl,
    mostCommonActivitiesEl, exchangeRatesEl, refreshDashboardBtn;

/**
 * Initialise les références aux éléments DOM et les écouteurs d'événements pour le dashboard.
 */
export function initDashboardDomElements() {
    totalUtmiEl = document.getElementById('totalUtmi');
    totalEstimatedCostUSDEl = document.getElementById('totalEstimatedCostUSD');
    totalEstimatedCostEUREl = document.getElementById('totalEstimatedCostEUR');
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
        const insights = await api.fetchDashboardInsights();

        // Mettre à jour les éléments du DOM avec les données du dashboard
        if (totalUtmiEl) totalUtmiEl.textContent = `${(insights.totalUtmi ?? 0).toFixed(2)}`;
        if (totalEstimatedCostUSDEl) totalEstimatedCostUSDEl.textContent = `${(insights.totalEstimatedCostUSD ?? 0).toFixed(2)}`;
        if (totalEstimatedCostEUREl) totalEstimatedCostEUREl.textContent = `${(insights.totalEstimatedCostEUR ?? 0).toFixed(2)}`;
        if (totalInteractionCountEl) totalInteractionCountEl.textContent = insights.totalInteractions ?? 0; // Corrected from totalInteractionCount to totalInteractions
        if (averageUtmiPerInteractionEl) averageUtmiPerInteractionEl.textContent = `${(insights.averageUtmiPerInteraction ?? 0).toFixed(2)}`;
        if (totalUtmiPerCostRatioEl) totalUtmiPerCostRatioEl.textContent = `${(insights.totalUtmiPerCostRatio ?? 0).toFixed(2)}`;

        // Helper to render list items
        const renderList = (element, data, itemFormatter) => {
            if (!element) return;
            // Ensure data is an array before mapping
            const dataArray = Array.isArray(data) ? data : Object.entries(data).map(([name, value]) => ({ name, utmi: value }));
            element.innerHTML = dataArray.map(item => `<li>${itemFormatter(item)}</li>`).join('');
        };
        const renderObjectList = (element, data, itemFormatter) => {
            if (!element) return;
            element.innerHTML = Object.entries(data).map(([key, value]) => `<li>${itemFormatter(key, value)}</li>`).join('');
        };

        renderList(utmiByTypeEl, insights.utmiByType || {}, item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} UTMi`);
        renderList(utmiByModelEl, insights.utmiByModel || {}, item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} UTMi`);
        renderObjectList(utmiPerCostRatioByModelEl, insights.utmiPerCostRatioByModel || {}, (key, value) => `<strong>${key}:</strong> ${(value ?? 0).toFixed(2)}`);
        renderList(utmiByCognitiveAxisEl, insights.utmiByCognitiveAxis || {}, item => `<strong>${item.name}:</strong> ${(item.utmi ?? 0).toFixed(2)} UTMi`);

        if (thematicUtmiMarketingEl) thematicUtmiMarketingEl.textContent = (insights.thematicUtmi?.marketing ?? 0).toFixed(2);
        if (thematicUtmiAffiliationEl) thematicUtmiAffiliationEl.textContent = (insights.thematicUtmi?.affiliation ?? 0).toFixed(2);
        if (thematicUtmiFiscalEconomicEl) thematicUtmiFiscalEconomicEl.textContent = (insights.thematicUtmi?.fiscalEconomic ?? 0).toFixed(2);

        renderList(mostValuableTopicsEl, insights.mostValuableTopics || [], item => `${item.name} (${(item.utmi ?? 0).toFixed(2)} UTMi)`);
        renderList(mostCommonActivitiesEl, insights.mostCommonActivities || [], item => `${item.name} (${item.count ?? 0} fois)`);
        renderObjectList(exchangeRatesEl, insights.currentExchangeRates || {}, (key, value) => `1 EUR = ${(value ?? 0)} ${key}`); // Assuming rates are 1 EUR = X CURRENCY

        // Update User Profile section (simplified for now)
        const userIdDisplay = document.getElementById('userIdDisplay');
        const cvnuAddressDisplay = document.getElementById('cvnuAddressDisplay');
        if (userIdDisplay) userIdDisplay.textContent = 'User_CVNU_ID_12345'; // Placeholder
        if (cvnuAddressDisplay) cvnuAddressDisplay.textContent = '0x123...abc'; // Placeholder for blockchain address

        showStatusMessage('Dashboard actualisé.', 'success');
        renderDashboardChart(insights); // Render chart with new insights

    } catch (error) {
        console.error('Erreur lors du chargement des insights du dashboard:', error);
        showStatusMessage('Erreur lors du chargement du dashboard: ' + error.message, 'error');
        // Fallback text in case of error
        const elementsToUpdate = [
            totalUtmiEl, totalEstimatedCostUSDEl, totalEstimatedCostEUREl, totalInteractionCountEl,
            averageUtmiPerInteractionEl, totalUtmiPerCostRatioEl, thematicUtmiMarketingEl,
            thematicUtmiAffiliationEl, thematicUtmiFiscalEconomicEl
        ];
        elementsToUpdate.forEach(el => { if(el) el.textContent = 'Erreur...'; });
        const listElementsToUpdate = [
            utmiByTypeEl, utmiByModelEl, utmiPerCostRatioByModelEl, utmiByCognitiveAxisEl,
            mostValuableTopicsEl, mostCommonActivitiesEl, exchangeRatesEl
        ];
        listElementsToUpdate.forEach(el => { if(el) el.innerHTML = '<li>Erreur de chargement...</li>'; });
    }
}

/**
 * Rend le graphique du tableau de bord en utilisant Chart.js.
 * @param {object} insights - Les données d'insights pour le graphique.
 */
export function renderDashboardChart(insights) {
    const ctx = document.getElementById('dashboardChart');
    if (ctx) {
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy(); // Détruire l'ancien graphique s'il existe
        }
        // Example: a simple bar chart
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Total UTMi', 'Revenu Total', 'Coût Estimé (USD)'],
                datasets: [{
                    label: 'Valeurs',
                    data: [
                        (insights.totalUtmi ?? 0),
                        (insights.totalGeneratedRevenue ?? 0), // Assuming this is in EUR or target currency
                        (insights.totalEstimatedCostUSD ?? 0)
                    ],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.6)', // Blue for UTMi
                        'rgba(75, 192, 192, 0.6)', // Green for Revenue
                        'rgba(255, 159, 64, 0.6)'  // Orange for USD Cost
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 159, 64, 1)'
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
