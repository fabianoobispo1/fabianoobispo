import React from 'react'
import {styled} from '../../styles/index'


const Nav = styled(`div`, {
    display: 'flex',
    backgroundColor: '$primary',
    
})
const NavLink = styled(`button`, {
    display: 'flex',
    backgroundColor: '$primaryDark'
})

const Navbar = () => {
    return (
        <Nav>
            <NavLink>Menu1</NavLink>
            <NavLink>Menu2</NavLink>
            <NavLink>Menu3</NavLink>
            <NavLink>Menu4</NavLink>
        </Nav>
        
    )

}

export default Navbar