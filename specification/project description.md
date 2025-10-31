# Spécification de la librairie NPM de correction de transcriptions (v0.1)

## Objectif

Fournir une librairie NPM, compatible navigateur, destinée à corriger automatiquement des transcriptions textuelles de réunions ou d’audios, en remplaçant les mots/expressions mal reconnus par leurs formes canoniques à partir d’un vocabulaire fourni.

La correction vise notamment les termes internes (noms propres, acronymes, produits, projets) et les expressions multi‑mots qui sont souvent mal transcrits par les moteurs de reconnaissance vocale.

## Portée

* **Inclus (MVP)**

    * Correction textuelle basée sur un *vocabulaire de termes canoniques* (liste de mots/expressions), sans avoir à maintenir manuellement toutes les variantes fautives.
    * Détection des candidats à corriger via similarité phonétique et textuelle, puis remplacement par la forme canonique.
    * Prise en charge des expressions multi‑mots et des termes contenant des symboles (ex. « + ») via découpe en *n‑grams* et appariement du plus long au plus court.
    * Paramétrage de la langue et/ou de l’encodeur phonétique pour améliorer la précision (ex. choix d’un encodeur adapté au français ou à l’anglais).
    * Sortie enrichie avec des informations de diagnostic (liste des remplacements effectués et leurs scores) pour faciliter le débogage et l’évaluation.
    * Jeux de tests et métriques de performance (taux de corrections correctes, faux positifs, faux négatifs) afin de comparer des variantes d’algorithmes et de paramètres.

* **Exclus (hors MVP, possibles pistes ultérieures)**

    * Inférence automatique d’identités de locuteurs à partir du texte seul.
    * Empreintes/embeddings de voix réutilisables entre transcriptions pour identifier un même locuteur.
    * Toute interface utilisateur. La librairie est un composant programme (headless) utilisable par d’autres applications.

## Contraintes d’environnement

* **Compatibilité navigateur** impérative. Ne pas dépendre d’API ou modules spécifiques à Node.js.
* Publication sous forme de paquet NPM moderne (module ESM). Fournir les types TypeScript.
* Fonctionnement CPU uniquement. Aucune exigence GPU.

## Définitions

* **Terme canonique**: forme « correcte » attendue d’un mot ou d’une expression (p. ex. nom de produit, sigle). Le vocabulaire fourni est une *liste de termes canoniques*.
* **Variation fautive**: forme mal transcrite apparaissant dans le texte (une ou plusieurs). La librairie les infère, elle ne nécessite pas de liste exhaustive de variantes.
* **n‑gram**: séquence de *n* tokens consécutifs extraite du texte (tokens séparés par espaces et retours à la ligne). L’ordre de tentative d’appariement va du plus long au plus court.

## Cas d’usage représentatifs

1. Correction de noms propres d’entreprise et d’acronymes techniques mal transcrits.
2. Correction d’expressions multi‑mots (ex. « nom du produit + suffixe ») même en présence de symboles.
3. Application sur des transcriptions de réunions en français ou en anglais, avec possibilité d’ajuster l’encodeur/paramètres selon la langue.

## Exigences fonctionnelles (MVP)

1. **Chargement du vocabulaire**

    * Accepter en entrée une *liste* de termes canoniques (mots et expressions multi‑mots, symboles autorisés).
    * Permettre un initialiseur/constructeur ou équivalent pour fournir le vocabulaire et les paramètres.

2. **Prétraitement du vocabulaire**

    * Encoder chaque terme canonique via un *encodeur phonétique* configurable.
    * Conserver parallèlement une représentation textuelle pour les calculs de similarité de chaînes.

3. **Tokenisation et n‑grams**

    * Segmenter le texte en tokens en utilisant au minimum les séparateurs espace et retour à la ligne.
    * Générer des *n‑grams* jusqu’à une longueur maximale configurable.
    * Tenter les appariements dans l’ordre **du plus long au plus court** pour privilégier les expressions multi‑mots.

4. **Appariement et scoring**

    * Pour chaque n‑gram candidat, calculer un **score composite** combinant au minimum:

        * Similarité **phonétique** entre n‑gram et terme canonique (via l’encodeur choisi).
        * Similarité **textuelle** (distance/ratio de chaînes) entre n‑gram et terme canonique.
        * **Pénalité/pondération de longueur** afin de limiter les confusions entre segments trop courts ou trop longs.
    * Fournir un **seuil** global configurable au‑delà duquel un remplacement est accepté.
    * Gérer les collisions (plusieurs termes au‑dessus du seuil) en sélectionnant le meilleur score.

5. **Remplacement**

    * Remplacer l’occurrence du n‑gram par la **forme canonique** correspondante lorsqu’elle dépasse le seuil.
    * Éviter les remplacements en cascade qui réouvriraient des segments déjà corrigés.

6. **Sortie et diagnostic**

    * Retourner le **texte corrigé** et une **liste structurée des corrections** comprenant pour chaque remplacement au minimum: segment source, terme canonique choisi, composantes de score et score global.
    * Exposer les **paramètres effectifs** utilisés (encodeur, seuil, longueur max des n‑grams) pour traçabilité.

7. **Paramétrage algorithmique**

    * Encodeur phonétique **remplaçable** (ex. variantes adaptées au français ou à l’anglais).
    * Seuil et **pondérations** des composantes de score ajustables.
    * Longueur maximale des n‑grams configurable.

8. **Langues**

    * Permettre d’utiliser des encodeurs/paramètres différents selon la langue ciblée, sans imposer de comparaison multi‑langues.

## Exigences non fonctionnelles

* **Interopérabilité**: utilisable dans des applications web (framework‑agnostic) et dans des environnements Node.js, tant qu’aucune dépendance Node‑exclusive n’est requise côté navigateur.
* **Observabilité**: activer un mode « debug » optionnel qui conserve les détails d’appariement et de scoring.
* **Performances**: pas d’objectif chiffré imposé; l’implémentation doit rester raisonnable pour des transcriptions de réunions de taille courante.

## Algorithmes et logique attendue (niveau conceptuel)

* **Pré‑encodage phonétique** du vocabulaire pour accélérer les comparaisons.
* **Parcours des n‑grams** du plus long au plus court pour maximiser la probabilité de corriger les expressions longues avant les segments unitaires.
* **Scoring composite** étoffé pour traiter les cas où la phonétique seule ne suffit pas (p. ex. confusion de consonnes, symboles, mots proches).
* **Seuil** global réglable pour contrôler le compromis rappel/precision et limiter les faux positifs.

## Jeux de tests et évaluation

1. **Types de tests**

    * **Tests ciblés par terme**: pour chaque terme canonique, valider que diverses variantes fautives sont corrigées vers ce terme.
    * **Tests de corpus**: appliquer la correction sur des textes plus longs contenant un mélange de termes canoniques et de texte « normal », mesurer:

        * Corrections correctes (vraies positives)
        * Corrections manquées (faux négatifs)
        * Corrections indésirables (faux positifs)

2. **Métriques minimales**

    * Compter par exécution: nombre total de remplacements, nombre de TP/FP/FN et taux correspondants.
    * Fournir un récapitulatif agrégé pour comparer des variantes d’encodeurs et de paramètres.

3. **Jeux de données**

    * Constituer un **vocabulaire** de référence réaliste (termes canoniques) et un **corpus** de textes contenant des variantes fautives.
    * Les corpus peuvent être **générés** de manière synthétique pour couvrir des symboles, multi‑mots et langues ciblées. L’utilisation d’un générateur de texte externe est acceptable pour créer ces corpus, sans dépendance à l’exécution de la librairie.

4. **Reproductibilité**

    * Les tests doivent être scriptables et rejouables avec les mêmes paramètres afin de produire des **snapshots** comparables entre versions.

## Gestion du vocabulaire

* La librairie doit accepter un **ensemble de termes canoniques** en entrée, sans présumer d’une structure de catégorisation.
* Aucune exigence sur la provenance du vocabulaire (fichier, base, UI). La librairie consomme l’ensemble tel qu’il est fourni par l’application hôte.

## Considérations spécifiques

* Les **symboles** au sein des termes (ex. « + ») doivent être pris en compte lors des comparaisons et ne pas empêcher l’appariement.
* Les **expressions multi‑mots** doivent être traitées via les n‑grams et protégées des chevauchements par la stratégie « le plus long d’abord ».

## Pistes ultérieures (hors MVP)

* Heuristiques avancées pour **réglage automatique** des seuils/pondérations selon la distribution des scores.
* Modules annexes optionnels pour **analyse des locuteurs** (texte ou audio) et **réutilisation d’empreintes** inter‑transcriptions.

---

### Résumé exécutable pour un agent de codage

* Créer une **librairie NPM** ESM, **compatible navigateur**, écrite en **TypeScript** et fournie avec types.
* Entrées principales: **texte** à corriger, **vocabulaire** (liste de termes canoniques), **paramètres** (encodeur phonétique, seuil, pondérations, n‑gram max).
* Traitement: tokenisation, génération d’**n‑grams**, **scoring composite** (phonétique + textuel + longueur), **seuil** de décision, remplacement **canonique** sans chevauchement.
* Sorties: **texte corrigé** + **détails des corrections** (segment source, terme canonique, composantes de score, score global, paramètres effectifs).
* Tests: mettre en place des **tests unitaires** (terme par terme) et **tests de corpus** avec comptage TP/FP/FN, exécutions reproductibles et comparables entre variantes (encodeurs/paramètres).
