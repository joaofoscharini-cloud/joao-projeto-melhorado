/**
 * Central de Resenhas - Core Engine
 * Módulo completo com Gestão de Estado, Persistência Segura,
 * Event Delegation, Sanitização XSS e Otimização de Performance.
 */

class ReviewApp {
  // Dados padrão imutáveis com datas e IDs únicos
  static DEFAULT_REVIEWS = [
    {
      id: "rev_1",
      title: "Interstellar",
      category: "filme",
      rating: 5,
      imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80",
      tag: "Finais surpreendentes",
      review: "Uma obra-prima da ficção científica. Trilha sonora e visual espetaculares.",
      favorite: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "rev_2",
      title: "Stardew Valley",
      category: "game",
      rating: 5,
      imageUrl: "",
      tag: "Para passar o tempo",
      review: "Extremamente relaxante. Perfeito para jogar ouvindo um podcast no final de semana.",
      favorite: false,
      createdAt: new Date().toISOString()
    }
  ];

  static STORAGE_KEY = 'my_reviews_v2';

  constructor() {
    this.reviews = this.loadFromLocalStorage();
    this.state = {
      filterCategory: 'todos',
      searchQuery: '',
      sortBy: 'newest' // 'newest' | 'oldest' | 'rating_desc' | 'rating_asc' | 'title'
    };

    this.cacheDOM();
    this.bindEvents();
    this.render();
  }

  /**
   * Mapeamento dos elementos DOM essenciais
   */
  cacheDOM() {
    this.dom = {
      grid: document.getElementById('cardsGrid'),
      searchInput: document.getElementById('searchInput'),
      filterButtons: document.querySelectorAll('.filter-btn'),
      sortSelect: document.getElementById('sortSelect'),
      form: document.getElementById('reviewForm'),
      totalCounter: document.getElementById('totalCount'),
      avgRating: document.getElementById('avgRating')
    };
  }

  /**
   * Persistência resiliente com tratamento de erros (try/catch)
   */
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(ReviewApp.STORAGE_KEY);
      if (!saved) return ReviewApp.DEFAULT_REVIEWS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ReviewApp.DEFAULT_REVIEWS;
    } catch (error) {
      console.error('Erro ao ler do localStorage. Restaurando dados padrão:', error);
      return ReviewApp.DEFAULT_REVIEWS;
    }
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem(ReviewApp.STORAGE_KEY, JSON.stringify(this.reviews));
    } catch (error) {
      console.error('Erro ao salvar no localStorage (quota excedida?):', error);
    }
  }

  /**
   * Proteção contra injeção de scripts maliciosos (XSS)
   */
  escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  /**
   * Funções Utilitárias: Debounce para evitar renderizações excessivas na busca
   */
  debounce(func, delay = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Vinculação de Eventos usando Event Delegation
   */
  bindEvents() {
    // 1. Pesquisa por texto com Debounce
    if (this.dom.searchInput) {
      this.dom.searchInput.addEventListener(
        'input',
        this.debounce((e) => {
          this.state.searchQuery = e.target.value.trim().toLowerCase();
          this.render();
        }, 200)
      );
    }

    // 2. Filtros por Categoria
    if (this.dom.filterButtons) {
      this.dom.filterButtons.forEach(btn => {
