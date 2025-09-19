import React from 'react'
import { Link } from 'react-router-dom'

const Landing = () => {
  return (
    <div>Landing
      <Link to="/login">
      <button>Login</button>
      </Link>
      <Link to="/register">
      <button>Sign up</button>
      </Link>
    </div>
    
  )
}

export default Landing