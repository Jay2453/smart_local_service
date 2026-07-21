"use client";
import { useState } from 'react';
import React from 'react';
import Link from 'next/link'
import './Navbar.css';
import Image from 'next/image';

const Navbar = () => {
  
  return (

    <div className='navb'>

      <Link rel="" href="/">
        <Image className='mainlogo'
          src="/images/smartserve.png"
          alt="SmartServe Logo"
          width={165}
          height={43}
        />
      </Link>

      <div className="navoptbuts">

        <ul className="nav-con">
          <li><Link rel="" href="/">Home</Link></li>
          <li><Link rel="" href="/#services">Services</Link></li>
          <li><Link rel="" href="/">How it Works</Link></li>
          <li><Link rel="" href="/#about">About Us</Link></li>
          <li><Link rel="" href="/">Contact</Link></li>
        </ul>

      </div>
    </div>
  )
}

export default Navbar
