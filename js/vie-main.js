/* BIG CITY LIFE — point d'entrée */
document.addEventListener('DOMContentLoaded', () => {
  const partie = Vie.charger();
  if (partie && !partie.gameOver) UI.rendre();
  else { Vie.effacerSauvegarde(); UI.ecranAccueil(); }
});
