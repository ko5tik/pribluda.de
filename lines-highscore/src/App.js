import React from "react";
import * as moment from "moment";


const scores = 'https://www.pribluda.de:8443/public/scores?since=0';
const stats = 'https://www.pribluda.de:8443/public/stats';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            scores: [],
            stats: {
                totalGames: 0,
                totalTime: 0
            }
        }
    }

    componentDidMount() {
        fetch(scores)
            .then(response => response.json())
            .then(data => this.setState({scores: data}));

        fetch(stats)
            .then(response => response.json())
            .then(data => this.setState({stats: data}));
    }

    render() {
        const {scores} = this.state

        return (
            <div>
                <dl className="header">
                    <dt>Total games:</dt>
                    <dd>{this.state.stats.totalGames}</dd>
                    <dt>Total time spent (D:H:M:S) :</dt>
                    <dd>{msToTime(this.state.stats.totalTime)}</dd>
                </dl>
                <table>
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
                        scores.map(function (score, idx) {
                                return (
                                    <tr className={idx % 2 == 0 ? 'even' : 'odd'}>
                                        <td className="rightAligned">{idx + 1}</td>
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
