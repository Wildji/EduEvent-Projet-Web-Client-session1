let evenements = [];
let utilisateurConnecte = null;

async function chargerEvenements() {
    try {
        const reponse = await fetch('data/evenements.json');
        if (!reponse.ok) {
            throw new Error(`Erreur HTTP : ${reponse.status}`);
        }
        const donnees = await reponse.json();
        evenements = donnees.evenements || [];
        console.log(`✓ ${evenements.length} événements chargés`);
    } catch (erreur) {
        console.error('Erreur chargement événements :', erreur);
        evenements = [];
        afficherToast('Impossible de charger les événements', 'erreur');
    }
}

function chargerUtilisateur() {
    try {
        const donnees = localStorage.getItem('eduevent_utilisateur');
        if (donnees) {
            utilisateurConnecte = JSON.parse(donnees);
            console.log('✅ Utilisateur chargé:', utilisateurConnecte.prenom);
        } else {
            utilisateurConnecte = null;
            console.log('❌ Aucun utilisateur connecté');
        }
    } catch (e) {
        console.error('Erreur lecture utilisateur:', e);
        utilisateurConnecte = null;
    }
    mettreAJourUIUtilisateur();
}

function sauvegarderUtilisateur(utilisateur) {
    utilisateurConnecte = utilisateur;
    localStorage.setItem('eduevent_utilisateur', JSON.stringify(utilisateur));
    mettreAJourUIUtilisateur();
}

function deconnecterUtilisateur() {
    utilisateurConnecte = null;
    localStorage.removeItem('eduevent_utilisateur');
    mettreAJourUIUtilisateur();
    afficherToast('Vous avez été déconnecté', 'succes');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

function mettreAJourUIUtilisateur() {
    const headerBoutons = document.getElementById('headerBoutons');
    const btnProfil = document.getElementById('btnProfil');
    const menuAuth = document.getElementById('menuAuth');
    const menuProfil = document.getElementById('menuProfil');
    const initialesMini = document.getElementById('initialesMini');
    const initialesMiniDesktop = document.getElementById('initialesMiniDesktop');
    const profilNomMenu = document.getElementById('profilNomMenu');

    if (utilisateurConnecte) {
        // Cacher les boutons de connexion/inscription (desktop)
        if (headerBoutons) {
            headerBoutons.style.display = 'none';
        }
        // Cacher les boutons de connexion/inscription (mobile)
        if (menuAuth) {
            menuAuth.style.display = 'none';
        }

        // Afficher le profil (desktop)
        if (btnProfil) {
            btnProfil.style.display = 'flex';
            if (initialesMiniDesktop) {
                initialesMiniDesktop.textContent = 
                    `${utilisateurConnecte.prenom.charAt(0)}${utilisateurConnecte.nom.charAt(0)}`;
            }
        }

        // Afficher le profil (mobile)
        if (menuProfil) {
            menuProfil.style.display = 'flex';
            if (profilNomMenu) {
                profilNomMenu.textContent = `${utilisateurConnecte.prenom} ${utilisateurConnecte.nom}`;
            }
            if (initialesMini) {
                initialesMini.textContent = 
                    `${utilisateurConnecte.prenom.charAt(0)}${utilisateurConnecte.nom.charAt(0)}`;
            }
        }
    } else {
        // Afficher les boutons de connexion/inscription (desktop)
        if (headerBoutons) {
            headerBoutons.style.display = 'flex';
        }

        // Afficher les boutons de connexion/inscription (mobile)
        if (menuAuth) {
            menuAuth.style.display = 'flex';
        }

        // Cacher le profil (desktop)
        if (btnProfil) {
            btnProfil.style.display = 'none';
        }

        // Cacher le profil (mobile)
        if (menuProfil) {
            menuProfil.style.display = 'none';
        }
    }
}

function initialiserMenuMobile() {
    const btnMenu = document.getElementById('btnMenuMobile');
    const nav = document.getElementById('navPrincipale');
    const overlay = document.getElementById('menuOverlay');

    if (!btnMenu || !nav) return;

    const toggleMenu = () => {
        const estOuvert = nav.classList.toggle('ouvert');
        btnMenu.classList.toggle('ouvert');
        btnMenu.setAttribute('aria-expanded', estOuvert);

        if (overlay) {
            overlay.classList.toggle('visible');
        }

        document.body.style.overflow = estOuvert ? 'hidden' : '';
    };

    btnMenu.addEventListener('click', toggleMenu);

    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('ouvert')) {
            toggleMenu();
        }
    });

    nav.querySelectorAll('a').forEach(lien => {
        lien.addEventListener('click', () => {
            if (nav.classList.contains('ouvert')) {
                toggleMenu();
            }
        });
    });
}

function initialiserHeroSlider() {
    const slides = document.querySelectorAll('.slide-hero');
    const indicateurs = document.querySelectorAll('.indicateur');

    if (slides.length === 0) return;

    let indexActuel = 0;
    let intervalle;

    const changerSlide = (index) => {
        slides.forEach(s => s.classList.remove('active'));
        indicateurs.forEach(i => i.classList.remove('active'));

        slides[index].classList.add('active');
        if (indicateurs[index]) indicateurs[index].classList.add('active');
        indexActuel = index;
    };

    const slideSuivant = () => {
        const suivant = (indexActuel + 1) % slides.length;
        changerSlide(suivant);
    };

    indicateurs.forEach((ind, i) => {
        ind.addEventListener('click', () => {
            clearInterval(intervalle);
            changerSlide(i);
            intervalle = setInterval(slideSuivant, 6000);
        });
    });

    intervalle = setInterval(slideSuivant, 6000);
}

function initialiserCompteurs() {
    const compteurs = document.querySelectorAll('.stat-nombre[data-cible]');
    if (compteurs.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animerCompteur(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    compteurs.forEach(c => observer.observe(c));
}

function animerCompteur(element) {
    const cible = parseInt(element.dataset.cible);
    const duree = 2000;
    const pas = 30;
    const totalPas = duree / pas;
    const increment = cible / totalPas;
    let actuel = 0;

    const timer = setInterval(() => {
        actuel += increment;
        if (actuel >= cible) {
            element.textContent = cible + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(actuel);
        }
    }, pas);
}

function initialiserNewsletter() {
    const form = document.getElementById('formulaireNewsletter');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.email.value;
        if (email && email.includes('@')) {
            afficherToast('Merci pour votre inscription !', 'succes');
            form.reset();
        } else {
            afficherToast('Veuillez entrer un email valide', 'erreur');
        }
    });
}

function initialiserCategoriesPied() {
    const container = document.getElementById('liensCategories');
    if (!container) return;

    const categories = [
        { id: 'conference', label: 'Conférences' },
        { id: 'sport', label: 'Sports' },
        { id: 'culture', label: 'Culture' },
        { id: 'soutenance', label: 'Soutenances' },
        { id: 'soiree', label: 'Soirées' }
    ];

    container.innerHTML = categories.map(cat => `
        <li><a href="evenements.html?cat=${cat.id}">${cat.label}</a></li>
    `).join('');
}

function initialiserModals() {
    const btnConnexion = document.getElementById('btnConnexion');
    const btnInscription = document.getElementById('btnInscription');
    const btnConnexionMenu = document.getElementById('btnConnexionMenu');
    const btnInscriptionMenu = document.getElementById('btnInscriptionMenu');

    if (btnConnexion) btnConnexion.addEventListener('click', () => ouvrirModal('modalConnexion'));
    if (btnInscription) btnInscription.addEventListener('click', () => ouvrirModal('modalInscription'));
    if (btnConnexionMenu) btnConnexionMenu.addEventListener('click', () => ouvrirModal('modalConnexion'));
    if (btnInscriptionMenu) btnInscriptionMenu.addEventListener('click', () => ouvrirModal('modalInscription'));

    document.querySelectorAll('.modal-fermer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if (modal) fermerModal(modal);
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fermerModal(modal);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay:not([hidden])').forEach(fermerModal);
        }
    });

    const basculerInscription = document.getElementById('basculerInscription');
    const basculerConnexion = document.getElementById('basculerConnexion');

    if (basculerInscription) {
        basculerInscription.addEventListener('click', (e) => {
            e.preventDefault();
            fermerModal(document.getElementById('modalConnexion'));
            ouvrirModal('modalInscription');
        });
    }

    if (basculerConnexion) {
        basculerConnexion.addEventListener('click', (e) => {
            e.preventDefault();
            fermerModal(document.getElementById('modalInscription'));
            ouvrirModal('modalConnexion');
        });
    }

    const formConnexion = document.getElementById('formulaireConnexion');
    if (formConnexion) {
        formConnexion.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validerFormulaire(formConnexion)) {
                const email = formConnexion.email.value;
                const prenom = email.split('@')[0];
                const utilisateur = {
                    prenom: prenom,
                    nom: 'Utilisateur',
                    email: email,
                    faculte: 'fsg',
                    niveau: 'L3',
                    avatar: null,
                    bio: '',
                    dateInscription: new Date().toISOString()
                };
                sauvegarderUtilisateur(utilisateur);
                fermerModal(document.getElementById('modalConnexion'));
                afficherToast(`Bienvenue ${prenom} !`, 'succes');
                setTimeout(() => {
                    window.location.href = 'profil.html';
                }, 500);
            }
        });
    }

    const formInscription = document.getElementById('formulaireInscription');
    if (formInscription) {
        const inputMdp = formInscription.querySelector('#insc-mdp');
        if (inputMdp) {
            inputMdp.addEventListener('input', () => {
                const force = calculerForceMdp(inputMdp.value);
                const barre = document.querySelector('#forceMdp .force-barre');
                if (barre) {
                    barre.className = 'force-barre ' + force.classe;
                }
            });
        }

        formInscription.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validerFormulaire(formInscription)) {
                const utilisateur = {
                    prenom: formInscription.prenom.value,
                    nom: formInscription.nom.value,
                    email: formInscription.email.value,
                    faculte: formInscription.faculte.value,
                    niveau: formInscription.niveau.value,
                    avatar: null,
                    bio: '',
                    dateInscription: new Date().toISOString()
                };
                sauvegarderUtilisateur(utilisateur);
                fermerModal(document.getElementById('modalInscription'));
                afficherToast('Compte créé avec succès !', 'succes');
                setTimeout(() => {
                    window.location.href = 'profil.html';
                }, 500);
            }
        });
    }

    const btnDeconnexionMenu = document.getElementById('btnDeconnexionMenu');
    if (btnDeconnexionMenu) {
        btnDeconnexionMenu.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                deconnecterUtilisateur();
            }
        });
    }
}

function ouvrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        const premierChamp = modal.querySelector('input, select, textarea');
        if (premierChamp) setTimeout(() => premierChamp.focus(), 100);
    }
}

function fermerModal(modal) {
    if (modal) {
        modal.hidden = true;
        document.body.style.overflow = '';
    }
}

function initialiserContact() {
    const form = document.getElementById('formulaireContact');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validerFormulaire(form)) {
            afficherToast('Message envoyé ! Nous vous répondrons rapidement.', 'succes');
            form.reset();
        }
    });
}

function afficherToast(message, type) {
    const conteneur = document.getElementById('toastConteneur');
    if (!conteneur) return;

    const icones = {
        succes: '',
        erreur: '',
        attention: '',
        info: ''
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type || 'info'}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
    `;

    conteneur.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'glisserDroite 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function validerFormulaire(form) {
    let valide = true;

    form.querySelectorAll('input, select, textarea').forEach(champ => {
        const erreur = champ.parentElement.querySelector('.erreur-champ');

        champ.classList.remove('invalide');
        if (erreur) erreur.textContent = '';

        if (champ.hasAttribute('required') && !champ.value.trim()) {
            champ.classList.add('invalide');
            if (erreur) erreur.textContent = 'Ce champ est requis';
            valide = false;
        } else if (champ.type === 'email' && champ.value && !champ.value.includes('@')) {
            champ.classList.add('invalide');
            if (erreur) erreur.textContent = 'Email invalide';
            valide = false;
        } else if (champ.minLength && champ.value.length < parseInt(champ.minLength)) {
            champ.classList.add('invalide');
            if (erreur) erreur.textContent = `Minimum ${champ.minLength} caractères`;
            valide = false;
        }
    });

    return valide;
}

function calculerForceMdp(mdp) {
    let score = 0;
    if (mdp.length >= 8) score++;
    if (mdp.length >= 12) score++;
    if (/[a-z]/.test(mdp) && /[A-Z]/.test(mdp)) score++;
    if (/\d/.test(mdp)) score++;
    if (/[^a-zA-Z0-9]/.test(mdp)) score++;

    if (score <= 2) return { classe: 'faible', label: 'Faible' };
    if (score <= 3) return { classe: 'moyen', label: 'Moyen' };
    return { classe: 'fort', label: 'Fort' };
}

function formaterDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formaterDateCourt(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
    });
}

function genererCodeBillet() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'EE-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function creerCarteEvenement(evt) {
    const estPayant = evt.prix > 0;

    return `
        <article class="carte-evenement" data-id="${evt.id}">
            <div class="carte-image">
                <img src="${evt.image}" alt="${evt.titre}" loading="lazy" width="400" height="225">
                <span class="carte-categorie-etiquette">${evt.categorieLabel}</span>
            </div>
            <div class="carte-corps">
                <h3 class="carte-titre">
                    <a href="detail.html?id=${evt.id}">${evt.titre}</a>
                </h3>
                <div class="carte-meta">
                    <div class="carte-meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formaterDateCourt(evt.date)} • ${evt.heure}</span>
                    </div>
                    <div class="carte-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${evt.lieu}</span>
                    </div>
                </div>
                <div class="carte-pied">
                    <span class="carte-prix ${!estPayant ? 'gratuit' : ''}">
                        ${estPayant ? evt.prix + ' HTG' : 'Gratuit'}
                    </span>
                    <a href="detail.html?id=${evt.id}" class="btn btn-primaire btn-small">
                        Voir <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </article>
    `;
}

document.addEventListener('DOMContentLoaded', async () => {
    await chargerEvenements();
    chargerUtilisateur();
    initialiserMenuMobile();
    initialiserHeroSlider();
    initialiserCompteurs();
    initialiserNewsletter();
    initialiserModals();
    initialiserContact();
    initialiserCategoriesPied();

    if (document.getElementById('grilleUne')) {
        afficherEvenementsUne();
    }

    console.log('✅ EduEvent initialisé avec succès');
});

function afficherEvenementsUne() {
    const grille = document.getElementById('grilleUne');
    if (!grille || !evenements.length) return;

    const une = evenements.filter(e => e.vedette).slice(0, 4);
    const aAfficher = une.length >= 3 ? une : evenements.slice(0, 4);

    grille.innerHTML = aAfficher.map(creerCarteEvenement).join('');
}