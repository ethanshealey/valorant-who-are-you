import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import { useState, useEffect } from 'react'
import Spinner from './components/Spinner';
import { encode } from "base-64"
import * as ValorantLogin from './helpers/ValorantLogin'
function Main() {

  const [ lockfile, setLockfile ] = useState(undefined)
  const [ user, setUser ] = useState(undefined)

  window.bridge.getLockfile((event, file) => {
    setLockfile(file)
    window.bridge.sendRSOUserInfo()
  })

  window.bridge.getRSOUserInfo((event, info) => {
    setUser(JSON.parse(info.userInfo))
    console.log('player info:', JSON.parse(info.userInfo))
  })

  return !lockfile ? (
    <div id="loading-container">
      <h1 id="loading-text">Waiting for Valorant to launch...</h1>
      <Spinner />
    </div>
  ) : !user ? (
    <div id="loading-container">
      <h1 id="loading-text">Waiting for user to load...</h1>
      <Spinner />
    </div>
  ) : (
    <div id="main-wrapper">
      <h1>Welcome, { user?.sub }!</h1>
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
