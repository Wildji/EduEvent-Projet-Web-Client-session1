document.addEventListener('DOMContentLoaded', function() {
    // Vérifier immédiatement si l'utilisateur est déjà chargé
    if (typeof utilisateurConnecte !== 'undefined' && utilisateurConnecte !== null) {
        afficherEspaceConnecte();
        return;
    }

    // Sinon, vérifier le localStorage directement
    try {
        const donnees = localStorage.getItem('eduevent_utilisateur');
        if (donnees) {
            utilisateurConnecte = JSON.parse(donnees);
            afficherEspaceConnecte();
            return;
        }
    } catch (e) {
        console.error('Erreur lecture localStorage:', e);
    }

    // Si rien n'est trouvé, rediriger vers index.html
    window.location.href = 'index.html';
});

function afficherEspaceConnecte() {
    if (!utilisateurConnecte) {
        window.location.href = 'index.html';
        return;
    }
    remplirProfil();
    initialiserAvatar();
    initialiserOnglets();
    initialiserFormulaireParametres();
    initialiserDeconnexion();
    initialiserEditionNom();
    afficherInscriptions();
    afficherBillets();
}

function remplirProfil() {
    const u = utilisateurConnecte;

    document.getElementById('profilNomComplet').textContent = `${u.prenom} ${u.nom}`;
    document.getElementById('profilEmail').textContent = u.email;

    const facultes = {
        fsg: 'Faculté des Sciences et de Génie',
        fss: 'Faculté des Sciences de la Santé',
        fsteat: "Faculté des Sciences de la Terre, de l'Environnement et de l'Aménagement du Territoire",
        fshs: 'Faculté des Sciences Humaines et Sociales',
        fase: "Faculté des Arts et des Sciences de l'Éducation"
    };

    document.getElementById('profilFaculte').textContent = facultes[u.faculte] || u.faculte;
    document.getElementById('profilNiveau').textContent = u.niveau;

    const bioEl = document.getElementById('profilBio');
    if (u.bio) {
        bioEl.textContent = u.bio;
        bioEl.style.display = 'block';
    } else {
        bioEl.style.display = 'none';
    }

    const imgAvatar = document.getElementById('imgAvatar');
    const initiales = document.getElementById('avatarInitiales');

    if (u.avatar) {
        imgAvatar.src = u.avatar;
        imgAvatar.hidden = false;
        initiales.hidden = true;
    } else {
        initiales.textContent = `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();
        initiales.hidden = false;
        imgAvatar.hidden = true;
    }

    const inscriptions = JSON.parse(localStorage.getItem('eduevent_inscriptions') || '[]');
    const mesInscriptions = inscriptions.filter(i => i.email === u.email);
    const maintenant = new Date();
    const evenementsAVenir = mesInscriptions.filter(i => new Date(i.date) > maintenant);

    document.getElementById('statInscriptions').textContent = mesInscriptions.length;
    document.getElementById('statParticipations').textContent = Math.floor(mesInscriptions.length * 0.7);
    document.getElementById('statBillets').textContent = mesInscriptions.length;
    document.getElementById('statEvenements').textContent = evenementsAVenir.length;

    document.getElementById('param-prenom').value = u.prenom;
    document.getElementById('param-nom').value = u.nom;
    document.getElementById('param-email').value = u.email;
    document.getElementById('param-faculte').value = u.faculte;
    document.getElementById('param-niveau').value = u.niveau;
    document.getElementById('param-bio').value = u.bio || '';
}

function initialiserEditionNom() {
    const btnEdit = document.getElementById('btnEditNom');
    if (!btnEdit) return;

    btnEdit.addEventListener('click', () => {
        const nomEl = document.getElementById('profilNomComplet');
        const prenom = utilisateurConnecte.prenom;
        const nom = utilisateurConnecte.nom;

        const form = document.createElement('form');
        form.className = 'edit-nom-form';
        form.innerHTML = `
            <div class="edit-nom-champs">
                <div class="champ-formulaire">
                    <label for="edit-prenom">Prénom</label>
                    <input type="text" id="edit-prenom" value="${prenom}" required>
                </div>
                <div class="champ-formulaire">
                    <label for="edit-nom">Nom</label>
                    <input type="text" id="edit-nom" value="${nom}" required>
                </div>
            </div>
            <div class="edit-nom-actions">
                <button type="submit" class="btn btn-primaire btn-small">Enregistrer</button>
                <button type="button" class="btn btn-contour btn-small" id="btnAnnulerEdit">Annuler</button>
            </div>
        `;

        const parent = nomEl.parentElement;
        parent.replaceChild(form, nomEl);
        form.querySelector('#edit-prenom').focus();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nouveauPrenom = form.querySelector('#edit-prenom').value.trim();
            const nouveauNom = form.querySelector('#edit-nom').value.trim();

            if (!nouveauPrenom || !nouveauNom) {
                afficherToast('Veuillez remplir les deux champs', 'erreur');
                return;
            }

            utilisateurConnecte.prenom = nouveauPrenom;
            utilisateurConnecte.nom = nouveauNom;
            sauvegarderUtilisateur(utilisateurConnecte);
            remplirProfil();
            afficherToast('Nom mis à jour !', 'succes');
        });

        form.querySelector('#btnAnnulerEdit').addEventListener('click', remplirProfil);
    });
}

function initialiserAvatar() {
    const btnModifier = document.getElementById('btnModifierAvatar');
    const inputAvatar = document.getElementById('inputAvatar');

    btnModifier.addEventListener('click', () => inputAvatar.click());

    inputAvatar.addEventListener('change', (e) => {
        const fichier = e.target.files[0];
        if (!fichier) return;

        if (fichier.size > 2 * 1024 * 1024) {
            afficherToast('Image trop volumineuse (max 2 Mo)', 'erreur');
            return;
        }

        if (!fichier.type.startsWith('image/')) {
            afficherToast('Veuillez sélectionner une image', 'erreur');
            return;
        }

        const lecteur = new FileReader();
        lecteur.onload = (event) => {
            utilisateurConnecte.avatar = event.target.result;
            sauvegarderUtilisateur(utilisateurConnecte);

            const imgAvatar = document.getElementById('imgAvatar');
            const initiales = document.getElementById('avatarInitiales');
            imgAvatar.src = event.target.result;
            imgAvatar.hidden = false;
            initiales.hidden = true;

            afficherToast('Photo de profil mise à jour !', 'succes');
        };
        lecteur.readAsDataURL(fichier);
    });
}

function initialiserOnglets() {
    const onglets = document.querySelectorAll('.onglet');
    const panneaux = document.querySelectorAll('.panneau-onglet');

    onglets.forEach(onglet => {
        onglet.addEventListener('click', () => {
            const cible = onglet.dataset.onglet;

            onglets.forEach(o => {
                o.classList.remove('active');
                o.setAttribute('aria-selected', 'false');
            });
            onglet.classList.add('active');
            onglet.setAttribute('aria-selected', 'true');

            panneaux.forEach(p => p.hidden = true);
            document.getElementById(`panneau-${cible}`).hidden = false;
        });
    });
}

function initialiserFormulaireParametres() {
    const form = document.getElementById('formulaireParametres');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        utilisateurConnecte.prenom = form.prenom.value;
        utilisateurConnecte.nom = form.nom.value;
        utilisateurConnecte.email = form.email.value;
        utilisateurConnecte.faculte = form.faculte.value;
        utilisateurConnecte.niveau = form.niveau.value;
        utilisateurConnecte.bio = form.bio.value;

        sauvegarderUtilisateur(utilisateurConnecte);
        remplirProfil();
        afficherToast('Profil mis à jour avec succès !', 'succes');
    });
}

function initialiserDeconnexion() {
    const btn = document.getElementById('btnDeconnexion');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            deconnecterUtilisateur();
        }
    });
}

function afficherInscriptions() {
    const liste = document.getElementById('listeInscriptions');
    const inscriptions = JSON.parse(localStorage.getItem('eduevent_inscriptions') || '[]');
    const email = utilisateurConnecte.email;
    const mesInscriptions = inscriptions.filter(i => i.email === email);

    if (mesInscriptions.length === 0) {
        liste.innerHTML = `
            <div class="etat-vide-texte">
                <p>Vous n'êtes inscrit à aucun événement pour le moment.</p>
                <a href="evenements.html" class="btn btn-primaire" style="margin-top:1rem;">Découvrir les événements</a>
            </div>
        `;
        return;
    }

    liste.innerHTML = mesInscriptions.map((insc, index) => {
        const dateEvt = new Date(insc.date);
        const maintenant = new Date();
        const estPasse = dateEvt < maintenant;

        return `
            <div class="carte-inscription-profil">
                <img src="${insc.image}" alt="${insc.titre}" loading="lazy">
                <div class="carte-inscription-info">
                    <h3><a href="detail.html?id=${insc.idEvt}">${insc.titre}</a></h3>
                    <div class="carte-inscription-meta">
                        <span>${formaterDateCourt(insc.date)} à ${insc.heure}</span>
                        <span>${insc.lieu}</span>
                        ${estPasse ? '<span style="color:var(--texte-gris);">Terminé</span>' : '<span style="color:var(--success);">À venir</span>'}
                    </div>
                </div>
                <div class="carte-inscription-actions">
                    ${!estPasse ? `<button type="button" class="btn btn-outline btn-small btn-annuler" data-index="${index}">Annuler</button>` : ''}
                    <button type="button" class="btn btn-primaire btn-small btn-voir-billet" data-index="${index}">Voir billet</button>
                </div>
            </div>
        `;
    }).join('');

    liste.querySelectorAll('.btn-annuler').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Annuler cette inscription ?')) {
                const index = parseInt(btn.dataset.index);
                const inscriptions = JSON.parse(localStorage.getItem('eduevent_inscriptions') || '[]');
                const mesInscriptions = inscriptions.filter(i => i.email === email);
                const aSupprimer = mesInscriptions[index];

                const nouvelleListe = inscriptions.filter(i => !(
                    i.idEvt === aSupprimer.idEvt &&
                    i.email === aSupprimer.email &&
                    i.dateInscription === aSupprimer.dateInscription
                ));

                localStorage.setItem('eduevent_inscriptions', JSON.stringify(nouvelleListe));
                afficherToast('Inscription annulée', 'succes');
                afficherInscriptions();
                afficherBillets();
                remplirProfil();
            }
        });
    });

    liste.querySelectorAll('.btn-voir-billet').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.onglet[data-onglet="billets"]').click();
        });
    });
}

function afficherBillets() {
    const liste = document.getElementById('listeBillets');
    const inscriptions = JSON.parse(localStorage.getItem('eduevent_inscriptions') || '[]');
    const email = utilisateurConnecte.email;
    const mesInscriptions = inscriptions.filter(i => i.email === email);

    if (mesInscriptions.length === 0) {
        liste.innerHTML = '<p class="etat-vide-texte">Aucun billet disponible.</p>';
        return;
    }

    liste.innerHTML = mesInscriptions.map((insc, index) => `
        <div class="billet">
            <div class="billet-entete">
                <div>
                    <div class="billet-titre">${insc.titre}</div>
                    <div style="font-size:0.85rem;color:var(--texte-gris);">
                        ${insc.prix > 0 ? 'Billet payant' : 'Billet gratuit'}
                    </div>
                </div>
                <span class="billet-code">${insc.codeBillet}</span>
            </div>
            <div class="billet-details">
                <div class="billet-detail-item"><strong>Date</strong><span>${formaterDateCourt(insc.date)}</span></div>
                <div class="billet-detail-item"><strong>Heure</strong><span>${insc.heure}</span></div>
                <div class="billet-detail-item"><strong>Participant</strong><span>${insc.prenom} ${insc.nom}</span></div>
                <div class="billet-detail-item"><strong>Lieu</strong><span>${insc.lieu}</span></div>
            </div>
            <div class="billet-qr">
                <div>${insc.codeBillet}</div>
            </div>
            <div class="billet-actions">
                <button type="button" class="btn btn-outline btn-small btn-telecharger" data-index="${index}">
                    <i class="fas fa-download"></i> Télécharger
                </button>
                <button type="button" class="btn btn-primaire btn-small btn-imprimer" data-index="${index}">
                    <i class="fas fa-print"></i> Imprimer
                </button>
            </div>
        </div>
    `).join('');

    liste.querySelectorAll('.btn-telecharger').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            telechargerBillet(mesInscriptions[index]);
        });
    });

    liste.querySelectorAll('.btn-imprimer').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            imprimerBillet(mesInscriptions[index]);
        });
    });
}

function telechargerBillet(inscription) {
    const html = genererHtmlBillet(inscription);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billet-${inscription.codeBillet}.html`;
    a.click();
    URL.revokeObjectURL(url);
    afficherToast('Billet téléchargé !', 'succes');
}

function imprimerBillet(inscription) {
    const html = genererHtmlBillet(inscription);
    const fenetre = window.open('', '_blank');
    if (fenetre) {
        fenetre.document.write(html);
        fenetre.document.close();
        setTimeout(() => fenetre.print(), 500);
    }
}

function genererHtmlBillet(insc) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Billet ${insc.codeBillet}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 2rem; background: #f5f5f5; }
        .billet { max-width: 600px; margin: 0 auto; background: white; border: 3px dashed #003785; border-radius: 20px; padding: 2rem; }
        .entete { text-align: center; border-bottom: 2px dashed #2196f3; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .logo { font-size: 2rem; font-weight: bold; color: #003785; }
        .titre { font-size: 1.5rem; color: #003785; margin: 1rem 0; }
        .code { background: #003785; color: white; padding: 0.5rem 1rem; border-radius: 8px; display: inline-block; font-family: monospace; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0; }
        .detail strong { display: block; font-size: 0.75rem; color: #666; text-transform: uppercase; }
        .qr { text-align: center; margin: 2rem 0; padding: 1rem; background: #f5f5f5; border-radius: 10px; font-size: 1.5rem; font-family: monospace; }
        .pied { text-align: center; font-size: 0.85rem; color: #666; margin-top: 1.5rem; }
        @media print { body { background: white; padding: 0; } .billet { border: 2px dashed #000; } }
    </style>
</head>
<body>
    <div class="billet">
        <div class="entete">
            <div class="logo">EduEvent</div>
            <div class="titre">${insc.titre}</div>
            <div class="code">${insc.codeBillet}</div>
        </div>
        <div class="details">
            <div class="detail"><strong>Date</strong>${formaterDate(insc.date)}</div>
            <div class="detail"><strong>Heure</strong>${insc.heure}</div>
            <div class="detail"><strong>Lieu</strong>${insc.lieu}</div>
            <div class="detail"><strong>Participant</strong>${insc.prenom} ${insc.nom}</div>
        </div>
        <div class="qr">${insc.codeBillet}</div>
        <div class="pied">
            <p>Billet émis le ${new Date().toLocaleDateString('fr-FR')}</p>
            <p>${insc.prix > 0 ? `Payé : ${insc.prix} HTG` : 'Gratuit'}</p>
        </div>
    </div>
</body>
</html>
    `;
}