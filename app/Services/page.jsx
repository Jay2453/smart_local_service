import React from 'react';
import './service.css';
import Image from 'next/image';
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Refrigerator,
  ShieldCheck
} from 'lucide-react';

export default function Service() {
  return ( 

    <div className="services">

      <h1 className="servehead" >
        Expert Services, Right at <span className='servespan'> Your Doorstep</span>
      </h1>
      <p className="subserve">
        From quick fixes to complete solutions, find trusted professionals for every need in your home.
      </p>

      <div className="cards">

        <div className="plumber cardoutlet imgmargin">

          <div className="image">
            <Image src="/images/plumber.png" alt='plumbing photo' fill
              style={{ objectFit: "cover" }} className='imgradius' />
          </div>
          <div className="info">
            <Wrench className='margintopicon'
              size={65}
              strokeWidth={1}
              color="#04B204"
            />
            <h2 className="servicename">
              Plumbing
            </h2>
            <p className='infopara'>
              Leak repairs, pipe installations, bathroom fittings & more.
            </p>
            <hr className='infobar' />
            <ul className='tasks'>
              <li>Leak Repair</li>
              <li>Pipe Installation</li>
              <li>Faucet Fitting</li>
            </ul>
          </div>

        </div>

        <div className="electrical cardoutlet imgmargin">
          <div className="image">
            <Image src="/images/electrician.png" alt='Electrical photo' fill
              style={{ objectFit: "cover" }} className='imgradius' />
          </div>
          <div className="info">
            <Zap className='margintopicon'
              size={65}
              strokeWidth={1}
              color="#04B204"
            />
            <h2 className="servicename">
              Electrical
            </h2>

            <p className="infopara">
              Wiring, fan installation, switch repair & more.
            </p>

            <hr className="infobar" />

            <ul className="tasks">
              <li>Wiring & Rewiring</li>
              <li>Light Installation</li>
              <li>Switch & Socket Repair</li>
            </ul>

          </div>
        </div>

        <div className="cardoutlet carpenter">
          <div className="image">
            <Image src="/images/carpenter.png" alt='Carpenter photo' fill
              style={{ objectFit: "cover" }} className='imgradius' />
          </div>
          <div className="info">
            <Hammer className='margintopicon'
              size={65}
              strokeWidth={1}
              color="#04B204"
            />
            <h2 className="servicename">
              Carpentry
            </h2>

            <p className="infopara">
              Furniture repair, custom woodwork, doors & windows.
            </p>

            <hr className="infobar" />

            <ul className="tasks">
              <li>Furniture Repair</li>
              <li>Wood Polishing</li>
              <li>Door Installation</li>
            </ul>

          </div>
        </div>

      </div>

      <div className="cards cards2">

        <div className="painting cardoutlet imgmargin">
          <div className="image">
            <Image src="/images/painter.png" alt='painting photo' fill
              style={{ objectFit: "cover" }} className='imgradius' />
          </div>
          <div className="info">
            <Paintbrush className='margintopicon'
              size={65}
              strokeWidth={1}
              color="#04B204"
            />
            <h2 className="servicename">
              Painting
            </h2>

            <p className="infopara">
              Interior & exterior painting with premium finishes.
            </p>

            <hr className="infobar" />

            <ul className="tasks">
              <li>Interior Painting</li>
              <li>Exterior Painting</li>
              <li>Texture & Polish</li>
            </ul>

          </div>
        </div>

        <div className="cardoutlet appliance imgmargin">
          <div className="image">
            <Image src="/images/repairs.png" alt='Appliance photo' fill
              style={{ objectFit: "cover" }} className='imgradius' />
          </div>
          <div className="info">
            <Refrigerator className='margintopicon'
              size={65}
              strokeWidth={1}
              color="#04B204"
            />
            <h2 className="servicename">
              Appliance Repair
            </h2>

            <p className="infopara">
              Fast repair service for home appliances and electronics.
            </p>

            <hr className="infobar" />

            <ul className="tasks">
              <li>Washing Machine</li>
              <li>Refrigerator</li>
              <li>Microwave & Oven</li>
            </ul>

          </div>
        </div>

        <div className="cardoutlet pest">
          <div className="image">
            <Image src="/images/pesting.png" alt='pesting photo' fill
              style={{ objectFit: "cover" }} className='imgradius' />
          </div>

          <div className="info">
            <ShieldCheck className='margintopicon'
              size={65}
              strokeWidth={1}
              color="#04B204"
            />
            <h2 className="servicename">
              Pest Control
            </h2>

            <p className="infopara">
              Safe and effective protection against household pests.
            </p>

            <hr className="infobar" />
            <ul className="tasks">
              <li>Cockroach Control</li>
              <li>Termite Treatment</li>
              <li>Rodent Control</li>
            </ul>

          </div>
        </div>

      </div>

    </div>
  )
}

