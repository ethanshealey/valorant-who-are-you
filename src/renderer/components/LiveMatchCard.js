import React from 'react'

const LiveMatchCard = (props) => {
  return (
    <div id="stats-player-card">
        <div class="stats-player-card-left">
            <img src={require(`../images/agents/${props.player.character.toLowerCase()}.png`)} width="75px" style={{ borderRadius: "2.5px" }} />
            <div class="stats-player-name-and-level">
                {
                    props.player.name ? <h2>{props.player.name}<span>#{props.player.tag}</span></h2> : <h2>unknown</h2>
                }
            </div>
            <div class="stats-player-card-right">
                <img src={require(`../images/ranks/${props.player.rank.toLowerCase()}.png`)} width="50px" />
            </div>
        </div>
    </div>
  )
}

export default LiveMatchCard