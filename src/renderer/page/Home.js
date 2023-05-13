import React from 'react'

const Home = (props) => {
  return (
    <div>{ props.lockfile && props.lockfile.password }</div>
  )
}

export default Home