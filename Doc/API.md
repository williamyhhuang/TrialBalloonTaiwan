# Trial Balloon Taiwan API Doc.

## Host Name

<p>trialballoontw.co</p>

## Response Object

* `News Object`

| Field | Type | Description |
| :---: | :---: | :--- |
| date | String | News publish date|
| title | String | News title |
| media | String | News media |
| reporter| String | News reporter |
| score | String | Score analyzed by Google NLP API |
| magnitude | String | Magnitude analyzed by Google NLP API |
| url | String | News URL |

* `News of Media Object`

| Field | Type | Description |
| :---: | :---: | :--- |
| media | Object | Object of `News Object`|

* `MonthSet Object`

| Field | Type | Description |
| :---: | :---: | :--- |
| monthSet | Array | Categorize data as month |

* `MonthSet Object`

| Field | Type | Description |
| :---: | :---: | :--- |
| dateSet | Array | Categorize data as date |

* `Data Sort as Time Object`

| Field | Type | Description |
| :---: | :---: | :--- |
| month / date | Object | Object of `Data Object` |

* `Data Object`

| Field | Type | Description |
| :---: | :---: | :--- |
| news | Array | Array of `News Object` |
| totalScore | String | Total score of news for each month / date |
| totalMag | String | Total magnitude of news for each month / date |

* `Reporter Object`

### News API

* **End Point :** `/news`
* **Method :** `GET`
* **Query Parameters**

| Field | Type | Description |
| :---: | :---: | :--- |
| start | String | Required |
| end | String | Required |
| keyword | String | Required |

* **Request Example:**

`https://[HOST_NAME]/api/news?search?keyword=台灣&start=2020-01-01&end=2020-01-15`  
`https://[HOST_NAME]/api/news?search?keyword=台灣+蔡英文&start=2020-01-01&end=2020-01-15`  

* **Success Response: 200**

| Field | Type | Description |
| :---:| :---: | :--- |
| start | String | Start of search time |
| end | String  | End of search time |
| keyword | String  | Search keywords |
| result | Array | Array of `News of Media Object`

* **Success Response Example:**

``` javascript
{
  start: "2020-01-01",
  end: "2020-01-15",
  keyword: "台灣",
  result: [
    {
      chtimes:{
        date: "2020-01-03",
​​​​        title: "呂玉玲未到　蔣絜安猛攻 要選民停止家族政治",
​​​​        media: "中時電子報",
​​​​        reporter: "甘嘉雯",
​​​​        score: "0.00",
​​​        magnitude: "4.40",
​​        url: "https://www.chinatimes.com/realtimenews/20200103003395-260407",
      },
      cna:{
        date: "2020-01-08",
        ​​​​title: "高雄5選區  藍綠爭搶三民區客家票源",
        ​​​​media: "中央社",
        ​​​​reporter: "陳朝福 王淑芬",
        ​​​​score: "0.50",
        magnitude: "6.50",
        ​​​​url: "https://www.cna.com.tw/news/aipl/202001080351.aspx",
      },
      ltn:{
        date: "2020-01-12",
        ​​​​title: "勝選關鍵 李昆澤：市民要找回高雄的尊嚴及光榮",
        ​​​​magnitude: "2.50",
        ​​​​media: "自由電子報",
        ​​​​reporter: "方志賢",
        ​​​​score: "0.20",
        ​​​​url: "https://news.ltn.com.tw/news/politics/breakingnews/3038250",
      },
    },
  ]
}
```

### Media API

* **End Point :** `/media`
* **Method :** `GET`
* **Query Parameters**

| Field | Type | Description |
| :---: | :---: | :--- |
| start | String | Required |
| end | String | Required |
| keyword | String | Required |

* **Request Example:**

`https://[HOST_NAME]/api/media?search?keyword=台灣&start=2020-01-01&end=2020-01-01`  
`https://[HOST_NAME]/api/media?search?keyword=台灣+蔡英文&start=2020-01-01&end=2020-01-01`  

* **Success Response: 200**

| Field | Type | Description |
| :---:| :---: | :--- |
| start | String | Start of search time |
| end | String  | End of search time |
| keyword | String  | Search keywords |
| monthSet | Array  | Array of search month  |
| dateSet | Array  | Array of search date |
| result | Array | Object of `Data Sort as Time Object`

* **Success Response Example:**

``` javascript
{
  start: "2020-01-01",
  end: "2020-01-01"
  keyword: "台灣",
  monthSet: [
    "2020-01"
  ],
  dateSet: [
    "2020-01-01",
    "2020-01-02",
  ],
  result: {
    cna: [
      {
        2020-01: {
          news:[
            {
              media: "中央社",
              date: "2020/01/01",
              title: "總統：兩岸重啟交流互動 設時間表不可能也不智",
              url: "https://www.cna.com.tw/news/aipl/202001010052.aspx",
              score: "0.20000000298023224",
              magnitude: "6.800000190734863",
            }
          ],
          totalScore: "0.20000000298023224",
          totalMag: "6.800000190734863",
        }
      },
      {
        2020-01-01: {
          news:[
            {
              media: "中央社",
              date: "2020/01/01",
              title: "總統：兩岸重啟交流互動 設時間表不可能也不智",
              url: "https://www.cna.com.tw/news/aipl/202001010052.aspx",
              score: "0.20000000298023224",
              magnitude: "6.800000190734863",
            }
          ],
          totalScore: "0.20000000298023224",
          totalMag: "6.800000190734863",
        },
      }
    ],
    chtimes: [
      {
        2020-01: {
          news:[
            {
              media: "中時電子報",
              date: "2020/01/01",
              title: "呂玉玲未到　蔣絜安猛攻 要選民停止家族政治",
              url: "https://www.chinatimes.com/realtimenews/20200103003395-260407",
              score: "0",
              magnitude: "4.400000095367432",
            }
          ],
          totalScore: "0",
          totalMag: "4.400000095367432",
        }
      },
      {
        2020-01-01: {
          news:[
            {
              media: "中時電子報",
              date: "2020/01/01",
              title: "呂玉玲未到　蔣絜安猛攻 要選民停止家族政治",
              url: "https://www.chinatimes.com/realtimenews/20200103003395-260407",
              score: "0",
              magnitude: "4.400000095367432",
            }
          ],
          totalScore: "0",
          totalMag: "4.400000095367432",
        },
      }
    ],
    ltn: [
      {
        2020-01: {
          news:[
            {
              media: "自由電子報",
              date: "2020/01/01",
              title: "台大教授被政府查水表？ 賴清德：這樣的指控非常嚴重",
              url: "https://news.ltn.com.tw/news/politics/breakingnews/3026889",
              score: "-0.20000000298023224",
              magnitude: "1.899999976158142",
            }
          ],
          totalScore: "-0.20000000298023224",
          totalMag: "1.899999976158142",
        }
      },
      {
        2020-01-01: {
          news:[
            {
              media: "自由電子報",
              date: "2020/01/01",
              title: "台大教授被政府查水表？ 賴清德：這樣的指控非常嚴重",
              url: "https://news.ltn.com.tw/news/politics/breakingnews/3026889",
              score: "-0.20000000298023224",
              magnitude: "1.899999976158142",
            }
          ],
          totalScore: "-0.20000000298023224",
          totalMag: "1.899999976158142",
        },
      }
    ],
  }
}
```

### Reporter API

* **End Point :** `/reporter`
* **Method :** `GET`
* **Query Parameters**

| Field | Type | Description |
| :---: | :---: | :--- |
| start | String | Required |
| end | String | Required |
| media1 | String | Required |
| reporter1 | String | Required |
| media2 | String | Required |
| reporter2 | String | Required |

* **Request Example:**

`https://[HOST_NAME]/api/reporter?media1=cna&reporter1=顧荃&media2=chtimes&reporter2=CTWANT&keyword=台灣&start=2020-01-01&end=2020-02-28`  
`https://[HOST_NAME]/api/reporter?media1=cna&reporter1=顧荃&media2=chtimes&reporter2=CTWANT&keyword=台灣+蔡英文&start=2020-01-01&end=2020-02-28`  

* **Success Response: 200**

| Field | Type | Description |
| :---:| :---: | :--- |
| start | String | Start of search time |
| end | String  | End of search time |
| keyword | String  | Search keywords |
| reporter1 | Array | Array of reporter's information |
| reporter2 | Array | Array of reporter's information |
| monthSet | Array  | Array of search month  |
| dateSet | Array  | Array of search date |
| result | Array | Object of `Data Sort as Time Object`

* **Success Response Example:**

```javascript
{
  start: "2020-01-01",
  end: "2020-01-01",
  keyword: "台灣",
  reporter1:[
    "cna",
    "顧荃",
  ],
  reporter2: [
    "chtimes",
    "CTWANT",
  ],
  monthSet: [
    "2020-01"
  ],
  dateSet: [
    "2020-01-01",
  ],
  result: {
    reporter1: [
      2020-01:{
        news: [
          {
            media: "中央社",
            date: "2020-01-01",
            title: "總統：兩岸重啟交流互動 設時間表不可能也不智",
            score: "0.20000000298023224",
            magnitude: "6.800000190734863",
            url: "https://www.cna.com.tw/news/aipl/202001010052.aspx",
          }
        ],
        totalScore: "0.20000000298023224",
        totalMag: "6.800000190734863",
      },
      2020-01-01:{
        news: [
          {
            media: "中央社",
            date: "2020-01-01",
            title: "總統：兩岸重啟交流互動 設時間表不可能也不智",
            score: "0.20000000298023224",
            magnitude: "6.800000190734863",
            url: "https://www.cna.com.tw/news/aipl/202001010052.aspx",
          }
        ],
        totalScore: "0.20000000298023224",
        totalMag: "6.800000190734863",
      }
    ],
    reporter2:[
      2020-01:{
        news: [
          {
            media: "中時電子報",
            date: "2020-01-01",
            title: "武漢包機回台出包 蘇貞昌：下不為例",
            score: "0.20000000298023224",
            magnitude: "6.800000190734863",
            url: "https://www.chinatimes.com/realtimenews/20200206004929-260407",
          }
        ],
        totalScore: "0.20000000298023224",
        totalMag: "2.0999999046325684",
      },
      2020-01-01:{
        news: [
          {
            media: "中時電子報",
            date: "2020-01-01",
            title: "武漢包機回台出包 蘇貞昌：下不為例",
            score: "0.20000000298023224",
            magnitude: "6.800000190734863",
            url: "https://www.chinatimes.com/realtimenews/20200206004929-260407",
          }
        ],
        totalScore: "0.20000000298023224",
        totalMag: "2.0999999046325684",
      }
    ]
  }
}
```
