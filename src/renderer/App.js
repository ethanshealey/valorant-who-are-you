import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import { useState, useEffect } from 'react'
import Spinner from './components/Spinner';
import HomePlayerCard from './components/HomePlayerCard';

function Main() {

  const [ lockfile, setLockfile ] = useState(undefined)
  const [ user, setUser ] = useState(undefined)
  const [ playerMMR, setPlayerMMR ] = useState(undefined)
  const [ card, setCard ] = useState('')
  const [ level, setLevel ] = useState(0)
  const [ rank, setRank ] = useState(0)

  // Get Lockfile even when screen is
  useEffect(() => {
    window.bridge.requestLockfile()
  }, [])
  
  useEffect(() => {
    window.bridge.requestRSOUserInfo()
    window.bridge.requestPlayerMMR()
  }, [lockfile])

  useEffect(() => {
    if(user) {
      getBasicProfile()
    }
  }, [user])

  useEffect(() => { console.log(rank) }, [rank])

  window.bridge.getLockfile((event, file) => {
    setLockfile(file)
  })

  window.bridge.getRSOUserInfo((event, info) => {
    setUser(JSON.parse(info.userInfo))
  })

  window.bridge.getPlayerMMR((event, mmr) => {
    setPlayerMMR(mmr)
    setRank(Object.keys(mmr?.QueueSkills.competitive.SeasonalInfoBySeasonID).includes(mmr.LatestCompetitiveUpdate.SeasonID) ? mmr.QueueSkills.competitive.SeasonalInfoBySeasonID[mmr?.QueueSkills.competitive.SeasonalInfoBySeasonID].Rank : 0)
  })

  const getBasicProfile = () => {
    fetch(`https://api.henrikdev.xyz/valorant/v1/account/${user.acct.game_name}/${user.acct.tag_line}`).then((res) => res.json()).then((data) => {
      setCard(data.data.card.small)
      setLevel(data.data.account_level)
    })
  }

  return !lockfile ? (
    <div id="loading-container">
      <h1 id="loading-text">Waiting for Valorant to launch...</h1>
      <Spinner />
    </div>
  ) : !user || !playerMMR ? (
    <div id="loading-container">
      <h1 id="loading-text">Valorant detected, loading profile...</h1>
      <Spinner />
    </div>
  ) : (
    <div id="main-wrapper">
      <HomePlayerCard user={user} mmr={playerMMR} card={card} level={level} rank={rank} />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
