import React from 'react'
import norank from '../images/ranks/0.png'
import { getRank } from 'renderer/helpers/ImageHelper'
const HomePlayerCard = (props) => {
  return (
    <div id="home-player-card">
        <div id="home-player-card-left">
            <img src={props?.card} width="75px" style={{ borderRadius: "2.5px" }} />
            <div id="home-player-name-and-level">
              <h2>{props.user?.acct?.game_name}<span>#{props.user?.acct?.tag_line}</span></h2>
              <p>{props?.level}</p>
            </div>
        </div>
        <div id="home-player-card-right">
            {/* {
              props.stats?.current_data.images.small ?
                <div id="home-player-card-right-rank">
                  <img src={props.stats?.current_data.images.small} />
                  <meter id="mmr" value={props.stats?.current_data.ranking_in_tier}min="0" max="100" />
                </div>
                :
                <img src={norank} width="75px" />
            } */}
            <div id="home-player-card-right-rank">
                <img width="70px" src={ getRank(props.rank) } />
            </div>
        </div>
    </div>
  )
}

export default HomePlayerCard