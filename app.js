
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
    getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { 
    getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { 
    getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

// --- CORE APP MODULE ---
const App = {
    // Properties
    db: null,
    storage: null,
    auth: null,
    user: null,
    activeTab: 'netos',
    familyData: {
        netos: [],
        avos: [],
        filhos: [],
        noras: [],
        genros: []
    },
    newImageFile: null,
    isEditing: false,

    // Initialization
    init() {
        this.initFirebase();
        this.initAuthObserver();
        this.initEventListeners();
    },

    initFirebase() {
        const app = initializeApp(firebaseConfig);
        this.db = getFirestore(app);
        this.storage = getStorage(app);
        this.auth = getAuth(app);
    },

    initAuthObserver() {
        onAuthStateChanged(this.auth, user => {
            if (user) {
                this.user = user;
                UI.showAppScreen(user);
                this.loadData();
                setInterval(this.updateCountdown.bind(this), 1000);
            } else {
                this.user = null;
                UI.showAuthScreen();
                this.clearData();
            }
        });
    },

    initEventListeners() {
        // Auth
        document.getElementById('login-btn').addEventListener('click', () => this.signIn());
        document.getElementById('logout-btn').addEventListener('click', () => this.signOut());

        // Tabs and Filters
        document.querySelector('.tabs').addEventListener('click', e => {
            if (e.target.classList.contains('tab')) {
                this.changeTab(e.target.dataset.tab);
            }
        });
        document.getElementById('searchInput').addEventListener('input', () => UI.renderMembers());
        document.getElementById('aniversariosDoMes').addEventListener('click', () => this.filterByMonth());
        document.getElementById('proximoAniversario').addEventListener('click', () => this.showNextBirthday());
        
        // Modals
        document.getElementById('addMemberBtn').addEventListener('click', () => this.openModal());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveMember());
        document.getElementById('cancelBtn').addEventListener('click', () => UI.closeModal());
        document.getElementById('fileUpload').addEventListener('change', e => this.handleFileSelect(e));
    },

    // --- AUTHENTICATION ---
    signIn() {
        const provider = new GoogleAuthProvider();
        signInWithPopup(this.auth, provider).catch(error => {
            console.error("Authentication failed:", error);
            alert("Falha na autenticação. Por favor, tente novamente.");
        });
    },

    signOut() {
        signOut(this.auth).catch(error => {
            console.error("Sign out failed:", error);
        });
    },

    // --- DATA HANDLING ---
    loadData() {
        UI.showLoadingSkeleton();
        onSnapshot(collection(this.db, 'familia'), snapshot => {
            this.clearData(false); // Clear local data without re-rendering
            snapshot.forEach(doc => {
                const member = { id: doc.id, ...doc.data() };
                if (member.categoria && this.familyData[member.categoria]) {
                    this.familyData[member.categoria].push(member);
                }
            });
            console.log("Data loaded from Firestore:", this.familyData);
            this.changeTab(this.activeTab || 'netos');
            this.updateCountdown();
        });
    },
    
    clearData(render = true) {
        for (const key in this.familyData) {
            this.familyData[key] = [];
        }
        if(render) UI.renderMembers();
    },

    async saveMember() {
        const saveBtn = document.getElementById('saveBtn');
        UI.setButtonLoading(saveBtn, true, 'Salvando...');

        const docId = document.getElementById('editDocId').value;
        const categoria = document.getElementById('editCategoria').value;
        
        let imageUrl = document.getElementById('imagePreview').src;

        try {
            // Upload new image if one is selected
            if (this.newImageFile) {
                const oldImageUrl = this.isEditing ? (this.familyData[categoria].find(m => m.id === docId)?.foto || '') : '';
                const newFileName = `${docId || Date.now()}_${this.newImageFile.name}`;
                const storageRef = ref(this.storage, `fotos/${newFileName}`);
                const snapshot = await uploadBytes(storageRef, this.newImageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
                
                // Delete old image if it was a firebase URL
                if (this.isEditing && oldImageUrl.includes('firebasestorage')) {
                    try {
                        await deleteObject(ref(this.storage, oldImageUrl));
                        console.log("Old image deleted.");
                    } catch (error) {
                        console.warn("Could not delete old image:", error);
                    }
                }
            }
            
            // Prepare data
            const memberData = {
                nome: document.getElementById('editNome').value,
                data: document.getElementById('editData').value,
                categoria: document.getElementById('editCategoria').value,
                foto: imageUrl,
                preferencias: document.getElementById('editPreferencias').value,
                presentes: document.getElementById('editPresentes').value.split('\n').filter(p => p.trim() !== ''),
            };

            if (this.isEditing && docId) {
                await updateDoc(doc(this.db, 'familia', docId), memberData);
            } else {
                memberData.createdAt = serverTimestamp();
                await addDoc(collection(this.db, 'familia'), memberData);
            }

            console.log("Member saved successfully!");
            UI.closeModal();

        } catch (error) {
            console.error("Error saving member: ", error);
            alert('Ocorreu um erro ao salvar. Verifique o console para mais detalhes.');
        } finally {
            UI.setButtonLoading(saveBtn, false, 'Salvar');
        }
    },
    
    handleFileSelect(event) {
        this.newImageFile = event.target.files[0];
        if (this.newImageFile) {
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById('imagePreview').src = e.target.result;
            }
            reader.readAsDataURL(this.newImageFile);
        }
    },


    // --- BUSINESS LOGIC & UI TRIGGERS ---
    changeTab(tab) {
        document.getElementById('searchInput').value = '';
        this.activeTab = tab;
        UI.updateActiveTab(tab);
        UI.renderMembers();
    },

    openModal(member = null) {
        this.isEditing = !!member;
        this.newImageFile = null;
        UI.openModal(member);
    },

    filterByMonth() {
        const currentMonth = new Date().getMonth();
        const allMembers = Object.values(this.familyData).flat();
        const monthMembers = allMembers
            .filter(m => new Date(m.data).getMonth() === currentMonth)
            .sort((a,b) => new Date(a.data).getDate() - new Date(b.data).getDate());
        
        if(monthMembers.length === 0) alert('Nenhum aniversário este mês.');
        else UI.renderMembers(monthMembers);
    },

    showNextBirthday() {
        const nextBirthday = this.findNextBirthday();
        if (nextBirthday) {
            UI.renderMembers([nextBirthday]);
        } else {
            alert('Nenhum próximo aniversário encontrado.');
        }
    },
    
    findNextBirthday() {
        const now = new Date();
        now.setHours(0,0,0,0);
        const allMembers = Object.values(this.familyData).flat();
        
        allMembers.sort((a, b) => {
            const dateA = new Date(a.data);
            const dateB = new Date(b.data);
            dateA.setFullYear(now.getFullYear());
            dateB.setFullYear(now.getFullYear());
            if (dateA < now) dateA.setFullYear(now.getFullYear() + 1);
            if (dateB < now) dateB.setFullYear(now.getFullYear() + 1);
            return dateA - dateB;
        });

        return allMembers.length > 0 ? allMembers[0] : null;
    },

    updateCountdown() {
        const nextBirthday = this.findNextBirthday();
        UI.renderCountdown(nextBirthday);
    },

    calculateAge(birthDate) {
        const today = new Date();
        const [year, month, day] = birthDate.split('-').map(Number);
        const birthDateObj = new Date(year, month - 1, day);
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const m = today.getMonth() - birthDateObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < day)) {
            age--;
        }
        return age;
    }
};

// --- UI MODULE ---
const UI = {
    showAuthScreen() {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    },

    showAppScreen(user) {
        document.getElementById('user-name').textContent = user.displayName;
        document.getElementById('user-photo').src = user.photoURL;
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
    },

    showLoadingSkeleton() {
        const container = document.getElementById('cardsContainer');
        container.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="skeleton skeleton-img"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-subtext"></div>
            `;
            container.appendChild(card);
        }
    },
    
    renderMembers(list = null) {
        const searchFilter = document.getElementById('searchInput').value.toLowerCase();
        const container = document.getElementById('cardsContainer');
        container.innerHTML = '';

        let membersToRender;
        if (searchFilter) {
            this.updateActiveTab(null);
            const allMembers = Object.values(App.familyData).flat();
            membersToRender = allMembers.filter(m => m.nome.toLowerCase().includes(searchFilter));
        } else if (list) {
            membersToRender = list;
        } else if (App.activeTab) {
            membersToRender = App.familyData[App.activeTab] || [];
            // Sort by next birthday
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            membersToRender.sort((a, b) => {
                const dateA = new Date(a.data);
                const dateB = new Date(b.data);
                dateA.setFullYear(now.getFullYear());
                dateB.setFullYear(now.getFullYear());
                if (dateA < now) dateA.setFullYear(now.getFullYear() + 1);
                if (dateB < now) dateB.setFullYear(now.getFullYear() + 1);
                return dateA - dateB;
            });
        } else {
            App.changeTab('netos'); // Fallback to default tab
            return;
        }

        if (membersToRender.length > 0) {
           membersToRender.forEach(member => container.appendChild(this.createCard(member)));
        } else if (!searchFilter) {
           this.showLoadingSkeleton(); // Show skeleton if data is loading
        }
    },

    createCard(member) {
        const today = new Date();
        const [year, month, day] = member.data.split('-').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const age = App.calculateAge(member.data);
        const isBirthday = birthDate.getDate() === today.getDate() && birthDate.getMonth() === today.getMonth();

        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${member.id}`;

        let cardContent = '';
        if (isBirthday) {
            card.classList.add('birthday-highlight');
            cardContent += `<div class="birthday-message">🎉 Feliz Aniversário! 🎉</div>`;
            this.triggerConfetti(card);
        }
        
        cardContent += `
            <img src="${member.foto}" alt="Foto de ${member.nome}" onerror="this.src='https://i.pravatar.cc/300?u=${member.id}'">
            <div class="name">${member.nome}</div>
            <div class="birthday">${birthDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} - ${age} anos</div>
            <p><strong>Preferências:</strong><br>${member.preferencias || 'Não informado'}</p>
            <p><strong>Quer ganhar:</strong></p>
            <ul>
                ${member.presentes && member.presentes.length > 0 ? member.presentes.map(p => `<li>- ${p}</li>`).join('') : '<li>Não informado</li>'}
            </ul>
            <button class="edit-btn btn">Editar</button>
        `;
        card.innerHTML = cardContent;
        card.querySelector('.edit-btn').addEventListener('click', () => App.openModal(member));
        return card;
    },

    triggerConfetti(element) {
        setTimeout(() => {
            if (typeof confetti !== 'undefined') {
                const rect = element.getBoundingClientRect();
                const x = (rect.left + rect.right) / 2 / window.innerWidth;
                const y = (rect.top + rect.bottom) / 2 / window.innerHeight;
                confetti({ particleCount: 150, spread: 90, origin: { x, y } });
            }
        }, 500);
    },

    updateActiveTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        if (tab) {
            const activeTabEl = document.querySelector(`.tab[data-tab="${tab}"]`);
            if (activeTabEl) activeTabEl.classList.add('active');
        }
    },
    
    renderCountdown(nextBirthday) {
        const countdownEl = document.getElementById('countdown');
        if (!nextBirthday) {
            countdownEl.innerHTML = 'Nenhum próximo aniversário encontrado.';
            return;
        }

        const now = new Date();
        const birthDate = new Date(nextBirthday.data);
        birthDate.setFullYear(now.getFullYear());
        if (birthDate < now) {
            birthDate.setFullYear(now.getFullYear() + 1);
        }

        const diff = birthDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownEl.innerHTML = `Próximo aniversário: <strong>${nextBirthday.nome}</strong> em ${days}d ${hours}h ${minutes}m ${seconds}s`;
    },

    openModal(member) {
        const modal = document.getElementById('editModal');
        const title = document.getElementById('modalTitle');
        
        // Reset form
        document.getElementById('editForm').reset();
        document.getElementById('imagePreview').src = '';
        document.getElementById('editDocId').value = '';

        if (member) { // Editing
            title.innerText = `Editar ${member.nome}`;
            document.getElementById('editDocId').value = member.id;
            document.getElementById('editNome').value = member.nome;
            document.getElementById('editData').value = member.data;
            document.getElementById('editCategoria').value = member.categoria;
            document.getElementById('imagePreview').src = member.foto;
            document.getElementById('editPreferencias').value = member.preferencias || '';
            document.getElementById('editPresentes').value = member.presentes ? member.presentes.join('\n') : '';
        } else { // Adding
            title.innerText = 'Adicionar Novo Membro';
            document.getElementById('imagePreview').src = 'https://i.pravatar.cc/300';
             // Show all fields for new member
            document.getElementById('editNome').style.display = 'block';
            document.getElementById('editData').style.display = 'block';
            document.getElementById('editCategoria').style.display = 'block';
        }
        
        // Hide fields that are not editable
        document.getElementById('editNome').style.display = App.isEditing ? 'none' : 'block';
        document.getElementById('editData').style.display = App.isEditing ? 'none' : 'block';
        document.getElementById('editCategoria').style.display = App.isEditing ? 'none' : 'block';

        modal.style.display = 'block';
    },

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('editForm').reset();
        App.newImageFile = null;
    },

    setButtonLoading(button, isLoading, loadingText = '...') {
        const originalText = button.dataset.originalText || button.innerText;
        if (!button.dataset.originalText) button.dataset.originalText = button.innerText;
        
        button.disabled = isLoading;
        if (isLoading) {
            button.innerText = loadingText;
        } else {
            button.innerText = originalText;
        }
    }
};

// --- INITIALIZE THE APP ---
document.addEventListener('DOMContentLoaded', () => App.init());
