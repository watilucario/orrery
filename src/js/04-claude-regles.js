/* Consignes et règles du cours de la matière active : regles.md de la matière, chargées par activate().
   AI : réglages du bloc « aide de Claude » (niveau de modèle et effort), tirés de la recette. */
var INSTR="",RULES="",EXQ_INSTR="",CORR_INSTR="",AI={niveau:"default",effort:"low"};
/* Économie de tokens : on n'envoie à Claude que les règles du thème de la question.
   La table thème → règles vient de la ligne « Thèmes : » de chaque règle dans regles.md ; la règle 0 est l'annexe (barème). */
function rulesFor(th,bareme,all){
  if(all||!MAT||!MAT.rulesList||!MAT.ruleMap||!MAT.ruleMap[th])return RULES;
  var idx=MAT.ruleMap[th].slice();
  if(bareme&&idx.indexOf(0)<0)idx.unshift(0);
  return idx.map(function(i){return MAT.rulesList[i];}).join("\n");
}
/* Historique plafonné : le premier échange (qui porte le contexte) et les derniers messages seulement */
function trimTurns(t,keep){keep=keep||2;return t.length>2+keep?t.slice(0,2).concat(t.slice(-keep)):t;}
/* Qui révise, dans ce qu'on envoie à l'IA (v13) : le prénom donné par univers/app.json (version perso), sinon celui du
   profil, sinon « l'élève » (Maitrise, la version vierge, ne connaît personne d'avance) */
function quiEleve(){return APP.eleve||(PROF&&PROF.prenom)||t("iaq.eleve");}
/* Langue de la réponse demandée à l'IA : rien en français (les consignes sont déjà dans cette langue), une phrase ailleurs */
function iaLangue(){return LANG==="fr"?"":" "+t("iaq.repondre");}
function quiEleveMaj(){var q=quiEleve();return q.charAt(0).toUpperCase()+q.slice(1);}
/* L'aide de Claude est proposée si la capacité sample est accordée et si la recette garde le bloc */
function aiOn(){return !!(SAMPLE&&MAT&&MAT.blocs.aide_claude);}
