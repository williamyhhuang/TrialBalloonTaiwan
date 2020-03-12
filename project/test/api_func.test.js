const func = require('../routes/api/api_func');

test('calcMonth test', () => {
  const start = '2020-01-01';
  const end = '2020-02-01';
  expect(func.calcMonth(start, end)).toStrictEqual({
    '2020-01': {
      news: [],
      totalScore: 0,
      totalMag: 0,
    },
    '2020-02': {
      news: [],
      totalScore: 0,
      totalMag: 0,
    },
  });
});

test('calcDate test', () => {
  const start = '2020-01-01';
  const end = '2020-01-03';
  expect(func.calcDate(start, end)).toStrictEqual({
    '2020-01-01': {
      news: [],
      totalScore: 0,
      totalMag: 0,
    },
    '2020-01-02': {
      news: [],
      totalScore: 0,
      totalMag: 0,
    },
    '2020-01-03': {
      news: [],
      totalScore: 0,
      totalMag: 0,
    },
  });
});

test('categorizeNewsAsMonth test', () => {
  const start = '2020-01-01';
  const end = '2020-01-01';
  const data = [{
    media: 'cna',
    date: '2020-01-01',
    title: 'hello world',
    url: 'https://cna.com/',
    score: '0.1',
    magnitude: '5',
  }];

  expect(func.categorizeNewsAsMonth(start, end, data)).toStrictEqual({
    '2020-01': {
      news: [data[0]],
      totalScore: 0.1,
      totalMag: 5,
    },
  });
});

test('calcSimilarity test', ()=>{
  const str1 = ['a', 'ab', 'abc'];
  const str2 = ['a', 'ab', 'abc'];
  expect(func.calcSimilarity(str1, str2)).toBeCloseTo(1);
});
