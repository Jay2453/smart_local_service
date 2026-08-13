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
          <li><Link rel="" href="/#about">About Us</Link></li>
          <li><Link rel="" href="/Customer">Dashboard</Link></li>
          <li><Link rel="" href="">Booking History</Link></li>
        </ul>
      </div>
      <div className="profile">
        <span className="profile_name">Guest</span>
        <Image
          className="profile_logo"
          src="/images/profileLogo.jpg"
          alt="Guest profile"
          width={40}
          height={40}
        />
      </div>
    </div>
  )
}

export default Navbar
