let evenementActuel = null;
let intervalCompteur = null;

document.addEventListener('DOMContentLoaded', () => {
    const verifier = setInterval(() => {
        if (evenements && evenements.length > 0) {
            clearInterval(verifier);
            initialiserPageDetail();
        }
    }, 100);
});

function initialiserPageDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));

    if (!id) {
        afficherToast('Événement introuvable', 'erreur');
        setTimeout(() => window.location.href = 'evenements.html', 1500);
        return;
    }

    evenementActuel = evenements.find(e => e.id === id);

    if (!evenementActuel) {
        afficherToast('Événement introuvable', 'erreur');
        setTimeout(() => window.location.href = 'evenements.html', 1500);
        return;
    }

    afficherDetailEvenement();
    initialiserBoutonInscription();
    initialiserFormulaireCommentaire();
    initialiserPartage();
    demarrerCompteur();
    injecterJsonLd();
}

function afficherDetailEvenement() {
    const evt = evenementActuel;

    const banniere = document.getElementById('banniereEvt');
    if (banniere) banniere.style.backgroundImage = `url('${evt.image}')`;

    document.getElementById('ariane-titre').textContent = evt.titre;
    document.getElementById('badgeCategorie').textContent = evt.categorieLabel;
    document.getElementById('detail-titre').textContent = evt.titre;
    document.title = `${evt.titre} — EduEvent`;

    document.getElementById('infoDate').textContent = formaterDate(evt.date);
    document.getElementById('infoHeure').textContent = evt.heure;
    document.getElementById('infoLieu').textContent = evt.lieu;
    document.getElementById('infoOrganisateur').textContent = evt.organisateur;

    const desc = document.getElementById('descriptionEvt');
    if (desc) {
        desc.innerHTML = `<p>${evt.description}</p><p style="margin-top:1rem;">${evt.descriptionLongue || ''}</p>`;
    }

    const programme = document.getElementById('listeProgramme');
    const blocProgramme = document.getElementById('blocProgramme');
    if (evt.programme && evt.programme.length > 0 && programme) {
        programme.innerHTML = evt.programme.map(p => `<li>${p}</li>`).join('');
    } else if (blocProgramme) {
        blocProgramme.hidden = true;
    }

    const prixElt = document.getElementById('prixEvenement');
    if (prixElt) {
        if (evt.prix > 0) {
            prixElt.innerHTML = `<span class="prix-montant">${evt.prix} HTG</span>`;
        } else {
            prixElt.innerHTML = `<span class="prix-montant" style="color:var(--success);">Gratuit</span>`;
        }
    }

    const placesRestantes = evt.places - evt.placesOccupees;
    document.getElementById('nombrePlaces').textContent = placesRestantes;
    const pourcentage = ((evt.placesOccupees / evt.places) * 100).toFixed(0);
    const remplissage = document.querySelector('.places-remplissage');
    if (remplissage) remplissage.style.width = `${pourcentage}%`;

    afficherCommentaires();
}

function afficherCommentaires() {
    const liste = document.getElementById('listeCommentaires');
    if (!liste) return;

    const commentaires = [
        { nom: 'Marie L.', date: 'Il y a 2 jours', texte: 'J\'ai participé l\'année dernière, c\'était incroyable ! Je recommande vivement.' },
        { nom: 'Thomas B.', date: 'Il y a 1 semaine', texte: 'Très bon événement, organisation au top. Hâte d\'y retourner.' }
    ];

    liste.innerHTML = commentaires.map(c => `
        <div class="commentaire">
            <div class="commentaire-entete">
                <div class="commentaire-avatar">${c.nom.charAt(0)}</div>
                <div>
                    <div class="commentaire-nom">${c.nom}</div>
                    <div class="commentaire-date">${c.date}</div>
                </div>
            </div>
            <p>${c.texte}</p>
        </div>
    `).join('');
}

function demarrerCompteur() {
    const dateEvt = new Date(`${evenementActuel.date}T${evenementActuel.heure}:00`);

    const mettreAJour = () => {
        const maintenant = new Date();
        const diff = dateEvt - maintenant;

        if (diff <= 0) {
            document.getElementById('compteurEvenement').innerHTML =
                '<p style="text-align:center;font-weight:600;">L\'événement est en cours !</p>';
            clearInterval(intervalCompteur);
            return;
        }

        const jours = Math.floor(diff / (1000 * 60 * 60 * 24));
        const heures = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secondes = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('cptJours').textContent = jours;
        document.getElementById('cptHeures').textContent = heures;
        document.getElementById('cptMinutes').textContent = minutes;
        document.getElementById('cptSecondes').textContent = secondes;
    };

    mettreAJour();
    intervalCompteur = setInterval(mettreAJour, 1000);
}

function initialiserBoutonInscription() {
    const btn = document.getElementById('btnInscrire');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (utilisateurConnecte) {
            inscrireUtilisateur();
        } else {
            ouvrirModal('modalConnexion');
        }
    });
}

function inscrireUtilisateur() {
    if (!utilisateurConnecte || !evenementActuel) return;

    const inscriptions = JSON.parse(localStorage.getItem('eduevent_inscriptions') || '[]');

    const dejaInscrit = inscriptions.some(i =>
        i.idEvt === evenementActuel.id && i.email === utilisateurConnecte.email
    );

    if (dejaInscrit) {
        afficherToast('Vous êtes déjà inscrit à cet événement', 'info');
        return;
    }

    const inscription = {
        idEvt: evenementActuel.id,
        titre: evenementActuel.titre,
        image: evenementActuel.image,
        date: evenementActuel.date,
        heure: evenementActuel.heure,
        lieu: evenementActuel.lieu,
        prix: evenementActuel.prix,
        prenom: utilisateurConnecte.prenom,
        nom: utilisateurConnecte.nom,
        email: utilisateurConnecte.email,
        dateInscription: new Date().toISOString(),
        codeBillet: genererCodeBillet(),
        paye: evenementActuel.prix > 0
    };

    inscriptions.push(inscription);
    localStorage.setItem('eduevent_inscriptions', JSON.stringify(inscriptions));

    afficherToast('Inscription confirmée ! Billet disponible dans votre espace.', 'succes');
    btn.textContent = '✓ Inscrit';
    btn.disabled = true;
    btn.style.background = 'var(--success)';
}

function initialiserFormulaireCommentaire() {
    const form = document.getElementById('formulaireCommentaire');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validerFormulaire(form)) return;

        const nom = utilisateurConnecte ?
            `${utilisateurConnecte.prenom} ${utilisateurConnecte.nom.charAt(0)}.` :
            'Invité';

        const commentaire = {
            nom: nom,
            date: 'À l\'instant',
            texte: form.commentaire.value
        };

        const liste = document.getElementById('listeCommentaires');
        const html = `
            <div class="commentaire">
                <div class="commentaire-entete">
                    <div class="commentaire-avatar">${commentaire.nom.charAt(0)}</div>
                    <div>
                        <div class="commentaire-nom">${commentaire.nom}</div>
                        <div class="commentaire-date">${commentaire.date}</div>
                    </div>
                </div>
                <p>${commentaire.texte}</p>
            </div>
        `;
        if (liste) {
            liste.insertAdjacentHTML('afterbegin', html);
        }

        form.reset();
        afficherToast('Commentaire publié !', 'succes');
    });
}

function initialiserPartage() {
    const btn = document.getElementById('btnPartager');
    if (!btn || !evenementActuel) return;

    btn.addEventListener('click', () => {
        const url = window.location.href;

        if (navigator.share) {
            navigator.share({
                title: evenementActuel.titre,
                text: `Découvrez : ${evenementActuel.titre}`,
                url: url
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => {
                afficherToast('Lien copié dans le presse-papier !', 'succes');
            }).catch(() => {
                afficherToast('Partagez : ' + url, 'info');
            });
        }
    });
}

function injecterJsonLd() {
    const evt = evenementActuel;
    if (!evt) return;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: evt.titre,
        startDate: `${evt.date}T${evt.heure}:00`,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: evt.lieu },
        image: evt.image,
        description: evt.description,
        organizer: { '@type': 'Organization', name: evt.organisateur },
        offers: {
            '@type': 'Offer',
            price: evt.prix,
            priceCurrency: 'HTG',
            availability: 'https://schema.org/InStock',
            url: window.location.href
        }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
}