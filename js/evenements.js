let filtreCategorieActif = 'tous';
let filtreDateActif = 'tous';
let filtrePrixActif = 'tous';
let rechercheActuelle = '';
let nombreAffiche = 6;
const PAS_CHARGEMENT = 6;

document.addEventListener('DOMContentLoaded', () => {
    const verifier = setInterval(() => {
        if (evenements && evenements.length > 0) {
            clearInterval(verifier);
            initialiserPageEvenements();
        }
    }, 100);
});

function initialiserPageEvenements() {
    const params = new URLSearchParams(window.location.search);

    const catParam = params.get('cat');
    if (catParam) {
        filtreCategorieActif = catParam;
        const pill = document.querySelector(`#filtresCategorie .pill[data-cat="${catParam}"]`);
        if (pill) {
            document.querySelectorAll('#filtresCategorie .pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        }
    }

    const dateParam = params.get('date');
    if (dateParam) {
        filtreDateActif = dateParam;
        const pill = document.querySelector(`#filtresDate .pill[data-date="${dateParam}"]`);
        if (pill) {
            document.querySelectorAll('#filtresDate .pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        }
    }

    const prixParam = params.get('prix');
    if (prixParam) {
        filtrePrixActif = prixParam;
        const pill = document.querySelector(`#filtresPrix .pill[data-prix="${prixParam}"]`);
        if (pill) {
            document.querySelectorAll('#filtresPrix .pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        }
    }

    const rechercheParam = params.get('recherche');
    if (rechercheParam) {
        rechercheActuelle = rechercheParam.toLowerCase().trim();
        const champ = document.getElementById('champRecherche');
        if (champ) {
            champ.value = rechercheParam;
            const btnEffacer = document.getElementById('btnEffacer');
            if (btnEffacer) btnEffacer.hidden = false;
        }
    }

    initialiserRecherche();
    initialiserFiltresCategorie();
    initialiserFiltresPrix();
    initialiserFiltresDate();
    initialiserBoutonChargerPlus();
    initialiserBoutonReinitialiser();

    afficherEvenements();
}

function initialiserRecherche() {
    const champ = document.getElementById('champRecherche');
    const btnEffacer = document.getElementById('btnEffacer');

    if (!champ) return;

    let timer;

    champ.addEventListener('input', (e) => {
        clearTimeout(timer);

        if (btnEffacer) {
            btnEffacer.hidden = e.target.value.length === 0;
        }

        timer = setTimeout(() => {
            rechercheActuelle = e.target.value.toLowerCase().trim();
            nombreAffiche = PAS_CHARGEMENT;
            afficherEvenements();
        }, 300);
    });

    if (btnEffacer) {
        btnEffacer.addEventListener('click', () => {
            champ.value = '';
            btnEffacer.hidden = true;
            rechercheActuelle = '';
            nombreAffiche = PAS_CHARGEMENT;
            afficherEvenements();
            champ.focus();
        });
    }
}

function initialiserFiltresCategorie() {
    const pills = document.querySelectorAll('#filtresCategorie .pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            filtreCategorieActif = pill.dataset.cat;
            nombreAffiche = PAS_CHARGEMENT;
            afficherEvenements();
        });
    });
}

function initialiserFiltresPrix() {
    const pills = document.querySelectorAll('#filtresPrix .pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            filtrePrixActif = pill.dataset.prix;
            nombreAffiche = PAS_CHARGEMENT;
            afficherEvenements();
        });
    });
}

function initialiserFiltresDate() {
    const pills = document.querySelectorAll('#filtresDate .pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            filtreDateActif = pill.dataset.date;
            nombreAffiche = PAS_CHARGEMENT;
            afficherEvenements();
        });
    });
}

function correspondFiltreDate(evt) {
    if (filtreDateActif === 'tous') return true;

    const dateEvt = new Date(evt.date);
    const maintenant = new Date();
    maintenant.setHours(0, 0, 0, 0);

    const finJournee = new Date(maintenant);
    finJournee.setHours(23, 59, 59, 999);

    const finSemaine = new Date(maintenant);
    finSemaine.setDate(finSemaine.getDate() + 7);

    const finMois = new Date(maintenant);
    finMois.setMonth(finMois.getMonth() + 1);

    switch (filtreDateActif) {
        case 'aujourd':
            return dateEvt >= maintenant && dateEvt <= finJournee;
        case 'semaine':
            return dateEvt >= maintenant && dateEvt <= finSemaine;
        case 'mois':
            return dateEvt >= maintenant && dateEvt <= finMois;
        default:
            return true;
    }
}

function initialiserBoutonChargerPlus() {
    const btn = document.getElementById('btnChargerPlus');
    if (!btn) return;

    btn.addEventListener('click', () => {
        nombreAffiche += PAS_CHARGEMENT;
        afficherEvenements();
    });
}

function initialiserBoutonReinitialiser() {
    const btn = document.getElementById('btnReinitialiser');
    if (!btn) return;

    btn.addEventListener('click', () => {
        filtreCategorieActif = 'tous';
        filtreDateActif = 'tous';
        filtrePrixActif = 'tous';
        rechercheActuelle = '';
        nombreAffiche = PAS_CHARGEMENT;

        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        document.querySelector('#filtresCategorie .pill[data-cat="tous"]')?.classList.add('active');
        document.querySelector('#filtresDate .pill[data-date="tous"]')?.classList.add('active');
        document.querySelector('#filtresPrix .pill[data-prix="tous"]')?.classList.add('active');

        const champ = document.getElementById('champRecherche');
        if (champ) {
            champ.value = '';
            const btnEffacer = document.getElementById('btnEffacer');
            if (btnEffacer) btnEffacer.hidden = true;
        }

        afficherEvenements();
    });
}

function afficherEvenements() {
    const grille = document.getElementById('grilleEvenements');
    const compteur = document.getElementById('nombreResultats');
    const etatVide = document.getElementById('etatVide');
    const zoneChargerPlus = document.getElementById('zoneChargerPlus');

    if (!grille) return;

    let resultats = evenements.filter(evt => {
        if (filtreCategorieActif !== 'tous' && evt.categorie !== filtreCategorieActif) {
            return false;
        }

        if (filtrePrixActif !== 'tous') {
            if (filtrePrixActif === 'gratuit' && evt.prix > 0) return false;
            if (filtrePrixActif === 'payant' && evt.prix === 0) return false;
        }

        if (!correspondFiltreDate(evt)) {
            return false;
        }

        if (rechercheActuelle) {
            const texte = `${evt.titre} ${evt.lieu} ${evt.organisateur} ${evt.description}`.toLowerCase();
            if (!texte.includes(rechercheActuelle)) {
                return false;
            }
        }

        return true;
    });

    resultats.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (compteur) compteur.textContent = resultats.length;

    if (resultats.length === 0) {
        grille.innerHTML = '';
        if (etatVide) etatVide.hidden = false;
        if (zoneChargerPlus) zoneChargerPlus.hidden = true;
        return;
    }

    if (etatVide) etatVide.hidden = true;

    const affiches = resultats.slice(0, nombreAffiche);
    grille.innerHTML = affiches.map(creerCarteEvenement).join('');

    if (zoneChargerPlus) {
        zoneChargerPlus.hidden = resultats.length <= nombreAffiche;
    }

    grille.querySelectorAll('.carte-evenement').forEach((carte, i) => {
        carte.style.opacity = '0';
        carte.style.transform = 'translateY(20px)';
        setTimeout(() => {
            carte.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            carte.style.opacity = '1';
            carte.style.transform = 'translateY(0)';
        }, i * 80);
    });
}