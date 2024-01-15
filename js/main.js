const API_KEY = '72716811ab374744ac630cbcfb3818e5';
const choicesElem = document.querySelector('.js-choice');
const formSearch = document.querySelector('.form-search');
const title = document.querySelector('.title');
const topList = document.querySelector('.top-list');
const latestList = document.querySelector('.latest-list');

const declOfNum = (n, titles) => titles[n % 10 === 1 && n % 100 !== 11 ?
  0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];

const select = new Choices(choicesElem, {
  searchEnabled: false,
  itemSelectText: '',
});

const currentDate = (dateNow) => {
  const day = String(dateNow.getDate()).padStart(2, '0');
  const month = String(dateNow.getMonth() + 1).padStart(2, '0');
  const year = dateNow.getFullYear();
  return `${day}.${month}.${year}`;
};

const getDateCorrectFormat = (isoDate) => {
  const date = new Date(isoDate);
  const fullDate = date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day:'2-digit',
  });
  const fullTime = date.toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <span class="news-date">${fullDate}</span> ${fullTime}
  `;
};  

const getData = (error, url) => fetch(url, {
  headers: {
    'X-Api-Key': API_KEY,
  }
}).then(response => {
  if (!response.ok) {
    throw error(new Error(response.status));
  }

  return response.json();
}).catch(error);

const getImage = url => new Promise((resolve) => {
  const image = new Image(250, 200);

  image.addEventListener('load', () => {
    resolve(image);
  });

  image.addEventListener('error', () => {
    image.src = 'img/no-img.jpg';
    resolve(image);
  });

  image.src = url || '';
  image.classList.add('news-image');
  return image;
});

const renderCard = (data, selector) => {
  selector.textContent = '';

  data.forEach(async ({urlToImage, title, url, description, publishedAt, author}) => {
    const newsItem = document.createElement('li');
    newsItem.classList.add('news-item');

    const image = await getImage(urlToImage);
    image.alt = title;

    newsItem.append(image);

    newsItem.insertAdjacentHTML('beforeend', `
      <h3 class="news-title"><a class="news-link" href="${url}" target="_blank" rel="noopener">${title || ''}</a></h3>
      
      <p class="news-description">${description || ''}</p>
      
      <div class="news-footer">
        <time class="news-datetime" datetime="${publishedAt}">
          ${getDateCorrectFormat(publishedAt)}
        </time>

        <p class="news-author">${author || ''}</p>
      </div>
    `);
    
    selector.append(newsItem);
  });
};

const showError = (err) => {
  console.warn(err);
  topList.textContent = '';
  latestList.textContent = '';
  title.style.color = '#ff0202';
  title.textContent = 'Произошла ошибка, попробуйте позже';
};

const loadNews = async (count, selector) => {
  title.textContent = `Новости на сегодня ${currentDate(new Date())}`;
  selector.innerHTML = `<li class="preload"></li>`;

  const country = localStorage.getItem('country') || 'ru';

  select.setChoiceByValue(country);

  const data = await getData(showError, `https://newsapi.org/v2/top-headlines?category=science&country=${country}&pageSize=${count}`);
  renderCard(data.articles, selector);
};

const loadSearch = async (value, selector) => {
  selector.innerHTML = `<li class="preload"></li>`;
  const data = await getData(showError, `https://newsapi.org/v2/everything?q=${value}&pageSize=8`);
  const arrStr1 = ['найден', 'найдено', 'найдено'];
  const arrStr2 = ['новость', 'новости', 'новостей'];
  const count = data.articles.length;

  title.textContent = `По вашему запросу "${value}" ${declOfNum(count, arrStr1)} ${count} ${declOfNum(count, arrStr2)}`;
  select.setChoiceByValue('');
  renderCard(data.articles, topList);
};

choicesElem.addEventListener('change', (event) => {
  const value = event.detail.value;
  localStorage.setItem('country', value);
  loadNews(12, topList);
  loadNews(4, latestList);
});

formSearch.addEventListener('submit', (event) => {
  event.preventDefault();
  
  Promise.all([
    loadSearch(formSearch.search.value, topList),
    loadNews(4, latestList),
  ]);

  formSearch.reset();
});

loadNews(12, topList);
loadNews(4, latestList);