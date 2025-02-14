"use strict";

import SearchBox from './components/search-box/search-box.js';
import CardsList from './components/card-list/cards-list.js';
import DoubleSlider from './components/double-slider/double-slider.js';
import Pagination from './components/pagination/pagination.js';
import SideBar from './components/side-bar/side-bar.js';
import Cart from './components/cart/cart.js';
import { API } from './API/api.js';

export const BACKEND_URL = 'https://online-store.bootcamp.place/api/';

class OnlineStorePage {
  state = {
    pageNumber: 1,
    pageSize: 9,
    categories: [],
    brands: [],
    lowerPrice: 0,
    higherPrice: 85000,
    lowerRating: 0,
    higherRating: 5,
    search: '',
    productsInCart: {}
  };

  constructor () {
    this.products = [];
    this.components = {};

    this.initComponents();
    this.render();
    this.renderComponents();

    this.initEventListeners();

    this.updateProducts();
  }

  getTeamplate () {
    return  `
      <div class="container">
        <header>
          <div class="header-wrapper">
            <div class="logo">Online Store</div>
            <button class="button-cart" data-element="cartBtn">
              <i class="icon-cart"></i>
              CART
              <span class="counter" data-element="counter"></span>
            </button>
          </div>
        </header>
        <div class="row">
          <div class="col-12 col-s-6 col-l-3">
            <div class="side-bar" data-element="sideBar">
              <button class="button-clear" data-element="clearFilters">CLEAR ALL FILTERS</button>
            </div>
          </div>
          <div class="col-12 col-s-6 col-l-9">
            <div class="search-box" data-element="searchBox"></div>
            <div class="card-list__wrapper" data-element="cardsList"></div>
            <div data-element="pagination"></div>
          </div>
        </div>
      </div>
    `;
  }

  initComponents () {
    const totalElements = 100;
    const totalPages = Math.ceil(totalElements / this.state.pageSize);

    const cardList = new CardsList(this.products);
    const pagination = new Pagination({
      activePageIndex: 0,
      totalPages: totalPages
    });
    const sideBar = new SideBar();
    const doubleSlider = new DoubleSlider();
    const searchBox = new SearchBox();
    const cart = new Cart(this.state.productsInCart);

    this.components.cardList = cardList;
    this.components.pagination = pagination;
    this.components.sideBar = sideBar;
    this.components.doubleSlider = doubleSlider;
    this.components.searchBox = searchBox;
    this.components.cart = cart;
  }

  render () {
    const element = document.createElement('div');

    element.innerHTML = this.getTeamplate();

    this.element = element;
  }

  renderComponents () {
    const cardsContainer = this.element.querySelector('[data-element="cardsList"]');
    const paginationContainer = this.element.querySelector('[data-element="pagination"]');
    const sideBarContainer = this.element.querySelector('[data-element="sideBar"]');
    const searchBoxContainer = this.element.querySelector('[data-element="searchBox"]');


    cardsContainer.append(this.components.cardList.element);
    paginationContainer.append(this.components.pagination.element);
    sideBarContainer.prepend(this.components.sideBar.element);
    searchBoxContainer.append(this.components.searchBox.element);
    this.element.append(this.components.cart.element);
  }

  initEventListeners () {
    this.components.pagination.element.addEventListener('page-changed', event => {
      const pageIndex = event.detail;

      this.state.pageNumber = pageIndex + 1;
      this.updateProducts();
    });

    this.components.sideBar.element.addEventListener('categories-selection', event => {
      const categories = event.detail;

      this.state.categories = categories;
      this.updateProducts();
    });

    this.components.sideBar.element.addEventListener('brands-selection', event => {
      const brands = event.detail;

      this.state.brands = brands;
      this.updateProducts();
    });

    this.components.searchBox.element.addEventListener('input-text', event => {
      const text = event.detail;

      this.state.search = text;
      this.updateProducts();
    });

    document.addEventListener('lowerPrice-selection', event => {
      const lowerPrice = event.detail;

      this.state.lowerPrice = lowerPrice;
      this.updateProducts();
    });

    document.addEventListener('higherPrice-selection', event => {
      const higherPrice = event.detail;

      this.state.higherPrice = higherPrice;
      this.updateProducts();
    });

    document.addEventListener('lowerRating-selection', event => {
      const lowerRating = event.detail;

      this.state.lowerRating = lowerRating;
      this.updateProducts();
    });

    document.addEventListener('higherRating-selection', event => {
      const higherRating = event.detail;

      this.state.higherRating = higherRating;
      this.updateProducts();
    });

    document.addEventListener('add-product', event => {
      const id = event.detail.id;

      if (this.state.productsInCart[id]) {
        this.state.productsInCart[id].quantity += 1;
      } else {
        this.state.productsInCart[id] = {
          quantity: 1,
          product: event.detail
        };
      }

      this.renderBtnCounter();
    });

    document.addEventListener('minus-selection', event => {
      const id = event.detail;

      if (this.state.productsInCart[id] && this.state.productsInCart[id].quantity > 1) {
        this.state.productsInCart[id].quantity -= 1;

        this.components.cart.renderCartsCards();
      } else {
        delete this.state.productsInCart[id];

        this.components.cart.renderCartsCards();
      }

      this.renderBtnCounter();
    });

    document.addEventListener('plus-selection', event => {
      const id = event.detail;

      this.state.productsInCart[id].quantity += 1;

      this.components.cart.renderCartsCards();
      this.renderBtnCounter();
    })

    const rootElement = document.getElementById('root');

    rootElement.addEventListener('click', event => {
      if (event.target.dataset.element === 'clearFilters') {
        this.clearFilters();
      }
    });

    const cartBtn = this.element.querySelector('[data-element="cartBtn"]');
    const cart = this.components.cart.element.querySelector('[data-element="cart"]');

    cartBtn.addEventListener('click', () => {
      cart.classList.remove('hidden');
      this.components.cart.renderCartsCards();
    });
  }

  renderBtnCounter () {
    const quantity = Object.values(this.state.productsInCart)
                           .map(item => item.quantity)
                           .reduce((prev, curr) => prev + curr, 0);

    const counter = this.element.querySelector('[data-element="counter"]');

    if (quantity > 0) {
      counter.textContent = quantity;
    } else {
      counter.textContent = '';
    }
  }

  getUrlWithParams () {
    const productsUrl = new URL('products', BACKEND_URL);
    const { pageSize, pageNumber } = this.state;

    productsUrl.searchParams.set('_page', String(pageNumber));
    productsUrl.searchParams.set('_limit', String(pageSize));

    const { categories } = this.state;
    if (categories.length) {
      categories.forEach(category => {
        productsUrl.searchParams.append('category', category);
      });
    }

    const { brands } = this.state;
    if (brands.length) {
      brands.forEach(brand => {
        productsUrl.searchParams.append('brand', brand);
      });
    }

    const { lowerPrice } = this.state;
    productsUrl.searchParams.append('price_gte', String(lowerPrice));

    const { higherPrice } = this.state;
    productsUrl.searchParams.append('price_lte', String(higherPrice));

    const { lowerRating } = this.state;
    productsUrl.searchParams.append('rating_gte', String(lowerRating));

    const { higherRating } = this.state;
    productsUrl.searchParams.append('rating_lte', String(higherRating));

    const { search } = this.state;
    if (search.length) {
      productsUrl.searchParams.append('q', search);
    }

    return productsUrl;
  }

  async updateProducts () {
    const url = this.getUrlWithParams();
    const products = await API.loadProducts(url);

    this.components.cardList.update(products);
  }

  clearFilters () {
    this.state.categories = [];
    this.state.brands = [];
    this.state.lowerPrice = 0;
    this.state.higherPrice = 85000;
    this.state.lowerRating = 0;
    this.state.higherRating = 5;
    this.state.search = '';
    this.components.searchBox.element.querySelector('.search-box__search').value = '';

    const allInputs = this.components.sideBar.element.querySelectorAll('input');
    allInputs.forEach(input => {
      input.checked = false;
    });

    if (this.state.pageNumber === 1) {
      this.updateProducts();
    } else {
      this.components.pagination.clearPagination();
    }
  }
}

const page = new OnlineStorePage();

const rootElement = document.querySelector('#root');
rootElement.append(page.element);
