---
title: Display Highscores on the web page
author: pribluda
date: 2021-03-04
template: article.pug
lang: en
tags: android, java,  spring,  webservice, docker, apache , mod_proxy
description: Highscores 
---

Highscores are displayed in game. Why not on the web page?  Let's do small react app.

<span class="more">
</span>

Highscore system runs in bckend and it is basically a webservice exporting all tha data as json:

- (https://www.pribluda.de:8443/public/scores?since=0)

But as you can see, modern browsers do not trust my self signed server certificate (which is enough for game purposes, as android app trusts it explicitely and vice versa).  This means, javascript  will be unable to  fetch this data and display it - because modern browsers protect you from potentially harmful material.

However,  my webserver itself uses trustworthy certificates  and as I am in full control  I can easily sanitise my API for javascirpt use

###  Sanitizing API with proxy

Apache  HTTPD can take incoming URL  and redirect request to some other server (in my case - highscore API) - completely transparent to outside world.   First we have to enable modules for proxying:

````shell
 a2enmod proxy
 a2enmod proxy_http
````

And  following goes into virtual host section serving my website:

````shell

SSLProxyEngine On
SSLProxyVerify none
SSLProxyCheckPeerCN off
SSLProxyCheckPeerName off
SSLProxyCheckPeerExpire off

ProxyAddHeaders off
ProxyPreserveHost off


ProxyPass "/api/lines/public/"  "https://localhost:8443/public/"
ProxyPassReverse "/api/lines/public/"  "https://localhost:8443/public/"
````
And after a server restart  browser does not complain anymore:

- (https://pribluda.de/api/lines/public/scores?since=0)

## Small react app

Assuming that all the necessary tools are installed we  just create small react app:

```shell
 npx lines-highscore
 cd lines-highscore
```


And start coding [src/App.js](https://github.com/ko5tik/pribluda.de/blob/master/lines-highscore/src/App.js)

```javascript
import React from "react";
import * as moment from "moment";

//  API endpoints 
const scores = 'https://www.pribluda.de/api/lines/public/scores?since=0';
const stats = 'https://www.pribluda.de/api/lines/public/stats';

class App extends React.Component {
    constructor(props) {
        super(props);
        // initial state
        this.state = {
            scores: [],
            stats: {
                totalGames: 0,
                totalTime: 0
            }
        }
    }
    //  fetch data from backend
    componentDidMount() {
        fetch(scores)
            .then(response => response.json())
            .then(data => this.setState({scores: data}));

        fetch(stats)
            .then(response => response.json())
            .then(data => this.setState({stats: data}));
    }
    // and render it
    render() {
        const {scores} = this.state

        return (
            <div id="highscores">
                <dl id="stats" >
                    <dt>Total games:</dt>
                    <dd>{this.state.stats.totalGames}</dd>
                    <dt>Total time spent (D:H:M:S) :</dt>
                    <dd>{msToTime(this.state.stats.totalTime)}</dd>
                </dl>
                <table className="scoreTable">
                    <thead className="header">
                    <tr>
                        <td className="rightAligned">#</td>
                        <td>Name</td>
                        <td>Points</td>
                        <td>Time spent</td>
                        <td>Date</td>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        // just render score entries
                        scores.map(function (score, idx) {
                                return (
                                    <tr className={idx % 2 == 0 ? 'even' : 'odd'}>
                                        <td className="rightAligned">{idx + 1}.</td>
                                        <td>{score.name}</td>
                                        <td className="rightAligned">{score.points}</td>
                                        <td className="rightAligned">{msToTime(score.duration)}</td>
                                        <td className="rightAligned">{msToDate(score.time)}</td>
                                    </tr>
                                )
                            }
                        )
                    }
                    </tbody>
                </table>
            </div>
        )
    }

}
function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) %24),
        days = Math.floor((duration / (1000 * 60 * 60 *24 )));

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return  days + ":" + hours + ":" + minutes + ":" + seconds ;
}
function msToDate(s) {
    return moment.unix(s / 1000).format("DD MMM YYYY hh:mm a")
}

export default App;
```

Full source is available on github:  (https://github.com/ko5tik/pribluda.de/tree/master/lines-highscore)

### Result

And after we have build it with *npm build*   we can put it into web page. And now everybody can see  actual highscores
 - (https://www.pribluda.de/android/lines/highscore.html)
