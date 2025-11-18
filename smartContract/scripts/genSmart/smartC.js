const fs = require('fs');

// Charger le fichier phase.json
let phases = require('./phaseSmart.json');

// Fonction pour afficher les objectifs SMART pour chaque phase
function displayPhaseObjectives(phase) {
  console.log(`\n---- Phase ${phase.id}: ${phase.title} ----`);
  console.log(`Description: ${phase.description}`);
  console.log("Objectifs SMART:");
  console.log(`- Spécifique: ${phase.objectives.specific}`);
  console.log(`- Mesurable: ${phase.objectives.measurable}`);
  console.log(`- Atteignable: ${phase.objectives.attainable}`);
  console.log(`- Réaliste: ${phase.objectives.realistic}`);
  console.log(`- Temporel: ${phase.objectives.timeBound}`);
  console.log(`Statut: ${phase.status}\n`);
}

// Fonction pour mettre à jour le statut d'une phase
function updatePhaseStatus(phaseId, newStatus) {
  const phaseIndex = phases.phases.findIndex(phase => phase.id === phaseId);
  if (phaseIndex !== -1) {
    phases.phases[phaseIndex].status = newStatus;
    fs.writeFileSync('./phase.json', JSON.stringify(phases, null, 2));
    console.log(`Statut de la Phase ${phaseId} mis à jour à: ${newStatus}`);
  } else {
    console.error(`Phase ${phaseId} non trouvée.`);
  }
}

// Fonction pour exécuter et suivre chaque phase du projet
async function runPhase(phaseId) {
  const phase = phases.phases.find(p => p.id === phaseId);

  if (!phase) {
    console.error(`Phase avec l'id ${phaseId} non trouvée`);
    return;
  }

  console.log(`\n--- Début de la Phase ${phaseId}: ${phase.title} ---`);
  
  // Afficher les objectifs SMART
  displayPhaseObjectives(phase);

  // Simuler le travail pour chaque phase
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler un délai
  
  // Mettre à jour le statut de la phase à "completed"
  updatePhaseStatus(phaseId, "completed");
  
  console.log(`--- Fin de la Phase ${phaseId}: ${phase.title} ---\n`);
}

// Fonction pour exécuter toutes les phases
async function executeAllPhases() {
  for (const phase of phases.phases) {
    if (phase.status === "pending") {
      await runPhase(phase.id);
    } else {
      console.log(`Phase ${phase.id} est déjà complétée.`);
    }
  }
  console.log("Toutes les phases ont été exécutées.");
}

// Export des fonctions pour une utilisation externe
module.exports = {
  runPhase,
  executeAllPhases
};

// Exemple d'utilisation
// executeAllPhases();
