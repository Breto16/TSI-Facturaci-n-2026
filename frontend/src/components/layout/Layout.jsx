import { useRef, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

const Layout = () => {
  const navbarRef = useRef(null)
  const [navbarHeight, setNavbarHeight] = useState(60)

  useEffect(() => {
    if (navbarRef.current) {
      setNavbarHeight(navbarRef.current.offsetHeight)
    }

    const observer = new ResizeObserver(() => {
      if (navbarRef.current) {
        setNavbarHeight(navbarRef.current.offsetHeight)
      }
    })

    if (navbarRef.current) observer.observe(navbarRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ height: '100vh', overflow: 'hidden', backgroundColor: 'var(--color-background)' }}>
      <div ref={navbarRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <Navbar />
      </div>
      <div style={{
        position: 'fixed',
        top: navbarHeight,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
      }}>
        <Outlet />
      </div>
    </div>
  )
}

export default Layout