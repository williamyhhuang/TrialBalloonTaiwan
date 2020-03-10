/* eslint-disable camelcase */
const news = [
  {
    media: 'cna',
    date: '2020-01-01',
    title: 'hello world1',
    url: 'http://abc.com.tw/hello_world1',
    score: '0.5',
    magnitude: '5',
  },
  {
    media: 'ltn',
    date: '2020-01-01',
    title: 'hello world2',
    url: 'http://abc.com.tw/hello_world2',
    score: '0.5',
    magnitude: '5',
  },
  {
    media: 'chtimes',
    date: '2020-01-01',
    title: 'hello world3',
    url: 'http://abc.com.tw/hello_world3',
    score: '0.5',
    magnitude: '5',
  },
];

const article = [
  {
    article: 'hello world1',
    news_url: 'http://abc.com.tw/hello_world1',
    tokenize: 'hello, world1',
  },
  {
    article: 'hello world2',
    news_url: 'http://abc.com.tw/hello_world2',
    tokenize: 'hello, world2',
  },
  {
    article: 'hello world3',
    news_url: 'http://abc.com.tw/hello_world3',
    tokenize: 'hello, world3',
  },
];

const keyword = [
  {
    keyword: 'hello',
    news_id: 1,
    add_in_dict: 'no',
  },
  {
    keyword: 'world1',
    news_id: 1,
    add_in_dict: 'no',
  },
  {
    keyword: 'hello',
    news_id: 2,
    add_in_dict: 'no',
  },
  {
    keyword: 'world2',
    news_id: 2,
    add_in_dict: 'no',
  },
  {
    keyword: 'hello',
    news_id: 3,
    add_in_dict: 'no',
  },
  {
    keyword: 'world3',
    news_id: 3,
    add_in_dict: 'no',
  },
];

const reporter = [
  {
    name: 'cna_reporter',
    media: 'cna',
  },
  {
    name: 'ltn_reporter',
    media: 'ltn',
  },
  {
    name: 'chtimes_reporter',
    media: 'chtimes',
  },
];

const reporter_has_news = [
  {
    reporter_id: 1,
    news_id: 1,
  },
  {
    reporter_id: 2,
    news_id: 2,
  },
  {
    reporter_id: 3,
    news_id: 3,
  },
];

module.exports = {
  news,
  article,
  keyword,
  reporter,
  reporter_has_news,
};
