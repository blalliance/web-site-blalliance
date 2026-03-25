const chatMessages = document.getElementById('chatMessages');
const textarea = document.getElementById('chatInput');
const deleteModal = document.getElementById('deleteModal');
const modalOptions = document.getElementById('modalOptions');

// --- 1. GÉNÉRATION DE LA CONVERSATION ---
const users = {
    me: { img: "https://i.pravatar.cc/100?u=me" },
    other: { img: "https://i.pravatar.cc/100?u=correspondant" }
};

const mockMessages = [
    { sender: 'other', text: "Bonjour ! Comment allez-vous aujourd'hui ?", time: "09:00", date: "Hier", status: 3 },
    { sender: 'me', text: "Très bien et vous ? J'avançais sur le projet BL Alliance.", time: "09:05", date: "Hier", status: 3 },
    { sender: 'other', text: "C'est une excellente nouvelle.", time: "09:10", date: "Hier", status: 3 },
    // ... On va générer le reste dynamiquement pour le scroll
];


function renderChat() {
    let lastDate = "";
    let html = "";
    
    for(let i=0; i<31; i++) {
        const isMe = i % 2 !== 0;
        const msgDate = i < 15 ? "Lundi 23 Mars" : "Aujourd'hui";
        
        if(msgDate !== lastDate) {
            if(lastDate !== "") html += `</div>`; 
            html += `<div class="message-group">
                        <div class="date-separator"><span>${msgDate}</span></div>`;
            lastDate = msgDate;
        }

        const statusHTML = isMe ? getStatusIcon(i % 4) : "";
        
        // Bouton menu 3 points
        const menuBtnHTML = `<div class="message-menu-wrapper"><i class="fas fa-ellipsis-v message-menu-btn"></i></div>`;
        
        html += `
            <div class="message-row ${isMe ? 'me' : 'other'}" oncontextmenu="return false;">
                <img src="${isMe ? users.me.img : users.other.img}" class="user-avatar" onload="scrollToBottomInstant()">
                <div class="message-bubble" data-sender="${isMe ? 'me' : 'other'}">
                    ${i === 5 ? "Un message un peu plus long pour tester..." : "Message simulé n°" + (i+1)}
                    
                    ${menuBtnHTML}

                    <div class="message-info">
                        ${10 + i}:${i < 10 ? '0'+i : i} 
                        ${statusHTML}
                    </div>
                </div>
            </div>`;
    }
    
    html += `</div>`; 
    chatMessages.innerHTML = html;

    chatMessages.style.scrollBehavior = 'auto';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
        chatMessages.style.scrollBehavior = 'smooth';
    }, 50);
}


function getStatusIcon(code) {
    if(code === 0) return '<i class="fas fa-check status-icon"></i>'; // Envoyé
    if(code === 1) return '<i class="fas fa-check-double status-icon"></i>'; // Reçu
    return '<i class="fas fa-check-double status-icon read"></i>'; // Lu
}

// Gardez celle-ci pour l'envoi de messages (effet fluide)
// Variable pour savoir si on doit scroller
let isAutoScrolling = true;

function scrollToBottom(force = false) {
    const threshold = 100; 
    const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < threshold;

    if (force || isNearBottom) {
        // On retire le "smooth" pour que ce soit instantané
        chatMessages.style.scrollBehavior = 'auto'; 
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // On remet le smooth juste après pour les futurs messages reçus
        setTimeout(() => {
            chatMessages.style.scrollBehavior = 'smooth';
        }, 10);
    }
}

// AJOUTEZ celle-ci pour la saisie (évite les sauts visuels)
// Fonction utilitaire pour le scroll sans animation (utilisée aussi par onload des images)
function scrollToBottomInstant() {
    chatMessages.style.scrollBehavior = 'auto';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// --- 2. GESTION DU LONG PRESS (Smartphone/Tablette) ---
let pressTimer;
chatMessages.addEventListener('touchstart', (e) => {
    const bubble = e.target.closest('.message-bubble');
    if(!bubble) return;
    
    pressTimer = window.setTimeout(() => {
        showDeleteMenu(bubble.dataset.sender);
    }, 600); // 600ms pour déclencher
});

chatMessages.addEventListener('touchend', () => clearTimeout(pressTimer));

function showDeleteMenu(sender) {
    let options = "";
    if(sender === 'me') {
        options = `
            <div class="modal-option danger">Supprimer pour tous</div>
            <div class="modal-option">Supprimer pour moi</div>
            <div class="modal-option" onclick="closeModal()">Annuler</div>`;
    } else {
        options = `
            <div class="modal-option">Supprimer pour moi</div>
            <div class="modal-option" onclick="closeModal()">Annuler</div>`;
    }
    modalOptions.innerHTML = options;
    deleteModal.style.display = 'flex';
}

function closeModal() { deleteModal.style.display = 'none'; }
deleteModal.addEventListener('click', (e) => { if(e.target === deleteModal) closeModal(); });

// --- 3. LOGIQUE TEXTAREA (VOTRE CODE RÉVISÉ) ---
textarea.addEventListener('input', function() {
    // 1. Sauvegarde de la position actuelle pour comparaison
    const oldHeight = parseInt(this.style.height);
    
    // 2. Ajustement de la hauteur
    this.style.height = 'auto';
    const newHeight = this.scrollHeight;
    this.style.height = newHeight + 'px';
    this.style.overflowY = newHeight > 115 ? 'auto' : 'hidden';
    
    // 3. On ne scroll QUE si la hauteur a réellement changé (nouvelle ligne)
    if (newHeight !== oldHeight) {
        scrollToBottom(true);
    }
});

// Initialisation
renderChat();

// --- 4. ENVOI DE MESSAGE RÉEL ---
function sendMessage() {
    const text = textarea.value.trim();
    if (text === "") return;

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = new RegExp([
        /(\+\d{1,4}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{3})/,
        /(\b\d{2,4}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}\b)/,
        /(\b0\d{1,2}[\s.-]?\d{3}[\s.-]?\d{4}\b)/,
        /(\b[789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b)/
    ].map(r => r.source).join('|'), 'g');

    if (emailRegex.test(text) || phoneRegex.test(text)) {
        showSecurityModal();
        return; 
    }

    const now = new Date();
    const time = now.getHours() + ":" + (now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes());

    // Bouton menu 3 points
    const menuBtnHTML = `<div class="message-menu-wrapper"><i class="fas fa-ellipsis-v message-menu-btn"></i></div>`;

    const messageHTML = `
        <div class="message-row me">
            <img src="${users.me.img}" class="user-avatar">
            <div class="message-bubble" data-sender="me">
                ${text.replace(/\n/g, '<br>')}
                
                ${menuBtnHTML}

                <div class="message-info">
                    ${time} <i class="fas fa-check status-icon"></i>
                </div>
            </div>
        </div>
    `;

    const lastGroup = chatMessages.querySelector('.message-group:last-child');
    lastGroup.insertAdjacentHTML('beforeend', messageHTML);

    receiveResponse(); 
    textarea.value = "";
    textarea.style.height = 'auto';
    scrollToBottom();
}

// Fonctions pour gérer le modal
function showSecurityModal() {
    document.getElementById('securityModal').style.display = 'flex';
}

function closeSecurityModal() {
    document.getElementById('securityModal').style.display = 'none';
}

// Liaison avec le bouton Envoi
document.getElementById('sendBtn').addEventListener('click', sendMessage);

// Envoi via la touche "Entrée" (Desktop uniquement, pour éviter les conflits mobiles)
// textarea.addEventListener('keydown', (e) => {
//     if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 1024) {
//         e.preventDefault();
//         sendMessage();
//     }
// });

textarea.addEventListener('keydown', (e) => {
    // Vérifie si on est sur PC (écran large)
    if (window.innerWidth > 1024) {
        // ENVOI : Uniquement si Entrée + Ctrl (ou Cmd) est pressé
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            sendMessage();
        }
        // RETOUR À LA LIGNE : La touche Entrée seule fait son travail par défaut
        // On ne fait rien (pas de preventDefault), ce qui laisse le curseur descendre.
    } else {
        // Sur Mobile : Entrée ne fait que le retour à la ligne (comportement naturel)
        // L'envoi se fait uniquement via le bouton "avion" (sendBtn).
    }
});


// --- 5. RÉPONSE SIMULÉE AUTOMATIQUE ---
function receiveResponse() {
    const responses = [
        "C'est noté ! On se tient au courant.",
        "D'accord, je comprends parfaitement.",
        "Super, merci pour l'information ! 😊",
        "Je t'écris un peu plus tard, je suis en réunion.",
        "Pas de souci, ça me va !"
    ];
    
    const randomText = responses[Math.floor(Math.random() * responses.length)];
    const now = new Date();
    const time = now.getHours() + ":" + (now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes());

    setTimeout(() => {
        const lastIcons = document.querySelectorAll('.message-row.me .status-icon');
        if(lastIcons.length > 0) {
            const lastIcon = lastIcons[lastIcons.length - 1];
            lastIcon.classList.remove('fa-check');
            lastIcon.classList.add('fa-check-double', 'read');
        }

        // Bouton menu 3 points
        const menuBtnHTML = `<div class="message-menu-wrapper"><i class="fas fa-ellipsis-v message-menu-btn"></i></div>`;

        const responseHTML = `
            <div class="message-row other" oncontextmenu="return false;">
                <img src="${users.other.img}" class="user-avatar" onload="scrollToBottom(true)">
                <div class="message-bubble" data-sender="other">
                    ${randomText}
                    
                    ${menuBtnHTML}

                    <div class="message-info">
                        ${time}
                    </div>
                </div>
            </div>
        `;

        const lastGroup = chatMessages.querySelector('.message-group:last-child');
        lastGroup.insertAdjacentHTML('beforeend', responseHTML);

        setTimeout(() => {
            scrollToBottom(true);
        }, 10);
        
        if (navigator.vibrate) navigator.vibrate(50); 
    }, 1000); 
}

// Ajustement automatique lors de l'ouverture du clavier
if ('visualViewport' in window) {
    window.visualViewport.addEventListener('resize', () => {
        // Redimensionne le body pour qu'il tienne dans la zone visible
        document.body.style.height = window.visualViewport.height + 'px';
        scrollToBottom();
    });
}

// Scroll aussi quand on clique sur le champ
textarea.addEventListener('focus', () => {
    setTimeout(scrollToBottom, 300);
});


// --- GESTION DU CLIC SUR LES 3 POINTS (PC) ---
chatMessages.addEventListener('click', (e) => {
    // On vérifie si l'élément cliqué est le bouton 3 points ou l'icône à l'intérieur
    if (e.target.classList.contains('message-menu-btn') || e.target.closest('.message-menu-wrapper')) {
        const bubble = e.target.closest('.message-bubble');
        if (bubble) {
            const sender = bubble.dataset.sender;
            // On appelle votre fonction existante qui gère déjà très bien l'affichage
            showDeleteMenu(sender);
        }
    }
});


// --- 6. GESTION DES EMOJIS ---
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const emojis = ['😊', '😂', '🥰', '😍', '😒', '😭', '😘', '🙌', '👍', '🔥', '✨', '🎈', '🎉', '🚀', '💡', '💯', '🙏', '🤝', '🍕', '☕', '🌍', '💻', '📱', '📈'];

// Remplissage du panneau
emojis.forEach(emoji => {
    const span = document.createElement('span');
    span.classList.add('emoji-item');
    span.innerText = emoji;
    span.onclick = () => {
        // Insertion à la position du curseur
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        textarea.value = text.substring(0, start) + emoji + text.substring(end);
        
        // Repositionne le curseur après l'emoji
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
        
        // Déclenche l'ajustement de hauteur du textarea
        textarea.dispatchEvent(new Event('input'));
    };
    emojiPicker.appendChild(span);
});

// Toggle du panneau
emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPicker.classList.toggle('active');
});

// Fermer si on clique ailleurs
document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.classList.remove('active');
    }
});


// --- GESTION DU MENU DROPDOWN ---
const menuBtn = document.getElementById('menuBtn');
const headerDropdown = document.getElementById('headerDropdown');

menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    headerDropdown.classList.toggle('active');
});

// Fermer le menu si on clique n'importe où ailleurs
document.addEventListener('click', (e) => {
    if (!headerDropdown.contains(e.target) && e.target !== menuBtn) {
        headerDropdown.classList.remove('active');
    }
});

// Optionnel : Gérer les clics sur les items
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.innerText.trim();
        console.log("Action choisie : " + action);
        headerDropdown.classList.remove('active');
        
        // Vous pouvez ajouter des alertes personnalisées ici plus tard
        if(action === "Bloquer") {
            // Logique pour bloquer
        }
    });
});

// --- GESTION DU SIDEBAR (VERSION OPTIMISÉE POUR OUVERTURE INSTANTANÉE) ---
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const backIcon = document.querySelector('.back-icon');

// Vérification immédiate au chargement du script
if (document.documentElement.classList.contains('force-sidebar')) {
    sidebar.classList.add('open', 'instant-open');
    sidebarOverlay.classList.add('active', 'instant-open');
}

function toggleSidebar() {
    // Dès qu'on manipule la sidebar, on retire le mode "instant" pour retrouver la fluidité
    sidebar.classList.remove('instant-open');
    sidebarOverlay.classList.remove('instant-open');
    
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
}

// On lie le clic sur la flèche
if (backIcon) {
    backIcon.addEventListener('click', toggleSidebar);
}

// Fermer le sidebar quand on clique sur un contact (sur mobile)
document.querySelectorAll('.contact-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
            toggleSidebar();
        }
    });
});

// Nettoyage final pour s'assurer que les prochaines animations seront fluides
window.addEventListener('load', () => {
    setTimeout(() => {
        sidebar.classList.remove('instant-open');
        sidebarOverlay.classList.remove('instant-open');
        document.documentElement.classList.remove('force-sidebar');
    }, 100);
});

