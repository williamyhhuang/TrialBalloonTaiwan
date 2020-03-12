const db = require('../scripts/webCrawler/webCrawler_db');

test('insert data test', () => {
  const data = {
    media: 'cna',
    date: '2020-01-02',
    url: 'https://cna.com/test',
    title: 'hello world4',
    author: '邱',
    article: 'hello world4',
    tokenize: 'hello, world4',
    score: '0.5',
    magnitude: '5',
    keyword: ['hello', 'world'],
  };
  return db.insert(data).then((result) => {
    expect(result).toBe(true);
  });
});

