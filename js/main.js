/* BIG CITY — point d'entrée */
document.addEventListener('DOMContentLoaded', () => {
  const partie = Engine.charger();
  if (partie && !partie.gameOver) UI.rendre();
  else { Engine.effacerSauvegarde(); UI.ecranAccueil(); }
});
