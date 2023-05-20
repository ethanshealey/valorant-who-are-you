import React from 'react'
import LiveMatchCard from './LiveMatchCard'

const LiveMatch = (props) => {
  return (
    <div id="match-wrapper">
        <div id="blue-team">
            {
                props.match.Blue.map(player => (
                    <LiveMatchCard player={player} />
                ))
            }
        </div>
        <div id="red-team">
            {
                props.match.Red.map(player => (
                    <LiveMatchCard player={player} />
                ))
            }
        </div>
    </div>
  )
}

export default LiveMatch