# Trial Balloon Taiwan

Trial Balloon Taiwan ( TBT ) is a news analysis website. TBT executes web-crawling automatically, and analyzes Taiwan political news by Google NLP API everyday, users can know which media is trying to spin control on public opinion and media's political standpoint in Taiwan.

Website URL : <https://trialballoontw.co>

## Table of Contents

- [Technologies](#Technologies)
- [Architecture](#Architecture)
- [Database Schema](#Database-Schema)
- [Demonstration](#Demonstration)
  - [News Comparision](#News-Comparision)
  - [Media Comparision](#Media-Comparision)
  - [Reporter Comparision](#Reporter-Comparision)
- [Contact](#Contact)

## Technologies

### Backend

- Node.js / Express.js
- Web Crawler ( cheerio、puppeteer )
- CI / CD ( Jenkins )
- Docker
- SSL Certificate ( Let's Encrypt )

### Front-End

- HTML
- CSS
- JavaScript
- AJAX
- Chart.js

### Database

- MySQL
- Redis

### Cloud Service ( AWS )

- EC2

### Networking

- HTTP & HTTPS
- Domain Name System ( DNS )
- NGINX

### Test

- Unit Test : Jest
- Load Test : Artillery

### Additional

- Google NLP API
- Git / Github

## Architecture

<p align="center">
 <img src="https://i.imgur.com/AYlq91l.png" width="800">
</p>

- Server side :
  - When developer finishs commits and push to github, Jenkins is triggered by Github web-hook. Jenkin pulls github code, executes the shell script, rebuild the docker and restart app on EC2.
  - Automatically execute web crawler every two hours to ensure the information is up-to-date.
  - Analyze news by Google NLP API and nodejieba, and save the result into database.
  - If something wrong with web-crawling, server will send the email to developer by nodemailer.
- Client side :
  - After receiving requests from client, NGINX forwards requests to the corresponding ports.

## Database Schema

<p align="center">
 <img src="https://i.imgur.com/4QqNBrz.png" width="800">
</p>

## Main Features

- News Comparision
  - Compare the specific event that how the media describes that news.
  - According to the score and magnitude analyzed by Google NLP API, user can know how the media describe the specific event.
  - If the news is not that users want, users can switch to other news and get the relative analysis.
- Media Comparision
  - According to the score and magnitude analyzed by Google NLP API, user can know how the media describes the keyword-related news and know the relationship between keyword-related news and time.
  - User can get every media's news that relate to the specific keywords.
- Reporter Comparision
  - According to the score and magnitude analyzed by Google NLP API, user can know how the reporter describes the keyword-related news and know the relationship between keyword-related news and time.
  - User can get every reporter's news that relate to the specific keywords.

## Demonstration

### News Comparision

<p align="center">
 <img src="https://i.imgur.com/iCD9F6S.gif" width="800">
</p>

- Uers can spcific the query time, the maximum query time is three months.
- One or multiple keywords is available.
- If the default news is not users' searching for, users can switch news below the information table.

### Media Comparision

<p align="center">
 <img src="https://i.imgur.com/xnMS3vB.gif" width="800">
</p>

- Uers can spcific the query time, the maximum query time is six months.
- One or multiple keywords is available.
- Users can switch monthly chart into daily chart.
- News that relate to the keywords are listed below.

### Reporter Comparision

<p align="center">
 <img src="https://i.imgur.com/EPrOWSu.gif" width="800">
</p>

- Media is sellective, and users can choose its reporter.
- Uers can spcific the query time, the maximum query time is six months.
- One or multiple keywords is available.
- Users can switch monthly chart into daily chart.
- News that relate to the keywords written by the reporter are listed below.

## Contact

### E-mail : yhhuang1992@gmail.com
